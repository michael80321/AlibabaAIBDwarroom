export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { fetchAllVendorNews } from '@/lib/news-fetcher';
import { checkAllVendorStatus } from '@/lib/status-monitor';

// Internal trigger — no cron secret needed, but only callable server-side via same origin
// (not exposed to public internet with secret)

const ACTIONS: Record<string, () => Promise<unknown>> = {
  'release-prospects': async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayCount = await prisma.prospectRecommendation.count({
      where: { recommended_date: { gte: today, lt: tomorrow } },
    });

    const needed = Math.max(0, 25 - todayCount);
    if (needed === 0) return { message: '今日已有 25 筆，無需釋出', released: 0 };

    const candidates = await prisma.prospectRecommendation.findMany({
      where: { status: 'new', recommended_date: { lt: today } },
      orderBy: { recommended_date: 'asc' },
      take: needed,
    });

    if (candidates.length === 0) return { message: '沒有可釋出的候選', released: 0 };

    const releaseTime = new Date(today);
    releaseTime.setHours(7, 0, 0, 0);
    await prisma.prospectRecommendation.updateMany({
      where: { id: { in: candidates.map((p) => p.id) } },
      data: { recommended_date: releaseTime },
    });
    return { released: candidates.length };
  },

  'release-partner-prospects': async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayCount = await prisma.partnerProspect.count({
      where: { recommended_date: { gte: today, lt: tomorrow } },
    });

    const needed = Math.max(0, 10 - todayCount);
    if (needed === 0) return { message: '今日已有 10 筆，無需釋出', released: 0 };

    const candidates = await prisma.partnerProspect.findMany({
      where: { status: 'new', recommended_date: { lt: today } },
      orderBy: { recommended_date: 'asc' },
      take: needed,
    });

    if (candidates.length === 0) return { message: '沒有可釋出的候選', released: 0 };

    const releaseTime = new Date(today);
    releaseTime.setHours(7, 0, 0, 0);
    await prisma.partnerProspect.updateMany({
      where: { id: { in: candidates.map((p) => p.id) } },
      data: { recommended_date: releaseTime },
    });
    return { released: candidates.length };
  },

  'fetch-news': async () => {
    await fetchAllVendorNews(false);
    return { message: '新聞抓取完成（含 AI 摘要）' };
  },

  'check-status': async () => {
    await checkAllVendorStatus();
    return { message: '雲廠商狀態更新完成' };
  },
};

export async function POST(req: NextRequest) {
  const { action } = await req.json() as { action: string };

  if (!ACTIONS[action]) {
    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  }

  try {
    const result = await ACTIONS[action]();
    return NextResponse.json({ success: true, action, result });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
