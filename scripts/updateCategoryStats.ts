import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

interface CategoryStats {
  name: string;
  count: number;
}

async function updateCategoryStats(): Promise<void> {
  console.log('🔄 开始更新分类统计...\n');

  // 检查环境变量
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ 缺少必需的环境变量: SUPABASE_URL 和 SUPABASE_SERVICE_ROLE_KEY/SUPABASE_ANON_KEY');
    process.exit(1);
  }

  // 初始化 Supabase 客户端
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // 测试连接
    console.log('🔗 测试数据库连接...');
    const { error: connectionError } = await supabase
      .from('categories')
      .select('count', { count: 'exact', head: true });

    if (connectionError) {
      console.error('❌ 数据库连接失败:', connectionError.message);
      process.exit(1);
    }

    console.log('✅ 数据库连接成功\n');

    // 获取所有文章的分类统计
    console.log('📊 统计文章分类分布...');
    const { data: articles, error: articlesError } = await supabase
      .from('articles')
      .select('category')
      .not('category', 'is', null);

    if (articlesError) {
      console.error('❌ 获取文章数据失败:', articlesError.message);
      process.exit(1);
    }

    // 统计每个分类的文章数量
    const categoryCounts: Record<string, number> = {};
    articles?.forEach(article => {
      const category = article.category || 'general';
      categoryCounts[category] = (categoryCounts[category] || 0) + 1;
    });

    console.log(`📈 发现 ${Object.keys(categoryCounts).length} 个分类:`);
    Object.entries(categoryCounts)
      .sort(([,a], [,b]) => b - a)
      .forEach(([category, count]) => {
        console.log(`   ${category}: ${count} 篇文章`);
      });

    console.log('\n🔄 开始更新分类表...');

    // 获取所有现有分类
    const { data: existingCategories, error: categoriesError } = await supabase
      .from('categories')
      .select('name, count');

    if (categoriesError) {
      console.error('❌ 获取分类数据失败:', categoriesError.message);
      process.exit(1);
    }

    // 更新现有分类的统计
    let updatedCount = 0;
    let unchangedCount = 0;

    for (const category of existingCategories || []) {
      const newCount = categoryCounts[category.name] || 0;
      
      if (newCount !== category.count) {
        const { error: updateError } = await supabase
          .from('categories')
          .update({ count: newCount })
          .eq('name', category.name);

        if (updateError) {
          console.error(`❌ 更新分类 "${category.name}" 失败:`, updateError.message);
        } else {
          console.log(`✅ 更新分类 "${category.name}": ${category.count} → ${newCount}`);
          updatedCount++;
        }
      } else {
        console.log(`⏭️  分类 "${category.name}" 无需更新: ${newCount} 篇`);
        unchangedCount++;
      }
    }

    // 检查是否有新的分类需要添加到分类表
    const existingCategoryNames = new Set(existingCategories?.map(c => c.name) || []);
    const newCategories = Object.keys(categoryCounts).filter(name => !existingCategoryNames.has(name));

    if (newCategories.length > 0) {
      console.log(`\n🆕 发现 ${newCategories.length} 个新分类，建议手动添加到分类表:`);
      newCategories.forEach(name => {
        console.log(`   - ${name}: ${categoryCounts[name]} 篇文章`);
        console.log(`     SQL: INSERT INTO categories (name, href, count) VALUES ('${name}', '/category/${name.toLowerCase()}', ${categoryCounts[name]});`);
      });
    }

    // 统计总结
    console.log('\n📊 更新统计汇总:');
    console.log(`   - 已更新: ${updatedCount} 个分类`);
    console.log(`   - 无变化: ${unchangedCount} 个分类`);
    console.log(`   - 新发现: ${newCategories.length} 个分类`);
    console.log(`   - 总文章数: ${articles?.length || 0} 篇`);

    console.log('\n✅ 分类统计更新完成！');

  } catch (error) {
    console.error('❌ 更新过程中发生错误:', error);
    process.exit(1);
  }
}

// 命令行参数处理
const args = process.argv.slice(2);
const isVerbose = args.includes('--verbose') || args.includes('-v');
const isDryRun = args.includes('--dry-run');

if (args.includes('--help') || args.includes('-h')) {
  console.log(`
📊 分类统计更新工具

用法:
  pnpm ts-node scripts/updateCategoryStats.ts [选项]

选项:
  --verbose, -v    显示详细输出
  --dry-run        仅显示统计，不实际更新
  --help, -h       显示此帮助信息

环境变量:
  SUPABASE_URL              Supabase 项目 URL
  SUPABASE_SERVICE_ROLE_KEY 服务角色密钥 (推荐)
  SUPABASE_ANON_KEY         匿名密钥 (备用)
`);
  process.exit(0);
}

if (require.main === module) {
  updateCategoryStats().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { updateCategoryStats };
