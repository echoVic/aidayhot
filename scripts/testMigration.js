const { mockArticles, categories } = require('./mockData.js');

console.log('🧪 测试迁移脚本...');
console.log('');

// 测试数据加载
console.log('✅ 数据加载测试:');
console.log(`- 文章数量: ${mockArticles.length}`);
console.log(`- 分类数量: ${categories.length}`);
console.log('');

// 测试数据格式
console.log('✅ 数据格式测试:');
if (mockArticles.length > 0) {
  const firstArticle = mockArticles[0];
  console.log(`- 第一篇文章ID: ${firstArticle.id}`);
  console.log(`- 第一篇文章标题: ${firstArticle.title.substring(0, 50)}...`);
  console.log(`- 字段完整性: ${Object.keys(firstArticle).length} 个字段`);
}

if (categories.length > 0) {
  const firstCategory = categories[0];
  console.log(`- 第一个分类: ${firstCategory.name}`);
  console.log(`- 分类链接: ${firstCategory.href}`);
}
console.log('');

// 测试环境变量配置提醒
console.log('📝 环境变量检查:');
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (supabaseUrl) {
  console.log(`✅ NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl.substring(0, 30)}...`);
} else {
  console.log('❌ NEXT_PUBLIC_SUPABASE_URL: 未设置');
}

if (supabaseKey) {
  console.log(`✅ SUPABASE_SERVICE_ROLE_KEY: ${supabaseKey.substring(0, 30)}...`);
} else {
  console.log('❌ SUPABASE_SERVICE_ROLE_KEY: 未设置');
}

console.log('');

if (!supabaseUrl || !supabaseKey) {
  console.log('⚠️  请在 .env.local 中设置环境变量:');
  console.log('NEXT_PUBLIC_SUPABASE_URL=你的项目URL');
  console.log('SUPABASE_SERVICE_ROLE_KEY=你的服务角色密钥');
  console.log('');
  console.log('设置完成后运行: pnpm run migrate');
} else {
  console.log('🎉 所有检查通过！可以运行迁移了: pnpm run migrate');
}

console.log('');
console.log('💡 提示: 请确保已在 Supabase 中创建数据库结构');
console.log('   - 使用 database/schema.sql（推荐）');
console.log('   - 或 database/schema-simple.sql（兼容版）'); 
console.log('   - 或 database/schema-emergency.sql（紧急版）'); 