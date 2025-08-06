#!/usr/bin/env tsx

/**
 * 简化的日报生成测试脚本
 * 用于快速验证核心功能是否正常
 */

import { config } from 'dotenv';
import path from 'path';

// 加载环境变量
const envPath = path.join(process.cwd(), '.env.local');
config({ path: envPath });

import { GitHubDailyReportGenerator } from './generateDailyReport';

async function testDailyReport() {
  console.log('🧪 开始测试日报生成功能...');
  
  try {
    const generator = new GitHubDailyReportGenerator();
    
    // 测试数据收集（限制数量以加快测试）
    console.log('📊 测试数据收集...');
    const articles = await generator.collectData();
    console.log(`✅ 数据收集成功，共获取 ${articles.length} 篇文章`);
    
    if (articles.length === 0) {
      console.log('⚠️ 没有收集到文章，跳过AI摘要生成');
      return;
    }
    
    // 只处理前3篇文章以加快测试
    const testArticles = articles.slice(0, 3);
    console.log(`🔬 测试AI摘要生成（处理前${testArticles.length}篇文章）...`);
    
    const aiResult = await generator.generateAISummary(testArticles);
    console.log('✅ AI摘要生成成功');
    console.log('📝 日报总结预览:', aiResult.summary.substring(0, 100) + '...');
    
    // 测试数据库保存
    console.log('💾 测试数据库保存...');
    const reportData = {
      introduction: aiResult.summary,
      items: aiResult.articles
    };
    
    const saveResult = await generator.saveDailyReport(reportData);
    if (saveResult) {
      console.log('✅ 数据库保存成功');
    } else {
      console.log('❌ 数据库保存失败');
    }
    
    console.log('🎉 日报生成测试完成！');
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
    process.exit(1);
  }
}

// 运行测试
testDailyReport().catch(console.error);
