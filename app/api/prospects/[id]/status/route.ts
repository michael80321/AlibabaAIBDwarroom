export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

function industryFromCategory(category: string): string {
  const map: Record<string, string> = {
    enterprise: 'Enterprise',
    igaming: 'iGaming',
    adult: 'Adult Entertainment',
    cloud_ai: 'Cloud / AI',
    ecommerce: 'E-commerce',
    fintech: 'Fintech',
  };
  return map[category] || 'Other';
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const { status, status_reason, reason } = body as { status: string; status_reason?: string; reason?: string };
    const finalReason = reason || status_reason || null;

    const prospect = await prisma.prospectRecommendation.findUnique({
      where: { id: params.id },
    });
    if (!prospect) {
      return NextResponse.json({ error: 'Prospect not found' }, { status: 404 });
    }

    // If status === 'pipeline', create Customer + PipelineStage
    if (status === 'pipeline') {
      const existing = await prisma.customer.findFirst({
        where: { company_name: prospect.company_name },
      });
      let customerId = existing?.id;
      if (!existing) {
        const newCustomer = await prisma.customer.create({
          data: {
            company_name: prospect.company_name,
            industry: industryFromCategory(prospect.category),
            region: prospect.region,
            company_size: prospect.headcount || null,
            website: prospect.website || null,
            priority_label: 'Nurture',
            priority_score: 50,
            entry_points: prospect.tech_stack.slice(0, 3),
            estimated_arr: prospect.estimated_arr || null,
            why_now: prospect.why_alibaba || null,
            pain_points: [],
            tech_stack: prospect.tech_stack,
          },
        });
        customerId = newCustomer.id;
        await prisma.pipelineStage.create({
          data: {
            customer_id: customerId,
            stage: 'lead',
            risk_level: 'medium',
            next_action: '初次聯繫',
            notes: `從每日推薦名單轉入。來源描述：${prospect.description || '無'}`,
          },
        });
      }
    }

    const updated = await prisma.prospectRecommendation.update({
      where: { id: params.id },
      data: { status, status_reason: finalReason },
    });

    return NextResponse.json(updated);
  } catch (e) {
    console.error('[prospects/status]', e);
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: 'Internal error', detail: msg }, { status: 500 });
  }
}
