import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');

  const partnerProspects = await prisma.partnerProspect.findMany({
    where: status ? { status } : undefined,
    orderBy: { recommended_date: 'desc' },
  });
  return NextResponse.json(partnerProspects);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const prospect = await prisma.partnerProspect.create({
    data: {
      name: body.name,
      type: body.type,
      region: body.region,
      description: body.description,
      services: body.services ?? [],
      why_partner: body.why_partner,
      cooperation_type: body.cooperation_type,
      status: body.status ?? 'new',
      status_reason: body.status_reason,
    },
  });
  return NextResponse.json(prospect, { status: 201 });
}
