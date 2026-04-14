import type { Customer, PipelineStage, MeetingNote, CloudVendorNews, CustomerScore } from '@prisma/client';
import { prisma } from './prisma';

interface ScoreBreakdown {
  pain_signal: number;
  budget_signal: number;
  timeline_signal: number;
  tech_fit: number;
  competitor_issue: number;
  china_expansion: number;
  ai_gpu_demand: number;
  decision_maker_access: number;
  relationship_warmth: number;
  company_size_fit: number;
  total_score: number;
}

function getPriorityLabel(score: number): string {
  if (score >= 80) return 'Attack Now';
  if (score >= 60) return 'Nurture';
  if (score >= 40) return 'Partner First';
  if (score >= 20) return 'Monitor';
  if (score >= 10) return 'Cold';
  return 'Dead';
}

export async function calculateCustomerScore(
  customer: Customer & {
    pipeline_stages: PipelineStage[];
    meeting_notes: MeetingNote[];
    score_breakdown?: CustomerScore | null;
  },
  recentNews?: CloudVendorNews[]
): Promise<ScoreBreakdown> {
  const scores: ScoreBreakdown = {
    pain_signal: 0,
    budget_signal: 0,
    timeline_signal: 0,
    tech_fit: 0,
    competitor_issue: 0,
    china_expansion: 0,
    ai_gpu_demand: 0,
    decision_maker_access: 0,
    relationship_warmth: 0,
    company_size_fit: 0,
    total_score: 0,
  };

  // pain_signal (max 10)
  if (customer.pain_points && customer.pain_points.length > 0) scores.pain_signal += 5;
  const meetingText = customer.meeting_notes.map((m) => m.raw_notes + ' ' + (m.pain_points || '')).join(' ');
  if (meetingText.toLowerCase().includes('痛點') || meetingText.toLowerCase().includes('問題') || meetingText.toLowerCase().includes('難')) {
    scores.pain_signal += 3;
  }
  if (customer.pain_points.length >= 3) scores.pain_signal += 2;

  // budget_signal (max 10)
  const hasBudgetMention = customer.meeting_notes.some(
    (m) => m.budget_timeline && m.budget_timeline.length > 0
  );
  if (hasBudgetMention) scores.budget_signal += 7;
  if (customer.estimated_arr && customer.estimated_arr > 0) scores.budget_signal += 3;

  // timeline_signal (max 10)
  const activePipeline = customer.pipeline_stages[0];
  if (activePipeline?.expected_close) {
    scores.timeline_signal += 5;
    const daysToClose = (activePipeline.expected_close.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    if (daysToClose <= 90 && daysToClose > 0) scores.timeline_signal += 5;
  }

  // tech_fit (max 10)
  if (customer.current_cloud === 'AWS' || customer.current_cloud === 'GCP') {
    scores.tech_fit += 5;
  }
  if (customer.entry_points.includes('AI') || customer.entry_points.includes('GPU')) {
    scores.tech_fit += 3;
  }
  if (customer.entry_points.includes('China') || customer.entry_points.includes('China Access')) {
    scores.tech_fit += 2;
  }

  // competitor_issue (max 15)
  if (recentNews) {
    const competitorIncident = recentNews.some(
      (n) =>
        n.vendor === customer.current_cloud &&
        (n.category === 'incident' || n.title.toLowerCase().includes('outage'))
    );
    if (competitorIncident) scores.competitor_issue += 10;

    const pricingNews = recentNews.some(
      (n) =>
        n.vendor === customer.current_cloud &&
        (n.title.toLowerCase().includes('pricing') || n.title.toLowerCase().includes('price') || n.title.includes('漲價'))
    );
    if (pricingNews) scores.competitor_issue += 5;
  }

  // china_expansion (max 10)
  if (customer.entry_points.includes('China') || customer.entry_points.includes('China Access')) {
    scores.china_expansion += 10;
  }

  // ai_gpu_demand (max 5)
  if (customer.entry_points.includes('AI') || customer.entry_points.includes('GPU')) {
    scores.ai_gpu_demand += 5;
  }

  // decision_maker_access (max 15) - fetch from DB
  const contacts = await prisma.contact.findMany({
    where: { customer_id: customer.id },
  });
  const hasDecisionMaker = contacts.some((c) => c.influence === 'decision_maker');
  const hasChampion = contacts.some((c) => c.influence === 'champion');
  if (hasDecisionMaker) scores.decision_maker_access += 10;
  if (hasChampion) scores.decision_maker_access += 5;

  // relationship_warmth (max 10)
  if (customer.last_contacted) {
    const daysSinceContact = (Date.now() - customer.last_contacted.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceContact <= 30) scores.relationship_warmth += 7;
  }
  if (customer.meeting_notes.length > 0) scores.relationship_warmth += 3;

  // company_size_fit (max 5)
  if (customer.company_size === 'mid' || customer.company_size === 'enterprise') {
    scores.company_size_fit += 5;
  }

  // Calculate total
  scores.total_score =
    scores.pain_signal +
    scores.budget_signal +
    scores.timeline_signal +
    scores.tech_fit +
    scores.competitor_issue +
    scores.china_expansion +
    scores.ai_gpu_demand +
    scores.decision_maker_access +
    scores.relationship_warmth +
    scores.company_size_fit;

  // Cap at 100
  scores.total_score = Math.min(100, scores.total_score);

  return scores;
}

export async function scoreAndUpdateCustomer(customerId: string): Promise<void> {
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    include: {
      pipeline_stages: { orderBy: { entered_at: 'desc' }, take: 1 },
      meeting_notes: true,
      score_breakdown: true,
    },
  });

  if (!customer) return;

  const recentNews = await prisma.cloudVendorNews.findMany({
    where: {
      published_at: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
    },
  });

  const scores = await calculateCustomerScore(customer, recentNews);
  const priorityLabel = getPriorityLabel(scores.total_score);

  await prisma.customerScore.upsert({
    where: { customer_id: customerId },
    create: {
      customer_id: customerId,
      ...scores,
      calculated_at: new Date(),
    },
    update: {
      ...scores,
      calculated_at: new Date(),
    },
  });

  await prisma.customer.update({
    where: { id: customerId },
    data: {
      priority_score: scores.total_score,
      priority_label: priorityLabel,
    },
  });
}

export { getPriorityLabel };
