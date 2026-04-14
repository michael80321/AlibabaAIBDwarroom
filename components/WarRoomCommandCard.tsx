'use client';

import { useState } from 'react';
import Link from 'next/link';
import PriorityBadge from './PriorityBadge';

interface Action {
  priority: number;
  customer_id: string;
  customer_name: string;
  action: string;
  reason: string;
  opening_pitch: string;
}

interface WarRoomCommandCardProps {
  action: Action;
  priorityLabel?: string;
}

export default function WarRoomCommandCard({ action, priorityLabel = 'Attack Now' }: WarRoomCommandCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(action.opening_pitch);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const priorityColors: Record<number, string> = {
    1: 'border-red-500 bg-red-950/20',
    2: 'border-orange-500 bg-orange-950/20',
    3: 'border-yellow-500 bg-yellow-950/20',
  };

  return (
    <div className={`border rounded-xl p-4 ${priorityColors[action.priority] || 'border-gray-700 bg-gray-900'}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="w-7 h-7 rounded-full bg-gray-700 text-white text-sm font-bold flex items-center justify-center flex-shrink-0">
            {action.priority}
          </span>
          <div>
            <p className="text-white font-bold text-sm">{action.customer_name}</p>
            <PriorityBadge label={priorityLabel} />
          </div>
        </div>
      </div>

      {/* Action */}
      <p className="text-white font-semibold text-sm mb-2">{action.action}</p>

      {/* Reason */}
      <p className="text-gray-400 text-xs mb-3 italic">{action.reason}</p>

      {/* Opening Pitch */}
      <div className="bg-gray-800/50 rounded-lg p-3 mb-3">
        <p className="text-xs text-purple-400 font-semibold mb-1">✦ AI 建議話術</p>
        <p className="text-gray-200 text-xs leading-relaxed">{action.opening_pitch}</p>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={handleCopy}
          className="flex-1 text-xs py-1.5 rounded-lg bg-purple-600/30 text-purple-300 hover:bg-purple-600/50 transition-colors"
        >
          {copied ? '已複製 ✓' : '複製話術'}
        </button>
        <Link
          href={`/customers/${action.customer_id}`}
          className="flex-1 text-xs py-1.5 rounded-lg bg-gray-700/50 text-gray-300 hover:bg-gray-700 transition-colors text-center"
        >
          查看客戶
        </Link>
      </div>
    </div>
  );
}
