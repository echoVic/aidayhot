#!/usr/bin/env tsx

import { supabase } from './supabaseClient';

async function verifyDailyReport() {
  console.log('🔍 检查最新日报数据...');
  
  try {
    const { data, error } = await supabase
      .from('daily_reports')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (error) {
      console.error('❌ 查询错误:', error);
      return;
    }
    
    if (!data || data.length === 0) {
      console.log('📭 暂无日报数据');
      return;
    }
    
    const report = data[0];
    console.log('✅ 找到最新日报:');
    console.log(`📅 日期: ${report.date}`);
    console.log(`📝 摘要: ${report.summary?.substring(0, 150)}...`);
    console.log(`📊 文章数量: ${report.content?.articles?.length || 0}`);
    console.log(`🕐 创建时间: ${report.created_at}`);
    console.log(`🔄 更新时间: ${report.updated_at}`);
    
    if (report.content?.articles && report.content.articles.length > 0) {
      console.log('\n📰 文章列表:');
      report.content.articles.slice(0, 3).forEach((article: any, index: number) => {
        console.log(`  ${index + 1}. ${article.title}`);
        console.log(`     来源: ${article.source_name}`);
      });
      
      if (report.content.articles.length > 3) {
        console.log(`  ... 还有 ${report.content.articles.length - 3} 篇文章`);
      }
    }
    
    console.log('\n🎉 日报数据验证完成！');
    
  } catch (error) {
    console.error('❌ 验证过程中发生错误:', error);
  }
}

verifyDailyReport();