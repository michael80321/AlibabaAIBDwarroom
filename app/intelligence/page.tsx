export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';
import IntelligenceClient from './IntelligenceClient';

async function getIntelligenceData() {
  const vendors = ['AWS', 'Azure', 'GCP', 'Cloudflare', 'Alibaba', 'Tencent', 'Oracle', 'Huawei'];

  const [allStatuses, incidents, news, partners] = await Promise.all([
    prisma.serviceStatus.findMany({
      orderBy: { checked_at: 'desc' },
    }),
    prisma.statusIncident.findMany({
      orderBy: { started_at: 'desc' },
      take: 10,
    }),
    prisma.cloudVendorNews.findMany({
      orderBy: { published_at: 'desc' },
      take: 50,
    }),
    prisma.partner.findMany({
      orderBy: { name: 'asc' },
    }),
  ]);

  // Get latest status per vendor
  const vendorMap = new Map<string, (typeof allStatuses)[0]>();
  for (const s of allStatuses) {
    if (!vendorMap.has(s.vendor)) vendorMap.set(s.vendor, s);
  }
  const latestStatuses = vendors.map((v) => vendorMap.get(v) || null).filter(Boolean);

  return { latestStatuses, incidents, news, partners };
}

export default async function IntelligencePage() {
  const { latestStatuses, incidents, news, partners } = await getIntelligenceData();

  return <IntelligenceClient statuses={latestStatuses} incidents={incidents} news={news} partners={partners} />;
}
