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

  // Old tables
  let dbCheck: Record<string, number | string> = {};
  try {
    const [customers, prospects, prospectsToday, partnerProspects, partnerProspectsToday, strategies, news, serviceStatuses] =
      await Promise.all([
        prisma.customer.count(),
        prisma.prospectRecommendation.count(),
        prisma.prospectRecommendation.count({ where: { recommended_date: { gte: today, lt: tomorrow } } }),
        prisma.partnerProspect.count(),
        prisma.partnerProspect.count({ where: { recommended_date: { gte: today, lt: tomorrow } } }),
        prisma.dailyStrategy.count(),
        prisma.cloudVendorNews.count(),
        prisma.serviceStatus.count(),
      ]);
    dbCheck = { customers, prospects, prospectsToday, partnerProspects, partnerProspectsToday, strategies, news, serviceStatuses };
  } catch (e) {
    return NextResponse.json({ env: envCheck, db: { error: String(e) } });
  }

  // New agent tables (might not exist if migration pending)
  let agentTables: Record<string, number | string> = {};
  try {
    const [agentLogs, interventions, outreach, threads] = await Promise.all([
      prisma.agentTaskLog.count(),
      prisma.interventionItem.count(),
      prisma.outreachRecord.count(),
      prisma.customerThread.count(),
    ]);
    agentTables = { agentLogs, interventions, outreach, threads, migration: '✅ 已套用' };
  } catch (e) {
    agentTables = { migration: '❌ 未套用', error: String(e) };
  }

  // Check daily_strategies has agent_summary column
  let schemaCheck: Record<string, string> = {};
  try {
    await prisma.$queryRaw`SELECT agent_summary FROM daily_strategies LIMIT 1`;
    schemaCheck.agent_summary_column = '✅ 存在';
  } catch {
    schemaCheck.agent_summary_column = '❌ 不存在 (migration 未套用)';
  }

  return NextResponse.json({ env: envCheck, db: dbCheck, agentTables, schemaCheck });
}
