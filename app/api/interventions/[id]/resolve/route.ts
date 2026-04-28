import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { action } = await req.json() as { action: 'approve' | 'reject' | 'resolve' };

  const statusMap: Record<string, string> = {
    approve: 'approved',
    reject: 'rejected',
    resolve: 'resolved',
  };

  const newStatus = statusMap[action] ?? 'resolved';

  const item = await prisma.interventionItem.update({
    where: { id: params.id },
    data: { status: newStatus, resolved_at: new Date() },
  });

  return NextResponse.json({ item });
}
