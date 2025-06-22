const { testRSSCrawler } = require('./testRSSCrawler');
const { testArxivCrawler } = require('./testArxivCrawler');
const { testGitHubCrawler } = require('./testGitHubCrawler');
const { testStackOverflowCrawler } = require('./testStackOverflowCrawler');
const testPapersWithCodeCrawler = require('./testPapersWithCodeCrawler');
const testSocialMediaCrawler = require('./testSocialMediaCrawler');
const testWebCrawler = require('./testWebCrawler');
const testVideoCrawler = require('./testVideoCrawler');

async function runAllCrawlerTests() {
  console.log('🚀 开始运行所有爬虫系统测试...\n');
  
  const startTime = Date.now();
  
  try {
    // 测试1: RSS爬虫
    console.log('📡 测试RSS爬虫系统');
    console.log('='.repeat(60));
    await testRSSCrawler();
    console.log('\n✅ RSS爬虫测试完成\n');
    
    // 测试2: arXiv爬虫
    console.log('📚 测试arXiv学术论文爬虫系统');
    console.log('='.repeat(60));
    await testArxivCrawler();
    console.log('\n✅ arXiv爬虫测试完成\n');
    
    // 测试3: GitHub爬虫
    console.log('💻 测试GitHub代码仓库爬虫系统');
    console.log('='.repeat(60));
    await testGitHubCrawler();
    console.log('\n✅ GitHub爬虫测试完成\n');
    
    // 测试4: Stack Overflow爬虫
    console.log('❓ 测试Stack Overflow问答爬虫系统');
    console.log('='.repeat(60));
    await testStackOverflowCrawler();
    console.log('\n✅ Stack Overflow爬虫测试完成\n');
    
    // 测试5: Papers with Code爬虫
    console.log('📄 测试Papers with Code学术论文爬虫系统');
    console.log('='.repeat(60));
    await testPapersWithCodeCrawler();
    console.log('\n✅ Papers with Code爬虫测试完成\n');
    
    // 测试6: 社交媒体爬虫
    console.log('🐦 测试社交媒体爬虫系统 (Twitter/微博)');
    console.log('='.repeat(60));
    await testSocialMediaCrawler();
    console.log('\n✅ 社交媒体爬虫测试完成\n');
    
    // 测试7: 网页爬虫
    console.log('🌐 测试网页爬虫系统 (技术博客/新闻/学术网站)');
    console.log('='.repeat(60));
    await testWebCrawler();
    console.log('\n✅ 网页爬虫测试完成\n');
    
    // 测试8: 视频平台爬虫
    console.log('📺 测试视频平台爬虫系统 (YouTube/B站)');
    console.log('='.repeat(60));
    await testVideoCrawler();
    console.log('\n✅ 视频平台爬虫测试完成\n');
    
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;
    
    console.log('🎉 所有爬虫系统测试完成！');
    console.log('='.repeat(60));
    console.log(`总耗时: ${duration.toFixed(2)} 秒`);
    console.log('\n📊 已实现的爬虫系统:');
    console.log('✅ 1. RSS订阅爬虫 - 支持技术博客和新闻媒体RSS源');
    console.log('✅ 2. arXiv学术爬虫 - 支持AI/ML相关论文获取');
    console.log('✅ 3. GitHub代码爬虫 - 支持开源项目和仓库信息');
    console.log('✅ 4. Stack Overflow问答爬虫 - 支持技术问答获取');
    console.log('✅ 5. Papers with Code爬虫 - 支持学术论文及代码实现获取');
    console.log('✅ 6. 社交媒体爬虫 - 支持Twitter/X和微博内容获取');
    console.log('✅ 7. 网页爬虫 - 支持技术博客、新闻网站、学术网站内容获取');
    console.log('✅ 8. 视频平台爬虫 - 支持YouTube、B站等视频平台内容获取');
    
    console.log('\n🎉 所有爬虫系统已完成实现！');
    
    console.log('\n💡 系统特点:');
    console.log('- 支持多种数据格式: RSS/XML、JSON、HTML');
    console.log('- 具备错误处理和重试机制');
    console.log('- 遵循API限制和延迟策略');
    console.log('- 提供详细的测试和验证');
    console.log('- 生成统一的数据结构');
    
  } catch (error) {
    console.error('❌ 测试过程中出现错误:', error);
    process.exit(1);
  }
}

// 如果直接运行此文件
if (require.main === module) {
  runAllCrawlerTests().catch(console.error);
}

module.exports = { runAllCrawlerTests }; 