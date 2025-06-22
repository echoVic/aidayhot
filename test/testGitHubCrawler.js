const GitHubCrawler = require('../src/crawlers/githubCrawler');

async function testGitHubCrawler() {
  // 注意：这里没有使用GitHub token，所以会有API限制
  // 如果有GitHub Personal Access Token，可以传入：new GitHubCrawler('your_token_here')
  const crawler = new GitHubCrawler();
  
  console.log('=== GitHub爬虫测试开始 ===\n');
  
  // 测试1: 测试API连接和限制检查
  console.log('测试1: 测试API连接');
  console.log('-------------------');
  const connectionResult = await crawler.testConnection();
  
  if (!connectionResult.success) {
    console.log('⚠️  GitHub API连接失败，可能需要配置Personal Access Token');
    console.log('请在 https://github.com/settings/tokens 创建token');
    return;
  }
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // 测试2: 测试仓库搜索
  console.log('测试2: 测试仓库搜索');
  console.log('-------------------');
  await crawler.testRepositorySearch();
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // 测试3: 测试组织仓库获取
  console.log('测试3: 测试组织仓库获取');
  console.log('-------------------');
  await crawler.testOrganizationRepos('openai');
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // 测试4: 测试用户仓库获取
  console.log('测试4: 测试用户仓库获取');
  console.log('-------------------');
  console.log('获取用户仓库: "karpathy"');
  const userResult = await crawler.getUserRepositories('karpathy', 5);
  
  if (userResult.success) {
    console.log(`✅ 成功获取 ${userResult.repositories.length} 个 karpathy 的仓库`);
    userResult.repositories.forEach((repo, index) => {
      console.log(`\n${index + 1}. ${repo.fullName}`);
      console.log(`   Stars: ${repo.stars} | Forks: ${repo.forks}`);
      console.log(`   语言: ${repo.language || '未知'}`);
      console.log(`   描述: ${repo.content.substring(0, 80)}...`);
      console.log(`   更新: ${repo.updatedAt.toDateString()}`);
    });
  } else {
    console.log(`❌ 获取失败: ${userResult.error}`);
  }
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // 测试5: 测试仓库详情获取
  console.log('测试5: 测试仓库详情获取');
  console.log('-------------------');
  console.log('获取仓库详情: transformers');
  
  try {
    const detailsResult = await crawler.getRepositoryDetails('huggingface', 'transformers');
    
    console.log(`✅ 成功获取仓库详情: ${detailsResult.fullName}`);
    console.log(`   Stars: ${detailsResult.stars} | Forks: ${detailsResult.forks}`);
    console.log(`   语言: ${detailsResult.language}`);
    console.log(`   主题: ${detailsResult.topics.join(', ')}`);
    console.log(`   许可证: ${detailsResult.license}`);
    console.log(`   描述: ${detailsResult.content}`);
    
    if (detailsResult.latestRelease) {
      console.log(`   最新版本: ${detailsResult.latestRelease.tagName}`);
      console.log(`   发布时间: ${detailsResult.latestRelease.publishedAt.toDateString()}`);
    }
    
    if (detailsResult.latestCommits.length > 0) {
      console.log(`   最新提交: ${detailsResult.latestCommits[0].message.substring(0, 50)}...`);
    }
    
    if (detailsResult.readmeContent) {
      console.log(`   README长度: ${detailsResult.readmeContent.length} 字符`);
    }
  } catch (error) {
    console.log(`❌ 获取仓库详情失败: ${error.message}`);
  }
  
  console.log('\n=== GitHub爬虫测试完成 ===');
  
  // 显示API使用情况
  try {
    const finalRateLimit = await crawler.checkRateLimit();
    console.log('\n=== API使用情况 ===');
    console.log(`核心API剩余: ${finalRateLimit.resources.core.remaining}/${finalRateLimit.resources.core.limit}`);
    console.log(`搜索API剩余: ${finalRateLimit.resources.search.remaining}/${finalRateLimit.resources.search.limit}`);
    console.log(`重置时间: ${new Date(finalRateLimit.resources.core.reset * 1000).toLocaleString()}`);
  } catch (error) {
    console.log('无法获取API使用情况');
  }
}

// 如果直接运行此文件
if (require.main === module) {
  testGitHubCrawler().catch(console.error);
}

module.exports = { testGitHubCrawler }; 