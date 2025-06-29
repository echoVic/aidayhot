import { supabase } from './supabaseClient';

interface CategoryData {
  name: string;
  href: string;
}

const newCategories: CategoryData[] = [
  { name: 'AI/机器学习', href: '/category/ai-ml' },
  { name: '社交媒体', href: '/category/social' },
  { name: '技术/开发', href: '/category/tech' },
  { name: '新闻/资讯', href: '/category/news' },
  { name: '播客', href: '/category/podcast' },
  { name: '设计/UX', href: '/category/design' },
  { name: '学术/研究', href: '/category/academic' },
  { name: '其他', href: '/category/other' }
];

async function updateCategories() {
  console.log('🔄 开始更新分类数据...');

  try {
    // 使用 upsert 更新或插入分类数据，避免删除操作
    console.log('📥 更新或插入分类数据...');
    const { data, error: upsertError } = await supabase
      .from('categories')
      .upsert(newCategories, { onConflict: 'href' })
      .select();

    if (upsertError) {
      console.error('❌ 更新或插入分类失败:', upsertError);
      return;
    }

    console.log('✅ 成功更新或插入分类数据');
    console.log('📊 更新的分类:', data);

    // 根据实际文章数据更新分类统计
    await updateCategoryCountsFromArticles();

  } catch (error) {
    console.error('❌ 更新分类失败:', error);
  }
}

async function updateCategoryCountsFromArticles() {
  console.log('📊 开始统计文章分类...');

  try {
    // 直接查询文章表进行分类统计，不使用SQL函数
    const { data: articles, error } = await supabase
      .from('articles')
      .select('category');

    if (error) {
      console.error('获取文章数据失败:', error);
      return;
    }

    if (!articles || articles.length === 0) {
      console.log('📝 暂无文章数据，使用预设的统计数据');
      return;
    }

    console.log('📈 文章分类统计:');
    let totalArticles = 0;

    // 映射旧分类到新分类
    const categoryMapping: Record<string, string> = {
      '机器学习': 'AI/机器学习',
      '深度学习': 'AI/机器学习', 
      '自然语言处理': 'AI/机器学习',
      '计算机视觉': 'AI/机器学习',
      '大模型': 'AI/机器学习',
      '人工智能': 'AI/机器学习',
      'AI绘画': 'AI/机器学习',
      '技术新闻': '新闻/资讯',
      'AI博客': '其他',
      'GitHub仓库': '技术/开发'
    };

    const newCategoryStats: Record<string, number> = {};

    // 统计每个分类的文章数量
    for (const article of articles) {
      const oldCategory = article.category;
      const newCategory = categoryMapping[oldCategory] || oldCategory;
      
      newCategoryStats[newCategory] = (newCategoryStats[newCategory] || 0) + 1;
      totalArticles += 1;
    }

    console.log('🔄 分类映射结果:');
    Object.entries(newCategoryStats).forEach(([category, count]) => {
      console.log(`   ${category}: ${count} 篇`);
    });

    // 首先，重置所有分类的统计为 0
    console.log('🔄 重置所有分类统计为 0...');
    const { error: resetError } = await supabase
      .from('categories')
      .update({ count: 0 });

    if (resetError) {
      console.error('❌ 重置分类统计失败:', resetError);
      return; // 如果重置失败，则停止执行
    }
    console.log('✅ 成功重置分类统计');

    // 更新数据库中的分类统计
    for (const [categoryName, count] of Object.entries(newCategoryStats)) {
      const { error: updateError } = await supabase
        .from('categories')
        .update({ count })
        .eq('name', categoryName);

      if (updateError) {
        console.error(`更新分类 ${categoryName} 失败:`, updateError);
      }
    }

  } catch (error) {
    console.error('❌ 更新分类统计失败:', error);
  }
}

async function main() {
  const args = process.argv.slice(2);
  const verbose = args.includes('--verbose');

  if (verbose) {
    console.log('🚀 开始分类数据更新任务...');
  }

  await updateCategories();

  console.log('🎉 分类数据更新完成！');
}

main().catch(console.error);
