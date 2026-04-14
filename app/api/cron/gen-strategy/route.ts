import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateDailyStrategy } from '@/lib/claude';
import { sendDailyBriefing } from '@/lib/telegram';

function verifyCronSecret(req: NextRequest): boolean {
  const secret = req.headers.get('x-cron-secret');
  return secret === process.env.CRON_SECRET;
}

export async function POST(req: NextRequest) {
  if (!verifyCronSecret(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const attackNowCustomers = await prisma.customer.findMany({
      where: { priority_label: 'Attack Now' },
      orderBy: { priority_score: 'desc' },
    });

    const stuckPipeline = await prisma.pipelineStage.findMany({
      where: {
        entered_at: { lte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) },
        stage: { notIn: ['close', 'lost'] },
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
      return NextResponse.json({ error: 'Strategy generation failed - Claude API returned null. Check ANTHROPIC_API_KEY and model name.' }, { status: 500 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

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

    return NextResponse.json({ success: true, strategy });
  } catch (error) {
    console.error('[cron/gen-strategy]', error);
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: 'Internal error', detail: msg }, { status: 500 });
  }
}
