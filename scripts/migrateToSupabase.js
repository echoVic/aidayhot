const { createClient } = require('@supabase/supabase-js');
const { mockArticles, categories } = require('./mockData.js');

// 配置 Supabase 客户端
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // 需要服务角色密钥
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// 转换数据格式以匹配数据库结构
function transformArticleData(article) {
  return {
    id: article.id,
    title: article.title,
    summary: article.summary,
    category: article.category,
    author: article.author,
    publish_time: article.publishTime,
    read_time: article.readTime,
    views: article.views,
    likes: article.likes,
    tags: article.tags,
    image_url: article.imageUrl,
    is_hot: article.isHot,
    is_new: article.isNew
  };
}

async function migrateCategories() {
  console.log('开始迁移分类数据...');
  
  try {
    // 检查是否已有数据
    const { data: existingCategories, error: checkError } = await supabase
      .from('categories')
      .select('name');
    
    if (checkError) {
      console.error('检查现有分类失败:', checkError);
      return false;
    }
    
    if (existingCategories && existingCategories.length > 0) {
      console.log('分类数据已存在，跳过迁移');
      return true;
    }
    
    const { data, error } = await supabase
      .from('categories')
      .insert(categories)
      .select();
    
    if (error) {
      console.error('分类迁移失败:', error);
      return false;
    }
    
    console.log(`成功迁移 ${data.length} 个分类`);
    return true;
  } catch (err) {
    console.error('分类迁移出错:', err);
    return false;
  }
}

async function migrateArticles() {
  console.log('开始迁移文章数据...');
  
  try {
    // 检查是否已有数据
    const { data: existingArticles, error: checkError } = await supabase
      .from('articles')
      .select('id')
      .limit(1);
    
    if (checkError) {
      console.error('检查现有文章失败:', checkError);
      return false;
    }
    
    if (existingArticles && existingArticles.length > 0) {
      console.log('文章数据已存在，跳过迁移');
      return true;
    }
    
    const transformedArticles = mockArticles.map(transformArticleData);
    
    // 分批插入，避免单次插入过多数据
    const batchSize = 5;
    let insertedCount = 0;
    
    for (let i = 0; i < transformedArticles.length; i += batchSize) {
      const batch = transformedArticles.slice(i, i + batchSize);
      
      const { data, error } = await supabase
        .from('articles')
        .insert(batch)
        .select();
      
      if (error) {
        console.error(`批次 ${Math.floor(i/batchSize) + 1} 插入失败:`, error);
        return false;
      }
      
      insertedCount += data.length;
      console.log(`已插入 ${insertedCount}/${transformedArticles.length} 篇文章`);
    }
    
    console.log(`成功迁移 ${insertedCount} 篇文章`);
    return true;
  } catch (err) {
    console.error('文章迁移出错:', err);
    return false;
  }
}

async function main() {
  console.log('开始数据迁移...');
  
  // 检查环境变量
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('请设置 NEXT_PUBLIC_SUPABASE_URL 和 SUPABASE_SERVICE_ROLE_KEY 环境变量');
    console.log('在项目根目录创建 .env.local 文件，添加：');
    console.log('NEXT_PUBLIC_SUPABASE_URL=你的项目URL');
    console.log('SUPABASE_SERVICE_ROLE_KEY=你的服务角色密钥');
    process.exit(1);
  }
  
  console.log('连接到 Supabase:', supabaseUrl);
  
  try {
    // 测试连接
    const { error: connectionError } = await supabase
      .from('categories')
      .select('count', { count: 'exact', head: true });
    
    if (connectionError) {
      console.error('Supabase 连接失败:', connectionError);
      console.log('请检查：');
      console.log('1. 数据库结构是否已创建（运行 SQL 脚本）');
      console.log('2. 环境变量是否正确');
      console.log('3. 网络连接是否正常');
      process.exit(1);
    }
    
    console.log('✅ Supabase 连接成功');
    
    // 1. 迁移分类
    const categoriesSuccess = await migrateCategories();
    if (!categoriesSuccess) {
      console.error('分类迁移失败，停止执行');
      process.exit(1);
    }
    
    // 2. 迁移文章
    const articlesSuccess = await migrateArticles();
    if (!articlesSuccess) {
      console.error('文章迁移失败，停止执行');
      process.exit(1);
    }
    
    console.log('🎉 数据迁移完成！');
    console.log('');
    console.log('下一步：');
    console.log('1. 启动开发服务器：pnpm dev');
    console.log('2. 查看网站：http://localhost:3000');
    console.log('3. 测试搜索功能');
    
  } catch (err) {
    console.error('迁移过程中发生错误:', err);
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  main();
}

module.exports = { main, migrateCategories, migrateArticles }; 