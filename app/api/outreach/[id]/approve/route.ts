import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const record = await prisma.outreachRecord.update({
    where: { id: params.id },
    data: { status: 'approved', approved_at: new Date() },
  });

  return NextResponse.json({ record });
}
