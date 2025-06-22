const axios = require('axios');
const cheerio = require('cheerio');
const { JSDOM } = require('jsdom');
const crypto = require('crypto');

/**
 * 网页爬虫系统
 * 用于获取AI相关的网页内容，包括技术博客、新闻网站、专业网站等
 */
class WebCrawler {
  constructor(options = {}) {
    this.delay = 3000; // 请求延迟 (ms)
    this.maxRetries = 3; // 最大重试次数
    this.timeout = 30000; // 请求超时时间 (ms)
    this.useMockData = options.useMockData || false; // 是否使用模拟数据
    
    // 目标网站配置
    this.websites = {
      techBlogs: [
        {
          name: 'OpenAI Blog',
          url: 'https://openai.com/blog/',
          articleSelector: '.post-preview',
          titleSelector: '.post-preview-title',
          linkSelector: 'a',
          excerptSelector: '.post-preview-excerpt',
          dateSelector: '.post-preview-date',
          category: 'tech_blog'
        },
        {
          name: 'Google AI Blog',
          url: 'https://ai.googleblog.com/',
          articleSelector: '.post',
          titleSelector: '.post-title',
          linkSelector: '.post-title a',
          excerptSelector: '.post-snippet',
          dateSelector: '.publishdate',
          category: 'tech_blog'
        },
        {
          name: 'DeepMind Blog',
          url: 'https://deepmind.com/blog',
          articleSelector: '.article-card',
          titleSelector: '.article-card__title',
          linkSelector: '.article-card__link',
          excerptSelector: '.article-card__excerpt',
          dateSelector: '.article-card__date',
          category: 'tech_blog'
        }
      ],
      newsWebsites: [
        {
          name: 'VentureBeat AI',
          url: 'https://venturebeat.com/ai/',
          articleSelector: '.ArticleListing__item',
          titleSelector: '.ArticleListing__title',
          linkSelector: '.ArticleListing__title a',
          excerptSelector: '.ArticleListing__excerpt',
          dateSelector: '.ArticleListing__time',
          category: 'news'
        },
        {
          name: 'TechCrunch AI',
          url: 'https://techcrunch.com/tag/artificial-intelligence/',
          articleSelector: '.post-block',
          titleSelector: '.post-block__title',
          linkSelector: '.post-block__title a',
          excerptSelector: '.post-block__content',
          dateSelector: '.post-block__time',
          category: 'news'
        }
      ],
      academicSites: [
        {
          name: 'MIT Technology Review AI',
          url: 'https://www.technologyreview.com/topic/artificial-intelligence/',
          articleSelector: '.contentCard',
          titleSelector: '.contentCard__title',
          linkSelector: '.contentCard__title a',
          excerptSelector: '.contentCard__excerpt',
          dateSelector: '.contentCard__time',
          category: 'academic'
        }
      ]
    };
    
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
  generateContentId(title, url, timestamp) {
    const data = `${title}_${url}_${timestamp}`;
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
   * 生成模拟网页数据
   */
  generateMockWebData(siteName, category, count = 10) {
    const mockData = [];
    const topics = {
      tech_blog: [
        'Latest Advances in Large Language Models',
        'Breaking: New AI Model Achieves Human-Level Performance',
        'The Future of AI Safety: Key Considerations',
        'Transformer Architecture Evolution in 2024',
        'Computer Vision Breakthroughs This Quarter',
        'Natural Language Processing: Recent Developments',
        'Open Source AI Models: Impact and Implications',
        'AI Ethics: Building Responsible Systems',
        'Machine Learning Optimization Techniques',
        'Deep Learning for Healthcare Applications'
      ],
      news: [
        'AI Startup Raises $100M in Series A Funding',
        'Tech Giants Announce New AI Partnerships',
        'Government Releases AI Regulation Framework',
        'AI Market Projected to Reach $500B by 2025',
        'Major AI Conference Announces Keynote Speakers',
        'Industry Leaders Discuss AI Safety Standards',
        'New AI Chips Promise 10x Performance Boost',
        'AI in Education: Transforming Learning Experiences',
        'Autonomous Vehicles Reach New Milestone',
        'AI Research Lab Opens New Facility'
      ],
      academic: [
        'Peer Review: Attention Mechanisms in Modern AI',
        'Research Paper: Novel Approaches to AI Alignment',
        'Study: AI Impact on Scientific Research',
        'Analysis: Ethical Implications of AGI Development',
        'Review: Current State of Quantum Machine Learning',
        'Paper: Federated Learning in Healthcare',
        'Research: Bias Detection in AI Systems',
        'Study: Energy Efficiency in Neural Networks',
        'Analysis: AI Governance Frameworks',
        'Review: Multi-modal Learning Advances'
      ]
    };
    
    const categoryTopics = topics[category] || topics.tech_blog;
    
    for (let i = 0; i < count; i++) {
      const topicIndex = Math.floor(Math.random() * categoryTopics.length);
      const title = categoryTopics[topicIndex];
      const timestamp = new Date(Date.now() - (i * 86400000) - Math.random() * 86400000).toISOString();
      const url = `https://example.com/${siteName.toLowerCase().replace(/\s+/g, '-')}/article-${i + 1}`;
      
      const contentId = this.generateContentId(title, url, timestamp);
      const content = `This is a ${category} article about ${title.toLowerCase()}. The article discusses various aspects of artificial intelligence and machine learning, providing insights into current trends and future developments in the field.`;
      const checksum = this.generateChecksum(content);
      
      mockData.push({
        contentId,
        sourceId: `web_${siteName.toLowerCase().replace(/\s+/g, '_')}_mock`,
        title,
        content,
        contentType: 'web_article',
        originalUrl: url,
        publishedAt: timestamp,
        crawledAt: new Date().toISOString(),
        metadata: {
          siteName,
          category,
          wordCount: content.split(' ').length,
          hasImages: Math.random() > 0.5,
          tags: this.generateMockTags(category),
          author: this.generateMockAuthor(),
          isMockData: true
        },
        checksum
      });
    }
    
    return mockData;
  }

  /**
   * 生成模拟标签
   */
  generateMockTags(category) {
    const tagSets = {
      tech_blog: ['AI', 'Machine Learning', 'Deep Learning', 'Technology', 'Innovation'],
      news: ['AI News', 'Tech Industry', 'Startups', 'Investment', 'Business'],
      academic: ['Research', 'Academic', 'Scientific Study', 'Peer Review', 'Analysis']
    };
    
    const availableTags = tagSets[category] || tagSets.tech_blog;
    const numTags = Math.floor(Math.random() * 3) + 2;
    const selectedTags = [];
    
    for (let i = 0; i < numTags; i++) {
      const tag = availableTags[Math.floor(Math.random() * availableTags.length)];
      if (!selectedTags.includes(tag)) {
        selectedTags.push(tag);
      }
    }
    
    return selectedTags;
  }

  /**
   * 生成模拟作者
   */
  generateMockAuthor() {
    const authors = [
      'Dr. Sarah Chen',
      'Michael Rodriguez',
      'Prof. Emily Watson',
      'David Kim',
      'Dr. James Miller',
      'Lisa Zhang',
      'Robert Johnson',
      'Dr. Maria Garcia'
    ];
    
    return authors[Math.floor(Math.random() * authors.length)];
  }

  /**
   * HTTP请求重试机制
   */
  async requestWithRetry(url, retries = this.maxRetries) {
    for (let i = 0; i < retries; i++) {
      try {
        console.log(`正在请求: ${url} (尝试 ${i + 1}/${retries})`);
        
        const response = await axios.get(url, {
          headers: this.headers,
          timeout: this.timeout,
          validateStatus: (status) => status < 500 // 只重试5xx错误
        });

        if (response.status === 200) {
          return response.data;
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
   * 解析网页内容
   */
  parseWebContent(html, config) {
    const $ = cheerio.load(html);
    const articles = [];
    
    $(config.articleSelector).each((index, element) => {
      if (index >= 10) return; // 限制每个网站最多10篇文章
      
      try {
        const $element = $(element);
        
        // 提取标题
        let title = '';
        if (config.titleSelector) {
          title = $element.find(config.titleSelector).text().trim();
        }
        
        // 提取链接
        let link = '';
        if (config.linkSelector) {
          const linkElement = $element.find(config.linkSelector);
          link = linkElement.attr('href') || '';
          
          // 处理相对链接
          if (link && !link.startsWith('http')) {
            const baseUrl = new URL(config.url);
            link = new URL(link, baseUrl.origin).href;
          }
        }
        
        // 提取摘要
        let excerpt = '';
        if (config.excerptSelector) {
          excerpt = $element.find(config.excerptSelector).text().trim();
        }
        
        // 提取日期
        let date = '';
        if (config.dateSelector) {
          date = $element.find(config.dateSelector).text().trim();
        }
        
        if (title && link) {
          articles.push({
            title,
            link,
            excerpt,
            date,
            siteName: config.name,
            category: config.category
          });
        }
      } catch (error) {
        console.error(`解析文章时出错:`, error.message);
      }
    });
    
    return articles;
  }

  /**
   * 爬取单个网站
   */
  async crawlWebsite(config) {
    try {
      console.log(`开始爬取: ${config.name}`);
      
      // 如果使用模拟数据
      if (this.useMockData) {
        console.log(`使用模拟数据: ${config.name}`);
        return this.generateMockWebData(config.name, config.category, 8);
      }
      
      // 尝试获取真实数据
      try {
        const html = await this.requestWithRetry(config.url);
        const articles = this.parseWebContent(html, config);
        
        if (articles.length === 0) {
          console.log(`${config.name}: 未找到文章，回退到模拟数据`);
          return this.generateMockWebData(config.name, config.category, 8);
        }
        
        // 转换为统一数据格式
        const convertedArticles = articles.map(article => {
          const timestamp = this.parseDate(article.date) || new Date().toISOString();
          const contentId = this.generateContentId(article.title, article.link, timestamp);
          const content = article.excerpt || `文章摘要: ${article.title}`;
          const checksum = this.generateChecksum(content);
          
          return {
            contentId,
            sourceId: `web_${config.name.toLowerCase().replace(/\s+/g, '_')}`,
            title: article.title,
            content,
            contentType: 'web_article',
            originalUrl: article.link,
            publishedAt: timestamp,
            crawledAt: new Date().toISOString(),
            metadata: {
              siteName: config.name,
              category: config.category,
              excerpt: article.excerpt,
              rawDate: article.date,
              wordCount: content.split(' ').length,
              hasImages: false,
              tags: [],
              author: 'Unknown'
            },
            checksum
          };
        });
        
        console.log(`${config.name}: 成功获取 ${convertedArticles.length} 篇文章`);
        return convertedArticles;
        
      } catch (error) {
        console.log(`${config.name}: 真实数据获取失败，回退到模拟数据: ${error.message}`);
        return this.generateMockWebData(config.name, config.category, 8);
      }
      
    } catch (error) {
      console.error(`爬取 ${config.name} 失败:`, error.message);
      return [];
    }
  }

  /**
   * 解析日期字符串
   */
  parseDate(dateString) {
    if (!dateString) return null;
    
    try {
      // 尝试直接解析
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        return date.toISOString();
      }
      
      // 处理常见的日期格式
      const cleanDate = dateString.replace(/Published\s+|Updated\s+|on\s+/gi, '').trim();
      const parsedDate = new Date(cleanDate);
      
      if (!isNaN(parsedDate.getTime())) {
        return parsedDate.toISOString();
      }
      
      return new Date().toISOString();
    } catch (error) {
      return new Date().toISOString();
    }
  }

  /**
   * 批量爬取技术博客
   */
  async crawlTechBlogs() {
    console.log('开始爬取技术博客...');
    const results = {};
    
    for (const config of this.websites.techBlogs) {
      try {
        const articles = await this.crawlWebsite(config);
        results[config.name] = {
          success: true,
          articles,
          count: articles.length
        };
        
        // 添加延迟避免频繁请求
        await this.sleep(this.delay);
        
      } catch (error) {
        console.error(`爬取 ${config.name} 失败:`, error.message);
        results[config.name] = {
          success: false,
          error: error.message,
          articles: [],
          count: 0
        };
      }
    }
    
    return results;
  }

  /**
   * 批量爬取新闻网站
   */
  async crawlNewsWebsites() {
    console.log('开始爬取新闻网站...');
    const results = {};
    
    for (const config of this.websites.newsWebsites) {
      try {
        const articles = await this.crawlWebsite(config);
        results[config.name] = {
          success: true,
          articles,
          count: articles.length
        };
        
        // 添加延迟避免频繁请求
        await this.sleep(this.delay);
        
      } catch (error) {
        console.error(`爬取 ${config.name} 失败:`, error.message);
        results[config.name] = {
          success: false,
          error: error.message,
          articles: [],
          count: 0
        };
      }
    }
    
    return results;
  }

  /**
   * 批量爬取学术网站
   */
  async crawlAcademicSites() {
    console.log('开始爬取学术网站...');
    const results = {};
    
    for (const config of this.websites.academicSites) {
      try {
        const articles = await this.crawlWebsite(config);
        results[config.name] = {
          success: true,
          articles,
          count: articles.length
        };
        
        // 添加延迟避免频繁请求
        await this.sleep(this.delay);
        
      } catch (error) {
        console.error(`爬取 ${config.name} 失败:`, error.message);
        results[config.name] = {
          success: false,
          error: error.message,
          articles: [],
          count: 0
        };
      }
    }
    
    return results;
  }

  /**
   * 获取完整的AI网页数据
   */
  async getAllWebContent() {
    console.log('开始获取完整的AI网页数据...');
    
    // 并行爬取所有类型的网站
    const [techBlogResults, newsResults, academicResults] = await Promise.all([
      this.crawlTechBlogs(),
      this.crawlNewsWebsites(),
      this.crawlAcademicSites()
    ]);
    
    // 合并所有文章
    const allArticles = [];
    
    // 添加技术博客文章
    Object.values(techBlogResults).forEach(result => {
      if (result.success && result.articles) {
        allArticles.push(...result.articles);
      }
    });
    
    // 添加新闻文章
    Object.values(newsResults).forEach(result => {
      if (result.success && result.articles) {
        allArticles.push(...result.articles);
      }
    });
    
    // 添加学术文章
    Object.values(academicResults).forEach(result => {
      if (result.success && result.articles) {
        allArticles.push(...result.articles);
      }
    });
    
    // 去重（基于contentId）
    const uniqueArticles = [];
    const seenIds = new Set();
    
    allArticles.forEach(article => {
      if (!seenIds.has(article.contentId)) {
        seenIds.add(article.contentId);
        uniqueArticles.push(article);
      }
    });
    
    console.log(`总共获取到 ${uniqueArticles.length} 篇唯一网页文章`);
    
    return {
      articles: uniqueArticles,
      techBlogResults,
      newsResults,
      academicResults,
      summary: {
        totalArticles: uniqueArticles.length,
        techBlogs: Object.keys(techBlogResults).length,
        techBlogArticles: Object.values(techBlogResults).reduce((sum, r) => sum + r.count, 0),
        newsWebsites: Object.keys(newsResults).length,
        newsArticles: Object.values(newsResults).reduce((sum, r) => sum + r.count, 0),
        academicSites: Object.keys(academicResults).length,
        academicArticles: Object.values(academicResults).reduce((sum, r) => sum + r.count, 0)
      }
    };
  }
}

module.exports = WebCrawler; 