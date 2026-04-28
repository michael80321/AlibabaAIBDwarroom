import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const agent = searchParams.get('agent');
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '20'), 100);

  const logs = await prisma.agentTaskLog.findMany({
    where: agent ? { agent_name: agent } : {},
    orderBy: { started_at: 'desc' },
    take: limit,
  });

  return NextResponse.json({ logs });
}
