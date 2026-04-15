export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

  const stuck = await prisma.pipelineStage.findMany({
    where: {
      entered_at: { lte: fourteenDaysAgo },
      stage: { notIn: ['close', 'lost', 'hold'] },
    },
    include: {
      customer: {
        select: {
          id: true,
          company_name: true,
          priority_label: true,
          priority_score: true,
        },
      },
    },
    orderBy: { entered_at: 'asc' },
  });

  return NextResponse.json(stuck);
}
