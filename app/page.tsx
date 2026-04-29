export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';
import { format } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import WarRoomCommandCard from '@/components/WarRoomCommandCard';
import VendorStatusBadge from '@/components/VendorStatusBadge';
import AlertBanner from '@/components/AlertBanner';
import Link from 'next/link';
import GenerateStrategyButton from '@/components/GenerateStrategyButton';


async function getWarRoomData() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  try {
    const [strategy, attackNow, statuses, incidents, recentNews, stuckPipeline, pipelineTotal] =
      await Promise.all([
        prisma.dailyStrategy.findUnique({ where: { date: today } }),
        prisma.customer.findMany({
          where: { priority_label: { in: ['Attack Now', 'Nurture'] } },
          orderBy: { priority_score: 'desc' },
          take: 6,
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
          take: 4,
        }),
        prisma.pipelineStage.findMany({
          where: {
            entered_at: { lte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) },
            stage: { notIn: ['close', 'lost', 'hold'] },
          },
          include: {
            customer: { select: { id: true, company_name: true } },
          },
          orderBy: { entered_at: 'asc' },
          take: 5,
        }),
        prisma.pipelineStage.count({
          where: { stage: { notIn: ['close', 'lost'] } },
        }),
      ]);

    let pendingInterventions = 0;
    let pendingOutreach = 0;
    try {
      [pendingInterventions, pendingOutreach] = await Promise.all([
        prisma.interventionItem.count({ where: { status: 'pending' } }),
        prisma.outreachRecord.count({ where: { status: 'draft' } }),
      ]);
    } catch { /* Tables not yet migrated */ }

    const vendorMap = new Map<string, (typeof statuses)[0]>();
    for (const s of statuses) {
      if (!vendorMap.has(s.vendor)) vendorMap.set(s.vendor, s);
    }
    const latestStatuses = Array.from(vendorMap.values());

    return { strategy, attackNow, latestStatuses, incidents, recentNews, stuckPipeline, pipelineTotal, pendingInterventions, pendingOutreach };
  } catch {
    return {
      strategy: null,
      attackNow: [],
      latestStatuses: [],
      incidents: [],
      recentNews: [],
      stuckPipeline: [] as { id: string; customer: { id: string; company_name: string }; entered_at: Date }[],
      pipelineTotal: 0,
      pendingInterventions: 0,
      pendingOutreach: 0,
    };
  }
}

const CATEGORY_LABEL: Record<string, { label: string; cls: string }> = {
  incident: { label: '⚡ 異常', cls: 'bg-red-900/50 text-red-300' },
  promotion: { label: '💰 優惠', cls: 'bg-green-900/50 text-green-300' },
  product: { label: '🚀 新品', cls: 'bg-blue-900/50 text-blue-300' },
  news: { label: '📰 新聞', cls: 'bg-gray-800 text-gray-400' },
};

export default async function WarRoomPage() {
  const { strategy, attackNow, latestStatuses, incidents, recentNews, stuckPipeline, pipelineTotal, pendingInterventions, pendingOutreach } =
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
  const attackNowCount = attackNow.filter(c => c.priority_label === 'Attack Now').length;

  return (
    <div className="space-y-4">

      {/* ── Header ── */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">⚔️ War Room</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {format(today, 'yyyy年MM月dd日 EEEE', { locale: zhTW })}
          </p>
        </div>
        {/* Quick stats */}
        <div className="flex items-center gap-3">
          <Stat label="攻堅客戶" value={attackNowCount} color="text-red-400" />
          <div className="w-px h-8 bg-gray-800" />
          <Stat label="Pipeline" value={pipelineTotal} color="text-blue-400" />
          <div className="w-px h-8 bg-gray-800" />
          <Stat label="卡關中" value={stuckPipeline.length} color={stuckPipeline.length > 0 ? 'text-yellow-400' : 'text-gray-600'} />
          <div className="w-px h-8 bg-gray-800" />
          <Stat label="競品異常" value={incidents.length} color={incidents.length > 0 ? 'text-orange-400' : 'text-gray-600'} />
        </div>
      </div>

      {/* ── AI Agent Status Bar ── */}
      {(pendingInterventions > 0 || pendingOutreach > 0) && (
        <div className="flex items-center gap-3 bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 flex-wrap">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">🤖 AI 員工</span>
          <div className="flex items-center gap-3 flex-wrap flex-1">
            {pendingInterventions > 0 && (
              <Link href="/interventions" className="flex items-center gap-1.5 text-sm text-yellow-400 hover:text-yellow-300 font-medium">
                <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse inline-block" />
                {pendingInterventions} 件待審批
              </Link>
            )}
            {pendingOutreach > 0 && (
              <Link href="/interventions/outreach" className="flex items-center gap-1.5 text-sm text-blue-400 hover:text-blue-300 font-medium">
                <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse inline-block" />
                {pendingOutreach} 封草稿信待審核
              </Link>
            )}
          </div>
          <Link href="/agents" className="text-xs text-gray-600 hover:text-gray-400">AI 員工中心 →</Link>
        </div>
      )}

      {/* ── Incident Alerts ── */}
      {incidents.length > 0 && (
        <div className="space-y-2">
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

      {/* ── Main 2-col layout ── */}
      <div className="grid grid-cols-12 gap-4">

        {/* Left 55%: 今日作戰指令 */}
        <div className="col-span-7 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-white font-bold text-base">今日作戰指令</h2>
              {strategy && (
                <span className="text-xs px-1.5 py-0.5 rounded bg-purple-900/50 text-purple-300">
                  ✦ AI · {format(strategy.generated_at, 'HH:mm')} 生成
                </span>
              )}
            </div>
            <Link href="/strategy" className="text-xs text-gray-500 hover:text-gray-300">
              完整策略 →
            </Link>
          </div>

          {top3Actions.length > 0 ? (
            <div className="space-y-3">
              {top3Actions.map((action) => (
                <WarRoomCommandCard key={action.priority} action={action} />
              ))}
            </div>
          ) : (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center">
              <p className="text-gray-500 text-sm mb-1">今日策略尚未生成</p>
              <p className="text-gray-700 text-xs mb-4">每天 06:30 自動生成，或手動觸發</p>
              <GenerateStrategyButton />
            </div>
          )}

          {/* Abandon list */}
          {abandonList.length > 0 && (
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl px-4 py-3">
              <p className="text-gray-500 text-xs font-semibold mb-2">⛔ 今天不要浪費時間</p>
              <div className="flex flex-wrap gap-x-4 gap-y-1">
                {abandonList.map((item, i) => (
                  <span key={i} className="text-xs text-gray-600">
                    <span className="text-gray-500">{item.customer_name}</span>
                    <span className="text-gray-700 mx-1">—</span>
                    {item.reason}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right 45%: Signals */}
        <div className="col-span-5 space-y-3">

          {/* 雲廠商狀態 - compact 2-col grid */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white font-bold text-sm">雲廠商狀態</h3>
              <Link href="/intelligence" className="text-xs text-gray-600 hover:text-gray-400">查看全部 →</Link>
            </div>
            {latestStatuses.length > 0 ? (
              <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
                {latestStatuses.map((status) => (
                  <VendorStatusBadge
                    key={status.id}
                    vendor={status.vendor}
                    status={status.status}
                    checkedAt={status.checked_at}
                  />
                ))}
              </div>
            ) : (
              <p className="text-gray-600 text-xs">尚未抓取狀態</p>
            )}
          </div>

          {/* Pipeline 卡關 */}
          {stuckPipeline.length > 0 && (
            <div className="bg-yellow-950/20 border border-yellow-800/40 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-yellow-400 font-bold text-sm">⚠ Pipeline 卡關</h3>
                <Link href="/pipeline" className="text-xs text-yellow-600 hover:text-yellow-400">處理 →</Link>
              </div>
              <div className="space-y-1.5">
                {stuckPipeline.map((item) => {
                  const days = Math.floor((Date.now() - new Date(item.entered_at).getTime()) / (1000 * 60 * 60 * 24));
                  return (
                    <div key={item.id} className="flex items-center justify-between">
                      <Link href={`/customers/${item.customer.id}`} className="text-sm text-gray-300 hover:text-white">
                        {item.customer.company_name}
                      </Link>
                      <span className={`text-xs font-bold tabular-nums ${days > 30 ? 'text-red-400' : 'text-yellow-400'}`}>
                        {days}d
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 最新市場情報 */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white font-bold text-sm">最新情報</h3>
              <Link href="/intelligence" className="text-xs text-blue-400 hover:text-blue-300">全部 →</Link>
            </div>
            {recentNews.length > 0 ? (
              <div className="space-y-2.5">
                {recentNews.map((news) => {
                  const cat = CATEGORY_LABEL[news.category] || CATEGORY_LABEL.news;
                  return (
                    <div key={news.id} className="flex gap-2 items-start">
                      <span className={`flex-shrink-0 text-[10px] px-1.5 py-0.5 rounded mt-0.5 ${cat.cls}`}>
                        {cat.label}
                      </span>
                      <div className="min-w-0">
                        <p className="text-gray-300 text-xs leading-snug line-clamp-2">{news.title}</p>
                        <p className="text-gray-600 text-[10px] mt-0.5">{news.vendor}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-600 text-xs">尚無新聞，開啟市場情報頁面自動抓取</p>
            )}
          </div>
        </div>
      </div>

      {/* ── Bottom: 攻堅名單 horizontal strip ── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-white font-bold text-base">🎯 攻堅名單</h2>
          <Link
            href="/customers/new"
            className="text-xs text-blue-400 hover:text-blue-300 px-3 py-1 rounded-lg border border-blue-800/50 hover:border-blue-600 transition-colors"
          >
            + 新增客戶
          </Link>
        </div>
        {attackNow.length > 0 ? (
          <div className="grid grid-cols-3 gap-3">
            {attackNow.map((customer) => (
              <Link
                key={customer.id}
                href={`/customers/${customer.id}`}
                className="bg-gray-900 border border-gray-800 hover:border-gray-600 rounded-xl p-3 transition-colors group"
              >
                <div className="flex items-start justify-between mb-1.5">
                  <p className="text-white font-bold text-sm group-hover:text-blue-300 transition-colors">
                    {customer.company_name}
                  </p>
                  <span className={`flex-shrink-0 text-[10px] px-1.5 py-0.5 rounded ml-2 font-medium ${
                    customer.priority_label === 'Attack Now'
                      ? 'bg-red-900/50 text-red-300'
                      : 'bg-blue-900/50 text-blue-300'
                  }`}>
                    {customer.priority_label === 'Attack Now' ? '攻堅' : '培養'}
                  </span>
                </div>
                <p className="text-gray-500 text-xs mb-1.5">{customer.industry}</p>
                {customer.why_now && (
                  <p className="text-gray-400 text-xs line-clamp-2 mb-2">{customer.why_now}</p>
                )}
                <div className="flex items-center justify-between">
                  <div className="flex gap-1">
                    {customer.entry_points.slice(0, 2).map((ep) => (
                      <span key={ep} className="text-[10px] px-1.5 py-0.5 rounded bg-gray-800 text-gray-500">
                        {ep}
                      </span>
                    ))}
                  </div>
                  <span className="text-xs text-gray-600">
                    {customer.estimated_arr
                      ? `$${(customer.estimated_arr / 1000).toFixed(0)}K`
                      : `分數 ${customer.priority_score}`}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 text-center">
            <p className="text-gray-600 text-sm mb-2">尚無攻堅客戶</p>
            <Link href="/customers/new" className="text-xs text-blue-400 hover:text-blue-300">
              + 新增第一個客戶
            </Link>
          </div>
        )}
      </div>

    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="text-right">
      <p className={`text-xl font-bold tabular-nums ${color}`}>{value}</p>
      <p className="text-gray-600 text-xs">{label}</p>
    </div>
  );
}
