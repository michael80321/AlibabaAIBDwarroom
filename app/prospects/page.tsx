export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';
import ProspectsClient from './ProspectsClient';

const DAILY_BATCH = 500;

async function autoReleaseTodayIfNeeded(today: Date, tomorrow: Date) {
  const todayCount = await prisma.prospectRecommendation.count({
    where: { recommended_date: { gte: today, lt: tomorrow } },
  });
  if (todayCount >= DAILY_BATCH) return todayCount;

  // Release ALL pending records at once, not just oldest X
  const candidates = await prisma.prospectRecommendation.findMany({
    where: { status: 'new', recommended_date: { lt: today } },
    orderBy: { recommended_date: 'asc' },
  });
  if (candidates.length > 0) {
    const releaseTime = new Date(today);
    releaseTime.setHours(7, 0, 0, 0);
    await prisma.prospectRecommendation.updateMany({
      where: { id: { in: candidates.map((p) => p.id) } },
      data: { recommended_date: releaseTime },
    });
  }
  return todayCount + candidates.length;
}

async function getData() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const todayCount = await autoReleaseTodayIfNeeded(today, tomorrow);

  const [allProspects, customers] = await Promise.all([
    prisma.prospectRecommendation.findMany({
      orderBy: [{ recommended_date: 'desc' }, { created_at: 'desc' }],
    }),
    prisma.customer.findMany({
      orderBy: { priority_score: 'desc' },
    }),
  ]);
  return { prospects: allProspects, todayCount, customers };
}

export default async function ProspectsPage() {
  const { prospects, todayCount, customers } = await getData();
  return <ProspectsClient prospects={prospects} todayCount={todayCount} customers={customers} />;
}
