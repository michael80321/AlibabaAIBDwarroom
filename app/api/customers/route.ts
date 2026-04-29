export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { scoreAndUpdateCustomer } from '@/lib/scoring';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const label = searchParams.get('label');
  const entry_point = searchParams.get('entry_point');
  const industry = searchParams.get('industry');
  const search = searchParams.get('search');

  const where: Record<string, unknown> = {};

  if (label) where.priority_label = label;
  if (industry) where.industry = { contains: industry, mode: 'insensitive' };
  if (search) where.company_name = { contains: search, mode: 'insensitive' };
  if (entry_point) where.entry_points = { has: entry_point };

  const customers = await prisma.customer.findMany({
    where,
    include: {
      score_breakdown: true,
      pipeline_stages: { orderBy: { entered_at: 'desc' }, take: 1 },
      contacts: true,
    },
    orderBy: { priority_score: 'desc' },
  });

  return NextResponse.json(customers);
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  const customer = await prisma.customer.create({
    data: {
      company_name: body.company_name,
      industry: body.industry,
      region: body.region,
      company_size: body.company_size,
      website: body.website,
      current_cloud: body.current_cloud,
      entry_points: body.entry_points || [],
      estimated_arr: body.estimated_arr ? parseInt(body.estimated_arr) : null,
      why_now: body.why_now,
      opening_pitch: body.opening_pitch,
      pain_points: body.pain_points || [],
      tech_stack: body.tech_stack || [],
    },
  });

  // Trigger scoring in background
  scoreAndUpdateCustomer(customer.id).catch(console.error);

  return NextResponse.json(customer, { status: 201 });
}
