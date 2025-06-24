const fs = require('fs');

// 测试各个爬虫模块的函数调用
async function testCrawlerFunctions() {
  console.log('🧪 测试爬虫函数调用...\n');

  const testResults = {
    arxiv: { success: false, error: null },
    github: { success: false, error: null },
    'papers-with-code': { success: false, error: null },
    stackoverflow: { success: false, error: null },
    rss: { success: false, error: null }
  };

  // 测试 ArXiv 爬虫
  try {
    console.log('📚 测试 ArXiv 爬虫...');
    const ArxivCrawlerModule = require('../dist/crawlers/ArxivCrawler.js');
    const arxivCrawler = new ArxivCrawlerModule.ArxivCrawler();
    
    // 测试获取少量数据
    const arxivResults = await arxivCrawler.fetchLatestAIPapers(2);
    
    let totalPapers = 0;
    for (const [category, result] of Object.entries(arxivResults)) {
      if (result.success && result.papers) {
        totalPapers += result.papers.length;
      }
    }
    
    console.log(`✅ ArXiv: 成功获取 ${totalPapers} 篇论文`);
    testResults.arxiv.success = true;
    
    if (totalPapers > 0) {
      const firstCategory = Object.keys(arxivResults)[0];
      const firstPaper = arxivResults[firstCategory].papers[0];
      console.log(`   示例: ${firstPaper.title.substring(0, 60)}...`);
    }
  } catch (error) {
    console.log(`❌ ArXiv: ${error.message}`);
    testResults.arxiv.error = error.message;
  }

  console.log();

  // RSS 爬虫已删除，跳过测试
  console.log('📰 RSS 爬虫 - 已删除 JS 版本，等待 TS 转换');
  testResults.rss.error = 'RSS 爬虫需要转换为 TS 版本';

  console.log();

  // 测试 GitHub 爬虫  
  try {
    console.log('🐙 测试 GitHub 爬虫...');
    const GitHubCrawlerModule = require('../dist/crawlers/GitHubCrawler.js');
    const githubCrawler = new GitHubCrawlerModule.GitHubCrawler();
    
    const githubResult = await githubCrawler.searchRepositories('machine learning', 'stars', 'desc', 3);
    
    if (githubResult.success && githubResult.repositories) {
      console.log(`✅ GitHub: 成功获取 ${githubResult.repositories.length} 个项目`);
      testResults.github.success = true;
      
      if (githubResult.repositories.length > 0) {
        console.log(`   示例: ${githubResult.repositories[0].fullName}`);
      }
    } else {
      throw new Error(githubResult.error || '未找到仓库');
    }
  } catch (error) {
    console.log(`❌ GitHub: ${error.message}`);
    testResults.github.error = error.message;
  }

  console.log();

  // Papers with Code 爬虫已删除，跳过测试
  console.log('🔬 Papers with Code 爬虫 - 已删除 JS 版本，等待 TS 转换');
  testResults['papers-with-code'].error = 'Papers with Code 爬虫需要转换为 TS 版本';

  console.log();

  // Stack Overflow 爬虫已删除，跳过测试
  console.log('💬 Stack Overflow 爬虫 - 已删除 JS 版本，等待 TS 转换');
  testResults.stackoverflow.error = 'Stack Overflow 爬虫需要转换为 TS 版本';

  console.log('\n🎯 测试总结:');
  console.log('=' * 50);
  
  let successCount = 0;
  const totalCount = Object.keys(testResults).length;
  
  for (const [source, result] of Object.entries(testResults)) {
    if (result.success) {
      successCount++;
      console.log(`✅ ${source}: 测试通过`);
    } else {
      console.log(`❌ ${source}: ${result.error}`);
    }
  }
  
  console.log(`\n总计: ${successCount}/${totalCount} 个爬虫测试通过`);
  
  if (successCount === totalCount) {
    console.log('\n🎉 所有爬虫函数调用正确！可以部署到 GitHub Actions');
  } else {
    console.log('\n⚠️  存在问题的爬虫需要修复后再部署');
  }

  return testResults;
}

// 如果直接运行此脚本
if (require.main === module) {
  testCrawlerFunctions().catch(error => {
    console.error('测试过程中发生错误:', error);
    process.exit(1);
  });
}

module.exports = { testCrawlerFunctions }; 