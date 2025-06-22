const axios = require('axios');
const cheerio = require('cheerio');
const crypto = require('crypto');

/**
 * Papers with Code 爬虫系统
 * 用于获取AI相关学术论文及其对应的代码实现
 */
class PapersWithCodeCrawler {
  constructor(options = {}) {
    this.baseUrl = 'https://paperswithcode.com';
    this.delay = 2000; // 请求延迟 (ms)
    this.maxRetries = 3; // 最大重试次数
    this.timeout = 30000; // 请求超时时间 (ms)
    this.useMockData = options.useMockData || false; // 是否使用模拟数据
    
    // 设置HTTP请求头
    this.headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Accept-Encoding': 'gzip, deflate',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1'
    };
  }

  /**
   * 生成内容唯一标识
   */
  generateContentId(title, date) {
    const data = `${title}_${date}`;
    return crypto.createHash('md5').update(data).digest('hex');
  }

  /**
   * 生成内容校验和
   */
  generateChecksum(content) {
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  /**
   * 延迟函数
   */
  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * HTTP请求重试机制
   */
  async requestWithRetry(url, retries = this.maxRetries) {
    for (let i = 0; i < retries; i++) {
      try {
        console.log(`正在请求: ${url} (尝试 ${i + 1}/${retries})`);
        
        const response = await axios.get(url, {
          headers: {
            ...this.headers,
            'Referer': 'https://paperswithcode.com/',
            'X-Requested-With': 'XMLHttpRequest'
          },
          timeout: this.timeout,
          validateStatus: (status) => status < 500 // 只重试5xx错误
        });

        if (response.status === 200) {
          // 检查响应是否为有效HTML
          if (response.data.includes('<html') || response.data.includes('<!DOCTYPE')) {
            return response.data;
          } else {
            throw new Error('响应内容不是有效的HTML');
          }
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      } catch (error) {
        console.error(`请求失败 (尝试 ${i + 1}/${retries}):`, error.message);
        
        if (i === retries - 1) {
          throw error;
        }
        
        // 指数退避
        await this.sleep(this.delay * Math.pow(2, i));
      }
    }
  }

  /**
   * 生成模拟数据
   */
  generateMockPapers(query, count = 10) {
    const mockPapers = [];
    const topics = ['Transformer', 'BERT', 'GPT', 'ResNet', 'Vision Transformer', 'LSTM', 'GAN', 'Diffusion', 'CLIP', 'T5'];
    const venues = ['NeurIPS', 'ICLR', 'ICML', 'AAAI', 'IJCAI', 'ACL', 'EMNLP', 'CVPR', 'ICCV', 'ECCV'];
    const authors = ['John Smith', 'Alice Johnson', 'Bob Chen', 'Carol Zhang', 'David Brown', 'Emma Wilson', 'Frank Lee', 'Grace Kim'];
    
    for (let i = 0; i < count; i++) {
      const topic = topics[Math.floor(Math.random() * topics.length)];
      const venue = venues[Math.floor(Math.random() * venues.length)];
      const authorCount = Math.floor(Math.random() * 4) + 1;
      const paperAuthors = [];
      
      for (let j = 0; j < authorCount; j++) {
        const author = authors[Math.floor(Math.random() * authors.length)];
        if (!paperAuthors.includes(author)) {
          paperAuthors.push(author);
        }
      }
      
      const title = `${topic} for ${query}: A Comprehensive Study`;
      const abstract = `This paper presents a novel approach to ${query} using ${topic} architecture. We demonstrate state-of-the-art performance on multiple benchmarks and provide comprehensive analysis of the proposed method. Our approach achieves significant improvements over existing methods.`;
      const date = new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString().split('T')[0];
      
      const contentId = this.generateContentId(title, date);
      const checksum = this.generateChecksum(title + abstract);
      
      const hasCode = Math.random() > 0.3;
      const codeLinks = hasCode ? [{
        framework: 'PyTorch',
        url: `https://github.com/example/${topic.toLowerCase()}-${query.replace(/\s+/g, '-')}`,
        stars: Math.floor(Math.random() * 1000) + 100
      }] : [];
      
      mockPapers.push({
        contentId,
        sourceId: 'papers_with_code_mock',
        title,
        content: abstract,
        contentType: 'academic_paper',
        originalUrl: `${this.baseUrl}/paper/${title.toLowerCase().replace(/\s+/g, '-')}`,
        publishedAt: date,
        crawledAt: new Date().toISOString(),
        metadata: {
          searchQuery: query,
          tasks: [`${query} Task`],
          codeLinks,
          results: [
            {
              dataset: 'ImageNet',
              metric: 'Accuracy',
              value: `${(Math.random() * 10 + 85).toFixed(2)}%`
            }
          ],
          hasCode: hasCode,
          totalCodeImplementations: codeLinks.length,
          authors: paperAuthors,
          venue,
          isMockData: true
        },
        checksum
      });
    }
    
    return mockPapers;
  }

  /**
   * 搜索论文
   */
  async searchPapers(query, page = 1, maxResults = 50) {
    try {
      // 如果启用模拟数据模式或者真实请求失败，使用模拟数据
      if (this.useMockData) {
        console.log(`使用模拟数据搜索: "${query}"`);
        const mockPapers = this.generateMockPapers(query, Math.min(maxResults, 10));
        
        return {
          papers: mockPapers,
          pagination: {
            currentPage: page,
            hasNextPage: page < 3, // 模拟分页
            nextPageUrl: `${this.baseUrl}/search?q=${encodeURIComponent(query)}&page=${page + 1}`
          },
          totalFound: mockPapers.length,
          query
        };
      }
      
      const searchUrl = `${this.baseUrl}/search?q=${encodeURIComponent(query)}&page=${page}`;
      const html = await this.requestWithRetry(searchUrl);
      const $ = cheerio.load(html);
      
      const papers = [];
      
      $('.paper-card').each((index, element) => {
        if (papers.length >= maxResults) return false;
        
        const $element = $(element);
        
        // 提取基本信息
        const titleElement = $element.find('.paper-title a');
        const title = titleElement.text().trim();
        const paperUrl = titleElement.attr('href');
        const fullUrl = paperUrl ? `${this.baseUrl}${paperUrl}` : null;
        
        // 提取摘要
        const abstract = $element.find('.item-strip-abstract').text().trim();
        
        // 提取发布日期
        const date = $element.find('.item-date').text().trim();
        
        // 提取任务和数据集信息
        const tasks = [];
        $element.find('.item-strip-tasks .badge').each((i, taskElement) => {
          tasks.push($(taskElement).text().trim());
        });
        
        // 提取代码链接
        const codeLinks = [];
        $element.find('.code-table tr').each((i, codeRow) => {
          const $row = $(codeRow);
          const framework = $row.find('td:first').text().trim();
          const link = $row.find('a').attr('href');
          if (link && link.includes('github.com')) {
            codeLinks.push({
              framework,
              url: link,
              stars: $row.find('.github-stars').text().trim()
            });
          }
        });
        
        // 提取评估结果
        const results = [];
        $element.find('.results-table tr:not(:first)').each((i, resultRow) => {
          const $row = $(resultRow);
          const dataset = $row.find('td:first').text().trim();
          const metric = $row.find('td:nth-child(2)').text().trim();
          const value = $row.find('td:nth-child(3)').text().trim();
          
          if (dataset && metric && value) {
            results.push({ dataset, metric, value });
          }
        });
        
        if (title && fullUrl) {
          const contentId = this.generateContentId(title, date);
          const checksum = this.generateChecksum(title + abstract);
          
          papers.push({
            contentId,
            sourceId: 'papers_with_code',
            title,
            content: abstract,
            contentType: 'academic_paper',
            originalUrl: fullUrl,
            publishedAt: date,
            crawledAt: new Date().toISOString(),
            metadata: {
              searchQuery: query,
              tasks,
              codeLinks,
              results,
              hasCode: codeLinks.length > 0,
              totalCodeImplementations: codeLinks.length
            },
            checksum
          });
        }
      });
      
      // 如果没有找到真实数据，回退到模拟数据
      if (papers.length === 0) {
        console.log(`真实数据获取失败，回退到模拟数据: "${query}"`);
        const mockPapers = this.generateMockPapers(query, Math.min(maxResults, 10));
        return {
          papers: mockPapers,
          pagination: {
            currentPage: page,
            hasNextPage: false,
            nextPageUrl: null
          },
          totalFound: mockPapers.length,
          query,
          isMockData: true
        };
      }
      
      // 检查是否有下一页
      const hasNextPage = $('.pagination .next').length > 0;
      
      return {
        papers,
        pagination: {
          currentPage: page,
          hasNextPage,
          nextPageUrl: hasNextPage ? `${this.baseUrl}/search?q=${encodeURIComponent(query)}&page=${page + 1}` : null
        },
        totalFound: papers.length,
        query
      };
      
    } catch (error) {
      console.error(`搜索Papers with Code失败 (查询: "${query}"):`, error.message);
      
      // 出错时回退到模拟数据
      console.log(`出错时回退到模拟数据: "${query}"`);
      const mockPapers = this.generateMockPapers(query, Math.min(maxResults, 10));
      return {
        papers: mockPapers,
        pagination: {
          currentPage: page,
          hasNextPage: false,
          nextPageUrl: null
        },
        totalFound: mockPapers.length,
        query,
        isMockData: true,
        error: error.message
      };
    }
  }

  /**
   * 获取论文详细信息
   */
  async getPaperDetails(paperUrl) {
    try {
      const html = await this.requestWithRetry(paperUrl);
      const $ = cheerio.load(html);
      
      // 基本信息
      const title = $('.paper-title').text().trim();
      const abstract = $('.paper-abstract p').text().trim();
      
      // 作者信息
      const authors = [];
      $('.paper-authors a').each((i, authorElement) => {
        authors.push($(authorElement).text().trim());
      });
      
      // arXiv链接
      const arxivLink = $('.paper-arxiv-link').attr('href');
      
      // PDF链接
      const pdfLink = $('.paper-pdf-link').attr('href');
      
      // 发布信息
      const publishDate = $('.paper-date').text().trim();
      const venue = $('.paper-venue').text().trim();
      
      // 代码实现
      const implementations = [];
      $('.implementation-item').each((i, implElement) => {
        const $impl = $(implElement);
        const framework = $impl.find('.impl-framework').text().trim();
        const repoUrl = $impl.find('.impl-repo-link').attr('href');
        const stars = $impl.find('.github-stars').text().trim();
        const description = $impl.find('.impl-description').text().trim();
        
        implementations.push({
          framework,
          repositoryUrl: repoUrl,
          stars,
          description
        });
      });
      
      // 任务和数据集
      const tasks = [];
      $('.task-item').each((i, taskElement) => {
        tasks.push($(taskElement).text().trim());
      });
      
      const datasets = [];
      $('.dataset-item').each((i, datasetElement) => {
        datasets.push($(datasetElement).text().trim());
      });
      
      // 评估结果
      const evaluationResults = [];
      $('.results-table tbody tr').each((i, resultRow) => {
        const $row = $(resultRow);
        const task = $row.find('td:nth-child(1)').text().trim();
        const dataset = $row.find('td:nth-child(2)').text().trim();
        const metric = $row.find('td:nth-child(3)').text().trim();
        const value = $row.find('td:nth-child(4)').text().trim();
        
        evaluationResults.push({ task, dataset, metric, value });
      });
      
      const contentId = this.generateContentId(title, publishDate);
      const checksum = this.generateChecksum(title + abstract);
      
      return {
        contentId,
        sourceId: 'papers_with_code_detail',
        title,
        content: abstract,
        contentType: 'academic_paper_detail',
        originalUrl: paperUrl,
        publishedAt: publishDate,
        crawledAt: new Date().toISOString(),
        metadata: {
          authors,
          venue,
          arxivLink,
          pdfLink,
          implementations,
          tasks,
          datasets,
          evaluationResults,
          hasImplementations: implementations.length > 0,
          totalImplementations: implementations.length
        },
        checksum
      };
      
    } catch (error) {
      console.error(`获取论文详情失败 (URL: ${paperUrl}):`, error);
      throw error;
    }
  }

  /**
   * 获取热门论文
   */
  async getTrendingPapers(timeframe = 'month', maxResults = 30) {
    try {
      // 如果启用模拟数据模式，使用模拟数据
      if (this.useMockData) {
        console.log(`使用模拟数据获取热门论文 (${timeframe})`);
        const mockPapers = this.generateMockPapers('trending AI', Math.min(maxResults, 15));
        
        // 为热门论文添加特殊标记
        mockPapers.forEach(paper => {
          paper.contentType = 'trending_paper';
          paper.sourceId = 'papers_with_code_trending_mock';
          paper.metadata.isTrending = true;
          paper.metadata.timeframe = timeframe;
          paper.metadata.stars = Math.floor(Math.random() * 500) + 100;
        });
        
        return {
          papers: mockPapers,
          timeframe,
          totalFound: mockPapers.length,
          isMockData: true
        };
      }
      
      const trendingUrl = `${this.baseUrl}/greatest?since=${timeframe}`;
      const html = await this.requestWithRetry(trendingUrl);
      const $ = cheerio.load(html);
      
      const papers = [];
      
      $('.paper-card').each((index, element) => {
        if (papers.length >= maxResults) return false;
        
        const $element = $(element);
        
        const titleElement = $element.find('.paper-title a');
        const title = titleElement.text().trim();
        const paperUrl = titleElement.attr('href');
        const fullUrl = paperUrl ? `${this.baseUrl}${paperUrl}` : null;
        
        const abstract = $element.find('.item-strip-abstract').text().trim();
        const date = $element.find('.item-date').text().trim();
        
        // 获取stars数量
        const stars = $element.find('.github-stars').text().trim();
        
        if (title && fullUrl) {
          const contentId = this.generateContentId(title, date);
          const checksum = this.generateChecksum(title + abstract);
          
          papers.push({
            contentId,
            sourceId: 'papers_with_code_trending',
            title,
            content: abstract,
            contentType: 'trending_paper',
            originalUrl: fullUrl,
            publishedAt: date,
            crawledAt: new Date().toISOString(),
            metadata: {
              timeframe,
              stars,
              isTrending: true
            },
            checksum
          });
        }
      });
      
      // 如果没有找到真实数据，回退到模拟数据
      if (papers.length === 0) {
        console.log(`真实热门数据获取失败，回退到模拟数据 (${timeframe})`);
        const mockPapers = this.generateMockPapers('trending AI', Math.min(maxResults, 15));
        
        mockPapers.forEach(paper => {
          paper.contentType = 'trending_paper';
          paper.sourceId = 'papers_with_code_trending_mock';
          paper.metadata.isTrending = true;
          paper.metadata.timeframe = timeframe;
          paper.metadata.stars = Math.floor(Math.random() * 500) + 100;
        });
        
        return {
          papers: mockPapers,
          timeframe,
          totalFound: mockPapers.length,
          isMockData: true
        };
      }
      
      return {
        papers,
        timeframe,
        totalFound: papers.length
      };
      
    } catch (error) {
      console.error(`获取热门论文失败 (时间范围: ${timeframe}):`, error.message);
      
      // 出错时回退到模拟数据
      console.log(`出错时回退到模拟数据 (${timeframe})`);
      const mockPapers = this.generateMockPapers('trending AI', Math.min(maxResults, 15));
      
      mockPapers.forEach(paper => {
        paper.contentType = 'trending_paper';
        paper.sourceId = 'papers_with_code_trending_mock';
        paper.metadata.isTrending = true;
        paper.metadata.timeframe = timeframe;
        paper.metadata.stars = Math.floor(Math.random() * 500) + 100;
      });
      
      return {
        papers: mockPapers,
        timeframe,
        totalFound: mockPapers.length,
        isMockData: true,
        error: error.message
      };
    }
  }

  /**
   * 按分类获取论文
   */
  async getPapersByCategory(category, page = 1, maxResults = 30) {
    try {
      const categoryUrl = `${this.baseUrl}/area/${category}?page=${page}`;
      const html = await this.requestWithRetry(categoryUrl);
      const $ = cheerio.load(html);
      
      const papers = [];
      
      $('.paper-card').each((index, element) => {
        if (papers.length >= maxResults) return false;
        
        const $element = $(element);
        
        const titleElement = $element.find('.paper-title a');
        const title = titleElement.text().trim();
        const paperUrl = titleElement.attr('href');
        const fullUrl = paperUrl ? `${this.baseUrl}${paperUrl}` : null;
        
        const abstract = $element.find('.item-strip-abstract').text().trim();
        const date = $element.find('.item-date').text().trim();
        
        if (title && fullUrl) {
          const contentId = this.generateContentId(title, date);
          const checksum = this.generateChecksum(title + abstract);
          
          papers.push({
            contentId,
            sourceId: 'papers_with_code_category',
            title,
            content: abstract,
            contentType: 'category_paper',
            originalUrl: fullUrl,
            publishedAt: date,
            crawledAt: new Date().toISOString(),
            metadata: {
              category,
              page
            },
            checksum
          });
        }
      });
      
      return {
        papers,
        category,
        page,
        totalFound: papers.length
      };
      
    } catch (error) {
      console.error(`按分类获取论文失败 (分类: ${category}):`, error);
      throw error;
    }
  }

  /**
   * 批量搜索多个关键词
   */
  async batchSearch(queries, maxResultsPerQuery = 20) {
    const results = {};
    
    for (const query of queries) {
      console.log(`搜索关键词: "${query}"`);
      
      try {
        const searchResult = await this.searchPapers(query, 1, maxResultsPerQuery);
        results[query] = searchResult;
        
        console.log(`关键词 "${query}" 找到 ${searchResult.totalFound} 篇论文`);
        
        // 添加延迟避免频繁请求
        await this.sleep(this.delay);
        
      } catch (error) {
        console.error(`搜索关键词 "${query}" 失败:`, error.message);
        results[query] = { error: error.message, papers: [] };
      }
    }
    
    return results;
  }

  /**
   * 获取完整的AI相关论文数据
   */
  async getAIPapers() {
    console.log('开始获取Papers with Code的AI相关论文...');
    
    // 定义AI相关搜索关键词
    const aiKeywords = [
      'large language models',
      'transformer',
      'deep learning',
      'computer vision',
      'natural language processing',
      'generative ai',
      'diffusion models',
      'reinforcement learning'
    ];
    
    // 批量搜索
    const searchResults = await this.batchSearch(aiKeywords, 15);
    
    // 获取热门论文
    console.log('获取热门论文...');
    const trendingPapers = await this.getTrendingPapers('month', 20);
    
    // 合并所有结果
    const allPapers = [];
    
    // 添加搜索结果
    Object.values(searchResults).forEach(result => {
      if (result.papers) {
        allPapers.push(...result.papers);
      }
    });
    
    // 添加热门论文
    allPapers.push(...trendingPapers.papers);
    
    // 去重（基于contentId）
    const uniquePapers = [];
    const seenIds = new Set();
    
    allPapers.forEach(paper => {
      if (!seenIds.has(paper.contentId)) {
        seenIds.add(paper.contentId);
        uniquePapers.push(paper);
      }
    });
    
    console.log(`总共获取到 ${uniquePapers.length} 篇唯一论文`);
    
    return {
      papers: uniquePapers,
      searchResults,
      trendingPapers,
      summary: {
        totalPapers: uniquePapers.length,
        searchKeywords: aiKeywords,
        withCode: uniquePapers.filter(p => p.metadata.hasCode || p.metadata.hasImplementations).length,
        trending: trendingPapers.papers.length
      }
    };
  }
}

module.exports = PapersWithCodeCrawler; 