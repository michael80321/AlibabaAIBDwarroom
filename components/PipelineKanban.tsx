'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';

interface PipelineItem {
  id: string;
  stage: string;
  entered_at: string | Date;
  expected_close?: string | Date | null;
  deal_value?: number | null;
  blockers?: string | null;
  risk_level: string;
  next_action?: string | null;
  customer: {
    id: string;
    company_name: string;
    priority_label: string;
  };
}

interface PipelineKanbanProps {
  items: PipelineItem[];
}

const STAGES = [
  { key: 'lead', label: 'Lead', color: 'border-gray-600' },
  { key: 'meeting', label: 'Meeting', color: 'border-blue-600' },
  { key: 'poc', label: 'POC', color: 'border-purple-600' },
  { key: 'proposal', label: 'Proposal', color: 'border-yellow-600' },
  { key: 'negotiation', label: 'Negotiation', color: 'border-orange-600' },
  { key: 'close', label: 'Close', color: 'border-green-600' },
  { key: 'hold', label: '⏸ 暫緩跟進', color: 'border-yellow-800' },
];

const RISK_COLORS: Record<string, string> = {
  high: 'text-red-400 bg-red-900/30',
  medium: 'text-yellow-400 bg-yellow-900/30',
  low: 'text-green-400 bg-green-900/30',
};

function getDaysStuck(enteredAt: string | Date): number {
  return Math.floor((Date.now() - new Date(enteredAt).getTime()) / (1000 * 60 * 60 * 24));
}

export default function PipelineKanban({ items: initialItems }: PipelineKanbanProps) {
  const [items, setItems] = useState(initialItems);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);
  const draggingId = useRef<string | null>(null);

  const grouped = STAGES.reduce(
    (acc, stage) => {
      acc[stage.key] = items.filter((i) => i.stage === stage.key);
      return acc;
    },
    {} as Record<string, PipelineItem[]>
  );

  const totalValue = items.reduce((sum, i) => sum + (i.deal_value || 0), 0);
  const stuckCount = items.filter((i) => getDaysStuck(i.entered_at) > 14).length;

  const handleDragStart = (e: React.DragEvent, itemId: string) => {
    draggingId.current = itemId;
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, stageKey: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverStage(stageKey);
  };

  const handleDrop = async (e: React.DragEvent, newStage: string) => {
    e.preventDefault();
    setDragOverStage(null);
    const id = draggingId.current;
    if (!id) return;

    const item = items.find((i) => i.id === id);
    if (!item || item.stage === newStage) return;

    // Optimistic update
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, stage: newStage } : i))
    );

    try {
      const res = await fetch(`/api/pipeline/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: newStage }),
      });
      if (!res.ok) throw new Error();
    } catch {
      // Revert on failure
      setItems((prev) =>
        prev.map((i) => (i.id === id ? { ...i, stage: item.stage } : i))
      );
    }
  };

  const handleDragEnd = () => {
    draggingId.current = null;
    setDragOverStage(null);
  };

  return (
    <div>
      {/* Summary Bar */}
      <div className="flex gap-6 mb-4 p-3 bg-gray-900 rounded-xl">
        <div className="text-center">
          <p className="text-gray-500 text-xs">Pipeline 總金額</p>
          <p className="text-white font-bold">${(totalValue / 1000).toFixed(0)}K</p>
        </div>
        <div className="text-center">
          <p className="text-gray-500 text-xs">卡關件數</p>
          <p className="text-yellow-400 font-bold">{stuckCount}</p>
        </div>
        <div className="text-center">
          <p className="text-gray-500 text-xs">總商機數</p>
          <p className="text-white font-bold">{items.length}</p>
        </div>
        <p className="text-gray-600 text-xs self-center ml-auto">拖拉卡片可換階段</p>
      </div>

      {/* Kanban */}
      <div className="flex gap-3 overflow-x-auto pb-4">
        {STAGES.map((stage) => {
          const stageItems = grouped[stage.key] || [];
          const stageValue = stageItems.reduce((sum, i) => sum + (i.deal_value || 0), 0);
          const isOver = dragOverStage === stage.key;

          return (
            <div
              key={stage.key}
              className={`flex-shrink-0 w-56 bg-gray-900 rounded-xl border-t-2 ${stage.color} transition-colors ${isOver ? 'ring-1 ring-blue-500 bg-gray-800' : ''}`}
              onDragOver={(e) => handleDragOver(e, stage.key)}
              onDragLeave={() => setDragOverStage(null)}
              onDrop={(e) => handleDrop(e, stage.key)}
            >
              {/* Column Header */}
              <div className="p-3 border-b border-gray-800">
                <p className="text-white font-semibold text-sm">{stage.label}</p>
                <div className="flex gap-2 text-xs text-gray-500">
                  <span>{stageItems.length} 件</span>
                  {stageValue > 0 && <span>${(stageValue / 1000).toFixed(0)}K</span>}
                </div>
              </div>

              {/* Cards */}
              <div className="p-2 space-y-2 min-h-[200px]">
                {stageItems.map((item) => {
                  const days = getDaysStuck(item.entered_at);
                  const daysColor =
                    days > 30 ? 'text-red-400' : days > 14 ? 'text-yellow-400' : 'text-gray-500';

                  return (
                    <div
                      key={item.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, item.id)}
                      onDragEnd={handleDragEnd}
                      className={`bg-gray-800 rounded-lg p-3 cursor-grab active:cursor-grabbing hover:bg-gray-750 transition-colors select-none ${
                        selectedItem === item.id ? 'ring-1 ring-blue-500' : ''
                      }`}
                      onClick={() => setSelectedItem(selectedItem === item.id ? null : item.id)}
                    >
                      <p className="text-white text-xs font-semibold mb-1">{item.customer.company_name}</p>

                      {item.deal_value && (
                        <p className="text-green-400 text-xs font-medium mb-1">
                          ${(item.deal_value / 1000).toFixed(0)}K
                        </p>
                      )}

                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-xs ${daysColor}`}>{days}天</span>
                        <span className={`text-xs px-1.5 py-0.5 rounded ${RISK_COLORS[item.risk_level]}`}>
                          {item.risk_level}
                        </span>
                      </div>

                      {item.next_action && (
                        <p className="text-gray-400 text-xs truncate">{item.next_action}</p>
                      )}

                      {item.blockers && (
                        <p className="text-red-400 text-xs mt-1 truncate">⚠ {item.blockers}</p>
                      )}

                      {selectedItem === item.id && (
                        <Link
                          href={`/customers/${item.customer.id}`}
                          className="block mt-2 text-xs text-center text-blue-400 hover:text-blue-300"
                        >
                          查看客戶 →
                        </Link>
                      )}
                    </div>
                  );
                })}

                {stageItems.length === 0 && (
                  <div className={`flex items-center justify-center h-20 text-xs transition-colors ${isOver ? 'text-blue-400' : 'text-gray-700'}`}>
                    {isOver ? '放開以移入' : '沒有商機'}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
