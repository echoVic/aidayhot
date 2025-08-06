import { RSSCrawler } from '../src/crawlers/RSSCrawler';
import { supabase } from './supabaseClient';

interface TestResult {
  sourceName: string;
  url: string;
  success: boolean;
  itemCount: number;
  error?: string;
  sampleTitle?: string;
  sampleLink?: string;
}

async function testMyCrawlerSystem() {
  console.log('🧪 测试你的RSSCrawler爬虫系统...\n');

  // 获取已激活的推荐信息源
  const { data: activeSources, error } = await supabase
    .from('feed_sources')
    .select('name, url, category')
    .eq('is_active', true)
    .in('name', [
      'Google AI Blog',
      'OpenAI News', 
      'Berkeley AI Research',
      'Google DeepMind Blog',
      '量子位',
      'AWS Machine Learning Blog',
      'Engineering at Meta',
      'Google Developers Blog',
      'Microsoft Azure Blog',
      'The GitHub Blog'
    ]);

  if (error) {
    console.error('❌ 获取信息源失败:', error);
    return;
  }

  if (!activeSources || activeSources.length === 0) {
    console.log('📭 没有找到激活的信息源');
    return;
  }

  console.log(`📊 找到 ${activeSources.length} 个激活的信息源\n`);

  // 创建你的RSSCrawler实例
  const rssCrawler = new RSSCrawler({
    timeout: 15000,
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; RSSBot/1.0)'
    }
  });

  const results: TestResult[] = [];

  // 测试每个信息源
  for (const source of activeSources) {
    console.log(`📡 测试: ${source.name}`);
    console.log(`   类别: ${source.category}`);
    console.log(`   URL: ${source.url}`);
    
    try {
      const result = await rssCrawler.crawl(source.url, {
        sourceName: source.name,
        sourceCategory: source.category
      });

      if (result.success && result.data) {
        const feed = result.data;
        console.log(`   ✅ 抓取成功`);
        console.log(`   标题: ${feed.title}`);
        console.log(`   文章数: ${feed.items.length}`);
        
        if (feed.items.length > 0) {
          const firstItem = feed.items[0];
          console.log(`   最新文章: ${firstItem.title}`);
          console.log(`   链接: ${firstItem.link}`);
          if (firstItem.pubDate) {
            console.log(`   发布时间: ${firstItem.pubDate}`);
          }
        }
        
        results.push({
          sourceName: source.name,
          url: source.url,
          success: true,
          itemCount: feed.items.length,
          sampleTitle: feed.items[0]?.title,
          sampleLink: feed.items[0]?.link
        });
      } else {
        console.log(`   ❌ 抓取失败: ${result.error}`);
        results.push({
          sourceName: source.name,
          url: source.url,
          success: false,
          itemCount: 0,
          error: result.error
        });
      }
    } catch (error) {
      console.log(`   ❌ 抓取异常: ${error instanceof Error ? error.message : '未知错误'}`);
      results.push({
        sourceName: source.name,
        url: source.url,
        success: false,
        itemCount: 0,
        error: error instanceof Error ? error.message : '未知错误'
      });
    }
    
    // 避免请求过于频繁
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log('');
  }

  // 总结结果
  console.log('📊 测试结果总结:');
  console.log('='.repeat(60));
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  console.log(`✅ 成功抓取: ${successful.length} 个`);
  console.log(`❌ 抓取失败: ${failed.length} 个`);
  console.log(`📈 成功率: ${((successful.length / results.length) * 100).toFixed(1)}%`);
  
  if (successful.length > 0) {
    console.log('\n🎯 成功抓取的信息源:');
    successful.forEach((result, index) => {
      console.log(`${index + 1}. ${result.sourceName}`);
      console.log(`   文章数: ${result.itemCount}`);
      console.log(`   示例: ${result.sampleTitle}`);
      console.log('');
    });
  }
  
  if (failed.length > 0) {
    console.log('\n⚠️ 抓取失败的信息源:');
    failed.forEach((result, index) => {
      console.log(`${index + 1}. ${result.sourceName} - ${result.error}`);
    });
  }

  // 测试数据保存功能
  console.log('\n💾 测试数据保存功能...');
  if (successful.length > 0) {
    const testSource = successful[0];
    console.log(`使用 ${testSource.sourceName} 的数据进行保存测试`);
    
    try {
      // 模拟文章数据
      const testArticle = {
        id: `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: testSource.sampleTitle || '测试文章',
        summary: '这是一个测试文章',
        category: 'AI/机器学习',
        author: '测试作者',
        publish_time: new Date().toISOString(),
        source_url: testSource.sampleLink || 'https://example.com',
        source_type: 'rss',
        content_id: `test_${Date.now()}`,
        tags: ['测试', 'AI'],
        is_new: true,
        is_hot: false,
        views: 0,
        likes: 0
      };

      const { error: insertError } = await supabase
        .from('articles')
        .insert(testArticle);

      if (insertError) {
        console.log(`❌ 数据保存测试失败: ${insertError.message}`);
      } else {
        console.log('✅ 数据保存测试成功');
        
        // 清理测试数据
        await supabase
          .from('articles')
          .delete()
          .eq('id', testArticle.id);
        console.log('🧹 已清理测试数据');
      }
    } catch (error) {
      console.log(`❌ 数据保存测试异常: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  console.log('\n🎉 爬虫系统测试完成！');
}

// 运行测试
testMyCrawlerSystem(); 