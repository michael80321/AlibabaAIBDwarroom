import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const SG_COMPANIES = ['Grab', 'Sea Group / Shopee', 'Singtel', 'Razer'];

export async function POST() {
  try {
    const results = await Promise.all(
      SG_COMPANIES.map((name) =>
        prisma.prospectRecommendation.updateMany({
          where: { company_name: name, region: 'SEA' },
          data: { region: 'SG' },
        })
      )
    );

    const updated = results.reduce((sum, r) => sum + r.count, 0);
    return NextResponse.json({ success: true, updated });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
