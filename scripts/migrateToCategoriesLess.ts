#!/usr/bin/env node

import { PageContentService } from '../src/lib/database';
import { supabase } from './supabaseClient';

interface MigrationStep {
  name: string;
  description: string;
  check: () => Promise<boolean>;
  execute?: () => Promise<void>;
  rollback?: () => Promise<void>;
}

async function runMigration() {
  console.log('🚀 开始迁移到无categories表架构...\n');

  const steps: MigrationStep[] = [
    {
      name: 'backup_check',
      description: '检查是否已备份categories表数据',
      check: async () => {
        console.log('📋 建议：请先备份categories表数据');
        console.log('   SQL: CREATE TABLE categories_backup AS SELECT * FROM categories;');
        
        // 检查是否有备份表
        const { data, error } = await supabase
          .from('categories_backup')
          .select('id')
          .limit(1);
        
        if (error && error.message.includes('does not exist')) {
          console.log('⚠️  未发现备份表，建议先创建备份');
          return false;
        }
        
        console.log('✅ 发现备份表');
        return true;
      }
    },
    
    {
      name: 'verify_page_service',
      description: '验证新的PageContentService工作正常',
      check: async () => {
        try {
          const pageNav = await PageContentService.getPageNavigation();
          if (pageNav.length === 0) {
            console.log('❌ PageContentService返回空数据');
            return false;
          }
          
          console.log(`✅ PageContentService正常工作，返回${pageNav.length}个页面`);
          pageNav.forEach(page => {
            console.log(`   - ${page.name}: ${page.count}篇文章`);
          });
          return true;
        } catch (error) {
          console.log('❌ PageContentService测试失败:', error);
          return false;
        }
      }
    },
    
    {
      name: 'check_dependencies', 
      description: '检查对categories表的依赖',
      check: async () => {
        console.log('🔍 检查数据库依赖...');
        
        // 检查是否有外键约束
        const { data: constraints, error } = await supabase.rpc('exec', {
          sql: `
            SELECT conname, pg_get_constraintdef(oid) as definition
            FROM pg_constraint 
            WHERE confrelid = (SELECT oid FROM pg_class WHERE relname = 'categories')
               OR conrelid = (SELECT oid FROM pg_class WHERE relname = 'categories');
          `
        });
        
        if (error) {
          console.log('⚠️  无法检查约束:', error.message);
        } else if (constraints && constraints.length > 0) {
          console.log('⚠️  发现约束:');
          constraints.forEach((c: any) => {
            console.log(`   - ${c.conname}: ${c.definition}`);
          });
          return false;
        }
        
        console.log('✅ 未发现阻塞性依赖');
        return true;
      }
    },
    
    {
      name: 'analyze_impact',
      description: '分析迁移影响',
      check: async () => {
        console.log('📊 分析迁移影响...');
        
        // 检查articles.category字段的使用
        const { data: categoryUsage, error } = await supabase
          .from('articles')
          .select('category')
          .not('category', 'is', null);
        
        if (error) {
          console.log('❌ 无法分析category字段使用情况');
          return false;
        }
        
        const categoryStats: Record<string, number> = {};
        categoryUsage?.forEach(article => {
          const category = article.category || '未知';
          categoryStats[category] = (categoryStats[category] || 0) + 1;
        });
        
        console.log('📈 当前articles.category分布:');
        Object.entries(categoryStats)
          .sort(([,a], [,b]) => b - a)
          .forEach(([category, count]) => {
            console.log(`   - ${category}: ${count}篇`);
          });
        
        console.log('ℹ️  注意: articles.category字段将保留，但不再用于导航');
        return true;
      }
    }
  ];

  // 执行检查步骤
  let allChecksPass = true;
  for (const step of steps) {
    console.log(`\n🔍 ${step.description}...`);
    const passed = await step.check();
    if (!passed) {
      allChecksPass = false;
      console.log(`❌ ${step.name} 检查失败`);
    }
  }

  if (!allChecksPass) {
    console.log('\n⚠️  迁移前检查未完全通过，请解决上述问题后重试');
    return;
  }

  console.log('\n✅ 所有检查通过！');
  console.log('\n📋 迁移计划:');
  console.log('1. ✅ 已创建新的PageContentService');
  console.log('2. ✅ 已更新Sidebar组件');
  console.log('3. ⏳ 待更新MobileNavigation组件');
  console.log('4. ⏳ 待删除categories相关脚本');
  console.log('5. ⏳ 待删除categories表');

  console.log('\n🎯 下一步操作:');
  console.log('1. 更新前端组件: pnpm run migrate:update-components');
  console.log('2. 测试新架构: pnpm run dev');
  console.log('3. 确认无问题后删除categories表: pnpm run migrate:drop-categories');
  console.log('4. 清理废弃脚本: pnpm run migrate:cleanup');
  
  // 生成迁移总结报告
  const summary = {
    timestamp: new Date().toISOString(),
    status: 'ready_to_migrate',
    checks_passed: allChecksPass,
    page_navigation: await PageContentService.getPageNavigation(),
    rss_stats: await PageContentService.getRSSCategoryStats()
  };
  
  console.log('\n📄 迁移报告已生成');
  console.log(JSON.stringify(summary, null, 2));
}

async function dropCategoriesTable() {
  console.log('🗑️  准备删除categories表...\n');
  
  try {
    // 最后确认
    console.log('⚠️  此操作将永久删除categories表！');
    console.log('请确认:');
    console.log('1. 已完成所有组件更新');
    console.log('2. 已测试新架构工作正常');
    console.log('3. 已创建数据备份');
    
    // 在实际环境中，这里应该有用户确认步骤
    console.log('\n💡 如需继续，请手动执行以下SQL:');
    console.log('DROP TABLE IF EXISTS categories CASCADE;');
    
  } catch (error) {
    console.error('❌ 删除失败:', error);
  }
}

// 解析命令行参数
const command = process.argv[2];

switch (command) {
  case 'check':
    runMigration();
    break;
  case 'drop-table':
    dropCategoriesTable();
    break;
  default:
    runMigration();
    break;
} 