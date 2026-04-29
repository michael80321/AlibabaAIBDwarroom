'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="zh-TW">
      <body style={{ backgroundColor: '#030712', color: '#f9fafb', fontFamily: 'sans-serif', padding: '2rem' }}>
        <div style={{ maxWidth: '600px', margin: '4rem auto', background: '#111827', border: '1px solid #991b1b', borderRadius: '1rem', padding: '1.5rem' }}>
          <h2 style={{ color: '#f87171', marginBottom: '0.5rem' }}>⚠ 系統錯誤</h2>
          <p style={{ color: '#9ca3af', fontSize: '0.875rem', marginBottom: '1rem' }}>
            請將以下錯誤訊息截圖後回報。
          </p>
          <pre style={{ background: '#030712', color: '#fca5a5', padding: '1rem', borderRadius: '0.5rem', fontSize: '0.75rem', overflow: 'auto', marginBottom: '1rem', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
            {error?.message || '未知錯誤'}
            {'\n\n'}
            {error?.stack || ''}
            {error?.digest ? `\n\nDigest: ${error.digest}` : ''}
          </pre>
          <button
            onClick={reset}
            style={{ background: '#1d4ed8', color: 'white', padding: '0.5rem 1rem', borderRadius: '0.5rem', border: 'none', cursor: 'pointer' }}
          >
            重試
          </button>
        </div>
      </body>
    </html>
  );
}
