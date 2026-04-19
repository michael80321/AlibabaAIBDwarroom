import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const partners = await prisma.partner.findMany({
    orderBy: { name: 'asc' },
  });
  return NextResponse.json(partners);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const partner = await prisma.partner.create({
    data: {
      name: body.name,
      type: body.type,
      services: body.services ?? [],
      regions: body.regions ?? [],
      cloud_alliances: body.cloud_alliances ?? [],
      cooperation_type: body.cooperation_type ?? 'monitor',
      contact_info: body.contact_info,
      notes: body.notes,
    },
  });
  return NextResponse.json(partner, { status: 201 });
}
