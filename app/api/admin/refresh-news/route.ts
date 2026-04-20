import { NextResponse } from 'next/server';
import { fetchAllVendorNews } from '@/lib/news-fetcher';

export async function POST() {
  try {
    await fetchAllVendorNews(false);
    return NextResponse.json({ success: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
