'use client';

import { useState } from 'react';

interface Props {
  customerId: string;
  customerName: string;
  onAbandoned?: (id: string) => void;
}

export default function AbandonButton({ customerId, customerName, onAbandoned }: Props) {
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleAbandon = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/customers/${customerId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priority_label: 'Lost' }),
      });
      if (!res.ok) throw new Error();
      setDone(true);
      onAbandoned?.(customerId);
    } catch {
      alert('操作失敗，請稍後再試');
    } finally {
      setLoading(false);
      setConfirming(false);
    }
  };

  if (done) return <span className="text-xs text-gray-600">已移除</span>;

  if (confirming) {
    return (
      <div className="flex gap-2 mt-2">
        <button
          onClick={handleAbandon}
          disabled={loading}
          className="text-xs px-2 py-1 rounded bg-red-700 text-white hover:bg-red-600 disabled:opacity-50"
        >
          {loading ? '處理中...' : `確認放棄 ${customerName}`}
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="text-xs text-gray-500 hover:text-gray-300"
        >
          取消
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="text-xs text-red-400 hover:text-red-300 mt-2"
    >
      確認放棄 →
    </button>
  );
}
