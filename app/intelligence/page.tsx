export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';
import IntelligenceClient from './IntelligenceClient';
import { fetchAllVendorNews } from '@/lib/news-fetcher';
import { checkAllVendorStatus } from '@/lib/status-monitor';

async function autoFetchIfStale() {
  const since = new Date(Date.now() - 6 * 60 * 60 * 1000); // 6 小時內
  const recentCount = await prisma.cloudVendorNews.count({
    where: { created_at: { gte: since } },
  });
  if (recentCount === 0) {
    // 背景靜默抓取，不阻塞頁面渲染
    fetchAllVendorNews(true).catch(() => {});
  }

  const statusSince = new Date(Date.now() - 15 * 60 * 1000); // 15 分鐘內
  const recentStatus = await prisma.serviceStatus.count({
    where: { checked_at: { gte: statusSince } },
  });
  if (recentStatus === 0) {
    checkAllVendorStatus().catch(() => {});
  }
}

async function getIntelligenceData() {
  const vendors = ['AWS', 'Azure', 'GCP', 'Cloudflare', 'Alibaba', 'Tencent', 'Oracle', 'Huawei'];

  // 自動補充過期資料（背景執行，不等待）
  autoFetchIfStale().catch(() => {});

  const [allStatuses, incidents, news, partners, customers] = await Promise.all([
    prisma.serviceStatus.findMany({ orderBy: { checked_at: 'desc' } }),
    prisma.statusIncident.findMany({ orderBy: { started_at: 'desc' }, take: 20 }),
    prisma.cloudVendorNews.findMany({ orderBy: { published_at: 'desc' }, take: 80 }),
    prisma.partner.findMany({ orderBy: { name: 'asc' } }),
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

  const vendorMap = new Map<string, (typeof allStatuses)[0]>();
  for (const s of allStatuses) {
    if (!vendorMap.has(s.vendor)) vendorMap.set(s.vendor, s);
  }
  const latestStatuses = vendors.map((v) => vendorMap.get(v) || null);

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
