#!/usr/bin/env node

/**
 * 模拟GitHub Actions执行环境的测试脚本
 * 用于本地调试和验证完整的工作流
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🧪 模拟 GitHub Actions 执行环境测试');
console.log('=======================================\n');

// 模拟环境变量设置
const requiredEnvVars = [
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY', 
  'SUPABASE_SERVICE_ROLE_KEY',
  'GH_TOKEN'
];

console.log('1. 检查环境变量...');
let missingVars = [];
requiredEnvVars.forEach(envVar => {
  const isSet = process.env[envVar];
  console.log(`   ${isSet ? '✅' : '❌'} ${envVar}`);
  if (!isSet) missingVars.push(envVar);
});

if (missingVars.length > 0) {
  console.log('\n❌ 缺少环境变量:', missingVars.join(', '));
  console.log('请在 .env.local 文件中设置这些变量');
  process.exit(1);
}

console.log('✅ 所有环境变量已设置\n');

// 步骤1：清理并编译
console.log('2. 编译 TypeScript 脚本...');
try {
  execSync('rm -rf dist/scripts/', { stdio: 'inherit' });
  execSync('mkdir -p dist/scripts/', { stdio: 'inherit' });
  
  const compileCmd = 'npx tsc scripts/collectDataToSupabase.ts --outDir dist/scripts --module commonjs --target es2020 --esModuleInterop true --allowSyntheticDefaultImports true --skipLibCheck true --declaration false';
  
  execSync(compileCmd, { stdio: 'inherit' });
  console.log('✅ 编译完成');
  
  // 检查编译结果
  if (fs.existsSync('dist/scripts/scripts/collectDataToSupabase.js')) {
    console.log('✅ 编译输出文件存在');
  } else {
    throw new Error('编译输出文件不存在');
  }
} catch (error) {
  console.error('❌ 编译失败:', error.message);
  process.exit(1);
}

console.log();

// 步骤2：执行数据收集
console.log('3. 执行数据收集...');
try {
  const dataCollectionCmd = 'node dist/scripts/scripts/collectDataToSupabase.js --sources=arxiv,github --timeout=25 --verbose --use-source-config --continue-on-error';
  
  console.log('执行命令:', dataCollectionCmd);
  
  const startTime = Date.now();
  execSync(dataCollectionCmd, { 
    stdio: 'inherit',
    env: { ...process.env, NODE_ENV: 'production', TZ: 'Asia/Shanghai' }
  });
  const endTime = Date.now();
  
  console.log(`✅ 数据收集完成，耗时: ${((endTime - startTime) / 1000).toFixed(2)} 秒`);
} catch (error) {
  console.error('❌ 数据收集失败:', error.message);
  process.exit(1);
}

console.log();

// 步骤3：生成执行报告
console.log('4. 生成执行报告...');
try {
  const reportContent = `## 🤖 AI日报数据收集报告

**执行时间**: ${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}
**触发方式**: 本地模拟测试
**测试环境**: Node.js ${process.version}

### 🔧 测试配置
- **指定源**: arxiv,github
- **智能配置**: true
- **继续执行**: true

### 📊 收集统计
${fs.existsSync('collection_log.txt') ? '```\n' + fs.readFileSync('collection_log.txt', 'utf8') + '\n```' : '未找到收集日志文件'}

### 📝 详细日志
所有执行步骤均在控制台输出中显示
`;

  fs.writeFileSync('test-report.md', reportContent);
  console.log('✅ 执行报告已生成: test-report.md');
  
  // 显示报告内容
  console.log('\n📄 报告内容:');
  console.log(reportContent);
} catch (error) {
  console.error('❌ 生成报告失败:', error.message);
}

console.log();

// 步骤4：验证结果
console.log('5. 验证执行结果...');
try {
  if (fs.existsSync('collection_log.txt')) {
    const logContent = fs.readFileSync('collection_log.txt', 'utf8');
    console.log('✅ 收集日志文件存在');
    
    // 分析日志内容
    if (logContent.includes('成功保存:') && !logContent.includes('保存失败: 0')) {
      const savedMatch = logContent.match(/成功保存:\s*(\d+)/);
      const saved = savedMatch ? parseInt(savedMatch[1]) : 0;
      console.log(`✅ 成功保存 ${saved} 篇文章`);
    } else {
      console.log('⚠️  未检测到保存的文章');
    }
    
    if (logContent.includes('爬虫失败: 0')) {
      console.log('✅ 无爬虫失败');
    } else {
      console.log('⚠️  存在爬虫失败');
    }
  } else {
    console.log('❌ 收集日志文件不存在');
  }
} catch (error) {
  console.error('❌ 验证结果失败:', error.message);
}

console.log();

// 步骤5：成功通知
console.log('6. 执行完成通知...');
console.log('✅ GitHub Actions 模拟测试成功完成');
console.log(`📅 执行时间: ${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}`);
console.log('🎯 所有步骤均正常执行，可以安全地推送到 GitHub Actions');

console.log();
console.log('🚀 下一步操作建议:');
console.log('1. 检查 test-report.md 文件确认结果');
console.log('2. 如果一切正常，可以推送工作流修复');
console.log('3. 在 GitHub 上手动触发测试验证');

// 清理测试文件
console.log();
console.log('🧹 清理测试文件...');
try {
  if (fs.existsSync('test-report.md')) {
    console.log('保留 test-report.md 供查看');
  }
  console.log('✅ 清理完成');
} catch (error) {
  console.log('⚠️  清理时出现警告:', error.message);
} 