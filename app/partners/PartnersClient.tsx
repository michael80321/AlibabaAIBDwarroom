'use client';

import { useState, useMemo } from 'react';

interface Partner {
  id: string;
  name: string;
  type: string;
  services: string[];
  regions: string[];
  cloud_alliances: string[];
  cooperation_type: string;
  contact_info: string | null;
  notes: string | null;
}

interface PartnerProspect {
  id: string;
  name: string;
  type: string;
  region: string;
  description: string | null;
  services: string[];
  why_partner: string | null;
  cooperation_type: string | null;
  status: string;
  status_reason: string | null;
  recommended_date: Date | string;
}

const TYPES = [
  { key: 'all', label: '全部' },
  { key: 'SI', label: 'SI 系統整合商' },
  { key: 'ISV', label: 'ISV 軟體商' },
  { key: 'reseller', label: 'Reseller 經銷' },
  { key: 'technology', label: 'Technology 技術' },
  { key: 'agency', label: 'Agency 代理' },
  { key: 'MSP', label: 'MSP 託管' },
  { key: 'gpu_vendor', label: 'GPU 硬體商' },
];

const REGIONS: { key: string; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'TW', label: '台灣' },
  { key: 'HK', label: '香港' },
  { key: 'CN', label: '大陸' },
  { key: 'SG', label: '新加坡' },
  { key: 'MY', label: '馬來西亞' },
  { key: 'APAC', label: '亞太地區' },
];

const PARTNER_STATUSES = [
  { key: 'all', label: '全部' },
  { key: 'new', label: '新推薦' },
  { key: 'contacted', label: '已接觸' },
  { key: 'active', label: '已啟動合作' },
  { key: 'hold', label: '暫緩' },
  { key: 'cant_pursue', label: '無法合作' },
];

export default function PartnersClient({
  activePartners,
  prospects: initialProspects,
}: {
  activePartners: Partner[];
  prospects: PartnerProspect[];
}) {
  const [view, setView] = useState<'prospects' | 'active'>('prospects');
  const [prospects, setProspects] = useState(initialProspects);
  const [type, setType] = useState('all');
  const [region, setRegion] = useState('all');
  const [status, setStatus] = useState('all');
  const [timeRange, setTimeRange] = useState<'today' | '7d' | 'all'>('all');
  const [updating, setUpdating] = useState<string | null>(null);

  const todayCount = useMemo(() => {
    const start = new Date(); start.setHours(0, 0, 0, 0);
    return prospects.filter((p) => new Date(p.recommended_date) >= start).length;
  }, [prospects]);

  const sevenDayCount = useMemo(() => {
    const start = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    return prospects.filter((p) => new Date(p.recommended_date) >= start).length;
  }, [prospects]);

  const filtered = useMemo(() => {
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    return prospects.filter((p) => {
      if (timeRange === 'today' && new Date(p.recommended_date) < todayStart) return false;
      if (timeRange === '7d' && new Date(p.recommended_date) < sevenDaysAgo) return false;
      if (type !== 'all' && p.type !== type) return false;
      if (region !== 'all') {
        if (region === 'APAC') {
          if (!['APAC', 'SEA', 'Global'].includes(p.region)) return false;
        } else if (p.region !== region) return false;
      }
      if (status !== 'all' && p.status !== status) return false;
      return true;
    });
  }, [prospects, type, region, status, timeRange]);

  async function updateStatus(id: string, newStatus: string) {
    setUpdating(id);
    try {
      const res = await fetch(`/api/partner-prospects/${id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setProspects((prev) =>
          prev.map((p) => (p.id === id ? { ...p, status: newStatus } : p))
        );
      }
    } finally {
      setUpdating(null);
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-1">🤝 合作夥伴</h1>
        <p className="text-gray-500 text-sm">每日推薦潛在合作夥伴與已啟動合作清單</p>
      </div>

      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setView('prospects')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            view === 'prospects' ? 'bg-white text-gray-900' : 'bg-gray-800 text-gray-400 hover:text-white'
          }`}
        >
          📋 推薦名單 ({prospects.length})
        </button>
        <button
          onClick={() => setView('active')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            view === 'active' ? 'bg-white text-gray-900' : 'bg-gray-800 text-gray-400 hover:text-white'
          }`}
        >
          ✅ 已啟動合作 ({activePartners.length})
        </button>
      </div>

      {view === 'prospects' ? (
        <>
          {/* Time Range Filter */}
          <div className="flex gap-1 mb-3">
            <span className="text-xs text-gray-500 self-center mr-1">推薦時間:</span>
            {([
              { key: 'today', label: `今日 (${todayCount})` },
              { key: '7d', label: `近 7 天 (${sevenDayCount})` },
              { key: 'all', label: `全部 (${prospects.length})` },
            ] as const).map((t) => (
              <button
                key={t.key}
                onClick={() => setTimeRange(t.key)}
                className={`px-3 py-1 rounded-full text-xs transition-colors ${
                  timeRange === t.key
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:text-white'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="flex gap-1 mb-3 overflow-x-auto pb-1">
            {TYPES.map((t) => (
              <button
                key={t.key}
                onClick={() => setType(t.key)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium ${
                  type === t.key ? 'bg-white text-gray-900' : 'bg-gray-800 text-gray-400 hover:text-white'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-3 mb-4">
            <div className="flex gap-1">
              <span className="text-xs text-gray-500 self-center mr-1">地區:</span>
              {REGIONS.map((r) => (
                <button
                  key={r.key}
                  onClick={() => setRegion(r.key)}
                  className={`px-2.5 py-1 rounded-full text-xs transition-colors ${
                    region === r.key ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
            <div className="flex gap-1">
              <span className="text-xs text-gray-500 self-center mr-1">狀態:</span>
              {PARTNER_STATUSES.map((s) => (
                <button
                  key={s.key}
                  onClick={() => setStatus(s.key)}
                  className={`px-2.5 py-1 rounded-full text-xs transition-colors ${
                    status === s.key ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
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
              <PartnerProspectCard
                key={p.id}
                prospect={p}
                updating={updating === p.id}
                onUpdate={(ns) => updateStatus(p.id, ns)}
              />
            ))}
          </div>
        </>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {activePartners.map((p) => (
            <div key={p.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <h3 className="text-white font-bold text-sm mb-1">{p.name}</h3>
              <div className="flex gap-1 mb-2">
                <span className="text-xs px-1.5 py-0.5 rounded bg-blue-900/50 text-blue-300">{p.type}</span>
                {p.regions.map((r) => (
                  <span key={r} className="text-xs px-1.5 py-0.5 rounded bg-gray-800 text-gray-400">
                    {r}
                  </span>
                ))}
              </div>
              <p className="text-gray-400 text-xs mb-2">{p.notes}</p>
              <div className="flex flex-wrap gap-1 mb-2">
                {p.services.map((s) => (
                  <span key={s} className="text-[10px] px-1.5 py-0.5 rounded bg-gray-800 text-gray-500">
                    {s}
                  </span>
                ))}
              </div>
              <div className="text-xs text-gray-500">合作類型：{p.cooperation_type}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PartnerProspectCard({
  prospect,
  updating,
  onUpdate,
}: {
  prospect: PartnerProspect;
  updating: boolean;
  onUpdate: (status: string) => void;
}) {
  const statusBorderMap: Record<string, string> = {
    new: 'border-gray-800',
    contacted: 'border-blue-700/50 bg-blue-950/10',
    active: 'border-green-700/50 bg-green-950/10',
    hold: 'border-yellow-700/50 bg-yellow-950/10 opacity-70',
    cant_pursue: 'border-gray-800 opacity-40',
  };
  const border = statusBorderMap[prospect.status] || 'border-gray-800';

  return (
    <div className={`bg-gray-900 border ${border} rounded-xl p-4 transition-all ${updating ? 'opacity-50' : ''}`}>
      <div className="flex items-start justify-between mb-2">
        <h3 className="text-white font-bold text-sm truncate flex-1">{prospect.name}</h3>
        <div className="flex flex-col items-end gap-1 ml-2">
          <span className="text-xs px-1.5 py-0.5 rounded bg-blue-900/50 text-blue-300 border border-blue-700/50">
            {prospect.type}
          </span>
          <span className="text-xs px-1.5 py-0.5 rounded bg-gray-800 text-gray-400 border border-gray-700">
            {prospect.region}
          </span>
        </div>
      </div>

      {prospect.description && (
        <p className="text-gray-400 text-xs line-clamp-2 mb-2">{prospect.description}</p>
      )}

      {prospect.why_partner && (
        <div className="bg-gray-800/50 rounded-md p-2 mb-2">
          <p className="text-gray-300 text-xs line-clamp-3">💡 {prospect.why_partner}</p>
        </div>
      )}

      <div className="flex flex-wrap gap-1 mb-3">
        {prospect.services.slice(0, 4).map((s) => (
          <span key={s} className="text-[10px] px-1.5 py-0.5 rounded bg-gray-800 text-gray-500">
            {s}
          </span>
        ))}
      </div>

      {prospect.cooperation_type && (
        <div className="text-xs text-gray-500 mb-2">合作類型：{prospect.cooperation_type}</div>
      )}

      {prospect.status_reason && (
        <div className="text-xs text-yellow-500 mb-2 italic">備註: {prospect.status_reason}</div>
      )}

      <div className="grid grid-cols-4 gap-1">
        <button
          disabled={updating || prospect.status === 'contacted'}
          onClick={() => onUpdate('contacted')}
          className={`text-xs py-1.5 rounded ${
            prospect.status === 'contacted'
              ? 'bg-blue-800 text-blue-200'
              : 'bg-gray-800 text-gray-400 hover:bg-blue-900/50 hover:text-blue-300'
          }`}
        >
          ✉ 接觸
        </button>
        <button
          disabled={updating || prospect.status === 'active'}
          onClick={() => onUpdate('active')}
          className={`text-xs py-1.5 rounded ${
            prospect.status === 'active'
              ? 'bg-green-800 text-green-200'
              : 'bg-gray-800 text-gray-400 hover:bg-green-900/50 hover:text-green-300'
          }`}
        >
          ✓ 啟動
        </button>
        <button
          disabled={updating || prospect.status === 'hold'}
          onClick={() => onUpdate('hold')}
          className={`text-xs py-1.5 rounded ${
            prospect.status === 'hold'
              ? 'bg-yellow-800 text-yellow-200'
              : 'bg-gray-800 text-gray-400 hover:bg-yellow-900/50 hover:text-yellow-300'
          }`}
        >
          ⏸ 暫緩
        </button>
        <button
          disabled={updating || prospect.status === 'cant_pursue'}
          onClick={() => onUpdate('cant_pursue')}
          className={`text-xs py-1.5 rounded ${
            prospect.status === 'cant_pursue'
              ? 'bg-gray-700 text-gray-300'
              : 'bg-gray-800 text-gray-400 hover:bg-red-900/50 hover:text-red-300'
          }`}
        >
          ✗ 無法
        </button>
      </div>
    </div>
  );
}
