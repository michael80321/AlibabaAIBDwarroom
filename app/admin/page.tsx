'use client';

import { useState, useEffect } from 'react';

interface DebugInfo {
  env: Record<string, string>;
  db: {
    customers?: number;
    prospects?: number;
    prospectsToday?: number;
    partnerProspects?: number;
    partnerProspectsToday?: number;
    strategies?: number;
    news?: number;
    error?: string;
  };
}

interface ActionState {
  loading: boolean;
  result: string;
}

const ACTIONS = [
  {
    key: 'release-prospects',
    label: '🎯 釋出今日潛在客戶推薦',
    desc: '從歷史資料中選出 25 筆設為今日推薦',
    color: 'border-blue-700/50 hover:bg-blue-900/30',
  },
  {
    key: 'release-partner-prospects',
    label: '🤝 釋出今日合作夥伴推薦',
    desc: '從歷史資料中選出 10 筆設為今日推薦',
    color: 'border-cyan-700/50 hover:bg-cyan-900/30',
  },
  {
    key: 'fetch-news',
    label: '📰 立即抓取市場新聞',
    desc: '從各大雲廠商 RSS 抓取最新動態並 AI 摘要（約 30-60 秒）',
    color: 'border-purple-700/50 hover:bg-purple-900/30',
  },
  {
    key: 'check-status',
    label: '🔍 更新雲廠商服務狀態',
    desc: '檢查 AWS / Azure / GCP / Cloudflare 等即時狀態',
    color: 'border-green-700/50 hover:bg-green-900/30',
  },
];

export default function AdminPage() {
  const [debug, setDebug] = useState<DebugInfo | null>(null);
  const [states, setStates] = useState<Record<string, ActionState>>({});

  useEffect(() => {
    fetch('/api/debug').then((r) => r.json()).then(setDebug);
  }, []);

  async function trigger(action: string) {
    setStates((s) => ({ ...s, [action]: { loading: true, result: '' } }));
    try {
      const res = await fetch('/api/admin/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      const msg = res.ok
        ? `✅ ${JSON.stringify(data.result)}`
        : `❌ ${data.error}`;
      setStates((s) => ({ ...s, [action]: { loading: false, result: msg } }));
      fetch('/api/debug').then((r) => r.json()).then(setDebug);
    } catch (e) {
      setStates((s) => ({ ...s, [action]: { loading: false, result: `❌ ${String(e)}` } }));
    }
  }

  async function seedCN() {
    setStates((s) => ({ ...s, 'seed-cn': { loading: true, result: '' } }));
    try {
      const res = await fetch('/api/admin/seed-cn', { method: 'POST' });
      const data = await res.json();
      const msg = res.ok
        ? `✅ 新增 ${data.prospectsInserted} 筆、更新 ${data.prospectsUpdated} 筆潛在客戶；新增 ${data.partnersInserted} 筆、更新 ${data.partnersUpdated} 筆合作夥伴 → 今日可見`
        : `❌ ${data.error}`;
      setStates((s) => ({ ...s, 'seed-cn': { loading: false, result: msg } }));
      fetch('/api/debug').then((r) => r.json()).then(setDebug);
    } catch (e) {
      setStates((s) => ({ ...s, 'seed-cn': { loading: false, result: `❌ ${String(e)}` } }));
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-1">⚙️ 管理後台</h1>
      <p className="text-gray-500 text-sm mb-6">手動觸發系統任務，不需要等待排程</p>

      {/* DB Status */}
      {debug && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-6">
          <h2 className="text-white font-semibold mb-3">📊 目前資料狀態</h2>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-gray-800 rounded-lg p-3">
              <p className="text-gray-400 text-xs mb-1">潛在客戶推薦</p>
              <p className="text-white font-bold text-lg">{debug.db.prospectsToday ?? '–'} <span className="text-gray-500 text-sm font-normal">今日</span></p>
              <p className="text-gray-500 text-xs">共 {debug.db.prospects ?? '–'} 筆</p>
            </div>
            <div className="bg-gray-800 rounded-lg p-3">
              <p className="text-gray-400 text-xs mb-1">合作夥伴推薦</p>
              <p className="text-white font-bold text-lg">{debug.db.partnerProspectsToday ?? '–'} <span className="text-gray-500 text-sm font-normal">今日</span></p>
              <p className="text-gray-500 text-xs">共 {debug.db.partnerProspects ?? '–'} 筆</p>
            </div>
            <div className="bg-gray-800 rounded-lg p-3">
              <p className="text-gray-400 text-xs mb-1">市場新聞</p>
              <p className="text-white font-bold text-lg">{debug.db.news ?? '–'} <span className="text-gray-500 text-sm font-normal">則</span></p>
            </div>
            <div className="bg-gray-800 rounded-lg p-3">
              <p className="text-gray-400 text-xs mb-1">客戶數 / 策略數</p>
              <p className="text-white font-bold text-lg">{debug.db.customers ?? '–'} / {debug.db.strategies ?? '–'}</p>
            </div>
          </div>

          <h3 className="text-gray-400 text-xs font-semibold mb-2">環境變數</h3>
          <div className="grid grid-cols-2 gap-1">
            {Object.entries(debug.env).map(([k, v]) => (
              <div key={k} className="flex justify-between text-xs">
                <span className="text-gray-500">{k}</span>
                <span>{v}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CN Data Seeding */}
      <div className="bg-gray-900 border border-red-800/40 rounded-xl p-4 mb-3 transition-colors hover:bg-red-950/20">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <p className="text-white font-medium text-sm">🇨🇳 新增大陸地區推薦資料</p>
            <p className="text-gray-500 text-xs mt-0.5">
              插入 15 筆大陸潛在客戶 + 12 筆大陸合作夥伴（已存在的會自動跳過）
            </p>
            {states['seed-cn']?.result && (
              <p className="text-xs mt-2 text-gray-300">{states['seed-cn'].result}</p>
            )}
          </div>
          <button
            onClick={seedCN}
            disabled={states['seed-cn']?.loading}
            className="flex-shrink-0 px-4 py-2 rounded-lg bg-red-700 hover:bg-red-600 text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {states['seed-cn']?.loading ? '新增中...' : '新增'}
          </button>
        </div>
      </div>

      {/* Actions */}
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
                    <p className="text-xs mt-2 text-gray-300">{state.result}</p>
                  )}
                </div>
                <button
                  onClick={() => trigger(a.key)}
                  disabled={state?.loading}
                  className="flex-shrink-0 px-4 py-2 rounded-lg bg-white text-gray-900 text-sm font-medium hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {state?.loading ? '執行中...' : '執行'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
