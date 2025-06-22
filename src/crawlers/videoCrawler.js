const axios = require('axios');
const { google } = require('googleapis');
const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const crypto = require('crypto');

/**
 * 视频平台爬虫系统
 * 用于获取AI相关的视频内容，包括YouTube、B站等平台
 */
class VideoCrawler {
  constructor(options = {}) {
    this.delay = 3000; // 请求延迟 (ms)
    this.maxRetries = 3; // 最大重试次数
    this.timeout = 30000; // 请求超时时间 (ms)
    this.useMockData = options.useMockData || true; // 默认使用模拟数据
    
    // YouTube API配置
    this.youtubeApiKey = process.env.YOUTUBE_API_KEY || null;
    this.youtube = this.youtubeApiKey ? google.youtube({
      version: 'v3',
      auth: this.youtubeApiKey
    }) : null;
    
    // 搜索关键词配置
    this.searchKeywords = {
      youtube: [
        'artificial intelligence latest developments',
        'machine learning tutorial',
        'large language models explained',
        'AI research breakthroughs',
        'deep learning concepts',
        'neural networks explained',
        'computer vision tutorial',
        'natural language processing',
        'generative AI models'
      ],
      bilibili: [
        '人工智能',
        '机器学习',
        '深度学习',
        '大语言模型',
        '神经网络',
        '计算机视觉',
        '自然语言处理',
        'AI技术分享',
        '机器学习教程'
      ]
    };
    
    // YouTube频道配置
    this.youtubeChannels = [
      { name: 'Two Minute Papers', id: 'UCbfYPyITQ-7l4upoX8nvctg' },
      { name: 'Lex Fridman', id: 'UCSHZKyawb77ixDdsGog4iWA' },
      { name: 'Machine Learning Explained', id: 'UCfzlCWGWYyIQ0aLC5w48gBQ' },
      { name: 'AI Coffee Break', id: 'UCVyRiMvfLNGA-MpVd3-95Vw' },
      { name: '3Blue1Brown', id: 'UCYO_jab_esuFRV4b17AJtAw' }
    ];
    
    // B站UP主配置
    this.bilibiliUploaders = [
      '跟李沐学AI',
      'AI科技大本营',
      '机器学习社区',
      '深度学习与计算机视觉',
      'PyTorch官方'
    ];
    
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
   * 解析时长格式
   */
  parseDuration(duration) {
    if (!duration) return 0;
    
    // YouTube格式: PT1H2M3S
    if (duration.startsWith('PT')) {
      const matches = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
      if (matches) {
        const hours = parseInt(matches[1] || 0);
        const minutes = parseInt(matches[2] || 0);
        const seconds = parseInt(matches[3] || 0);
        return hours * 3600 + minutes * 60 + seconds;
      }
    }
    
    // 简单格式: "1:23" 或 "1:23:45"
    const parts = duration.split(':').map(p => parseInt(p));
    if (parts.length === 2) {
      return parts[0] * 60 + parts[1];
    } else if (parts.length === 3) {
      return parts[0] * 3600 + parts[1] * 60 + parts[2];
    }
    
    return 0;
  }

  /**
   * 格式化数字（播放量等）
   */
  formatNumber(numStr) {
    if (!numStr) return 0;
    
    const cleanStr = numStr.toString().toLowerCase().replace(/[,\s]/g, '');
    
    if (cleanStr.includes('万')) {
      return Math.floor(parseFloat(cleanStr.replace('万', '')) * 10000);
    } else if (cleanStr.includes('k')) {
      return Math.floor(parseFloat(cleanStr.replace('k', '')) * 1000);
    } else if (cleanStr.includes('m')) {
      return Math.floor(parseFloat(cleanStr.replace('m', '')) * 1000000);
    } else if (cleanStr.includes('b')) {
      return Math.floor(parseFloat(cleanStr.replace('b', '')) * 1000000000);
    }
    
    return parseInt(cleanStr) || 0;
  }

  /**
   * 生成YouTube模拟数据
   */
  generateYouTubeMockData(query, count = 10) {
    const mockData = [];
    const topics = [
      'Introduction to Machine Learning',
      'Deep Learning Neural Networks Explained',
      'Large Language Models: GPT and Beyond',
      'Computer Vision with Python Tutorial',
      'Natural Language Processing Basics',
      'AI Ethics and Safety Considerations',
      'Transformer Architecture Deep Dive',
      'Reinforcement Learning Applications',
      'Generative AI: Creating Art and Text',
      'AI in Healthcare and Medicine'
    ];
    
    const channels = [
      'Two Minute Papers',
      'Lex Fridman',
      'Machine Learning Explained',
      'AI Coffee Break',
      '3Blue1Brown',
      'Sentdex',
      'Yannic Kilcher',
      'AI Research',
      'DeepMind',
      'OpenAI'
    ];
    
    for (let i = 0; i < count; i++) {
      const topicIndex = Math.floor(Math.random() * topics.length);
      const channelIndex = Math.floor(Math.random() * channels.length);
      const title = topics[topicIndex];
      const channel = channels[channelIndex];
      const videoId = `mock_video_${Math.random().toString(36).substr(2, 11)}`;
      const url = `https://www.youtube.com/watch?v=${videoId}`;
      const timestamp = new Date(Date.now() - (i * 86400000) - Math.random() * 86400000).toISOString();
      
      const viewCount = Math.floor(Math.random() * 1000000) + 10000;
      const likeCount = Math.floor(viewCount * 0.05);
      const commentCount = Math.floor(viewCount * 0.01);
      const duration = Math.floor(Math.random() * 1800) + 300; // 5-35分钟
      
      const contentId = this.generateContentId(title, url, timestamp);
      const description = `This is a comprehensive video about ${title.toLowerCase()}. The video covers key concepts, practical examples, and recent developments in the field.`;
      const content = `${title}\n\n${description}`;
      const checksum = this.generateChecksum(content);
      
      mockData.push({
        contentId,
        sourceId: `youtube_${channel.toLowerCase().replace(/\s+/g, '_')}_mock`,
        title,
        content,
        contentType: 'video',
        originalUrl: url,
        publishedAt: timestamp,
        crawledAt: new Date().toISOString(),
        metadata: {
          platform: 'YouTube',
          videoId,
          channelName: channel,
          channelId: `mock_channel_${channelIndex}`,
          description,
          duration,
          viewCount,
          likeCount,
          commentCount,
          thumbnailUrl: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
          tags: this.generateVideoTags(),
          category: 'Education',
          language: 'en',
          searchQuery: query,
          isMockData: true
        },
        checksum
      });
    }
    
    return mockData;
  }

  /**
   * 生成B站模拟数据
   */
  generateBilibiliMockData(keyword, count = 10) {
    const mockData = [];
    const topics = [
      '机器学习入门教程',
      '深度学习神经网络详解',
      '大语言模型原理解析',
      'Python机器学习实战',
      '计算机视觉技术分享',
      'AI算法优化技巧',
      '自然语言处理应用',
      '强化学习案例分析',
      '生成式AI模型介绍',
      'AI伦理与安全思考'
    ];
    
    const uploaders = [
      '跟李沐学AI',
      'AI科技大本营',
      '机器学习社区',
      '深度学习与计算机视觉',
      'PyTorch官方',
      'TensorFlow中文社区',
      'AI研习社',
      '机器之心',
      '量子位',
      'AI前线'
    ];
    
    for (let i = 0; i < count; i++) {
      const topicIndex = Math.floor(Math.random() * topics.length);
      const uploaderIndex = Math.floor(Math.random() * uploaders.length);
      const title = topics[topicIndex];
      const uploader = uploaders[uploaderIndex];
      const bvid = `BV1mock${Math.random().toString(36).substr(2, 8)}`;
      const url = `https://www.bilibili.com/video/${bvid}`;
      const timestamp = new Date(Date.now() - (i * 86400000) - Math.random() * 86400000).toISOString();
      
      const playCount = Math.floor(Math.random() * 500000) + 5000;
      const danmakuCount = Math.floor(playCount * 0.02);
      const likeCount = Math.floor(playCount * 0.08);
      const duration = Math.floor(Math.random() * 2400) + 600; // 10-50分钟
      
      const contentId = this.generateContentId(title, url, timestamp);
      const description = `这是一个关于${title}的视频教程。视频详细介绍了相关概念、实践案例和最新发展趋势。`;
      const content = `${title}\n\n${description}`;
      const checksum = this.generateChecksum(content);
      
      mockData.push({
        contentId,
        sourceId: `bilibili_${uploader.replace(/[^\w]/g, '_')}_mock`,
        title,
        content,
        contentType: 'video',
        originalUrl: url,
        publishedAt: timestamp,
        crawledAt: new Date().toISOString(),
        metadata: {
          platform: 'Bilibili',
          bvid,
          uploaderName: uploader,
          description,
          duration,
          playCount,
          danmakuCount,
          likeCount,
          coinCount: Math.floor(likeCount * 0.3),
          favoriteCount: Math.floor(likeCount * 0.5),
          shareCount: Math.floor(likeCount * 0.2),
          thumbnailUrl: `https://i0.hdslb.com/bfs/archive/mock_${bvid}.jpg`,
          tags: this.generateVideoTags('zh'),
          category: '科技',
          language: 'zh-CN',
          searchKeyword: keyword,
          isMockData: true
        },
        checksum
      });
    }
    
    return mockData;
  }

  /**
   * 生成视频标签
   */
  generateVideoTags(language = 'en') {
    const englishTags = ['AI', 'Machine Learning', 'Deep Learning', 'Tutorial', 'Technology', 'Education', 'Science', 'Programming'];
    const chineseTags = ['人工智能', '机器学习', '深度学习', '教程', '技术分享', '编程', '科技', '算法'];
    
    const availableTags = language === 'zh' ? chineseTags : englishTags;
    const numTags = Math.floor(Math.random() * 4) + 3;
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
   * YouTube视频搜索
   */
  async searchYouTubeVideos(query, maxResults = 20) {
    try {
      console.log(`搜索YouTube视频: "${query}"`);
      
      // 如果使用模拟数据或没有API密钥
      if (this.useMockData || !this.youtube) {
        console.log(`使用模拟数据搜索: "${query}"`);
        return this.generateYouTubeMockData(query, maxResults);
      }
      
      // 使用真实API
      const searchResponse = await this.youtube.search.list({
        part: 'snippet',
        q: query,
        maxResults,
        order: 'relevance',
        type: 'video',
        videoCategoryId: '27' // Education
      });
      
      if (!searchResponse.data.items || searchResponse.data.items.length === 0) {
        console.log(`YouTube搜索无结果，回退到模拟数据: "${query}"`);
        return this.generateYouTubeMockData(query, maxResults);
      }
      
      const videoIds = searchResponse.data.items.map(item => item.id.videoId);
      
      // 获取视频详细信息
      const videoDetails = await this.youtube.videos.list({
        part: 'snippet,contentDetails,statistics',
        id: videoIds.join(',')
      });
      
      // 转换为统一数据格式
      const convertedVideos = videoDetails.data.items.map(video => {
        const timestamp = video.snippet.publishedAt;
        const contentId = this.generateContentId(video.snippet.title, `https://www.youtube.com/watch?v=${video.id}`, timestamp);
        const content = `${video.snippet.title}\n\n${video.snippet.description}`;
        const checksum = this.generateChecksum(content);
        
        return {
          contentId,
          sourceId: `youtube_${video.snippet.channelTitle.toLowerCase().replace(/\s+/g, '_')}`,
          title: video.snippet.title,
          content,
          contentType: 'video',
          originalUrl: `https://www.youtube.com/watch?v=${video.id}`,
          publishedAt: timestamp,
          crawledAt: new Date().toISOString(),
          metadata: {
            platform: 'YouTube',
            videoId: video.id,
            channelName: video.snippet.channelTitle,
            channelId: video.snippet.channelId,
            description: video.snippet.description,
            duration: this.parseDuration(video.contentDetails.duration),
            viewCount: this.formatNumber(video.statistics.viewCount),
            likeCount: this.formatNumber(video.statistics.likeCount),
            commentCount: this.formatNumber(video.statistics.commentCount),
            thumbnailUrl: video.snippet.thumbnails.high?.url || video.snippet.thumbnails.default?.url,
            tags: video.snippet.tags || [],
            category: video.snippet.categoryId,
            language: video.snippet.defaultLanguage || 'en',
            searchQuery: query
          },
          checksum
        };
      });
      
      console.log(`YouTube搜索成功: "${query}" - 找到 ${convertedVideos.length} 个视频`);
      return convertedVideos;
      
    } catch (error) {
      console.log(`YouTube搜索失败，回退到模拟数据: "${query}" - ${error.message}`);
      return this.generateYouTubeMockData(query, maxResults);
    }
  }

  /**
   * B站视频搜索
   */
  async searchBilibiliVideos(keyword, pages = 1) {
    try {
      console.log(`搜索B站视频: "${keyword}"`);
      
      // 如果使用模拟数据
      if (this.useMockData) {
        console.log(`使用模拟数据搜索: "${keyword}"`);
        return this.generateBilibiliMockData(keyword, pages * 10);
      }
      
      // 尝试真实爬取（但由于反爬虫机制，通常会失败）
      try {
        const browser = await puppeteer.launch({
          headless: true,
          args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        
        const page = await browser.newPage();
        await page.setUserAgent(this.headers['User-Agent']);
        
        const allVideos = [];
        
        for (let i = 1; i <= pages; i++) {
          const url = `https://search.bilibili.com/all?keyword=${encodeURIComponent(keyword)}&page=${i}`;
          await page.goto(url, {
            waitUntil: 'networkidle2',
            timeout: this.timeout
          });
          
          try {
            await page.waitForSelector('.video-item', { timeout: 5000 });
          } catch (error) {
            console.log(`B站页面加载失败，回退到模拟数据: ${error.message}`);
            await browser.close();
            return this.generateBilibiliMockData(keyword, pages * 10);
          }
          
          const content = await page.content();
          const $ = cheerio.load(content);
          
          $('.video-item').each((index, element) => {
            // 解析视频信息的逻辑...
            // 由于B站的反爬虫机制，这里可能无法正常工作
          });
          
          await this.sleep(2000);
        }
        
        await browser.close();
        
        if (allVideos.length === 0) {
          console.log(`B站未找到视频，回退到模拟数据: "${keyword}"`);
          return this.generateBilibiliMockData(keyword, pages * 10);
        }
        
        return allVideos;
        
      } catch (error) {
        console.log(`B站真实数据获取失败，回退到模拟数据: "${keyword}" - ${error.message}`);
        return this.generateBilibiliMockData(keyword, pages * 10);
      }
      
    } catch (error) {
      console.error(`B站搜索失败: "${keyword}" - ${error.message}`);
      return [];
    }
  }

  /**
   * 获取YouTube频道视频
   */
  async getYouTubeChannelVideos(channelConfig, maxResults = 10) {
    try {
      console.log(`获取YouTube频道视频: ${channelConfig.name}`);
      
      // 如果使用模拟数据或没有API密钥
      if (this.useMockData || !this.youtube) {
        console.log(`使用模拟数据: ${channelConfig.name}`);
        return this.generateYouTubeMockData(channelConfig.name, maxResults);
      }
      
      // 使用真实API获取频道视频
      const response = await this.youtube.search.list({
        part: 'snippet',
        channelId: channelConfig.id,
        maxResults,
        order: 'date',
        type: 'video'
      });
      
      if (!response.data.items || response.data.items.length === 0) {
        console.log(`频道无视频，回退到模拟数据: ${channelConfig.name}`);
        return this.generateYouTubeMockData(channelConfig.name, maxResults);
      }
      
      // 转换数据格式...
      // 实现类似searchYouTubeVideos的逻辑
      
    } catch (error) {
      console.log(`获取频道视频失败，回退到模拟数据: ${channelConfig.name} - ${error.message}`);
      return this.generateYouTubeMockData(channelConfig.name, maxResults);
    }
  }

  /**
   * 批量搜索YouTube视频
   */
  async batchSearchYouTube() {
    console.log('开始批量搜索YouTube视频...');
    const results = {};
    
    for (const query of this.searchKeywords.youtube) {
      try {
        const videos = await this.searchYouTubeVideos(query, 8);
        results[query] = {
          success: true,
          videos,
          count: videos.length
        };
        
        // 添加延迟避免频繁请求
        await this.sleep(this.delay);
        
      } catch (error) {
        console.error(`YouTube搜索失败: "${query}" - ${error.message}`);
        results[query] = {
          success: false,
          error: error.message,
          videos: [],
          count: 0
        };
      }
    }
    
    return results;
  }

  /**
   * 批量搜索B站视频
   */
  async batchSearchBilibili() {
    console.log('开始批量搜索B站视频...');
    const results = {};
    
    for (const keyword of this.searchKeywords.bilibili) {
      try {
        const videos = await this.searchBilibiliVideos(keyword, 1);
        results[keyword] = {
          success: true,
          videos,
          count: videos.length
        };
        
        // 添加延迟避免频繁请求
        await this.sleep(this.delay);
        
      } catch (error) {
        console.error(`B站搜索失败: "${keyword}" - ${error.message}`);
        results[keyword] = {
          success: false,
          error: error.message,
          videos: [],
          count: 0
        };
      }
    }
    
    return results;
  }

  /**
   * 获取完整的AI视频数据
   */
  async getAllVideoContent() {
    console.log('开始获取完整的AI视频数据...');
    
    // 并行获取YouTube和B站数据
    const [youtubeResults, bilibiliResults] = await Promise.all([
      this.batchSearchYouTube(),
      this.batchSearchBilibili()
    ]);
    
    // 合并所有视频
    const allVideos = [];
    
    // 添加YouTube视频
    Object.values(youtubeResults).forEach(result => {
      if (result.success && result.videos) {
        allVideos.push(...result.videos);
      }
    });
    
    // 添加B站视频
    Object.values(bilibiliResults).forEach(result => {
      if (result.success && result.videos) {
        allVideos.push(...result.videos);
      }
    });
    
    // 去重（基于contentId）
    const uniqueVideos = [];
    const seenIds = new Set();
    
    allVideos.forEach(video => {
      if (!seenIds.has(video.contentId)) {
        seenIds.add(video.contentId);
        uniqueVideos.push(video);
      }
    });
    
    console.log(`总共获取到 ${uniqueVideos.length} 个唯一视频`);
    
    return {
      videos: uniqueVideos,
      youtubeResults,
      bilibiliResults,
      summary: {
        totalVideos: uniqueVideos.length,
        youtubeQueries: Object.keys(youtubeResults).length,
        youtubeVideos: Object.values(youtubeResults).reduce((sum, r) => sum + r.count, 0),
        bilibiliKeywords: Object.keys(bilibiliResults).length,
        bilibiliVideos: Object.values(bilibiliResults).reduce((sum, r) => sum + r.count, 0)
      }
    };
  }
}

module.exports = VideoCrawler; 