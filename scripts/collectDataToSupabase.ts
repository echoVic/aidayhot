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
    maxResults: 18,        // ✅ 工作正常 - 学术论文，质量高
    timeout: 10,
    priority: 'high',
    status: 'working',
    description: '📚 学术论文 - 高质量研究内容'
  },
  'github': { 
    maxResults: 12,        // ✅ 工作正常 - 开源项目
    timeout: 10,
    priority: 'high',
    status: 'working',
    description: '🐙 开源项目 - 热门AI/ML项目'
  },
  'rss': { 
    maxResults: 25,        // ⚠️ 部分RSS源可能不稳定，但总体可用
    timeout: 12,
    priority: 'high',
    status: 'partial',     // 使用更可靠的RSS源
    description: '📰 技术博客 - 丰富的技术观点和趋势'
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
    continueOnError: true  // 新增：错误时继续执行
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
    } else if (arg === '--verbose') {
      options.verbose = true;
    } else if (arg === '--uniform-config') {
      options.useSourceConfig = false;
    } else if (arg === '--fail-fast') {
      options.continueOnError = false;
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
        supabase = createClient(
          process.env.SUPABASE_URL,
          process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
        );
        canSaveToDatabase = true;
        log('Supabase 客户端初始化成功', 'success');
      } else {
        log('Supabase 环境变量缺失，将只运行爬虫测试', 'info');
      }
    } catch (error) {
      log(`Supabase 初始化失败: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
      if (!options.continueOnError) {
        throw error;
      }
      log('继续执行爬虫测试...', 'info');
    }

    // 确定要爬取的源
    const allSources = ['arxiv', 'github', 'rss', 'papers-with-code', 'stackoverflow'];
    const targetSources = options.sources === 'all' ? allSources : [options.sources];
    
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
            const arxivResults = await crawler.fetchLatestAIPapers(maxResults);
            // 展平多个分类的结果
            for (const [category, result] of Object.entries(arxivResults) as [string, any][]) {
              if (result.success && result.papers) {
                results.push(...result.papers.slice(0, Math.ceil(maxResults / 5)).map((paper: any) => ({
                  title: paper.title,
                  url: paper.originalUrl,
                  description: paper.summary,
                  author: paper.authors.join(', '),
                  publishedDate: paper.published.toISOString(),
                  category: category,
                  tags: paper.categories || [],
                  source: 'arxiv'
                })));
              }
            }
            break;
          }

          case 'github': {
            const githubResult = await crawler.searchRepositories('machine learning', 'stars', 'desc', maxResults);
            if (githubResult.success && githubResult.repositories) {
              results = githubResult.repositories.map((repo: any) => ({
                title: repo.fullName,
                url: repo.originalUrl,
                description: repo.content || repo.description || '',
                author: repo.owner.login,
                publishedDate: repo.publishedAt,
                category: 'GitHub项目',
                tags: repo.topics || [],
                source: 'github'
              }));
            }
            break;
          }

          case 'rss': {
            const rssFeeds = crawler.getAIRSSFeeds();
            const feedResults = await crawler.fetchMultipleRSSFeeds(rssFeeds);
            
            for (const [feedName, feedResult] of Object.entries(feedResults) as [string, any][]) {
              if (feedResult.success && feedResult.items) {
                const itemsToAdd = feedResult.items.slice(0, Math.ceil(maxResults / Object.keys(rssFeeds).length));
                results.push(...itemsToAdd.map((item: any) => ({
                  title: item.title,
                  url: item.originalUrl,
                  description: item.content.substring(0, 500) + (item.content.length > 500 ? '...' : ''),
                  author: item.author || feedName,
                  publishedDate: item.publishedAt ? item.publishedAt.toISOString() : new Date().toISOString(),
                  category: 'RSS文章',
                  tags: item.metadata?.categories || [],
                  source: 'rss'
                })));
              }
            }
            break;
          }

          case 'papers-with-code': {
            const papersResult = await crawler.getAIPapers(maxResults);
            if (papersResult.success && papersResult.papers) {
              results = papersResult.papers.map((paper: any) => ({
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
              results = soResult.questions.map((question: any) => ({
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
              if (Date.now() - startTime > timeoutMs) {
                throw new Error('执行超时');
              }

              const { error } = await supabase
                .from('articles')
                .upsert([{
                  title: item.title,
                  url: item.url,
                  description: item.description || '',
                  source: item.source,
                  category: item.category || 'general',
                  author: item.author || '',
                  published_date: item.publishedDate || new Date().toISOString(),
                  tags: item.tags || [],
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                }], {
                  onConflict: 'url'
                });

              if (error) {
                throw error;
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
              
              if (options.verbose) {
                log(`${source}: 保存文章失败 - ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
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
        log(`${source} 爬取失败: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
        
        if (!options.continueOnError) {
          throw error;
        }
      }
    });

    await Promise.allSettled(crawlerPromises);

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
