'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function GenerateStrategyButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleGenerate = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/strategy/today');
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(`失敗: ${data.error || res.status}`);
        return;
      }
      const data = await res.json();
      if (!data || !data.id) {
        setError('生成失敗，請檢查 ANTHROPIC_API_KEY 環境變數');
        return;
      }
      router.refresh();
    } catch (e) {
      setError(`網路錯誤: ${String(e)}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={handleGenerate}
        disabled={loading}
        className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
      >
        {loading ? '⏳ 生成中，請稍候 (10-20秒)...' : '✦ 立即生成今日策略'}
      </button>
      {error && (
        <p className="text-red-400 text-xs mt-2">{error}</p>
      )}
    </div>
  );
}
