import { RSSCrawler } from '../src/crawlers/RSSCrawler';
import { supabase } from './supabaseClient';

async function syncRSSSourcesFromCrawler() {
  console.log('🔄 开始同步 RSSCrawler 硬编码源到 feed_sources 表...\n');

  try {
    // 获取 RSSCrawler 中的硬编码源
    const rssCrawler = new RSSCrawler();
    const crawlerSources = rssCrawler.getAIRSSFeeds();
    
    console.log(`📋 RSSCrawler 中发现 ${Object.keys(crawlerSources).length} 个源:`);
    Object.keys(crawlerSources).forEach(name => {
      console.log(`  - ${name}`);
    });
    console.log('');

    // 获取数据库中现有的源
    const { data: existingSources, error: fetchError } = await supabase
      .from('feed_sources')
      .select('name, url, category');

    if (fetchError) {
      console.error('❌ 获取现有源失败:', fetchError.message);
      process.exit(1);
    }

    const existingUrls = new Set(existingSources?.map(s => s.url) || []);
    console.log(`🗃️ 数据库中现有 ${existingSources?.length || 0} 个源\n`);

    // 准备要插入的新源
    const newSources = [];
    
    for (const [name, url] of Object.entries(crawlerSources)) {
      if (!existingUrls.has(url)) {
        // 根据源名称推断分类
        let category = '其他';
        const nameLower = name.toLowerCase();
        
        if (nameLower.includes('arxiv')) {
          category = 'AI/机器学习';
        } else if (nameLower.includes('ai') || nameLower.includes('ml') || 
                   nameLower.includes('machine learning') || nameLower.includes('deepmind') ||
                   nameLower.includes('openai') || nameLower.includes('hugging face')) {
          category = 'AI/机器学习';
        } else if (nameLower.includes('tech') || nameLower.includes('verge') || 
                   nameLower.includes('crunch')) {
          category = '新闻/资讯';
        } else if (nameLower.includes('berkeley') || nameLower.includes('research')) {
          category = '学术/研究';
        } else if (nameLower.includes('blog') || nameLower.includes('towards')) {
          category = '技术/开发';
        }

        newSources.push({
          name,
          url,
          category,
          is_active: true
        });
      }
    }

    if (newSources.length === 0) {
      console.log('✅ 所有源都已在数据库中，无需同步');
      return;
    }

    console.log(`📥 准备插入 ${newSources.length} 个新源:`);
    newSources.forEach(source => {
      console.log(`  - ${source.name} (${source.category})`);
    });
    console.log('');

    // 批量插入新源
    const { data: insertedData, error: insertError } = await supabase
      .from('feed_sources')
      .insert(newSources)
      .select();

    if (insertError) {
      console.error('❌ 插入新源失败:', insertError.message);
      process.exit(1);
    }

    console.log(`✅ 成功同步 ${insertedData?.length || 0} 个新源到数据库\n`);

    // 显示最终统计
    const { data: finalSources, error: finalError } = await supabase
      .from('feed_sources')
      .select('category')
      .eq('is_active', true);

    if (!finalError && finalSources) {
      console.log('📊 同步后的源分布:');
      const categoryCount: Record<string, number> = {};
      finalSources.forEach(source => {
        categoryCount[source.category] = (categoryCount[source.category] || 0) + 1;
      });
      
      Object.entries(categoryCount).forEach(([category, count]) => {
        console.log(`  - ${category}: ${count} 个源`);
      });
      console.log(`  总计: ${finalSources.length} 个活跃源\n`);
    }

    console.log('🎉 同步完成！');
    console.log('\n📋 下一步建议:');
    console.log('1. 运行 pnpm run collect-data --sources=rss 测试RSS源');
    console.log('2. 考虑移除 RSSCrawler.ts 中的硬编码配置，完全依赖数据库');

  } catch (error) {
    console.error('❌ 同步过程中发生错误:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  syncRSSSourcesFromCrawler().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { syncRSSSourcesFromCrawler };
