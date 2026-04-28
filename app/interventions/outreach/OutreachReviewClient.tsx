'use client';

import { useState } from 'react';
import type { OutreachRecord } from '@prisma/client';

interface Props {
  drafts: OutreachRecord[];
}

const SCENARIO_LABEL: Record<string, string> = {
  cold: '冷開發',
  follow_up: '跟進',
  post_incident: '事件後',
  event_followup: '活動跟進',
};

function formatDate(d: Date | string) {
  return new Date(d).toLocaleString('zh-TW', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
}

function EmailCard({ record, onApprove, onSent, onReject }: {
  record: OutreachRecord;
  onApprove: (id: string) => Promise<void>;
  onSent: (id: string) => Promise<void>;
  onReject: (id: string) => Promise<void>;
}) {
  const [lang, setLang] = useState<'zh' | 'en'>('zh');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  const subject = lang === 'zh' ? record.subject_zh : record.subject_en;
  const body = lang === 'zh' ? record.body_zh : record.body_en;

  const handleCopy = async () => {
    const text = `Subject: ${subject}\n\n${body}`;
    await navigator.clipboard.writeText(text ?? '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const wrap = async (fn: () => Promise<void>) => {
    setLoading(true);
    await fn();
    setLoading(false);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="font-semibold text-gray-900">{record.company_name}</span>
              <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                {SCENARIO_LABEL[record.scenario] ?? record.scenario}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                record.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
              }`}>
                {record.status === 'approved' ? '已批准' : '草稿'}
              </span>
            </div>
            {record.contact_name && (
              <p className="text-xs text-gray-500">收件人：{record.contact_name}{record.contact_title ? ` · ${record.contact_title}` : ''}{record.contact_email ? ` <${record.contact_email}>` : ''}</p>
            )}
            {record.notes && (
              <p className="text-xs text-gray-400 mt-0.5 italic">{record.notes}</p>
            )}
          </div>
          <span className="text-xs text-gray-400 shrink-0">{formatDate(record.created_at)}</span>
        </div>
      </div>

      <div className="p-4">
        {/* Lang toggle */}
        <div className="flex items-center gap-1 mb-3 bg-gray-100 rounded-lg p-1 w-fit">
          <button
            onClick={() => setLang('zh')}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
              lang === 'zh' ? 'bg-white shadow text-gray-900' : 'text-gray-500'
            }`}
          >
            中文
          </button>
          <button
            onClick={() => setLang('en')}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
              lang === 'en' ? 'bg-white shadow text-gray-900' : 'text-gray-500'
            }`}
          >
            English
          </button>
        </div>

        <div className="bg-gray-50 rounded-lg p-3 space-y-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Subject</p>
          <p className="text-sm font-medium text-gray-800">{subject ?? '—'}</p>
          <hr className="border-gray-200" />
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Body</p>
          <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">{body ?? '—'}</p>
        </div>

        <div className="flex items-center gap-2 mt-3 flex-wrap">
          <button
            onClick={handleCopy}
            className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg font-medium"
          >
            {copied ? '已複製 ✓' : '複製信件'}
          </button>
          {record.status === 'draft' && (
            <button
              onClick={() => wrap(() => onApprove(record.id))}
              disabled={loading}
              className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg font-medium disabled:opacity-50"
            >
              批准
            </button>
          )}
          {record.status === 'approved' && (
            <button
              onClick={() => wrap(() => onSent(record.id))}
              disabled={loading}
              className="text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg font-medium disabled:opacity-50"
            >
              標記已發送
            </button>
          )}
          <button
            onClick={() => wrap(() => onReject(record.id))}
            disabled={loading}
            className="text-xs text-red-500 hover:text-red-700 px-2 py-1.5 font-medium disabled:opacity-50"
          >
            捨棄
          </button>
        </div>
      </div>
    </div>
  );
}

export default function OutreachReviewClient({ drafts: initialDrafts }: Props) {
  const [records, setRecords] = useState(initialDrafts);
  const [filter, setFilter] = useState<'all' | 'draft' | 'approved'>('all');

  const filtered = records.filter((r) => filter === 'all' || r.status === filter);

  const handleApprove = async (id: string) => {
    await fetch(`/api/outreach/${id}/approve`, { method: 'POST' });
    setRecords((prev) => prev.map((r) => r.id === id ? { ...r, status: 'approved', approved_at: new Date() } as OutreachRecord : r));
  };

  const handleSent = async (id: string) => {
    await fetch(`/api/outreach/${id}/sent`, { method: 'POST' });
    setRecords((prev) => prev.filter((r) => r.id !== id));
  };

  const handleReject = async (id: string) => {
    await fetch(`/api/interventions/${id}/resolve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'reject' }),
    });
    setRecords((prev) => prev.filter((r) => r.id !== id));
  };

  const draftCount = records.filter((r) => r.status === 'draft').length;
  const approvedCount = records.filter((r) => r.status === 'approved').length;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-2">
        <a href="/interventions" className="text-sm text-gray-400 hover:text-gray-600">← 介入中心</a>
      </div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">AI 草稿開發信</h1>
        <p className="text-gray-500 text-sm mt-1">批准後複製發送，標記發送後自動更新客戶聯繫時間</p>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {(['all', 'draft', 'approved'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              filter === f ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {f === 'all' ? `全部 (${records.length})` : f === 'draft' ? `草稿 (${draftCount})` : `已批准 (${approvedCount})`}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <div className="text-4xl mb-3">📭</div>
          <p className="font-medium">暫無草稿</p>
          <p className="text-sm">AI 員工會在每天早上自動準備新的開發信</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((record) => (
            <EmailCard
              key={record.id}
              record={record}
              onApprove={handleApprove}
              onSent={handleSent}
              onReject={handleReject}
            />
          ))}
        </div>
      )}
    </div>
  );
}
