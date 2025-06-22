const axios = require('axios');
const crypto = require('crypto');

/**
 * 社交媒体爬虫系统
 * 用于获取AI相关的社交媒体内容，包括Twitter/X、微博等平台
 */
class SocialMediaCrawler {
  constructor(options = {}) {
    this.delay = 2000; // 请求延迟 (ms)
    this.maxRetries = 3; // 最大重试次数
    this.timeout = 30000; // 请求超时时间 (ms)
    this.useMockData = options.useMockData || false; // 是否使用模拟数据
    
    // Twitter API配置
    this.twitterConfig = {
      apiKey: process.env.TWITTER_API_KEY,
      apiSecret: process.env.TWITTER_API_SECRET,
      accessToken: process.env.TWITTER_ACCESS_TOKEN,
      accessSecret: process.env.TWITTER_ACCESS_SECRET,
      bearerToken: process.env.TWITTER_BEARER_TOKEN
    };
    
    // 重要的AI相关账号列表
    this.aiAccounts = {
      twitter: [
        'OpenAI',
        'DeepMind', 
        'AndrewYNg',
        'ylecun',
        'karpathy',
        'jeffdean',
        'goodfellow_ian',
        'GaryMarcus',
        'sama',
        'demishassabis'
      ],
      weibo: [
        '李开复',
        '微软亚洲研究院',
        '百度AI',
        '商汤科技SenseTime',
        '科大讯飞'
      ]
    };
    
    // 设置HTTP请求头
    this.headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Accept': 'application/json, text/plain, */*',
      'Accept-Language': 'en-US,en;q=0.5',
      'Accept-Encoding': 'gzip, deflate',
      'Connection': 'keep-alive'
    };
  }

  /**
   * 生成内容唯一标识
   */
  generateContentId(text, timestamp, platform) {
    const data = `${platform}_${text}_${timestamp}`;
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
   * 生成模拟Twitter数据
   */
  generateMockTwitterData(username, count = 10) {
    const mockTweets = [];
    const topics = [
      'Excited to announce our latest AI breakthrough',
      'New research paper on transformer models',
      'The future of AI safety and alignment',
      'Breaking: GPT-5 updates and improvements',
      'Computer vision advances in 2024',
      'Natural language processing trends',
      'Open source AI models are changing everything',
      'Ethical AI development practices',
      'Machine learning democratization',
      'AI in healthcare: promising results'
    ];
    
    const hashtags = ['#AI', '#MachineLearning', '#DeepLearning', '#NLP', '#ComputerVision', '#AGI', '#OpenAI', '#Research'];
    
    for (let i = 0; i < count; i++) {
      const topicIndex = Math.floor(Math.random() * topics.length);
      const topic = topics[topicIndex];
      const hashtagCount = Math.floor(Math.random() * 3) + 1;
      const selectedHashtags = [];
      
      for (let j = 0; j < hashtagCount; j++) {
        const hashtag = hashtags[Math.floor(Math.random() * hashtags.length)];
        if (!selectedHashtags.includes(hashtag)) {
          selectedHashtags.push(hashtag);
        }
      }
      
      const text = `${topic} ${selectedHashtags.join(' ')}`;
      const timestamp = new Date(Date.now() - (i * 3600000) - Math.random() * 86400000).toISOString();
      
      const contentId = this.generateContentId(text, timestamp, 'twitter');
      const checksum = this.generateChecksum(text);
      
      mockTweets.push({
        contentId,
        sourceId: 'twitter_mock',
        title: `Tweet by @${username}`,
        content: text,
        contentType: 'social_media_post',
        originalUrl: `https://twitter.com/${username}/status/${Math.floor(Math.random() * 9999999999999999)}`,
        publishedAt: timestamp,
        crawledAt: new Date().toISOString(),
        metadata: {
          platform: 'twitter',
          username: username,
          userId: `${Math.floor(Math.random() * 9999999999)}`,
          retweets: Math.floor(Math.random() * 1000),
          likes: Math.floor(Math.random() * 5000),
          replies: Math.floor(Math.random() * 200),
          hashtags: selectedHashtags,
          mentions: [],
          isRetweet: false,
          isMockData: true
        },
        checksum
      });
    }
    
    return mockTweets;
  }

  /**
   * 生成模拟微博数据
   */
  generateMockWeiboData(username, count = 10) {
    const mockPosts = [];
    const topics = [
      '人工智能技术新突破，未来可期！',
      '最新AI研究论文解读',
      '机器学习在医疗领域的应用前景',
      'ChatGPT的技术原理深度分析',
      '计算机视觉技术的最新进展',
      '自然语言处理技术趋势',
      '开源AI模型推动行业发展',
      'AI伦理和安全问题探讨',
      '深度学习算法优化技巧',
      '人工智能赋能传统行业'
    ];
    
    const hashtags = ['#人工智能', '#机器学习', '#深度学习', '#AI研究', '#科技前沿', '#技术分享'];
    
    for (let i = 0; i < count; i++) {
      const topicIndex = Math.floor(Math.random() * topics.length);
      const topic = topics[topicIndex];
      const hashtag = hashtags[Math.floor(Math.random() * hashtags.length)];
      
      const text = `${topic} ${hashtag}`;
      const timestamp = new Date(Date.now() - (i * 3600000) - Math.random() * 86400000).toISOString();
      
      const contentId = this.generateContentId(text, timestamp, 'weibo');
      const checksum = this.generateChecksum(text);
      
      mockPosts.push({
        contentId,
        sourceId: 'weibo_mock',
        title: `${username}的微博`,
        content: text,
        contentType: 'social_media_post',
        originalUrl: `https://weibo.com/u/${Math.floor(Math.random() * 9999999999)}/${Math.floor(Math.random() * 9999999999999999)}`,
        publishedAt: timestamp,
        crawledAt: new Date().toISOString(),
        metadata: {
          platform: 'weibo',
          username: username,
          userId: `${Math.floor(Math.random() * 9999999999)}`,
          reposts: Math.floor(Math.random() * 500),
          comments: Math.floor(Math.random() * 200),
          likes: Math.floor(Math.random() * 2000),
          hashtags: [hashtag],
          mentions: [],
          isMockData: true
        },
        checksum
      });
    }
    
    return mockPosts;
  }

  /**
   * 获取Twitter用户时间线（模拟版本）
   */
  async getTwitterUserTimeline(username, count = 20) {
    try {
      console.log(`获取Twitter用户 @${username} 的时间线...`);
      
      // 检查是否配置了Twitter API密钥
      if (!this.twitterConfig.bearerToken && !this.useMockData) {
        console.log('未配置Twitter API密钥，使用模拟数据');
        return this.generateMockTwitterData(username, count);
      }
      
      // 如果启用模拟数据模式，直接返回模拟数据
      if (this.useMockData) {
        console.log(`使用模拟数据获取 @${username} 的推文`);
        return this.generateMockTwitterData(username, count);
      }
      
      // 尝试使用Twitter API v2
      try {
        const response = await axios.get('https://api.twitter.com/2/users/by/username/' + username, {
          headers: {
            'Authorization': `Bearer ${this.twitterConfig.bearerToken}`,
            'Content-Type': 'application/json'
          },
          timeout: this.timeout
        });
        
        const userId = response.data.data.id;
        
        // 获取用户推文
        const tweetsResponse = await axios.get(`https://api.twitter.com/2/users/${userId}/tweets`, {
          headers: {
            'Authorization': `Bearer ${this.twitterConfig.bearerToken}`,
            'Content-Type': 'application/json'
          },
          params: {
            max_results: Math.min(count, 100),
            'tweet.fields': 'created_at,public_metrics,context_annotations,entities',
            'user.fields': 'name,username,profile_image_url'
          },
          timeout: this.timeout
        });
        
        const tweets = tweetsResponse.data.data || [];
        
        return tweets.map(tweet => {
          const contentId = this.generateContentId(tweet.text, tweet.created_at, 'twitter');
          const checksum = this.generateChecksum(tweet.text);
          
          return {
            contentId,
            sourceId: 'twitter_api',
            title: `Tweet by @${username}`,
            content: tweet.text,
            contentType: 'social_media_post',
            originalUrl: `https://twitter.com/${username}/status/${tweet.id}`,
            publishedAt: tweet.created_at,
            crawledAt: new Date().toISOString(),
            metadata: {
              platform: 'twitter',
              username: username,
              userId: userId,
              tweetId: tweet.id,
              retweets: tweet.public_metrics?.retweet_count || 0,
              likes: tweet.public_metrics?.like_count || 0,
              replies: tweet.public_metrics?.reply_count || 0,
              quotes: tweet.public_metrics?.quote_count || 0,
              hashtags: tweet.entities?.hashtags?.map(h => h.tag) || [],
              mentions: tweet.entities?.mentions?.map(m => m.username) || [],
              urls: tweet.entities?.urls?.map(u => u.expanded_url) || [],
              contextAnnotations: tweet.context_annotations || []
            },
            checksum
          };
        });
        
      } catch (apiError) {
        console.log(`Twitter API请求失败，回退到模拟数据: ${apiError.message}`);
        return this.generateMockTwitterData(username, count);
      }
      
    } catch (error) {
      console.error(`获取Twitter时间线失败 (@${username}):`, error.message);
      // 出错时回退到模拟数据
      return this.generateMockTwitterData(username, count);
    }
  }

  /**
   * 搜索Twitter AI相关内容
   */
  async searchTwitterAI(query = 'artificial intelligence', count = 20) {
    try {
      console.log(`搜索Twitter AI相关内容: "${query}"`);
      
      // 如果启用模拟数据模式或没有API密钥
      if (this.useMockData || !this.twitterConfig.bearerToken) {
        console.log(`使用模拟数据搜索: "${query}"`);
        
        // 生成多个模拟账号的数据
        const mockAccounts = ['AI_Researcher', 'TechExpert', 'MLEngineer', 'DataScientist'];
        const allTweets = [];
        
        for (const account of mockAccounts) {
          const tweets = this.generateMockTwitterData(account, Math.floor(count / mockAccounts.length));
          // 修改推文内容以匹配搜索查询
          tweets.forEach(tweet => {
            tweet.content = `${query}: ${tweet.content}`;
            tweet.metadata.searchQuery = query;
          });
          allTweets.push(...tweets);
        }
        
        return allTweets.slice(0, count);
      }
      
      // 尝试使用Twitter API
      try {
        const response = await axios.get('https://api.twitter.com/2/tweets/search/recent', {
          headers: {
            'Authorization': `Bearer ${this.twitterConfig.bearerToken}`,
            'Content-Type': 'application/json'
          },
          params: {
            query: `${query} -is:retweet lang:en`,
            max_results: Math.min(count, 100),
            'tweet.fields': 'created_at,public_metrics,context_annotations,entities,author_id',
            'user.fields': 'name,username,profile_image_url',
            expansions: 'author_id'
          },
          timeout: this.timeout
        });
        
        const tweets = response.data.data || [];
        const users = response.data.includes?.users || [];
        
        return tweets.map(tweet => {
          const author = users.find(user => user.id === tweet.author_id);
          const contentId = this.generateContentId(tweet.text, tweet.created_at, 'twitter');
          const checksum = this.generateChecksum(tweet.text);
          
          return {
            contentId,
            sourceId: 'twitter_search_api',
            title: `Tweet by @${author?.username || 'unknown'}`,
            content: tweet.text,
            contentType: 'social_media_post',
            originalUrl: `https://twitter.com/${author?.username || 'i'}/status/${tweet.id}`,
            publishedAt: tweet.created_at,
            crawledAt: new Date().toISOString(),
            metadata: {
              platform: 'twitter',
              username: author?.username,
              displayName: author?.name,
              userId: tweet.author_id,
              tweetId: tweet.id,
              searchQuery: query,
              retweets: tweet.public_metrics?.retweet_count || 0,
              likes: tweet.public_metrics?.like_count || 0,
              replies: tweet.public_metrics?.reply_count || 0,
              quotes: tweet.public_metrics?.quote_count || 0,
              hashtags: tweet.entities?.hashtags?.map(h => h.tag) || [],
              mentions: tweet.entities?.mentions?.map(m => m.username) || [],
              urls: tweet.entities?.urls?.map(u => u.expanded_url) || [],
              contextAnnotations: tweet.context_annotations || []
            },
            checksum
          };
        });
        
      } catch (apiError) {
        console.log(`Twitter搜索API请求失败，回退到模拟数据: ${apiError.message}`);
        const mockTweets = this.generateMockTwitterData('AISearchResult', count);
        mockTweets.forEach(tweet => {
          tweet.content = `${query}: ${tweet.content}`;
          tweet.metadata.searchQuery = query;
        });
        return mockTweets;
      }
      
    } catch (error) {
      console.error(`搜索Twitter失败 (查询: "${query}"):`, error.message);
      return [];
    }
  }

  /**
   * 获取微博内容（模拟版本）
   */
  async getWeiboContent(username, count = 20) {
    try {
      console.log(`获取微博用户 ${username} 的内容...`);
      
      // 由于微博API限制，主要使用模拟数据
      console.log(`使用模拟数据获取 ${username} 的微博内容`);
      return this.generateMockWeiboData(username, count);
      
    } catch (error) {
      console.error(`获取微博内容失败 (${username}):`, error.message);
      return [];
    }
  }

  /**
   * 批量获取多个Twitter账号的内容
   */
  async batchGetTwitterAccounts(usernames, tweetsPerUser = 10) {
    const results = {};
    
    for (const username of usernames) {
      console.log(`处理Twitter账号: @${username}`);
      
      try {
        const tweets = await this.getTwitterUserTimeline(username, tweetsPerUser);
        results[username] = {
          success: true,
          tweets,
          count: tweets.length
        };
        
        console.log(`@${username}: 获取了 ${tweets.length} 条推文`);
        
        // 添加延迟避免频繁请求
        await this.sleep(this.delay);
        
      } catch (error) {
        console.error(`处理 @${username} 失败:`, error.message);
        results[username] = {
          success: false,
          error: error.message,
          tweets: [],
          count: 0
        };
      }
    }
    
    return results;
  }

  /**
   * 批量获取多个微博账号的内容
   */
  async batchGetWeiboAccounts(usernames, postsPerUser = 10) {
    const results = {};
    
    for (const username of usernames) {
      console.log(`处理微博账号: ${username}`);
      
      try {
        const posts = await this.getWeiboContent(username, postsPerUser);
        results[username] = {
          success: true,
          posts,
          count: posts.length
        };
        
        console.log(`${username}: 获取了 ${posts.length} 条微博`);
        
        // 添加延迟避免频繁请求
        await this.sleep(this.delay);
        
      } catch (error) {
        console.error(`处理 ${username} 失败:`, error.message);
        results[username] = {
          success: false,
          error: error.message,
          posts: [],
          count: 0
        };
      }
    }
    
    return results;
  }

  /**
   * 获取完整的AI社交媒体数据
   */
  async getAISocialMediaData() {
    console.log('开始获取AI相关社交媒体数据...');
    
    // 获取Twitter数据
    console.log('\n=== 获取Twitter数据 ===');
    const twitterResults = await this.batchGetTwitterAccounts(this.aiAccounts.twitter.slice(0, 5), 8);
    
    // 搜索AI相关推文
    console.log('\n=== 搜索AI相关推文 ===');
    const aiSearchQueries = ['artificial intelligence', 'machine learning', 'deep learning', 'ChatGPT', 'OpenAI'];
    const searchResults = {};
    
    for (const query of aiSearchQueries) {
      try {
        const tweets = await this.searchTwitterAI(query, 10);
        searchResults[query] = tweets;
        console.log(`搜索 "${query}": 找到 ${tweets.length} 条推文`);
        await this.sleep(this.delay);
      } catch (error) {
        console.error(`搜索 "${query}" 失败:`, error.message);
        searchResults[query] = [];
      }
    }
    
    // 获取微博数据
    console.log('\n=== 获取微博数据 ===');
    const weiboResults = await this.batchGetWeiboAccounts(this.aiAccounts.weibo.slice(0, 3), 8);
    
    // 合并所有数据
    const allPosts = [];
    
    // 添加Twitter账号数据
    Object.values(twitterResults).forEach(result => {
      if (result.success && result.tweets) {
        allPosts.push(...result.tweets);
      }
    });
    
    // 添加Twitter搜索数据
    Object.values(searchResults).forEach(tweets => {
      allPosts.push(...tweets);
    });
    
    // 添加微博数据
    Object.values(weiboResults).forEach(result => {
      if (result.success && result.posts) {
        allPosts.push(...result.posts);
      }
    });
    
    // 去重（基于contentId）
    const uniquePosts = [];
    const seenIds = new Set();
    
    allPosts.forEach(post => {
      if (!seenIds.has(post.contentId)) {
        seenIds.add(post.contentId);
        uniquePosts.push(post);
      }
    });
    
    console.log(`\n总共获取到 ${uniquePosts.length} 条唯一社交媒体内容`);
    
    return {
      posts: uniquePosts,
      twitterResults,
      searchResults,
      weiboResults,
      summary: {
        totalPosts: uniquePosts.length,
        twitterAccounts: Object.keys(twitterResults).length,
        twitterAccountPosts: Object.values(twitterResults).reduce((sum, r) => sum + r.count, 0),
        searchQueries: aiSearchQueries.length,
        searchPosts: Object.values(searchResults).reduce((sum, tweets) => sum + tweets.length, 0),
        weiboAccounts: Object.keys(weiboResults).length,
        weiboPosts: Object.values(weiboResults).reduce((sum, r) => sum + r.count, 0)
      }
    };
  }
}

module.exports = SocialMediaCrawler; 