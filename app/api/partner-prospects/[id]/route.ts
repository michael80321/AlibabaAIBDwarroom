import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const prospect = await prisma.partnerProspect.findUnique({ where: { id: params.id } });
  if (!prospect) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(prospect);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await req.json();
  const FIELDS = ['name', 'type', 'region', 'description', 'services', 'why_partner', 'cooperation_type', 'status', 'status_reason'] as const;
  const data = Object.fromEntries(FIELDS.filter((f) => f in body).map((f) => [f, body[f]]));
  const prospect = await prisma.partnerProspect.update({ where: { id: params.id }, data });
  return NextResponse.json(prospect);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  await prisma.partnerProspect.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
