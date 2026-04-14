import { NextRequest, NextResponse } from 'next/server';
import { scoreAndUpdateCustomer } from '@/lib/scoring';

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  await scoreAndUpdateCustomer(params.id);
  return NextResponse.json({ success: true, message: 'Score recalculated' });
}
