import type { StatusIncident, Customer, DailyStrategy } from '@prisma/client';
import { format } from 'date-fns';
import { zhTW } from 'date-fns/locale';

const TELEGRAM_API = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const WAR_ROOM_URL = process.env.WAR_ROOM_URL || 'http://localhost:3000';

async function sendMessage(text: string): Promise<void> {
  if (!process.env.TELEGRAM_BOT_TOKEN || !CHAT_ID) {
    console.log('[Telegram] Token or Chat ID not configured, skipping');
    return;
  }

  try {
    const response = await fetch(`${TELEGRAM_API}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text,
        parse_mode: 'HTML',
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('[Telegram] Send failed:', error);
    }
  } catch (error) {
    console.error('[Telegram] Network error:', error);
  }
}

export async function sendCriticalAlert(
  incident: StatusIncident,
  affectedCustomers: Customer[]
): Promise<void> {
  const timeStr = format(incident.started_at, 'MM/dd HH:mm', { locale: zhTW });
  const customerList = affectedCustomers.map((c) => `• ${c.company_name}`).join('\n');

  const text = `🔴 <b>[緊急] ${incident.vendor} 服務中斷</b>
事件：${incident.title}
發生時間：${timeStr}
受影響客戶：
${customerList || '• 無直接受影響客戶'}

💬 建議話術：
「剛看到 ${incident.vendor} 有服務中斷，你們這邊還好嗎？如果需要備援方案，我們可以聊。」

👉 ${WAR_ROOM_URL}`;

  await sendMessage(text);
}

export async function sendWarningAlert(incident: StatusIncident): Promise<void> {
  const text = `🟡 <b>[注意] ${incident.vendor} 服務降級</b>
事件：${incident.title}
狀態：持續追蹤中

👉 ${WAR_ROOM_URL}`;

  await sendMessage(text);
}

export async function sendResolvedAlert(
  incident: StatusIncident,
  durationMinutes: number
): Promise<void> {
  const text = `🟢 <b>[恢復] ${incident.vendor} 服務已恢復</b>
中斷時間：約 ${durationMinutes} 分鐘

👉 ${WAR_ROOM_URL}`;

  await sendMessage(text);
}

export async function sendDailyBriefing(
  strategy: DailyStrategy,
  agentSummary?: { pendingInterventions: number; pendingOutreach: number; runsToday: number }
): Promise<void> {
  const dateStr = format(strategy.date, 'yyyy年MM月dd日', { locale: zhTW });
  const actions = strategy.top3_actions as Array<{
    priority: number;
    customer_name: string;
    action: string;
    reason: string;
  }>;

  const actionLines = actions
    .map(
      (a) =>
        `${a.priority}. <b>${a.customer_name}</b> — ${a.action}\n   原因：${a.reason}`
    )
    .join('\n\n');

  const agentLines = agentSummary
    ? `\n🤖 <b>AI 員工動態</b>\n• 待審批介入：${agentSummary.pendingInterventions} 件\n• 待審核開發信：${agentSummary.pendingOutreach} 封\n• 今日任務執行：${agentSummary.runsToday} 次\n👉 ${WAR_ROOM_URL}/interventions`
    : '';

  const text = `☀️ <b>今日 BD 作戰指令 ${dateStr}</b>

🎯 Top 3 必打：

${actionLines}
${agentLines}

📊 作戰系統更新完畢，請進入戰場

👉 ${WAR_ROOM_URL}`;

  await sendMessage(text);
}

export async function sendWeeklyBriefing(
  weeklyFocus: string,
  monthlyDirection: string,
  top3: Array<{ priority: number; customer_name: string; action: string }>
): Promise<void> {
  const dateStr = format(new Date(), 'yyyy年MM月dd日', { locale: zhTW });
  const actionLines = top3
    .map((a) => `${a.priority}. <b>${a.customer_name}</b> — ${a.action}`)
    .join('\n');

  const text = `📅 <b>本週 BD 作戰計畫 ${dateStr}</b>

🎯 <b>本週攻堅重點</b>
${weeklyFocus}

🗓 <b>本月方向</b>
${monthlyDirection}

⚡ <b>本週 Top 3 行動</b>
${actionLines}

👉 ${WAR_ROOM_URL}`;

  await sendMessage(text);
}

export async function sendCustomAlert(message: string): Promise<void> {
  await sendMessage(message);
}
