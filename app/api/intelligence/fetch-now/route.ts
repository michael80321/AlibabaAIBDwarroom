export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { fetchAllVendorNews } from '@/lib/news-fetcher';

export async function POST() {
  try {
    await fetchAllVendorNews(false);
    return NextResponse.json({ success: true, timestamp: new Date().toISOString() });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: 'Fetch failed', detail: msg }, { status: 500 });
  }
}
