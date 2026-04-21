export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';
import PartnersClient from './PartnersClient';

const DAILY_BATCH = 10;

async function autoReleaseTodayIfNeeded(today: Date, tomorrow: Date) {
  const todayCount = await prisma.partnerProspect.count({
    where: { recommended_date: { gte: today, lt: tomorrow } },
  });
  if (todayCount >= DAILY_BATCH) return todayCount;

  const needed = DAILY_BATCH - todayCount;
  const candidates = await prisma.partnerProspect.findMany({
    where: { status: 'new', recommended_date: { lt: today } },
    orderBy: { recommended_date: 'asc' },
    take: needed,
  });
  if (candidates.length > 0) {
    const releaseTime = new Date(today);
    releaseTime.setHours(7, 0, 0, 0);
    await prisma.partnerProspect.updateMany({
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

  const [activePartners, prospects] = await Promise.all([
    prisma.partner.findMany({ orderBy: { name: 'asc' } }),
    prisma.partnerProspect.findMany({ orderBy: [{ recommended_date: 'desc' }, { created_at: 'desc' }] }),
  ]);
  return { activePartners, prospects, todayCount };
}

export default async function PartnersPage() {
  const { activePartners, prospects, todayCount } = await getData();
  return <PartnersClient activePartners={activePartners} prospects={prospects} todayCount={todayCount} />;
}
