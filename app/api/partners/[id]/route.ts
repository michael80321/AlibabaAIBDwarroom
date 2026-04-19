import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const partner = await prisma.partner.findUnique({ where: { id: params.id } });
  if (!partner) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(partner);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await req.json();
  const FIELDS = ['name', 'type', 'services', 'regions', 'cloud_alliances', 'cooperation_type', 'contact_info', 'notes'] as const;
  const data = Object.fromEntries(FIELDS.filter((f) => f in body).map((f) => [f, body[f]]));
  const partner = await prisma.partner.update({ where: { id: params.id }, data });
  return NextResponse.json(partner);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  await prisma.partner.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
