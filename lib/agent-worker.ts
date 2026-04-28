import { prisma } from './prisma';
import { sendCustomAlert } from './telegram';

export type AgentName =
  | 'prospect_developer'
  | 'follow_up'
  | 'competitor_monitor'
  | 'customer_scorer'
  | 'daily_briefing'
  | 'proposal_designer'
  | 'pricing_calculator';

export type InterventionType = 'approval_needed' | 'decision_needed' | 'review_needed' | 'error';
export type InterventionPriority = 'high' | 'medium' | 'low';

export class AgentWorker {
  protected taskLogId: string | null = null;
  protected startedAt: number = Date.now();

  constructor(protected name: AgentName) {}

  protected async startLog(taskType: string, input?: unknown): Promise<string> {
    this.startedAt = Date.now();
    const log = await prisma.agentTaskLog.create({
      data: {
        agent_name: this.name,
        task_type: taskType,
        status: 'running',
        input: (input ?? null) as never,
      },
    });
    this.taskLogId = log.id;
    return log.id;
  }

  protected async completeLog(output?: unknown): Promise<void> {
    if (!this.taskLogId) return;
    await prisma.agentTaskLog.update({
      where: { id: this.taskLogId },
      data: {
        status: 'completed',
        output: (output ?? null) as never,
        duration_ms: Date.now() - this.startedAt,
        completed_at: new Date(),
      },
    });
  }

  protected async failLog(error: string): Promise<void> {
    if (!this.taskLogId) return;
    await prisma.agentTaskLog.update({
      where: { id: this.taskLogId },
      data: {
        status: 'failed',
        error,
        duration_ms: Date.now() - this.startedAt,
        completed_at: new Date(),
      },
    });
  }

  protected async flagForIntervention(
    type: InterventionType,
    title: string,
    description: string,
    context?: unknown,
    priority: InterventionPriority = 'medium'
  ): Promise<string> {
    const item = await prisma.interventionItem.create({
      data: {
        agent_name: this.name,
        type,
        priority,
        title,
        description,
        context: (context ?? null) as never,
        expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000),
      },
    });

    if (this.taskLogId) {
      await prisma.agentTaskLog.update({
        where: { id: this.taskLogId },
        data: { status: 'flagged' },
      });
    }

    const emoji = priority === 'high' ? '🔴' : priority === 'medium' ? '🟡' : '🔵';
    const warRoomUrl = process.env.WAR_ROOM_URL || '';
    await sendCustomAlert(
      `${emoji} <b>[需介入] ${title}</b>\n\n${description}\n\n👉 ${warRoomUrl}/interventions`
    );

    return item.id;
  }
}
