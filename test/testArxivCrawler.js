const ArxivCrawler = require('../src/crawlers/arxivCrawler');

async function testArxivCrawler() {
  const crawler = new ArxivCrawler();
  
  console.log('=== arXiv爬虫测试开始 ===\n');
  
  // 测试1: 测试API连接
  console.log('测试1: 测试API连接');
  console.log('-------------------');
  await crawler.testConnection();
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // 测试2: 测试AI相关论文获取
  console.log('测试2: 测试AI相关论文获取');
  console.log('-------------------');
  await crawler.testAIPapers();
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // 测试3: 测试关键词搜索
  console.log('测试3: 测试关键词搜索');
  console.log('-------------------');
  await crawler.testKeywordSearch('transformer');
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // 测试4: 测试作者搜索
  console.log('测试4: 测试作者搜索');
  console.log('-------------------');
  console.log('搜索作者: "Yann LeCun"');
  const authorResult = await crawler.getAuthorPapers('Yann LeCun', 5);
  
  if (authorResult.success) {
    console.log(`✅ 找到 ${authorResult.papers.length} 篇 Yann LeCun 的论文`);
    authorResult.papers.forEach((paper, index) => {
      console.log(`\n${index + 1}. ${paper.title}`);
      console.log(`   发布: ${paper.published.toDateString()}`);
      console.log(`   arXiv ID: ${paper.arxivId}`);
    });
  } else {
    console.log(`❌ 搜索失败: ${authorResult.error}`);
  }
  
  console.log('\n=== arXiv爬虫测试完成 ===');
}

// 如果直接运行此文件
if (require.main === module) {
  testArxivCrawler().catch(console.error);
}

module.exports = { testArxivCrawler }; 