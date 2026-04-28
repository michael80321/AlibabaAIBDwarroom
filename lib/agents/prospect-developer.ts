import { prisma } from '../prisma';
import { AgentWorker } from '../agent-worker';
import { generateOutreachEmail } from '../claude';

export class ProspectDeveloperAgent extends AgentWorker {
  constructor() {
    super('prospect_developer');
  }

  async run(): Promise<{ prepared: number; skipped: number }> {
    await this.startLog('outreach_prep');

    try {
      // Pick top 5 new prospects by estimated ARR (not already in outreach pipeline)
      const existingProspectIds = await prisma.outreachRecord.findMany({
        where: {
          status: { in: ['draft', 'approved', 'sent'] },
          prospect_id: { not: null },
          created_at: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
        select: { prospect_id: true },
      });
      const skipIds = existingProspectIds.map((r) => r.prospect_id!).filter(Boolean);

      const candidates = await prisma.prospectRecommendation.findMany({
        where: {
          status: 'new',
          id: skipIds.length > 0 ? { notIn: skipIds } : undefined,
        },
        orderBy: [{ estimated_arr: 'desc' }, { recommended_date: 'desc' }],
        take: 5,
      });

      if (candidates.length === 0) {
        await this.completeLog({ prepared: 0, skipped: 0, reason: 'No new candidates' });
        return { prepared: 0, skipped: 0 };
      }

      let prepared = 0;
      const outreachIds: string[] = [];

      for (const prospect of candidates) {
        try {
          const result = await generateOutreachEmail(
            {
              company_name: prospect.company_name,
              industry: prospect.category,
              current_cloud: prospect.tech_stack[0] ?? null,
              pain_points: [],
              entry_points: [],
              why_now: prospect.why_alibaba,
              opening_pitch: null,
              estimated_arr: prospect.estimated_arr,
            },
            { name: prospect.contact_hint ?? undefined },
            'cold'
          );

          if (result) {
            const record = await prisma.outreachRecord.create({
              data: {
                prospect_id: prospect.id,
                company_name: prospect.company_name,
                contact_name: prospect.contact_hint,
                scenario: 'cold',
                subject_zh: result.subject_zh,
                body_zh: result.body_zh,
                subject_en: result.subject_en,
                body_en: result.body_en,
                status: 'draft',
                agent_task_id: this.taskLogId,
              },
            });
            outreachIds.push(record.id);
            prepared++;
          }
        } catch {
          // Continue with other prospects even if one fails
        }
      }

      const output = { prepared, skipped: candidates.length - prepared, outreach_ids: outreachIds };
      await this.completeLog(output);

      if (prepared > 0) {
        await this.flagForIntervention(
          'approval_needed',
          `📧 ${prepared} 封開發信已準備好，等你批准`,
          `AI 已為以下客戶準備好個人化開發信：\n${candidates
            .slice(0, prepared)
            .map((c) => `• ${c.company_name}${c.estimated_arr ? ` (~$${Math.round(c.estimated_arr / 1000)}K ARR)` : ''}`)
            .join('\n')}\n\n請到「介入中心」批准後複製發送。`,
          { outreach_ids: outreachIds },
          prepared >= 3 ? 'high' : 'medium'
        );
      }

      return { prepared, skipped: candidates.length - prepared };
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      await this.failLog(msg);
      throw error;
    }
  }
}
