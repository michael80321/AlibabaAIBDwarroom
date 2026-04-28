import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generatePricingComparison } from '@/lib/claude';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const customer = await prisma.customer.findUnique({ where: { id: params.id } });
  if (!customer) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await req.json().catch(() => ({}));

  const result = await generatePricingComparison(
    {
      company_name: customer.company_name,
      industry: customer.industry,
      current_cloud: customer.current_cloud,
      entry_points: customer.entry_points,
      estimated_arr: customer.estimated_arr,
    },
    body.requirements
  );

  if (!result) return NextResponse.json({ error: 'Generation failed' }, { status: 500 });

  return NextResponse.json(result);
}
