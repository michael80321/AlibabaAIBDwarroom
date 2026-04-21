import Anthropic from '@anthropic-ai/sdk';
import type { Customer, PipelineStage, CloudVendorNews, StatusIncident, DailyStrategy } from '@prisma/client';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const MODEL = 'claude-sonnet-4-6';

export interface MeetingAnalysis {
  summary: string[];
  decision_makers: Array<{ name: string; title: string; influence: string }>;
  pain_points: string[];
  objections: Array<{ objection: string; suggested_response: string }>;
  budget_timeline: string;
  next_steps: Array<{ action: string; owner: string; deadline: string }>;
  updated_pitch: string;
}

export interface WeeklyStrategyResult {
  weekly_focus: string;
  monthly_direction: string;
  top3_actions: Array<{
    priority: number;
    customer_name: string;
    customer_id: string;
    action: string;
    reason: string;
    opening_pitch: string;
  }>;
  abandon_list: Array<{ customer_name: string; customer_id: string; reason: string }>;
}

export interface DailyStrategyResult {
  top3_actions: Array<{
    priority: number;
    customer_name: string;
    customer_id: string;
    action: string;
    reason: string;
    opening_pitch: string;
  }>;
  weekly_focus: string;
  abandon_list: Array<{ customer_name: string; customer_id: string; reason: string }>;
}

export async function analyzeMeetingNotes(
  rawNotes: string,
  customerName: string
): Promise<MeetingAnalysis | null> {
  try {
    const message = await client.messages.create({
      model: MODEL,
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: `你是一位資深 BD（業務開發）顧問，擅長分析銷售會議記錄並提取關鍵洞察。

請分析以下與「${customerName}」的會議記錄，並以 JSON 格式輸出分析結果。

會議記錄：
${rawNotes}

請輸出以下 JSON 格式（全部用繁體中文，只輸出 JSON，不要有其他文字）：
{
  "summary": ["重點1", "重點2", "重點3"],
  "decision_makers": [{"name": "姓名", "title": "職稱", "influence": "decision_maker|champion|user|blocker"}],
  "pain_points": ["痛點1", "痛點2"],
  "objections": [{"objection": "反對意見", "suggested_response": "建議回應方式"}],
  "budget_timeline": "預算與時間線描述",
  "next_steps": [{"action": "行動項目", "owner": "負責人", "deadline": "截止日期"}],
  "updated_pitch": "更新後的建議開場白（不超過2句話，簡短有力）"
}`,
        },
      ],
    });

    const content = message.content[0];
    if (content.type !== 'text') return null;

    const jsonText = content.text.trim().replace(/^```json\n?/, '').replace(/\n?```$/, '');
    return JSON.parse(jsonText) as MeetingAnalysis;
  } catch (error) {
    console.error('analyzeMeetingNotes error:', error);
    return null;
  }
}

export async function generateDailyStrategy(context: {
  attackNowCustomers: Customer[];
  stuckPipeline: (PipelineStage & { customer: Customer })[];
  todayNews: CloudVendorNews[];
  recentIncidents: StatusIncident[];
}): Promise<DailyStrategyResult | null> {
  try {
    const contextStr = JSON.stringify({
      attackNowCustomers: context.attackNowCustomers.map((c) => ({
        id: c.id,
        company_name: c.company_name,
        priority_score: c.priority_score,
        why_now: c.why_now,
        entry_points: c.entry_points,
        estimated_arr: c.estimated_arr,
        last_contacted: c.last_contacted,
        opening_pitch: c.opening_pitch,
      })),
      stuckPipeline: context.stuckPipeline.map((p) => ({
        customer_name: p.customer.company_name,
        customer_id: p.customer_id,
        stage: p.stage,
        blockers: p.blockers,
        days_stuck: Math.floor((Date.now() - p.entered_at.getTime()) / (1000 * 60 * 60 * 24)),
        deal_value: p.deal_value,
        next_action: p.next_action,
      })),
      todayNews: context.todayNews.slice(0, 5).map((n) => ({
        vendor: n.vendor,
        title: n.title,
        category: n.category,
      })),
      recentIncidents: context.recentIncidents.map((i) => ({
        vendor: i.vendor,
        severity: i.severity,
        title: i.title,
      })),
    });

    const message = await client.messages.create({
      model: MODEL,
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: `你是 Alibaba Cloud 台灣 BD 作戰室的 AI 策略顧問。今天是 ${new Date().toLocaleDateString('zh-TW')}。

根據以下資料，生成今日的 BD 作戰策略：

${contextStr}

請輸出 JSON（全部用繁體中文，只輸出 JSON，不要有其他文字）：
{
  "top3_actions": [
    {
      "priority": 1,
      "customer_name": "公司名",
      "customer_id": "id",
      "action": "今日必做的具體行動（20字內）",
      "reason": "為什麼今天必做（1句話，要有緊迫感）",
      "opening_pitch": "建議開場白（2句話內，直接可用）"
    }
  ],
  "weekly_focus": "本週攻堅重點（1-2句）",
  "abandon_list": [
    {"customer_name": "公司名", "customer_id": "id", "reason": "放棄原因"}
  ]
}

判斷邏輯：
- Top 3 優先選 Attack Now 客戶
- 有 blockers 超過 14 天的優先處理
- 競品有 incident 的客戶必須今日聯絡
- abandon_list 只放真的沒希望的客戶`,
        },
      ],
    });

    const content = message.content[0];
    if (content.type !== 'text') return null;

    const jsonText = content.text.trim().replace(/^```json\n?/, '').replace(/\n?```$/, '');
    return JSON.parse(jsonText) as DailyStrategyResult;
  } catch (error) {
    console.error('generateDailyStrategy error:', error);
    return null;
  }
}

export async function generateWhyNow(
  customer: Customer,
  recentSignals: string[]
): Promise<string | null> {
  try {
    const message = await client.messages.create({
      model: MODEL,
      max_tokens: 200,
      messages: [
        {
          role: 'user',
          content: `你是 Alibaba Cloud 的 BD 策略顧問。

客戶資料：
- 公司：${customer.company_name}
- 產業：${customer.industry}
- 目前使用雲：${customer.current_cloud}
- 切入點：${customer.entry_points.join(', ')}
- 近期信號：${recentSignals.join('; ')}

請用繁體中文寫出「為什麼現在是聯繫這家客戶的最好時機」（1-2句話，要有緊迫感和說服力，直接給 BD 用的話術素材）。只輸出文字，不要其他內容。`,
        },
      ],
    });

    const content = message.content[0];
    if (content.type !== 'text') return null;
    return content.text.trim();
  } catch (error) {
    console.error('generateWhyNow error:', error);
    return null;
  }
}

export async function generateWeeklyStrategy(context: {
  allCustomers: Customer[];
  pipelineItems: (PipelineStage & { customer: Customer })[];
  weekNews: CloudVendorNews[];
  pastStrategies: DailyStrategy[];
}): Promise<WeeklyStrategyResult | null> {
  try {
    const contextStr = JSON.stringify({
      allCustomers: context.allCustomers.map((c) => ({
        id: c.id,
        company_name: c.company_name,
        priority_label: c.priority_label,
        priority_score: c.priority_score,
        industry: c.industry,
        entry_points: c.entry_points,
        estimated_arr: c.estimated_arr,
        why_now: c.why_now,
        last_contacted: c.last_contacted,
      })),
      pipeline: context.pipelineItems.map((p) => ({
        customer_name: p.customer.company_name,
        customer_id: p.customer_id,
        stage: p.stage,
        deal_value: p.deal_value,
        expected_close: p.expected_close,
        blockers: p.blockers,
        risk_level: p.risk_level,
        days_in_stage: Math.floor((Date.now() - p.entered_at.getTime()) / (1000 * 60 * 60 * 24)),
      })),
      weekNews: context.weekNews.slice(0, 10).map((n) => ({
        vendor: n.vendor,
        title: n.title,
        category: n.category,
      })),
      pastActions: context.pastStrategies.slice(0, 5).flatMap((s) => {
        const actions = s.top3_actions as Array<{ customer_name: string; action: string }>;
        return actions.map((a) => `${a.customer_name}: ${a.action}`);
      }),
    });

    const message = await client.messages.create({
      model: MODEL,
      max_tokens: 2500,
      messages: [
        {
          role: 'user',
          content: `你是 Alibaba Cloud 台灣 BD 作戰室的 AI 策略顧問。今天是 ${new Date().toLocaleDateString('zh-TW')}（週一，本週策略規劃日）。

根據以下資料，生成本週與本月的 BD 策略規劃：

${contextStr}

請輸出 JSON（全部用繁體中文，只輸出 JSON，不要有其他文字）：
{
  "weekly_focus": "本週最重要的攻堅重點（2-3句，包含具體客戶名稱和理由）",
  "monthly_direction": "本月整體方向（3-4句，從 pipeline 健康度、ARR 目標、市場機會三個角度）",
  "top3_actions": [
    {
      "priority": 1,
      "customer_name": "公司名",
      "customer_id": "id",
      "action": "本週必做的具體行動（20字內）",
      "reason": "為什麼這週是關鍵時機",
      "opening_pitch": "建議開場白（2句話內）"
    }
  ],
  "abandon_list": [
    {"customer_name": "公司名", "customer_id": "id", "reason": "為何本週應放棄/暫緩"}
  ]
}

判斷邏輯：
- weekly_focus 應聚焦在本週可關閉或推進的案件
- monthly_direction 要有數字感（預估 ARR、案件數量、Win Rate）
- Top 3 優先選 Attack Now + 有近期 expected_close 的
- abandon_list 放本週不值得投入時間的客戶`,
        },
      ],
    });

    const content = message.content[0];
    if (content.type !== 'text') return null;

    const jsonText = content.text.trim().replace(/^```json\n?/, '').replace(/\n?```$/, '');
    return JSON.parse(jsonText) as WeeklyStrategyResult;
  } catch (error) {
    console.error('generateWeeklyStrategy error:', error);
    return null;
  }
}

export async function summarizeNewsArticle(
  title: string,
  content: string
): Promise<{ summary: string; category: string } | null> {
  try {
    const message = await client.messages.create({
      model: MODEL,
      max_tokens: 400,
      messages: [
        {
          role: 'user',
          content: `請分析以下雲端新聞文章，輸出 JSON（繁體中文，只輸出 JSON）：

標題：${title}
內容：${content.slice(0, 2000)}

輸出格式：
{
  "summary": "200字內的摘要，重點是對 BD 的影響",
  "category": "news|product|promotion|incident"
}`,
        },
      ],
    });

    const content2 = message.content[0];
    if (content2.type !== 'text') return null;
    const jsonText = content2.text.trim().replace(/^```json\n?/, '').replace(/\n?```$/, '');
    return JSON.parse(jsonText);
  } catch (error) {
    console.error('summarizeNewsArticle error:', error);
    return null;
  }
}

export type EmailScenario = 'cold' | 'post_incident' | 'event_followup';

export interface OutreachEmailResult {
  subject_zh: string;
  body_zh: string;
  subject_en: string;
  body_en: string;
}

export interface EmailContactInfo {
  name?: string;
  title?: string;
  email?: string;
}

export async function generateOutreachEmail(
  customer: {
    company_name: string;
    industry: string | null;
    current_cloud: string | null;
    pain_points: string[];
    entry_points: string[];
    why_now: string | null;
    opening_pitch: string | null;
    estimated_arr: number | null;
  },
  contact: EmailContactInfo,
  scenario: EmailScenario,
  incidentVendor?: string
): Promise<OutreachEmailResult | null> {
  try {
    const recipientName = contact.name || '您好';
    const recipientTitle = contact.title || '';

    const scenarioContext = {
      cold: '這是第一次主動接觸，對方不認識我們',
      post_incident: `對方目前使用的 ${incidentVendor || customer.current_cloud} 剛發生服務中斷或異常`,
      event_followup: '我們在活動或展會上見過面，現在做後續跟進',
    }[scenario];

    const prompt = `你是 Alibaba Cloud 台灣的資深 BD，擅長寫讓人忍不住想回信的商務開發信。

客戶資料：
- 公司：${customer.company_name}
- 產業：${customer.industry || '未知'}
- 目前使用雲：${customer.current_cloud || '未知'}
- 痛點：${customer.pain_points.join('、') || '未知'}
- 切入點：${customer.entry_points.join('、') || '未知'}
- 時機：${customer.why_now || '未知'}
- 建議開場白參考：${customer.opening_pitch || '無'}

收件人：${recipientName}${recipientTitle ? `，${recipientTitle}` : ''}
情境：${scenarioContext}

寫信原則（非常重要）：
1. 信不能超過 120 字（中文）/ 100 words（英文）
2. 開頭第一句必須讓對方有共鳴或感到驚訝，不能用「我是 Alibaba Cloud 的...」開頭
3. 只提 1 個核心價值，不要列清單
4. 結尾是軟性 CTA：「15 分鐘電話，這週有空嗎？」風格
5. 語氣：直接、有自信、像一個朋友告訴你一個好機會，不要像廣告
6. 不要寫「貴公司」、「謹此」等正式套語
7. 署名只寫 [你的名字] 和 Alibaba Cloud

請輸出 JSON（只輸出 JSON，不要其他文字）：
{
  "subject_zh": "主旨（20字內，讓人忍不住點開）",
  "body_zh": "中文信件內文（含稱呼，不含主旨）",
  "subject_en": "Subject line (under 10 words, curiosity-driven)",
  "body_en": "English email body (including greeting, excluding subject)"
}`;

    const message = await client.messages.create({
      model: MODEL,
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = message.content[0];
    if (content.type !== 'text') return null;
    const jsonText = content.text.trim().replace(/^```json\n?/, '').replace(/\n?```$/, '');
    return JSON.parse(jsonText) as OutreachEmailResult;
  } catch (error) {
    console.error('generateOutreachEmail error:', error);
    return null;
  }
}
