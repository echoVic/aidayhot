import { supabase } from './supabaseClient';

async function checkTableStructure() {
  console.log('🔍 检查表结构...\n');

  try {
    // 检查articles表的结构
    const { data: articlesSample, error: articlesError } = await supabase
      .from('articles')
      .select('*')
      .limit(1);

    if (articlesError) {
      console.error('❌ 查询articles表失败:', articlesError);
      return;
    }

    if (articlesSample && articlesSample.length > 0) {
      console.log('📋 articles表结构:');
      console.log(Object.keys(articlesSample[0]));
      console.log('\n📄 示例数据:');
      console.log(JSON.stringify(articlesSample[0], null, 2));
    }

    // 检查feed_sources表的结构
    const { data: sourcesSample, error: sourcesError } = await supabase
      .from('feed_sources')
      .select('*')
      .limit(1);

    if (sourcesError) {
      console.error('❌ 查询feed_sources表失败:', sourcesError);
      return;
    }

    if (sourcesSample && sourcesSample.length > 0) {
      console.log('\n📋 feed_sources表结构:');
      console.log(Object.keys(sourcesSample[0]));
      console.log('\n📄 示例数据:');
      console.log(JSON.stringify(sourcesSample[0], null, 2));
    }

    // 检查最近的文章（使用正确的字段名）
    const { data: recentArticles, error: recentError } = await supabase
      .from('articles')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    if (recentError) {
      console.error('❌ 查询最近文章失败:', recentError);
      return;
    }

    if (recentArticles && recentArticles.length > 0) {
      console.log('\n📰 最近的文章:');
      recentArticles.forEach((article, index) => {
        console.log(`${index + 1}. ${article.title || '无标题'}`);
        console.log(`   来源: ${article.source || article.source_name || '未知'}`);
        console.log(`   时间: ${article.created_at}`);
        console.log('');
      });
    }

  } catch (error) {
    console.error('❌ 检查失败:', error);
  }
}

// 运行检查
checkTableStructure(); 