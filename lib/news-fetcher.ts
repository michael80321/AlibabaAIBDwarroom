import Parser from 'rss-parser';
import { prisma } from './prisma';
import { summarizeNewsArticle } from './claude';

const parser = new Parser({
  timeout: 15000,
  customFields: {
    item: [['content:encoded', 'contentEncoded']],
  },
});

interface FeedSource {
  vendor: string;
  url: string;
  credibility: number;
}

const FEED_SOURCES: FeedSource[] = [
  // Tier-1 Credibility (official blogs)
  { vendor: 'AWS', url: 'https://aws.amazon.com/blogs/aws/feed/', credibility: 3 },
  { vendor: 'Azure', url: 'https://azure.microsoft.com/en-us/blog/feed/', credibility: 3 },
  { vendor: 'GCP', url: 'https://cloudblog.withgoogle.com/rss/', credibility: 3 },
  { vendor: 'Cloudflare', url: 'https://blog.cloudflare.com/rss/', credibility: 3 },
  { vendor: 'Alibaba', url: 'https://www.alibabacloud.com/blog/feed/', credibility: 3 },
  { vendor: 'Oracle', url: 'https://blogs.oracle.com/cloud-infrastructure/rss', credibility: 3 },
  // Tier-2 (third-party tech media tracking competitors)
  { vendor: 'AWS', url: 'https://feeds.feedburner.com/AmazonWebServicesBlog', credibility: 2 },
  { vendor: 'Tencent', url: 'https://www.tencentcloud.com/news/rss', credibility: 2 },
];

// BD-relevant keywords — these make an article worth fetching
const BD_KEYWORDS = [
  // Pricing signals (best for sales)
  'pricing', 'price', 'cost', 'discount', 'free tier', 'reduce', 'increase',
  '漲價', '降價', '免費', '折扣', '費用',
  // Outage / incident (call customers on that cloud NOW)
  'outage', 'incident', 'disruption', 'degraded', 'down', 'unavailable', 'impact',
  '中斷', '故障', '異常', '影響',
  // New products / regions (competitive intelligence)
  'launch', 'new', 'release', 'region', 'availability zone', 'generally available', 'preview',
  '新功能', '上線', '新區域', '亞太',
  // AI / GPU (hot buying signal)
  'AI', 'GPU', 'LLM', 'machine learning', 'generative', 'foundation model',
  // China / Asia market signals
  'China', 'Asia', 'APAC', 'Southeast Asia', 'Taiwan', 'Hong Kong', 'Singapore',
  '中國', '亞洲', '東南亞', '台灣', '香港', '新加坡',
  // Security / compliance (enterprise pain points)
  'security', 'compliance', 'GDPR', 'breach', 'vulnerability',
];

// Category keywords to auto-classify
const INCIDENT_KEYWORDS = ['outage', 'incident', 'disruption', 'degraded', 'down', '中斷', '故障', '異常'];
const PROMOTION_KEYWORDS = ['pricing', 'price cut', 'discount', 'free', 'reduce cost', '降價', '免費', '折扣'];
const PRODUCT_KEYWORDS = ['launch', 'release', 'new', 'generally available', 'preview', '上線', '新功能', '發布'];

function classifyCategory(title: string): string {
  const lower = title.toLowerCase();
  if (INCIDENT_KEYWORDS.some((k) => lower.includes(k.toLowerCase()))) return 'incident';
  if (PROMOTION_KEYWORDS.some((k) => lower.includes(k.toLowerCase()))) return 'promotion';
  if (PRODUCT_KEYWORDS.some((k) => lower.includes(k.toLowerCase()))) return 'product';
  return 'news';
}

function isRelevant(title: string): boolean {
  const lower = title.toLowerCase();
  return BD_KEYWORDS.some((kw) => lower.includes(kw.toLowerCase()));
}

function isWithin48Hours(dateStr: string | undefined): boolean {
  if (!dateStr) return false;
  const date = new Date(dateStr);
  const now = Date.now();
  return now - date.getTime() < 48 * 60 * 60 * 1000;
}

export async function fetchAllVendorNews(lightweightMode = false): Promise<void> {
  const since = new Date(Date.now() - 48 * 60 * 60 * 1000);

  // Get existing URLs to avoid duplicates
  const existingUrls = await prisma.cloudVendorNews.findMany({
    where: { published_at: { gte: since } },
    select: { url: true },
  });
  const existingUrlSet = new Set(existingUrls.map((n) => n.url));

  const newArticles: Array<{
    vendor: string;
    title: string;
    url: string;
    credibility: number;
    pubDate: string;
    content: string;
    autoCategory: string;
  }> = [];

  // Fetch all feeds
  for (const source of FEED_SOURCES) {
    try {
      const feed = await parser.parseURL(source.url);
      for (const item of feed.items || []) {
        if (!item.link || !item.title) continue;
        if (existingUrlSet.has(item.link)) continue;
        if (!isWithin48Hours(item.pubDate)) continue;
        if (!isRelevant(item.title)) continue;

        newArticles.push({
          vendor: source.vendor,
          title: item.title,
          url: item.link,
          credibility: source.credibility,
          pubDate: item.pubDate || new Date().toISOString(),
          content: (item as unknown as Record<string, unknown>).contentEncoded as string || item.content || item.contentSnippet || '',
          autoCategory: classifyCategory(item.title),
        });
      }
    } catch (error) {
      console.error(`[news-fetcher] Failed to fetch ${source.vendor}:`, error);
    }
  }

  if (lightweightMode) {
    // Only save with auto-classification, no AI summarization
    for (const article of newArticles) {
      try {
        await prisma.cloudVendorNews.create({
          data: {
            vendor: article.vendor,
            title: article.title,
            url: article.url,
            source: article.vendor + ' Blog',
            credibility: article.credibility,
            category: article.autoCategory,
            published_at: new Date(article.pubDate),
          },
        });
      } catch {
        // Skip duplicates
      }
    }
    console.log(`[news-fetcher] Lightweight scan: ${newArticles.length} new articles saved`);
    return;
  }

  // Full mode: AI summarization with BD angle
  let saved = 0;
  for (const article of newArticles) {
    try {
      const analysis = await summarizeNewsArticle(article.title, article.content);

      await prisma.cloudVendorNews.create({
        data: {
          vendor: article.vendor,
          title: article.title,
          summary: analysis?.summary || null,
          url: article.url,
          source: article.vendor + ' Blog',
          credibility: article.credibility,
          category: analysis?.category || article.autoCategory,
          published_at: new Date(article.pubDate),
        },
      });
      saved++;
    } catch {
      // Skip on error
    }
  }

  console.log(`[news-fetcher] Full scan: ${saved}/${newArticles.length} articles saved with AI summary`);
}
