import { supabase } from './supabaseClient';

async function checkArticlesData() {
  console.log('🔍 检查 articles 表中的数据...\n');

  try {
    // 检查文章总数
    const { count: totalArticles, error: countError } = await supabase
      .from('articles')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('❌ 查询文章总数失败:', countError);
      return;
    }

    console.log(`📊 文章总数: ${totalArticles}`);

    // 检查最近的文章
    const { data: recentArticles, error: recentError } = await supabase
      .from('articles')
      .select('title, source_name, created_at')
      .order('created_at', { ascending: false })
      .limit(10);

    if (recentError) {
      console.error('❌ 查询最近文章失败:', recentError);
      return;
    }

    if (recentArticles && recentArticles.length > 0) {
      console.log('\n📰 最近的文章:');
      recentArticles.forEach((article, index) => {
        console.log(`${index + 1}. ${article.title}`);
        console.log(`   来源: ${article.source_name}`);
        console.log(`   时间: ${article.created_at}`);
        console.log('');
      });
    } else {
      console.log('📭 没有找到文章数据');
    }

    // 按来源统计文章数量
    const { data: sourceStats, error: statsError } = await supabase
      .from('articles')
      .select('source_name')
      .not('source_name', 'is', null);

    if (statsError) {
      console.error('❌ 查询来源统计失败:', statsError);
      return;
    }

    if (sourceStats && sourceStats.length > 0) {
      const sourceCounts = sourceStats.reduce((acc, article) => {
        const source = article.source_name || '未知';
        acc[source] = (acc[source] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      console.log('📈 按来源统计文章数量:');
      Object.entries(sourceCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .forEach(([source, count]) => {
          console.log(`   ${source}: ${count} 篇`);
        });
    }

  } catch (error) {
    console.error('❌ 检查失败:', error);
  }
}

// 运行检查
checkArticlesData(); 