import type { NextRequest } from 'next/server';
import { supabase } from '../../lib/supabase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function getBaseUrl(req: Request): string {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL;
  if (envUrl) return envUrl.replace(/\/$/, '');

  const proto = req.headers.get('x-forwarded-proto') ?? 'https';
  const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host') ?? 'localhost:3000';
  return `${proto}://${host}`.replace(/\/$/, '');
}

// 日报类型定义（与 scripts/generateDailyReport.ts 中的结构对齐）
interface DailyReportArticle {
  title: string;
  url: string;
  summary?: string;      // 原始简短摘要
  aiSummary?: string;    // AI 生成的详细中文总结（Markdown 原文，这里当作纯文本处理）
  publishTime?: string;
  source?: string;
}

interface DailyReportContent {
  articles: DailyReportArticle[];
  metadata: {
    totalArticles: number;
    generatedAt?: string;
    sources: string[];
  };
}

interface DailyReportRow {
  id: string;
  date: string; // YYYY-MM-DD
  content: DailyReportContent;
  summary: string; // AI 生成的日报总结（Markdown 原文，这里当作纯文本处理）
  created_at?: string;
  updated_at?: string;
}

export async function GET(request: NextRequest): Promise<Response> {
  const baseUrl = getBaseUrl(request);
  const url = new URL(request.url);
  const limitParam = url.searchParams.get('limit');
  let limit = 30;
  if (limitParam) {
    const n = parseInt(limitParam, 10);
    if (!Number.isNaN(n)) {
      limit = Math.min(Math.max(n, 1), 200);
    }
  }

  // 查询最近 30 期日报
  const { data, error } = await supabase
    .from('daily_reports')
    .select('*')
    .order('date', { ascending: false })
    .limit(limit);

  if (error) {
    // 查询失败时返回简单错误 XML（避免 500 HTML 页面污染 RSS 客户端）
    const errXml = `<?xml version="1.0" encoding="UTF-8"?>\n` +
      `<rss version="2.0"><channel><title>AI每日热点 - 日报 RSS</title>` +
      `<description>获取日报失败：${escapeXml(error.message)}</description>` +
      `<link>${escapeXml(baseUrl)}</link></channel></rss>`;
    return new Response(errXml, {
      status: 200,
      headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' }
    });
  }

  const reports: DailyReportRow[] = (data as unknown as DailyReportRow[]) || [];
  const now = new Date();

  const channelTitle = 'AI每日热点 - 每日AI日报';
  const channelDescription = 'AI 自动汇总的每日日报，覆盖研究、开源、行业与技术动态。';
  const channelLink = baseUrl;

  const itemsXml = reports.map((report) => {
    const totalArticles = report.content?.metadata?.totalArticles
      ?? report.content?.articles?.length
      ?? 0;
    const reportDate = report.date;
    const generatedAt = report.content?.metadata?.generatedAt
      ? new Date(report.content.metadata.generatedAt)
      : new Date(`${reportDate}T00:00:00Z`);

    const titleText = `AI 日报 | ${reportDate}（${totalArticles} 条）`;
    const link = `${baseUrl}/?date=${encodeURIComponent(reportDate)}`;
    const pubDate = generatedAt.toUTCString();
    const guid = `daily-${reportDate}`;
    const sources = (report.content?.metadata?.sources || []).join('、');

    // 组装富文本内容（content:encoded）
    const articlesHtml = (report.content?.articles || [])
      .slice(0, 10)
      .map((a, idx) => {
        const safeTitle = escapeXml(a.title || '无标题');
        const safeSource = escapeXml(a.source || '');
        const safeUrl = a.url ? escapeXml(a.url) : '#';
        const ai = a.aiSummary ? escapeXml(a.aiSummary) : '';
        return (
          `<li>` +
            `<a href="${safeUrl}" target="_blank" rel="noopener noreferrer">${safeTitle}</a>` +
            (safeSource ? ` <small>（${safeSource}）</small>` : '') +
            (ai ? `<br/><em>${ai}</em>` : '') +
          `</li>`
        );
      })
      .join('');

    const descriptionText = report.summary || '';

    return (
      `  <item>\n` +
      `    <title><![CDATA[${titleText}]]></title>\n` +
      `    <link>${escapeXml(link)}</link>\n` +
      `    <guid isPermaLink="false">${escapeXml(guid)}</guid>\n` +
      `    <pubDate>${pubDate}</pubDate>\n` +
      `    <category>AI日报</category>\n` +
      `    <description><![CDATA[${descriptionText}]]></description>\n` +
      `    <content:encoded><![CDATA[` +
            `<div>` +
              `<p>${escapeXml(descriptionText)}</p>` +
              `<h4>今日资讯（${totalArticles} 条）</h4>` +
              `<ol>${articlesHtml}</ol>` +
              (sources ? `<p>数据来源：${escapeXml(sources)}</p>` : '') +
            `</div>` +
        `]]></content:encoded>\n` +
      `  </item>`
    );
  }).join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n` +
`<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:atom="http://www.w3.org/2005/Atom">\n` +
`<channel>\n` +
`  <title><![CDATA[${channelTitle}]]></title>\n` +
`  <description><![CDATA[${channelDescription}]]></description>\n` +
`  <link>${escapeXml(channelLink)}</link>\n` +
`  <atom:link href="${escapeXml(request.url)}" rel="self" type="application/rss+xml" />\n` +
`  <language>zh-cn</language>\n` +
`  <lastBuildDate>${now.toUTCString()}</lastBuildDate>\n` +
`  <ttl>60</ttl>\n` +
`${itemsXml}\n` +
`</channel>\n` +
`</rss>`;

  return new Response(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      // CDN 缓存 10 分钟，并允许回源复用一天
      'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=86400'
    }
  });
}
