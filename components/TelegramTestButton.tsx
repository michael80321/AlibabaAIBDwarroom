'use client';

import { useState } from 'react';

export default function TelegramTestButton() {
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  const handleTest = async () => {
    setSending(true);
    setResult(null);
    try {
      const res = await fetch('/api/telegram/test', { method: 'POST' });
      const data = await res.json();
      if (data.ok) {
        setResult({ ok: true, message: '✅ 已發送，檢查 Telegram' });
      } else {
        const detail = data.detail
          ? typeof data.detail === 'object'
            ? JSON.stringify(data.detail)
            : data.detail
          : '';
        setResult({ ok: false, message: `❌ ${data.error}${detail ? `: ${detail}` : ''}` });
      }
    } catch {
      setResult({ ok: false, message: '❌ 請求失敗' });
    } finally {
      setSending(false);
      setTimeout(() => setResult(null), 6000);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={handleTest}
        disabled={sending}
        className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-xs font-medium transition-colors"
      >
        {sending ? '發送中...' : '📩 測試 Telegram 推送'}
      </button>
      {result && (
        <span className={`text-xs ${result.ok ? 'text-green-400' : 'text-red-400'}`}>
          {result.message}
        </span>
      )}
    </div>
  );
}
