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
  { vendor: 'AWS', url: 'https://aws.amazon.com/blogs/aws/feed/', credibility: 3 },
  { vendor: 'Azure', url: 'https://azure.microsoft.com/en-us/blog/feed/', credibility: 3 },
  { vendor: 'GCP', url: 'https://cloudblog.withgoogle.com/rss/', credibility: 3 },
  { vendor: 'Cloudflare', url: 'https://blog.cloudflare.com/rss/', credibility: 3 },
  { vendor: 'Alibaba', url: 'https://www.alibabacloud.com/blog/feed/', credibility: 3 },
];

const KEYWORDS = [
  'AI', 'GPU', 'pricing', 'price', 'outage', 'launch', 'new', 'release',
  'cloud', 'region', 'CDN', 'security', 'compliance', 'China', 'Asia',
  '漲價', '降價', '中斷', '新功能', '亞太',
];

function isRelevant(title: string): boolean {
  const lower = title.toLowerCase();
  return KEYWORDS.some((kw) => lower.includes(kw.toLowerCase()));
}

function isWithin24Hours(dateStr: string | undefined): boolean {
  if (!dateStr) return false;
  const date = new Date(dateStr);
  const now = Date.now();
  return now - date.getTime() < 24 * 60 * 60 * 1000;
}

export async function fetchAllVendorNews(lightweightMode = false): Promise<void> {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

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
  }> = [];

  // Fetch all feeds
  for (const source of FEED_SOURCES) {
    try {
      const feed = await parser.parseURL(source.url);
      for (const item of feed.items || []) {
        if (!item.link || !item.title) continue;
        if (existingUrlSet.has(item.link)) continue;
        if (!isWithin24Hours(item.pubDate)) continue;
        if (!isRelevant(item.title)) continue;

        newArticles.push({
          vendor: source.vendor,
          title: item.title,
          url: item.link,
          credibility: source.credibility,
          pubDate: item.pubDate || new Date().toISOString(),
          content: (item as unknown as Record<string, unknown>).contentEncoded as string || item.content || item.contentSnippet || '',
        });
      }
    } catch (error) {
      console.error(`[news-fetcher] Failed to fetch ${source.vendor}:`, error);
    }
  }

  if (lightweightMode) {
    // Only save titles, no AI summarization
    for (const article of newArticles) {
      try {
        await prisma.cloudVendorNews.create({
          data: {
            vendor: article.vendor,
            title: article.title,
            url: article.url,
            source: article.vendor + ' Blog',
            credibility: article.credibility,
            category: 'news',
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

  // Full mode: AI summarization
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
          category: analysis?.category || 'news',
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
