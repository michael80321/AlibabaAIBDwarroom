export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const envCheck = {
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY ? '✅ 已設定' : '❌ 未設定',
    TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN ? '✅ 已設定' : '❌ 未設定',
    TELEGRAM_CHAT_ID: process.env.TELEGRAM_CHAT_ID ? '✅ 已設定' : '❌ 未設定',
    CRON_SECRET: process.env.CRON_SECRET ? '✅ 已設定' : '❌ 未設定',
    DATABASE_URL: process.env.DATABASE_URL ? '✅ 已設定' : '❌ 未設定',
    WAR_ROOM_URL: process.env.WAR_ROOM_URL ? '✅ 已設定' : '❌ 未設定',
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  let dbCheck = {
    customers: 0,
    prospects: 0,
    prospectsToday: 0,
    partnerProspects: 0,
    partnerProspectsToday: 0,
    strategies: 0,
    news: 0,
  };
  try {
    const [customers, prospects, prospectsToday, partnerProspects, partnerProspectsToday, strategies, news] =
      await Promise.all([
        prisma.customer.count(),
        prisma.prospectRecommendation.count(),
        prisma.prospectRecommendation.count({ where: { recommended_date: { gte: today, lt: tomorrow } } }),
        prisma.partnerProspect.count(),
        prisma.partnerProspect.count({ where: { recommended_date: { gte: today, lt: tomorrow } } }),
        prisma.dailyStrategy.count(),
        prisma.cloudVendorNews.count(),
      ]);
    dbCheck = { customers, prospects, prospectsToday, partnerProspects, partnerProspectsToday, strategies, news };
  } catch (e) {
    return NextResponse.json({ env: envCheck, db: { error: String(e) } });
  }

  return NextResponse.json({ env: envCheck, db: dbCheck });
}
