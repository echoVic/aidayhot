/**
 * AI 日报生成器 - GitHub Actions 版本
 * 集成火山引擎大模型，优化为云端自动化执行
 */

import { createClient } from '@supabase/supabase-js';
import { ArxivCrawler } from '../src/crawlers/ArxivCrawler';
import { GitHubCrawler } from '../src/crawlers/GitHubCrawler';
import { RSSCrawler } from '../src/crawlers/RSSCrawler';
import { createVolcengineAI } from '../src/services/volcengineAI';

// 加载环境变量
if (process.env.NODE_ENV !== 'production' && !process.env.GITHUB_ACTIONS) {
  const dotenv = require('dotenv');
  const path = require('path');
  const envPath = path.resolve(process.cwd(), '.env.local');
  try {
    dotenv.config({ path: envPath });
    console.log('🔧 从 .env.local 加载环境变量 (本地开发)');
  } catch (error) {
    console.log('🔧 使用系统环境变量');
  }
} else {
  console.log('🔧 使用 GitHub Actions 环境变量');
}

// 环境变量检查和适配
let supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
let supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  const missingVars = [];
  if (!supabaseUrl) missingVars.push('SUPABASE_URL 或 NEXT_PUBLIC_SUPABASE_URL');
  if (!supabaseKey) missingVars.push('SUPABASE_ANON_KEY 或 NEXT_PUBLIC_SUPABASE_ANON_KEY');
  
  console.error('❌ 缺少必要的环境变量:', missingVars.join(', '));
  console.error('💡 请检查 .env.local 文件或 GitHub Secrets 配置');
  process.exit(1);
}

console.log('✅ Supabase 环境变量已加载');

// 初始化 Supabase 客户端
const supabase = createClient(supabaseUrl, supabaseKey);

interface ArticleData {
  title: string;
  summary: string;
  original_summary?: string; // 原始简短摘要（爬虫获取）
  source_url: string;
  source_name: string;
  publish_time: string;
}

interface DailyReportData {
  introduction: string;
  items: ArticleData[];
}

class GitHubDailyReportGenerator {
  private arxivCrawler: ArxivCrawler;
  private githubCrawler: GitHubCrawler;
  private rssCrawler: RSSCrawler;

  constructor() {
    this.arxivCrawler = new ArxivCrawler();
    this.githubCrawler = new GitHubCrawler();
    this.rssCrawler = new RSSCrawler();
    console.log('🤖 AI日报生成器已初始化 (GitHub Actions 版本)');
  }

  /**
   * 收集今日数据
   */
  async collectTodayData(): Promise<ArticleData[]> {
    console.log('🚀 开始抓取今日AI资讯数据...');
    const articles: ArticleData[] = [];

    try {
      // 1. 抓取 ArXiv 论文
      console.log('📚 抓取 ArXiv 论文...');
      const arxivResult = await this.arxivCrawler.crawl('cs.AI+OR+cs.LG+OR+cs.CL', 0, 5, 'submittedDate', 'descending');
      if (arxivResult.success && arxivResult.papers) {
        arxivResult.papers.forEach((paper: any) => {
          articles.push({
            title: paper.title,
            original_summary: paper.summary?.substring(0, 200) + '...', // 保留原始摘要
            summary: paper.summary?.substring(0, 200) + '...', // 初始值，后面会被AI替换
            source_url: paper.abstractUrl || paper.pdfUrl || 'https://arxiv.org',
            source_name: 'ArXiv',
            publish_time: paper.publishedDate || new Date().toISOString()
          });
        });
      }
      console.log(`✅ ArXiv: 获取 ${arxivResult.papers?.length || 0} 篇论文`);

      // 2. 抓取 GitHub 项目
      console.log('🐙 抓取 GitHub 项目...');
      const githubResult = await this.githubCrawler.crawl(
        'artificial-intelligence+machine-learning',
        'updated',
        'desc',
        5
      );
      if (githubResult.success && githubResult.repositories) {
        githubResult.repositories.slice(0, 5).forEach((repo: any) => {
          articles.push({
            title: repo.name,
            original_summary: repo.description || '暂无描述', // 保留原始摘要
            summary: repo.description || '暂无描述', // 初始值，后面会被AI替换
            source_url: repo.html_url || repo.url || `https://github.com/${repo.full_name}` || 'https://github.com',
            source_name: 'GitHub',
            publish_time: repo.updated_at || new Date().toISOString()
          });
        });
      }
      console.log(`✅ GitHub: 获取 ${Math.min(githubResult.repositories?.length || 0, 5)} 个项目`);

      // 3. 抓取 RSS 资讯
      console.log('📰 抓取 RSS 资讯...');
      const rssFeeds = [
        'https://deepmind.com/blog/feed/basic/',
        'https://aws.amazon.com/blogs/amazon-ai/feed/',
        'https://techcrunch.com/feed/'
      ];

      for (const feedUrl of rssFeeds) {
        try {
          const rssResult = await this.rssCrawler.crawl(feedUrl);
          if (rssResult.success && rssResult.data?.items) {
            rssResult.data.items.slice(0, 6).forEach((item: any) => {
              articles.push({
                title: item.title || '无标题',
                original_summary: item.description?.substring(0, 200) + '...' || '暂无摘要', // 保留原始摘要
                summary: item.description?.substring(0, 200) + '...' || '暂无摘要', // 初始值，后面会被AI替换
                source_url: item.link || item.url || feedUrl,
                source_name: rssResult.data?.title || 'RSS',
                publish_time: item.pubDate || new Date().toISOString()
              });
            });
          }
        } catch (error) {
          console.log(`⚠️ RSS源 ${feedUrl} 抓取失败:`, error);
        }
      }

      console.log(`🎉 总共收集到 ${articles.length} 篇文章`);
      return articles;

    } catch (error) {
      console.error('❌ 数据收集失败:', error);
      return articles;
    }
  }

  /**
   * 生成AI摘要
   */
  async generateAISummary(articles: ArticleData[]): Promise<{ summary: string; articles: any[] }> {
    const volcengineAI = createVolcengineAI();
    
    if (volcengineAI) {
      console.log('🔥 使用火山引擎生成AI摘要...');
      try {
        const aiResult = await volcengineAI.generateDailyReportSummary(articles);
        return aiResult;
      } catch (error) {
        console.error('🔥 火山引擎摘要生成失败，使用备用方案:', error);
      }
    } else {
      console.log('⚠️ 未配置火山引擎API，使用简单摘要生成');
    }
    
    return {
      summary: this.generateFallbackSummary(articles),
      articles: articles
    };
  }

  /**
   * 备用摘要生成
   */
  private generateFallbackSummary(articles: ArticleData[]): string {
    const sourceCount = new Map<string, number>();
    articles.forEach(article => {
      const source = article.source_name;
      sourceCount.set(source, (sourceCount.get(source) || 0) + 1);
    });

    const sourceStats = Array.from(sourceCount.entries())
      .map(([source, count]) => `${source}(${count}条)`)
      .join('、');

    const today = new Date().toLocaleDateString('zh-CN');
    
    return `${today} AI资讯日报

今日共收集到 ${articles.length} 条AI相关资讯，来源包括：${sourceStats}。

主要内容涵盖：
• 最新的AI技术研究进展
• 开源项目和工具更新  
• 行业动态和产品发布
• 学术论文和技术博客

本日报通过自动化采集和AI分析生成，为您提供AI领域的每日精选资讯。

💡 提示：配置火山引擎API密钥可获得更智能的摘要分析。`;
  }

  /**
   * 保存日报到数据库
   */
  async saveDailyReport(reportData: DailyReportData): Promise<boolean> {
    console.log('💾 保存日报到数据库...');

    try {
      const today = new Date().toISOString().split('T')[0];

      // 检查今天是否已有日报
      const { data: existingReport } = await supabase
        .from('daily_reports')
        .select('id')
        .eq('report_date', today)
        .single();

      let reportRecord;
      
      if (existingReport) {
        // 更新现有日报
        console.log('📝 更新今日现有日报...');
        const { data: updatedReport, error: updateError } = await supabase
          .from('daily_reports')
          .update({
            introduction: reportData.introduction
          })
          .eq('id', existingReport.id)
          .select()
          .single();

        if (updateError) {
          console.error('❌ 更新日报失败:', updateError);
          return false;
        }
        reportRecord = updatedReport;
      } else {
        // 创建新日报
        console.log('📝 创建新的日报记录...');
        const { data: newReport, error: insertError } = await supabase
          .from('daily_reports')
          .insert({
            report_date: today,
            introduction: reportData.introduction
          })
          .select()
          .single();

        if (insertError) {
          console.error('❌ 创建日报失败:', insertError);
          return false;
        }
        reportRecord = newReport;
      }

      console.log(`✅ 日报主记录已${existingReport ? '更新' : '创建'}，ID: ${reportRecord.id}`);

      // 删除旧的日报条目
      await supabase
        .from('report_items')
        .delete()
        .eq('daily_report_id', reportRecord.id);

      // 插入新的日报条目，包含AI生成的详细总结
      const reportItems = reportData.items.map((item, index) => ({
        daily_report_id: reportRecord.id,
        title: item.title,
        summary: item.original_summary || '暂无摘要', // 原始简短摘要（爱虫获取）
        ai_summary: item.summary, // AI生成的详细中文总结
        source_url: item.source_url,
        source_name: item.source_name,
        publish_time: item.publish_time,
        display_order: index
      }));

      const { error: itemsError } = await supabase
        .from('report_items')
        .insert(reportItems);

      if (itemsError) {
        console.error('❌ 保存日报条目失败:', itemsError);
        return false;
      }

      console.log(`✅ 已保存 ${reportItems.length} 条日报条目`);
      console.log('📝 每条条目包含:');
      console.log('  - summary: 原始简短摘要');
      console.log('  - ai_summary: AI生成的详细中文总结');
      return true;

    } catch (error) {
      console.error('❌ 保存日报时发生错误:', error);
      return false;
    }
  }

  /**
   * 生成完整的日报
   */
  async generateDailyReport(): Promise<boolean> {
    console.log('🌅 开始生成今日AI日报...');

    try {
      // 1. 收集数据
      const articles = await this.collectTodayData();
      
      if (articles.length === 0) {
        console.log('⚠️ 没有抓取到任何数据，生成空日报');
      }

      // 2. 生成摘要
      console.log('📝 生成AI日报摘要...');
      const aiResult = await this.generateAISummary(articles);

      // 3. 保存到数据库
      const reportData = {
        introduction: aiResult.summary,
        items: aiResult.articles
      };

      const success = await this.saveDailyReport(reportData);

      if (success) {
        console.log('🎉 AI日报生成完成！');
        return true;
      } else {
        console.log('❌ 日报保存失败');
        return false;
      }
    } catch (error) {
      console.error('❌ 日报生成任务失败:', error);
      return false;
    }
  }
}

// 主执行函数
async function main() {
  console.log('🚀 GitHub Actions AI日报生成器启动...');
  console.log('⏰ 执行时间:', new Date().toISOString());

  const generator = new GitHubDailyReportGenerator();
  
  try {
    const success = await generator.generateDailyReport();
    
    if (success) {
      console.log('✅ 日报生成任务完成');
      process.exit(0);
    } else {
      console.log('❌ 日报生成任务失败');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ 程序执行失败:', error);
    process.exit(1);
  }
}

// 执行主函数
main();
