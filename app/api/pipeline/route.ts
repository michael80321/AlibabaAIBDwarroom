export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const stage = searchParams.get('stage');
  const risk_level = searchParams.get('risk_level');

  const where: Record<string, unknown> = {};
  if (stage) where.stage = stage;
  if (risk_level) where.risk_level = risk_level;

  const pipeline = await prisma.pipelineStage.findMany({
    where,
    include: {
      customer: {
        select: {
          id: true,
          company_name: true,
          industry: true,
          priority_label: true,
          priority_score: true,
        },
      },
    },
    orderBy: { entered_at: 'asc' },
  });

  return NextResponse.json(pipeline);
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  const stage = await prisma.pipelineStage.create({
    data: {
      customer_id: body.customer_id,
      stage: body.stage,
      expected_close: body.expected_close ? new Date(body.expected_close) : null,
      deal_value: body.deal_value ? parseInt(body.deal_value) : null,
      blockers: body.blockers,
      risk_level: body.risk_level || 'medium',
      next_action: body.next_action,
      next_action_due: body.next_action_due ? new Date(body.next_action_due) : null,
      notes: body.notes,
    },
  });

  return NextResponse.json(stage, { status: 201 });
}
