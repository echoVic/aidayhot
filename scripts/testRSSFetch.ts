
interface RSSItem {
  title: string;
  link: string;
  pubDate?: string;
  description?: string;
}

interface RSSFeed {
  title: string;
  items: RSSItem[];
  error?: string;
}

async function fetchRSS(url: string): Promise<RSSFeed> {
  try {
    console.log(`🔍 正在抓取: ${url}`);
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; RSSBot/1.0)',
        'Accept': 'application/rss+xml, application/xml, text/xml, */*'
      },
      // @ts-ignore
      timeout: 10000
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const xmlText = await response.text();
    
    // 简单的XML解析
    const titleMatch = xmlText.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1] : '未知标题';
    
    // 提取RSS项目
    const itemMatches = xmlText.match(/<item[^>]*>([\s\S]*?)<\/item>/gi);
    const items: RSSItem[] = [];
    
    if (itemMatches) {
      for (const itemMatch of itemMatches.slice(0, 5)) {
        const titleMatch = itemMatch.match(/<title[^>]*>([^<]+)<\/title>/i);
        const linkMatch = itemMatch.match(/<link[^>]*>([^<]+)<\/link>/i);
        const pubDateMatch = itemMatch.match(/<pubDate[^>]*>([^<]+)<\/pubDate>/i);
        const descMatch = itemMatch.match(/<description[^>]*>([^<]+)<\/description>/i);
        
        items.push({
          title: titleMatch ? titleMatch[1] : '无标题',
          link: linkMatch ? linkMatch[1] : '',
          pubDate: pubDateMatch ? pubDateMatch[1] : undefined,
          description: descMatch ? descMatch[1] : undefined
        });
      }
    }
    
    // 如果没有找到RSS项目，尝试Atom格式
    if (items.length === 0) {
      const entryMatches = xmlText.match(/<entry[^>]*>([\s\S]*?)<\/entry>/gi);
      if (entryMatches) {
        for (const entryMatch of entryMatches.slice(0, 5)) {
          const titleMatch = entryMatch.match(/<title[^>]*>([^<]+)<\/title>/i);
          const linkMatch = entryMatch.match(/<link[^>]*href="([^"]+)"/i);
          const pubDateMatch = entryMatch.match(/<published[^>]*>([^<]+)<\/published>/i);
          const summaryMatch = entryMatch.match(/<summary[^>]*>([^<]+)<\/summary>/i);
          
          items.push({
            title: titleMatch ? titleMatch[1] : '无标题',
            link: linkMatch ? linkMatch[1] : '',
            pubDate: pubDateMatch ? pubDateMatch[1] : undefined,
            description: summaryMatch ? summaryMatch[1] : undefined
          });
        }
      }
    }

    return {
      title,
      items
    };
  } catch (error) {
    return {
      title: '抓取失败',
      items: [],
      error: error instanceof Error ? error.message : '未知错误'
    };
  }
}

async function testRecommendedSources() {
  console.log('🧪 测试推荐信息源的RSS抓取功能...\n');

  const recommendedSources = [
    {
      name: 'Google AI Blog',
      url: 'https://blog.google/technology/ai/rss/',
      category: 'AI/机器学习'
    },
    {
      name: 'OpenAI News',
      url: 'https://openai.com/news/rss.xml',
      category: 'AI/机器学习'
    },
    {
      name: 'Berkeley AI Research',
      url: 'https://bair.berkeley.edu/blog/feed.xml',
      category: 'AI/机器学习'
    },
    {
      name: 'Google DeepMind Blog',
      url: 'https://deepmind.com/blog/feed/basic/',
      category: 'AI/机器学习'
    },
    {
      name: '量子位',
      url: 'https://www.qbitai.com/feed',
      category: 'AI/机器学习'
    },
    {
      name: 'AWS Machine Learning Blog',
      url: 'https://aws.amazon.com/blogs/amazon-ai/feed/',
      category: '技术/开发'
    },
    {
      name: 'Engineering at Meta',
      url: 'https://engineering.fb.com/feed/',
      category: '技术/开发'
    },
    {
      name: 'Google Developers Blog',
      url: 'https://developers.googleblog.com/feeds/posts/default',
      category: '技术/开发'
    },
    {
      name: 'Microsoft Azure Blog',
      url: 'https://azure.microsoft.com/en-us/blog/feed/',
      category: '技术/开发'
    },
    {
      name: 'The GitHub Blog',
      url: 'https://github.blog/feed/',
      category: '技术/开发'
    }
  ];

  const results = [];

  for (const source of recommendedSources) {
    console.log(`\n📡 测试: ${source.name}`);
    console.log(`   类别: ${source.category}`);
    console.log(`   URL: ${source.url}`);
    
    const feed = await fetchRSS(source.url);
    
    if (feed.error) {
      console.log(`   ❌ 抓取失败: ${feed.error}`);
      results.push({
        name: source.name,
        category: source.category,
        url: source.url,
        success: false,
        error: feed.error,
        itemCount: 0
      });
    } else {
      console.log(`   ✅ 抓取成功`);
      console.log(`   标题: ${feed.title}`);
      console.log(`   文章数: ${feed.items.length}`);
      
      if (feed.items.length > 0) {
        console.log(`   最新文章:`);
        feed.items.forEach((item, index) => {
          console.log(`     ${index + 1}. ${item.title}`);
          if (item.pubDate) {
            console.log(`        发布时间: ${item.pubDate}`);
          }
        });
      }
      
      results.push({
        name: source.name,
        category: source.category,
        url: source.url,
        success: true,
        error: null,
        itemCount: feed.items.length,
        title: feed.title
      });
    }
    
    // 避免请求过于频繁
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // 总结结果
  console.log('\n📊 测试结果总结:');
  console.log('='.repeat(50));
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  console.log(`✅ 成功抓取: ${successful.length} 个`);
  console.log(`❌ 抓取失败: ${failed.length} 个`);
  console.log(`📈 成功率: ${((successful.length / results.length) * 100).toFixed(1)}%`);
  
  if (successful.length > 0) {
    console.log('\n🎯 推荐激活的信息源:');
    successful.forEach((result, index) => {
      console.log(`${index + 1}. ${result.name} (${result.itemCount}篇文章)`);
    });
  }
  
  if (failed.length > 0) {
    console.log('\n⚠️ 需要检查的信息源:');
    failed.forEach((result, index) => {
      console.log(`${index + 1}. ${result.name} - ${result.error}`);
    });
  }
}

// 运行测试
testRecommendedSources(); 