export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';
import PartnersClient from './PartnersClient';

async function getData() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [activePartners, prospects, todayCount] = await Promise.all([
    prisma.partner.findMany({ orderBy: { name: 'asc' } }),
    prisma.partnerProspect.findMany({ orderBy: [{ recommended_date: 'desc' }, { created_at: 'desc' }] }),
    prisma.partnerProspect.count({
      where: { recommended_date: { gte: today, lt: tomorrow } },
    }),
  ]);
  return { activePartners, prospects, todayCount };
}

export default async function PartnersPage() {
  const { activePartners, prospects, todayCount } = await getData();
  return <PartnersClient activePartners={activePartners} prospects={prospects} todayCount={todayCount} />;
}
