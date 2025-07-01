#!/usr/bin/env node

import fs from 'fs';

async function cleanupCategoriesMigration() {
  console.log('🧹 开始清理categories表相关的废弃代码...\n');

  const filesToDelete = [
    'scripts/resetAndUpdateCategories.ts',
    'scripts/updateCategoryStats.ts', 
    'scripts/checkCategories.ts'
  ];

  let deletedCount = 0;
  let skippedCount = 0;

  // 删除废弃文件
  console.log('📁 删除废弃文件:');
  for (const filePath of filesToDelete) {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`✅ 已删除: ${filePath}`);
        deletedCount++;
      } else {
        console.log(`⚠️  文件不存在: ${filePath}`);
        skippedCount++;
      }
    } catch (error) {
      console.error(`❌ 删除失败 ${filePath}:`, error);
    }
  }

  // 更新package.json - 移除废弃命令
  console.log('\n📦 更新package.json...');
  try {
    const packageJsonPath = 'package.json';
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    const commandsToRemove = [
      'reset-categories',
      'update-category-stats'
    ];
    
    let removedCommands = 0;
    commandsToRemove.forEach(command => {
      if (packageJson.scripts && packageJson.scripts[command]) {
        delete packageJson.scripts[command];
        console.log(`✅ 已移除命令: ${command}`);
        removedCommands++;
      }
    });
    
    if (removedCommands > 0) {
      fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
      console.log(`✅ package.json已更新`);
    } else {
      console.log(`ℹ️  package.json无需更新`);
    }
    
  } catch (error) {
    console.error('❌ 更新package.json失败:', error);
  }

  // 生成清理报告
  console.log('\n📊 清理总结:');
  console.log('====================================');
  console.log(`✅ 已删除文件: ${deletedCount} 个`);
  console.log(`⚠️  跳过文件: ${skippedCount} 个`);
  console.log('====================================');

  if (deletedCount > 0) {
    console.log('\n🎉 categories表相关代码清理完成！');
    console.log('\n📋 下一步建议:');
    console.log('1. git add . && git commit -m "feat: 迁移到无categories表架构"');
    console.log('2. 测试应用功能确保一切正常');
    console.log('3. 部署到生产环境');
  }

  console.log('\n✨ 恭喜！您现在拥有了更现代的页面映射架构！');
}

// 解析命令行参数
const forceDelete = process.argv.includes('--force');

if (forceDelete) {
  cleanupCategoriesMigration();
} else {
  console.log('🚨 此操作将删除categories相关的废弃代码');
  console.log('\n将删除以下文件:');
  console.log('- scripts/resetAndUpdateCategories.ts');
  console.log('- scripts/updateCategoryStats.ts');
  console.log('- scripts/checkCategories.ts');
  console.log('\n将从package.json移除以下命令:');
  console.log('- reset-categories');
  console.log('- update-category-stats');
  console.log('\n如要继续，请运行: tsx scripts/cleanupCategoriesMigration.ts --force');
} 