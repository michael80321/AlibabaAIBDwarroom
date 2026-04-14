export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';
import PipelineKanban from '@/components/PipelineKanban';

async function getPipelineData() {
  const items = await prisma.pipelineStage.findMany({
    where: { stage: { notIn: ['lost'] } },
    include: {
      customer: {
        select: {
          id: true,
          company_name: true,
          priority_label: true,
          priority_score: true,
        },
      },
    },
    orderBy: { entered_at: 'asc' },
  });

  const now = Date.now();
  const stuckCount = items.filter(
    (i) => (now - new Date(i.entered_at).getTime()) / (1000 * 60 * 60 * 24) > 14 && i.stage !== 'close'
  ).length;

  const thisMonthClose = items.filter((i) => {
    if (!i.expected_close) return false;
    const d = new Date(i.expected_close);
    const today = new Date();
    return d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
  });

  const monthlyValue = thisMonthClose.reduce((sum, i) => sum + (i.deal_value || 0), 0);

  return { items, stuckCount, monthlyValue };
}

export default async function PipelinePage() {
  const { items, stuckCount, monthlyValue } = await getPipelineData();

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-1">📊 Pipeline 看板</h1>
        <div className="bg-amber-950/30 border border-amber-800/50 rounded-lg px-4 py-2 flex items-center gap-4">
          <p className="text-amber-300 text-sm">
            今日行動：處理卡關超過 14 天的案件，更新下一步行動
          </p>
          {stuckCount > 0 && (
            <span className="flex-shrink-0 px-2 py-0.5 rounded-full bg-yellow-500 text-gray-900 text-xs font-bold">
              {stuckCount} 卡關
            </span>
          )}
        </div>
      </div>

      {/* Monthly Summary */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
          <p className="text-gray-500 text-xs mb-1">本月預計 Close</p>
          <p className="text-green-400 text-2xl font-bold">
            ${monthlyValue > 0 ? (monthlyValue / 1000).toFixed(0) + 'K' : '0'}
          </p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
          <p className="text-gray-500 text-xs mb-1">卡關件數</p>
          <p className="text-yellow-400 text-2xl font-bold">{stuckCount}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
          <p className="text-gray-500 text-xs mb-1">總商機數</p>
          <p className="text-white text-2xl font-bold">{items.length}</p>
        </div>
      </div>

      {/* Kanban */}
      <PipelineKanban items={items} />
    </div>
  );
}
