export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { scoreAndUpdateCustomer } from '@/lib/scoring';

const SAMPLE_CUSTOMERS = [
  {
    company_name: '台灣積體電路製造股份有限公司 (TSMC)',
    industry: '半導體製造',
    region: 'TW',
    company_size: 'Enterprise',
    website: 'https://www.tsmc.com',
    current_cloud: 'AWS',
    priority_label: 'Attack Now',
    priority_score: 85,
    entry_points: ['AI/GPU運算', '大數據分析', '全球多區域部署'],
    estimated_arr: 2400000,
    why_now: '積極擴充 AI 晶片設計模擬運算需求，AWS 成本持續飆升，正在評估多雲策略',
    opening_pitch: '阿里雲 PAI + 靈積 GPU 叢集可讓您的 EDA 模擬成本降低 35%，且中國大陸區域延遲優於 AWS',
    pain_points: ['AWS GPU 資源不足導致排隊等待', '跨國資料傳輸延遲高', '月帳單超預算'],
    tech_stack: ['Kubernetes', 'TensorFlow', 'Spark', 'Oracle DB'],
  },
  {
    company_name: '富邦金融控股股份有限公司',
    industry: '金融服務',
    region: 'TW',
    company_size: 'Enterprise',
    website: 'https://www.fubon.com',
    current_cloud: 'Azure',
    priority_label: 'Attack Now',
    priority_score: 78,
    entry_points: ['金融科技', 'AI 風控', '數據中台'],
    estimated_arr: 1800000,
    why_now: '數位轉型二期計畫啟動，正在評估雲端供應商，對 Azure 合規成本有疑慮',
    opening_pitch: '阿里雲金融雲符合台灣 FSC 與中國銀保監合規要求，同時支援兩岸業務',
    pain_points: ['Azure 授權費持續上漲', '兩岸數據合規複雜', 'AI 模型訓練成本高'],
    tech_stack: ['Java Spring', 'Oracle', 'Kafka', 'Elasticsearch'],
  },
  {
    company_name: '台灣大哥大股份有限公司',
    industry: '電信服務',
    region: 'TW',
    company_size: 'Enterprise',
    website: 'https://www.taiwanmobile.com',
    current_cloud: 'AWS',
    priority_label: 'Nurture',
    priority_score: 65,
    entry_points: ['5G 邊緣運算', 'IoT 平台', '影音串流'],
    estimated_arr: 1200000,
    why_now: '5G 服務大規模商用，邊緣節點需求暴增，AWS Local Zones 在台灣佈點不足',
    opening_pitch: '阿里雲 ENS 邊緣節點在台灣有多個 POP，延遲比 AWS 低 40%，適合 5G 即時業務',
    pain_points: ['邊緣節點覆蓋不足', 'CDN 成本過高', '即時數據處理延遲'],
    tech_stack: ['Node.js', 'Redis', 'MongoDB', 'Nginx'],
  },
  {
    company_name: '香港電訊有限公司 (HKT)',
    industry: '電信服務',
    region: 'HK',
    company_size: 'Enterprise',
    website: 'https://www.hkt.com',
    current_cloud: 'GCP',
    priority_label: 'Nurture',
    priority_score: 72,
    entry_points: ['企業雲服務', '數據中心互聯', 'AI 客服'],
    estimated_arr: 960000,
    why_now: 'GCP 在亞太區域擴張計畫縮減，客戶反映服務支援不足，正在評估替代方案',
    opening_pitch: '阿里雲香港 Region 三可用區，配合大陸節點，為港資企業提供最優互聯互通方案',
    pain_points: ['GCP 亞太區支援響應慢', '大陸互聯頻寬昂貴', '合規審查複雜'],
    tech_stack: ['Python', 'BigQuery', 'Kubernetes', 'Terraform'],
  },
  {
    company_name: '美心集團 (Maxim\'s Group)',
    industry: '餐飲零售',
    region: 'HK',
    company_size: 'Large',
    website: 'https://www.maxims.com.hk',
    current_cloud: 'AWS',
    priority_label: 'Nurture',
    priority_score: 58,
    entry_points: ['零售數字化', '供應鏈優化', '會員系統'],
    estimated_arr: 480000,
    why_now: '計畫 2026 年底前完成全港門市數字化，需要能整合 POS、庫存、會員的統一雲平台',
    opening_pitch: '阿里雲零售解決方案已在超過 200 個零售品牌落地，含 POS 整合、AIoT 門市管理',
    pain_points: ['門市系統碎片化', '庫存預測不準確', '會員數據無法統一'],
    tech_stack: ['PHP', 'MySQL', 'Magento', 'SAP'],
  },
  {
    company_name: '新加坡電信有限公司 (Singtel)',
    industry: '電信服務',
    region: 'SG',
    company_size: 'Enterprise',
    website: 'https://www.singtel.com',
    current_cloud: 'AWS',
    priority_label: 'Attack Now',
    priority_score: 80,
    entry_points: ['東南亞雲服務', '企業數位轉型', 'AI 基礎設施'],
    estimated_arr: 2000000,
    why_now: '東南亞市場擴張，需要在印尼、馬來西亞、泰國有本地化雲資源，AWS 區域覆蓋不足',
    opening_pitch: '阿里雲在東南亞有 8 個 Region，Singtel 可透過 ISP 合作模式在本地落地',
    pain_points: ['東南亞節點覆蓋不足', '本地合規要求', '建置成本高'],
    tech_stack: ['Java', 'Kubernetes', 'Kafka', 'PostgreSQL'],
  },
];

export async function POST() {
  let created = 0;
  let skipped = 0;

  for (const c of SAMPLE_CUSTOMERS) {
    const existing = await prisma.customer.findFirst({
      where: { company_name: c.company_name },
    });
    if (existing) { skipped++; continue; }

    const customer = await prisma.customer.create({ data: c });
    await scoreAndUpdateCustomer(customer.id);
    created++;
  }

  // Also create sample pipeline stages for Attack Now customers
  if (created > 0) {
    const attackNow = await prisma.customer.findMany({
      where: { priority_label: 'Attack Now' },
      take: 3,
    });

    const stages = ['prospect', 'demo', 'proposal'];
    for (let i = 0; i < attackNow.length; i++) {
      const existing = await prisma.pipelineStage.findFirst({
        where: { customer_id: attackNow[i].id },
      });
      if (!existing) {
        await prisma.pipelineStage.create({
          data: {
            customer_id: attackNow[i].id,
            stage: stages[i % stages.length],
            deal_value: attackNow[i].estimated_arr ? Math.floor(attackNow[i].estimated_arr! * 0.8) : 500000,
            risk_level: 'medium',
            notes: '從 admin seed 建立的初始 pipeline 紀錄',
          },
        });
      }
    }
  }

  return NextResponse.json({ created, skipped, total: SAMPLE_CUSTOMERS.length });
}
