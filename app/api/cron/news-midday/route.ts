export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { fetchAllVendorNews } from '@/lib/news-fetcher';

function verifyCronSecret(req: NextRequest): boolean {
  const secret = req.headers.get('x-cron-secret');
  return secret === process.env.CRON_SECRET;
}

export async function POST(req: NextRequest) {
  if (!verifyCronSecret(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Lightweight mode: only fetch titles
    await fetchAllVendorNews(true);
    return NextResponse.json({ success: true, mode: 'lightweight', timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('[cron/news-midday]', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
