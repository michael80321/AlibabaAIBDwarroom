export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { scoreAndUpdateCustomer } from '@/lib/scoring';
import { sendCustomAlert } from '@/lib/telegram';

function verifyCronSecret(req: NextRequest): boolean {
  const secret = req.headers.get('x-cron-secret');
  return secret === process.env.CRON_SECRET;
}

export async function POST(req: NextRequest) {
  if (!verifyCronSecret(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const customers = await prisma.customer.findMany({
      where: { priority_label: { not: 'Dead' } },
      select: { id: true, company_name: true, last_contacted: true, priority_score: true },
    });

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const neglectedHighScore: string[] = [];

    for (const customer of customers) {
      await scoreAndUpdateCustomer(customer.id);

      // Check for neglected high-score customers
      if (
        customer.priority_score >= 60 &&
        (!customer.last_contacted || customer.last_contacted < sevenDaysAgo)
      ) {
        neglectedHighScore.push(customer.company_name);
      }
    }

    if (neglectedHighScore.length > 0) {
      await sendCustomAlert(
        `⚠️ <b>高優先客戶超過 7 天未聯絡</b>\n\n` +
          neglectedHighScore.map((name) => `• ${name}`).join('\n') +
          `\n\n👉 ${process.env.WAR_ROOM_URL}`
      );
    }

    return NextResponse.json({
      success: true,
      scored: customers.length,
      neglected_alerts: neglectedHighScore.length,
    });
  } catch (error) {
    console.error('[cron/score-customers]', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
