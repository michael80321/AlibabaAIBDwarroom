export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';
import IntelligenceClient from './IntelligenceClient';

async function getIntelligenceData() {
  const vendors = ['AWS', 'Azure', 'GCP', 'Cloudflare', 'Alibaba', 'Tencent', 'Oracle', 'Huawei'];

  const [allStatuses, incidents, news, partners, customers] = await Promise.all([
    prisma.serviceStatus.findMany({ orderBy: { checked_at: 'desc' } }),
    prisma.statusIncident.findMany({ orderBy: { started_at: 'desc' }, take: 20 }),
    prisma.cloudVendorNews.findMany({ orderBy: { published_at: 'desc' }, take: 80 }),
    prisma.partner.findMany({ orderBy: { name: 'asc' } }),
    // Fetch customers with their current cloud for impact analysis
    prisma.customer.findMany({
      select: {
        id: true,
        company_name: true,
        current_cloud: true,
        priority_label: true,
        priority_score: true,
      },
      where: { priority_label: { not: 'Monitor' } },
      orderBy: { priority_score: 'desc' },
    }),
  ]);

  // Get latest status per vendor
  const vendorMap = new Map<string, (typeof allStatuses)[0]>();
  for (const s of allStatuses) {
    if (!vendorMap.has(s.vendor)) vendorMap.set(s.vendor, s);
  }
  const latestStatuses = vendors.map((v) => vendorMap.get(v) || null);

  // Group customers by current_cloud for impact analysis
  const customersByCloud: Record<string, typeof customers> = {};
  for (const c of customers) {
    const cloud = c.current_cloud || 'Unknown';
    if (!customersByCloud[cloud]) customersByCloud[cloud] = [];
    customersByCloud[cloud].push(c);
  }

  return { latestStatuses, incidents, news, partners, customersByCloud };
}

export default async function IntelligencePage() {
  const { latestStatuses, incidents, news, partners, customersByCloud } = await getIntelligenceData();

  return (
    <IntelligenceClient
      statuses={latestStatuses}
      incidents={incidents}
      news={news}
      partners={partners}
      customersByCloud={customersByCloud}
    />
  );
}
