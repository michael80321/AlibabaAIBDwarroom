import { prisma } from '../prisma';
import { AgentWorker } from '../agent-worker';
import { generateFollowUp } from '../claude';

const FOLLOWUP_DAYS_THRESHOLD = 7;
const MAX_FOLLOWUPS_PER_RUN = 5;

export class FollowUpAgent extends AgentWorker {
  constructor() {
    super('follow_up');
  }

  async run(): Promise<{ prepared: number; skipped: number }> {
    await this.startLog('follow_up_prep');

    try {
      const cutoff = new Date(Date.now() - FOLLOWUP_DAYS_THRESHOLD * 24 * 60 * 60 * 1000);

      // Find customers not contacted recently, not lost/hold
      const staleCustomers = await prisma.customer.findMany({
        where: {
          OR: [
            { last_contacted: { lte: cutoff } },
            { last_contacted: null },
          ],
          priority_label: { notIn: ['lost', 'Monitor'] },
        },
        include: {
          contacts: {
            where: { influence: { in: ['decision_maker', 'champion'] } },
            take: 1,
          },
          pipeline_stages: {
            orderBy: { entered_at: 'desc' },
            take: 1,
          },
        },
        orderBy: { priority_score: 'desc' },
        take: MAX_FOLLOWUPS_PER_RUN,
      });

      if (staleCustomers.length === 0) {
        await this.completeLog({ prepared: 0, reason: 'No stale customers' });
        return { prepared: 0, skipped: 0 };
      }

      // Skip customers that already have a recent draft follow-up
      const recentFollowupIds = await prisma.outreachRecord.findMany({
        where: {
          scenario: 'follow_up',
          status: { in: ['draft', 'approved'] },
          created_at: { gte: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) },
          customer_id: { in: staleCustomers.map((c) => c.id) },
        },
        select: { customer_id: true },
      });
      const skipIds = new Set(recentFollowupIds.map((r) => r.customer_id!));

      let prepared = 0;
      const outreachIds: string[] = [];

      for (const customer of staleCustomers) {
        if (skipIds.has(customer.id)) continue;

        const daysSince = customer.last_contacted
          ? Math.floor((Date.now() - customer.last_contacted.getTime()) / (1000 * 60 * 60 * 24))
          : 999;

        const contact = customer.contacts[0];
        const lastStage = customer.pipeline_stages[0];

        try {
          const result = await generateFollowUp(
            {
              company_name: customer.company_name,
              industry: customer.industry,
              current_cloud: customer.current_cloud,
              why_now: customer.why_now,
              opening_pitch: customer.opening_pitch,
              pain_points: customer.pain_points,
            },
            {
              name: contact?.name ?? undefined,
              title: contact?.title ?? undefined,
              email: contact?.email ?? undefined,
            },
            daysSince,
            lastStage?.notes ?? undefined
          );

          if (result) {
            const record = await prisma.outreachRecord.create({
              data: {
                customer_id: customer.id,
                company_name: customer.company_name,
                contact_name: contact?.name,
                contact_email: contact?.email,
                contact_title: contact?.title,
                scenario: 'follow_up',
                subject_zh: result.subject_zh,
                body_zh: result.body_zh,
                subject_en: result.subject_en,
                body_en: result.body_en,
                notes: result.reason,
                status: 'draft',
                agent_task_id: this.taskLogId,
              },
            });
            outreachIds.push(record.id);
            prepared++;
          }
        } catch {
          // Continue on error for individual customers
        }
      }

      const output = { prepared, outreach_ids: outreachIds };
      await this.completeLog(output);

      if (prepared > 0) {
        await this.flagForIntervention(
          'approval_needed',
          `🔄 ${prepared} 封跟進信已準備好`,
          `以下客戶超過 ${FOLLOWUP_DAYS_THRESHOLD} 天未聯繫，AI 已準備跟進草稿：\n${staleCustomers
            .slice(0, prepared)
            .map((c) => {
              const days = c.last_contacted
                ? Math.floor((Date.now() - c.last_contacted.getTime()) / (1000 * 60 * 60 * 24))
                : '未知';
              return `• ${c.company_name}（${days} 天前聯繫）`;
            })
            .join('\n')}`,
          { outreach_ids: outreachIds },
          'medium'
        );
      }

      return { prepared, skipped: staleCustomers.length - prepared };
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      await this.failLog(msg);
      throw error;
    }
  }
}
