import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateFollowUp } from '@/lib/claude';

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const customer = await prisma.customer.findUnique({
    where: { id: params.id },
    include: {
      contacts: {
        where: { influence: { in: ['decision_maker', 'champion'] } },
        take: 1,
      },
      pipeline_stages: { orderBy: { entered_at: 'desc' }, take: 1 },
    },
  });
  if (!customer) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const contact = customer.contacts[0];
  const lastStage = customer.pipeline_stages[0];
  const daysSince = customer.last_contacted
    ? Math.floor((Date.now() - customer.last_contacted.getTime()) / (1000 * 60 * 60 * 24))
    : 30;

  const result = await generateFollowUp(
    {
      company_name: customer.company_name,
      industry: customer.industry,
      current_cloud: customer.current_cloud,
      why_now: customer.why_now,
      opening_pitch: customer.opening_pitch,
      pain_points: customer.pain_points,
    },
    {
      name: contact?.name,
      title: contact?.title ?? undefined,
      email: contact?.email ?? undefined,
    },
    daysSince,
    lastStage?.notes ?? undefined
  );

  if (!result) return NextResponse.json({ error: 'Generation failed' }, { status: 500 });

  // Save as a draft outreach record
  const record = await prisma.outreachRecord.create({
    data: {
      customer_id: customer.id,
      company_name: customer.company_name,
      contact_name: contact?.name,
      contact_email: contact?.email,
      contact_title: contact?.title,
      scenario: 'follow_up',
      subject_zh: result.subject_zh,
      body_zh: result.body_zh,
      subject_en: result.subject_en,
      body_en: result.body_en,
      notes: result.reason,
      status: 'draft',
    },
  });

  return NextResponse.json({ ...result, outreach_id: record.id });
}
