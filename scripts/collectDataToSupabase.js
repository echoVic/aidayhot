const fs = require('fs');
const path = require('path');

// 🎯 各数据源的智能配置 - 根据测试结果调整
const SOURCE_CONFIGS = {
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

// 解析命令行参数
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    sources: 'all',
    maxResults: null, // 使用源配置的默认值
    timeout: 25,
    verbose: false,
    useSourceConfig: true
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
    }
  }

  return options;
}

// 日志函数
function log(message, type = 'info') {
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

async function collectData() {
  const options = parseArgs();
  
  log(`开始 AI 日报数据收集`, 'info');
  log(`配置: ${JSON.stringify(options)}`, 'info');
  
  // 检查环境变量
  const requiredEnvs = ['SUPABASE_URL', 'SUPABASE_ANON_KEY'];
  for (const env of requiredEnvs) {
    if (!process.env[env]) {
      log(`缺少必需的环境变量: ${env}`, 'error');
      process.exit(1);
    }
  }

  const stats = {
    total: 0,
    success: 0,
    errors: 0,
    sources: {}
  };

  try {
    const timeoutMs = options.timeout * 1000;
    const startTime = Date.now();
    
    log(`设置执行超时: ${options.timeout} 秒`, 'info');

    // 动态导入模块
    const { createClient } = await import('@supabase/supabase-js');
    
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
    );

    log('Supabase 客户端初始化成功', 'success');

    // 确定要爬取的源
    const allSources = ['arxiv', 'github', 'papers-with-code', 'stackoverflow', 'rss'];
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

    // 导入爬虫模块
    const crawlers = {};
    
    for (const source of targetSources) {
      try {
        let crawlerModule;
        
        switch (source) {
          case 'arxiv':
            crawlerModule = require('../src/crawlers/arxivCrawler.js');
            break;
          case 'github':
            crawlerModule = require('../src/crawlers/githubCrawler.js');
            break;
          case 'papers-with-code':
            crawlerModule = require('../src/crawlers/papersWithCodeCrawler.js');
            break;
          case 'stackoverflow':
            crawlerModule = require('../src/crawlers/stackOverflowCrawler.js');
            break;
          case 'rss':
            crawlerModule = require('../src/crawlers/rssCrawler.js');
            break;
          default:
            log(`未知的爬虫源: ${source}`, 'error');
            continue;
        }
        
        crawlers[source] = crawlerModule;
        log(`${source} 爬虫模块加载成功`, 'success');
      } catch (error) {
        log(`加载 ${source} 爬虫失败: ${error.message}`, 'error');
        stats.errors++;
      }
    }

    // 并发执行爬取任务
    const crawlerPromises = Object.entries(crawlers).map(async ([source, CrawlerClass]) => {
      const sourceStats = { total: 0, success: 0, errors: 0 };
      stats.sources[source] = sourceStats;
      
      try {
        // 获取该源的配置
        const sourceConfig = SOURCE_CONFIGS[source];
        const maxResults = options.useSourceConfig && sourceConfig 
          ? sourceConfig.maxResults 
          : (options.maxResults || 10);

        log(`开始爬取 ${source} (${maxResults}篇)`, 'info');
        
        // 创建爬虫实例
        const crawler = new CrawlerClass();
        let results = [];

        // 根据不同源调用对应的方法
        switch (source) {
          case 'arxiv':
            const arxivResults = await crawler.fetchLatestAIPapers(maxResults);
            // 展平多个分类的结果
            for (const [category, result] of Object.entries(arxivResults)) {
              if (result.success && result.papers) {
                results.push(...result.papers.slice(0, Math.ceil(maxResults / 5)).map(paper => ({
                  title: paper.title,
                  url: paper.originalUrl,
                  description: paper.summary,
                  author: paper.authors.join(', '),
                  publishedDate: paper.published.toISOString(),
                  category: category,
                  tags: paper.categories || []
                })));
              }
            }
            break;

          case 'github':
            // GitHub 爬虫需要特定的搜索查询
            const githubResult = await crawler.searchRepositories('machine learning', 'stars', 'desc', maxResults);
            if (githubResult.success && githubResult.repositories) {
              results = githubResult.repositories.map(repo => ({
                title: repo.fullName,
                url: repo.originalUrl,
                description: repo.content || repo.description || '',
                author: repo.owner.login,
                publishedDate: repo.publishedAt,
                category: 'GitHub项目',
                tags: repo.topics || []
              }));
            }
            break;

          case 'papers-with-code':
            try {
              const pwcResult = await crawler.searchPapers('machine learning', maxResults);
              if (pwcResult.success && pwcResult.papers && pwcResult.papers.length > 0) {
                results = pwcResult.papers.map(paper => ({
                  title: paper.title,
                  url: paper.originalUrl,
                  description: paper.abstract || paper.summary || '',
                  author: paper.authors || '',
                  publishedDate: paper.publishedAt || new Date().toISOString(),
                  category: 'Papers with Code',
                  tags: paper.categories || []
                }));
                log(`Papers with Code: 成功获取 ${results.length} 篇论文`, 'success');
              } else {
                log(`Papers with Code: API返回空结果，跳过`, 'info');
                results = [];
              }
            } catch (error) {
              log(`Papers with Code: API不稳定，跳过 - ${error.message}`, 'error');
              results = []; // 失败时返回空数组，不影响其他爬虫
            }
            break;

          case 'stackoverflow':
            try {
              const soResult = await crawler.searchQuestions('machine learning', 'votes', maxResults);
              if (soResult.success && soResult.questions && soResult.questions.length > 0) {
                results = soResult.questions.map(question => ({
                  title: question.title,
                  url: question.originalUrl,
                  description: question.content || question.excerpt || '',
                  author: question.owner.displayName || '',
                  publishedDate: question.creationDate || new Date().toISOString(),
                  category: 'Stack Overflow',
                  tags: question.tags || []
                }));
                log(`Stack Overflow: 成功获取 ${results.length} 个问题`, 'success');
              } else {
                log(`Stack Overflow: API返回空结果，跳过`, 'info');
                results = [];
              }
            } catch (error) {
              log(`Stack Overflow: API限制，跳过 - ${error.message}`, 'error');
              results = []; // 失败时返回空数组，不影响其他爬虫
            }
            break;

          case 'rss':
            // 使用更可靠的RSS源列表
            const reliableRSSFeeds = {
              'Google AI Blog': 'http://googleaiblog.blogspot.com/atom.xml',
              'OpenAI Blog': 'https://openai.com/blog/rss.xml',
              'KDnuggets': 'https://www.kdnuggets.com/feed',
              'Analytics Vidhya': 'https://www.analyticsvidhya.com/blog/feed/'
            };
            
            // 逐个处理RSS源，增加容错性
            for (const [feedName, feedUrl] of Object.entries(reliableRSSFeeds)) {
              try {
                const rssResult = await crawler.fetchRSSFeed(feedUrl);
                if (rssResult.success && rssResult.items) {
                  const feedItems = rssResult.items.slice(0, Math.ceil(maxResults / Object.keys(reliableRSSFeeds).length));
                  const mappedItems = feedItems.map(item => ({
                    title: item.title,
                    url: item.originalUrl || item.link,
                    description: item.content || item.contentSnippet || '',
                    author: item.author || feedName,
                    publishedDate: item.publishedAt ? item.publishedAt.toISOString() : new Date().toISOString(),
                    category: `RSS-${feedName}`,
                    tags: item.metadata?.categories || []
                  }));
                  results.push(...mappedItems);
                  
                  if (options.verbose) {
                    log(`RSS ${feedName}: 获取 ${mappedItems.length} 篇文章`, 'success');
                  }
                } else {
                  log(`RSS ${feedName}: 获取失败 - ${rssResult.error}`, 'error');
                }
              } catch (error) {
                log(`RSS ${feedName}: 处理失败 - ${error.message}`, 'error');
              }
              
              // 延迟避免频繁请求
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
            break;

          default:
            throw new Error(`未支持的爬虫源: ${source}`);
        }

        sourceStats.total = results.length;
        
        if (results.length === 0) {
          log(`${source}: 没有获取到数据`, 'info');
          return;
        }

        // 将数据存储到 Supabase
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
                source: source,
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
            log(`${source}: 保存文章失败 - ${error.message}`, 'error');
          }
        }

        stats.total += sourceStats.total;
        log(`${source} 完成: ${sourceStats.success}/${sourceStats.total} 成功`, 'success');

      } catch (error) {
        sourceStats.errors++;
        stats.errors++;
        log(`${source} 爬取失败: ${error.message}`, 'error');
      }
    });

    await Promise.allSettled(crawlerPromises);

    // 输出最终统计
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    log('', 'info');
    log('=== 执行完成 ===', 'info');
    log(`总执行时间: ${duration} 秒`, 'info');
    log(`总文章数: ${stats.total}`, 'info');
    log(`成功保存: ${stats.success}`, 'info');
    log(`失败数: ${stats.errors}`, 'info');
    log('', 'info');
    
    // 按源统计
    log('📊 各源收集统计:', 'info');
    for (const [source, sourceStats] of Object.entries(stats.sources)) {
      const config = SOURCE_CONFIGS[source];
      const configInfo = config ? ` (配置:${config.maxResults})` : '';
      log(`${source}: ${sourceStats.success}/${sourceStats.total} 成功${configInfo}`, 'info');
    }

    // 写入最终统计到文件
    const finalStats = `
🎯 AI日报数据收集统计

执行时间: ${duration} 秒
总文章数: ${stats.total}
成功保存: ${stats.success}
失败数: ${stats.errors}

📊 各源详细统计:
${Object.entries(stats.sources).map(([source, sourceStats]) => {
  const config = SOURCE_CONFIGS[source];
  return `${source}: ${sourceStats.success}/${sourceStats.total} 成功 (配置:${config?.maxResults || 'N/A'}) - ${config?.description || ''}`;
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

    try {
      fs.writeFileSync('collection_log.txt', finalStats);
    } catch (error) {
      // 忽略文件写入错误
    }

    if (stats.errors > 0) {
      process.exit(1);
    }

  } catch (error) {
    log(`数据收集过程中发生错误: ${error.message}`, 'error');
    console.error(error.stack);
    process.exit(1);
  }
}

if (require.main === module) {
  collectData().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { collectData };
