import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const AGENT_NAMES = [
  'prospect_developer',
  'follow_up',
  'competitor_monitor',
  'customer_scorer',
  'daily_briefing',
  'proposal_designer',
  'pricing_calculator',
] as const;

export async function GET() {
  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const [recentLogs, pendingInterventions, pendingOutreach] = await Promise.all([
    prisma.agentTaskLog.findMany({
      where: { started_at: { gte: since24h } },
      orderBy: { started_at: 'desc' },
      take: 50,
    }),
    prisma.interventionItem.count({ where: { status: 'pending' } }),
    prisma.outreachRecord.count({ where: { status: 'draft' } }),
  ]);

  // Build per-agent summary
  const agents = AGENT_NAMES.map((name) => {
    const logs = recentLogs.filter((l) => l.agent_name === name);
    const lastLog = logs[0] ?? null;
    const runs = logs.length;
    const errors = logs.filter((l) => l.status === 'failed').length;
    return {
      name,
      last_run: lastLog?.started_at ?? null,
      last_status: lastLog?.status ?? 'never',
      runs_24h: runs,
      errors_24h: errors,
    };
  });

  return NextResponse.json({
    agents,
    summary: {
      pending_interventions: pendingInterventions,
      pending_outreach: pendingOutreach,
      total_runs_24h: recentLogs.length,
      total_errors_24h: recentLogs.filter((l) => l.status === 'failed').length,
    },
  });
}
