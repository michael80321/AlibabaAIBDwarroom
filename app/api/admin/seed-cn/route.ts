export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { prospectDataCN } from '@/prisma/prospect-data-cn';
import { partnerProspectDataCN } from '@/prisma/partner-prospect-data-cn';

export async function POST() {
  try {
    const releaseDate = new Date();
    releaseDate.setDate(releaseDate.getDate() - 1);
    releaseDate.setHours(7, 0, 0, 0);

    // Get existing names to avoid duplicates
    const existingProspects = await prisma.prospectRecommendation.findMany({
      where: { company_name: { in: prospectDataCN.map((p) => p.company_name) } },
      select: { company_name: true },
    });
    const existingProspectNames = new Set(existingProspects.map((p) => p.company_name));

    const newProspects = prospectDataCN
      .filter((p) => !existingProspectNames.has(p.company_name))
      .map((p) => ({ ...p, recommended_date: releaseDate }));

    let prospectsInserted = 0;
    for (const p of newProspects) {
      await prisma.prospectRecommendation.create({ data: p });
      prospectsInserted++;
    }

    // Partner prospects
    const existingPartners = await prisma.partnerProspect.findMany({
      where: { name: { in: partnerProspectDataCN.map((p) => p.name) } },
      select: { name: true },
    });
    const existingPartnerNames = new Set(existingPartners.map((p) => p.name));

    const newPartners = partnerProspectDataCN
      .filter((p) => !existingPartnerNames.has(p.name))
      .map((p) => ({ ...p, recommended_date: releaseDate }));

    let partnersInserted = 0;
    for (const p of newPartners) {
      await prisma.partnerProspect.create({ data: p });
      partnersInserted++;
    }

    return NextResponse.json({
      ok: true,
      prospectsInserted,
      prospectsSkipped: prospectDataCN.length - prospectsInserted,
      partnersInserted,
      partnersSkipped: partnerProspectDataCN.length - partnersInserted,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
