export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';
import ProspectsClient from './ProspectsClient';

async function getData() {
  const [prospects, customers] = await Promise.all([
    prisma.prospectRecommendation.findMany({
      orderBy: [{ recommended_date: 'desc' }, { created_at: 'desc' }],
    }),
    prisma.customer.findMany({
      orderBy: { priority_score: 'desc' },
    }),
  ]);
  return { prospects, customers };
}

export default async function ProspectsPage() {
  const { prospects, customers } = await getData();
  return <ProspectsClient prospects={prospects} customers={customers} />;
}
