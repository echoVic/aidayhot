const Parser = require('rss-parser');
const axios = require('axios');
const crypto = require('crypto');

class RSSCrawler {
  constructor() {
    this.parser = new Parser({
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
  }

  // 获取单个RSS订阅源的内容
  async fetchRSSFeed(url, sourceInfo = {}) {
    try {
      console.log(`开始爬取RSS源: ${url}`);
      
      const feed = await this.parser.parseURL(url);
      
      console.log(`RSS源标题: ${feed.title}`);
      console.log(`获取到 ${feed.items.length} 条内容`);

      const items = feed.items.map(item => {
        // 生成内容ID
        const contentId = this.generateContentId(item.link || item.guid);
        
        return {
          contentId,
          sourceId: sourceInfo.sourceId || this.generateSourceId(url),
          originalUrl: item.link,
          title: item.title,
          content: item.content || item.contentSnippet || item.summary,
          contentType: 'html',
          author: item.creator || item.author,
          publishedAt: item.isoDate ? new Date(item.isoDate) : (item.pubDate ? new Date(item.pubDate) : null),
          crawledAt: new Date(),
          metadata: {
            feedTitle: feed.title,
            feedDescription: feed.description,
            feedLink: feed.link,
            categories: item.categories || [],
            guid: item.guid
          },
          checksum: this.calculateChecksum(item.content || item.contentSnippet || item.title)
        };
      });

      return {
        feedInfo: {
          title: feed.title,
          description: feed.description,
          link: feed.link,
          lastBuildDate: feed.lastBuildDate,
          language: feed.language
        },
        items,
        crawledAt: new Date(),
        success: true
      };
    } catch (error) {
      console.error(`RSS爬取失败 ${url}:`, error);
      return {
        error: error.message,
        success: false,
        crawledAt: new Date()
      };
    }
  }

  // 批量爬取多个RSS源
  async fetchMultipleRSSFeeds(rssUrls) {
    const results = {};
    
    for (const [name, url] of Object.entries(rssUrls)) {
      try {
        console.log(`正在处理RSS源: ${name}...`);
        results[name] = await this.fetchRSSFeed(url, { sourceId: name });
        
        // 延迟，避免频繁请求
        await this.delay(1000);
      } catch (error) {
        console.error(`处理RSS源失败 ${name}:`, error);
        results[name] = { 
          error: error.message, 
          success: false,
          crawledAt: new Date()
        };
      }
    }
    
    return results;
  }

  // 生成内容ID
  generateContentId(url) {
    if (!url) {
      return crypto.randomUUID();
    }
    return crypto.createHash('md5').update(url).digest('hex');
  }

  // 生成源ID
  generateSourceId(url) {
    return crypto.createHash('md5').update(url).digest('hex').substring(0, 8);
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

  // 获取AI相关的RSS源列表
  getAIRSSFeeds() {
    return {
      'Google AI Blog': 'http://googleaiblog.blogspot.com/atom.xml',
      'OpenAI Blog': 'https://openai.com/blog/rss.xml',
      'Microsoft Research Blog': 'https://www.microsoft.com/en-us/research/feed/',
      'Towards Data Science': 'https://towardsdatascience.com/feed',
      'KDnuggets': 'https://www.kdnuggets.com/feed',
      'Analytics Vidhya': 'https://www.analyticsvidhya.com/blog/feed/',
      '机器之心': 'https://www.jiqizhixin.com/rss',
      '量子位': 'https://www.qbitai.com/feed'
    };
  }

  // 测试单个RSS源
  async testRSSFeed(url) {
    console.log(`测试RSS源: ${url}`);
    const result = await this.fetchRSSFeed(url);
    
    if (result.success) {
      console.log('✅ RSS源测试成功');
      console.log(`   - 订阅源: ${result.feedInfo.title}`);
      console.log(`   - 描述: ${result.feedInfo.description}`);
      console.log(`   - 链接: ${result.feedInfo.link}`);
      console.log(`   - 文章数量: ${result.items.length}`);
      
      if (result.items.length > 0) {
        console.log(`   - 示例文章: ${result.items[0].title}`);
        console.log(`   - 发布时间: ${result.items[0].publishedAt}`);
      }
    } else {
      console.log('❌ RSS源测试失败');
      console.log(`   - 错误: ${result.error}`);
    }
    
    return result;
  }

  // 测试所有预定义的AI RSS源
  async testAllAIRSSFeeds() {
    console.log('开始测试所有AI相关RSS源...\n');
    
    const rssFeeds = this.getAIRSSFeeds();
    const results = await this.fetchMultipleRSSFeeds(rssFeeds);
    
    console.log('\n=== 测试结果汇总 ===');
    let successCount = 0;
    let totalItems = 0;
    
    for (const [name, result] of Object.entries(results)) {
      if (result.success) {
        successCount++;
        totalItems += result.items.length;
        console.log(`✅ ${name}: ${result.items.length} 篇文章`);
      } else {
        console.log(`❌ ${name}: ${result.error}`);
      }
    }
    
    console.log(`\n总计: ${successCount}/${Object.keys(rssFeeds).length} 个源成功, 共获取 ${totalItems} 篇文章`);
    
    return results;
  }
}

module.exports = RSSCrawler; 