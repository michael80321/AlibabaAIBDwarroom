export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';
import ProspectsClient from './ProspectsClient';

async function getData() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [allProspects, todayCount, customers] = await Promise.all([
    prisma.prospectRecommendation.findMany({
      orderBy: [{ recommended_date: 'desc' }, { created_at: 'desc' }],
    }),
    prisma.prospectRecommendation.count({
      where: { recommended_date: { gte: today, lt: tomorrow } },
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
