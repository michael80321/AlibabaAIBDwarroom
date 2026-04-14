import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const vendor = searchParams.get('vendor');
  const category = searchParams.get('category');
  const date = searchParams.get('date');

  const where: Record<string, unknown> = {};
  if (vendor) where.vendor = vendor;
  if (category) where.category = category;
  if (date) {
    const d = new Date(date);
    where.published_at = {
      gte: d,
      lt: new Date(d.getTime() + 24 * 60 * 60 * 1000),
    };
  }

  const news = await prisma.cloudVendorNews.findMany({
    where,
    orderBy: { published_at: 'desc' },
    take: 50,
  });

  return NextResponse.json(news);
}
