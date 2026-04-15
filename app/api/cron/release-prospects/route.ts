export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

function verifyCronSecret(req: NextRequest): boolean {
  const secret = req.headers.get('x-cron-secret');
  return secret === process.env.CRON_SECRET;
}

// 每天把 "pool" 中尚未釋出的 prospect 釋出 20-30 筆
// "pool" = recommended_date 是未來日期或是超過 30 天前（代表是舊 seed 備用）
// 釋出 = 把 recommended_date 設為今天

const DAILY_BATCH_SIZE = 25;

export async function POST(req: NextRequest) {
  if (!verifyCronSecret(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Check if we already released today
    const todayCount = await prisma.prospectRecommendation.count({
      where: { recommended_date: { gte: today, lt: tomorrow } },
    });

    if (todayCount >= DAILY_BATCH_SIZE) {
      return NextResponse.json({
        message: `Already released ${todayCount} prospects today, skipping`,
        released: 0,
      });
    }

    const needed = DAILY_BATCH_SIZE - todayCount;

    // Find unreleased prospects: future date (pre-loaded pool)
    // or status still 'new' and recommended_date > 14 days ago (old seed data we can recycle)
    const futureDate = new Date(today.getTime() + 24 * 60 * 60 * 1000); // tomorrow onwards = pool
    const pool = await prisma.prospectRecommendation.findMany({
      where: {
        recommended_date: { gt: futureDate },
        status: 'new',
      },
      orderBy: { recommended_date: 'asc' },
      take: needed,
    });

    let released = pool.length;

    // If pool is empty, recycle old new-status prospects that are >30 days old
    if (released < needed) {
      const oldDate = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
      const recycled = await prisma.prospectRecommendation.findMany({
        where: {
          recommended_date: { lt: oldDate },
          status: 'new',
        },
        orderBy: { created_at: 'asc' },
        take: needed - released,
      });

      if (recycled.length > 0) {
        await prisma.prospectRecommendation.updateMany({
          where: { id: { in: recycled.map((p) => p.id) } },
          data: { recommended_date: today },
        });
        released += recycled.length;
      }
    }

    if (pool.length > 0) {
      // Set release time to today (07:00)
      const releaseTime = new Date(today);
      releaseTime.setHours(7, 0, 0, 0);
      await prisma.prospectRecommendation.updateMany({
        where: { id: { in: pool.map((p) => p.id) } },
        data: { recommended_date: releaseTime },
      });
    }

    return NextResponse.json({
      success: true,
      released,
      timestamp: new Date().toISOString(),
    });
  } catch (e) {
    console.error('[cron/release-prospects]', e);
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: 'Internal error', detail: msg }, { status: 500 });
  }
}
