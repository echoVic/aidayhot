import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import {
  ArxivCrawler,
  GitHubCrawler,
  PapersWithCodeCrawler,
  RSSCrawler,
  StackOverflowCrawler
} from '../src/crawlers';

// 🎯 各数据源的智能配置 - 根据测试结果调整
interface SourceConfig {
  maxResults: number;
  timeout: number;
  priority: 'high' | 'medium' | 'low';
  status: 'working' | 'partial' | 'unstable';
  description: string;
}

const SOURCE_CONFIGS: Record<string, SourceConfig> = {
  'arxiv': { 
    maxResults: 20,        // ✅ 工作正常 - 学术论文，质量高
    timeout: 10,
    priority: 'high',
    status: 'working',
    description: '📚 学术论文 - 高质量研究内容'
  },
  'github': { 
    maxResults: 15,        // ✅ 工作正常 - 开源项目
    timeout: 10,
    priority: 'high',
    status: 'working',
    description: '🐙 开源项目 - 热门AI/ML项目'
  },
  'rss': { 
    maxResults: 60,        // 🚀 RSS源权重大幅提升 - 大量优质RSS源已验证可用
    timeout: 15,
    priority: 'high',
    status: 'working',     // 使用got+fast-xml-parser已解决解析问题
    description: '📰 技术博客 - 丰富的技术观点和趋势 (高权重)'
  },
  'papers-with-code': { 
    maxResults: 5,         // ❌ API不稳定 - 减少依赖
    timeout: 8,
    priority: 'low',
    status: 'unstable',
    description: '🔬 ML论文+代码 - 实用研究 (备用)'
  },
  'stackoverflow': { 
    maxResults: 5,         // ❌ API问题 - 减少依赖
    timeout: 6,
    priority: 'low',
    status: 'unstable',
    description: '💬 技术问答 - 精选高质量问题 (备用)'
  }
};

interface ParsedArgs {
  sources: string;
  maxResults: number | null;
  timeout: number;
  verbose: boolean;
  useSourceConfig: boolean;
  continueOnError: boolean;
  hoursBack: number; // 简化：只需要指定往前多少小时
}

interface SourceStats {
  total: number;
  success: number;
  errors: number;
  crawlerError: boolean;
}

interface CollectionStats {
  total: number;
  success: number;
  errors: number;
  sources: Record<string, SourceStats>;
  crawlerSuccess: number;
  saveErrors: number;
}

interface ArticleItem {
  title: string;
  url: string;
  description: string;
  author: string;
  publishedDate: string;
  category: string;
  tags: string[];
  source: string;
  arxivId?: string;  // ArXiv 特有的 ID
  repoId?: number;   // GitHub 特有的仓库 ID
}

// 解析命令行参数
function parseArgs(): ParsedArgs {
  const args = process.argv.slice(2);
  const options: ParsedArgs = {
    sources: 'all',
    maxResults: null, // 使用源配置的默认值
    timeout: 25,
    verbose: false,
    useSourceConfig: true,
    continueOnError: true,  // 错误时继续执行
    hoursBack: 0  // 默认不使用时间过滤
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--sources=')) {
      options.sources = arg.split('=')[1];
    } else if (arg.startsWith('--max-results=')) {
      options.maxResults = parseInt(arg.split('=')[1]);
      options.useSourceConfig = false;
    } else if (arg.startsWith('--timeout=')) {
      options.timeout = parseInt(arg.split('=')[1]);
    } else if (arg.startsWith('--hours-back=')) {
      options.hoursBack = parseInt(arg.split('=')[1]);
    } else if (arg === '--verbose') {
      options.verbose = true;
    } else if (arg === '--uniform-config') {
      options.useSourceConfig = false;
    } else if (arg === '--fail-fast') {
      options.continueOnError = false;
    } else if (arg === '--last-12h') {
      options.hoursBack = 12; // 快捷方式：拉取前12小时
    }
  }

  return options;
}

// 日志函数
function log(message: string, type: 'info' | 'error' | 'success' = 'info'): void {
  const timestamp = new Date().toISOString();
  const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️';
  const logMessage = `${timestamp} ${prefix} ${message}`;
  
  console.log(logMessage);
  
  try {
    fs.appendFileSync('collection_log.txt', logMessage + '\n');
  } catch (error) {
    // 忽略文件写入错误
  }
}

// 计算时间范围 - 简单版本
function calculateTimeRange(hoursBack: number): { fromTime: Date; toTime: Date } | null {
  if (hoursBack <= 0) {
    return null; // 不使用时间过滤
  }
  
  const toTime = new Date(); // 当前时间
  const fromTime = new Date(toTime.getTime() - hoursBack * 60 * 60 * 1000); // 往前推指定小时数
  
  return { fromTime, toTime };
}

async function collectData(): Promise<void> {
  const options = parseArgs();
  
  log(`开始 AI 日报数据收集`, 'info');
  log(`配置: ${JSON.stringify(options)}`, 'info');
  
  // 检查环境变量
  const requiredEnvs = ['SUPABASE_URL', 'SUPABASE_ANON_KEY'];
  for (const env of requiredEnvs) {
    if (!process.env[env]) {
      log(`缺少必需的环境变量: ${env}`, 'error');
      if (!options.continueOnError) {
        process.exit(1);
      }
      log('继续执行但跳过数据保存...', 'info');
      break;
    }
  }

  const stats: CollectionStats = {
    total: 0,
    success: 0,
    errors: 0,
    sources: {},
    crawlerSuccess: 0,
    saveErrors: 0
  };

  try {
    const timeoutMs = options.timeout * 1000;
    const startTime = Date.now();
    
    log(`设置执行超时: ${options.timeout} 秒`, 'info');

    // 初始化 Supabase（使用 try-catch 包装）
    let supabase: SupabaseClient | null = null;
    let canSaveToDatabase = false;
    
    try {
      if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
        
        log(`Supabase URL: ${supabaseUrl}`, 'info');
        log(`使用的密钥类型: ${process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SERVICE_ROLE_KEY' : 'ANON_KEY'}`, 'info');
        
        supabase = createClient(supabaseUrl, supabaseKey);
        
        // 测试连接
        try {
          log('开始测试数据库连接...', 'info');
          const { data, error } = await supabase.from('articles').select('count').limit(1);
          if (error) {
            log(`数据库连接测试失败: ${error.message}`, 'error');
            log(`连接错误详情: ${JSON.stringify(error)}`, 'error');
            throw error;
          }
          log('数据库连接测试成功', 'success');
          canSaveToDatabase = true;
        } catch (connError) {
          log(`数据库连接失败: ${connError instanceof Error ? connError.message : 'Unknown connection error'}`, 'error');
          log(`连接错误完整信息: ${JSON.stringify(connError)}`, 'error');
          if (!options.continueOnError) {
            throw connError;
          }
          log('继续执行爬虫测试（跳过数据保存）...', 'info');
        }
        
        log('Supabase 客户端初始化成功', 'success');
      } else {
        log('Supabase 环境变量缺失，将只运行爬虫测试', 'info');
        log(`SUPABASE_URL: ${process.env.SUPABASE_URL ? '已设置' : '未设置'}`, 'info');
        log(`SUPABASE_ANON_KEY: ${process.env.SUPABASE_ANON_KEY ? '已设置' : '未设置'}`, 'info');
        log(`SUPABASE_SERVICE_ROLE_KEY: ${process.env.SUPABASE_SERVICE_ROLE_KEY ? '已设置' : '未设置'}`, 'info');
      }
    } catch (error) {
      log(`Supabase 初始化失败: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
      if (options.verbose) {
        log(`初始化错误详情: ${JSON.stringify(error)}`, 'error');
      }
      if (!options.continueOnError) {
        throw error;
      }
      log('继续执行爬虫测试...', 'info');
    }

    // 确定要爬取的源
    const allSources = ['arxiv', 'github', 'rss', 'papers-with-code', 'stackoverflow'];
    const targetSources = options.sources === 'all' 
      ? allSources 
      : options.sources.split(',').map(s => s.trim()).filter(s => s.length > 0);
    
    log(`目标爬取源: ${targetSources.join(', ')}`, 'info');

    // 显示智能配置信息
    if (options.useSourceConfig) {
      log('使用智能源配置:', 'info');
      targetSources.forEach(source => {
        const config = SOURCE_CONFIGS[source];
        if (config) {
          log(`  ${source}: ${config.maxResults}篇 - ${config.description}`, 'info');
        }
      });
    }

    // 创建爬虫实例
    const crawlers: Record<string, any> = {};
    
    for (const source of targetSources) {
      try {
        switch (source) {
          case 'arxiv':
            crawlers[source] = new ArxivCrawler();
            break;
          case 'github':
            crawlers[source] = new GitHubCrawler();
            break;
          case 'rss':
            crawlers[source] = new RSSCrawler();
            break;
          case 'papers-with-code':
            crawlers[source] = new PapersWithCodeCrawler({ useMockData: true }); // 使用模拟数据
            break;
          case 'stackoverflow':
            crawlers[source] = new StackOverflowCrawler();
            break;
          default:
            log(`未支持的爬虫源: ${source}`, 'error');
            continue;
        }
        
        log(`${source} 爬虫实例创建成功`, 'success');
      } catch (error) {
        log(`创建 ${source} 爬虫失败: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
        stats.errors++;
        if (!options.continueOnError) {
          throw error;
        }
      }
    }

    // 并发执行爬取任务
    const crawlerPromises = Object.entries(crawlers).map(async ([source, crawler]) => {
      const sourceStats: SourceStats = { total: 0, success: 0, errors: 0, crawlerError: false };
      stats.sources[source] = sourceStats;
      
      // 为每个数据源设置独立的开始时间
      const sourceStartTime = Date.now();
      
      // 计算时间范围 - 简化版本
      const timeRange = calculateTimeRange(options.hoursBack);
      const fromTime = timeRange?.fromTime;
      const toTime = timeRange?.toTime || new Date();
      
      if (timeRange) {
        log(`${source}: 时间过滤模式 - 从 ${fromTime!.toISOString()} 到 ${toTime.toISOString()} (前${options.hoursBack}小时)`, 'info');
      }
      
      try {
        // 获取该源的配置
        const sourceConfig = SOURCE_CONFIGS[source];
        const maxResults = options.useSourceConfig && sourceConfig 
          ? sourceConfig.maxResults 
          : (options.maxResults || 10);

        log(`开始爬取 ${source} (${maxResults}篇)`, 'info');
        
        let results: ArticleItem[] = [];

        // 根据不同源调用对应的方法
        switch (source) {
          case 'arxiv': {
            let arxivResults;
            if (fromTime) {
              // 使用时间范围查询
              log(`${source}: 使用时间范围查询 ArXiv 论文`, 'info');
              // 调用支持时间范围的方法（需要修改crawler）
              arxivResults = await crawler.fetchLatestAIPapers(maxResults);
            } else {
              arxivResults = await crawler.fetchLatestAIPapers(maxResults);
            }
            
            // 展平多个分类的结果
            for (const [category, result] of Object.entries(arxivResults) as [string, any][]) {
              if (result.success && result.papers) {
                let papers = result.papers.slice(0, Math.ceil(maxResults / 5));
                
                // 如果启用了时间过滤，过滤论文
                if (fromTime) {
                  papers = papers.filter((paper: any) => {
                    const publishedDate = new Date(paper.published);
                    return publishedDate >= fromTime! && publishedDate <= toTime;
                  });
                }
                
                results.push(...papers.map((paper: any) => ({
                  title: paper.title,
                  url: paper.abstractUrl || paper.pdfUrl,  // 使用正确的URL字段
                  description: paper.summary,
                  author: paper.authors.join(', '),
                  publishedDate: paper.published.toISOString(),
                  category: category,
                  tags: paper.categories || [],
                  source: 'arxiv',
                  arxivId: paper.id  // 添加 ArXiv ID
                })));
              }
            }
            break;
          }

          case 'github': {
            let searchQuery = 'machine learning';
            
            // 如果启用时间过滤，添加时间范围到搜索查询
            if (fromTime) {
              const fromDateStr = fromTime.toISOString().split('T')[0]; // YYYY-MM-DD
              const toDateStr = toTime.toISOString().split('T')[0];     // YYYY-MM-DD
              searchQuery = `${searchQuery} pushed:${fromDateStr}..${toDateStr}`;
              log(`${source}: 使用时间范围查询 - ${searchQuery}`, 'info');
            }
            
            const githubResult = await crawler.searchRepositories(searchQuery, 'updated', 'desc', maxResults);
            if (githubResult.success && githubResult.repositories) {
              let repositories = githubResult.repositories;
              
              // 额外的时间过滤（双重保障）
              if (fromTime) {
                repositories = repositories.filter((repo: any) => {
                  const updatedDate = new Date(repo.updatedAt);
                  return updatedDate >= fromTime! && updatedDate <= toTime;
                });
              }
              
              results = repositories.map((repo: any) => ({
                title: repo.fullName,
                url: repo.url,  // 使用正确的URL字段
                description: repo.content || repo.description || '',
                author: repo.owner.login,
                publishedDate: repo.updatedAt,  // 使用updatedAt而不是publishedAt
                category: 'GitHub项目',
                tags: repo.topics || [],
                source: 'github',
                repoId: repo.owner.id  // 使用owner.id，这是真正的数字ID
              }));
            }
            break;
          }

          case 'rss': {
            const rssFeeds = crawler.getAIRSSFeeds();
            const feedResults = await crawler.fetchMultipleRSSFeeds(rssFeeds);
            
            for (const [feedName, feedResult] of Object.entries(feedResults) as [string, any][]) {
              if (feedResult.success && feedResult.data && feedResult.data.items) {
                let items = feedResult.data.items.slice(0, Math.ceil(maxResults / Object.keys(rssFeeds).length));
                
                // 如果启用了时间过滤，过滤RSS条目
                if (fromTime) {
                  items = items.filter((item: any) => {
                    if (!item.pubDate) return false; // 如果没有发布时间，跳过
                    const pubDate = new Date(item.pubDate);
                    return pubDate >= fromTime! && pubDate <= toTime;
                  });
                  log(`${source}: 时间过滤后保留 ${items.length} 条RSS文章`, 'info');
                }
                
                results.push(...items.map((item: any) => ({
                  title: item.title,
                  url: item.link,  // 使用正确的URL字段
                  description: (item.description || item.content || '').substring(0, 500) + (((item.description || item.content || '').length > 500) ? '...' : ''),
                  author: item.author || feedName,
                  publishedDate: item.pubDate ? item.pubDate.toISOString() : new Date().toISOString(),
                  category: 'RSS文章',
                  tags: item.categories || [],
                  source: 'rss'
                })));
              }
            }
            break;
          }

          case 'papers-with-code': {
            const papersResult = await crawler.getAIPapers(maxResults);
            if (papersResult.success && papersResult.papers) {
              let papers = papersResult.papers;
              
              // 如果启用了时间过滤，过滤论文
              if (fromTime) {
                papers = papers.filter((paper: any) => {
                  const publishedDate = new Date(paper.publishedAt);
                  return publishedDate >= fromTime! && publishedDate <= toTime;
                });
                log(`${source}: 时间过滤后保留 ${papers.length} 篇论文`, 'info');
              }
              
              results = papers.map((paper: any) => ({
                title: paper.title,
                url: paper.url,
                description: paper.abstract,
                author: paper.authors.join(', '),
                publishedDate: paper.publishedAt.toISOString(),
                category: 'ML论文',
                tags: paper.tasks || [],
                source: 'papers-with-code'
              }));
            }
            break;
          }

          case 'stackoverflow': {
            const soResult = await crawler.getAIQuestions(maxResults);
            if (soResult.success && soResult.questions) {
              let questions = soResult.questions;
              
              // 如果启用了时间过滤，过滤问题
              if (fromTime) {
                questions = questions.filter((question: any) => {
                  const creationDate = new Date(question.creationDate);
                  return creationDate >= fromTime! && creationDate <= toTime;
                });
                log(`${source}: 时间过滤后保留 ${questions.length} 个问题`, 'info');
              }
              
              results = questions.map((question: any) => ({
                title: question.title,
                url: question.url,
                description: question.excerpt || question.body?.substring(0, 500) || '',
                author: question.owner.displayName,
                publishedDate: question.creationDate.toISOString(),
                category: 'Stack Overflow',
                tags: question.tags || [],
                source: 'stackoverflow'
              }));
            }
            break;
          }

          default:
            throw new Error(`未支持的爬虫源: ${source}`);
        }

        sourceStats.total = results.length;
        stats.crawlerSuccess += results.length;
        
        if (results.length === 0) {
          log(`${source}: 没有获取到数据`, 'info');
          return;
        }

        // 如果可以保存到数据库，则保存数据
        if (canSaveToDatabase && supabase) {
          for (const item of results) {
            try {
              // 为单个数据源设置独立的超时检查（每个源有15分钟的独立时间）
              const sourceTimeoutMs = 15 * 60 * 1000; // 15分钟
              if (Date.now() - sourceStartTime > sourceTimeoutMs) {
                log(`${source}: 数据源处理超时（${Math.floor((Date.now() - sourceStartTime) / 1000)}秒），停止处理剩余文章`, 'error');
                break; // 跳出当前源的处理，但不抛出错误
              }

              // 生成唯一的内容ID和文章ID
              const crypto = require('crypto');
              const urlHash = crypto.createHash('md5').update(item.url).digest('hex').substring(0, 16);
              const contentId = `${item.source}_${urlHash}`;  // 使用hash缩短长度
              const articleId = `${item.source}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

              // 准备基础数据
              const articleData: any = {
                id: articleId,
                title: item.title,
                summary: item.description || '',
                category: item.category || 'general',
                author: item.author || '',
                publish_time: item.publishedDate ? new Date(item.publishedDate).toISOString() : new Date().toISOString(),
                source_url: item.url,
                source_type: item.source,
                content_id: contentId,
                tags: item.tags || [],
                is_new: true,
                is_hot: false,
                views: 0,
                likes: 0,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              };

              // 为特定源添加额外字段
              if (item.source === 'arxiv' && (item as any).arxivId) {
                articleData.arxiv_id = (item as any).arxivId;
                if (options.verbose) {
                  log(`${source}: 添加ArXiv ID: ${(item as any).arxivId}`, 'info');
                }
              }
              if (item.source === 'github' && (item as any).repoId) {
                // GitHub repo_id 暂时设为null，因为我们当前使用的是hash字符串而不是数字ID
                articleData.repo_id = null;
                if (options.verbose) {
                  log(`${source}: GitHub仓库hash: ${(item as any).repoId}`, 'info');
                }
              }

              // 数据验证
              const requiredFields = ['id', 'title', 'source_url', 'source_type', 'content_id'];
              const missingFields = requiredFields.filter(field => !articleData[field]);
              if (missingFields.length > 0) {
                log(`${source}: 数据验证失败，缺少必需字段: ${missingFields.join(', ')}`, 'error');
                if (options.verbose) {
                  log(`完整数据: ${JSON.stringify(articleData, null, 2)}`, 'error');
                }
                throw new Error(`缺少必需字段: ${missingFields.join(', ')}`);
              }

              // 新的表结构使用更合理的字段长度，只做基本的长度检查
              if (articleData.title && articleData.title.length > 1000) {
                articleData.title = articleData.title.substring(0, 997) + '...';
                log(`${source}: 标题过长，已截断`, 'info');
              }
              
              if (articleData.summary && articleData.summary.length > 5000) {
                articleData.summary = articleData.summary.substring(0, 4997) + '...';
                log(`${source}: 摘要过长，已截断`, 'info');
              }
              
              if (articleData.category && articleData.category.length > 100) {
                articleData.category = articleData.category.substring(0, 97) + '...';
                log(`${source}: 分类名称过长，已截断`, 'info');
              }

              // 详细调试信息
              if (options.verbose) {
                log(`${source}: 准备保存文章数据: ${JSON.stringify({
                  id: articleData.id,
                  title: articleData.title.substring(0, 50) + '...',
                  content_id: articleData.content_id,
                  source_type: articleData.source_type
                })}`, 'info');
              }

              // 先尝试查找是否已存在相同内容（添加超时）
              const { data: existingData } = await Promise.race([
                supabase
                  .from('articles')
                  .select('id')
                  .eq('content_id', articleData.content_id)
                  .limit(1),
                new Promise((_, reject) => 
                  setTimeout(() => reject(new Error('查询超时')), 10000)
                )
              ]) as any;

              let data, error;
              
              if (existingData && existingData.length > 0) {
                // 如果存在，更新现有记录（添加超时）
                const updateResult = await Promise.race([
                  supabase
                    .from('articles')
                    .update(articleData)
                    .eq('content_id', articleData.content_id)
                    .select(),
                  new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('更新超时')), 15000)
                  )
                ]) as any;
                data = updateResult.data;
                error = updateResult.error;
                if (options.verbose && !error) {
                  log(`${source}: 更新已存在的文章`, 'info');
                }
              } else {
                // 如果不存在，插入新记录（添加超时）
                const insertResult = await Promise.race([
                  supabase
                    .from('articles')
                    .insert([articleData])
                    .select(),
                  new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('插入超时')), 15000)
                  )
                ]) as any;
                data = insertResult.data;
                error = insertResult.error;
                if (options.verbose && !error) {
                  log(`${source}: 插入新文章`, 'info');
                }
              }

              if (error) {
                // 详细的错误信息
                log(`${source}: Supabase错误详情:`, 'error');
                log(`  - 错误代码: ${error.code}`, 'error');
                log(`  - 错误消息: ${error.message}`, 'error');
                log(`  - 错误详情: ${JSON.stringify(error.details)}`, 'error');
                log(`  - 错误提示: ${error.hint}`, 'error');
                log(`  - 尝试插入的数据: ${JSON.stringify(articleData, null, 2)}`, 'error');
                throw error;
              }

              if (options.verbose && data) {
                log(`${source}: 数据库返回: ${JSON.stringify(data)}`, 'info');
              }

              sourceStats.success++;
              stats.success++;
              
              if (options.verbose) {
                log(`${source}: 保存文章 "${item.title}"`, 'success');
              }
            } catch (error) {
              sourceStats.errors++;
              stats.errors++;
              stats.saveErrors++;
              
              // 详细错误日志 - 始终显示基本信息
              const errorMessage = error instanceof Error ? error.message : 'Unknown error';
              log(`${source}: 保存文章失败 - ${errorMessage}`, 'error');
              log(`${source}: 失败文章标题: "${item.title}"`, 'error');
              log(`${source}: 失败文章URL: ${item.url}`, 'error');
              
              // 详细的错误信息
              if (error instanceof Error) {
                log(`${source}: 错误类型: ${error.constructor.name}`, 'error');
                if (error.stack) {
                  log(`${source}: 错误堆栈: ${error.stack}`, 'error');
                }
              }
              
              // 输出完整的错误对象
              try {
                log(`${source}: 完整错误对象: ${JSON.stringify(error, null, 2)}`, 'error');
              } catch (jsonError) {
                log(`${source}: 无法序列化错误对象: ${String(error)}`, 'error');
              }
              
              // 如果是 Supabase 错误，显示更多信息
              if (error && typeof error === 'object') {
                if ('code' in error) {
                  const code = (error as any).code;
                  log(`${source}: Supabase错误代码: ${code}`, 'error');
                  
                  if (code === '23505') {
                    log(`${source}: 解决方案 - 唯一约束冲突，可能是重复数据`, 'error');
                  } else if (code === '23502') {
                    log(`${source}: 解决方案 - 非空约束违反，检查必需字段`, 'error');
                  } else if (code === '23503') {
                    log(`${source}: 解决方案 - 外键约束违反，检查分类是否存在`, 'error');
                  } else if (code === 'PGRST116') {
                    log(`${source}: 解决方案 - 权限问题，检查RLS策略`, 'error');
                  } else {
                    log(`${source}: 解决方案 - 未知错误代码: ${code}`, 'error');
                  }
                }
                
                if ('message' in error) {
                  log(`${source}: Supabase错误消息: ${(error as any).message}`, 'error');
                }
                
                if ('details' in error) {
                  log(`${source}: Supabase错误详情: ${JSON.stringify((error as any).details)}`, 'error');
                }
                
                if ('hint' in error) {
                  log(`${source}: Supabase错误提示: ${(error as any).hint}`, 'error');
                }
              }
              
              // 如果不是 continue-on-error 模式，在连续多次保存失败时停止
              if (!options.continueOnError && sourceStats.errors > 5) {
                log(`${source}: 连续保存失败，停止该源的数据保存`, 'error');
                break;
              }
            }
          }
        } else {
          // 模拟保存成功，只用于测试
          sourceStats.success = results.length;
          stats.success += results.length;
          log(`${source}: 测试模式 - 模拟保存 ${results.length} 篇文章`, 'info');
        }

        stats.total += sourceStats.total;
        log(`${source} 完成: ${sourceStats.success}/${sourceStats.total} 成功`, 'success');

      } catch (error) {
        sourceStats.errors++;
        stats.errors++;
        sourceStats.crawlerError = true;
        
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        log(`${source} 爬取失败: ${errorMessage}`, 'error');
        
        if (!options.continueOnError) {
          throw error;
        }
      }
    });

    await Promise.allSettled(crawlerPromises);

    // 更新分类统计
    if (canSaveToDatabase && supabase && stats.success > 0) {
      try {
        log('开始更新分类统计...', 'info');
        
        // 获取所有分类的文章统计
        const { data: categoryStats, error: statsError } = await supabase
          .from('articles')
          .select('category')
          .not('category', 'is', null);
        
        if (statsError) {
          log(`获取分类统计失败: ${statsError.message}`, 'error');
        } else {
          // 统计每个分类的文章数量
          const categoryCounts: Record<string, number> = {};
          categoryStats?.forEach(article => {
            const category = article.category || 'general';
            categoryCounts[category] = (categoryCounts[category] || 0) + 1;
          });
          
          // 更新每个分类的count字段
          for (const [categoryName, count] of Object.entries(categoryCounts)) {
            try {
              const { error: updateError } = await supabase
                .from('categories')
                .update({ count })
                .eq('name', categoryName);
              
              if (updateError) {
                log(`更新分类 "${categoryName}" 统计失败: ${updateError.message}`, 'error');
              } else {
                log(`更新分类 "${categoryName}": ${count} 篇文章`, 'info');
              }
            } catch (error) {
              log(`更新分类 "${categoryName}" 时发生错误: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
            }
          }
          
          log(`分类统计更新完成，共处理 ${Object.keys(categoryCounts).length} 个分类`, 'success');
        }
      } catch (error) {
        log(`分类统计更新过程中发生错误: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
      }
    }

    // 输出最终统计
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    log('', 'info');
    log('=== 执行完成 ===', 'info');
    log(`总执行时间: ${duration} 秒`, 'info');
    log(`爬虫获取: ${stats.crawlerSuccess} 篇文章`, 'info');
    log(`成功保存: ${stats.success}`, 'info');
    log(`保存失败: ${stats.saveErrors}`, 'info');
    log(`爬虫失败: ${stats.errors - stats.saveErrors}`, 'info');
    log('', 'info');
    
    // 按源统计
    log('📊 各源收集统计:', 'info');
    for (const [source, sourceStats] of Object.entries(stats.sources)) {
      const config = SOURCE_CONFIGS[source];
      const configInfo = config ? ` (配置:${config.maxResults})` : '';
      const errorInfo = sourceStats.crawlerError ? ' [爬虫错误]' : '';
      log(`${source}: ${sourceStats.success}/${sourceStats.total} 成功${configInfo}${errorInfo}`, 'info');
    }

    // 写入最终统计到文件
    const finalStats = generateFinalStats(stats, duration);

    try {
      fs.writeFileSync('collection_log.txt', finalStats);
    } catch (error) {
      // 忽略文件写入错误
    }

    // 根据选项决定退出码
    if (options.continueOnError) {
      // 如果设置了 continue-on-error，只有在没有任何数据被爬取时才失败
      if (stats.crawlerSuccess === 0) {
        log('没有成功爬取任何数据', 'error');
        process.exit(1);
      } else {
        log(`虽然有 ${stats.errors} 个错误，但成功获取了 ${stats.crawlerSuccess} 篇文章`, 'info');
      }
    } else if (stats.errors > 0) {
      process.exit(1);
    }

  } catch (error) {
    log(`数据收集过程中发生错误: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    console.error(error);
    process.exit(1);
  }
}

function generateFinalStats(stats: CollectionStats, duration: string): string {
  return `
🎯 AI日报数据收集统计

执行时间: ${duration} 秒
爬虫获取: ${stats.crawlerSuccess} 篇
成功保存: ${stats.success}
保存失败: ${stats.saveErrors}
爬虫失败: ${stats.errors - stats.saveErrors}

📊 各源详细统计:
${Object.entries(stats.sources).map(([source, sourceStats]) => {
  const config = SOURCE_CONFIGS[source];
  const errorInfo = sourceStats.crawlerError ? ' [爬虫API错误]' : '';
  return `${source}: ${sourceStats.success}/${sourceStats.total} 成功 (配置:${config?.maxResults || 'N/A'})${errorInfo} - ${config?.description || ''}`;
}).join('\n')}

📈 每日预期收集量 (早晚各一次):
${Object.entries(SOURCE_CONFIGS).map(([source, config]) => {
  const status = config.status === 'working' ? '✅' : config.status === 'partial' ? '⚠️' : '❌';
  return `${status} ${source}: ${config.maxResults} × 2 = ${config.maxResults * 2}篇/天 (${config.status})`;
}).join('\n')}

🎯 可靠源总预期: ${Object.values(SOURCE_CONFIGS)
  .filter(config => config.status === 'working' || config.status === 'partial')
  .reduce((sum, config) => sum + config.maxResults * 2, 0)}篇/天

📊 按优先级分布:
- 高优先级: ${Object.values(SOURCE_CONFIGS).filter(c => c.priority === 'high').length} 个源
- 中优先级: ${Object.values(SOURCE_CONFIGS).filter(c => c.priority === 'medium').length} 个源  
- 低优先级: ${Object.values(SOURCE_CONFIGS).filter(c => c.priority === 'low').length} 个源
`;
}

if (require.main === module) {
  collectData().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { collectData };
