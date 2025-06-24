const fs = require('fs');

// 🎯 配置信息 - 与主脚本保持一致
const SOURCE_CONFIGS = {
  'arxiv': { 
    maxResults: 18,
    timeout: 10,
    priority: 'high',
    status: 'working',
    description: '📚 学术论文 - 高质量研究内容'
  },
  'github': { 
    maxResults: 12,
    timeout: 10,
    priority: 'high',
    status: 'working',
    description: '🐙 开源项目 - 热门AI/ML项目'
  },
  'rss': { 
    maxResults: 25,
    timeout: 12,
    priority: 'high',
    status: 'partial',
    description: '📰 技术博客 - 丰富的技术观点和趋势'
  },
  'papers-with-code': { 
    maxResults: 5,
    timeout: 8,
    priority: 'low',
    status: 'unstable',
    description: '🔬 ML论文+代码 - 实用研究 (备用)'
  },
  'stackoverflow': { 
    maxResults: 5,
    timeout: 6,
    priority: 'low',
    status: 'unstable',
    description: '💬 技术问答 - 精选高质量问题 (备用)'
  }
};

// 日志函数
function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️';
  const logMessage = `${timestamp} ${prefix} ${message}`;
  console.log(logMessage);
}

async function testDataCollectionLogic() {
  log('🧪 测试数据收集逻辑（不包含数据库操作）');
  
  const stats = {
    total: 0,
    success: 0,
    errors: 0,
    sources: {}
  };

  // 只测试已转换为TS的源
  const stableSources = ['arxiv', 'github'];
  // 暂时移除RSS等源，因为JS版本已删除
  
  const targetSources = stableSources;
  
  log(`目标测试源: ${targetSources.join(', ')}`);
  log('使用智能源配置:', 'info');
  targetSources.forEach(source => {
    const config = SOURCE_CONFIGS[source];
    if (config) {
      log(`  ${source}: ${config.maxResults}篇 - ${config.description}`, 'info');
    }
  });

  // 并发测试所有源
  const testPromises = targetSources.map(async (source) => {
    const sourceStats = { total: 0, success: 0, errors: 0, data: [] };
    stats.sources[source] = sourceStats;
    
    try {
      log(`开始测试 ${source}`, 'info');
      
             // 导入对应的TS爬虫
       let CrawlerClass;
                switch (source) {
           case 'arxiv':
             const ArxivCrawlerModule = require('../dist/crawlers/ArxivCrawler.js');
             CrawlerClass = ArxivCrawlerModule.ArxivCrawler;
             break;
           case 'github':
             const GitHubCrawlerModule = require('../dist/crawlers/GitHubCrawler.js');
             CrawlerClass = GitHubCrawlerModule.GitHubCrawler;
             break;
           default:
             throw new Error(`未支持的爬虫源: ${source}`);
         }

      const crawler = new CrawlerClass();
      const config = SOURCE_CONFIGS[source];
      const maxResults = Math.min(config.maxResults, 5); // 测试时限制数量
      let results = [];

      // 根据不同源调用对应的方法
      switch (source) {
        case 'arxiv':
          const arxivResults = await crawler.fetchLatestAIPapers(maxResults);
          for (const [category, result] of Object.entries(arxivResults)) {
            if (result.success && result.papers) {
              results.push(...result.papers.slice(0, Math.ceil(maxResults / 5)).map(paper => ({
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

        case 'github':
          const githubResult = await crawler.searchRepositories('machine learning', 'stars', 'desc', maxResults);
          if (githubResult.success && githubResult.repositories) {
            results = githubResult.repositories.map(repo => ({
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

      sourceStats.total = results.length;
      sourceStats.success = results.length;
      sourceStats.data = results.slice(0, 2); // 保存前2个示例
      
      stats.total += sourceStats.total;
      stats.success += sourceStats.success;
      
      log(`${source} 测试完成: 获取 ${sourceStats.total} 条数据`, 'success');
      
      // 显示示例数据
      if (results.length > 0) {
        log(`${source} 示例数据:`, 'info');
        results.slice(0, 2).forEach((item, index) => {
          log(`  ${index + 1}. ${item.title.substring(0, 60)}...`, 'info');
          log(`     作者: ${item.author}`, 'info');
          log(`     分类: ${item.category}`, 'info');
        });
      }

    } catch (error) {
      sourceStats.errors++;
      stats.errors++;
      log(`${source} 测试失败: ${error.message}`, 'error');
    }
  });

  await Promise.allSettled(testPromises);

  // 输出最终统计
  log('', 'info');
  log('🎯 测试结果汇总', 'info');
  log('=' * 50, 'info');
  log(`总数据量: ${stats.total}`, 'info');
  log(`成功获取: ${stats.success}`, 'info');
  log(`失败数: ${stats.errors}`, 'info');
  log('', 'info');
  
  // 按源统计
  log('📊 各源测试结果:', 'info');
  for (const [source, sourceStats] of Object.entries(stats.sources)) {
    const config = SOURCE_CONFIGS[source];
    const status = config.status === 'working' ? '✅' : config.status === 'partial' ? '⚠️' : '❌';
    log(`${status} ${source}: ${sourceStats.success}/${sourceStats.total} 成功 (配置:${config.maxResults}) - ${config.status}`, 'info');
  }

  // 显示配置预期
  log('', 'info');
  log('📈 生产环境每日预期收集量 (早晚各一次):', 'info');
  Object.entries(SOURCE_CONFIGS).forEach(([source, config]) => {
    const status = config.status === 'working' ? '✅' : config.status === 'partial' ? '⚠️' : '❌';
    log(`${status} ${source}: ${config.maxResults} × 2 = ${config.maxResults * 2}篇/天 (${config.status})`, 'info');
  });

  const reliableTotal = Object.values(SOURCE_CONFIGS)
    .filter(config => config.status === 'working' || config.status === 'partial')
    .reduce((sum, config) => sum + config.maxResults * 2, 0);
  
  log(`🎯 可靠源总预期: ${reliableTotal}篇/天`, 'info');

  if (stats.success > 0) {
    log('', 'info');
    log('🎉 数据收集逻辑测试通过！可以部署到 GitHub Actions', 'success');
    log('📝 建议：在 GitHub Secrets 中配置正确的 SUPABASE_URL 和相关密钥', 'info');
  } else {
    log('', 'info');
    log('⚠️  没有成功获取任何数据，请检查网络连接和爬虫配置', 'error');
  }

  return stats;
}

// 如果直接运行此脚本
if (require.main === module) {
  testDataCollectionLogic().catch(error => {
    console.error('测试过程中发生错误:', error);
    process.exit(1);
  });
}

module.exports = { testDataCollectionLogic }; 