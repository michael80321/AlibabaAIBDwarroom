export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const record = await prisma.outreachRecord.update({
    where: { id: params.id },
    data: { status: 'sent', sent_at: new Date() },
  });

  // Update customer last_contacted if linked
  if (record.customer_id) {
    await prisma.customer.update({
      where: { id: record.customer_id },
      data: { last_contacted: new Date() },
    });
  }

  return NextResponse.json({ record });
}
