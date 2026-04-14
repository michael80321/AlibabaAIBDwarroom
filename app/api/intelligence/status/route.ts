export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  // Get latest status for each vendor
  const vendors = ['AWS', 'Azure', 'GCP', 'Cloudflare', 'Alibaba', 'Tencent', 'Oracle', 'Huawei'];

  const statuses = await Promise.all(
    vendors.map((vendor) =>
      prisma.serviceStatus.findFirst({
        where: { vendor },
        orderBy: { checked_at: 'desc' },
      })
    )
  );

  const incidents = await prisma.statusIncident.findMany({
    where: { resolved_at: null },
    orderBy: { started_at: 'desc' },
  });

  return NextResponse.json({ statuses, incidents });
}
