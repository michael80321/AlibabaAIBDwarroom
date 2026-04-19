import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const envCheck = {
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY ? '✅ 已設定' : '❌ 未設定',
    TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN ? '✅ 已設定' : '❌ 未設定',
    TELEGRAM_CHAT_ID: process.env.TELEGRAM_CHAT_ID ? '✅ 已設定' : '❌ 未設定',
    CRON_SECRET: process.env.CRON_SECRET ? '✅ 已設定' : '❌ 未設定',
    DATABASE_URL: process.env.DATABASE_URL ? '✅ 已設定' : '❌ 未設定',
  };

  let dbCheck = { customers: 0, prospects: 0, partnerProspects: 0, strategies: 0 };
  try {
    const [customers, prospects, partnerProspects, strategies] = await Promise.all([
      prisma.customer.count(),
      prisma.prospectRecommendation.count(),
      prisma.partnerProspect.count(),
      prisma.dailyStrategy.count(),
    ]);
    dbCheck = { customers, prospects, partnerProspects, strategies };
  } catch (e) {
    return NextResponse.json({ env: envCheck, db: { error: String(e) } });
  }

  return NextResponse.json({ env: envCheck, db: dbCheck });
}
