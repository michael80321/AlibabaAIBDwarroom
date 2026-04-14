'use client';

import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { zhTW } from 'date-fns/locale';

export default function TopBar() {
  const [now, setNow] = useState<Date | null>(null);
  const [statusCount, setStatusCount] = useState({ total: 0, issues: 0 });

  useEffect(() => {
    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), 60000);

    // Fetch status count
    fetch('/api/intelligence/status')
      .then((r) => r.json())
      .then((data) => {
        const total = (data.statuses || []).filter(Boolean).length;
        const issues = (data.statuses || []).filter(
          (s: { status: string } | null) => s && s.status !== 'operational'
        ).length;
        setStatusCount({ total, issues });
      })
      .catch(() => {});

    return () => clearInterval(timer);
  }, []);

  return (
    <header className="flex items-center justify-between px-6 py-3 bg-gray-900 border-b border-gray-800">
      <div className="flex items-center gap-4">
        {now && (
          <span className="text-gray-400 text-sm">
            {format(now, 'yyyy年MM月dd日 EEEE', { locale: zhTW })}
          </span>
        )}
      </div>

      <div className="flex items-center gap-4">
        {/* Vendor Status Summary */}
        <div className="flex items-center gap-2 text-sm">
          {statusCount.issues > 0 ? (
            <span className="flex items-center gap-1 text-yellow-400">
              <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse inline-block" />
              {statusCount.issues} 服務異常
            </span>
          ) : (
            <span className="flex items-center gap-1 text-green-400">
              <span className="w-2 h-2 rounded-full bg-green-400 inline-block" />
              全部服務正常
            </span>
          )}
        </div>

        <div className="text-xs text-gray-600 border-l border-gray-700 pl-4">
          Alibaba Cloud BD War Room v1.0
        </div>
      </div>
    </header>
  );
}
