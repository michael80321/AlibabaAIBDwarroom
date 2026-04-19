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
  const prospect = await prisma.partnerProspect.update({
    where: { id: params.id },
    data: {
      name: body.name,
      type: body.type,
      region: body.region,
      description: body.description,
      services: body.services,
      why_partner: body.why_partner,
      cooperation_type: body.cooperation_type,
      status: body.status,
      status_reason: body.status_reason,
    },
  });
  return NextResponse.json(prospect);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  await prisma.partnerProspect.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
