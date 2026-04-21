export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

function verifyCronSecret(req: NextRequest): boolean {
  const secret = req.headers.get('x-cron-secret');
  return secret === process.env.CRON_SECRET;
}

const DAILY_BATCH_SIZE = 10;

export async function POST(req: NextRequest) {
  if (!verifyCronSecret(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayCount = await prisma.partnerProspect.count({
      where: { recommended_date: { gte: today, lt: tomorrow } },
    });

    if (todayCount >= DAILY_BATCH_SIZE) {
      return NextResponse.json({
        message: `Already released ${todayCount} partner prospects today, skipping`,
        released: 0,
      });
    }

    const needed = DAILY_BATCH_SIZE - todayCount;

    const candidates = await prisma.partnerProspect.findMany({
      where: {
        status: 'new',
        recommended_date: { lt: today },
      },
      orderBy: { recommended_date: 'asc' },
      take: needed,
    });

    if (candidates.length === 0) {
      return NextResponse.json({
        message: 'No eligible partner prospects to release',
        released: 0,
      });
    }

    const releaseTime = new Date(today);
    releaseTime.setHours(7, 0, 0, 0);

    await prisma.partnerProspect.updateMany({
      where: { id: { in: candidates.map((p) => p.id) } },
      data: { recommended_date: releaseTime },
    });

    return NextResponse.json({
      success: true,
      released: candidates.length,
      timestamp: new Date().toISOString(),
    });
  } catch (e) {
    console.error('[cron/release-partner-prospects]', e);
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: 'Internal error', detail: msg }, { status: 500 });
  }
}
