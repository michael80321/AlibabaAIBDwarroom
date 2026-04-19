export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateDailyStrategy } from '@/lib/claude';

export async function GET() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let strategy = await prisma.dailyStrategy.findUnique({
      where: { date: today },
    });

    if (!strategy) {
      const [attackNowCustomers, stuckPipeline, todayNews, recentIncidents] = await Promise.all([
        prisma.customer.findMany({
          where: { priority_label: 'Attack Now' },
          orderBy: { priority_score: 'desc' },
        }),
        prisma.pipelineStage.findMany({
          where: {
            entered_at: { lte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) },
            stage: { notIn: ['close', 'lost', 'hold'] },
          },
          include: { customer: true },
        }),
        prisma.cloudVendorNews.findMany({
          where: { published_at: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
          orderBy: { published_at: 'desc' },
          take: 10,
        }),
        prisma.statusIncident.findMany({
          where: { resolved_at: null },
          orderBy: { started_at: 'desc' },
        }),
      ]);

      const result = await generateDailyStrategy({
        attackNowCustomers,
        stuckPipeline,
        todayNews,
        recentIncidents,
      });

      if (!result) {
        return NextResponse.json(
          { error: '生成失敗，請檢查 ANTHROPIC_API_KEY 環境變數' },
          { status: 500 }
        );
      }

      strategy = await prisma.dailyStrategy.create({
        data: {
          date: today,
          top3_actions: result.top3_actions,
          weekly_focus: result.weekly_focus,
          abandon_list: result.abandon_list,
        },
      });
    }

    return NextResponse.json(strategy);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[strategy/today]', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
