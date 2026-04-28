'use client';

import type { AgentTaskLog } from '@prisma/client';

interface AgentInfo {
  name: string;
  lastLog: AgentTaskLog | null;
  runs24h: number;
  errors24h: number;
}

interface Props {
  agents: AgentInfo[];
  latestLogs: AgentTaskLog[];
  pendingInterventions: number;
  pendingOutreach: number;
}

const AGENT_META: Record<string, { label: string; desc: string; schedule: string; icon: string }> = {
  prospect_developer: {
    label: '開發新客',
    desc: '每天掃描新潛在客戶，自動撰寫個人化冷開發信草稿',
    schedule: '每天 07:30',
    icon: '🚀',
  },
  follow_up: {
    label: '跟進助理',
    desc: '找出超過7天未聯繫的客戶，自動準備跟進信草稿',
    schedule: '每天 08:00',
    icon: '🔄',
  },
  competitor_monitor: {
    label: '競爭監控',
    desc: '監控 AWS/GCP/Azure 服務異常，第一時間通知',
    schedule: '每 10 分鐘',
    icon: '👁️',
  },
  customer_scorer: {
    label: '客戶評分',
    desc: '每日重新計算客戶優先級分數，更新 Attack Now 名單',
    schedule: '每天 00:00',
    icon: '📊',
  },
  daily_briefing: {
    label: '每日簡報',
    desc: '生成今日 Top 3 行動清單，推送 Telegram 指令',
    schedule: '每天 06:30',
    icon: '☀️',
  },
};

const STATUS_STYLES: Record<string, string> = {
  completed: 'bg-green-100 text-green-700',
  running: 'bg-blue-100 text-blue-700',
  failed: 'bg-red-100 text-red-700',
  flagged: 'bg-yellow-100 text-yellow-700',
  never: 'bg-gray-100 text-gray-500',
};

const STATUS_LABEL: Record<string, string> = {
  completed: '完成',
  running: '執行中',
  failed: '失敗',
  flagged: '待審',
  never: '未執行',
};

function formatTime(d: Date | string | null) {
  if (!d) return '從未';
  return new Date(d).toLocaleString('zh-TW', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDuration(ms: number | null) {
  if (!ms) return '—';
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

export default function AgentsClient({ agents, latestLogs, pendingInterventions, pendingOutreach }: Props) {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">AI 員工中心</h1>
        <p className="text-gray-500 text-sm mt-1">全自動代理商作戰系統 — 7 × 24 小時為你工作</p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-3 mb-8 sm:grid-cols-4">
        <StatCard label="待審批介入" value={pendingInterventions} href="/interventions" color="red" />
        <StatCard label="待審核草稿信" value={pendingOutreach} href="/interventions/outreach" color="yellow" />
        <StatCard label="活躍 AI 員工" value={agents.filter((a) => a.lastLog).length} color="green" />
        <StatCard label="今日任務執行" value={agents.reduce((s, a) => s + a.runs24h, 0)} color="blue" />
      </div>

      {/* Agent cards */}
      <h2 className="text-lg font-semibold text-gray-800 mb-3">AI 員工狀態</h2>
      <div className="grid gap-4 mb-8">
        {agents.map((agent) => {
          const meta = AGENT_META[agent.name];
          const lastStatus = agent.lastLog?.status ?? 'never';
          return (
            <div key={agent.name} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{meta?.icon ?? '🤖'}</span>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-gray-900">{meta?.label ?? agent.name}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[lastStatus] ?? STATUS_STYLES.never}`}>
                        {STATUS_LABEL[lastStatus] ?? lastStatus}
                      </span>
                      {agent.errors24h > 0 && (
                        <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
                          今日 {agent.errors24h} 次錯誤
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5">{meta?.desc}</p>
                    <div className="flex items-center gap-4 mt-1">
                      <span className="text-xs text-gray-400">排程：{meta?.schedule}</span>
                      <span className="text-xs text-gray-400">上次：{formatTime(agent.lastLog?.started_at ?? null)}</span>
                      {agent.runs24h > 0 && (
                        <span className="text-xs text-gray-400">今日 {agent.runs24h} 次</span>
                      )}
                    </div>
                  </div>
                </div>
                {agent.lastLog && (
                  <div className="text-right shrink-0">
                    <p className="text-xs text-gray-400">{formatDuration(agent.lastLog.duration_ms)}</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent logs */}
      <h2 className="text-lg font-semibold text-gray-800 mb-3">最近任務記錄</h2>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        {latestLogs.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p>尚無任務記錄</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-2 text-xs font-medium text-gray-500">AI 員工</th>
                <th className="text-left px-4 py-2 text-xs font-medium text-gray-500">任務</th>
                <th className="text-left px-4 py-2 text-xs font-medium text-gray-500">狀態</th>
                <th className="text-left px-4 py-2 text-xs font-medium text-gray-500">耗時</th>
                <th className="text-left px-4 py-2 text-xs font-medium text-gray-500">時間</th>
              </tr>
            </thead>
            <tbody>
              {latestLogs.map((log) => (
                <tr key={log.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-2 font-medium text-gray-700">
                    {AGENT_META[log.agent_name]?.label ?? log.agent_name}
                  </td>
                  <td className="px-4 py-2 text-gray-500">{log.task_type}</td>
                  <td className="px-4 py-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_STYLES[log.status] ?? ''}`}>
                      {STATUS_LABEL[log.status] ?? log.status}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-gray-400 text-xs">{formatDuration(log.duration_ms)}</td>
                  <td className="px-4 py-2 text-gray-400 text-xs">{formatTime(log.started_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  href,
  color,
}: {
  label: string;
  value: number;
  href?: string;
  color: 'red' | 'yellow' | 'green' | 'blue';
}) {
  const colors = {
    red: 'bg-red-50 border-red-100 text-red-700',
    yellow: 'bg-yellow-50 border-yellow-100 text-yellow-700',
    green: 'bg-green-50 border-green-100 text-green-700',
    blue: 'bg-blue-50 border-blue-100 text-blue-700',
  };

  const inner = (
    <div className={`rounded-xl border p-4 ${colors[color]}`}>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs mt-0.5 opacity-80">{label}</p>
    </div>
  );

  return href ? <a href={href}>{inner}</a> : inner;
}
