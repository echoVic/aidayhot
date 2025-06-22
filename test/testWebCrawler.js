const WebCrawler = require('../src/crawlers/webCrawler');

/**
 * 网页爬虫测试
 */
async function testWebCrawler() {
  console.log('========================================');
  console.log('开始测试 网页爬虫系统');
  console.log('========================================\n');
  
  const crawler = new WebCrawler();
  
  try {
    // 测试1: 技术博客爬取
    console.log('1. 测试技术博客爬取...');
    console.log('----------------------------');
    
    const techBlogResults = await crawler.crawlTechBlogs();
    
    console.log('技术博客爬取结果:');
    Object.entries(techBlogResults).forEach(([siteName, result]) => {
      if (result.success) {
        console.log(`✅ ${siteName}: 成功获取 ${result.count} 篇文章`);
      } else {
        console.log(`❌ ${siteName}: 获取失败 - ${result.error}`);
      }
    });
    
    // 显示技术博客文章示例
    const successfulTechBlogs = Object.values(techBlogResults).filter(r => r.success && r.articles.length > 0);
    if (successfulTechBlogs.length > 0) {
      console.log('\n技术博客文章示例:');
      const exampleArticles = successfulTechBlogs[0].articles.slice(0, 3);
      exampleArticles.forEach((article, index) => {
        console.log(`${index + 1}. ${article.title}`);
        console.log(`   - URL: ${article.originalUrl}`);
        console.log(`   - 发布时间: ${article.publishedAt}`);
        console.log(`   - 网站: ${article.metadata.siteName}`);
        console.log(`   - 类别: ${article.metadata.category}`);
        console.log(`   - 字数: ${article.metadata.wordCount}`);
        console.log(`   - 是否模拟数据: ${article.metadata.isMockData || false}`);
        console.log(`   - 内容预览: ${article.content.substring(0, 100)}...`);
        console.log('');
      });
    }
    
    // 测试2: 新闻网站爬取
    console.log('\n2. 测试新闻网站爬取...');
    console.log('----------------------------');
    
    const newsResults = await crawler.crawlNewsWebsites();
    
    console.log('新闻网站爬取结果:');
    Object.entries(newsResults).forEach(([siteName, result]) => {
      if (result.success) {
        console.log(`✅ ${siteName}: 成功获取 ${result.count} 篇文章`);
      } else {
        console.log(`❌ ${siteName}: 获取失败 - ${result.error}`);
      }
    });
    
    // 显示新闻文章示例
    const successfulNews = Object.values(newsResults).filter(r => r.success && r.articles.length > 0);
    if (successfulNews.length > 0) {
      console.log('\n新闻文章示例:');
      const exampleArticles = successfulNews[0].articles.slice(0, 3);
      exampleArticles.forEach((article, index) => {
        console.log(`${index + 1}. ${article.title}`);
        console.log(`   - URL: ${article.originalUrl}`);
        console.log(`   - 发布时间: ${article.publishedAt}`);
        console.log(`   - 网站: ${article.metadata.siteName}`);
        console.log(`   - 类别: ${article.metadata.category}`);
        console.log(`   - 作者: ${article.metadata.author}`);
        console.log(`   - 标签: ${article.metadata.tags.join(', ')}`);
        console.log(`   - 是否模拟数据: ${article.metadata.isMockData || false}`);
        console.log(`   - 内容预览: ${article.content.substring(0, 100)}...`);
        console.log('');
      });
    }
    
    // 测试3: 学术网站爬取
    console.log('\n3. 测试学术网站爬取...');
    console.log('----------------------------');
    
    const academicResults = await crawler.crawlAcademicSites();
    
    console.log('学术网站爬取结果:');
    Object.entries(academicResults).forEach(([siteName, result]) => {
      if (result.success) {
        console.log(`✅ ${siteName}: 成功获取 ${result.count} 篇文章`);
      } else {
        console.log(`❌ ${siteName}: 获取失败 - ${result.error}`);
      }
    });
    
    // 显示学术文章示例
    const successfulAcademic = Object.values(academicResults).filter(r => r.success && r.articles.length > 0);
    if (successfulAcademic.length > 0) {
      console.log('\n学术文章示例:');
      const exampleArticles = successfulAcademic[0].articles.slice(0, 3);
      exampleArticles.forEach((article, index) => {
        console.log(`${index + 1}. ${article.title}`);
        console.log(`   - URL: ${article.originalUrl}`);
        console.log(`   - 发布时间: ${article.publishedAt}`);
        console.log(`   - 网站: ${article.metadata.siteName}`);
        console.log(`   - 类别: ${article.metadata.category}`);
        console.log(`   - 作者: ${article.metadata.author}`);
        console.log(`   - 标签: ${article.metadata.tags.join(', ')}`);
        console.log(`   - 是否模拟数据: ${article.metadata.isMockData || false}`);
        console.log(`   - 内容预览: ${article.content.substring(0, 100)}...`);
        console.log('');
      });
    }
    
    // 测试4: 综合网页数据获取
    console.log('\n4. 测试综合网页数据获取...');
    console.log('----------------------------');
    
    const allWebData = await crawler.getAllWebContent();
    
    console.log('网页数据综合统计:');
    console.log(`- 总文章数量: ${allWebData.summary.totalArticles}`);
    console.log(`- 技术博客数量: ${allWebData.summary.techBlogs}`);
    console.log(`- 技术博客文章数: ${allWebData.summary.techBlogArticles}`);
    console.log(`- 新闻网站数量: ${allWebData.summary.newsWebsites}`);
    console.log(`- 新闻文章数: ${allWebData.summary.newsArticles}`);
    console.log(`- 学术网站数量: ${allWebData.summary.academicSites}`);
    console.log(`- 学术文章数: ${allWebData.summary.academicArticles}`);
    
    console.log('\n技术博客获取结果:');
    Object.entries(allWebData.techBlogResults).forEach(([siteName, result]) => {
      if (result.success) {
        console.log(`- ${siteName}: ${result.count} 篇文章`);
      } else {
        console.log(`- ${siteName}: 获取失败`);
      }
    });
    
    console.log('\n新闻网站获取结果:');
    Object.entries(allWebData.newsResults).forEach(([siteName, result]) => {
      if (result.success) {
        console.log(`- ${siteName}: ${result.count} 篇文章`);
      } else {
        console.log(`- ${siteName}: 获取失败`);
      }
    });
    
    console.log('\n学术网站获取结果:');
    Object.entries(allWebData.academicResults).forEach(([siteName, result]) => {
      if (result.success) {
        console.log(`- ${siteName}: ${result.count} 篇文章`);
      } else {
        console.log(`- ${siteName}: 获取失败`);
      }
    });
    
    // 显示综合数据的分类统计
    if (allWebData.articles.length > 0) {
      console.log('\n文章类别分布:');
      
      const categoryStats = {};
      allWebData.articles.forEach(article => {
        const category = article.metadata.category;
        if (!categoryStats[category]) {
          categoryStats[category] = 0;
        }
        categoryStats[category]++;
      });
      
      Object.entries(categoryStats).forEach(([category, count]) => {
        console.log(`- ${category}: ${count} 篇文章`);
      });
      
      // 显示各类别的典型文章
      console.log('\n各类别典型文章示例:');
      
      // 技术博客文章
      const techBlogArticles = allWebData.articles.filter(a => a.metadata.category === 'tech_blog');
      if (techBlogArticles.length > 0) {
        console.log('\n技术博客内容示例:');
        techBlogArticles.slice(0, 2).forEach((article, index) => {
          console.log(`${index + 1}. ${article.title}`);
          console.log(`   - 网站: ${article.metadata.siteName}`);
          console.log(`   - 字数: ${article.metadata.wordCount}`);
          console.log(`   - URL: ${article.originalUrl}`);
        });
      }
      
      // 新闻文章
      const newsArticles = allWebData.articles.filter(a => a.metadata.category === 'news');
      if (newsArticles.length > 0) {
        console.log('\n新闻内容示例:');
        newsArticles.slice(0, 2).forEach((article, index) => {
          console.log(`${index + 1}. ${article.title}`);
          console.log(`   - 网站: ${article.metadata.siteName}`);
          console.log(`   - 作者: ${article.metadata.author}`);
          console.log(`   - URL: ${article.originalUrl}`);
        });
      }
      
      // 学术文章
      const academicArticles = allWebData.articles.filter(a => a.metadata.category === 'academic');
      if (academicArticles.length > 0) {
        console.log('\n学术内容示例:');
        academicArticles.slice(0, 2).forEach((article, index) => {
          console.log(`${index + 1}. ${article.title}`);
          console.log(`   - 网站: ${article.metadata.siteName}`);
          console.log(`   - 标签: ${article.metadata.tags.join(', ')}`);
          console.log(`   - URL: ${article.originalUrl}`);
        });
      }
      
      // 显示最近发布的文章
      console.log('\n最近发布的文章:');
      const sortedArticles = allWebData.articles
        .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
        .slice(0, 5);
      
      sortedArticles.forEach((article, index) => {
        console.log(`${index + 1}. ${article.title}`);
        console.log(`   - 发布时间: ${article.publishedAt}`);
        console.log(`   - 类别: ${article.metadata.category}`);
        console.log(`   - 网站: ${article.metadata.siteName}`);
      });
    }
    
    console.log('\n========================================');
    console.log('网页爬虫测试完成！');
    console.log('========================================');
    
    // 返回测试结果摘要
    return {
      success: true,
      techBlogTest: {
        sitesCount: Object.keys(techBlogResults).length,
        successfulSites: Object.values(techBlogResults).filter(r => r.success).length,
        totalArticles: Object.values(techBlogResults).reduce((sum, r) => sum + r.count, 0)
      },
      newsTest: {
        sitesCount: Object.keys(newsResults).length,
        successfulSites: Object.values(newsResults).filter(r => r.success).length,
        totalArticles: Object.values(newsResults).reduce((sum, r) => sum + r.count, 0)
      },
      academicTest: {
        sitesCount: Object.keys(academicResults).length,
        successfulSites: Object.values(academicResults).filter(r => r.success).length,
        totalArticles: Object.values(academicResults).reduce((sum, r) => sum + r.count, 0)
      },
      comprehensiveTest: {
        totalArticles: allWebData.summary.totalArticles,
        techBlogSites: allWebData.summary.techBlogs,
        newsSites: allWebData.summary.newsWebsites,
        academicSites: allWebData.summary.academicSites
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
  testWebCrawler()
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

module.exports = testWebCrawler; 