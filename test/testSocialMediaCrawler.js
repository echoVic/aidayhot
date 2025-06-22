const SocialMediaCrawler = require('../src/crawlers/socialMediaCrawler');

/**
 * 社交媒体爬虫测试
 */
async function testSocialMediaCrawler() {
  console.log('========================================');
  console.log('开始测试 社交媒体爬虫系统');
  console.log('========================================\n');
  
  const crawler = new SocialMediaCrawler();
  
  try {
    // 测试1: Twitter用户时间线获取
    console.log('1. 测试Twitter用户时间线获取...');
    console.log('----------------------------');
    
    const twitterTimeline = await crawler.getTwitterUserTimeline('OpenAI', 5);
    
    console.log(`Twitter时间线结果:`);
    console.log(`- 用户: @OpenAI`);
    console.log(`- 获取推文数量: ${twitterTimeline.length}`);
    
    if (twitterTimeline.length > 0) {
      console.log('\n前3条推文:');
      twitterTimeline.slice(0, 3).forEach((tweet, index) => {
        console.log(`${index + 1}. ${tweet.content.substring(0, 80)}...`);
        console.log(`   - URL: ${tweet.originalUrl}`);
        console.log(`   - 发布时间: ${tweet.publishedAt}`);
        console.log(`   - 点赞数: ${tweet.metadata.likes}`);
        console.log(`   - 转发数: ${tweet.metadata.retweets}`);
        console.log(`   - 话题标签: ${tweet.metadata.hashtags.join(', ')}`);
        console.log(`   - 是否模拟数据: ${tweet.metadata.isMockData || false}`);
        console.log('');
      });
    }
    
    // 测试2: Twitter AI搜索
    console.log('\n2. 测试Twitter AI搜索功能...');
    console.log('----------------------------');
    
    const searchResults = await crawler.searchTwitterAI('machine learning', 5);
    
    console.log(`搜索结果统计:`);
    console.log(`- 搜索关键词: machine learning`);
    console.log(`- 找到推文数量: ${searchResults.length}`);
    
    if (searchResults.length > 0) {
      console.log('\n前3条搜索结果:');
      searchResults.slice(0, 3).forEach((tweet, index) => {
        console.log(`${index + 1}. ${tweet.content.substring(0, 80)}...`);
        console.log(`   - 作者: @${tweet.metadata.username}`);
        console.log(`   - URL: ${tweet.originalUrl}`);
        console.log(`   - 发布时间: ${tweet.publishedAt}`);
        console.log(`   - 点赞数: ${tweet.metadata.likes}`);
        console.log(`   - 搜索查询: ${tweet.metadata.searchQuery}`);
        console.log(`   - 是否模拟数据: ${tweet.metadata.isMockData || false}`);
        console.log('');
      });
    }
    
    // 测试3: 微博内容获取
    console.log('\n3. 测试微博内容获取...');
    console.log('----------------------------');
    
    const weiboContent = await crawler.getWeiboContent('李开复', 5);
    
    console.log(`微博内容结果:`);
    console.log(`- 用户: 李开复`);
    console.log(`- 获取微博数量: ${weiboContent.length}`);
    
    if (weiboContent.length > 0) {
      console.log('\n前3条微博:');
      weiboContent.slice(0, 3).forEach((post, index) => {
        console.log(`${index + 1}. ${post.content.substring(0, 80)}...`);
        console.log(`   - URL: ${post.originalUrl}`);
        console.log(`   - 发布时间: ${post.publishedAt}`);
        console.log(`   - 点赞数: ${post.metadata.likes}`);
        console.log(`   - 转发数: ${post.metadata.reposts}`);
        console.log(`   - 评论数: ${post.metadata.comments}`);
        console.log(`   - 话题标签: ${post.metadata.hashtags.join(', ')}`);
        console.log(`   - 是否模拟数据: ${post.metadata.isMockData || false}`);
        console.log('');
      });
    }
    
    // 测试4: 批量Twitter账号获取
    console.log('\n4. 测试批量Twitter账号获取...');
    console.log('----------------------------');
    
    const twitterBatchResults = await crawler.batchGetTwitterAccounts(['OpenAI', 'DeepMind'], 3);
    
    console.log('批量Twitter账号结果:');
    Object.entries(twitterBatchResults).forEach(([username, result]) => {
      if (result.success) {
        console.log(`- @${username}: 成功获取 ${result.count} 条推文`);
      } else {
        console.log(`- @${username}: 获取失败 - ${result.error}`);
      }
    });
    
    // 测试5: 批量微博账号获取
    console.log('\n5. 测试批量微博账号获取...');
    console.log('----------------------------');
    
    const weiboBatchResults = await crawler.batchGetWeiboAccounts(['李开复', '微软亚洲研究院'], 3);
    
    console.log('批量微博账号结果:');
    Object.entries(weiboBatchResults).forEach(([username, result]) => {
      if (result.success) {
        console.log(`- ${username}: 成功获取 ${result.count} 条微博`);
      } else {
        console.log(`- ${username}: 获取失败 - ${result.error}`);
      }
    });
    
    // 测试6: 综合AI社交媒体数据获取
    console.log('\n6. 测试综合AI社交媒体数据获取...');
    console.log('----------------------------');
    
    const aiSocialMediaData = await crawler.getAISocialMediaData();
    
    console.log('AI社交媒体综合统计:');
    console.log(`- 总内容数量: ${aiSocialMediaData.summary.totalPosts}`);
    console.log(`- Twitter账号数量: ${aiSocialMediaData.summary.twitterAccounts}`);
    console.log(`- Twitter账号推文数: ${aiSocialMediaData.summary.twitterAccountPosts}`);
    console.log(`- 搜索查询数量: ${aiSocialMediaData.summary.searchQueries}`);
    console.log(`- 搜索推文数: ${aiSocialMediaData.summary.searchPosts}`);
    console.log(`- 微博账号数量: ${aiSocialMediaData.summary.weiboAccounts}`);
    console.log(`- 微博内容数: ${aiSocialMediaData.summary.weiboPosts}`);
    
    console.log('\nTwitter账号获取结果:');
    Object.entries(aiSocialMediaData.twitterResults).forEach(([username, result]) => {
      if (result.success) {
        console.log(`- @${username}: ${result.count} 条推文`);
      } else {
        console.log(`- @${username}: 获取失败`);
      }
    });
    
    console.log('\nTwitter搜索结果:');
    Object.entries(aiSocialMediaData.searchResults).forEach(([query, tweets]) => {
      console.log(`- "${query}": ${tweets.length} 条推文`);
    });
    
    console.log('\n微博账号获取结果:');
    Object.entries(aiSocialMediaData.weiboResults).forEach(([username, result]) => {
      if (result.success) {
        console.log(`- ${username}: ${result.count} 条微博`);
      } else {
        console.log(`- ${username}: 获取失败`);
      }
    });
    
    // 显示一些典型内容
    if (aiSocialMediaData.posts.length > 0) {
      console.log('\n典型社交媒体内容示例:');
      
      // 显示Twitter内容
      const twitterPosts = aiSocialMediaData.posts.filter(p => p.metadata.platform === 'twitter');
      if (twitterPosts.length > 0) {
        console.log('\nTwitter内容示例:');
        twitterPosts.slice(0, 3).forEach((post, index) => {
          console.log(`${index + 1}. ${post.content.substring(0, 100)}...`);
          console.log(`   - 作者: @${post.metadata.username}`);
          console.log(`   - 互动: ${post.metadata.likes}❤️ ${post.metadata.retweets}🔄 ${post.metadata.replies}💬`);
          console.log(`   - 话题: ${post.metadata.hashtags.join(' ')}`);
        });
      }
      
      // 显示微博内容
      const weiboPosts = aiSocialMediaData.posts.filter(p => p.metadata.platform === 'weibo');
      if (weiboPosts.length > 0) {
        console.log('\n微博内容示例:');
        weiboPosts.slice(0, 3).forEach((post, index) => {
          console.log(`${index + 1}. ${post.content.substring(0, 100)}...`);
          console.log(`   - 作者: ${post.metadata.username}`);
          console.log(`   - 互动: ${post.metadata.likes}❤️ ${post.metadata.reposts}🔄 ${post.metadata.comments}💬`);
          console.log(`   - 话题: ${post.metadata.hashtags.join(' ')}`);
        });
      }
      
      // 显示带搜索查询的内容
      const searchPosts = aiSocialMediaData.posts.filter(p => p.metadata.searchQuery);
      if (searchPosts.length > 0) {
        console.log('\n搜索发现的内容示例:');
        searchPosts.slice(0, 2).forEach((post, index) => {
          console.log(`${index + 1}. 搜索"${post.metadata.searchQuery}"`);
          console.log(`   ${post.content.substring(0, 100)}...`);
          console.log(`   - 作者: @${post.metadata.username}`);
        });
      }
    }
    
    console.log('\n========================================');
    console.log('社交媒体爬虫测试完成！');
    console.log('========================================');
    
    // 返回测试结果摘要
    return {
      success: true,
      twitterTimelineTest: {
        user: 'OpenAI',
        found: twitterTimeline.length,
        hasResults: twitterTimeline.length > 0
      },
      twitterSearchTest: {
        query: 'machine learning',
        found: searchResults.length,
        hasResults: searchResults.length > 0
      },
      weiboTest: {
        user: '李开复',
        found: weiboContent.length,
        hasResults: weiboContent.length > 0
      },
      batchTwitterTest: {
        accounts: Object.keys(twitterBatchResults),
        successfulAccounts: Object.values(twitterBatchResults).filter(r => r.success).length,
        totalTweets: Object.values(twitterBatchResults).reduce((sum, r) => sum + r.count, 0)
      },
      batchWeiboTest: {
        accounts: Object.keys(weiboBatchResults),
        successfulAccounts: Object.values(weiboBatchResults).filter(r => r.success).length,
        totalPosts: Object.values(weiboBatchResults).reduce((sum, r) => sum + r.count, 0)
      },
      comprehensiveTest: {
        totalPosts: aiSocialMediaData.summary.totalPosts,
        twitterAccounts: aiSocialMediaData.summary.twitterAccounts,
        searchQueries: aiSocialMediaData.summary.searchQueries,
        weiboAccounts: aiSocialMediaData.summary.weiboAccounts
      }
    };
    
  } catch (error) {
    console.error('测试过程中发生错误:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// 如果直接运行此文件，则执行测试
if (require.main === module) {
  testSocialMediaCrawler()
    .then(result => {
      if (result.success) {
        console.log('\n✅ 所有测试通过！');
        process.exit(0);
      } else {
        console.log('\n❌ 测试失败！');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('测试执行失败:', error);
      process.exit(1);
    });
}

module.exports = testSocialMediaCrawler; 