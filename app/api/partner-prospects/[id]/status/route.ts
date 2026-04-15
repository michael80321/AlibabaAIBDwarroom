export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const { status, status_reason, reason } = body as { status: string; status_reason?: string; reason?: string };
    const finalReason = reason || status_reason || null;

    const existing = await prisma.partnerProspect.findUnique({
      where: { id: params.id },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Partner prospect not found' }, { status: 404 });
    }

    // If status === 'active', create/upsert a Partner record
    if (status === 'active') {
      await prisma.partner.create({
        data: {
          name: existing.name,
          type: existing.type,
          services: existing.services,
          regions: [existing.region],
          cloud_alliances: [],
          cooperation_type: existing.cooperation_type || 'collaborate',
          notes: existing.description || null,
        },
      });
    }

    const updated = await prisma.partnerProspect.update({
      where: { id: params.id },
      data: { status, status_reason: finalReason },
    });

    return NextResponse.json(updated);
  } catch (e) {
    console.error('[partner-prospects/status]', e);
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: 'Internal error', detail: msg }, { status: 500 });
  }
}
