const PapersWithCodeCrawler = require('../src/crawlers/papersWithCodeCrawler');

/**
 * Papers with Code 爬虫测试
 */
async function testPapersWithCodeCrawler() {
  console.log('========================================');
  console.log('开始测试 Papers with Code 爬虫');
  console.log('========================================\n');
  
  const crawler = new PapersWithCodeCrawler();
  
  try {
    // 测试1: 搜索功能
    console.log('1. 测试搜索功能...');
    console.log('----------------------------');
    
    const searchResults = await crawler.searchPapers('transformer', 1, 5);
    
    console.log(`搜索结果统计:`);
    console.log(`- 查询关键词: ${searchResults.query}`);
    console.log(`- 找到论文数量: ${searchResults.totalFound}`);
    console.log(`- 当前页数: ${searchResults.pagination.currentPage}`);
    console.log(`- 是否有下一页: ${searchResults.pagination.hasNextPage}`);
    
    if (searchResults.papers.length > 0) {
      console.log('\n前3篇论文:');
      searchResults.papers.slice(0, 3).forEach((paper, index) => {
        console.log(`${index + 1}. ${paper.title}`);
        console.log(`   - URL: ${paper.originalUrl}`);
        console.log(`   - 发布时间: ${paper.publishedAt}`);
        console.log(`   - 有代码: ${paper.metadata.hasCode}`);
        console.log(`   - 代码实现数量: ${paper.metadata.totalCodeImplementations}`);
        console.log(`   - 摘要: ${paper.content.substring(0, 100)}...`);
        console.log('');
      });
    }
    
    // 测试2: 热门论文获取
    console.log('\n2. 测试热门论文获取...');
    console.log('----------------------------');
    
    const trendingResults = await crawler.getTrendingPapers('month', 5);
    
    console.log(`热门论文统计:`);
    console.log(`- 时间范围: ${trendingResults.timeframe}`);
    console.log(`- 找到论文数量: ${trendingResults.totalFound}`);
    
    if (trendingResults.papers.length > 0) {
      console.log('\n前3篇热门论文:');
      trendingResults.papers.slice(0, 3).forEach((paper, index) => {
        console.log(`${index + 1}. ${paper.title}`);
        console.log(`   - URL: ${paper.originalUrl}`);
        console.log(`   - 发布时间: ${paper.publishedAt}`);
        console.log(`   - 是否热门: ${paper.metadata.isTrending}`);
        console.log(`   - Stars: ${paper.metadata.stars}`);
        console.log(`   - 摘要: ${paper.content.substring(0, 100)}...`);
        console.log('');
      });
    }
    
    // 测试3: 批量搜索
    console.log('\n3. 测试批量搜索功能...');
    console.log('----------------------------');
    
    const batchResults = await crawler.batchSearch(['deep learning', 'llm'], 3);
    
    console.log('批量搜索结果统计:');
    Object.entries(batchResults).forEach(([query, result]) => {
      if (result.papers) {
        console.log(`- "${query}": ${result.papers.length} 篇论文`);
      } else {
        console.log(`- "${query}": 搜索失败 - ${result.error}`);
      }
    });
    
    // 测试4: 获取论文详情 (如果有搜索结果)
    if (searchResults.papers.length > 0) {
      console.log('\n4. 测试获取论文详情...');
      console.log('----------------------------');
      
      const firstPaper = searchResults.papers[0];
      console.log(`获取论文详情: ${firstPaper.title}`);
      console.log(`URL: ${firstPaper.originalUrl}`);
      
      try {
        const paperDetails = await crawler.getPaperDetails(firstPaper.originalUrl);
        
        console.log('论文详情:');
        console.log(`- 标题: ${paperDetails.title}`);
        console.log(`- 作者数量: ${paperDetails.metadata.authors.length}`);
        console.log(`- 发表会议/期刊: ${paperDetails.metadata.venue}`);
        console.log(`- 有arXiv链接: ${!!paperDetails.metadata.arxivLink}`);
        console.log(`- 有PDF链接: ${!!paperDetails.metadata.pdfLink}`);
        console.log(`- 代码实现数量: ${paperDetails.metadata.totalImplementations}`);
        console.log(`- 任务数量: ${paperDetails.metadata.tasks.length}`);
        console.log(`- 数据集数量: ${paperDetails.metadata.datasets.length}`);
        console.log(`- 评估结果数量: ${paperDetails.metadata.evaluationResults.length}`);
        
        if (paperDetails.metadata.authors.length > 0) {
          console.log(`- 作者: ${paperDetails.metadata.authors.slice(0, 3).join(', ')}${paperDetails.metadata.authors.length > 3 ? '...' : ''}`);
        }
        
        if (paperDetails.metadata.implementations.length > 0) {
          console.log('- 代码实现:');
          paperDetails.metadata.implementations.slice(0, 2).forEach((impl, index) => {
            console.log(`  ${index + 1}. ${impl.framework} - ${impl.stars} stars`);
            console.log(`     ${impl.repositoryUrl}`);
          });
        }
        
      } catch (detailError) {
        console.log(`获取论文详情失败: ${detailError.message}`);
      }
    }
    
    // 测试5: 综合测试 - 获取AI相关论文
    console.log('\n5. 测试综合AI论文获取功能...');
    console.log('----------------------------');
    
    const aiPapersResults = await crawler.getAIPapers();
    
    console.log('AI论文综合统计:');
    console.log(`- 总论文数量: ${aiPapersResults.summary.totalPapers}`);
    console.log(`- 有代码实现的论文: ${aiPapersResults.summary.withCode}`);
    console.log(`- 热门论文数量: ${aiPapersResults.summary.trending}`);
    console.log(`- 搜索关键词: ${aiPapersResults.summary.searchKeywords.join(', ')}`);
    
    console.log('\n各关键词搜索结果:');
    Object.entries(aiPapersResults.searchResults).forEach(([keyword, result]) => {
      if (result.papers) {
        console.log(`- "${keyword}": ${result.papers.length} 篇论文`);
      } else {
        console.log(`- "${keyword}": 搜索失败`);
      }
    });
    
    // 显示一些典型论文
    if (aiPapersResults.papers.length > 0) {
      console.log('\n典型论文示例:');
      
      // 显示有代码的论文
      const papersWithCode = aiPapersResults.papers.filter(p => p.metadata.hasCode || p.metadata.hasImplementations);
      if (papersWithCode.length > 0) {
        console.log('\n有代码实现的论文:');
        papersWithCode.slice(0, 3).forEach((paper, index) => {
          console.log(`${index + 1}. ${paper.title}`);
          console.log(`   - 代码实现: ${paper.metadata.totalCodeImplementations || paper.metadata.totalImplementations || 0}`);
          console.log(`   - URL: ${paper.originalUrl}`);
        });
      }
      
      // 显示热门论文
      const trendingPapers = aiPapersResults.papers.filter(p => p.metadata.isTrending);
      if (trendingPapers.length > 0) {
        console.log('\n热门论文:');
        trendingPapers.slice(0, 3).forEach((paper, index) => {
          console.log(`${index + 1}. ${paper.title}`);
          console.log(`   - Stars: ${paper.metadata.stars}`);
          console.log(`   - URL: ${paper.originalUrl}`);
        });
      }
    }
    
    console.log('\n========================================');
    console.log('Papers with Code 爬虫测试完成！');
    console.log('========================================');
    
    // 返回测试结果摘要
    return {
      success: true,
      searchTest: {
        query: searchResults.query,
        found: searchResults.totalFound,
        hasResults: searchResults.papers.length > 0
      },
      trendingTest: {
        timeframe: trendingResults.timeframe,
        found: trendingResults.totalFound,
        hasResults: trendingResults.papers.length > 0
      },
      batchTest: {
        queries: Object.keys(batchResults),
        totalResults: Object.values(batchResults).reduce((sum, result) => {
          return sum + (result.papers ? result.papers.length : 0);
        }, 0)
      },
      comprehensiveTest: {
        totalPapers: aiPapersResults.summary.totalPapers,
        withCode: aiPapersResults.summary.withCode,
        trending: aiPapersResults.summary.trending,
        searchKeywords: aiPapersResults.summary.searchKeywords.length
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
  testPapersWithCodeCrawler()
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

module.exports = testPapersWithCodeCrawler; 