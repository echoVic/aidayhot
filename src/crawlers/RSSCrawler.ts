import crypto from 'crypto';
import { XMLParser } from 'fast-xml-parser';
import got from 'got';
import { BaseCrawler } from './BaseCrawler';
import type {
  CrawlerOptions,
  CrawlerResult,
  RSSFeed,
  RSSItem
} from './types';

interface ParsedRSSFeed {
  rss?: {
    channel?: {
      title?: string;
      description?: string;
      link?: string;
      language?: string;
      lastBuildDate?: string;
      item?: any[];
    };
  };
  feed?: {
    title?: string;
    subtitle?: string;
    link?: any;
    updated?: string;
    entry?: any[];
  };
}

export class RSSCrawler extends BaseCrawler {
  private xmlParser: XMLParser;

  constructor(options: CrawlerOptions = {}) {
    super('RSSCrawler', options);
    
    this.xmlParser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      trimValues: true
    });
  }

  async crawl(url?: string, sourceInfo: { sourceId?: string; sourceName?: string; sourceCategory?: string } = {}): Promise<CrawlerResult<RSSFeed>> {
    const startTime = Date.now();
    const sourceName = sourceInfo.sourceName || 'Unknown';
    
    try {
      if (!url) {
        throw new Error('RSS URL is required');
      }

      console.log(`[${sourceName}] 开始爬取RSS源: ${url}`);
      console.log(`[${sourceName}] 超时设置: ${this.options.timeout || 20000}ms`);
      
      // 使用got获取RSS内容，增强重试和延迟机制
      const response = await Promise.race([
        got(url, {
          timeout: {
            request: this.options.timeout || 20000 // 增加超时时间到20秒
          },
          followRedirect: true,
          maxRedirects: 10,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'application/rss+xml, application/atom+xml, application/xml, text/xml, text/html, */*',
            'Accept-Language': 'en-US,en;q=0.9,zh-CN;q=0.8,zh;q=0.7',
            'Accept-Encoding': 'gzip, deflate, br',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Connection': 'keep-alive',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'cross-site',
            'Sec-Fetch-User': '?1',
            'Upgrade-Insecure-Requests': '1',
            'DNT': '1',
            'Sec-GPC': '1',
            ...this.options.headers
          },
          retry: {
            limit: 3, // 增加重试次数
            methods: ['GET'],
            statusCodes: [408, 413, 429, 500, 502, 503, 504, 521, 522, 524], // 包含429状态码
            errorCodes: ['ETIMEDOUT', 'ECONNRESET', 'EADDRINUSE', 'ECONNREFUSED', 'EPIPE', 'ENOTFOUND', 'ENETUNREACH', 'EAI_AGAIN'],
            calculateDelay: ({ attemptCount }) => {
              console.log(`[${sourceName}] 重试第 ${attemptCount} 次，等待 ${Math.min(2000 * Math.pow(2, attemptCount - 1), 10000)}ms`);
              // 指数退避：第1次重试等待2秒，第2次等待4秒，第3次等待8秒
              return Math.min(2000 * Math.pow(2, attemptCount - 1), 10000);
            }
          }
        }),
        // 额外的超时保护
        new Promise<never>((_, reject) => {
          setTimeout(() => {
            reject(new Error(`[${sourceName}] 请求超时 (${(this.options.timeout || 20000) + 5000}ms)`));
          }, (this.options.timeout || 20000) + 5000);
        })
      ]) as any;
      
      const requestTime = Date.now() - startTime;
      console.log(`[${sourceName}] 请求完成，耗时: ${requestTime}ms`);

      // 检查响应是否为有效的 XML/RSS 内容
      const bodyTrimmed = response.body.trim().toLowerCase();
      
      // 精确的HTML检测：只检查文档开头是否为HTML
      if (bodyTrimmed.startsWith('<!doctype html') || 
          bodyTrimmed.startsWith('<html ') ||
          bodyTrimmed.startsWith('<html>')) {
        throw new Error('RSS源返回HTML页面，可能被防火墙或CDN拦截');
      }
      
      // 检查是否包含XML声明或RSS/Atom根元素
      if (!bodyTrimmed.includes('<?xml') && 
          !bodyTrimmed.includes('<rss') && 
          !bodyTrimmed.includes('<feed')) {
        throw new Error('响应内容不是有效的RSS/Atom格式');
      }
      
      // 解析XML
      const parsedFeed = this.xmlParser.parse(response.body) as ParsedRSSFeed;
      
      let feedData: any;
      let isAtom = false;
      
      if (parsedFeed.rss?.channel) {
        // RSS 2.0格式
        feedData = parsedFeed.rss.channel;
      } else if (parsedFeed.feed) {
        // Atom格式
        feedData = parsedFeed.feed;
        isAtom = true;
      } else {
        throw new Error('无法识别的RSS/Atom格式');
      }

      const items: RSSItem[] = this.parseItems(feedData, isAtom, sourceInfo);
      
      console.log(`RSS源标题: ${this.extractTitle(feedData, isAtom)}`);
      console.log(`获取到 ${items.length} 条内容`);

      const feed: RSSFeed = {
        title: this.extractTitle(feedData, isAtom),
        description: this.extractDescription(feedData, isAtom),
        link: this.extractLink(feedData, isAtom),
        language: feedData.language,
        lastBuildDate: feedData.lastBuildDate ? new Date(feedData.lastBuildDate) : undefined,
        items
      };

      return this.createResult(feed, true, undefined, {
        feedUrl: url,
        sourceId: sourceInfo.sourceId || this.generateSourceId(url),
        itemCount: items.length
      });
    } catch (error) {
      const errorTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      console.error(`[${sourceName}] RSS爬取失败 [${url}] (耗时: ${errorTime}ms):`, {
        error: errorMessage,
        stack: error instanceof Error ? error.stack : undefined,
        timeout: this.options.timeout || 20000,
        url,
        sourceName
      });
      
      // 检查是否是超时错误
      if (errorMessage.includes('timeout') || errorMessage.includes('ETIMEDOUT')) {
        console.error(`[${sourceName}] 检测到超时错误，可能的原因:`);
        console.error(`  - 网络连接缓慢或不稳定`);
        console.error(`  - 目标服务器响应缓慢`);
        console.error(`  - DNS解析问题`);
        console.error(`  - 防火墙或代理阻止`);
      }
      
      const emptyFeed: RSSFeed = {
        title: '',
        description: '',
        link: '',
        items: []
      };

      return this.createResult(emptyFeed, false, `[${sourceName}] ${errorMessage} (耗时: ${errorTime}ms)`);
    }
  }

  private safeParseDate(dateStr: string | undefined, item?: any, fallbackToCurrent: boolean = true, suppressWarning: boolean = false): Date | null {
    if (!dateStr) {
      // 尝试从其他字段提取时间信息
      const alternativeDate = this.extractAlternativeDate(item);
      if (alternativeDate) {
        return alternativeDate;
      }
      
      // 记录缺少时间信息的警告
      if (!suppressWarning) {
        console.warn(`⚠️ RSS条目缺少发布时间信息: ${item?.title || '无标题'}`);
      }
      
      if (fallbackToCurrent) {
        console.warn(`⚠️ 使用当前时间作为备用时间: ${item?.title || '无标题'}`);
        return new Date();
      } else {
        return null;
      }
    }
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) {
      return null;
    }
    
    // 检查是否为未来时间（超过当前时间1个月）- 严格限制
    const now = new Date();
    const oneMonthFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    if (d > oneMonthFromNow) {
      if (!suppressWarning) {
        console.warn(`⚠️ RSS条目时间异常（未来时间）: ${item?.title || '无标题'}, 时间: ${d.toISOString()}`);
      }
      return null;
    }
    
    // 检查是否为过于久远的时间（超过10年前）
    const tenYearsAgo = new Date(now.getTime() - 10 * 365 * 24 * 60 * 60 * 1000);
    if (d < tenYearsAgo) {
      return null;
    }
    
    return d;
  }

  private parseItems(feedData: any, isAtom: boolean, sourceInfo?: { sourceName?: string; sourceCategory?: string }): RSSItem[] {
    const items: RSSItem[] = [];
    const itemArray = isAtom ? feedData.entry : feedData.item;
    
    if (!itemArray) return items;
    
    const itemList = Array.isArray(itemArray) ? itemArray : [itemArray];
    let emptyDateCount = 0;
    
    for (const item of itemList) {
      if (isAtom) {
        // Atom格式解析
        const id = this.generateContentId(item.link?.['@_href'] || item.id);
        const content = item.content?.['#text'] || item.content || item.summary?.['#text'] || item.summary || '';
        
        
        const pubDate = this.safeParseDate(item.updated, item, false, emptyDateCount > 0);
        if (!pubDate) continue;
        if (!item.updated) emptyDateCount++;
        items.push({
          id,
          title: item.title?.['#text'] || item.title || '',
          description: content,
          link: item.link?.['@_href'] || item.link || '',
          pubDate,
          author: item.author?.name || item.author || '',
          categories: this.extractCategories(item.category),
          guid: item.id || '',
          content: content,
          contentSnippet: this.stripHtml(content),
          checksum: this.calculateChecksum(content),
          sourceName: sourceInfo?.sourceName,
          sourceCategory: sourceInfo?.sourceCategory,
          source_type: 'rss'
        });
      } else {
        // RSS格式解析
        const id = this.generateContentId(item.link || item.guid);
        const content = item.description || item['content:encoded'] || item.content || '';
        
        
        // 跳过无效条目（标题为空且缺少时间）
        if (!item.pubDate && (!item.title || item.title.trim() === '')) {
          continue;
        }
        
        const pubDate = this.safeParseDate(item.pubDate, item, false, emptyDateCount > 0);
        if (!pubDate) continue;
        
        if (!item.pubDate) {
          emptyDateCount++;
        }
        items.push({
          id,
          title: item.title || '',
          description: content,
          link: item.link || '',
          pubDate,
          author: item.author || item['dc:creator'] || '',
          categories: this.extractCategories(item.category),
          guid: item.guid || '',
          content: content,
          contentSnippet: this.stripHtml(content),
          checksum: this.calculateChecksum(content),
          sourceName: sourceInfo?.sourceName,
          sourceCategory: sourceInfo?.sourceCategory,
          source_type: 'rss'
        });
      }
    }
    
    if (emptyDateCount > 0) {
      console.log(`ℹ️ ${emptyDateCount} 条有效条目使用了当前时间作为备用时间`);
    }
    
    return items;
  }

  // 尝试从其他字段提取时间信息
  private extractAlternativeDate(item: any): Date | null {
    if (!item) return null;
    
    // 常见的时间字段名称
    const timeFields = [
      'date', 'published', 'publishedDate', 'created', 'createdDate',
      'modified', 'modifiedDate', 'lastModified', 'timestamp',
      'dc:date', 'atom:updated', 'atom:published'
    ];
    
    for (const field of timeFields) {
      const value = item[field];
      if (value) {
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
          return date;
        }
      }
    }
    
    return null;
  }

  private extractTitle(feedData: any, isAtom: boolean): string {
    if (isAtom) {
      return feedData.title?.['#text'] || feedData.title || '';
    }
    return feedData.title || '';
  }

  private extractDescription(feedData: any, isAtom: boolean): string {
    if (isAtom) {
      return feedData.subtitle?.['#text'] || feedData.subtitle || '';
    }
    return feedData.description || '';
  }

  private extractLink(feedData: any, isAtom: boolean): string {
    if (isAtom) {
      if (Array.isArray(feedData.link)) {
        const altLink = feedData.link.find((l: any) => l['@_rel'] === 'alternate');
        return altLink?.['@_href'] || feedData.link[0]?.['@_href'] || '';
      }
      return feedData.link?.['@_href'] || feedData.link || '';
    }
    return feedData.link || '';
  }

  private extractCategories(category: any): string[] {
    if (!category) return [];
    
    const extractStringValue = (item: any): string => {
      if (typeof item === 'string') return item;
      if (typeof item === 'object') {
        // 处理XML对象，如 {@_term: "value", @_scheme: "scheme"}
        if (item['@_term']) return item['@_term'];
        if (item['#text']) return item['#text'];
        if (item._ || item['_']) return item._ || item['_'];
        // 如果是纯对象，尝试获取第一个值
        const values = Object.values(item);
        for (const value of values) {
          if (typeof value === 'string' && value.trim()) return value;
        }
      }
      return String(item || '');
    };
    
    if (Array.isArray(category)) {
      return category
        .map(cat => extractStringValue(cat))
        .filter(val => val && val.trim().length > 0);
    }
    
    const extracted = extractStringValue(category);
    return extracted && extracted.trim().length > 0 ? [extracted] : [];
  }

  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '').trim();
  }

  // 批量爬取多个RSS源
  async fetchMultipleRSSFeeds(rssUrls: Record<string, string>): Promise<Record<string, CrawlerResult<RSSFeed>>> {
    const results: Record<string, CrawlerResult<RSSFeed>> = {};
    
    for (const [name, url] of Object.entries(rssUrls)) {
      try {
        console.log(`正在处理RSS源: ${name}...`);
        results[name] = await this.crawl(url, { sourceId: name });
        
        // 延迟，避免频繁请求
        await this.sleep(this.options.delay || 1000);
      } catch (error) {
        console.error(`处理RSS源失败 ${name}:`, error);
        const emptyFeed: RSSFeed = {
          title: '',
          description: '',
          link: '',
          items: []
        };
        results[name] = this.createResult(emptyFeed, false, error instanceof Error ? error.message : 'Unknown error');
      }
    }
    
    return results;
  }

  // 获取单个RSS源的数据 - 用于Papers with Code等特定源
  async fetchSingleRSSFeed(url: string, sourceName?: string): Promise<CrawlerResult<RSSFeed>> {
    return await this.crawl(url, { sourceName: sourceName || 'RSS Feed' });
  }

  // 生成内容ID
  private generateContentId(url?: string): string {
    if (!url) {
      return crypto.randomUUID();
    }
    return crypto.createHash('md5').update(url).digest('hex');
  }

  // 生成源ID
  private generateSourceId(url: string): string {
    return crypto.createHash('md5').update(url).digest('hex').substring(0, 8);
  }

  // 已废弃：RSS源现在完全由数据库 feed_sources 表管理
  // 使用 scripts/syncRSSSourcesFromCrawler.ts 进行同步
  /**
   * @deprecated Use database feed_sources table instead
   */
  getAIRSSFeeds(): Record<string, string> {
    console.warn('⚠️ getAIRSSFeeds() 已废弃，请使用数据库 feed_sources 表');
    return {};
  }

  /**
   * @deprecated Use database feed_sources table instead
   */
  getTopTierFeeds(): Record<string, string> {
    console.warn('⚠️ getTopTierFeeds() 已废弃，请使用数据库 feed_sources 表');
    return {};
  }

  // 测试单个RSS源
  async testRSSFeed(url: string): Promise<CrawlerResult<RSSFeed>> {
    console.log(`测试RSS源: ${url}`);
    const result = await this.crawl(url);
    
    if (result.success && result.data) {
      console.log('✅ RSS源测试成功');
      console.log(`   - 订阅源: ${result.data.title}`);
      console.log(`   - 描述: ${result.data.description}`);
      console.log(`   - 链接: ${result.data.link}`);
      console.log(`   - 文章数量: ${result.data.items.length}`);
      
      if (result.data.items.length > 0) {
        console.log(`   - 示例文章: ${result.data.items[0].title}`);
        console.log(`   - 发布时间: ${result.data.items[0].pubDate}`);
      }
    } else {
      console.log('❌ RSS源测试失败');
      console.log(`   - 错误: ${result.error}`);
    }
    
    return result;
  }

  /**
   * @deprecated Use database feed_sources table for testing instead
   */
  async testAllAIRSSFeeds(): Promise<Record<string, CrawlerResult<RSSFeed>>> {
    console.warn('⚠️ testAllAIRSSFeeds() 已废弃，请直接从数据库 feed_sources 表获取源进行测试');
    console.log('建议使用: scripts/collectDataToSupabase.ts --sources=rss 来测试RSS源');
    return {};
  }

  // 打印测试结果摘要
  private printTestSummary(testName: string, results: Record<string, CrawlerResult<RSSFeed>>): void {
    console.log(`\n=== ${testName}测试结果汇总 ===`);
    
    let successCount = 0;
    let totalItems = 0;
    const successfulFeeds: string[] = [];
    const failedFeeds: string[] = [];
    
    for (const [name, result] of Object.entries(results)) {
      if (result.success && result.data) {
        successCount++;
        totalItems += result.data.items.length;
        successfulFeeds.push(`${name}: ${result.data.items.length} 篇文章`);
        console.log(`✅ ${name}: ${result.data.items.length} 篇文章`);
      } else {
        failedFeeds.push(`${name}: ${result.error || '未知错误'}`);
        console.log(`❌ ${name}: ${result.error || '未知错误'}`);
      }
    }
    
    console.log(`\n📊 统计信息:`);
    console.log(`   成功: ${successCount}/${Object.keys(results).length} 个源`);
    console.log(`   总文章数: ${totalItems} 篇`);
    console.log(`   成功率: ${((successCount / Object.keys(results).length) * 100).toFixed(1)}%`);
    
    if (successfulFeeds.length > 0) {
      console.log(`\n🎉 成功的RSS源:`);
      successfulFeeds.forEach(feed => console.log(`   • ${feed}`));
    }
    
    if (failedFeeds.length > 0) {
      console.log(`\n💥 失败的RSS源:`);
      failedFeeds.forEach(feed => console.log(`   • ${feed}`));
    }
  }
}