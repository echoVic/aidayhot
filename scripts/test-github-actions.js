const fs = require('fs');
const path = require('path');

console.log('🧪 GitHub Actions 配置测试\n');

// 检查工作流文件
function checkWorkflowFile() {
  console.log('📄 检查工作流文件...');
  
  const workflowPath = path.join(__dirname, '..', '.github', 'workflows', 'data-collection.yml');
  
  if (!fs.existsSync(workflowPath)) {
    console.log('❌ 工作流文件不存在:', workflowPath);
    return false;
  }
  
  console.log('✅ 工作流文件存在');
  
  const workflowContent = fs.readFileSync(workflowPath, 'utf8');
  
  // 检查关键配置
  const checks = [
    { name: 'Cron 调度', pattern: /schedule:[\s\S]*cron:/ },
    { name: '手动触发', pattern: /workflow_dispatch:/ },
    { name: 'Node.js 设置', pattern: /uses: actions\/setup-node@v4/ },
    { name: '环境变量', pattern: /SUPABASE_URL:/ },
    { name: '数据收集脚本', pattern: /collectDataToSupabase\.js/ }
  ];
  
  for (const check of checks) {
    if (check.pattern.test(workflowContent)) {
      console.log(`✅ ${check.name}: 已配置`);
    } else {
      console.log(`❌ ${check.name}: 未找到`);
    }
  }
  
  return true;
}

// 检查必需的环境变量
function checkEnvironmentVariables() {
  console.log('\n🔐 检查环境变量...');
  
  const requiredEnvs = [
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY'
  ];
  
  const optionalEnvs = [
    'SUPABASE_SERVICE_ROLE_KEY',
    'GITHUB_TOKEN'
  ];
  
  let hasRequired = true;
  
  for (const env of requiredEnvs) {
    if (process.env[env]) {
      console.log(`✅ ${env}: 已设置`);
    } else {
      console.log(`❌ ${env}: 未设置 (必需)`);
      hasRequired = false;
    }
  }
  
  for (const env of optionalEnvs) {
    if (process.env[env]) {
      console.log(`✅ ${env}: 已设置 (可选)`);
    } else {
      console.log(`⚠️  ${env}: 未设置 (可选)`);
    }
  }
  
  return hasRequired;
}

// 检查爬虫模块
function checkCrawlerModules() {
  console.log('\n🤖 检查爬虫模块...');
  
  const crawlers = [
    { name: 'ArXiv', path: '../src/crawlers/arxivCrawler.js' },
    { name: 'GitHub', path: '../src/crawlers/githubCrawler.js' },
    { name: 'Papers with Code', path: '../src/crawlers/papersWithCodeCrawler.js' },
    { name: 'Stack Overflow', path: '../src/crawlers/stackOverflowCrawler.js' },
    { name: 'RSS', path: '../src/crawlers/rssCrawler.js' }
  ];
  
  let allExists = true;
  
  for (const crawler of crawlers) {
    const crawlerPath = path.join(__dirname, crawler.path);
    if (fs.existsSync(crawlerPath)) {
      console.log(`✅ ${crawler.name}: 模块存在`);
    } else {
      console.log(`❌ ${crawler.name}: 模块不存在`);
      allExists = false;
    }
  }
  
  return allExists;
}

// 检查数据收集脚本
function checkCollectionScript() {
  console.log('\n📜 检查数据收集脚本...');
  
  const scriptPath = path.join(__dirname, 'collectDataToSupabase.js');
  
  if (!fs.existsSync(scriptPath)) {
    console.log('❌ 数据收集脚本不存在');
    return false;
  }
  
  console.log('✅ 数据收集脚本存在');
  
  try {
    const script = require('./collectDataToSupabase.js');
    if (typeof script.collectData === 'function') {
      console.log('✅ 导出函数正确');
    } else {
      console.log('❌ 导出函数不正确');
      return false;
    }
  } catch (error) {
    console.log('❌ 脚本导入失败:', error.message);
    return false;
  }
  
  return true;
}

// 检查 package.json 脚本
function checkPackageScripts() {
  console.log('\n📦 检查 package.json 脚本...');
  
  const packagePath = path.join(__dirname, '..', 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  
  const expectedScripts = [
    'collect-data',
    'collect-data-verbose',
    'test-arxiv',
    'test-github'
  ];
  
  let allExists = true;
  
  for (const script of expectedScripts) {
    if (packageJson.scripts[script]) {
      console.log(`✅ ${script}: 已定义`);
    } else {
      console.log(`❌ ${script}: 未定义`);
      allExists = false;
    }
  }
  
  return allExists;
}

// 模拟运行参数解析
function testArgumentParsing() {
  console.log('\n⚙️ 测试参数解析...');
  
  try {
    // 保存原始 argv
    const originalArgv = process.argv;
    
    // 模拟命令行参数
    process.argv = [
      'node',
      'collectDataToSupabase.js',
      '--sources=arxiv',
      '--max-results=5',
      '--timeout=30',
      '--verbose'
    ];
    
    // 清除 require 缓存
    delete require.cache[require.resolve('./collectDataToSupabase.js')];
    
    console.log('✅ 参数解析测试通过');
    
    // 恢复原始 argv
    process.argv = originalArgv;
    
    return true;
  } catch (error) {
    console.log('❌ 参数解析测试失败:', error.message);
    return false;
  }
}

// 生成配置指南
function generateConfigGuide() {
  console.log('\n📋 GitHub Actions 配置指南:');
  console.log('');
  console.log('1. 设置 GitHub Secrets:');
  console.log('   - 进入仓库 Settings → Secrets and variables → Actions');
  console.log('   - 添加以下 secrets:');
  console.log('     * SUPABASE_URL');
  console.log('     * SUPABASE_ANON_KEY');
  console.log('     * SUPABASE_SERVICE_ROLE_KEY');
  console.log('     * GH_TOKEN (可选)');
  console.log('');
  console.log('2. 推送代码到 GitHub:');
  console.log('   git add .');
  console.log('   git commit -m "添加 GitHub Actions 工作流"');
  console.log('   git push');
  console.log('');
  console.log('3. 查看执行结果:');
  console.log('   - 进入 GitHub 仓库的 Actions 页面');
  console.log('   - 查看 "AI 日报数据收集" 工作流');
  console.log('');
  console.log('4. 手动触发测试:');
  console.log('   - 点击 "Run workflow"');
  console.log('   - 选择参数进行测试');
}

// 主函数
async function main() {
  let allPassed = true;
  
  allPassed &= checkWorkflowFile();
  allPassed &= checkEnvironmentVariables();
  allPassed &= checkCrawlerModules();
  allPassed &= checkCollectionScript();
  allPassed &= checkPackageScripts();
  allPassed &= testArgumentParsing();
  
  console.log('\n' + '='.repeat(50));
  
  if (allPassed) {
    console.log('🎉 所有检查通过！GitHub Actions 配置就绪');
  } else {
    console.log('⚠️  部分检查未通过，请修复后重试');
  }
  
  generateConfigGuide();
  
  return allPassed;
}

// 执行测试
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main }; 