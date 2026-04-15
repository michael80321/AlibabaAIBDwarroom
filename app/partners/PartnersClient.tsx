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

const REGIONS = ['all', 'TW', 'SEA', 'HK', 'APAC', 'Global'];

const PARTNER_STATUSES = [
  { key: 'all', label: '全部' },
  { key: 'new', label: '新推薦' },
  { key: 'contacted', label: '已接觸' },
  { key: 'active', label: '已啟動合作' },
  { key: 'hold', label: '暫緩' },
  { key: 'cant_pursue', label: '無法合作' },
];

function isToday(date: Date | string): boolean {
  const d = new Date(date);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

// Status reason modal (shared with prospects)
function StatusReasonModal({
  name,
  targetStatus,
  onConfirm,
  onCancel,
}: {
  name: string;
  targetStatus: string;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
}) {
  const [reason, setReason] = useState('');

  const statusLabel: Record<string, string> = {
    contacted: '標記已接觸',
    active: '啟動合作',
    hold: '暫緩合作',
    cant_pursue: '無法合作',
  };

  const reasonPlaceholder: Record<string, string> = {
    hold: '例如：對方有獨家 AWS 合約、時機未到...',
    cant_pursue: '例如：直接競爭關係、公司策略不符...',
    contacted: '例如：LinkedIn 已發訊、線下活動遇到...',
    active: '例如：簽署 MOU、合作案已啟動...',
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={onCancel}>
      <div
        className="bg-gray-900 border border-gray-700 rounded-xl p-5 w-full max-w-md mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-white font-bold mb-1">{statusLabel[targetStatus] || targetStatus}</h3>
        <p className="text-gray-400 text-sm mb-3">
          <span className="text-white">{name}</span>
        </p>
        <textarea
          autoFocus
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder={reasonPlaceholder[targetStatus] || '備註原因（選填）'}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 resize-none focus:outline-none focus:border-gray-500"
          rows={3}
        />
        <div className="flex gap-2 mt-3">
          <button
            onClick={() => onConfirm(reason)}
            className="flex-1 py-2 rounded-lg bg-white text-gray-900 text-sm font-medium hover:bg-gray-200 transition-colors"
          >
            確認
          </button>
          <button
            onClick={onCancel}
            className="flex-1 py-2 rounded-lg bg-gray-800 text-gray-400 text-sm hover:text-white transition-colors"
          >
            取消
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PartnersClient({
  activePartners,
  prospects: initialProspects,
  todayCount,
}: {
  activePartners: Partner[];
  prospects: PartnerProspect[];
  todayCount: number;
}) {
  const [view, setView] = useState<'prospects' | 'active'>('prospects');
  const [prospects, setProspects] = useState(initialProspects);
  const [type, setType] = useState('all');
  const [region, setRegion] = useState('all');
  const [status, setStatus] = useState('all');
  const [dateFilter, setDateFilter] = useState<'today' | 'week' | 'all'>('today');
  const [updating, setUpdating] = useState<string | null>(null);
  const [modal, setModal] = useState<{ id: string; name: string; targetStatus: string } | null>(null);

  const filtered = useMemo(() => {
    const now = new Date();
    return prospects.filter((p) => {
      if (type !== 'all' && p.type !== type) return false;
      if (region !== 'all' && p.region !== region) return false;
      if (status !== 'all' && p.status !== status) return false;
      if (dateFilter === 'today') {
        if (!isToday(p.recommended_date)) return false;
      } else if (dateFilter === 'week') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        if (new Date(p.recommended_date) < weekAgo) return false;
      }
      return true;
    });
  }, [prospects, type, region, status, dateFilter]);

  const stats = useMemo(() => ({
    new: prospects.filter((p) => p.status === 'new').length,
    contacted: prospects.filter((p) => p.status === 'contacted').length,
    active: prospects.filter((p) => p.status === 'active').length,
    hold: prospects.filter((p) => p.status === 'hold').length,
    cant_pursue: prospects.filter((p) => p.status === 'cant_pursue').length,
  }), [prospects]);

  function requestUpdate(id: string, name: string, newStatus: string) {
    setModal({ id, name, targetStatus: newStatus });
  }

  async function confirmUpdate(reason: string) {
    if (!modal) return;
    const { id, targetStatus } = modal;
    setModal(null);
    setUpdating(id);
    try {
      const res = await fetch(`/api/partner-prospects/${id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: targetStatus, reason }),
      });
      if (res.ok) {
        setProspects((prev) =>
          prev.map((p) =>
            p.id === id ? { ...p, status: targetStatus, status_reason: reason || p.status_reason } : p
          )
        );
      }
    } finally {
      setUpdating(null);
    }
  }

  return (
    <div>
      {modal && (
        <StatusReasonModal
          name={modal.name}
          targetStatus={modal.targetStatus}
          onConfirm={confirmUpdate}
          onCancel={() => setModal(null)}
        />
      )}

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
          {todayCount > 0 && (
            <span className="ml-2 px-1.5 py-0.5 rounded-full bg-blue-600 text-white text-xs">
              今日 +{todayCount}
            </span>
          )}
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
          {/* Stats */}
          <div className="grid grid-cols-5 gap-2 mb-4">
            <div className="bg-blue-900/30 border border-blue-800/50 rounded-lg px-3 py-2">
              <div className="text-xs text-blue-300">新推薦</div>
              <div className="text-xl font-bold text-white">{stats.new}</div>
            </div>
            <div className="bg-cyan-900/30 border border-cyan-800/50 rounded-lg px-3 py-2">
              <div className="text-xs text-cyan-300">已接觸</div>
              <div className="text-xl font-bold text-white">{stats.contacted}</div>
            </div>
            <div className="bg-green-900/30 border border-green-800/50 rounded-lg px-3 py-2">
              <div className="text-xs text-green-300">已啟動</div>
              <div className="text-xl font-bold text-white">{stats.active}</div>
            </div>
            <div className="bg-yellow-900/30 border border-yellow-800/50 rounded-lg px-3 py-2">
              <div className="text-xs text-yellow-300">暫緩</div>
              <div className="text-xl font-bold text-white">{stats.hold}</div>
            </div>
            <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg px-3 py-2">
              <div className="text-xs text-gray-400">無法合作</div>
              <div className="text-xl font-bold text-white">{stats.cant_pursue}</div>
            </div>
          </div>

          {/* Date Filter */}
          <div className="flex gap-2 mb-3">
            <span className="text-xs text-gray-500 self-center">推薦時間:</span>
            {(['today', 'week', 'all'] as const).map((d) => (
              <button
                key={d}
                onClick={() => setDateFilter(d)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  dateFilter === d ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
                }`}
              >
                {d === 'today' ? `今日 (${todayCount})` : d === 'week' ? '近 7 天' : '全部'}
              </button>
            ))}
          </div>

          {/* Type Tabs */}
          <div className="flex gap-1 mb-3 overflow-x-auto pb-1">
            {TYPES.map((t) => (
              <button
                key={t.key}
                onClick={() => setType(t.key)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  type === t.key ? 'bg-white text-gray-900' : 'bg-gray-800 text-gray-400 hover:text-white'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Region + Status Filters */}
          <div className="flex flex-wrap gap-3 mb-4">
            <div className="flex gap-1">
              <span className="text-xs text-gray-500 self-center mr-1">地區:</span>
              {REGIONS.map((r) => (
                <button key={r} onClick={() => setRegion(r)}
                  className={`px-2.5 py-1 rounded-full text-xs transition-colors ${
                    region === r ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
                  }`}>
                  {r === 'all' ? '全部' : r}
                </button>
              ))}
            </div>
            <div className="flex gap-1">
              <span className="text-xs text-gray-500 self-center mr-1">狀態:</span>
              {PARTNER_STATUSES.map((s) => (
                <button key={s.key} onClick={() => setStatus(s.key)}
                  className={`px-2.5 py-1 rounded-full text-xs transition-colors ${
                    status === s.key ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
                  }`}>
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
                onUpdate={(ns) => requestUpdate(p.id, p.name, ns)}
              />
            ))}
            {filtered.length === 0 && (
              <div className="col-span-full text-center py-12 text-gray-600">
                {dateFilter === 'today'
                  ? '今日尚無新推薦，請切換到「近 7 天」或「全部」查看'
                  : '沒有符合條件的推薦'}
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {activePartners.map((p) => (
            <div key={p.id} className="bg-gray-900 border border-green-800/40 rounded-xl p-4">
              <h3 className="text-white font-bold text-sm mb-1">{p.name}</h3>
              <div className="flex gap-1 mb-2">
                <span className="text-xs px-1.5 py-0.5 rounded bg-blue-900/50 text-blue-300">{p.type}</span>
                {p.regions.map((r) => (
                  <span key={r} className="text-xs px-1.5 py-0.5 rounded bg-gray-800 text-gray-400">{r}</span>
                ))}
              </div>
              {p.notes && <p className="text-gray-400 text-xs mb-2 line-clamp-2">{p.notes}</p>}
              <div className="flex flex-wrap gap-1 mb-2">
                {p.services.map((s) => (
                  <span key={s} className="text-[10px] px-1.5 py-0.5 rounded bg-gray-800 text-gray-500">{s}</span>
                ))}
              </div>
              <div className="text-xs text-green-400">合作類型：{p.cooperation_type}</div>
              {p.contact_info && (
                <div className="text-xs text-gray-500 mt-1">聯絡：{p.contact_info}</div>
              )}
            </div>
          ))}
          {activePartners.length === 0 && (
            <div className="col-span-full text-center py-12 text-gray-600">
              尚無已啟動合作夥伴，在推薦名單中標記「啟動」即可轉入
            </div>
          )}
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
  const todayBadge = isToday(prospect.recommended_date);

  return (
    <div className={`bg-gray-900 border ${border} rounded-xl p-4 transition-all ${updating ? 'opacity-50' : ''}`}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <h3 className="text-white font-bold text-sm truncate">{prospect.name}</h3>
            {todayBadge && (
              <span className="flex-shrink-0 text-[10px] px-1 py-0.5 rounded bg-blue-600/80 text-blue-100">
                今日新
              </span>
            )}
          </div>
        </div>
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
          <span key={s} className="text-[10px] px-1.5 py-0.5 rounded bg-gray-800 text-gray-500">{s}</span>
        ))}
      </div>

      {prospect.cooperation_type && (
        <div className="text-xs text-gray-500 mb-2">合作類型：{prospect.cooperation_type}</div>
      )}

      {prospect.status_reason && (
        <div className="text-xs text-yellow-500 mb-2 italic truncate" title={prospect.status_reason}>
          備註: {prospect.status_reason}
        </div>
      )}

      <div className="grid grid-cols-4 gap-1">
        <button disabled={updating || prospect.status === 'contacted'} onClick={() => onUpdate('contacted')}
          className={`text-xs py-1.5 rounded transition-colors ${
            prospect.status === 'contacted' ? 'bg-blue-800 text-blue-200'
            : 'bg-gray-800 text-gray-400 hover:bg-blue-900/50 hover:text-blue-300'
          }`}>
          ✉ 接觸
        </button>
        <button disabled={updating || prospect.status === 'active'} onClick={() => onUpdate('active')}
          className={`text-xs py-1.5 rounded transition-colors ${
            prospect.status === 'active' ? 'bg-green-800 text-green-200'
            : 'bg-gray-800 text-gray-400 hover:bg-green-900/50 hover:text-green-300'
          }`}>
          ✓ 啟動
        </button>
        <button disabled={updating || prospect.status === 'hold'} onClick={() => onUpdate('hold')}
          className={`text-xs py-1.5 rounded transition-colors ${
            prospect.status === 'hold' ? 'bg-yellow-800 text-yellow-200'
            : 'bg-gray-800 text-gray-400 hover:bg-yellow-900/50 hover:text-yellow-300'
          }`}>
          ⏸ 暫緩
        </button>
        <button disabled={updating || prospect.status === 'cant_pursue'} onClick={() => onUpdate('cant_pursue')}
          className={`text-xs py-1.5 rounded transition-colors ${
            prospect.status === 'cant_pursue' ? 'bg-gray-700 text-gray-300'
            : 'bg-gray-800 text-gray-400 hover:bg-red-900/50 hover:text-red-300'
          }`}>
          ✗ 無法
        </button>
      </div>
    </div>
  );
}
