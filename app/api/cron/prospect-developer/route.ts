export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { ProspectDeveloperAgent } from '@/lib/agents/prospect-developer';

function verifyCronSecret(req: NextRequest): boolean {
  const secret = req.headers.get('x-cron-secret');
  return secret === process.env.CRON_SECRET;
}

export async function POST(req: NextRequest) {
  if (!verifyCronSecret(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const agent = new ProspectDeveloperAgent();
    const result = await agent.run();
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: 'Agent failed', detail: msg }, { status: 500 });
  }
}
