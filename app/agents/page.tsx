import { prisma } from '@/lib/prisma';
import AgentsClient from './AgentsClient';

export const dynamic = 'force-dynamic';

const AGENT_NAMES = [
  'prospect_developer',
  'follow_up',
  'competitor_monitor',
  'customer_scorer',
  'daily_briefing',
] as const;

export default async function AgentsPage() {
  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const [recentLogs, pendingInterventions, pendingOutreach] = await Promise.all([
    prisma.agentTaskLog.findMany({
      orderBy: { started_at: 'desc' },
      take: 100,
    }),
    prisma.interventionItem.count({ where: { status: 'pending' } }),
    prisma.outreachRecord.count({ where: { status: 'draft' } }),
  ]);

  const agents = AGENT_NAMES.map((name) => {
    const logs = recentLogs.filter((l) => l.agent_name === name);
    const lastLog = logs[0] ?? null;
    const runs24h = recentLogs.filter((l) => l.agent_name === name && l.started_at >= since24h).length;
    const errors24h = recentLogs.filter(
      (l) => l.agent_name === name && l.started_at >= since24h && l.status === 'failed'
    ).length;
    return { name, lastLog, runs24h, errors24h };
  });

  const latestLogs = recentLogs.slice(0, 30);

  return (
    <AgentsClient
      agents={agents}
      latestLogs={latestLogs}
      pendingInterventions={pendingInterventions}
      pendingOutreach={pendingOutreach}
    />
  );
}
