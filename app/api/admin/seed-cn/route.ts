export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { prospectDataCN } from '@/prisma/prospect-data-cn';
import { partnerProspectDataCN } from '@/prisma/partner-prospect-data-cn';

export async function POST() {
  try {
    const today = new Date();
    today.setHours(7, 0, 0, 0);

    const cnProspectNames = prospectDataCN.map((p) => p.company_name);
    const cnPartnerNames = partnerProspectDataCN.map((p) => p.name);

    // Find which ones already exist
    const existingProspects = await prisma.prospectRecommendation.findMany({
      where: { company_name: { in: cnProspectNames } },
      select: { id: true, company_name: true },
    });
    const existingProspectNames = new Set(existingProspects.map((p) => p.company_name));

    // Insert new ones with today's date
    const newProspects = prospectDataCN.filter((p) => !existingProspectNames.has(p.company_name));
    let prospectsInserted = 0;
    for (const p of newProspects) {
      await prisma.prospectRecommendation.create({ data: { ...p, recommended_date: today } });
      prospectsInserted++;
    }

    // Update existing ones to today's date so they appear in 今日 filter
    let prospectsUpdated = 0;
    if (existingProspects.length > 0) {
      await prisma.prospectRecommendation.updateMany({
        where: { id: { in: existingProspects.map((p) => p.id) } },
        data: { recommended_date: today },
      });
      prospectsUpdated = existingProspects.length;
    }

    // Partner prospects
    const existingPartners = await prisma.partnerProspect.findMany({
      where: { name: { in: cnPartnerNames } },
      select: { id: true, name: true },
    });
    const existingPartnerNames = new Set(existingPartners.map((p) => p.name));

    const newPartners = partnerProspectDataCN.filter((p) => !existingPartnerNames.has(p.name));
    let partnersInserted = 0;
    for (const p of newPartners) {
      await prisma.partnerProspect.create({ data: { ...p, recommended_date: today } });
      partnersInserted++;
    }

    let partnersUpdated = 0;
    if (existingPartners.length > 0) {
      await prisma.partnerProspect.updateMany({
        where: { id: { in: existingPartners.map((p) => p.id) } },
        data: { recommended_date: today },
      });
      partnersUpdated = existingPartners.length;
    }

    return NextResponse.json({
      ok: true,
      prospectsInserted,
      prospectsUpdated,
      partnersInserted,
      partnersUpdated,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
