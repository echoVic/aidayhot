const VideoCrawler = require('../src/crawlers/videoCrawler');

/**
 * 视频平台爬虫测试
 */
async function testVideoCrawler() {
  console.log('========================================');
  console.log('开始测试 视频平台爬虫系统');
  console.log('========================================\n');
  
  const crawler = new VideoCrawler({ useMockData: true });
  
  try {
    // 测试1: YouTube视频搜索
    console.log('1. 测试YouTube视频搜索...');
    console.log('----------------------------');
    
    const testQuery = 'machine learning tutorial';
    const youtubeVideos = await crawler.searchYouTubeVideos(testQuery, 5);
    
    console.log(`YouTube搜索结果: "${testQuery}"`);
    console.log(`- 找到视频数量: ${youtubeVideos.length}`);
    
    if (youtubeVideos.length > 0) {
      console.log('\nYouTube视频示例:');
      youtubeVideos.slice(0, 3).forEach((video, index) => {
        console.log(`${index + 1}. ${video.title}`);
        console.log(`   - URL: ${video.originalUrl}`);
        console.log(`   - 频道: ${video.metadata.channelName}`);
        console.log(`   - 发布时间: ${video.publishedAt}`);
        console.log(`   - 播放量: ${video.metadata.viewCount.toLocaleString()}`);
        console.log(`   - 点赞数: ${video.metadata.likeCount.toLocaleString()}`);
        console.log(`   - 时长: ${Math.floor(video.metadata.duration / 60)}:${(video.metadata.duration % 60).toString().padStart(2, '0')}`);
        console.log(`   - 标签: ${video.metadata.tags.join(', ')}`);
        console.log(`   - 是否模拟数据: ${video.metadata.isMockData || false}`);
        console.log(`   - 描述预览: ${video.metadata.description.substring(0, 100)}...`);
        console.log('');
      });
    }
    
    // 测试2: B站视频搜索
    console.log('\n2. 测试B站视频搜索...');
    console.log('----------------------------');
    
    const testKeyword = '机器学习';
    const bilibiliVideos = await crawler.searchBilibiliVideos(testKeyword, 1);
    
    console.log(`B站搜索结果: "${testKeyword}"`);
    console.log(`- 找到视频数量: ${bilibiliVideos.length}`);
    
    if (bilibiliVideos.length > 0) {
      console.log('\nB站视频示例:');
      bilibiliVideos.slice(0, 3).forEach((video, index) => {
        console.log(`${index + 1}. ${video.title}`);
        console.log(`   - URL: ${video.originalUrl}`);
        console.log(`   - UP主: ${video.metadata.uploaderName}`);
        console.log(`   - 发布时间: ${video.publishedAt}`);
        console.log(`   - 播放量: ${video.metadata.playCount.toLocaleString()}`);
        console.log(`   - 点赞数: ${video.metadata.likeCount.toLocaleString()}`);
        console.log(`   - 弹幕数: ${video.metadata.danmakuCount.toLocaleString()}`);
        console.log(`   - 时长: ${Math.floor(video.metadata.duration / 60)}:${(video.metadata.duration % 60).toString().padStart(2, '0')}`);
        console.log(`   - 标签: ${video.metadata.tags.join(', ')}`);
        console.log(`   - 是否模拟数据: ${video.metadata.isMockData || false}`);
        console.log(`   - 描述预览: ${video.metadata.description.substring(0, 100)}...`);
        console.log('');
      });
    }
    
    // 测试3: 批量YouTube搜索
    console.log('\n3. 测试批量YouTube搜索...');
    console.log('----------------------------');
    
    const youtubeResults = await crawler.batchSearchYouTube();
    
    console.log('YouTube批量搜索结果:');
    Object.entries(youtubeResults).forEach(([query, result]) => {
      if (result.success) {
        console.log(`✅ "${query}": 成功获取 ${result.count} 个视频`);
      } else {
        console.log(`❌ "${query}": 获取失败 - ${result.error}`);
      }
    });
    
    // 显示YouTube搜索统计
    const totalYouTubeVideos = Object.values(youtubeResults).reduce((sum, r) => sum + r.count, 0);
    const successfulYouTubeQueries = Object.values(youtubeResults).filter(r => r.success).length;
    
    console.log(`\nYouTube搜索统计:`);
    console.log(`- 总查询数: ${Object.keys(youtubeResults).length}`);
    console.log(`- 成功查询数: ${successfulYouTubeQueries}`);
    console.log(`- 总视频数: ${totalYouTubeVideos}`);
    
    // 测试4: 批量B站搜索
    console.log('\n4. 测试批量B站搜索...');
    console.log('----------------------------');
    
    const bilibiliResults = await crawler.batchSearchBilibili();
    
    console.log('B站批量搜索结果:');
    Object.entries(bilibiliResults).forEach(([keyword, result]) => {
      if (result.success) {
        console.log(`✅ "${keyword}": 成功获取 ${result.count} 个视频`);
      } else {
        console.log(`❌ "${keyword}": 获取失败 - ${result.error}`);
      }
    });
    
    // 显示B站搜索统计
    const totalBilibiliVideos = Object.values(bilibiliResults).reduce((sum, r) => sum + r.count, 0);
    const successfulBilibiliKeywords = Object.values(bilibiliResults).filter(r => r.success).length;
    
    console.log(`\nB站搜索统计:`);
    console.log(`- 总关键词数: ${Object.keys(bilibiliResults).length}`);
    console.log(`- 成功关键词数: ${successfulBilibiliKeywords}`);
    console.log(`- 总视频数: ${totalBilibiliVideos}`);
    
    // 测试5: 综合视频数据获取
    console.log('\n5. 测试综合视频数据获取...');
    console.log('----------------------------');
    
    const allVideoData = await crawler.getAllVideoContent();
    
    console.log('视频数据综合统计:');
    console.log(`- 总视频数量: ${allVideoData.summary.totalVideos}`);
    console.log(`- YouTube查询数: ${allVideoData.summary.youtubeQueries}`);
    console.log(`- YouTube视频数: ${allVideoData.summary.youtubeVideos}`);
    console.log(`- B站关键词数: ${allVideoData.summary.bilibiliKeywords}`);
    console.log(`- B站视频数: ${allVideoData.summary.bilibiliVideos}`);
    
    console.log('\nYouTube搜索结果:');
    Object.entries(allVideoData.youtubeResults).forEach(([query, result]) => {
      if (result.success) {
        console.log(`- "${query}": ${result.count} 个视频`);
      } else {
        console.log(`- "${query}": 获取失败`);
      }
    });
    
    console.log('\nB站搜索结果:');
    Object.entries(allVideoData.bilibiliResults).forEach(([keyword, result]) => {
      if (result.success) {
        console.log(`- "${keyword}": ${result.count} 个视频`);
      } else {
        console.log(`- "${keyword}": 获取失败`);
      }
    });
    
    // 显示综合数据的平台分布
    if (allVideoData.videos.length > 0) {
      console.log('\n视频平台分布:');
      
      const platformStats = {};
      allVideoData.videos.forEach(video => {
        const platform = video.metadata.platform;
        if (!platformStats[platform]) {
          platformStats[platform] = 0;
        }
        platformStats[platform]++;
      });
      
      Object.entries(platformStats).forEach(([platform, count]) => {
        console.log(`- ${platform}: ${count} 个视频`);
      });
      
      // 显示各平台的典型视频
      console.log('\n各平台典型视频示例:');
      
      // YouTube视频
      const youtubeVideos = allVideoData.videos.filter(v => v.metadata.platform === 'YouTube');
      if (youtubeVideos.length > 0) {
        console.log('\nYouTube内容示例:');
        youtubeVideos.slice(0, 2).forEach((video, index) => {
          console.log(`${index + 1}. ${video.title}`);
          console.log(`   - 频道: ${video.metadata.channelName}`);
          console.log(`   - 播放量: ${video.metadata.viewCount.toLocaleString()}`);
          console.log(`   - 时长: ${Math.floor(video.metadata.duration / 60)}分钟`);
          console.log(`   - URL: ${video.originalUrl}`);
        });
      }
      
      // B站视频
      const bilibiliVideosFiltered = allVideoData.videos.filter(v => v.metadata.platform === 'Bilibili');
      if (bilibiliVideosFiltered.length > 0) {
        console.log('\nB站内容示例:');
        bilibiliVideosFiltered.slice(0, 2).forEach((video, index) => {
          console.log(`${index + 1}. ${video.title}`);
          console.log(`   - UP主: ${video.metadata.uploaderName}`);
          console.log(`   - 播放量: ${video.metadata.playCount.toLocaleString()}`);
          console.log(`   - 弹幕数: ${video.metadata.danmakuCount.toLocaleString()}`);
          console.log(`   - URL: ${video.originalUrl}`);
        });
      }
      
      // 显示最热门的视频
      console.log('\n最热门的视频:');
      const sortedByViews = allVideoData.videos
        .sort((a, b) => {
          const aViews = a.metadata.viewCount || a.metadata.playCount || 0;
          const bViews = b.metadata.viewCount || b.metadata.playCount || 0;
          return bViews - aViews;
        })
        .slice(0, 5);
      
      sortedByViews.forEach((video, index) => {
        const views = video.metadata.viewCount || video.metadata.playCount || 0;
        console.log(`${index + 1}. ${video.title}`);
        console.log(`   - 平台: ${video.metadata.platform}`);
        console.log(`   - 播放量: ${views.toLocaleString()}`);
        console.log(`   - 发布时间: ${video.publishedAt}`);
      });
      
      // 显示最新发布的视频
      console.log('\n最新发布的视频:');
      const sortedByDate = allVideoData.videos
        .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
        .slice(0, 5);
      
      sortedByDate.forEach((video, index) => {
        console.log(`${index + 1}. ${video.title}`);
        console.log(`   - 平台: ${video.metadata.platform}`);
        console.log(`   - 发布时间: ${video.publishedAt}`);
        console.log(`   - 创作者: ${video.metadata.channelName || video.metadata.uploaderName}`);
      });
    }
    
    console.log('\n========================================');
    console.log('视频平台爬虫测试完成！');
    console.log('========================================');
    
    // 返回测试结果摘要
    return {
      success: true,
      youtubeTest: {
        singleSearchSuccess: youtubeVideos.length > 0,
        singleSearchCount: youtubeVideos.length,
        batchQueries: Object.keys(youtubeResults).length,
        batchSuccessfulQueries: Object.values(youtubeResults).filter(r => r.success).length,
        batchTotalVideos: Object.values(youtubeResults).reduce((sum, r) => sum + r.count, 0)
      },
      bilibiliTest: {
        singleSearchSuccess: bilibiliVideos.length > 0,
        singleSearchCount: bilibiliVideos.length,
        batchKeywords: Object.keys(bilibiliResults).length,
        batchSuccessfulKeywords: Object.values(bilibiliResults).filter(r => r.success).length,
        batchTotalVideos: Object.values(bilibiliResults).reduce((sum, r) => sum + r.count, 0)
      },
      comprehensiveTest: {
        totalVideos: allVideoData.summary.totalVideos,
        youtubeQueries: allVideoData.summary.youtubeQueries,
        youtubeVideos: allVideoData.summary.youtubeVideos,
        bilibiliKeywords: allVideoData.summary.bilibiliKeywords,
        bilibiliVideos: allVideoData.summary.bilibiliVideos
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
  testVideoCrawler()
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

module.exports = testVideoCrawler; 