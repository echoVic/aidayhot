import { supabase } from './supabaseClient';

async function checkAllSourceTypes() {
  console.log('🔍 检查所有可能的 source_type 值...\n');

  try {
    // 获取所有不同的 source_type
    const { data: sourceTypes, error } = await supabase
      .from('articles')
      .select('source_type')
      .not('source_type', 'is', null);

    if (error) {
      console.error('❌ 查询失败:', error);
      return;
    }

    if (!sourceTypes || sourceTypes.length === 0) {
      console.log('📭 没有找到文章数据');
      return;
    }

    // 统计每个 source_type 的数量
    const typeCounts = sourceTypes.reduce((acc, article) => {
      const type = article.source_type || '未知';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log('📊 各来源类型的文章数量:');
    Object.entries(typeCounts)
      .sort(([,a], [,b]) => b - a)
      .forEach(([type, count]) => {
        console.log(`   ${type}: ${count} 篇`);
      });

    // 检查最近的文章及其来源
    console.log('\n📰 最近的文章及其来源:');
    const { data: recentArticles, error: recentError } = await supabase
      .from('articles')
      .select('title, source_type, created_at')
      .order('created_at', { ascending: false })
      .limit(10);

    if (recentError) {
      console.error('❌ 查询最近文章失败:', recentError);
      return;
    }

    if (recentArticles && recentArticles.length > 0) {
      recentArticles.forEach((article, index) => {
        console.log(`${index + 1}. ${article.title || '无标题'}`);
        console.log(`   来源类型: ${article.source_type || '未知'}`);
        console.log(`   时间: ${article.created_at}`);
        console.log('');
      });
    }

    // 检查是否有与 feed_sources 匹配的数据
    console.log('\n🔍 检查与 feed_sources 的匹配情况:');
    const { data: sources } = await supabase
      .from('feed_sources')
      .select('name, category')
      .eq('is_active', true)
      .limit(5);

    if (sources) {
      sources.forEach(source => {
        const sourceName = source.name.toLowerCase().replace(/[^a-z0-9]/g, '');
        console.log(`   信息源: ${source.name}`);
        console.log(`   转换后: ${sourceName}`);
        console.log(`   在文章中的匹配: ${typeCounts[sourceName] || 0} 篇`);
        console.log('');
      });
    }

  } catch (error) {
    console.error('❌ 检查失败:', error);
  }
}

// 运行检查
checkAllSourceTypes(); 