import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status') ?? 'pending';

  const items = await prisma.interventionItem.findMany({
    where: status === 'all' ? {} : { status },
    orderBy: [
      { priority: 'asc' }, // high first
      { created_at: 'desc' },
    ],
    take: 50,
  });

  // Sort by priority manually (high > medium > low)
  const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
  items.sort((a, b) => (priorityOrder[a.priority] ?? 1) - (priorityOrder[b.priority] ?? 1));

  return NextResponse.json({ items });
}
