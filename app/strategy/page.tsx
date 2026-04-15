export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';
import { format } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import Link from 'next/link';

async function getStrategyData() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [strategy, attackNow, stuckPipeline] = await Promise.all([
    prisma.dailyStrategy.findUnique({ where: { date: today } }),
    prisma.customer.findMany({
      where: { priority_label: { in: ['Attack Now', 'Nurture'] } },
      orderBy: { priority_score: 'desc' },
      take: 10,
    }),
    prisma.pipelineStage.findMany({
      where: {
        entered_at: { lte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) },
        stage: { notIn: ['close', 'lost', 'hold'] },
      },
      include: { customer: { select: { id: true, company_name: true } } },
    }),
  ]);

  return { strategy, attackNow, stuckPipeline };
}

export default async function StrategyPage() {
  const { strategy, attackNow, stuckPipeline } = await getStrategyData();

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

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-1">🧠 策略中心</h1>
        <div className="bg-amber-950/30 border border-amber-800/50 rounded-lg px-4 py-2">
          <p className="text-amber-300 text-sm">
            {top3Actions[0]
              ? `今日優先：${top3Actions[0].customer_name} — ${top3Actions[0].action}`
              : '今日策略尚未生成，請等待每日 06:30 自動生成'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Left: Today's Strategy */}
        <div className="col-span-2 space-y-4">
          {/* Top 3 Actions */}
          <div className="bg-amber-950/20 border border-amber-800/50 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-amber-400 font-bold text-lg">今日 Top 3 行動指令</h2>
                {strategy && (
                  <div className="flex items-center gap-1 mt-1">
                    <span className="text-xs px-1.5 py-0.5 rounded bg-purple-900/50 text-purple-300">✦ AI</span>
                    <span className="text-gray-500 text-xs">
                      {format(strategy.generated_at, 'yyyy/MM/dd HH:mm', { locale: zhTW })} 生成
                    </span>
                  </div>
                )}
              </div>
            </div>

            {top3Actions.length > 0 ? (
              <div className="space-y-3">
                {top3Actions.map((action) => (
                  <div
                    key={action.priority}
                    className="bg-gray-900/50 rounded-xl p-4 border border-amber-800/30"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <span className="w-7 h-7 rounded-full bg-amber-600 text-white text-sm font-bold flex items-center justify-center flex-shrink-0">
                        {action.priority}
                      </span>
                      <div>
                        <p className="text-white font-bold">{action.customer_name}</p>
                        <p className="text-amber-200 text-sm">{action.action}</p>
                      </div>
                    </div>
                    <p className="text-gray-400 text-xs italic mb-2">{action.reason}</p>
                    <div className="bg-gray-800/50 rounded-lg p-2">
                      <p className="text-xs text-purple-400 mb-0.5">建議話術</p>
                      <p className="text-gray-200 text-xs">{action.opening_pitch}</p>
                    </div>
                    <Link
                      href={`/customers/${action.customer_id}`}
                      className="text-xs text-blue-400 hover:text-blue-300 mt-2 block"
                    >
                      查看客戶 →
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-600 mb-2">今日策略尚未生成</p>
                <p className="text-gray-700 text-xs">每天 06:30 自動生成，或手動觸發</p>
              </div>
            )}
          </div>

          {/* Weekly Focus */}
          {strategy?.weekly_focus && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <h2 className="text-white font-bold text-lg mb-3">本週攻堅重點</h2>
              <p className="text-gray-300">{strategy.weekly_focus}</p>

              <div className="mt-4">
                <p className="text-gray-500 text-sm mb-2">本週應接觸的客戶</p>
                <div className="space-y-1">
                  {attackNow.slice(0, 5).map((c) => (
                    <div key={c.id} className="flex items-center justify-between">
                      <Link href={`/customers/${c.id}`} className="text-sm text-gray-300 hover:text-white">
                        {c.company_name}
                      </Link>
                      <span className="text-xs text-gray-600">評分 {c.priority_score}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Monthly Direction */}
          {strategy?.monthly_direction && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <h2 className="text-white font-bold text-lg mb-3">本月方向</h2>
              <p className="text-gray-300">{strategy.monthly_direction}</p>

              <div className="mt-4 p-3 bg-gray-800/50 rounded-lg">
                <p className="text-gray-500 text-xs font-semibold mb-2">Pipeline 健康度</p>
                <div className="flex gap-4 text-sm">
                  <div>
                    <p className="text-gray-600 text-xs">卡關案件</p>
                    <p className="text-yellow-400 font-bold">{stuckPipeline.length}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-xs">攻堅客戶</p>
                    <p className="text-green-400 font-bold">{attackNow.length}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right: Abandon List + Stuck Pipeline */}
        <div className="space-y-4">
          {/* Abandon List */}
          {abandonList.length > 0 && (
            <div className="bg-gray-900 border border-red-900/50 rounded-xl p-4">
              <h3 className="text-red-400 font-bold mb-3">放棄清單</h3>
              <p className="text-gray-600 text-xs mb-3">AI 建議不再投入時間的客戶</p>
              <div className="space-y-2">
                {abandonList.map((item, i) => (
                  <div key={i} className="p-3 bg-gray-800/50 rounded-lg">
                    <p className="text-white text-sm font-medium">{item.customer_name}</p>
                    <p className="text-gray-500 text-xs mt-0.5">{item.reason}</p>
                    <button className="text-xs text-red-400 hover:text-red-300 mt-2">
                      確認放棄 →
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Stuck Pipeline */}
          {stuckPipeline.length > 0 && (
            <div className="bg-gray-900 border border-yellow-900/50 rounded-xl p-4">
              <h3 className="text-yellow-400 font-bold mb-3">⚠ Pipeline 卡關</h3>
              <div className="space-y-2">
                {stuckPipeline.map((item) => {
                  const days = Math.floor(
                    (Date.now() - new Date(item.entered_at).getTime()) / (1000 * 60 * 60 * 24)
                  );
                  return (
                    <div key={item.id} className="flex items-center justify-between p-2 bg-yellow-950/20 rounded-lg">
                      <Link href={`/customers/${item.customer.id}`} className="text-gray-300 text-sm hover:text-white">
                        {item.customer.company_name}
                      </Link>
                      <span className={`text-xs font-bold ${days > 30 ? 'text-red-400' : 'text-yellow-400'}`}>
                        {days}天
                      </span>
                    </div>
                  );
                })}
              </div>
              <Link href="/pipeline" className="block text-center text-xs text-yellow-400 hover:text-yellow-300 mt-3">
                前往 Pipeline →
              </Link>
            </div>
          )}

          {/* Quick Actions */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <h3 className="text-white font-bold mb-3">快速操作</h3>
            <div className="space-y-2">
              <Link href="/meetings" className="block w-full text-center py-2 rounded-lg bg-purple-600/30 text-purple-300 hover:bg-purple-600/50 text-sm transition-colors">
                + 新增會議記錄
              </Link>
              <Link href="/prospects" className="block w-full text-center py-2 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 text-sm transition-colors">
                + 新增客戶
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
