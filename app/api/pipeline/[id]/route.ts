export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await req.json();

  const stage = await prisma.pipelineStage.update({
    where: { id: params.id },
    data: {
      stage: body.stage,
      blockers: body.blockers,
      risk_level: body.risk_level,
      next_action: body.next_action,
      next_action_due: body.next_action_due ? new Date(body.next_action_due) : null,
      expected_close: body.expected_close ? new Date(body.expected_close) : null,
      deal_value: body.deal_value,
      notes: body.notes,
    },
  });

  return NextResponse.json(stage);
}
