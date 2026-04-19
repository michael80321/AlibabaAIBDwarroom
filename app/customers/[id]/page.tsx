'use client';

import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import PriorityBadge from '@/components/PriorityBadge';
import EditCustomerModal from '@/components/EditCustomerModal';
import Link from 'next/link';

const STAGE_ORDER = ['lead', 'meeting', 'poc', 'proposal', 'negotiation', 'close'];
const STAGE_LABELS: Record<string, string> = {
  lead: 'Lead',
  meeting: 'Meeting',
  poc: 'POC',
  proposal: 'Proposal',
  negotiation: 'Negotiation',
  close: 'Close',
};

const INFLUENCE_LABELS: Record<string, string> = {
  decision_maker: '決策者',
  champion: '倡導者',
  user: '使用者',
  blocker: '阻礙者',
  unknown: '未知',
};

const ENTRY_POINT_COLORS: Record<string, string> = {
  AI: 'bg-purple-900/50 text-purple-300',
  GPU: 'bg-violet-900/50 text-violet-300',
  CDN: 'bg-blue-900/50 text-blue-300',
  Global: 'bg-green-900/50 text-green-300',
  China: 'bg-red-900/50 text-red-300',
  'China Access': 'bg-red-900/50 text-red-300',
  Cost: 'bg-yellow-900/50 text-yellow-300',
  SEA: 'bg-teal-900/50 text-teal-300',
};

interface Customer {
  id: string;
  company_name: string;
  industry?: string | null;
  region?: string | null;
  company_size?: string | null;
  website?: string | null;
  current_cloud?: string | null;
  priority_label: string;
  priority_score: number;
  entry_points: string[];
  estimated_arr?: number | null;
  why_now?: string | null;
  opening_pitch?: string | null;
  pain_points: string[];
  tech_stack: string[];
  last_contacted?: string | null;
  contacts: Array<{
    id: string;
    name: string;
    title?: string | null;
    email?: string | null;
    linkedin_url?: string | null;
    influence: string;
    notes?: string | null;
  }>;
  pipeline_stages: Array<{
    id: string;
    stage: string;
    entered_at: string;
    expected_close?: string | null;
    deal_value?: number | null;
    blockers?: string | null;
    risk_level: string;
    next_action?: string | null;
    next_action_due?: string | null;
    notes?: string | null;
  }>;
  meeting_notes: Array<{
    id: string;
    meeting_date: string;
    raw_notes: string;
    summary?: string | null;
    pain_points?: string | null;
    updated_pitch?: string | null;
  }>;
  score_breakdown?: {
    total_score: number;
    ai_reason?: string | null;
  } | null;
}

export default function CustomerDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  useEffect(() => {
    fetch(`/api/customers/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setCustomer(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  const handleCopyPitch = () => {
    if (!customer?.opening_pitch) return;
    navigator.clipboard.writeText(customer.opening_pitch);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-gray-500 animate-pulse">載入中...</p>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">找不到客戶</p>
        <Link href="/prospects" className="text-blue-400 hover:text-blue-300 text-sm mt-2 block">
          返回客戶列表
        </Link>
      </div>
    );
  }

  const currentPipeline = customer.pipeline_stages[0];
  const currentStageIndex = currentPipeline ? STAGE_ORDER.indexOf(currentPipeline.stage) : -1;
  const daysSinceEntry = currentPipeline
    ? Math.floor((Date.now() - new Date(currentPipeline.entered_at).getTime()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div className="max-w-5xl mx-auto">
      {editOpen && (
        <EditCustomerModal
          customer={customer}
          onClose={() => setEditOpen(false)}
          onSaved={(updated) => {
            setCustomer((prev) => prev ? { ...prev, ...updated } : prev);
            setEditOpen(false);
          }}
        />
      )}
      {/* Back button */}
      <Link href="/prospects" className="text-gray-500 hover:text-gray-300 text-sm mb-4 block">
        ← 返回客戶列表
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-3xl font-bold text-white">{customer.company_name}</h1>
            <PriorityBadge label={customer.priority_label} size="md" />
          </div>
          <p className="text-gray-500">
            {customer.industry} · {customer.region}
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/meetings"
            className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium transition-colors"
          >
            + 新增會議記錄
          </Link>
          <button
            onClick={() => setEditOpen(true)}
            className="px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm transition-colors"
          >
            編輯資料
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Left: Basic Info + War Room */}
        <div className="col-span-2 space-y-4">
          {/* War Room Card */}
          <div className="bg-amber-950/30 border border-amber-700/50 rounded-xl p-5">
            <h2 className="text-amber-400 font-bold text-lg mb-3">⚔️ 作戰資訊</h2>

            {customer.why_now && (
              <div className="mb-3">
                <p className="text-amber-500 text-xs font-semibold mb-1">為什麼是現在</p>
                <p className="text-amber-100">{customer.why_now}</p>
              </div>
            )}

            {customer.estimated_arr && (
              <div className="mb-3">
                <p className="text-amber-500 text-xs font-semibold mb-1">預估年合約金額</p>
                <p className="text-2xl font-bold text-amber-300">
                  ${(customer.estimated_arr / 1000).toFixed(0)}K ARR
                </p>
              </div>
            )}

            {customer.opening_pitch && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-amber-500 text-xs font-semibold">建議開場白</p>
                  <button
                    onClick={handleCopyPitch}
                    className="text-xs px-3 py-1 rounded-lg bg-amber-600/30 text-amber-300 hover:bg-amber-600/50 transition-colors"
                  >
                    {copied ? '已複製 ✓' : '一鍵複製'}
                  </button>
                </div>
                <p className="text-amber-100 text-base leading-relaxed bg-amber-900/20 rounded-lg p-3">
                  {customer.opening_pitch}
                </p>
              </div>
            )}
          </div>

          {/* Basic Info */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h2 className="text-white font-bold text-lg mb-3">基本資訊</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-gray-500 text-xs">目前使用雲</p>
                <p className="text-white font-medium">{customer.current_cloud || '未知'}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs">公司規模</p>
                <p className="text-white font-medium">{customer.company_size || '未知'}</p>
              </div>
              {customer.website && (
                <div>
                  <p className="text-gray-500 text-xs">官網</p>
                  <a href={customer.website} target="_blank" rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 text-sm">
                    {customer.website}
                  </a>
                </div>
              )}
              {customer.last_contacted && (
                <div>
                  <p className="text-gray-500 text-xs">最後聯絡</p>
                  <p className="text-white text-sm">
                    {format(new Date(customer.last_contacted), 'yyyy/MM/dd', { locale: zhTW })}
                  </p>
                </div>
              )}
            </div>

            {/* Entry Points */}
            <div className="mt-3">
              <p className="text-gray-500 text-xs mb-1">切入點</p>
              <div className="flex flex-wrap gap-1">
                {customer.entry_points.map((ep) => (
                  <span key={ep} className={`text-xs px-2 py-0.5 rounded-full ${ENTRY_POINT_COLORS[ep] || 'bg-gray-700 text-gray-300'}`}>
                    {ep}
                  </span>
                ))}
              </div>
            </div>

            {/* Pain Points */}
            {customer.pain_points.length > 0 && (
              <div className="mt-3">
                <p className="text-gray-500 text-xs mb-1">痛點</p>
                <div className="flex flex-wrap gap-1">
                  {customer.pain_points.map((p) => (
                    <span key={p} className="text-xs px-2 py-0.5 rounded bg-red-900/30 text-red-300">
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Tech Stack */}
            {customer.tech_stack.length > 0 && (
              <div className="mt-3">
                <p className="text-gray-500 text-xs mb-1">技術棧</p>
                <div className="flex flex-wrap gap-1">
                  {customer.tech_stack.map((t) => (
                    <span key={t} className="text-xs px-2 py-0.5 rounded bg-gray-800 text-gray-400">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Pipeline Progress */}
          {currentPipeline && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <h2 className="text-white font-bold text-lg mb-3">Pipeline 進度</h2>

              {/* Stage Progress Bar */}
              <div className="flex items-center gap-1 mb-4">
                {STAGE_ORDER.map((stage, i) => (
                  <div key={stage} className="flex items-center flex-1">
                    <div className={`flex-1 h-1.5 rounded-full ${
                      i <= currentStageIndex ? 'bg-blue-500' : 'bg-gray-700'
                    }`} />
                    {i === STAGE_ORDER.length - 1 && (
                      <div className={`w-3 h-3 rounded-full ml-1 ${
                        i <= currentStageIndex ? 'bg-green-500' : 'bg-gray-700'
                      }`} />
                    )}
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-xs text-gray-600 mb-4">
                {STAGE_ORDER.map((stage) => (
                  <span key={stage} className={currentPipeline.stage === stage ? 'text-blue-400 font-semibold' : ''}>
                    {STAGE_LABELS[stage]}
                  </span>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-gray-500 text-xs">當前階段</p>
                  <p className="text-white font-bold">{STAGE_LABELS[currentPipeline.stage]}</p>
                </div>
                {daysSinceEntry !== null && (
                  <div>
                    <p className="text-gray-500 text-xs">停留天數</p>
                    <p className={`font-bold ${daysSinceEntry > 30 ? 'text-red-400' : daysSinceEntry > 14 ? 'text-yellow-400' : 'text-white'}`}>
                      {daysSinceEntry} 天
                    </p>
                  </div>
                )}
                {currentPipeline.deal_value && (
                  <div>
                    <p className="text-gray-500 text-xs">商機金額</p>
                    <p className="text-green-400 font-bold">${(currentPipeline.deal_value / 1000).toFixed(0)}K</p>
                  </div>
                )}
                {currentPipeline.expected_close && (
                  <div>
                    <p className="text-gray-500 text-xs">預計 Close</p>
                    <p className="text-white">{format(new Date(currentPipeline.expected_close), 'yyyy/MM/dd')}</p>
                  </div>
                )}
              </div>

              {currentPipeline.next_action && (
                <div className="mt-3 p-3 bg-blue-950/30 border border-blue-800/50 rounded-lg">
                  <p className="text-blue-400 text-xs font-semibold mb-1">下一步行動</p>
                  <p className="text-blue-200 text-sm">{currentPipeline.next_action}</p>
                  {currentPipeline.next_action_due && (
                    <p className="text-blue-500 text-xs mt-1">
                      截止：{format(new Date(currentPipeline.next_action_due), 'yyyy/MM/dd')}
                    </p>
                  )}
                </div>
              )}

              {currentPipeline.blockers && (
                <div className="mt-2 p-3 bg-red-950/30 border border-red-800/50 rounded-lg">
                  <p className="text-red-400 text-xs font-semibold mb-1">卡關原因</p>
                  <p className="text-red-200 text-sm">{currentPipeline.blockers}</p>
                </div>
              )}
            </div>
          )}

          {/* Meeting Timeline */}
          {customer.meeting_notes.length > 0 && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <h2 className="text-white font-bold text-lg mb-3">會議記錄時間軸</h2>
              <div className="space-y-4">
                {customer.meeting_notes.map((note) => (
                  <div key={note.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-2 h-2 rounded-full bg-purple-500 mt-1 flex-shrink-0" />
                      <div className="w-0.5 bg-gray-700 flex-1 mt-1" />
                    </div>
                    <div className="flex-1 pb-4">
                      <p className="text-gray-500 text-xs mb-1">
                        {format(new Date(note.meeting_date), 'yyyy年MM月dd日', { locale: zhTW })}
                      </p>
                      {note.summary && (
                        <p className="text-gray-300 text-sm">{note.summary.split('\n')[0]}</p>
                      )}
                      {note.pain_points && (
                        <p className="text-red-400 text-xs mt-1">痛點：{note.pain_points.split('\n')[0]}</p>
                      )}
                      {note.updated_pitch && (
                        <p className="text-purple-400 text-xs mt-1">✦ 更新話術：{note.updated_pitch}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Contacts + Score */}
        <div className="space-y-4">
          {/* Score */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <h3 className="text-white font-bold mb-3">優先評分</h3>
            <div className="flex items-center justify-center mb-3">
              <div className="relative w-20 h-20">
                <svg className="w-20 h-20 -rotate-90" viewBox="0 0 36 36">
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#374151"
                    strokeWidth="3"
                  />
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke={customer.priority_score >= 80 ? '#ef4444' : customer.priority_score >= 60 ? '#f97316' : '#3b82f6'}
                    strokeWidth="3"
                    strokeDasharray={`${customer.priority_score}, 100`}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">{customer.priority_score}</span>
                </div>
              </div>
            </div>

            {customer.score_breakdown?.ai_reason && (
              <div className="mt-2">
                <p className="text-xs text-purple-400 mb-1">✦ AI 分析</p>
                <p className="text-gray-400 text-xs">{customer.score_breakdown.ai_reason}</p>
              </div>
            )}
          </div>

          {/* Contacts */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <h3 className="text-white font-bold mb-3">聯絡人</h3>
            {customer.contacts.length > 0 ? (
              <div className="space-y-3">
                {customer.contacts.map((contact) => (
                  <div key={contact.id} className="border-b border-gray-800 pb-3 last:border-0 last:pb-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-white font-medium text-sm">{contact.name}</p>
                        <p className="text-gray-500 text-xs">{contact.title}</p>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        contact.influence === 'decision_maker' ? 'bg-red-900/50 text-red-300' :
                        contact.influence === 'champion' ? 'bg-green-900/50 text-green-300' :
                        contact.influence === 'blocker' ? 'bg-yellow-900/50 text-yellow-300' :
                        'bg-gray-800 text-gray-400'
                      }`}>
                        {INFLUENCE_LABELS[contact.influence]}
                      </span>
                    </div>
                    {contact.email && (
                      <a href={`mailto:${contact.email}`} className="text-blue-400 hover:text-blue-300 text-xs block mt-1">
                        {contact.email}
                      </a>
                    )}
                    {contact.notes && (
                      <p className="text-gray-600 text-xs mt-1">{contact.notes}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600 text-sm text-center py-3">尚未新增聯絡人</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
