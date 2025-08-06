import { RSSCrawler } from '../src/crawlers/RSSCrawler';

async function testAnthropicRSS() {
  console.log('🧪 测试 Anthropic RSS 源...\n');

  const anthropicRSSUrl = 'https://rsshub.app/anthropic/news';
  
  console.log(`📡 测试URL: ${anthropicRSSUrl}`);
  
  try {
    // 创建RSSCrawler实例
    const rssCrawler = new RSSCrawler({
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; RSSBot/1.0)'
      }
    });

    console.log('🔍 开始抓取...');
    
    const result = await rssCrawler.crawl(anthropicRSSUrl, {
      sourceName: 'Anthropic News',
      sourceCategory: 'AI/机器学习'
    });

    if (result.success && result.data) {
      const feed = result.data;
      console.log('✅ 抓取成功!');
      console.log(`📰 标题: ${feed.title}`);
      console.log(`📊 文章数: ${feed.items.length}`);
      console.log(`🔗 链接: ${feed.link}`);
      
      if (feed.items.length > 0) {
        console.log('\n📝 最新文章:');
        feed.items.slice(0, 5).forEach((item, index) => {
          console.log(`${index + 1}. ${item.title}`);
          console.log(`   链接: ${item.link}`);
          if (item.pubDate) {
            console.log(`   发布时间: ${item.pubDate}`);
          }
          if (item.description) {
            console.log(`   摘要: ${item.description.substring(0, 100)}...`);
          }
          console.log('');
        });
      }
      
      console.log('📈 抓取统计:');
      console.log(`   - 总文章数: ${feed.items.length}`);
      console.log(`   - 有发布时间: ${feed.items.filter(item => item.pubDate).length} 篇`);
      console.log(`   - 有描述: ${feed.items.filter(item => item.description).length} 篇`);
      
    } else {
      console.log('❌ 抓取失败:');
      console.log(`   错误: ${result.error}`);
    }
    
  } catch (error) {
    console.log('❌ 抓取异常:');
    console.log(`   错误: ${error instanceof Error ? error.message : '未知错误'}`);
  }
}

// 运行测试
testAnthropicRSS(); 