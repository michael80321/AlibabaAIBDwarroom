'use client';

import { useState } from 'react';

interface Customer {
  id: string;
  company_name: string;
}

interface MeetingAnalysis {
  summary: string[];
  decision_makers: Array<{ name: string; title: string; influence: string }>;
  pain_points: string[];
  objections: Array<{ objection: string; suggested_response: string }>;
  budget_timeline: string;
  next_steps: Array<{ action: string; owner: string; deadline: string }>;
  updated_pitch: string;
}

interface MeetingNoteFormProps {
  customers: Customer[];
  onSuccess?: () => void;
}

const INFLUENCE_LABELS: Record<string, string> = {
  decision_maker: '決策者',
  champion: '倡導者',
  user: '使用者',
  blocker: '阻礙者',
};

export default function MeetingNoteForm({ customers, onSuccess }: MeetingNoteFormProps) {
  const [customerId, setCustomerId] = useState('');
  const [meetingDate, setMeetingDate] = useState(new Date().toISOString().split('T')[0]);
  const [rawNotes, setRawNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<MeetingAnalysis | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId || !rawNotes.trim()) return;

    setLoading(true);
    setAnalysis(null);

    try {
      const res = await fetch('/api/meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customer_id: customerId, meeting_date: meetingDate, raw_notes: rawNotes }),
      });

      const data = await res.json();
      if (data.analysis) {
        setAnalysis(data.analysis);
        onSuccess?.();
      }
    } catch (error) {
      console.error('Submit error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyPitch = () => {
    if (!analysis) return;
    navigator.clipboard.writeText(analysis.updated_pitch);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div>
      <form onSubmit={handleSubmit} className="space-y-4 mb-8">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">關聯客戶</label>
            <select
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              required
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
            >
              <option value="">選擇客戶...</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.company_name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">會議日期</label>
            <input
              type="date"
              value={meetingDate}
              onChange={(e) => setMeetingDate(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1">原始會議記錄</label>
          <textarea
            value={rawNotes}
            onChange={(e) => setRawNotes(e.target.value)}
            placeholder="貼上原始會議紀錄，越詳細越好...&#10;&#10;例如：&#10;- 參與者：CTO Michael、PM Alice&#10;- 討論重點：CDN 延遲問題，目前 AWS 延遲 200ms 東南亞...&#10;- 預算：Q2 有 50萬美金預算..."
            rows={10}
            required
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500 placeholder-gray-600 resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              AI 分析中...（約 10-15 秒）
            </>
          ) : (
            <>✦ AI 整理會議記錄</>
          )}
        </button>
      </form>

      {/* Analysis Results */}
      {analysis && (
        <div className="space-y-4 border-t border-gray-800 pt-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="px-2 py-0.5 rounded bg-purple-900/50 text-purple-300 text-xs font-semibold">✦ AI</span>
            <h3 className="text-white font-bold">AI 整理結果</h3>
          </div>

          {/* Summary */}
          <div className="bg-gray-900 rounded-xl p-4">
            <h4 className="text-gray-400 text-sm font-semibold mb-2">重點摘要</h4>
            <ul className="space-y-1">
              {analysis.summary.map((s, i) => (
                <li key={i} className="flex gap-2 text-sm text-gray-200">
                  <span className="text-purple-400 mt-0.5">•</span>
                  {s}
                </li>
              ))}
            </ul>
          </div>

          {/* Decision Makers */}
          {analysis.decision_makers?.length > 0 && (
            <div className="bg-gray-900 rounded-xl p-4">
              <h4 className="text-gray-400 text-sm font-semibold mb-2">決策人分析</h4>
              <div className="space-y-2">
                {analysis.decision_makers.map((dm, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <div>
                      <span className="text-white font-medium">{dm.name}</span>
                      <span className="text-gray-500 ml-2">{dm.title}</span>
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded bg-blue-900/50 text-blue-300">
                      {INFLUENCE_LABELS[dm.influence] || dm.influence}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pain Points */}
          {analysis.pain_points?.length > 0 && (
            <div className="bg-gray-900 rounded-xl p-4">
              <h4 className="text-gray-400 text-sm font-semibold mb-2">痛點</h4>
              <div className="flex flex-wrap gap-2">
                {analysis.pain_points.map((p, i) => (
                  <span key={i} className="text-xs px-2 py-1 rounded-lg bg-red-900/30 text-red-300">
                    {p}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Budget & Timeline */}
          {analysis.budget_timeline && (
            <div className="bg-gray-900 rounded-xl p-4">
              <h4 className="text-gray-400 text-sm font-semibold mb-1">預算與時間線</h4>
              <p className="text-gray-200 text-sm">{analysis.budget_timeline}</p>
            </div>
          )}

          {/* Next Steps */}
          {analysis.next_steps?.length > 0 && (
            <div className="bg-gray-900 rounded-xl p-4">
              <h4 className="text-gray-400 text-sm font-semibold mb-2">下一步行動</h4>
              <div className="space-y-2">
                {analysis.next_steps.map((step, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm">
                    <span className="text-green-400 mt-0.5">→</span>
                    <div>
                      <span className="text-gray-200">{step.action}</span>
                      <span className="text-gray-500 ml-2 text-xs">
                        {step.owner} · {step.deadline}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Updated Pitch */}
          {analysis.updated_pitch && (
            <div className="bg-amber-950/30 border border-amber-700/50 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-amber-400 font-bold text-sm">✦ 更新後的建議話術</h4>
                <button
                  onClick={handleCopyPitch}
                  className="text-xs px-3 py-1 rounded-lg bg-amber-600/30 text-amber-300 hover:bg-amber-600/50 transition-colors"
                >
                  {copied ? '已複製 ✓' : '一鍵複製'}
                </button>
              </div>
              <p className="text-amber-100 text-base font-medium leading-relaxed">{analysis.updated_pitch}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
