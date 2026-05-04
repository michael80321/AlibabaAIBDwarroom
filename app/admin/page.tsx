'use client';

import { useState, useEffect } from 'react';

interface DebugInfo {
  env: Record<string, string>;
  db: Record<string, number | string>;
  agentTables?: Record<string, number | string>;
  schemaCheck?: Record<string, string>;
}

interface ActionState {
  loading: boolean;
  result: string;
}

const ACTIONS = [
  {
    key: 'score-customers',
    label: '🎯 重新評分所有客戶',
    desc: '根據痛點、預算、技術等信號重新計算 priority_score，更新 Attack Now / Nurture 標籤',
    color: 'border-red-700/50 hover:bg-red-900/20',
  },
  {
    key: 'release-prospects',
    label: '📋 釋出今日潛在客戶推薦',
    desc: '從歷史資料中選出 25 筆設為今日推薦',
    color: 'border-blue-700/50 hover:bg-blue-900/20',
  },
  {
    key: 'release-partner-prospects',
    label: '🤝 釋出今日合作夥伴推薦',
    desc: '從歷史資料中選出 10 筆設為今日推薦',
    color: 'border-cyan-700/50 hover:bg-cyan-900/20',
  },
  {
    key: 'fetch-news',
    label: '📰 立即抓取市場新聞',
    desc: '從各大雲廠商 RSS 抓取最新動態並 AI 摘要（約 30-60 秒）',
    color: 'border-purple-700/50 hover:bg-purple-900/20',
  },
  {
    key: 'check-status',
    label: '🔍 更新雲廠商服務狀態',
    desc: '檢查 AWS / Azure / GCP / Cloudflare 等即時狀態',
    color: 'border-green-700/50 hover:bg-green-900/20',
  },
];

export default function AdminPage() {
  const [debug, setDebug] = useState<DebugInfo | null>(null);
  const [states, setStates] = useState<Record<string, ActionState>>({});

  function reloadDebug() {
    fetch('/api/debug').then((r) => r.json()).then(setDebug);
  }

  useEffect(() => { reloadDebug(); }, []);

  async function trigger(action: string) {
    setStates((s) => ({ ...s, [action]: { loading: true, result: '' } }));
    try {
      const res = await fetch('/api/admin/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      const msg = res.ok ? `✅ ${JSON.stringify(data.result)}` : `❌ ${data.error}`;
      setStates((s) => ({ ...s, [action]: { loading: false, result: msg } }));
      reloadDebug();
    } catch (e) {
      setStates((s) => ({ ...s, [action]: { loading: false, result: `❌ ${String(e)}` } }));
    }
  }

  async function callPost(key: string, url: string) {
    setStates((s) => ({ ...s, [key]: { loading: true, result: '' } }));
    try {
      const res = await fetch(url, { method: 'POST' });
      const data = await res.json();
      const msg = res.ok ? `✅ ${JSON.stringify(data)}` : `❌ ${data.error}`;
      setStates((s) => ({ ...s, [key]: { loading: false, result: msg } }));
      reloadDebug();
    } catch (e) {
      setStates((s) => ({ ...s, [key]: { loading: false, result: `❌ ${String(e)}` } }));
    }
  }

  const db = debug?.db ?? {};
  const agentTables = debug?.agentTables ?? {};
  const schemaCheck = debug?.schemaCheck ?? {};

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">⚙️ 管理後台</h1>
        <p className="text-gray-500 text-sm">手動觸發系統任務、診斷資料庫狀態</p>
      </div>

      {/* DB Diagnostics */}
      {debug && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-white font-semibold">📊 資料庫診斷</h2>
            <button onClick={reloadDebug} className="text-xs text-gray-500 hover:text-gray-300">重新整理</button>
          </div>

          <div>
            <p className="text-gray-500 text-xs font-semibold uppercase tracking-wide mb-2">核心資料</p>
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: '客戶', value: db.customers },
                { label: '潛在客戶', value: db.prospects },
                { label: '今日推薦', value: db.prospectsToday },
                { label: '市場新聞', value: db.news },
                { label: '合作夥伴', value: db.partnerProspects },
                { label: '今日合作', value: db.partnerProspectsToday },
                { label: '策略紀錄', value: db.strategies },
                { label: '服務狀態', value: db.serviceStatuses },
              ].map(({ label, value }) => (
                <div key={label} className="bg-gray-800 rounded-lg p-2 text-center">
                  <p className="text-white font-bold text-lg">{value ?? '–'}</p>
                  <p className="text-gray-500 text-xs">{label}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="text-gray-500 text-xs font-semibold uppercase tracking-wide mb-2">AI 員工系統 Migration</p>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-gray-800 rounded-lg p-2 flex justify-between items-center">
                <span className="text-gray-400 text-xs">Migration 狀態</span>
                <span className="text-xs font-medium">{agentTables.migration ?? '–'}</span>
              </div>
              <div className="bg-gray-800 rounded-lg p-2 flex justify-between items-center">
                <span className="text-gray-400 text-xs">agent_summary 欄位</span>
                <span className="text-xs font-medium">{schemaCheck.agent_summary_column ?? '–'}</span>
              </div>
              {(['agentLogs', 'interventions', 'outreach'] as const).map((k) => (
                <div key={k} className="bg-gray-800 rounded-lg p-2 flex justify-between items-center">
                  <span className="text-gray-400 text-xs">{k}</span>
                  <span className="text-xs font-bold text-white">{agentTables[k] ?? '–'}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="text-gray-500 text-xs font-semibold uppercase tracking-wide mb-2">環境變數</p>
            <div className="grid grid-cols-2 gap-1">
              {Object.entries(debug.env).map(([k, v]) => (
                <div key={k} className="flex justify-between text-xs py-0.5">
                  <span className="text-gray-500">{k}</span>
                  <span>{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Seed Sample Customers */}
      <div className="bg-gray-900 border border-orange-800/40 rounded-xl p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <p className="text-white font-medium text-sm">🏢 Seed 示範客戶資料</p>
            <p className="text-gray-500 text-xs mt-0.5">
              新增 6 筆示範客戶（台積電、富邦、台灣大哥大、HKT、Singtel 等）並自動評分 — 首頁攻堅名單立即顯示
            </p>
            {states['seed-customers']?.result && (
              <p className="text-xs mt-2 text-gray-300 break-all">{states['seed-customers'].result}</p>
            )}
          </div>
          <button
            onClick={() => callPost('seed-customers', '/api/admin/seed-customers')}
            disabled={states['seed-customers']?.loading}
            className="flex-shrink-0 px-4 py-2 rounded-lg bg-orange-700 hover:bg-orange-600 text-white text-sm font-medium disabled:opacity-50 transition-colors"
          >
            {states['seed-customers']?.loading ? '建立中...' : 'Seed'}
          </button>
        </div>
      </div>

      {/* CN Seed */}
      <div className="bg-gray-900 border border-red-800/40 rounded-xl p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <p className="text-white font-medium text-sm">🇨🇳 新增大陸地區推薦資料</p>
            <p className="text-gray-500 text-xs mt-0.5">
              插入 15 筆大陸潛在客戶 + 12 筆大陸合作夥伴（已存在的自動跳過）
            </p>
            {states['seed-cn']?.result && (
              <p className="text-xs mt-2 text-gray-300 break-all">{states['seed-cn'].result}</p>
            )}
          </div>
          <button
            onClick={() => callPost('seed-cn', '/api/admin/seed-cn')}
            disabled={states['seed-cn']?.loading}
            className="flex-shrink-0 px-4 py-2 rounded-lg bg-red-700 hover:bg-red-600 text-white text-sm font-medium disabled:opacity-50 transition-colors"
          >
            {states['seed-cn']?.loading ? '新增中...' : '新增'}
          </button>
        </div>
      </div>

      {/* Actions */}
      <div>
        <h2 className="text-white font-semibold mb-3">🔧 手動觸發任務</h2>
        <div className="space-y-3">
          {ACTIONS.map((a) => {
            const state = states[a.key];
            return (
              <div key={a.key} className={`bg-gray-900 border ${a.color} rounded-xl p-4 transition-colors`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className="text-white font-medium text-sm">{a.label}</p>
                    <p className="text-gray-500 text-xs mt-0.5">{a.desc}</p>
                    {state?.result && (
                      <p className="text-xs mt-2 text-gray-300 break-all">{state.result}</p>
                    )}
                  </div>
                  <button
                    onClick={() => trigger(a.key)}
                    disabled={state?.loading}
                    className="flex-shrink-0 px-4 py-2 rounded-lg bg-white text-gray-900 text-sm font-medium hover:bg-gray-200 disabled:opacity-50 transition-colors"
                  >
                    {state?.loading ? '執行中...' : '執行'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
