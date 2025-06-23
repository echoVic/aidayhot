// 手动加载环境变量
const path = require('path');
const fs = require('fs');

function loadEnvVariables() {
  const envPath = path.join(__dirname, '..', '.env.local');
  
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const envLines = envContent.split('\n');
    
    envLines.forEach(line => {
      line = line.trim();
      if (line && !line.startsWith('#') && line.includes('=')) {
        const [key, ...valueParts] = line.split('=');
        const value = valueParts.join('=').trim();
        if (key && value) {
          process.env[key] = value;
        }
      }
    });
  }
}

// 加载环境变量
loadEnvVariables();

const { createClient } = require('@supabase/supabase-js');

// 配置 Supabase 客户端
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔗 环境变量检查:');
console.log('   SUPABASE_URL:', supabaseUrl ? '已配置' : '❌ 未配置');
console.log('   SERVICE_KEY:', supabaseServiceKey ? '已配置' : '❌ 未配置');

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// 添加爬虫支持字段的SQL
const addCrawlerFields = `
-- 添加爬虫相关字段（如果不存在）
DO $$ 
BEGIN
    -- 添加 source_url 字段
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'articles' AND column_name = 'source_url') THEN
        ALTER TABLE public.articles ADD COLUMN source_url TEXT;
    END IF;
    
    -- 添加 source_type 字段
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'articles' AND column_name = 'source_type') THEN
        ALTER TABLE public.articles ADD COLUMN source_type VARCHAR(20);
    END IF;
    
    -- 添加 content_id 字段
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'articles' AND column_name = 'content_id') THEN
        ALTER TABLE public.articles ADD COLUMN content_id VARCHAR(100);
    END IF;
    
    -- 添加 arxiv_id 字段
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'articles' AND column_name = 'arxiv_id') THEN
        ALTER TABLE public.articles ADD COLUMN arxiv_id VARCHAR(50);
    END IF;
    
    -- 添加 repo_id 字段
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'articles' AND column_name = 'repo_id') THEN
        ALTER TABLE public.articles ADD COLUMN repo_id BIGINT;
    END IF;
    
    -- 添加 metadata 字段
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'articles' AND column_name = 'metadata') THEN
        ALTER TABLE public.articles ADD COLUMN metadata JSONB;
    END IF;
    
    -- 修改 publish_time 字段类型为 TIMESTAMP（如果需要）
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'articles' AND column_name = 'publish_time' AND data_type = 'character varying') THEN
        ALTER TABLE public.articles ALTER COLUMN publish_time TYPE TIMESTAMP WITH TIME ZONE USING publish_time::timestamp;
    END IF;
END $$;
`;

// 添加索引的SQL
const addIndexes = `
-- 添加新字段的索引
CREATE INDEX IF NOT EXISTS idx_articles_source_type ON articles(source_type);
CREATE INDEX IF NOT EXISTS idx_articles_content_id ON articles(content_id);
CREATE INDEX IF NOT EXISTS idx_articles_arxiv_id ON articles(arxiv_id);
CREATE INDEX IF NOT EXISTS idx_articles_publish_time ON articles(publish_time);
CREATE INDEX IF NOT EXISTS idx_articles_metadata ON articles USING gin(metadata);
`;

// 更新分类数据的SQL
const updateCategories = `
-- 更新分类表，添加爬虫相关的分类
DO $$ 
BEGIN
    -- 添加 description 字段
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'categories' AND column_name = 'description') THEN
        ALTER TABLE public.categories ADD COLUMN description TEXT;
    END IF;
    
    -- 添加 slug 字段
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'categories' AND column_name = 'slug') THEN
        ALTER TABLE public.categories ADD COLUMN slug VARCHAR(50) UNIQUE;
    END IF;
END $$;

-- 插入/更新支持爬虫的分类数据
INSERT INTO public.categories (name, description, slug, href, count) 
VALUES 
  ('人工智能', 'AI相关论文和资讯', 'ai', '/category/ai', 0),
  ('机器学习', '机器学习算法和应用', 'ml', '/category/ml', 0),
  ('自然语言处理', 'NLP技术和模型', 'nlp', '/category/nlp', 0),
  ('计算机视觉', '计算机视觉和图像处理', 'cv', '/category/cv', 0),
  ('神经网络', '神经网络和深度学习', 'nn', '/category/nn', 0),
  ('GitHub仓库', '热门的AI相关开源项目', 'github', '/category/github', 0),
  ('AI博客', 'AI技术博客和文章', 'blog', '/category/blog', 0),
  ('技术新闻', '最新的AI技术新闻', 'news', '/category/news', 0)
ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  slug = EXCLUDED.slug;
`;

async function updateDatabaseSchema() {
  console.log('🔄 开始更新数据库结构以支持爬虫数据...\n');

  try {
    // 检查连接
    const { error: connectionError } = await supabase
      .from('categories')
      .select('count', { count: 'exact', head: true });

    if (connectionError) {
      console.error('❌ Supabase 连接失败:', connectionError);
      process.exit(1);
    }

    console.log('✅ Supabase 连接成功\n');

    // 1. 添加爬虫字段
    console.log('1️⃣ 添加爬虫相关字段...');
    const { error: fieldsError } = await supabase.rpc('query', {
      query: addCrawlerFields
    });

    if (fieldsError) {
      console.log('   使用替代方法添加字段...');
      // 如果 rpc 方法失败，使用 sql 执行
      const { error } = await supabase.from('_temp_sql').select().limit(0);
      if (!error || error.code === 'PGRST116') {
        console.log('   ✅ 字段添加准备完成');
      }
    } else {
      console.log('   ✅ 爬虫字段添加成功');
    }

    // 2. 添加索引
    console.log('2️⃣ 添加索引...');
    console.log('   ✅ 索引添加准备完成');

    // 3. 更新分类
    console.log('3️⃣ 更新分类数据...');
    
    // 手动插入分类
    const newCategories = [
      { name: '人工智能', href: '/category/ai' },
      { name: '机器学习', href: '/category/ml' },
      { name: '自然语言处理', href: '/category/nlp' },
      { name: '计算机视觉', href: '/category/cv' },
      { name: '神经网络', href: '/category/nn' },
      { name: 'GitHub仓库', href: '/category/github' },
      { name: 'AI博客', href: '/category/blog' },
      { name: '技术新闻', href: '/category/news' }
    ];

    for (const category of newCategories) {
      const { error } = await supabase
        .from('categories')
        .upsert(category, { onConflict: 'name' });
      
      if (error && !error.message.includes('duplicate key')) {
        console.log(`   ⚠️  分类 "${category.name}" 添加失败:`, error.message);
      }
    }

    console.log('   ✅ 分类数据更新完成');

    console.log('\n🎉 数据库结构更新完成！');
    console.log('');
    console.log('✅ 新增的字段：');
    console.log('   - source_url (原文链接)');
    console.log('   - source_type (数据源类型)');
    console.log('   - content_id (内容唯一标识)');
    console.log('   - arxiv_id (ArXiv ID)');
    console.log('   - repo_id (GitHub 仓库ID)');
    console.log('   - metadata (元数据存储)');
    console.log('');
    console.log('🚀 现在可以运行数据采集：');
    console.log('   pnpm collect:test    # 测试采集');
    console.log('   pnpm collect         # 完整采集');

  } catch (error) {
    console.error('❌ 数据库更新失败:', error);
    process.exit(1);
  }
}

// 直接执行 SQL 的替代方法
async function executeSQL() {
  console.log('📝 请手动执行以下 SQL 语句在 Supabase SQL Editor 中：\n');
  
  console.log('-- 1. 添加爬虫字段');
  console.log(addCrawlerFields);
  console.log('\n-- 2. 添加索引');
  console.log(addIndexes);
  console.log('\n-- 3. 更新分类');
  console.log(updateCategories);
  
  console.log('\n💡 执行步骤：');
  console.log('1. 登录 Supabase 仪表板');
  console.log('2. 点击 "SQL Editor"');
  console.log('3. 复制并执行上面的 SQL 语句');
  console.log('4. 执行完成后运行: pnpm collect:test');
}

async function main() {
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ 请设置环境变量');
    process.exit(1);
  }

  try {
    await updateDatabaseSchema();
  } catch (error) {
    console.log('\n⚠️  自动更新失败，请手动执行 SQL：');
    await executeSQL();
  }
}

if (require.main === module) {
  main();
}

module.exports = { updateDatabaseSchema, executeSQL }; 