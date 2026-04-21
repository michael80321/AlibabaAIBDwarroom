'use client';

import { useState } from 'react';

type EmailScenario = 'cold' | 'post_incident' | 'event_followup';

interface EmailResult {
  customerId: string;
  companyName: string;
  contact: { name: string | null; title: string | null; email: string | null } | null;
  email: {
    subject_zh: string;
    body_zh: string;
    subject_en: string;
    body_en: string;
  } | null;
}

interface Props {
  customerIds: string[];
  customerNames: string[];
  onClose: () => void;
}

const SCENARIOS: { key: EmailScenario; label: string; desc: string }[] = [
  { key: 'cold', label: '🧊 冷開發', desc: '第一次主動接觸' },
  { key: 'post_incident', label: '⚡ 競品異常後', desc: '趁對方雲服務出問題時切入' },
  { key: 'event_followup', label: '🤝 活動後跟進', desc: '見過面的後續 follow up' },
];

export default function EmailGeneratorModal({ customerIds, customerNames, onClose }: Props) {
  const [scenario, setScenario] = useState<EmailScenario>('cold');
  const [lang, setLang] = useState<'zh' | 'en'>('zh');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<EmailResult[]>([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [copied, setCopied] = useState<'subject' | 'body' | null>(null);

  async function generate() {
    setLoading(true);
    setResults([]);
    try {
      const res = await fetch('/api/emails/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerIds, scenario }),
      });
      const data = await res.json();
      if (data.results) {
        setResults(data.results);
        setActiveIdx(0);
      }
    } finally {
      setLoading(false);
    }
  }

  function copy(text: string, type: 'subject' | 'body') {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  }

  const current = results[activeIdx];
  const subject = current?.email ? (lang === 'zh' ? current.email.subject_zh : current.email.subject_en) : '';
  const body = current?.email ? (lang === 'zh' ? current.email.body_zh : current.email.body_en) : '';

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-gray-950 border border-gray-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-800">
          <div>
            <h2 className="text-white font-bold text-lg">✉️ 生成開發信</h2>
            <p className="text-gray-500 text-xs mt-0.5">
              已選 {customerIds.length} 個客戶：{customerNames.join('、')}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-600 hover:text-white text-xl transition-colors">✕</button>
        </div>

        <div className="p-5 space-y-4">
          {/* Scenario selection */}
          <div>
            <p className="text-gray-400 text-xs font-semibold mb-2">發送情境</p>
            <div className="grid grid-cols-3 gap-2">
              {SCENARIOS.map((s) => (
                <button
                  key={s.key}
                  onClick={() => setScenario(s.key)}
                  className={`text-left p-3 rounded-xl border transition-colors ${
                    scenario === s.key
                      ? 'bg-blue-900/40 border-blue-600 text-white'
                      : 'bg-gray-900 border-gray-800 text-gray-400 hover:border-gray-600'
                  }`}
                >
                  <p className="text-sm font-medium">{s.label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{s.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Generate button */}
          {results.length === 0 && (
            <button
              onClick={generate}
              disabled={loading}
              className="w-full py-3 rounded-xl bg-white text-gray-900 font-bold text-sm hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? '⏳ AI 生成中（約 10-20 秒）...' : '✦ 生成開發信'}
            </button>
          )}

          {/* Results */}
          {results.length > 0 && (
            <>
              {/* Customer tabs */}
              {results.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {results.map((r, i) => (
                    <button
                      key={r.customerId}
                      onClick={() => setActiveIdx(i)}
                      className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        activeIdx === i
                          ? 'bg-white text-gray-900'
                          : 'bg-gray-800 text-gray-400 hover:text-white'
                      }`}
                    >
                      {r.companyName}
                    </button>
                  ))}
                </div>
              )}

              {current && (
                <div className="space-y-3">
                  {/* Contact info */}
                  {current.contact ? (
                    <div className="flex items-center justify-between bg-gray-900 border border-gray-800 rounded-xl px-4 py-3">
                      <div>
                        <p className="text-white text-sm font-medium">
                          {current.contact.name}
                          {current.contact.title && <span className="text-gray-500 ml-2 font-normal text-xs">{current.contact.title}</span>}
                        </p>
                        {current.contact.email ? (
                          <p className="text-blue-400 text-xs mt-0.5">{current.contact.email}</p>
                        ) : (
                          <p className="text-gray-600 text-xs mt-0.5">未填入 Email</p>
                        )}
                      </div>
                      {current.contact.email && (
                        <button
                          onClick={() => copy(current.contact!.email!, 'subject')}
                          className="text-xs px-3 py-1.5 rounded-lg bg-gray-800 text-gray-400 hover:text-white transition-colors"
                        >
                          複製 Email
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="bg-yellow-950/30 border border-yellow-800/50 rounded-xl px-4 py-3">
                      <p className="text-yellow-400 text-xs">⚠ 此客戶尚未建立聯絡人，請先在客戶頁面新增決策者</p>
                    </div>
                  )}

                  {/* Lang toggle */}
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500 text-xs">語言：</span>
                    {(['zh', 'en'] as const).map((l) => (
                      <button
                        key={l}
                        onClick={() => setLang(l)}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                          lang === l ? 'bg-white text-gray-900' : 'bg-gray-800 text-gray-400'
                        }`}
                      >
                        {l === 'zh' ? '中文' : 'English'}
                      </button>
                    ))}
                  </div>

                  {/* Subject */}
                  <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-gray-500 text-xs font-semibold">主旨 / Subject</p>
                      <button
                        onClick={() => copy(subject, 'subject')}
                        className="text-xs px-2.5 py-1 rounded-lg bg-gray-800 text-gray-400 hover:text-white transition-colors"
                      >
                        {copied === 'subject' ? '✓ 已複製' : '複製'}
                      </button>
                    </div>
                    <p className="text-white text-sm font-medium">{subject}</p>
                  </div>

                  {/* Body */}
                  <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-gray-500 text-xs font-semibold">信件內文</p>
                      <button
                        onClick={() => copy(body, 'body')}
                        className="text-xs px-2.5 py-1 rounded-lg bg-gray-800 text-gray-400 hover:text-white transition-colors"
                      >
                        {copied === 'body' ? '✓ 已複製' : '複製'}
                      </button>
                    </div>
                    <p className="text-gray-200 text-sm leading-relaxed whitespace-pre-wrap">{body}</p>
                  </div>

                  {/* Regenerate */}
                  <button
                    onClick={generate}
                    disabled={loading}
                    className="w-full py-2.5 rounded-xl border border-gray-700 text-gray-400 text-sm hover:text-white hover:border-gray-500 disabled:opacity-50 transition-colors"
                  >
                    {loading ? '⏳ 重新生成中...' : '🔄 重新生成'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
