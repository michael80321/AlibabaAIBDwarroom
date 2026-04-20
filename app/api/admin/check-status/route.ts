import { NextResponse } from 'next/server';
import { checkAllVendorStatus } from '@/lib/status-monitor';

export async function POST() {
  try {
    await checkAllVendorStatus();
    return NextResponse.json({ success: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
