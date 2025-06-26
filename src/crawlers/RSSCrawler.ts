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
    try {
      if (!url) {
        throw new Error('RSS URL is required');
      }

      console.log(`开始爬取RSS源: ${url}`);
      
      // 使用got获取RSS内容
      const response = await got(url, {
        timeout: {
          request: this.options.timeout || 15000
        },
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
          'Accept': 'application/rss+xml, application/atom+xml, application/xml, text/xml, */*',
          'Accept-Language': 'en-US,en;q=0.9,zh-CN;q=0.8,zh;q=0.7',
          'Accept-Encoding': 'gzip, deflate, br',
          'Cache-Control': 'no-cache',
          ...this.options.headers
        },
        retry: {
          limit: 2
        }
      });

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
      const message = `RSS爬取失败 ${url}: ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.error(message);
      
      const emptyFeed: RSSFeed = {
        title: '',
        description: '',
        link: '',
        items: []
      };

      return this.createResult(emptyFeed, false, message);
    }
  }

  private parseItems(feedData: any, isAtom: boolean, sourceInfo?: { sourceName?: string; sourceCategory?: string }): RSSItem[] {
    const items: RSSItem[] = [];
    const itemArray = isAtom ? feedData.entry : feedData.item;
    
    if (!itemArray) return items;
    
    const itemList = Array.isArray(itemArray) ? itemArray : [itemArray];
    
    for (const item of itemList) {
      if (isAtom) {
        // Atom格式解析
        const id = this.generateContentId(item.link?.['@_href'] || item.id);
        const content = item.content?.['#text'] || item.content || item.summary?.['#text'] || item.summary || '';
        
        items.push({
          id,
          title: item.title?.['#text'] || item.title || '',
          description: content,
          link: item.link?.['@_href'] || item.link || '',
          pubDate: item.updated ? new Date(item.updated) : new Date(),
          author: item.author?.name || item.author || '',
          categories: this.extractCategories(item.category),
          guid: item.id || '',
          content: content,
          contentSnippet: this.stripHtml(content),
          checksum: this.calculateChecksum(content),
          sourceName: sourceInfo?.sourceName,
          sourceCategory: sourceInfo?.sourceCategory
        });
      } else {
        // RSS格式解析
        const id = this.generateContentId(item.link || item.guid);
        const content = item.description || item['content:encoded'] || item.content || '';
        
        items.push({
          id,
          title: item.title || '',
          description: content,
          link: item.link || '',
          pubDate: item.pubDate ? new Date(item.pubDate) : new Date(),
          author: item.author || item['dc:creator'] || '',
          categories: this.extractCategories(item.category),
          guid: item.guid || '',
          content: content,
          contentSnippet: this.stripHtml(content),
          checksum: this.calculateChecksum(content),
          sourceName: sourceInfo?.sourceName,
          sourceCategory: sourceInfo?.sourceCategory
        });
      }
    }
    
    return items;
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
    
    if (Array.isArray(category)) {
      return category.map(cat => cat?.['#text'] || cat || '').filter(Boolean);
    }
    
    return [category?.['#text'] || category || ''].filter(Boolean);
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