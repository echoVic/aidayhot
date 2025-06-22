const StackOverflowCrawler = require('../src/crawlers/stackOverflowCrawler');

async function testStackOverflowCrawler() {
  const crawler = new StackOverflowCrawler();
  
  console.log('=== Stack Overflow爬虫测试开始 ===\n');
  
  // 测试1: 测试API连接
  console.log('测试1: 测试API连接');
  console.log('-------------------');
  const connectionResult = await crawler.testConnection();
  
  if (!connectionResult.success) {
    console.log('⚠️  Stack Overflow API连接失败');
    return;
  }
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // 测试2: 测试问题获取
  console.log('测试2: 测试问题获取');
  console.log('-------------------');
  await crawler.testQuestionFetching();
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // 测试3: 测试搜索功能
  console.log('测试3: 测试搜索功能');
  console.log('-------------------');
  await crawler.testSearch('deep learning');
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // 测试4: 测试答案获取
  console.log('测试4: 测试答案获取');
  console.log('-------------------');
  await crawler.testAnswerFetching();
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // 测试5: 测试标签信息获取
  console.log('测试5: 测试标签信息获取');
  console.log('-------------------');
  console.log('获取标签信息: "tensorflow"');
  
  const tagResult = await crawler.getTagInfo('tensorflow');
  
  if (tagResult.success) {
    console.log(`✅ 成功获取标签信息: ${tagResult.name}`);
    console.log(`   问题数量: ${tagResult.count}`);
    console.log(`   简介: ${tagResult.excerpt || '无'}`);
    console.log(`   是否为必需标签: ${tagResult.isRequired ? '是' : '否'}`);
    if (tagResult.synonyms.length > 0) {
      console.log(`   同义词: ${tagResult.synonyms.join(', ')}`);
    }
  } else {
    console.log(`❌ 获取标签信息失败: ${tagResult.error}`);
  }
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // 测试6: 测试用户信息获取
  console.log('测试6: 测试用户信息获取');
  console.log('-------------------');
  console.log('获取用户信息（使用一个示例用户ID）');
  
  // 先从问题中获取一个用户ID
  const questionsForUser = await crawler.getQuestions('python', 1);
  
  if (questionsForUser.success && questionsForUser.questions.length > 0) {
    const sampleUserId = questionsForUser.questions[0].owner.userId;
    console.log(`测试用户ID: ${sampleUserId}`);
    
    const userResult = await crawler.getUserInfo(sampleUserId);
    
    if (userResult.success) {
      console.log(`✅ 成功获取用户信息: ${userResult.displayName}`);
      console.log(`   声望: ${userResult.reputation}`);
      console.log(`   问题数量: ${userResult.questionCount}`);
      console.log(`   答案数量: ${userResult.answerCount}`);
      console.log(`   加入时间: ${userResult.creationDate.toDateString()}`);
      console.log(`   最后访问: ${userResult.lastAccessDate.toDateString()}`);
      console.log(`   位置: ${userResult.location || '未知'}`);
    } else {
      console.log(`❌ 获取用户信息失败: ${userResult.error}`);
    }
  } else {
    console.log('❌ 无法获取示例用户进行测试');
  }
  
  console.log('\n=== Stack Overflow爬虫测试完成 ===');
  
  // 显示最终API配额状态
  try {
    const finalQuota = await crawler.checkQuota();
    console.log('\n=== API配额状态 ===');
    console.log(`配额剩余: ${finalQuota.quotaRemaining}/${finalQuota.quotaMax}`);
  } catch (error) {
    console.log('无法获取API配额信息');
  }
}

// 如果直接运行此文件
if (require.main === module) {
  testStackOverflowCrawler().catch(console.error);
}

module.exports = { testStackOverflowCrawler }; 