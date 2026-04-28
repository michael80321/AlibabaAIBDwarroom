'use client';

import { useState } from 'react';
import type { InterventionItem } from '@prisma/client';

interface Props {
  pending: InterventionItem[];
  resolved: InterventionItem[];
}

const PRIORITY_STYLES: Record<string, string> = {
  high: 'bg-red-100 text-red-700 border border-red-300',
  medium: 'bg-yellow-100 text-yellow-700 border border-yellow-300',
  low: 'bg-blue-100 text-blue-700 border border-blue-300',
};

const PRIORITY_LABEL: Record<string, string> = {
  high: '高',
  medium: '中',
  low: '低',
};

const TYPE_LABEL: Record<string, string> = {
  approval_needed: '待批准',
  decision_needed: '待決策',
  review_needed: '待審閱',
  error: '錯誤',
};

const AGENT_LABEL: Record<string, string> = {
  prospect_developer: '開發新客',
  follow_up: '跟進助理',
  competitor_monitor: '競爭監控',
  customer_scorer: '客戶評分',
  daily_briefing: '每日簡報',
  proposal_designer: '方案設計',
  pricing_calculator: '報價計算',
};

function formatTime(d: Date | string) {
  const dt = new Date(d);
  return dt.toLocaleString('zh-TW', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
}

function ItemCard({ item, onAction }: { item: InterventionItem; onAction: (id: string, action: string) => void }) {
  const [loading, setLoading] = useState(false);
  const ctx = item.context as Record<string, unknown> | null;
  const outreachIds = ctx?.outreach_ids as string[] | undefined;

  const handle = async (action: string) => {
    setLoading(true);
    await onAction(item.id, action);
    setLoading(false);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${PRIORITY_STYLES[item.priority] ?? ''}`}>
              {PRIORITY_LABEL[item.priority] ?? item.priority}
            </span>
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
              {AGENT_LABEL[item.agent_name] ?? item.agent_name}
            </span>
            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
              {TYPE_LABEL[item.type] ?? item.type}
            </span>
            <span className="text-xs text-gray-400">{formatTime(item.created_at)}</span>
          </div>
          <p className="font-semibold text-gray-800 text-sm">{item.title}</p>
          <p className="text-gray-600 text-sm mt-1 whitespace-pre-line leading-relaxed">{item.description}</p>
          {outreachIds && outreachIds.length > 0 && (
            <a
              href="/interventions/outreach"
              className="inline-block mt-2 text-xs text-blue-600 hover:underline"
            >
              查看 {outreachIds.length} 封草稿信 →
            </a>
          )}
        </div>
        <div className="flex flex-col gap-2 shrink-0">
          {item.type === 'approval_needed' ? (
            <>
              <button
                onClick={() => handle('approve')}
                disabled={loading}
                className="text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg font-medium disabled:opacity-50"
              >
                批准
              </button>
              <button
                onClick={() => handle('reject')}
                disabled={loading}
                className="text-xs bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg font-medium disabled:opacity-50"
              >
                拒絕
              </button>
            </>
          ) : (
            <button
              onClick={() => handle('resolve')}
              disabled={loading}
              className="text-xs bg-gray-600 hover:bg-gray-700 text-white px-3 py-1.5 rounded-lg font-medium disabled:opacity-50"
            >
              已處理
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function InterventionsClient({ pending: initialPending, resolved: initialResolved }: Props) {
  const [pending, setPending] = useState(initialPending);
  const [resolved, setResolved] = useState(initialResolved);
  const [tab, setTab] = useState<'pending' | 'resolved'>('pending');

  const handleAction = async (id: string, action: string) => {
    await fetch(`/api/interventions/${id}/resolve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    });

    const item = pending.find((i) => i.id === id);
    if (item) {
      setPending((prev) => prev.filter((i) => i.id !== id));
      setResolved((prev) => [{ ...item, status: action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'resolved', resolved_at: new Date() } as InterventionItem, ...prev]);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">介入中心</h1>
        <p className="text-gray-500 text-sm mt-1">AI 員工需要你決策的事項</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6 w-fit">
        <button
          onClick={() => setTab('pending')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            tab === 'pending' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          待處理
          {pending.length > 0 && (
            <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">{pending.length}</span>
          )}
        </button>
        <button
          onClick={() => setTab('resolved')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            tab === 'resolved' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          已處理
        </button>
      </div>

      {tab === 'pending' && (
        <div className="space-y-3">
          {pending.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <div className="text-4xl mb-3">✅</div>
              <p className="font-medium">全部清空了</p>
              <p className="text-sm">AI 員工暫無需要你處理的事項</p>
            </div>
          ) : (
            pending.map((item) => (
              <ItemCard key={item.id} item={item} onAction={handleAction} />
            ))
          )}
        </div>
      )}

      {tab === 'resolved' && (
        <div className="space-y-3">
          {resolved.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <p>尚無處理記錄</p>
            </div>
          ) : (
            resolved.map((item) => (
              <div key={item.id} className="bg-gray-50 rounded-xl border border-gray-100 p-4 opacity-70">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                    {item.status === 'approved' ? '已批准' : item.status === 'rejected' ? '已拒絕' : '已解決'}
                  </span>
                  <span className="text-xs text-gray-400">{formatTime(item.resolved_at ?? item.created_at)}</span>
                </div>
                <p className="font-medium text-gray-700 text-sm">{item.title}</p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
