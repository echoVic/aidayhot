const fs = require('fs');
const path = require('path');

// 解析命令行参数
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    sources: 'all',
    maxResults: 10,
    timeout: 25,
    verbose: false
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--sources=')) {
      options.sources = arg.split('=')[1];
    } else if (arg.startsWith('--max-results=')) {
      options.maxResults = parseInt(arg.split('=')[1]);
    } else if (arg.startsWith('--timeout=')) {
      options.timeout = parseInt(arg.split('=')[1]);
    } else if (arg === '--verbose') {
      options.verbose = true;
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
  
  // 写入日志文件
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
    // 设置超时
    const timeoutMs = options.timeout * 1000;
    const startTime = Date.now();
    
    log(`设置执行超时: ${options.timeout} 秒`, 'info');

    // 动态导入模块
    const { createClient } = await import('@supabase/supabase-js');
    
    // 初始化 Supabase 客户端
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
    );

    log('Supabase 客户端初始化成功', 'success');

    // 确定要爬取的源
    const allSources = ['arxiv', 'github', 'papers-with-code', 'stackoverflow', 'rss'];
    const targetSources = options.sources === 'all' ? allSources : [options.sources];
    
    log(`目标爬取源: ${targetSources.join(', ')}`, 'info');

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
    const crawlerPromises = Object.entries(crawlers).map(async ([source, crawler]) => {
      const sourceStats = { total: 0, success: 0, errors: 0 };
      stats.sources[source] = sourceStats;
      
      try {
        log(`开始爬取 ${source}`, 'info');
        
        // 执行爬取
        let results = [];
        if (typeof crawler.crawlArxiv === 'function') {
          results = await crawler.crawlArxiv({ maxResults: options.maxResults });
        } else if (typeof crawler.crawlGitHub === 'function') {
          results = await crawler.crawlGitHub({ maxResults: options.maxResults });
        } else if (typeof crawler.crawlPapersWithCode === 'function') {
          results = await crawler.crawlPapersWithCode({ maxResults: options.maxResults });
        } else if (typeof crawler.crawlStackOverflow === 'function') {
          results = await crawler.crawlStackOverflow({ maxResults: options.maxResults });
        } else if (typeof crawler.crawlRSS === 'function') {
          results = await crawler.crawlRSS({ maxResults: options.maxResults });
        } else {
          throw new Error(`未找到 ${source} 的爬取函数`);
        }

        sourceStats.total = results.length;
        
        if (results.length === 0) {
          log(`${source}: 没有获取到数据`, 'info');
          return;
        }

        // 将数据存储到 Supabase
        for (const item of results) {
          try {
            // 检查超时
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

    // 等待所有爬虫完成
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
    for (const [source, sourceStats] of Object.entries(stats.sources)) {
      log(`${source}: ${sourceStats.success}/${sourceStats.total} 成功`, 'info');
    }

    // 写入最终统计到文件
    const finalStats = `
执行时间: ${duration} 秒
总文章数: ${stats.total}
成功保存: ${stats.success}
失败数: ${stats.errors}

按源统计:
${Object.entries(stats.sources).map(([source, sourceStats]) => 
  `${source}: ${sourceStats.success}/${sourceStats.total} 成功`
).join('\n')}
`;

    try {
      fs.writeFileSync('collection_log.txt', finalStats);
    } catch (error) {
      // 忽略文件写入错误
    }

    if (stats.errors > 0) {
      process.exit(1); // 有错误时退出码为1
    }

  } catch (error) {
    log(`数据收集过程中发生错误: ${error.message}`, 'error');
    console.error(error.stack);
    process.exit(1);
  }
}

// 执行数据收集
if (require.main === module) {
  collectData().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { collectData }; 