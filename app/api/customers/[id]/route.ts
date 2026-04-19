import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const customer = await prisma.customer.findUnique({
    where: { id: params.id },
    include: {
      contacts: true,
      pipeline_stages: { orderBy: { entered_at: 'desc' } },
      meeting_notes: { orderBy: { meeting_date: 'desc' } },
      score_breakdown: true,
    },
  });

  if (!customer) {
    return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
  }

  return NextResponse.json(customer);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await req.json();

  const FIELDS = [
    'company_name', 'industry', 'region', 'company_size', 'website',
    'current_cloud', 'priority_label', 'entry_points', 'estimated_arr',
    'why_now', 'opening_pitch', 'pain_points', 'tech_stack',
  ] as const;

  const data = Object.fromEntries(
    FIELDS.filter((f) => f in body).map((f) => [f, body[f]])
  );

  const customer = await prisma.customer.update({
    where: { id: params.id },
    data,
  });

  return NextResponse.json(customer);
}
