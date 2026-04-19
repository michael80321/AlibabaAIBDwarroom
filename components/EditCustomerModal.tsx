'use client';

import { useState } from 'react';

interface Customer {
  id: string;
  company_name: string;
  industry?: string | null;
  region?: string | null;
  company_size?: string | null;
  website?: string | null;
  current_cloud?: string | null;
  priority_label: string;
  entry_points: string[];
  estimated_arr?: number | null;
  why_now?: string | null;
  opening_pitch?: string | null;
  pain_points: string[];
  tech_stack: string[];
}

interface Props {
  customer: Customer;
  onClose: () => void;
  onSaved: (updated: Customer) => void;
}

const PRIORITY_LABELS = ['Attack Now', 'Nurture', 'Monitor', 'Lost'];
const CLOUD_OPTIONS = ['AWS', 'GCP', 'Azure', 'Alibaba Cloud', 'Others', '未知'];

export default function EditCustomerModal({ customer, onClose, onSaved }: Props) {
  const [form, setForm] = useState({
    company_name: customer.company_name,
    industry: customer.industry ?? '',
    region: customer.region ?? '',
    company_size: customer.company_size ?? '',
    website: customer.website ?? '',
    current_cloud: customer.current_cloud ?? '',
    priority_label: customer.priority_label,
    estimated_arr: customer.estimated_arr?.toString() ?? '',
    why_now: customer.why_now ?? '',
    opening_pitch: customer.opening_pitch ?? '',
    entry_points: customer.entry_points.join(', '),
    pain_points: customer.pain_points.join(', '),
    tech_stack: customer.tech_stack.join(', '),
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/customers/${customer.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          estimated_arr: form.estimated_arr ? parseInt(form.estimated_arr) : null,
          entry_points: form.entry_points.split(',').map((s) => s.trim()).filter(Boolean),
          pain_points: form.pain_points.split(',').map((s) => s.trim()).filter(Boolean),
          tech_stack: form.tech_stack.split(',').map((s) => s.trim()).filter(Boolean),
        }),
      });
      if (!res.ok) throw new Error('儲存失敗');
      const updated = await res.json();
      onSaved(updated);
    } catch {
      setError('儲存失敗，請稍後再試');
    } finally {
      setSaving(false);
    }
  };

  const field = (label: string, key: keyof typeof form, type = 'text', hint?: string) => (
    <div>
      <label className="block text-gray-400 text-xs mb-1">{label}{hint && <span className="text-gray-600 ml-1">{hint}</span>}</label>
      <input
        type={type}
        value={form[key]}
        onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
      />
    </div>
  );

  const textarea = (label: string, key: keyof typeof form, rows = 2) => (
    <div>
      <label className="block text-gray-400 text-xs mb-1">{label}</label>
      <textarea
        rows={rows}
        value={form[key]}
        onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500 resize-none"
      />
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-gray-800">
          <h2 className="text-white font-bold text-lg">編輯客戶資料</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-xl leading-none">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {field('公司名稱', 'company_name')}
            {field('產業', 'industry')}
            {field('地區', 'region')}
            {field('公司規模', 'company_size')}
            {field('官網', 'website')}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-400 text-xs mb-1">目前使用雲</label>
              <select
                value={form.current_cloud}
                onChange={(e) => setForm((f) => ({ ...f, current_cloud: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
              >
                {CLOUD_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-gray-400 text-xs mb-1">優先等級</label>
              <select
                value={form.priority_label}
                onChange={(e) => setForm((f) => ({ ...f, priority_label: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
              >
                {PRIORITY_LABELS.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
          </div>

          {field('預估 ARR ($)', 'estimated_arr', 'number')}
          {field('切入點', 'entry_points', 'text', '（用逗號分隔）')}
          {field('痛點', 'pain_points', 'text', '（用逗號分隔）')}
          {field('技術棧', 'tech_stack', 'text', '（用逗號分隔）')}
          {textarea('為什麼是現在', 'why_now')}
          {textarea('建議開場白', 'opening_pitch', 3)}

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 text-sm transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-50 text-sm font-medium transition-colors"
            >
              {saving ? '儲存中...' : '儲存'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
