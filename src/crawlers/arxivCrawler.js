const axios = require('axios');
const xml2js = require('xml2js');
const crypto = require('crypto');

class ArxivCrawler {
  constructor() {
    this.baseURL = 'http://export.arxiv.org/api/query';
    this.parser = new xml2js.Parser({ explicitArray: false });
  }

  // 获取arXiv论文
  async fetchArxivPapers(query, start = 0, maxResults = 100, sortBy = 'submittedDate', sortOrder = 'descending') {
    try {
      console.log(`开始获取arXiv论文: ${query}, 数量: ${maxResults}`);
      
      const response = await axios.get(this.baseURL, {
        params: {
          search_query: query,
          start,
          max_results: maxResults,
          sortBy,
          sortOrder
        },
        timeout: 30000
      });

      // 解析XML响应
      const result = await this.parser.parseStringPromise(response.data);
      
      if (!result.feed) {
        throw new Error('Invalid arXiv API response');
      }

      // 提取论文信息
      let entries = result.feed.entry;
      if (!entries) {
        console.log('未找到论文');
        return {
          query,
          totalResults: 0,
          papers: [],
          crawledAt: new Date(),
          success: true
        };
      }

      // 确保entries是数组
      if (!Array.isArray(entries)) {
        entries = [entries];
      }

      const papers = entries.map(entry => {
        // 处理作者信息
        let authors = [];
        if (entry.author) {
          if (Array.isArray(entry.author)) {
            authors = entry.author.map(a => a.name || a);
          } else {
            authors = [entry.author.name || entry.author];
          }
        }

        // 处理分类信息
        let categories = [];
        if (entry.category) {
          if (Array.isArray(entry.category)) {
            categories = entry.category.map(c => c.$.term);
          } else {
            categories = [entry.category.$.term];
          }
        }

        // 处理链接
        let pdfLink = null;
        let absLink = entry.id;
        
        if (entry.link) {
          if (Array.isArray(entry.link)) {
            const pdfLinkObj = entry.link.find(l => l.$.title === 'pdf');
            if (pdfLinkObj) {
              pdfLink = pdfLinkObj.$.href;
            }
          }
        }

        const arxivId = this.extractArxivId(entry.id);
        const contentId = this.generateContentId(entry.id);

        return {
          contentId,
          sourceId: 'arxiv',
          arxivId,
          title: entry.title.replace(/\s+/g, ' ').trim(),
          summary: entry.summary.replace(/\s+/g, ' ').trim(),
          authors,
          published: new Date(entry.published),
          updated: new Date(entry.updated),
          categories,
          originalUrl: absLink,
          pdfUrl: pdfLink,
          contentType: 'text',
          content: entry.summary,
          crawledAt: new Date(),
          metadata: {
            arxivId,
            doi: entry.doi,
            comment: entry.comment,
            journalRef: entry.journal_ref,
            primaryCategory: entry.primary_category ? entry.primary_category.$.term : null
          },
          checksum: this.calculateChecksum(entry.title + entry.summary)
        };
      });

      const totalResults = parseInt(result.feed.opensearch_totalResults) || papers.length;

      console.log(`成功获取 ${papers.length} 篇论文 (总计 ${totalResults} 篇)`);

      return {
        query,
        totalResults,
        papers,
        crawledAt: new Date(),
        success: true
      };
    } catch (error) {
      console.error(`arXiv爬取失败 "${query}":`, error.message);
      return {
        query,
        error: error.message,
        success: false,
        crawledAt: new Date()
      };
    }
  }

  // 获取AI相关的最新论文
  async fetchLatestAIPapers(maxResults = 50) {
    const queries = [
      'cat:cs.AI',           // 人工智能
      'cat:cs.LG',           // 机器学习
      'cat:cs.CL',           // 计算语言学/自然语言处理
      'cat:cs.CV',           // 计算机视觉
      'cat:cs.NE'            // 神经和进化计算
    ];

    const results = {};
    
    for (const query of queries) {
      const categoryName = this.getCategoryName(query);
      console.log(`正在获取 ${categoryName} 论文...`);
      
      results[categoryName] = await this.fetchArxivPapers(query, 0, maxResults);
      
      // 延迟避免频繁请求
      await this.delay(1000);
    }

    return results;
  }

  // 根据关键词搜索论文
  async searchPapers(keywords, maxResults = 30) {
    const searchQuery = `all:${keywords}`;
    return await this.fetchArxivPapers(searchQuery, 0, maxResults);
  }

  // 获取特定作者的论文
  async getAuthorPapers(authorName, maxResults = 50) {
    const searchQuery = `au:"${authorName}"`;
    return await this.fetchArxivPapers(searchQuery, 0, maxResults);
  }

  // 提取arXiv ID
  extractArxivId(url) {
    const match = url.match(/abs\/(\d+\.\d+)/);
    return match ? match[1] : null;
  }

  // 获取分类名称
  getCategoryName(query) {
    const categoryMap = {
      'cat:cs.AI': '人工智能',
      'cat:cs.LG': '机器学习',
      'cat:cs.CL': '自然语言处理',
      'cat:cs.CV': '计算机视觉',
      'cat:cs.NE': '神经网络'
    };
    return categoryMap[query] || query;
  }

  // 生成内容ID
  generateContentId(url) {
    return crypto.createHash('md5').update(url).digest('hex');
  }

  // 计算内容校验和
  calculateChecksum(content) {
    if (!content) return null;
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  // 延迟函数
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // 测试arXiv API连接
  async testConnection() {
    console.log('测试arXiv API连接...');
    const result = await this.fetchArxivPapers('cat:cs.AI', 0, 5);
    
    if (result.success) {
      console.log('✅ arXiv API连接成功');
      console.log(`   - 查询: ${result.query}`);
      console.log(`   - 总结果数: ${result.totalResults}`);
      console.log(`   - 获取论文数: ${result.papers.length}`);
      
      if (result.papers.length > 0) {
        const paper = result.papers[0];
        console.log(`   - 示例论文: ${paper.title}`);
        console.log(`   - 作者: ${paper.authors.join(', ')}`);
        console.log(`   - 发布日期: ${paper.published}`);
      }
    } else {
      console.log('❌ arXiv API连接失败');
      console.log(`   - 错误: ${result.error}`);
    }
    
    return result;
  }

  // 测试AI相关论文获取
  async testAIPapers() {
    console.log('开始测试AI相关论文获取...\n');
    
    const results = await this.fetchLatestAIPapers(10); // 每个类别获取10篇
    
    console.log('\n=== AI论文获取结果汇总 ===');
    let totalPapers = 0;
    let successCount = 0;
    
    for (const [category, result] of Object.entries(results)) {
      if (result.success) {
        successCount++;
        totalPapers += result.papers.length;
        console.log(`✅ ${category}: ${result.papers.length} 篇论文`);
        
        // 显示一个示例
        if (result.papers.length > 0) {
          const paper = result.papers[0];
          console.log(`   示例: ${paper.title.substring(0, 80)}...`);
        }
      } else {
        console.log(`❌ ${category}: ${result.error}`);
      }
    }
    
    console.log(`\n总计: ${successCount}/${Object.keys(results).length} 个类别成功, 共获取 ${totalPapers} 篇论文`);
    
    return results;
  }

  // 测试关键词搜索
  async testKeywordSearch(keyword = 'large language model') {
    console.log(`\n测试关键词搜索: "${keyword}"`);
    console.log('-'.repeat(40));
    
    const result = await this.searchPapers(keyword, 5);
    
    if (result.success) {
      console.log(`✅ 搜索成功: 找到 ${result.papers.length} 篇相关论文`);
      
      result.papers.forEach((paper, index) => {
        console.log(`\n${index + 1}. ${paper.title}`);
        console.log(`   作者: ${paper.authors.join(', ')}`);
        console.log(`   发布: ${paper.published.toDateString()}`);
        console.log(`   分类: ${paper.categories.join(', ')}`);
        console.log(`   摘要: ${paper.summary.substring(0, 150)}...`);
      });
    } else {
      console.log(`❌ 搜索失败: ${result.error}`);
    }
    
    return result;
  }
}

module.exports = ArxivCrawler; 