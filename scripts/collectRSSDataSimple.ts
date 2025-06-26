#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { RSSCrawler } from '../src/crawlers/RSSCrawler';
import type { RSSItem } from '../src/crawlers/types';
import { supabase } from './supabaseClient';

interface FeedSource {
  id: number;
  name: string;
  url: string;
  category: string;
  is_active: boolean;
  last_crawled?: string;
  item_count: number;
}

class SimpleRSSDataCollector {
  private rssCrawler: RSSCrawler;
  private collectedData: any[] = [];
  private successCount = 0;
  private failedCount = 0;
  private duplicateCount = 0;

  constructor() {
    this.rssCrawler = new RSSCrawler();
  }

  /**
   * 从数据库获取活跃的RSS源
   */
  async getFeedSources(): Promise<FeedSource[]> {
    console.log('📖 从数据库获取RSS源...');
    
    const { data, error } = await supabase
      .from('feed_sources')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) {
      console.error('❌ 获取RSS源失败:', error);
      throw error;
    }

    console.log(`✅ 成功获取 ${data.length} 个活跃RSS源`);
    return data;
  }

  /**
   * 爬取单个RSS源
   */
  async crawlFeed(source: FeedSource): Promise<void> {
    try {
      console.log(`🔍 爬取RSS源: ${source.name} (${source.url})`);
      
      const result = await this.rssCrawler.crawl(source.url, {
        sourceId: source.id.toString(),
        sourceName: source.name,
        sourceCategory: source.category
      });

      if (!result.success || !result.data) {
        console.log(`❌ ${source.name}: ${result.error || '爬取失败'}`);
        this.failedCount++;
        return;
      }

      const feed = result.data;
      console.log(`✅ ${source.name}: 成功获取 ${feed.items.length} 条内容`);

      // 转换为数据库格式并保存
      const articles = await this.convertRSSItemsToArticles(feed.items, source);
      await this.saveArticlesToDatabase(articles);
      
      // 更新RSS源的最后爬取时间和条目数量
      await this.updateFeedSourceStats(source.id, feed.items.length);
      
      this.successCount++;
    } catch (error) {
      console.error(`❌ 爬取RSS源失败 ${source.name}:`, error);
      this.failedCount++;
    }
  }

  /**
   * 将RSS items转换为Article格式
   */
  async convertRSSItemsToArticles(items: RSSItem[], source: FeedSource): Promise<any[]> {
    const articles = [];
    
    for (const item of items) {
      // 检查是否已存在
      const { data: existingArticle } = await supabase
        .from('articles')
        .select('id')
        .eq('source_url', item.link)
        .single();

      if (existingArticle) {
        this.duplicateCount++;
        continue;
      }

      // 生成文章ID
      const articleId = this.generateArticleId(item.link);
      
      // 提取分类
      const category = this.extractCategoryFromItem(item, source);
      
      // 计算阅读时间（简单估算）
      const readTime = this.estimateReadTime(item.contentSnippet || item.description);

      // 简化的文章对象，只包含确定存在的字段
      const article = {
        id: articleId,
        title: item.title,
        summary: this.sanitizeText(item.contentSnippet || item.description),
        category: category,
        author: item.author || source.name,
        publish_time: item.pubDate.toISOString(),
        read_time: readTime,
        views: 0,
        likes: 0,
        source_url: item.link,
        source_name: source.name,
        source_category: source.category,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
        // 暂时不包含可能有问题的字段：image_url, tags, is_hot, is_new, source_type
      };

      articles.push(article);
    }

    return articles;
  }

  /**
   * 保存文章到数据库
   */
  async saveArticlesToDatabase(articles: any[]): Promise<void> {
    if (articles.length === 0) return;

    const { error } = await supabase
      .from('articles')
      .insert(articles);

    if (error) {
      console.error('❌ 保存文章失败:', error);
      throw error;
    }

    console.log(`💾 成功保存 ${articles.length} 篇新文章`);
    this.collectedData.push(...articles);
  }

  /**
   * 更新RSS源统计信息
   */
  async updateFeedSourceStats(sourceId: number, itemCount: number): Promise<void> {
    const { error } = await supabase
      .from('feed_sources')
      .update({
        last_crawled: new Date().toISOString(),
        item_count: itemCount,
        updated_at: new Date().toISOString()
      })
      .eq('id', sourceId);

    if (error) {
      console.error('❌ 更新RSS源统计失败:', error);
    }
  }

  /**
   * 从RSS item提取分类
   */
  private extractCategoryFromItem(item: RSSItem, source: FeedSource): string {
    // 优先使用RSS item的分类
    if (item.categories && item.categories.length > 0) {
      return item.categories[0];
    }
    
    // 使用源的分类
    return source.category;
  }

  /**
   * 估算阅读时间
   */
  private estimateReadTime(content: string): string {
    if (!content) return '1分钟';
    
    const wordsPerMinute = 200;
    const wordCount = content.split(/\s+/).length;
    const minutes = Math.ceil(wordCount / wordsPerMinute);
    
    return `${minutes}分钟`;
  }

  /**
   * 清理文本内容
   */
  private sanitizeText(text: string): string {
    if (!text) return '';
    
    return text
      .replace(/<[^>]*>/g, '') // 移除HTML标签
      .replace(/\s+/g, ' ') // 合并多个空格
      .trim()
      .substring(0, 500); // 限制长度
  }

  /**
   * 生成文章ID
   */
  private generateArticleId(url: string): string {
    return Buffer.from(url).toString('base64').substring(0, 40);
  }

  /**
   * 批量爬取RSS源
   */
  async crawlAllFeeds(batchSize = 3): Promise<void> {
    const feedSources = await this.getFeedSources();
    
    console.log(`\n🚀 开始爬取 ${feedSources.length} 个RSS源...`);
    
    // 分批处理避免过多并发请求
    for (let i = 0; i < feedSources.length; i += batchSize) {
      const batch = feedSources.slice(i, i + batchSize);
      const batchNumber = Math.floor(i / batchSize) + 1;
      const totalBatches = Math.ceil(feedSources.length / batchSize);
      
      console.log(`\n📦 处理批次 ${batchNumber}/${totalBatches}`);
      
      const batchPromises = batch.map(source => this.crawlFeed(source));
      await Promise.all(batchPromises);
      
      // 批次间暂停，避免请求过频
      if (i + batchSize < feedSources.length) {
        console.log('⏳ 等待 3 秒后继续...');
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }
  }

  /**
   * 生成报告
   */
  generateReport(): void {
    console.log('\n📊 数据收集报告');
    console.log('================');
    console.log(`成功爬取: ${this.successCount} 个源`);
    console.log(`爬取失败: ${this.failedCount} 个源`);
    console.log(`新增文章: ${this.collectedData.length} 篇`);
    console.log(`重复文章: ${this.duplicateCount} 篇`);

    console.log('\n📈 各源贡献统计:');
    
    // 按源统计文章数量
    const sourceStats = this.collectedData.reduce((acc, article) => {
      const sourceName = article.source_name;
      acc[sourceName] = (acc[sourceName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    Object.entries(sourceStats)
      .sort(([,a], [,b]) => (b as any) - (a as any))
      .slice(0, 10)
      .forEach(([source, count]) => {
        console.log(`   ${source}: ${count} 篇`);
      });

    // 保存详细报告
    const reportData = {
      timestamp: new Date().toISOString(),
      summary: {
        successCount: this.successCount,
        failedCount: this.failedCount,
        newArticles: this.collectedData.length,
        duplicates: this.duplicateCount
      },
      sourceStats,
      articles: this.collectedData
    };

    const reportPath = path.join(process.cwd(), 'rss-simple-collection-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
    console.log(`\n📋 详细报告已保存到: ${reportPath}`);
  }
}

async function main() {
  const collector = new SimpleRSSDataCollector();
  
  try {
    await collector.crawlAllFeeds();
    collector.generateReport();
    console.log('\n🎉 数据收集完成！');
  } catch (error) {
    console.error('❌ 数据收集失败:', error);
    process.exit(1);
  }
}

main();