import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Clean existing data
  await prisma.customerScore.deleteMany();
  await prisma.meetingNote.deleteMany();
  await prisma.pipelineStage.deleteMany();
  await prisma.contact.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.partner.deleteMany();
  await prisma.cloudVendorNews.deleteMany();
  await prisma.serviceStatus.deleteMany();
  await prisma.statusIncident.deleteMany();
  await prisma.dailyStrategy.deleteMany();

  // --- Customers ---
  const trendmicro = await prisma.customer.create({
    data: {
      company_name: 'TrendMicro',
      industry: 'Cybersecurity',
      region: 'Taiwan',
      company_size: 'enterprise',
      website: 'https://www.trendmicro.com',
      current_cloud: 'AWS',
      priority_label: 'Attack Now',
      priority_score: 85,
      entry_points: ['AI', 'Global', 'Cost'],
      estimated_arr: 500000,
      why_now: 'AWS 近期亞太漲價 15%，趨勢科技正擴張東南亞，Alibaba 節點+價格有優勢',
      opening_pitch: '我們有客戶從 AWS 遷移後亞太延遲降 40%、成本省 30%，您這邊有評估過多雲策略嗎？',
      pain_points: ['AWS 成本偏高', '東南亞節點延遲', '全球合規需求'],
      tech_stack: ['AWS EC2', 'AWS S3', 'AWS CloudFront'],
      last_contacted: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    },
  });

  const live17 = await prisma.customer.create({
    data: {
      company_name: '17LIVE',
      industry: 'Live Streaming',
      region: 'Taiwan',
      company_size: 'mid',
      website: 'https://17.live',
      current_cloud: 'AWS',
      priority_label: 'Attack Now',
      priority_score: 78,
      entry_points: ['CDN', 'Global', 'GPU'],
      estimated_arr: 300000,
      why_now: 'AWS CloudFront 東南亞近期有服務異常，直播平台對延遲極敏感',
      opening_pitch: '直播最怕 CDN 不穩，我們上週有客戶用完 Alibaba CDN 延遲掉到 50ms 以下...',
      pain_points: ['CDN 延遲', '高峰流量費用', '東南亞覆蓋'],
      tech_stack: ['AWS CloudFront', 'AWS MediaLive', 'Kubernetes'],
      last_contacted: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    },
  });

  const gogoro = await prisma.customer.create({
    data: {
      company_name: 'Gogoro',
      industry: 'EV / IoT',
      region: 'Taiwan',
      company_size: 'mid',
      website: 'https://www.gogoro.com',
      current_cloud: 'GCP',
      priority_label: 'Nurture',
      priority_score: 65,
      entry_points: ['China Access', 'AI', 'Cost'],
      estimated_arr: 200000,
      why_now: 'Gogoro 擴張中國大陸業務，需要合規雲服務，這是 Alibaba 獨特優勢',
      opening_pitch: '你們在做中國大陸市場，資料合規和存取速度的問題，我們有現成解法...',
      pain_points: ['中國大陸資料合規', 'GCP 無中國節點', 'IoT 資料延遲'],
      tech_stack: ['GCP', 'Kubernetes', 'BigQuery'],
      last_contacted: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    },
  });

  const kkbox = await prisma.customer.create({
    data: {
      company_name: 'KKBOX',
      industry: 'Music Streaming',
      region: 'Taiwan',
      company_size: 'mid',
      website: 'https://www.kkbox.com',
      current_cloud: 'AWS',
      priority_label: 'Nurture',
      priority_score: 62,
      entry_points: ['CDN', 'Cost', 'AI'],
      estimated_arr: 150000,
      why_now: '串流音樂對 CDN 成本敏感，Alibaba CDN 在台灣+東南亞有價格優勢',
      opening_pitch: '音樂串流的 CDN 流量成本很高，我們可以幫你算一下切過來能省多少...',
      pain_points: ['CDN 成本高', '東南亞擴張需求'],
      tech_stack: ['AWS CloudFront', 'AWS RDS', 'Redis'],
      last_contacted: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
    },
  });

  const appier = await prisma.customer.create({
    data: {
      company_name: 'Appier',
      industry: 'AI / AdTech',
      region: 'Taiwan / Japan',
      company_size: 'mid',
      website: 'https://www.appier.com',
      current_cloud: 'GCP',
      priority_label: 'Partner First',
      priority_score: 55,
      entry_points: ['AI', 'GPU', 'Global'],
      estimated_arr: 400000,
      why_now: 'AI 公司對 GPU 需求大，Alibaba Cloud GPU 價格比 GCP 便宜 20-30%',
      opening_pitch: '你們 AI model training 的 GPU 成本，有沒有做過多雲比較？',
      pain_points: ['GPU 成本', '日本市場擴張', 'AI 訓練速度'],
      tech_stack: ['GCP', 'NVIDIA GPU', 'TensorFlow', 'PyTorch'],
      last_contacted: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
    },
  });

  const ikala = await prisma.customer.create({
    data: {
      company_name: 'iKala',
      industry: 'Data / AI',
      region: 'Taiwan / SEA',
      company_size: 'startup',
      website: 'https://ikala.ai',
      current_cloud: 'GCP',
      priority_label: 'Monitor',
      priority_score: 40,
      entry_points: ['AI', 'Cost', 'SEA'],
      estimated_arr: 100000,
      why_now: '東南亞市場擴張，GCP 在部分 SEA 市場節點不足',
      opening_pitch: '你們東南亞的業務，有沒有遇到 GCP 節點覆蓋不夠的問題？',
      pain_points: ['SEA 節點覆蓋', 'AI 工具整合'],
      tech_stack: ['GCP', 'BigQuery', 'Vertex AI'],
      last_contacted: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    },
  });

  // --- Contacts ---
  await prisma.contact.createMany({
    data: [
      {
        customer_id: trendmicro.id,
        name: 'Kevin Chen',
        title: 'VP of Infrastructure',
        email: 'kevin.chen@trendmicro.com',
        influence: 'decision_maker',
        notes: '技術決策者，對成本最敏感',
      },
      {
        customer_id: trendmicro.id,
        name: 'Lisa Wang',
        title: 'Cloud Architect',
        email: 'lisa.wang@trendmicro.com',
        influence: 'champion',
        notes: '技術評估主導者，對 Alibaba 有好奇心',
      },
      {
        customer_id: live17.id,
        name: 'Michael Lin',
        title: 'CTO',
        email: 'michael@17.live',
        influence: 'decision_maker',
        notes: '直接拍板，對 CDN 效能非常重視',
      },
      {
        customer_id: gogoro.id,
        name: 'Andy Huang',
        title: 'Head of Cloud Infrastructure',
        email: 'andy.huang@gogoro.com',
        influence: 'champion',
        notes: '負責中國業務雲端架構',
      },
      {
        customer_id: appier.id,
        name: 'Winnie Hsu',
        title: 'Director of Engineering',
        email: 'winnie@appier.com',
        influence: 'champion',
        notes: '主導 GPU 採購決策',
      },
    ],
  });

  // --- Pipeline Stages ---
  const now = new Date();
  await prisma.pipelineStage.createMany({
    data: [
      {
        customer_id: trendmicro.id,
        stage: 'proposal',
        entered_at: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
        expected_close: new Date(now.getTime() + 45 * 24 * 60 * 60 * 1000),
        deal_value: 500000,
        risk_level: 'medium',
        next_action: '發送 POC 技術方案文件',
        next_action_due: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
        notes: 'Kevin 要求提供亞太區延遲對比數據',
      },
      {
        customer_id: live17.id,
        stage: 'poc',
        entered_at: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000),
        expected_close: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
        deal_value: 300000,
        risk_level: 'low',
        next_action: '安排 CDN 壓測',
        next_action_due: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
        notes: 'Michael 對初步測試結果滿意',
      },
      {
        customer_id: gogoro.id,
        stage: 'meeting',
        entered_at: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
        expected_close: new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000),
        deal_value: 200000,
        risk_level: 'medium',
        next_action: '提供中國合規雲服務方案',
        next_action_due: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
        notes: '等待法務確認中國資料合規要求',
        blockers: '內部法務審核流程較慢',
      },
      {
        customer_id: kkbox.id,
        stage: 'lead',
        entered_at: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000),
        expected_close: new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000),
        deal_value: 150000,
        risk_level: 'low',
        next_action: '發送 CDN 成本試算報告',
        next_action_due: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
      },
      {
        customer_id: appier.id,
        stage: 'negotiation',
        entered_at: new Date(now.getTime() - 35 * 24 * 60 * 60 * 1000),
        expected_close: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
        deal_value: 400000,
        risk_level: 'high',
        next_action: '確認合約條款',
        next_action_due: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000),
        blockers: '對方採購部門要求降價 15%',
      },
      {
        customer_id: ikala.id,
        stage: 'lead',
        entered_at: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
        expected_close: new Date(now.getTime() + 120 * 24 * 60 * 60 * 1000),
        deal_value: 100000,
        risk_level: 'low',
        next_action: '邀請參加 Alibaba Cloud 技術活動',
        next_action_due: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
      },
    ],
  });

  // --- Customer Scores ---
  await prisma.customerScore.createMany({
    data: [
      {
        customer_id: trendmicro.id,
        pain_signal: 10,
        budget_signal: 8,
        timeline_signal: 8,
        tech_fit: 8,
        competitor_issue: 10,
        china_expansion: 0,
        ai_gpu_demand: 5,
        decision_maker_access: 15,
        relationship_warmth: 10,
        company_size_fit: 5,
        total_score: 85,
        ai_reason: 'AWS 漲價+東南亞佈局，完美切入時機，決策者明確',
        calculated_at: new Date(),
      },
      {
        customer_id: live17.id,
        pain_signal: 10,
        budget_signal: 7,
        timeline_signal: 8,
        tech_fit: 8,
        competitor_issue: 10,
        china_expansion: 0,
        ai_gpu_demand: 3,
        decision_maker_access: 10,
        relationship_warmth: 10,
        company_size_fit: 5,
        total_score: 78,
        ai_reason: 'CDN 痛點明確，CTO 直接接觸，AWS 異常是完美時機',
        calculated_at: new Date(),
      },
      {
        customer_id: gogoro.id,
        pain_signal: 7,
        budget_signal: 5,
        timeline_signal: 5,
        tech_fit: 7,
        competitor_issue: 5,
        china_expansion: 10,
        ai_gpu_demand: 3,
        decision_maker_access: 5,
        relationship_warmth: 7,
        company_size_fit: 5,
        total_score: 65,
        ai_reason: '中國市場合規是獨特切入點，但決策流程較慢',
        calculated_at: new Date(),
      },
      {
        customer_id: kkbox.id,
        pain_signal: 7,
        budget_signal: 5,
        timeline_signal: 3,
        tech_fit: 5,
        competitor_issue: 5,
        china_expansion: 0,
        ai_gpu_demand: 3,
        decision_maker_access: 5,
        relationship_warmth: 5,
        company_size_fit: 5,
        total_score: 62,
        ai_reason: 'CDN 成本是明確痛點，但決策時間線模糊',
        calculated_at: new Date(),
      },
      {
        customer_id: appier.id,
        pain_signal: 7,
        budget_signal: 7,
        timeline_signal: 5,
        tech_fit: 5,
        competitor_issue: 5,
        china_expansion: 0,
        ai_gpu_demand: 5,
        decision_maker_access: 10,
        relationship_warmth: 3,
        company_size_fit: 5,
        total_score: 55,
        ai_reason: 'GPU 需求真實，但關係較冷，需要合作夥伴介入',
        calculated_at: new Date(),
      },
      {
        customer_id: ikala.id,
        pain_signal: 5,
        budget_signal: 3,
        timeline_signal: 2,
        tech_fit: 5,
        competitor_issue: 3,
        china_expansion: 0,
        ai_gpu_demand: 5,
        decision_maker_access: 5,
        relationship_warmth: 3,
        company_size_fit: 0,
        total_score: 40,
        ai_reason: 'SEA 擴張潛力，但預算有限，長期觀察',
        calculated_at: new Date(),
      },
    ],
  });

  // --- Partners ---
  await prisma.partner.createMany({
    data: [
      {
        name: 'Systex（精誠資訊）',
        type: 'SI',
        services: ['Cloud Migration', 'SAP', 'ERP'],
        regions: ['Taiwan'],
        cloud_alliances: ['AWS', 'Azure'],
        cooperation_type: 'collaborate',
        contact_info: 'partner@systex.com',
        notes: '台灣最大 SI，有機會帶入企業客戶',
      },
      {
        name: 'Adata（威剛）',
        type: 'gpu_vendor',
        services: ['GPU Server', 'AI Infrastructure'],
        regions: ['Taiwan', 'Global'],
        cloud_alliances: [],
        cooperation_type: 'collaborate',
        contact_info: 'cloud@adata.com',
        notes: 'GPU 硬體合作夥伴，可聯合銷售 AI 方案',
      },
      {
        name: 'Acer Cloud',
        type: 'MSP',
        services: ['Cloud Management', 'Managed Services'],
        regions: ['Taiwan', 'SEA'],
        cloud_alliances: ['Azure', 'AWS'],
        cooperation_type: 'conflict_risk',
        contact_info: 'cloud@acer.com',
        notes: '主要代理 Azure/AWS，有撞單風險，注意共同客戶',
      },
      {
        name: 'KingNet（網路家庭）',
        type: 'reseller',
        services: ['Cloud Reselling', 'Technical Support'],
        regions: ['Taiwan'],
        cloud_alliances: [],
        cooperation_type: 'monitor',
        contact_info: 'bd@kingnet.com.tw',
        notes: '觀察中，評估是否有合作空間',
      },
    ],
  });

  // --- Cloud Vendor News ---
  const newsBase = new Date(Date.now() - 6 * 60 * 60 * 1000);
  await prisma.cloudVendorNews.createMany({
    data: [
      {
        vendor: 'AWS',
        title: 'AWS Bedrock 宣布大幅降低 Claude 3 API 調用價格',
        summary: 'Amazon Web Services 宣布 Bedrock 平台上 Anthropic Claude 3 系列模型價格下調最高 40%，此舉旨在加速企業 AI 採用。此消息對競爭對手造成壓力，但也反映出 AI API 市場競爭激烈。',
        url: 'https://aws.amazon.com/blogs/aws/bedrock-pricing-update',
        source: 'AWS Blog',
        credibility: 3,
        category: 'promotion',
        published_at: new Date(newsBase.getTime() - 1 * 60 * 60 * 1000),
      },
      {
        vendor: 'Azure',
        title: 'Microsoft Azure OpenAI GPT-4o 全球區域全面上線',
        summary: 'Azure OpenAI Service 宣布 GPT-4o 模型現已在全球所有主要區域可用，包含亞太地區。企業客戶可透過 Azure 安全合規環境存取最新 GPT-4o 功能。',
        url: 'https://azure.microsoft.com/blog/gpt4o-global-availability',
        source: 'Azure Blog',
        credibility: 3,
        category: 'product',
        published_at: new Date(newsBase.getTime() - 2 * 60 * 60 * 1000),
      },
      {
        vendor: 'GCP',
        title: 'Google Cloud 宣布新增香港及台北 Region',
        summary: 'Google Cloud Platform 宣布在香港新增第二個可用區，並計劃 2025 年在台北開設新 Region。此舉強化了 GCP 在亞太地區的基礎設施，對本地數據合規需求更有利。',
        url: 'https://cloud.google.com/blog/hongkong-taipei-region',
        source: 'GCP Blog',
        credibility: 3,
        category: 'news',
        published_at: new Date(newsBase.getTime() - 3 * 60 * 60 * 1000),
      },
      {
        vendor: 'Cloudflare',
        title: 'Cloudflare Workers AI 新增支援 Llama 3.1 及多項開源模型',
        summary: 'Cloudflare 宣布 Workers AI 平台新增 Meta Llama 3.1、Mistral 等多項熱門開源模型，開發者可在邊緣節點直接執行 AI 推理，延遲大幅降低。',
        url: 'https://blog.cloudflare.com/workers-ai-new-models',
        source: 'Cloudflare Blog',
        credibility: 3,
        category: 'product',
        published_at: new Date(newsBase.getTime() - 4 * 60 * 60 * 1000),
      },
      {
        vendor: 'Alibaba',
        title: 'Alibaba Cloud 國際版推出 ModelScope 整合，開放 AI 模型市集',
        summary: 'Alibaba Cloud 宣布國際版整合 ModelScope 模型市集，提供超過 5000 個開源 AI 模型，支援一鍵部署至 Alibaba Cloud ECS 和 PAI 平台。此舉使 Alibaba Cloud 在 AI 基礎設施市場更具競爭力。',
        url: 'https://www.alibabacloud.com/blog/modelscope-integration',
        source: 'Alibaba Cloud Blog',
        credibility: 3,
        category: 'product',
        published_at: new Date(newsBase.getTime() - 2 * 60 * 60 * 1000),
      },
      {
        vendor: 'Tencent',
        title: 'Tencent Cloud 推出遊戲雲全新 Global Server Solution',
        summary: 'Tencent Cloud 針對遊戲行業推出全新 Global Server Solution，整合低延遲全球加速網路及反作弊系統。特別強化東南亞及日韓地區的遊戲服務支援能力。',
        url: 'https://www.tencentcloud.com/blog/gaming-global-solution',
        source: 'Tencent Cloud Blog',
        credibility: 3,
        category: 'product',
        published_at: new Date(newsBase.getTime() - 5 * 60 * 60 * 1000),
      },
      {
        vendor: 'Oracle',
        title: 'Oracle Cloud 免費層大幅擴展，新增 Ampere GPU 執行個體',
        summary: 'Oracle Cloud Infrastructure 宣布擴大永久免費方案，新增 NVIDIA A10 GPU 每月 744 小時免費額度。此優惠旨在吸引 AI 開發者和新創公司試用 OCI 平台。',
        url: 'https://www.oracle.com/cloud/free/oci-free-tier-expansion',
        source: 'Oracle Blog',
        credibility: 3,
        category: 'promotion',
        published_at: new Date(newsBase.getTime() - 6 * 60 * 60 * 1000),
      },
      {
        vendor: 'Huawei',
        title: 'Huawei Cloud 歐洲第二個 Region 正式開通，覆蓋法蘭克福',
        summary: 'Huawei Cloud 宣布歐洲法蘭克福 Region 正式上線，提供完整的雲端服務套件。此舉強化了 Huawei 在歐洲的數據主權合規能力，針對有歐洲業務的亞洲企業客戶。',
        url: 'https://www.huaweicloud.com/blog/europe-frankfurt-region',
        source: 'Huawei Cloud Blog',
        credibility: 3,
        category: 'news',
        published_at: new Date(newsBase.getTime() - 7 * 60 * 60 * 1000),
      },
    ],
  });

  // --- Service Status ---
  await prisma.serviceStatus.createMany({
    data: [
      { vendor: 'AWS', status: 'operational', affected_services: [], checked_at: new Date() },
      { vendor: 'Azure', status: 'operational', affected_services: [], checked_at: new Date() },
      { vendor: 'GCP', status: 'operational', affected_services: [], checked_at: new Date() },
      { vendor: 'Cloudflare', status: 'operational', affected_services: [], checked_at: new Date() },
      { vendor: 'Alibaba', status: 'operational', affected_services: [], checked_at: new Date() },
      { vendor: 'Tencent', status: 'operational', affected_services: [], checked_at: new Date() },
      { vendor: 'Oracle', status: 'operational', affected_services: [], checked_at: new Date() },
      { vendor: 'Huawei', status: 'operational', affected_services: [], checked_at: new Date() },
    ],
  });

  // --- Today's Strategy ---
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  await prisma.dailyStrategy.create({
    data: {
      date: today,
      top3_actions: [
        {
          priority: 1,
          customer_name: 'Appier',
          customer_id: appier.id,
          action: '今日確認合約折扣條款，避免失去談判主動權',
          reason: '已進入 Negotiation 35天，採購部要求降價15%，今天必須給出最終回應',
          opening_pitch: '我理解你們對價格的考量，我可以在其他項目上給你彈性，但 GPU 方案我們的底線是...',
        },
        {
          priority: 2,
          customer_name: 'TrendMicro',
          customer_id: trendmicro.id,
          action: '發送亞太延遲對比 POC 技術方案文件',
          reason: 'Kevin 等待文件已超過 2 天，拖延會失去購買動機',
          opening_pitch: '你好，昨天整理好了 POC 方案和延遲測試數據，剛才發到你信箱，有時間 review 一下嗎？',
        },
        {
          priority: 3,
          customer_name: '17LIVE',
          customer_id: live17.id,
          action: '安排 CDN 壓測，利用 AWS 近期異常作為切入點',
          reason: 'AWS CloudFront 最近有不穩定記錄，現在是最好的切換時機',
          opening_pitch: '我看到你們上週有 CDN 問題，我們的壓測環境準備好了，可以來幫你們跑一次嗎？',
        },
      ],
      weekly_focus: '本週重點攻堅 Appier 合約收尾，同時推進 TrendMicro POC 到下一階段',
      monthly_direction: '本月目標：完成 Appier 合約簽約，TrendMicro 進入 Proposal，17LIVE CDN 切換測試',
      abandon_list: [],
      generated_at: new Date(),
    },
  });

  console.log('Seed completed successfully!');
  console.log(`Created ${6} customers, ${4} partners, ${8} news items`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
