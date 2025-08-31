/**
 * AI 日报生成器 - GitHub Actions 版本
 * 集成火山引擎大模型，优化为云端自动化执行
 */

import { createClient } from '@supabase/supabase-js';
import { ArxivCrawler } from '../src/crawlers/ArxivCrawler';
import { RSSCrawler } from '../src/crawlers/RSSCrawler';
import { createGitHubModelsAI } from '../src/services/githubModelsAI';
import { createIflowAI } from '../src/services/iflowAI';
import { createVolcengineAI } from '../src/services/volcengineAI';
import { ArticleData, DailyReportData } from '../src/types';

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
// 优先使用 service_role 密钥，回退到匿名密钥
let supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  const missingVars = [];
  if (!supabaseUrl) missingVars.push('SUPABASE_URL 或 NEXT_PUBLIC_SUPABASE_URL');
  if (!supabaseKey) missingVars.push('SUPABASE_SERVICE_ROLE_KEY 或 SUPABASE_ANON_KEY 或 NEXT_PUBLIC_SUPABASE_ANON_KEY');
  
  console.error('❌ 缺少必要的环境变量:', missingVars.join(', '));
  console.error('💡 请检查 .env.local 文件或 GitHub Secrets 配置');
  process.exit(1);
}

// 显示使用的密钥类型（用于调试）
if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.log('🔑 使用 service_role 密钥（具有完整权限）');
} else {
  console.log('🔑 使用匿名密钥（权限受限）');
}

console.log('✅ Supabase 环境变量已加载');

// 初始化 Supabase 客户端
const supabase = createClient(supabaseUrl, supabaseKey);

// 从环境变量读取配置参数
const HOURS_BACK = parseInt(process.env.HOURS_BACK || '24');
const MAX_ARTICLES_PER_SOURCE = parseInt(process.env.MAX_ARTICLES_PER_SOURCE || '3');
const MAX_RSS_ARTICLES_PER_SOURCE = parseInt(process.env.MAX_RSS_ARTICLES_PER_SOURCE || '3'); // RSS源默认3篇
const INCLUDE_SOURCES = process.env.INCLUDE_SOURCES || 'all';
const AI_SERVICE = process.env.AI_SERVICE || 'iflow'; // 'volcengine', 'github-models' 或 'iflow'
const ENABLE_AI_RELEVANCE_FILTER = process.env.ENABLE_AI_RELEVANCE_FILTER !== 'false'; // 默认启用AI相关性过滤

console.log(`⚙️ 配置参数:`);
console.log(`   ⏰ 时间范围: 过去 ${HOURS_BACK} 小时`);
console.log(`   📊 ArXiv每源文章数: ${MAX_ARTICLES_PER_SOURCE}`);
console.log(`   📰 RSS每源文章数: ${MAX_RSS_ARTICLES_PER_SOURCE}`);
console.log(`   🎯 数据源类型: ${INCLUDE_SOURCES}`);
console.log(`   🤖 AI服务: ${AI_SERVICE}`);
console.log(`   🔍 AI相关性过滤: ${ENABLE_AI_RELEVANCE_FILTER ? '启用' : '禁用'}`);

// 时间过滤工具函数
function isWithinTimeRange(publishTime: string, hoursBack: number): boolean {
  if (hoursBack <= 0) return true; // 0表示不使用时间过滤
  
  const now = new Date();
  const publishDate = new Date(publishTime);
  const timeDiffHours = (now.getTime() - publishDate.getTime()) / (1000 * 60 * 60);
  
  return timeDiffHours <= hoursBack;
}

// 数据源过滤工具函数
function shouldIncludeSource(category: string, includeType: string): boolean {
  switch (includeType) {
    case 'ai-research':
      return category === 'AI/机器学习';
    case 'tech-development':
      return category === '技术/开发';
    case 'arxiv-only':
      return false; // RSS源不包含在此选项中
    case 'all':
    default:
      return true;
  }
}



class GitHubDailyReportGenerator {
  private arxivCrawler: ArxivCrawler;
  private rssCrawler: RSSCrawler;

  constructor() {
    this.arxivCrawler = new ArxivCrawler();
    this.rssCrawler = new RSSCrawler();
    console.log('🤖 AI日报生成器已初始化 (GitHub Actions 版本)');
  }

  /**
   * 分析文章与AI的相关性
   */
  private async analyzeAIRelevance(article: ArticleData): Promise<{ isRelevant: boolean; score: number; reason: string }> {
    try {
      // 根据配置选择AI服务进行相关性分析
      if (AI_SERVICE === 'github-models') {
        return await this.analyzeAIRelevanceWithGitHubModels(article);
      } else if (AI_SERVICE === 'iflow') {
        return await this.analyzeAIRelevanceWithIflow(article);
      } else {
        return await this.analyzeAIRelevanceWithVolcengine(article);
      }
    } catch (error) {
      console.warn(`⚠️ AI相关性分析失败: ${article.title}`, error);
      // 如果AI分析失败，使用关键词匹配作为备用方案
      return this.analyzeAIRelevanceWithKeywords(article);
    }
  }

  /**
   * 使用GitHub Models分析AI相关性
   */
  private async analyzeAIRelevanceWithGitHubModels(article: ArticleData): Promise<{ isRelevant: boolean; score: number; reason: string }> {
    const githubToken = process.env.GITHUB_TOKEN || process.env.GITHUB_MODELS_TOKEN;
    const githubModel = process.env.GITHUB_MODELS_MODEL || 'gpt-4o-mini';
    
    if (!githubToken) {
      return this.analyzeAIRelevanceWithKeywords(article);
    }

    const githubModelsAI = createGitHubModelsAI();

    if (!githubModelsAI) {
      return this.analyzeAIRelevanceWithKeywords(article);
    }

    try {
      const result = await githubModelsAI.analyzeAIRelevance({
        title: article.title,
        summary: article.summary
      });
      
      return result;
    } catch (error) {
      console.warn('GitHub Models相关性分析失败，使用关键词匹配', error);
      return this.analyzeAIRelevanceWithKeywords(article);
    }
  }

  /**
   * 使用火山引擎分析AI相关性
   */
  private async analyzeAIRelevanceWithVolcengine(article: ArticleData): Promise<{ isRelevant: boolean; score: number; reason: string }> {
    const volcengineAI = createVolcengineAI();
    
    if (!volcengineAI) {
      return this.analyzeAIRelevanceWithKeywords(article);
    }

    try {
      const result = await volcengineAI.analyzeAIRelevance({
        title: article.title,
        summary: article.summary
      });
      
      return result;
    } catch (error) {
      console.warn('火山引擎相关性分析失败，使用关键词匹配', error);
      return this.analyzeAIRelevanceWithKeywords(article);
    }
  }

  /**
   * 使用iflowAI分析AI相关性
   */
  private async analyzeAIRelevanceWithIflow(article: ArticleData): Promise<{ isRelevant: boolean; score: number; reason: string }> {
    const iflowAI = createIflowAI();
    
    if (!iflowAI) {
      return this.analyzeAIRelevanceWithKeywords(article);
    }

    try {
      const result = await iflowAI.analyzeAIRelevance({
        title: article.title,
        summary: article.summary
      });
      
      return result;
    } catch (error) {
      console.warn('iflowAI相关性分析失败，使用关键词匹配', error);
      return this.analyzeAIRelevanceWithKeywords(article);
    }
  }

  /**
   * 使用关键词匹配分析AI相关性（备用方案）
   */
  private analyzeAIRelevanceWithKeywords(article: ArticleData): { isRelevant: boolean; score: number; reason: string } {
    const aiKeywords = [
      // 核心AI术语
      'artificial intelligence', 'ai', '人工智能',
      'machine learning', 'ml', '机器学习',
      'deep learning', 'dl', '深度学习',
      'neural network', '神经网络',
      'large language model', 'llm', '大语言模型',
      'natural language processing', 'nlp', '自然语言处理',
      'computer vision', '计算机视觉',
      'generative ai', '生成式ai', 'genai',
      
      // AI公司和产品
      'openai', 'chatgpt', 'gpt', 'claude', 'anthropic',
      'google ai', 'deepmind', 'gemini', 'bard',
      'microsoft copilot', 'azure ai',
      'hugging face', 'transformers',
      'nvidia', 'cuda', 'tensorrt',
      
      // 中文AI公司和产品
      '百度', '文心', 'ernie',
      '阿里', '通义', 'qwen',
      '腾讯', '混元',
      '字节', 'doubao', '豆包',
      '智谱', 'chatglm', 'glm',
      '月之暗面', 'kimi',
      'deepseek', '深度求索',
      
      // AI技术和概念
      'transformer', 'attention', 'bert', 'gpt',
      'diffusion', 'gan', 'vae',
      'reinforcement learning', '强化学习',
      'supervised learning', '监督学习',
      'unsupervised learning', '无监督学习',
      'fine-tuning', '微调',
      'prompt engineering', '提示工程',
      'rag', 'retrieval augmented generation',
      'multimodal', '多模态',
      
      // AI应用领域
      'autonomous driving', '自动驾驶',
      'robotics', '机器人',
      'recommendation system', '推荐系统',
      'speech recognition', '语音识别',
      'image recognition', '图像识别',
      'text generation', '文本生成',
      'code generation', '代码生成'
    ];

    const text = `${article.title} ${article.summary}`.toLowerCase();
    let score = 0;
    const matchedKeywords: string[] = [];

    for (const keyword of aiKeywords) {
      if (text.includes(keyword.toLowerCase())) {
        // 根据关键词重要性给分
        if (['artificial intelligence', 'ai', '人工智能', 'machine learning', 'ml', '机器学习'].includes(keyword.toLowerCase())) {
          score += 25; // 核心关键词高分
        } else if (['deep learning', 'neural network', 'llm', '大语言模型'].includes(keyword.toLowerCase())) {
          score += 20; // 重要关键词
        } else {
          score += 10; // 一般关键词
        }
        matchedKeywords.push(keyword);
      }
    }

    // 限制最高分数
    score = Math.min(score, 100);
    
    const isRelevant = score >= 50;
    const reason = matchedKeywords.length > 0 
      ? `匹配关键词: ${matchedKeywords.slice(0, 3).join(', ')}` 
      : '未匹配到AI相关关键词';

    return { isRelevant, score, reason };
  }

  /**
   * 获取RSS资讯数据
   */
  private async collectRSSData(): Promise<ArticleData[]> {
    console.log('📰 抓取 RSS 资讯...');
    const articles: ArticleData[] = [];
    let totalProcessed = 0;
    let totalFiltered = 0;
    let totalAdded = 0;
    
    const recommendedSources = [
      {
        name: 'Anthropic News',
        url: 'https://rsshub.app/anthropic/news',
        category: 'AI/机器学习'
      },
      {
        name: 'Google AI Blog',
        url: 'https://blog.google/technology/ai/rss/',
        category: 'AI/机器学习'
      },
      {
        name: 'OpenAI News',
        url: 'https://openai.com/news/rss.xml',
        category: 'AI/机器学习'
      },
      {
        name: 'Google DeepMind Blog',
        url: 'https://deepmind.com/blog/feed/basic/',
        category: 'AI/机器学习'
      },
      {
        name:'机器之心',
        url: 'https://www.jiqizhixin.com/rss',
        category: 'AI/机器学习'
      },
      {
        name: 'AWS Machine Learning Blog',
        url: 'https://aws.amazon.com/blogs/amazon-ai/feed/',
        category: '技术/开发'
      },
      {
        name: 'Engineering at Meta',
        url: 'https://engineering.fb.com/feed/',
        category: '技术/开发'
      },
      {
        name: 'Microsoft Azure Blog',
        url: 'https://azure.microsoft.com/en-us/blog/feed/',
        category: '技术/开发'
      },
      {
        name: 'Hugging Face Blog',
        url: 'https://huggingface.co/blog/feed.xml',
        category: 'AI/机器学习'
      },
      {
        name: 'Apple Machine Learning Research',
        url: 'https://machinelearning.apple.com/rss.xml',
        category: 'AI/机器学习'
      },
      {
        name: '字节跳动Seed',
        url: 'https://wechat2rss.bestblogs.dev/feed/70bd37e7f4adc13f83d3c3d7f6bf17519cfeeda9.xml',
        category: 'AI/机器学习'
      },
      {
        name: 'DeepSeek',
        url: 'https://wechat2rss.bestblogs.dev/feed/7f29136a704bfa28e96321d5771ba6e2abdbe7b2.xml',
        category: 'AI/机器学习'
      },
      {
        name: '智谱',
        url: 'https://wechat2rss.bestblogs.dev/feed/f4b47b8e5a07d22b7dd004e4b718a1ffa518fa04.xml',
        category: 'AI/机器学习'
      },
      {
        name: '月之暗面 Kimi',
        url: 'https://wechat2rss.bestblogs.dev/feed/21e4c30ebcac33eb97d0b9842239ea652ecb2892.xml',
        category: 'AI/机器学习'
      },
      {
        name: '腾讯混元',
        url: 'https://wechat2rss.bestblogs.dev/feed/1426deffd3a427929d588d51ce718ac207138587.xml',
        category: 'AI/机器学习'
      },
      {
        name: 'Qwen Blog',
        url: 'https://qwenlm.github.io/blog/index.xml',
        category: 'AI/机器学习'
      },
      {
        name:'量子位',
        url: 'https://www.qbitai.com/feed',
        category: 'AI/机器学习'
      },
      // {
      //   name:'AI Research Paper Summaries (Papers With Code)',
      //   url:'https://paperswithcode.com/rss/feed',
      //   category: '论文'
      // },
      {
        name:'NVIDIA AI Blog',
        url:'https://blogs.nvidia.com/blog/category/generative-ai/feed/',
        category: 'AI/机器学习'
      },
      {
        name:'GitHub AI & ML Blog',
        url:'https://github.blog/ai-and-ml/feed/',
        category: 'AI/机器学习'
      },
    ];

    // 过滤数据源
    const filteredSources = recommendedSources.filter(source => 
      shouldIncludeSource(source.category, INCLUDE_SOURCES)
    );
    
    console.log(`📊 将抓取 ${filteredSources.length} 个RSS源（共 ${recommendedSources.length} 个可用）`);
    
    // 🚀 使用并发批次处理RSS源，提高容错性
    const CONCURRENT_RSS_LIMIT = 5; // 同时处理5个RSS源
    const chunks = [];
    
    // 将RSS源分成多个批次
    for (let i = 0; i < filteredSources.length; i += CONCURRENT_RSS_LIMIT) {
      chunks.push(filteredSources.slice(i, i + CONCURRENT_RSS_LIMIT));
    }
    
    console.log(`🚀 启用并发处理模式：${filteredSources.length} 个源分为 ${chunks.length} 批，每批最多 ${CONCURRENT_RSS_LIMIT} 个`);
    
    // 批次序号
    let batchNum = 0;
    
    // 逐批并发处理RSS源
    for (const chunk of chunks) {
      batchNum++;
      console.log(`📦 开始处理第 ${batchNum}/${chunks.length} 批 (${chunk.length} 个源)`);
      
      // 并发处理当前批次的所有RSS源
      const batchPromises = chunk.map(async (source) => {
        try {
          console.log(`📡 正在抓取: ${source.name} (${source.category})`);
          const rssResult = await this.rssCrawler.crawl(source.url);
          
          if (rssResult.success && rssResult.data?.items) {
            let addedCount = 0;
            const sourceArticles: ArticleData[] = [];
            
            for (const item of rssResult.data.items) {
              // 只处理有有效发布时间的文章
              if (!item.pubDate || !(item.pubDate instanceof Date)) {
                console.warn(`跳过无效时间的文章: ${item.title || '无标题'}`);
                continue;
              }
              
              const publishTime = item.pubDate.toISOString();
              if (isWithinTimeRange(publishTime, HOURS_BACK) && addedCount < MAX_RSS_ARTICLES_PER_SOURCE) {
                const article: ArticleData = {
                  title: item.title || '无标题',
                  original_summary: item.description?.substring(0, 200) + '...' || '暂无摘要',
                  summary: item.description?.substring(0, 200) + '...' || '暂无摘要',
                  source_url: item.link || source.url,
                  source_name: source.name,
                  publish_time: publishTime
                };
                
                totalProcessed++;
                
                // 对所有RSS源进行AI相关性分析（如果启用）
                if (ENABLE_AI_RELEVANCE_FILTER) {
                  console.log(`🔍 分析文章AI相关性: ${article.title.substring(0, 30)}...`);
                  try {
                    const relevanceResult = await this.analyzeAIRelevance(article);
                    console.log(`   📊 相关性分数: ${relevanceResult.score}, 是否相关: ${relevanceResult.isRelevant}, 理由: ${relevanceResult.reason}`);
                    
                    if (relevanceResult.isRelevant) {
                      sourceArticles.push(article);
                      addedCount++;
                      totalAdded++;
                      console.log(`   ✅ 文章通过AI相关性检查，已添加`);
                    } else {
                      totalFiltered++;
                      console.log(`   ❌ 文章与AI不相关，已过滤`);
                    }
                  } catch (error) {
                    console.warn(`   ⚠️ AI相关性分析失败，默认添加文章:`, error);
                    sourceArticles.push(article);
                    addedCount++;
                    totalAdded++;
                  }
                } else {
                  // 禁用过滤时直接添加
                  sourceArticles.push(article);
                  addedCount++;
                  totalAdded++;
                  console.log(`   ✅ 过滤已禁用，直接添加: ${article.title.substring(0, 30)}...`);
                }
              }
            }
            
            console.log(`✅ ${source.name}: 获取 ${addedCount} 篇文章（过去${HOURS_BACK}小时内）`);
            return { source: source.name, articles: sourceArticles, success: true };
          } else {
            console.log(`⚠️ ${source.name}: 未获取到有效内容`);
            return { source: source.name, articles: [], success: false, reason: '未获取到有效内容' };
          }
        } catch (error) {
          console.log(`❌ ${source.name} 抓取失败:`, error);
          return { source: source.name, articles: [], success: false, reason: error instanceof Error ? error.message : '未知错误' };
        }
      });
      
      // 等待当前批次完成
      const batchResults = await Promise.allSettled(batchPromises);
      
      // 收集成功的结果
      batchResults.forEach((result) => {
        if (result.status === 'fulfilled' && result.value.success) {
          articles.push(...result.value.articles);
        } else if (result.status === 'fulfilled' && !result.value.success) {
          console.warn(`⚠️ 源 ${result.value.source} 处理失败: ${result.value.reason}`);
        } else if (result.status === 'rejected') {
          console.error(`❌ 批次处理异常:`, result.reason);
        }
      });
      
      // 统计批次结果
      const batchSuccess = batchResults.filter(r => r.status === 'fulfilled' && r.value.success).length;
      const batchFailed = batchResults.filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.success)).length;
      
      console.log(`✅ 第 ${batchNum} 批完成: ${batchSuccess} 成功, ${batchFailed} 失败`);
      
      // 批次间短暂延迟，避免过载
      if (batchNum < chunks.length) {
        console.log('⏳ 等待1秒后继续下一批...');
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    // 显示过滤统计信息
    console.log(`\n📊 RSS数据收集完成:`);
    console.log(`   📝 总处理文章数: ${totalProcessed}`);
    console.log(`   ✅ 通过筛选文章数: ${totalAdded}`);
    if (ENABLE_AI_RELEVANCE_FILTER) {
      console.log(`   ❌ AI相关性过滤数: ${totalFiltered}`);
      console.log(`   📈 过滤效率: ${totalProcessed > 0 ? ((totalFiltered / totalProcessed) * 100).toFixed(1) : 0}%`);
    }
    console.log(`   📚 最终收集文章数: ${articles.length}`);
    
    return articles;
  }

  /**
   * 获取ArXiv论文数据
   */
  private async collectArxivData(): Promise<ArticleData[]> {
    console.log('📚 抓取 ArXiv 论文...');
    const articles: ArticleData[] = [];
    
    const arxivResult = await this.arxivCrawler.crawl('cs.AI+OR+cs.LG+OR+cs.CL', 0, Math.max(MAX_ARTICLES_PER_SOURCE * 2, 10), 'submittedDate', 'descending');
    if (arxivResult.success && arxivResult.papers) {
      let addedCount = 0;
      const maxArxivArticles = Math.min(MAX_ARTICLES_PER_SOURCE, 2); // ArXiv最多2篇
      for (const paper of arxivResult.papers) {
        const publishTime = paper.published instanceof Date ? paper.published.toISOString() : new Date().toISOString();
        if (isWithinTimeRange(publishTime, HOURS_BACK) && addedCount < maxArxivArticles) {
          articles.push({
            title: paper.title || '无标题',
            original_summary: paper.summary?.substring(0, 200) + '...',
            summary: paper.summary?.substring(0, 200) + '...',
            source_url: paper.abstractUrl || paper.pdfUrl || 'https://arxiv.org',
            source_name: 'ArXiv',
            publish_time: publishTime
          });
          addedCount++;
        }
      }
    }
    console.log(`✅ ArXiv: 获取 ${articles.length} 篇论文（过去${HOURS_BACK}小时内）`);
    
    return articles;
  }



  /**
   * 收集今日数据
   */
  async collectTodayData(): Promise<ArticleData[]> {
    console.log('🚀 开始抓取今日AI资讯数据...');
    const articles: ArticleData[] = [];

    try {
      // 1. 优先抓取 RSS 资讯
      const rssArticles = await this.collectRSSData();
      articles.push(...rssArticles);

      // 2. 抓取 ArXiv 论文
      if (INCLUDE_SOURCES === 'all' || INCLUDE_SOURCES === 'arxiv-only') {
        const arxivArticles = await this.collectArxivData();
        articles.push(...arxivArticles);
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
    // 根据配置选择AI服务
    if (AI_SERVICE === 'github-models') {
      return await this.generateWithGitHubModels(articles);
    } else if (AI_SERVICE === 'iflow') {
      return await this.generateWithIflow(articles);
    } else {
      return await this.generateWithVolcengine(articles);
    }
  }

  /**
   * 使用GitHub Models生成摘要
   */
  private async generateWithGitHubModels(articles: ArticleData[]): Promise<{ summary: string; articles: any[] }> {
    const githubModelsAI = createGitHubModelsAI();
    
    if (githubModelsAI) {
      console.log('🤖 使用GitHub Models生成AI摘要...');
      try {
        const aiResult = await githubModelsAI.generateDailyReportSummary(articles);
        return aiResult;
      } catch (error) {
        console.error('🤖 GitHub Models摘要生成失败，使用备用方案:', error);
      }
    } else {
      console.log('⚠️ 未配置GitHub Models API，使用简单摘要生成');
    }
    
    return {
      summary: this.generateFallbackSummary(articles),
      articles: articles
    };
  }

  /**
   * 使用火山引擎生成摘要
   */
  private async generateWithVolcengine(articles: ArticleData[]): Promise<{ summary: string; articles: any[] }> {
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
   * 使用iflowAI生成摘要
   */
  private async generateWithIflow(articles: ArticleData[]): Promise<{ summary: string; articles: any[] }> {
    const iflowAI = createIflowAI();
    
    if (iflowAI) {
      console.log('🌟 使用iflowAI生成AI摘要...');
      try {
        const aiResult = await iflowAI.generateDailyReportSummary(articles);
        return aiResult;
      } catch (error) {
        console.error('🌟 iflowAI摘要生成失败，使用备用方案:', error);
      }
    } else {
      console.log('⚠️ 未配置iflowAI API，使用简单摘要生成');
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

💡 提示：配置API密钥可获得更智能的摘要分析。`;
  }

  /**
   * 保存日报到数据库
   */
  async saveDailyReport(reportData: DailyReportData): Promise<boolean> {
    console.log('💾 保存日报到数据库...');

    try {
      const today = new Date().toISOString().split('T')[0];

      // 准备完整的日报数据（JSON格式）
      const reportContent = {
        articles: reportData.items.map(item => ({
          title: item.title,
          url: item.source_url,
          summary: item.original_summary || '暂无摘要', // 原始简短摘要
          aiSummary: item.summary, // AI生成的详细中文总结
          publishTime: item.publish_time,
          source: item.source_name
        })),
        metadata: {
          totalArticles: reportData.items.length,
          generatedAt: new Date().toISOString(),
          sources: [...new Set(reportData.items.map(item => item.source_name))]
        }
      };

      // 使用简化的单表结构保存日报
      const { data: savedReport, error: saveError } = await supabase
        .from('daily_reports')
        .upsert({
          date: today,
          content: reportContent,
          summary: reportData.introduction // AI生成的日报总结
        }, {
          onConflict: 'date'
        })
        .select()
        .single();

      if (saveError) {
        console.error('❌ 保存日报失败:', saveError);
        return false;
      }

      console.log(`✅ 日报已保存，包含 ${reportContent.articles.length} 篇文章`);
      console.log('📝 数据结构:');
      console.log('  - content.articles: 文章列表（包含原始摘要和AI摘要）');
      console.log('  - summary: AI生成的日报总结');
      console.log('  - content.metadata: 元数据（文章数、生成时间、数据源）');
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
        return false;
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

// 导出类供其他脚本使用
export { GitHubDailyReportGenerator };

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
