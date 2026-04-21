import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateDailyStrategy, generateWeeklyStrategy } from '@/lib/claude';
import { sendDailyBriefing, sendWeeklyBriefing } from '@/lib/telegram';

function verifyCronSecret(req: NextRequest): boolean {
  const secret = req.headers.get('x-cron-secret');
  return secret === process.env.CRON_SECRET;
}

export async function POST(req: NextRequest) {
  if (!verifyCronSecret(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const isWeekly = searchParams.get('weekly') === 'true';
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  try {
    if (isWeekly) {
      // --- 週策略 ---
      const [allCustomers, pipelineItems, weekNews, pastStrategies] = await Promise.all([
        prisma.customer.findMany({
          where: { priority_label: { not: 'Dead' } },
          orderBy: { priority_score: 'desc' },
        }),
        prisma.pipelineStage.findMany({
          where: { stage: { notIn: ['close', 'lost'] } },
          include: { customer: true },
          orderBy: { entered_at: 'asc' },
        }),
        prisma.cloudVendorNews.findMany({
          where: { published_at: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
          orderBy: { published_at: 'desc' },
          take: 20,
        }),
        prisma.dailyStrategy.findMany({
          orderBy: { date: 'desc' },
          take: 5,
        }),
      ]);

      const result = await generateWeeklyStrategy({ allCustomers, pipelineItems, weekNews, pastStrategies });

      if (!result) {
        return NextResponse.json(
          { error: 'Weekly strategy generation failed - Claude API returned null.' },
          { status: 500 }
        );
      }

      const strategy = await prisma.dailyStrategy.upsert({
        where: { date: today },
        create: {
          date: today,
          top3_actions: result.top3_actions,
          weekly_focus: result.weekly_focus,
          monthly_direction: result.monthly_direction,
          abandon_list: result.abandon_list,
        },
        update: {
          top3_actions: result.top3_actions,
          weekly_focus: result.weekly_focus,
          monthly_direction: result.monthly_direction,
          abandon_list: result.abandon_list,
          generated_at: new Date(),
        },
      });

      await sendWeeklyBriefing(result.weekly_focus, result.monthly_direction, result.top3_actions);

      return NextResponse.json({ success: true, mode: 'weekly', strategy });
    }

    // --- 日策略 ---
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
        { error: 'Strategy generation failed - Claude API returned null. Check ANTHROPIC_API_KEY and model name.' },
        { status: 500 }
      );
    }

    const strategy = await prisma.dailyStrategy.upsert({
      where: { date: today },
      create: {
        date: today,
        top3_actions: result.top3_actions,
        weekly_focus: result.weekly_focus,
        abandon_list: result.abandon_list,
      },
      update: {
        top3_actions: result.top3_actions,
        weekly_focus: result.weekly_focus,
        abandon_list: result.abandon_list,
        generated_at: new Date(),
      },
    });

    await sendDailyBriefing(strategy);

    return NextResponse.json({ success: true, mode: 'daily', strategy });
  } catch (error) {
    console.error('[cron/gen-strategy]', error);
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: 'Internal error', detail: msg }, { status: 500 });
  }
}
