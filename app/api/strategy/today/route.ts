export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateDailyStrategy } from '@/lib/claude';

export async function GET() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Check if today's strategy exists
  let strategy = await prisma.dailyStrategy.findUnique({
    where: { date: today },
  });

  if (!strategy) {
    // Generate on demand
    const attackNowCustomers = await prisma.customer.findMany({
      where: { priority_label: 'Attack Now' },
      orderBy: { priority_score: 'desc' },
    });

    const stuckPipeline = await prisma.pipelineStage.findMany({
      where: {
        entered_at: { lte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) },
        stage: { notIn: ['close', 'lost', 'hold'] },
      },
      include: { customer: true },
    });

    const todayNews = await prisma.cloudVendorNews.findMany({
      where: {
        published_at: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
      orderBy: { published_at: 'desc' },
      take: 10,
    });

    const recentIncidents = await prisma.statusIncident.findMany({
      where: { resolved_at: null },
      orderBy: { started_at: 'desc' },
    });

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
}
