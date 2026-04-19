export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';
import { format } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import WarRoomCommandCard from '@/components/WarRoomCommandCard';
import CustomerCard from '@/components/CustomerCard';
import VendorStatusBadge from '@/components/VendorStatusBadge';
import AlertBanner from '@/components/AlertBanner';
import GenerateStrategyButton from '@/components/GenerateStrategyButton';
import Link from 'next/link';

async function getWarRoomData() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [strategy, attackNow, statuses, incidents, recentNews, stuckPipeline] =
    await Promise.all([
      prisma.dailyStrategy.findUnique({ where: { date: today } }),
      prisma.customer.findMany({
        where: { priority_label: 'Attack Now' },
        orderBy: { priority_score: 'desc' },
        take: 5,
      }),
      prisma.serviceStatus.findMany({
        distinct: ['vendor'],
        orderBy: { checked_at: 'desc' },
      }),
      prisma.statusIncident.findMany({
        where: { resolved_at: null },
        orderBy: { started_at: 'desc' },
        take: 3,
      }),
      prisma.cloudVendorNews.findMany({
        orderBy: { published_at: 'desc' },
        take: 5,
      }),
      prisma.pipelineStage.findMany({
        where: {
          entered_at: { lte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) },
          stage: { notIn: ['close', 'lost', 'hold'] },
        },
        include: {
          customer: { select: { id: true, company_name: true, priority_label: true } },
        },
        orderBy: { entered_at: 'asc' },
        take: 5,
      }),
    ]);

  // Get latest status per vendor
  const vendorMap = new Map<string, (typeof statuses)[0]>();
  for (const s of statuses) {
    if (!vendorMap.has(s.vendor)) vendorMap.set(s.vendor, s);
  }
  const latestStatuses = Array.from(vendorMap.values());

  return { strategy, attackNow, latestStatuses, incidents, recentNews, stuckPipeline };
}

export default async function WarRoomPage() {
  const { strategy, attackNow, latestStatuses, incidents, recentNews, stuckPipeline } =
    await getWarRoomData();

  const top3Actions = (strategy?.top3_actions as Array<{
    priority: number;
    customer_id: string;
    customer_name: string;
    action: string;
    reason: string;
    opening_pitch: string;
  }>) || [];

  const abandonList = (strategy?.abandon_list as Array<{
    customer_name: string;
    customer_id: string;
    reason: string;
  }>) || [];

  const today = new Date();

  return (
    <div>
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">⚔️ War Room</h1>
        <p className="text-gray-500 text-sm">
          {format(today, 'yyyy年MM月dd日 EEEE', { locale: zhTW })}
        </p>
      </div>

      {/* Action Alert Banner */}
      {incidents.length > 0 && (
        <div className="mb-4 space-y-2">
          {incidents.map((incident) => (
            <AlertBanner
              key={incident.id}
              vendor={incident.vendor}
              title={incident.title}
              severity={incident.severity as 'warning' | 'critical'}
            />
          ))}
        </div>
      )}

      {/* Three Column Layout */}
      <div className="grid grid-cols-12 gap-4">
        {/* Left Column: Today's Battle Orders (40%) */}
        <div className="col-span-5">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-white font-bold text-lg">今日作戰指令</h2>
                {strategy && (
                  <div className="flex items-center gap-1 mt-1">
                    <span className="text-xs px-1.5 py-0.5 rounded bg-purple-900/50 text-purple-300">✦ AI</span>
                    <span className="text-gray-600 text-xs">
                      {format(strategy.generated_at, 'HH:mm', { locale: zhTW })} 生成
                    </span>
                  </div>
                )}
              </div>
              <Link
                href="/strategy"
                className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
              >
                完整策略 →
              </Link>
            </div>

            {top3Actions.length > 0 ? (
              <div className="space-y-3">
                {top3Actions.map((action) => {
                  const customer = attackNow.find((c) => c.id === action.customer_id);
                  return (
                    <WarRoomCommandCard
                      key={action.priority}
                      action={action}
                      priorityLabel={customer?.priority_label || 'Attack Now'}
                    />
                  );
                })}
              </div>
            ) : (
              <GenerateStrategyButton />
            )}

            {/* Abandon List */}
            {abandonList.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-800">
                <p className="text-gray-500 text-xs font-semibold mb-2">今天不要浪費時間的客戶</p>
                <div className="space-y-1">
                  {abandonList.map((item, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-gray-600">
                      <span>✕</span>
                      <span className="text-gray-500">{item.customer_name}</span>
                      <span className="text-gray-700">—</span>
                      <span className="text-gray-600">{item.reason}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Center Column: Hot Prospects (35%) */}
        <div className="col-span-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-bold text-lg">🎯 攻堅名單</h2>
              <Link
                href="/prospects"
                className="text-xs text-blue-400 hover:text-blue-300 px-3 py-1 rounded-lg border border-blue-800 hover:border-blue-600 transition-colors"
              >
                + 新增客戶
              </Link>
            </div>

            {/* Today's highlight */}
            <div className="bg-amber-950/30 border border-amber-800/50 rounded-lg p-3 mb-3">
              <p className="text-amber-400 text-xs font-semibold mb-1">今日重點</p>
              <p className="text-amber-200 text-xs">
                {top3Actions[0]
                  ? `優先聯絡 ${top3Actions[0].customer_name}，${top3Actions[0].reason}`
                  : '策略生成中...'}
              </p>
            </div>

            <div className="space-y-3">
              {attackNow.map((customer) => (
                <CustomerCard key={customer.id} customer={customer} />
              ))}
            </div>

            {attackNow.length === 0 && (
              <p className="text-gray-600 text-sm text-center py-6">
                沒有 Attack Now 客戶
              </p>
            )}
          </div>
        </div>

        {/* Right Column: Signals & Alerts (25%) */}
        <div className="col-span-3 space-y-4">
          {/* Vendor Status */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <h3 className="text-white font-bold text-sm mb-3">雲廠商狀態</h3>
            <div className="space-y-0.5">
              {latestStatuses.map((status) => (
                <VendorStatusBadge
                  key={status.id}
                  vendor={status.vendor}
                  status={status.status}
                  checkedAt={status.checked_at}
                />
              ))}
            </div>
          </div>

          {/* Recent News */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <h3 className="text-white font-bold text-sm mb-3">市場情報</h3>
            <div className="space-y-2">
              {recentNews.map((news) => (
                <div key={news.id} className="border-b border-gray-800 pb-2 last:border-0 last:pb-0">
                  <div className="flex items-center gap-1 mb-0.5">
                    <span className="text-xs px-1.5 py-0.5 rounded bg-gray-800 text-gray-400">
                      {news.vendor}
                    </span>
                    <span className={`text-xs px-1.5 py-0.5 rounded ${
                      news.category === 'incident'
                        ? 'bg-red-900/50 text-red-300'
                        : news.category === 'promotion'
                        ? 'bg-green-900/50 text-green-300'
                        : 'bg-blue-900/50 text-blue-300'
                    }`}>
                      {news.category}
                    </span>
                  </div>
                  <p className="text-gray-300 text-xs line-clamp-2">{news.title}</p>
                </div>
              ))}
            </div>
            <Link
              href="/intelligence"
              className="block text-center text-xs text-blue-400 hover:text-blue-300 mt-3"
            >
              查看全部情報 →
            </Link>
          </div>

          {/* Stuck Pipeline */}
          {stuckPipeline.length > 0 && (
            <div className="bg-yellow-950/20 border border-yellow-800/50 rounded-xl p-4">
              <h3 className="text-yellow-400 font-bold text-sm mb-3">⚠ Pipeline 卡關</h3>
              <div className="space-y-2">
                {stuckPipeline.map((item) => {
                  const days = Math.floor(
                    (Date.now() - new Date(item.entered_at).getTime()) / (1000 * 60 * 60 * 24)
                  );
                  return (
                    <div key={item.id} className="flex items-center justify-between text-xs">
                      <Link
                        href={`/customers/${item.customer.id}`}
                        className="text-gray-300 hover:text-white"
                      >
                        {item.customer.company_name}
                      </Link>
                      <span className="text-yellow-400">{days}天</span>
                    </div>
                  );
                })}
              </div>
              <Link
                href="/pipeline"
                className="block text-center text-xs text-yellow-400 hover:text-yellow-300 mt-3"
              >
                查看 Pipeline →
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
