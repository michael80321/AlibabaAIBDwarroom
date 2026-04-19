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
  const partner = await prisma.partner.update({
    where: { id: params.id },
    data: {
      name: body.name,
      type: body.type,
      services: body.services,
      regions: body.regions,
      cloud_alliances: body.cloud_alliances,
      cooperation_type: body.cooperation_type,
      contact_info: body.contact_info,
      notes: body.notes,
    },
  });
  return NextResponse.json(partner);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  await prisma.partner.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
