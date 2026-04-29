export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { analyzeMeetingNotes } from '@/lib/claude';
import { scoreAndUpdateCustomer } from '@/lib/scoring';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const customer_id = searchParams.get('customer_id');

  const where = customer_id ? { customer_id } : {};

  const meetings = await prisma.meetingNote.findMany({
    where,
    include: {
      customer: {
        select: { id: true, company_name: true },
      },
    },
    orderBy: { meeting_date: 'desc' },
  });

  return NextResponse.json(meetings);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { raw_notes, customer_id, meeting_date } = body;

  if (!raw_notes || !customer_id) {
    return NextResponse.json({ error: 'raw_notes and customer_id are required' }, { status: 400 });
  }

  // Get customer name for context
  const customer = await prisma.customer.findUnique({
    where: { id: customer_id },
    select: { company_name: true },
  });

  if (!customer) {
    return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
  }

  // AI analysis
  const analysis = await analyzeMeetingNotes(raw_notes, customer.company_name);

  // Save meeting note
  const meetingNote = await prisma.meetingNote.create({
    data: {
      customer_id,
      meeting_date: meeting_date ? new Date(meeting_date) : new Date(),
      raw_notes,
      summary: analysis?.summary?.join('\n') || null,
      decision_makers: analysis?.decision_makers ? JSON.stringify(analysis.decision_makers) : null,
      pain_points: analysis?.pain_points?.join('\n') || null,
      objections: analysis?.objections ? JSON.stringify(analysis.objections) : null,
      budget_timeline: analysis?.budget_timeline || null,
      next_steps: analysis?.next_steps ? JSON.stringify(analysis.next_steps) : null,
      updated_pitch: analysis?.updated_pitch || null,
    },
  });

  // Update last_contacted
  await prisma.customer.update({
    where: { id: customer_id },
    data: { last_contacted: new Date() },
  });

  // Trigger re-scoring in background
  scoreAndUpdateCustomer(customer_id).catch(console.error);

  return NextResponse.json({ meetingNote, analysis }, { status: 201 });
}
