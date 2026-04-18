'use client';

import { useState, KeyboardEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const ENTRY_POINT_OPTIONS = ['AI', 'GPU', 'CDN', 'Global', 'China', 'China Access', 'Cost', 'SEA'];
const PRIORITY_OPTIONS = ['Hot', 'Warm', 'Cold', 'Monitor'];
const REGION_OPTIONS = ['TW', 'SEA', 'HK', 'CN', 'APAC', 'Global', 'JP', 'KR', 'SG', 'MY', 'TH', 'ID', 'PH', 'VN'];
const SIZE_OPTIONS = ['1-50', '51-200', '201-500', '501-2000', '2000+'];
const CLOUD_OPTIONS = ['AWS', 'Azure', 'GCP', 'Alibaba Cloud', 'Tencent Cloud', 'Huawei Cloud', 'Multi-cloud', 'Oracle', 'Other'];
const INDUSTRY_OPTIONS = [
  'iGaming', 'Fintech', 'E-commerce', 'Media & Entertainment', 'Gaming', 'Adult Content',
  'AI / ML', 'SaaS', 'Crypto / Web3', 'Healthcare', 'Logistics', 'Retail', 'Travel',
  'Education', 'Telecom', 'Manufacturing', 'Other',
];

interface FormData {
  company_name: string;
  industry: string;
  region: string;
  company_size: string;
  website: string;
  current_cloud: string;
  priority_label: string;
  entry_points: string[];
  estimated_arr: string;
  why_now: string;
  opening_pitch: string;
  pain_points: string[];
  tech_stack: string[];
}

function TagInput({
  tags,
  onChange,
  placeholder,
  colorClass = 'bg-gray-800 text-gray-300',
}: {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder: string;
  colorClass?: string;
}) {
  const [input, setInput] = useState('');

  const addTag = (value: string) => {
    const trimmed = value.trim();
    if (trimmed && !tags.includes(trimmed)) {
      onChange([...tags, trimmed]);
    }
    setInput('');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(input);
    } else if (e.key === 'Backspace' && !input && tags.length > 0) {
      onChange(tags.slice(0, -1));
    }
  };

  return (
    <div className="flex flex-wrap gap-1.5 p-2 bg-gray-900 border border-gray-700 rounded-lg min-h-[42px]">
      {tags.map((tag) => (
        <span key={tag} className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded ${colorClass}`}>
          {tag}
          <button
            type="button"
            onClick={() => onChange(tags.filter((t) => t !== tag))}
            className="opacity-60 hover:opacity-100 text-base leading-none"
          >
            ×
          </button>
        </span>
      ))}
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => addTag(input)}
        placeholder={tags.length === 0 ? placeholder : ''}
        className="flex-1 min-w-[120px] bg-transparent text-sm text-white outline-none placeholder-gray-600"
      />
    </div>
  );
}

export default function NewCustomerPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState<FormData>({
    company_name: '',
    industry: '',
    region: '',
    company_size: '',
    website: '',
    current_cloud: '',
    priority_label: 'Cold',
    entry_points: [],
    estimated_arr: '',
    why_now: '',
    opening_pitch: '',
    pain_points: [],
    tech_stack: [],
  });

  const set = (field: keyof FormData, value: string | string[]) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const toggleEntryPoint = (ep: string) => {
    const current = form.entry_points;
    set('entry_points', current.includes(ep) ? current.filter((e) => e !== ep) : [...current, ep]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.company_name.trim()) {
      setError('公司名稱為必填');
      return;
    }
    setSaving(true);
    setError('');

    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          estimated_arr: form.estimated_arr ? parseInt(form.estimated_arr) : null,
        }),
      });

      if (!res.ok) throw new Error('建立失敗');
      const customer = await res.json();
      router.push(`/customers/${customer.id}`);
    } catch {
      setError('儲存失敗，請重試');
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <Link href="/prospects" className="text-gray-500 hover:text-gray-300 text-sm mb-4 block">
        ← 返回客戶列表
      </Link>

      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-2xl font-bold text-white">新增客戶</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Basic Info */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
          <h2 className="text-white font-semibold">基本資訊</h2>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-gray-400 text-xs mb-1 block">公司名稱 *</label>
              <input
                type="text"
                value={form.company_name}
                onChange={(e) => set('company_name', e.target.value)}
                placeholder="e.g. Grab, Shopee, Garena"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-blue-600 placeholder-gray-600"
                autoFocus
              />
            </div>

            <div>
              <label className="text-gray-400 text-xs mb-1 block">產業</label>
              <select
                value={form.industry}
                onChange={(e) => set('industry', e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-blue-600"
              >
                <option value="">選擇產業</option>
                {INDUSTRY_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-gray-400 text-xs mb-1 block">地區</label>
              <select
                value={form.region}
                onChange={(e) => set('region', e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-blue-600"
              >
                <option value="">選擇地區</option>
                {REGION_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-gray-400 text-xs mb-1 block">公司規模</label>
              <select
                value={form.company_size}
                onChange={(e) => set('company_size', e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-blue-600"
              >
                <option value="">選擇規模</option>
                {SIZE_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-gray-400 text-xs mb-1 block">目前使用雲</label>
              <select
                value={form.current_cloud}
                onChange={(e) => set('current_cloud', e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-blue-600"
              >
                <option value="">選擇雲服務</option>
                {CLOUD_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-gray-400 text-xs mb-1 block">官網</label>
              <input
                type="url"
                value={form.website}
                onChange={(e) => set('website', e.target.value)}
                placeholder="https://example.com"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-blue-600 placeholder-gray-600"
              />
            </div>

            <div>
              <label className="text-gray-400 text-xs mb-1 block">優先級</label>
              <select
                value={form.priority_label}
                onChange={(e) => set('priority_label', e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-blue-600"
              >
                {PRIORITY_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-gray-400 text-xs mb-2 block">切入點</label>
            <div className="flex flex-wrap gap-2">
              {ENTRY_POINT_OPTIONS.map((ep) => (
                <button
                  key={ep}
                  type="button"
                  onClick={() => toggleEntryPoint(ep)}
                  className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                    form.entry_points.includes(ep)
                      ? 'bg-blue-600 border-blue-500 text-white'
                      : 'bg-transparent border-gray-700 text-gray-400 hover:border-gray-500'
                  }`}
                >
                  {ep}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* War Room Info */}
        <div className="bg-amber-950/30 border border-amber-800/50 rounded-xl p-5 space-y-4">
          <h2 className="text-amber-400 font-semibold">⚔️ 作戰資訊</h2>

          <div>
            <label className="text-gray-400 text-xs mb-1 block">預估年合約金額 (ARR USD)</label>
            <input
              type="number"
              value={form.estimated_arr}
              onChange={(e) => set('estimated_arr', e.target.value)}
              placeholder="e.g. 120000 → $120K"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-amber-600 placeholder-gray-600"
            />
          </div>

          <div>
            <label className="text-gray-400 text-xs mb-1 block">為什麼是現在（Why Now）</label>
            <textarea
              value={form.why_now}
              onChange={(e) => set('why_now', e.target.value)}
              rows={2}
              placeholder="e.g. 正在評估降低 AWS 成本、正在擴張東南亞市場"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-amber-600 placeholder-gray-600 resize-none"
            />
          </div>

          <div>
            <label className="text-gray-400 text-xs mb-1 block">開場白建議</label>
            <textarea
              value={form.opening_pitch}
              onChange={(e) => set('opening_pitch', e.target.value)}
              rows={3}
              placeholder="一鍵複製的開場話術..."
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-amber-600 placeholder-gray-600 resize-none"
            />
          </div>
        </div>

        {/* Pain Points & Tech Stack */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
          <h2 className="text-white font-semibold">痛點 & 技術棧</h2>

          <div>
            <label className="text-gray-400 text-xs mb-1 block">痛點（Enter 或逗號分隔）</label>
            <TagInput
              tags={form.pain_points}
              onChange={(tags) => set('pain_points', tags)}
              placeholder="e.g. AWS 費用高、延遲問題..."
              colorClass="bg-red-900/40 text-red-300"
            />
          </div>

          <div>
            <label className="text-gray-400 text-xs mb-1 block">技術棧（Enter 或逗號分隔）</label>
            <TagInput
              tags={form.tech_stack}
              onChange={(tags) => set('tech_stack', tags)}
              placeholder="e.g. Kubernetes, Kafka, Redis..."
              colorClass="bg-gray-700 text-gray-300"
            />
          </div>
        </div>

        {/* Submit */}
        {error && (
          <p className="text-red-400 text-sm text-center">{error}</p>
        )}

        <div className="flex gap-3 justify-end pb-8">
          <Link
            href="/prospects"
            className="px-5 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm transition-colors"
          >
            取消
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
          >
            {saving ? '建立中...' : '建立客戶'}
          </button>
        </div>
      </form>
    </div>
  );
}
