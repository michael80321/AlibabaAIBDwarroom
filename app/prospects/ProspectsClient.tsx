'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import CustomerCard from '@/components/CustomerCard';

interface Prospect {
  id: string;
  company_name: string;
  category: string;
  region: string;
  description: string | null;
  why_alibaba: string | null;
  estimated_arr: number | null;
  website: string | null;
  contact_hint: string | null;
  headcount: string | null;
  tech_stack: string[];
  status: string;
  status_reason: string | null;
  recommended_date: Date | string;
}

interface Customer {
  id: string;
  company_name: string;
  industry: string | null;
  region: string | null;
  priority_label: string;
  priority_score: number;
  entry_points: string[];
  current_cloud: string | null;
  why_now: string | null;
  estimated_arr: number | null;
  last_contacted: Date | string | null;
}

const CATEGORIES = [
  { key: 'all', label: '全部', color: 'bg-gray-700' },
  { key: 'enterprise', label: '企業客戶', color: 'bg-blue-700' },
  { key: 'igaming', label: 'iGaming', color: 'bg-purple-700' },
  { key: 'adult', label: '成人內容', color: 'bg-pink-700' },
  { key: 'cloud_ai', label: 'Cloud / AI', color: 'bg-cyan-700' },
  { key: 'ecommerce', label: '電商', color: 'bg-orange-700' },
  { key: 'fintech', label: 'Fintech', color: 'bg-green-700' },
];

const CATEGORY_COLORS: Record<string, string> = {
  enterprise: 'bg-blue-900/50 text-blue-300 border-blue-700/50',
  igaming: 'bg-purple-900/50 text-purple-300 border-purple-700/50',
  adult: 'bg-pink-900/50 text-pink-300 border-pink-700/50',
  cloud_ai: 'bg-cyan-900/50 text-cyan-300 border-cyan-700/50',
  ecommerce: 'bg-orange-900/50 text-orange-300 border-orange-700/50',
  fintech: 'bg-green-900/50 text-green-300 border-green-700/50',
};

const CATEGORY_LABEL: Record<string, string> = {
  enterprise: '企業',
  igaming: 'iGaming',
  adult: '成人',
  cloud_ai: 'Cloud/AI',
  ecommerce: '電商',
  fintech: 'Fintech',
};

const REGIONS = ['all', 'TW', 'SEA', 'HK', 'CN', 'APAC', 'Global'];

const STATUSES = [
  { key: 'all', label: '全部' },
  { key: 'new', label: '新推薦', color: 'text-blue-400' },
  { key: 'interested', label: '有興趣', color: 'text-green-400' },
  { key: 'pipeline', label: '已進入 Pipeline', color: 'text-purple-400' },
  { key: 'hold', label: '暫緩', color: 'text-yellow-400' },
  { key: 'cant_pursue', label: '無法跟進', color: 'text-gray-500' },
];

export default function ProspectsClient({
  prospects: initialProspects,
  customers,
}: {
  prospects: Prospect[];
  customers: Customer[];
}) {
  const router = useRouter();
  const [view, setView] = useState<'recommendations' | 'tracked'>('recommendations');
  const [prospects, setProspects] = useState(initialProspects);
  const [category, setCategory] = useState('all');
  const [region, setRegion] = useState('all');
  const [status, setStatus] = useState('all');
  const [updating, setUpdating] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return prospects.filter((p) => {
      if (category !== 'all' && p.category !== category) return false;
      if (region !== 'all' && p.region !== region) return false;
      if (status !== 'all' && p.status !== status) return false;
      return true;
    });
  }, [prospects, category, region, status]);

  const stats = useMemo(() => {
    return {
      new: prospects.filter((p) => p.status === 'new').length,
      interested: prospects.filter((p) => p.status === 'interested').length,
      pipeline: prospects.filter((p) => p.status === 'pipeline').length,
      hold: prospects.filter((p) => p.status === 'hold').length,
      cant_pursue: prospects.filter((p) => p.status === 'cant_pursue').length,
    };
  }, [prospects]);

  async function updateStatus(id: string, newStatus: string) {
    setUpdating(id);
    try {
      const res = await fetch(`/api/prospects/${id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setProspects((prev) =>
          prev.map((p) => (p.id === id ? { ...p, status: newStatus } : p))
        );
        if (newStatus === 'pipeline') {
          router.refresh();
        }
      }
    } finally {
      setUpdating(null);
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-1">🎯 潛在客戶</h1>
        <p className="text-gray-500 text-sm">每日 AI 推薦新客戶名單與追蹤中客戶</p>
      </div>

      {/* View Toggle */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setView('recommendations')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            view === 'recommendations'
              ? 'bg-white text-gray-900'
              : 'bg-gray-800 text-gray-400 hover:text-white'
          }`}
        >
          📋 每日推薦名單 ({prospects.length})
        </button>
        <button
          onClick={() => setView('tracked')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            view === 'tracked'
              ? 'bg-white text-gray-900'
              : 'bg-gray-800 text-gray-400 hover:text-white'
          }`}
        >
          ✅ 已追蹤客戶 ({customers.length})
        </button>
      </div>

      {view === 'recommendations' ? (
        <>
          {/* Stats */}
          <div className="grid grid-cols-5 gap-2 mb-4">
            <div className="bg-blue-900/30 border border-blue-800/50 rounded-lg px-3 py-2">
              <div className="text-xs text-blue-300">新推薦</div>
              <div className="text-xl font-bold text-white">{stats.new}</div>
            </div>
            <div className="bg-green-900/30 border border-green-800/50 rounded-lg px-3 py-2">
              <div className="text-xs text-green-300">有興趣</div>
              <div className="text-xl font-bold text-white">{stats.interested}</div>
            </div>
            <div className="bg-purple-900/30 border border-purple-800/50 rounded-lg px-3 py-2">
              <div className="text-xs text-purple-300">已進入 Pipeline</div>
              <div className="text-xl font-bold text-white">{stats.pipeline}</div>
            </div>
            <div className="bg-yellow-900/30 border border-yellow-800/50 rounded-lg px-3 py-2">
              <div className="text-xs text-yellow-300">暫緩</div>
              <div className="text-xl font-bold text-white">{stats.hold}</div>
            </div>
            <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg px-3 py-2">
              <div className="text-xs text-gray-400">無法跟進</div>
              <div className="text-xl font-bold text-white">{stats.cant_pursue}</div>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex gap-1 mb-3 overflow-x-auto pb-1">
            {CATEGORIES.map((c) => (
              <button
                key={c.key}
                onClick={() => setCategory(c.key)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  category === c.key
                    ? 'bg-white text-gray-900'
                    : 'bg-gray-800 text-gray-400 hover:text-white'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>

          {/* Region + Status Filters */}
          <div className="flex flex-wrap gap-3 mb-4">
            <div className="flex gap-1">
              <span className="text-xs text-gray-500 self-center mr-1">地區:</span>
              {REGIONS.map((r) => (
                <button
                  key={r}
                  onClick={() => setRegion(r)}
                  className={`px-2.5 py-1 rounded-full text-xs transition-colors ${
                    region === r
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-800 text-gray-400 hover:text-white'
                  }`}
                >
                  {r === 'all' ? '全部' : r}
                </button>
              ))}
            </div>
            <div className="flex gap-1">
              <span className="text-xs text-gray-500 self-center mr-1">狀態:</span>
              {STATUSES.map((s) => (
                <button
                  key={s.key}
                  onClick={() => setStatus(s.key)}
                  className={`px-2.5 py-1 rounded-full text-xs transition-colors ${
                    status === s.key
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-800 text-gray-400 hover:text-white'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <p className="text-gray-500 text-xs mb-3">共 {filtered.length} 筆推薦</p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map((p) => (
              <ProspectCard
                key={p.id}
                prospect={p}
                updating={updating === p.id}
                onUpdate={(newStatus) => updateStatus(p.id, newStatus)}
              />
            ))}
            {filtered.length === 0 && (
              <div className="col-span-full text-center py-12 text-gray-600">
                沒有符合條件的推薦
              </div>
            )}
          </div>
        </>
      ) : (
        <>
          <p className="text-gray-500 text-xs mb-3">共 {customers.length} 筆追蹤中客戶</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {customers.map((c) => (
              <CustomerCard key={c.id} customer={c} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function ProspectCard({
  prospect,
  updating,
  onUpdate,
}: {
  prospect: Prospect;
  updating: boolean;
  onUpdate: (status: string) => void;
}) {
  const catColor = CATEGORY_COLORS[prospect.category] || 'bg-gray-800 text-gray-300';
  const catLabel = CATEGORY_LABEL[prospect.category] || prospect.category;

  const statusColorMap: Record<string, string> = {
    new: 'border-gray-800',
    interested: 'border-green-700/50 bg-green-950/10',
    pipeline: 'border-purple-700/50 bg-purple-950/10',
    hold: 'border-yellow-700/50 bg-yellow-950/10 opacity-70',
    cant_pursue: 'border-gray-800 opacity-40',
  };
  const statusBorder = statusColorMap[prospect.status] || 'border-gray-800';

  return (
    <div className={`bg-gray-900 border ${statusBorder} rounded-xl p-4 transition-all ${updating ? 'opacity-50' : ''}`}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          <h3 className="text-white font-bold text-sm truncate">{prospect.company_name}</h3>
          {prospect.website && (
            <a
              href={prospect.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-600 text-xs hover:text-gray-400"
            >
              {prospect.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
            </a>
          )}
        </div>
        <div className="flex flex-col items-end gap-1 ml-2">
          <span className={`text-xs px-1.5 py-0.5 rounded border ${catColor}`}>{catLabel}</span>
          <span className="text-xs px-1.5 py-0.5 rounded bg-gray-800 text-gray-400 border border-gray-700">
            {prospect.region}
          </span>
        </div>
      </div>

      {prospect.description && (
        <p className="text-gray-400 text-xs line-clamp-2 mb-2">{prospect.description}</p>
      )}

      {prospect.why_alibaba && (
        <div className="bg-gray-800/50 rounded-md p-2 mb-2">
          <p className="text-gray-300 text-xs line-clamp-3">💡 {prospect.why_alibaba}</p>
        </div>
      )}

      <div className="flex flex-wrap gap-1 mb-2">
        {prospect.tech_stack.slice(0, 4).map((t) => (
          <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-gray-800 text-gray-500">
            {t}
          </span>
        ))}
      </div>

      <div className="flex items-center justify-between text-xs mb-3">
        {prospect.estimated_arr && (
          <span className="text-green-400 font-semibold">
            ~${(prospect.estimated_arr / 1000).toFixed(0)}K ARR
          </span>
        )}
        {prospect.contact_hint && (
          <span className="text-gray-500 text-[10px] truncate ml-2">👤 {prospect.contact_hint}</span>
        )}
      </div>

      {prospect.status_reason && (
        <div className="text-xs text-yellow-500 mb-2 italic">備註: {prospect.status_reason}</div>
      )}

      {/* Action Buttons */}
      <div className="grid grid-cols-4 gap-1">
        <button
          disabled={updating || prospect.status === 'interested'}
          onClick={() => onUpdate('interested')}
          className={`text-xs py-1.5 rounded transition-colors ${
            prospect.status === 'interested'
              ? 'bg-green-800 text-green-200'
              : 'bg-gray-800 text-gray-400 hover:bg-green-900/50 hover:text-green-300'
          }`}
          title="標記有興趣"
        >
          ✓ 興趣
        </button>
        <button
          disabled={updating || prospect.status === 'pipeline'}
          onClick={() => onUpdate('pipeline')}
          className={`text-xs py-1.5 rounded transition-colors ${
            prospect.status === 'pipeline'
              ? 'bg-purple-800 text-purple-200'
              : 'bg-gray-800 text-gray-400 hover:bg-purple-900/50 hover:text-purple-300'
          }`}
          title="加入 Pipeline"
        >
          + Pipeline
        </button>
        <button
          disabled={updating || prospect.status === 'hold'}
          onClick={() => onUpdate('hold')}
          className={`text-xs py-1.5 rounded transition-colors ${
            prospect.status === 'hold'
              ? 'bg-yellow-800 text-yellow-200'
              : 'bg-gray-800 text-gray-400 hover:bg-yellow-900/50 hover:text-yellow-300'
          }`}
          title="暫緩跟進"
        >
          ⏸ 暫緩
        </button>
        <button
          disabled={updating || prospect.status === 'cant_pursue'}
          onClick={() => onUpdate('cant_pursue')}
          className={`text-xs py-1.5 rounded transition-colors ${
            prospect.status === 'cant_pursue'
              ? 'bg-gray-700 text-gray-300'
              : 'bg-gray-800 text-gray-400 hover:bg-red-900/50 hover:text-red-300'
          }`}
          title="無法跟進"
        >
          ✗ 無法
        </button>
      </div>
    </div>
  );
}
