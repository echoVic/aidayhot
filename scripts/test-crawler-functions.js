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
    const ArxivCrawler = require('../src/crawlers/arxivCrawler.js');
    const arxivCrawler = new ArxivCrawler();
    
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

  // 测试 RSS 爬虫
  try {
    console.log('📰 测试 RSS 爬虫...');
    const RSSCrawler = require('../src/crawlers/rssCrawler.js');
    const rssCrawler = new RSSCrawler();
    
    // 测试单个可靠的 RSS 源
    const testUrl = 'https://artificialintelligence-news.com/feed/';
    const rssResult = await rssCrawler.fetchRSSFeed(testUrl);
    
    if (rssResult.success) {
      console.log(`✅ RSS: 成功获取 ${rssResult.items.length} 篇文章`);
      testResults.rss.success = true;
      
      if (rssResult.items.length > 0) {
        console.log(`   示例: ${rssResult.items[0].title.substring(0, 60)}...`);
      }
    } else {
      throw new Error(rssResult.error);
    }
  } catch (error) {
    console.log(`❌ RSS: ${error.message}`);
    testResults.rss.error = error.message;
  }

  console.log();

  // 测试 GitHub 爬虫  
  try {
    console.log('🐙 测试 GitHub 爬虫...');
    const GitHubCrawler = require('../src/crawlers/githubCrawler.js');
    const githubCrawler = new GitHubCrawler();
    
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

  // 测试 Papers with Code 爬虫
  try {
    console.log('🔬 测试 Papers with Code 爬虫...');
    const PapersWithCodeCrawler = require('../src/crawlers/papersWithCodeCrawler.js');
    const pwcCrawler = new PapersWithCodeCrawler();
    
    const pwcResult = await pwcCrawler.searchPapers('machine learning', 3);
    
    if (pwcResult.success && pwcResult.papers) {
      console.log(`✅ Papers with Code: 成功获取 ${pwcResult.papers.length} 篇论文`);
      testResults['papers-with-code'].success = true;
      
      if (pwcResult.papers.length > 0) {
        console.log(`   示例: ${pwcResult.papers[0].title.substring(0, 60)}...`);
      }
    } else {
      throw new Error(pwcResult.error || '未找到论文');
    }
  } catch (error) {
    console.log(`❌ Papers with Code: ${error.message}`);
    testResults['papers-with-code'].error = error.message;
  }

  console.log();

  // 测试 Stack Overflow 爬虫
  try {
    console.log('💬 测试 Stack Overflow 爬虫...');
    const StackOverflowCrawler = require('../src/crawlers/stackOverflowCrawler.js');
    const soCrawler = new StackOverflowCrawler();
    
    const soResult = await soCrawler.searchQuestions('machine learning', 'votes', 3);
    
    if (soResult.success && soResult.questions) {
      console.log(`✅ Stack Overflow: 成功获取 ${soResult.questions.length} 个问题`);
      testResults.stackoverflow.success = true;
      
      if (soResult.questions.length > 0) {
        console.log(`   示例: ${soResult.questions[0].title.substring(0, 60)}...`);
      }
    } else {
      throw new Error(soResult.error || '未找到问题');
    }
  } catch (error) {
    console.log(`❌ Stack Overflow: ${error.message}`);
    testResults.stackoverflow.error = error.message;
  }

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