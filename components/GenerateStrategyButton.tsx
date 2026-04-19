'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function GenerateStrategyButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/strategy/today');
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || '生成失敗，請稍後再試');
        return;
      }
      router.refresh();
    } catch {
      setError('生成失敗，請檢查 ANTHROPIC_API_KEY 環境變數');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="text-center py-8">
      <p className="text-gray-600 text-sm mb-3">今日策略尚未生成</p>
      <button
        onClick={handleGenerate}
        disabled={loading}
        className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? '生成中...' : '✦ 立即生成今日策略'}
      </button>
      {error && (
        <p className="text-red-400 text-xs mt-3">{error}</p>
      )}
    </div>
  );
}
