export const dynamic = 'force-dynamic';
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

  const customer = await prisma.customer.update({
    where: { id: params.id },
    data: {
      company_name: body.company_name,
      industry: body.industry,
      region: body.region,
      company_size: body.company_size,
      website: body.website,
      current_cloud: body.current_cloud,
      priority_label: body.priority_label,
      entry_points: body.entry_points,
      estimated_arr: body.estimated_arr,
      why_now: body.why_now,
      opening_pitch: body.opening_pitch,
      pain_points: body.pain_points,
      tech_stack: body.tech_stack,
    },
  });

  return NextResponse.json(customer);
}
