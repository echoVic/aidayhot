const RSSCrawler = require('../src/crawlers/rssCrawler');

async function testRSSCrawler() {
  const crawler = new RSSCrawler();
  
  console.log('=== RSS爬虫测试开始 ===\n');
  
  // 测试1: 测试单个RSS源
  console.log('测试1: 测试单个RSS源');
  console.log('-------------------');
  
  // 选择一个通常比较稳定的RSS源进行测试
  const testUrl = 'https://www.kdnuggets.com/feed';
  await crawler.testRSSFeed(testUrl);
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // 测试2: 测试所有预定义的AI RSS源
  console.log('测试2: 测试所有AI RSS源');
  console.log('-------------------');
  
  const results = await crawler.testAllAIRSSFeeds();
  
  // 显示部分示例数据
  console.log('\n=== 示例数据展示 ===');
  for (const [name, result] of Object.entries(results)) {
    if (result.success && result.items.length > 0) {
      console.log(`\n📰 来源: ${name}`);
      console.log(`   标题: ${result.items[0].title}`);
      console.log(`   作者: ${result.items[0].author || '未知'}`);
      console.log(`   发布时间: ${result.items[0].publishedAt}`);
      console.log(`   链接: ${result.items[0].originalUrl}`);
      console.log(`   内容预览: ${(result.items[0].content || '').substring(0, 100)}...`);
      break; // 只显示第一个成功的示例
    }
  }
  
  console.log('\n=== RSS爬虫测试完成 ===');
}

// 如果直接运行此文件
if (require.main === module) {
  testRSSCrawler().catch(console.error);
}

module.exports = { testRSSCrawler }; 