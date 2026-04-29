'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[App Error]', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-8">
      <div className="max-w-xl w-full bg-gray-900 border border-red-800/50 rounded-2xl p-6">
        <h2 className="text-red-400 font-bold text-lg mb-2">⚠ Server Error</h2>
        <p className="text-gray-400 text-sm mb-4">
          頁面載入失敗。請將以下錯誤訊息截圖回報。
        </p>
        <div className="bg-gray-950 rounded-lg p-4 mb-4 overflow-auto max-h-48">
          <p className="text-red-300 text-xs font-mono break-all">{error.message}</p>
          {error.digest && (
            <p className="text-gray-500 text-xs mt-2">Digest: {error.digest}</p>
          )}
        </div>
        <button
          onClick={reset}
          className="bg-blue-700 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium"
        >
          重試
        </button>
      </div>
    </div>
  );
}
