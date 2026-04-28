import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status') ?? 'draft';
  const scenario = searchParams.get('scenario');

  const records = await prisma.outreachRecord.findMany({
    where: {
      status: status === 'all' ? undefined : status,
      ...(scenario ? { scenario } : {}),
    },
    orderBy: { created_at: 'desc' },
    take: 100,
  });

  return NextResponse.json({ records });
}
