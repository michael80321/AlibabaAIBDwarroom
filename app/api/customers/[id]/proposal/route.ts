import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateCloudArchitecture } from '@/lib/claude';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const customer = await prisma.customer.findUnique({ where: { id: params.id } });
  if (!customer) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await req.json().catch(() => ({}));

  const result = await generateCloudArchitecture(
    {
      company_name: customer.company_name,
      industry: customer.industry,
      current_cloud: customer.current_cloud,
      pain_points: customer.pain_points,
      entry_points: customer.entry_points,
      tech_stack: customer.tech_stack,
      estimated_arr: customer.estimated_arr,
    },
    body.requirements
  );

  if (!result) return NextResponse.json({ error: 'Generation failed' }, { status: 500 });

  return NextResponse.json(result);
}
