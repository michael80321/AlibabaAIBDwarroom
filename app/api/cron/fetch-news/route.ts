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
    await fetchAllVendorNews(false);
    return NextResponse.json({ success: true, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('[cron/fetch-news]', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
