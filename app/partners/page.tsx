export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';
import PartnersClient from './PartnersClient';

async function getData() {
  const [activePartners, prospects] = await Promise.all([
    prisma.partner.findMany({ orderBy: { name: 'asc' } }),
    prisma.partnerProspect.findMany({ orderBy: { recommended_date: 'desc' } }),
  ]);
  return { activePartners, prospects };
}

export default async function PartnersPage() {
  const { activePartners, prospects } = await getData();
  return <PartnersClient activePartners={activePartners} prospects={prospects} />;
}
