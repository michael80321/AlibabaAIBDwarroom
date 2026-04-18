'use client';

import { useState } from 'react';
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

const STAGE_KEYS = STAGES.map((s) => s.key);

const RISK_COLORS: Record<string, string> = {
  high: 'text-red-400 bg-red-900/30',
  medium: 'text-yellow-400 bg-yellow-900/30',
  low: 'text-green-400 bg-green-900/30',
};

function getDaysStuck(enteredAt: string | Date): number {
  return Math.floor((Date.now() - new Date(enteredAt).getTime()) / (1000 * 60 * 60 * 24));
}

interface EditState {
  next_action: string;
  blockers: string;
  risk_level: string;
  deal_value: string;
}

export default function PipelineKanban({ items: initialItems }: PipelineKanbanProps) {
  const [items, setItems] = useState(initialItems);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [editState, setEditState] = useState<EditState | null>(null);
  const [saving, setSaving] = useState(false);

  const grouped = STAGES.reduce(
    (acc, stage) => {
      acc[stage.key] = items.filter((i) => i.stage === stage.key);
      return acc;
    },
    {} as Record<string, PipelineItem[]>
  );

  const totalValue = items.reduce((sum, i) => sum + (i.deal_value || 0), 0);
  const stuckCount = items.filter((i) => getDaysStuck(i.entered_at) > 14).length;

  const selectCard = (item: PipelineItem) => {
    if (selectedItem === item.id) {
      setSelectedItem(null);
      setEditState(null);
      return;
    }
    setSelectedItem(item.id);
    setEditState({
      next_action: item.next_action || '',
      blockers: item.blockers || '',
      risk_level: item.risk_level || 'medium',
      deal_value: item.deal_value ? String(item.deal_value) : '',
    });
  };

  const moveStage = async (item: PipelineItem, direction: 'prev' | 'next') => {
    const idx = STAGE_KEYS.indexOf(item.stage);
    // hold is only reachable from the hold column itself or forward
    const newIdx = direction === 'next'
      ? Math.min(idx + 1, STAGE_KEYS.length - 1)
      : Math.max(idx - 1, 0);
    if (newIdx === idx) return;
    const newStage = STAGE_KEYS[newIdx];
    await saveItem(item.id, { stage: newStage });
  };

  const saveItem = async (id: string, patch: Record<string, unknown>) => {
    setSaving(true);
    try {
      const item = items.find((i) => i.id === id);
      if (!item) return;
      const payload = editState
        ? {
            stage: item.stage,
            next_action: editState.next_action || null,
            blockers: editState.blockers || null,
            risk_level: editState.risk_level,
            deal_value: editState.deal_value ? parseInt(editState.deal_value) : null,
            ...patch,
          }
        : { stage: item.stage, ...patch };

      const res = await fetch(`/api/pipeline/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...updated } : i)));
      if (patch.stage) {
        setSelectedItem(null);
        setEditState(null);
      }
    } catch {
      alert('儲存失敗');
    } finally {
      setSaving(false);
    }
  };

  const handleSave = (id: string) => {
    saveItem(id, {}).then(() => {
      setSelectedItem(null);
      setEditState(null);
    });
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
      </div>

      {/* Kanban */}
      <div className="flex gap-3 overflow-x-auto pb-4">
        {STAGES.map((stage) => {
          const stageItems = grouped[stage.key] || [];
          const stageValue = stageItems.reduce((sum, i) => sum + (i.deal_value || 0), 0);

          return (
            <div key={stage.key} className={`flex-shrink-0 w-60 bg-gray-900 rounded-xl border-t-2 ${stage.color}`}>
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
                  const isSelected = selectedItem === item.id;
                  const stageIdx = STAGE_KEYS.indexOf(item.stage);
                  const canGoPrev = stageIdx > 0;
                  const canGoNext = stageIdx < STAGE_KEYS.length - 1;

                  return (
                    <div
                      key={item.id}
                      className={`bg-gray-800 rounded-lg p-3 transition-colors ${
                        isSelected ? 'ring-1 ring-blue-500' : 'cursor-pointer hover:bg-gray-750'
                      }`}
                      onClick={() => !isSelected && selectCard(item)}
                    >
                      <p className="text-white text-xs font-semibold mb-1">{item.customer.company_name}</p>

                      {!isSelected && (
                        <>
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
                        </>
                      )}

                      {isSelected && editState && (
                        <div onClick={(e) => e.stopPropagation()}>
                          {/* Stage move */}
                          <div className="flex items-center justify-between mb-2">
                            <button
                              disabled={!canGoPrev || saving}
                              onClick={() => moveStage(item, 'prev')}
                              className="px-2 py-0.5 rounded text-xs bg-gray-700 text-gray-300 hover:bg-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              ← 上一階段
                            </button>
                            <span className="text-xs text-gray-400">{stage.label}</span>
                            <button
                              disabled={!canGoNext || saving}
                              onClick={() => moveStage(item, 'next')}
                              className="px-2 py-0.5 rounded text-xs bg-gray-700 text-gray-300 hover:bg-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              下一階段 →
                            </button>
                          </div>

                          {/* Deal Value */}
                          <div className="mb-2">
                            <label className="text-gray-500 text-xs">商機金額 (USD)</label>
                            <input
                              type="number"
                              value={editState.deal_value}
                              onChange={(e) => setEditState({ ...editState, deal_value: e.target.value })}
                              placeholder="e.g. 120000"
                              className="w-full mt-0.5 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-xs outline-none focus:border-blue-500 placeholder-gray-600"
                            />
                          </div>

                          {/* Risk Level */}
                          <div className="mb-2">
                            <label className="text-gray-500 text-xs">風險等級</label>
                            <select
                              value={editState.risk_level}
                              onChange={(e) => setEditState({ ...editState, risk_level: e.target.value })}
                              className="w-full mt-0.5 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-xs outline-none"
                            >
                              <option value="low">Low</option>
                              <option value="medium">Medium</option>
                              <option value="high">High</option>
                            </select>
                          </div>

                          {/* Next Action */}
                          <div className="mb-2">
                            <label className="text-gray-500 text-xs">下一步行動</label>
                            <input
                              type="text"
                              value={editState.next_action}
                              onChange={(e) => setEditState({ ...editState, next_action: e.target.value })}
                              placeholder="下一步..."
                              className="w-full mt-0.5 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-xs outline-none focus:border-blue-500 placeholder-gray-600"
                            />
                          </div>

                          {/* Blockers */}
                          <div className="mb-3">
                            <label className="text-gray-500 text-xs">卡關原因</label>
                            <input
                              type="text"
                              value={editState.blockers}
                              onChange={(e) => setEditState({ ...editState, blockers: e.target.value })}
                              placeholder="卡關原因..."
                              className="w-full mt-0.5 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-xs outline-none focus:border-red-500 placeholder-gray-600"
                            />
                          </div>

                          <div className="flex gap-1.5">
                            <button
                              disabled={saving}
                              onClick={() => handleSave(item.id)}
                              className="flex-1 py-1.5 rounded bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-medium transition-colors"
                            >
                              {saving ? '...' : '儲存'}
                            </button>
                            <Link
                              href={`/customers/${item.customer.id}`}
                              className="flex-1 py-1.5 rounded bg-gray-700 hover:bg-gray-600 text-center text-gray-300 text-xs transition-colors"
                            >
                              查看客戶 →
                            </Link>
                            <button
                              onClick={() => { setSelectedItem(null); setEditState(null); }}
                              className="px-2 py-1.5 rounded bg-gray-700 hover:bg-gray-600 text-gray-400 text-xs transition-colors"
                            >
                              ×
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

                {stageItems.length === 0 && (
                  <div className="flex items-center justify-center h-20 text-gray-700 text-xs">
                    沒有商機
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
