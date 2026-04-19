'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function GenerateStrategyButton() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleGenerate = async () => {
    setLoading(true);
    try {
      await fetch('/api/strategy/today');
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleGenerate}
      disabled={loading}
      className="text-blue-400 text-xs hover:text-blue-300 mt-2 block disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading ? '生成中，請稍候...' : '點此生成 →'}
    </button>
  );
}
