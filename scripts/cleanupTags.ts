#!/usr/bin/env tsx

import { supabase } from './supabaseClient';

interface Article {
  id: string;
  tags: any;
}

// 清理标签函数
function cleanTags(tags: any): string[] {
  if (!tags) return [];
  
  if (!Array.isArray(tags)) {
    console.log(`非数组标签: ${JSON.stringify(tags)}`);
    return [];
  }
  
  const cleanedTags: string[] = [];
  
  for (const tag of tags) {
    if (typeof tag === 'string') {
      if (tag.trim()) {
        cleanedTags.push(tag.trim());
      }
    } else if (typeof tag === 'object' && tag !== null) {
      // 处理 XML 对象，如 {@_term: "value", @_scheme: "scheme"}
      let extracted = '';
      
      if (tag['@_term']) {
        extracted = tag['@_term'];
      } else if (tag['#text']) {
        extracted = tag['#text'];
      } else if (tag._) {
        extracted = tag._;
      } else {
        // 获取对象的第一个字符串值
        const values = Object.values(tag);
        for (const value of values) {
          if (typeof value === 'string' && value.trim()) {
            extracted = value;
            break;
          }
        }
      }
      
      if (extracted && extracted.trim()) {
        cleanedTags.push(extracted.trim());
      }
      
      console.log(`清理对象标签: ${JSON.stringify(tag)} → "${extracted}"`);
    } else {
      // 其他类型转换为字符串
      const stringValue = String(tag);
      if (stringValue.trim()) {
        cleanedTags.push(stringValue.trim());
      }
    }
  }
  
  return cleanedTags;
}

async function cleanupTagsInDatabase() {
  console.log('🔍 开始扫描数据库中的标签数据...');
  
  try {
    // 分批获取所有文章
    let offset = 0;
    const batchSize = 100;
    let totalProcessed = 0;
    let totalCleaned = 0;
    let hasMore = true;
    
    while (hasMore) {
      console.log(`📄 获取第 ${offset / batchSize + 1} 批文章（${offset + 1}-${offset + batchSize}）...`);
      
      const { data: articles, error } = await supabase
        .from('articles')
        .select('id, tags')
        .range(offset, offset + batchSize - 1);
      
      if (error) {
        console.error('❌ 获取文章失败:', error);
        break;
      }
      
      if (!articles || articles.length === 0) {
        hasMore = false;
        break;
      }
      
      console.log(`✅ 获取到 ${articles.length} 篇文章`);
      
      // 处理每篇文章的标签
      for (const article of articles) {
        totalProcessed++;
        
        if (!article.tags || !Array.isArray(article.tags)) {
          continue;
        }
        
        // 检查是否有对象标签
        const hasObjectTags = article.tags.some(tag => 
          typeof tag === 'object' && tag !== null
        );
        
        if (hasObjectTags) {
          const originalTags = article.tags;
          const cleanedTags = cleanTags(article.tags);
          
          console.log(`🔧 清理文章 ${article.id} 的标签:`);
          console.log(`   原始: ${JSON.stringify(originalTags)}`);
          console.log(`   清理后: ${JSON.stringify(cleanedTags)}`);
          
          // 更新数据库
          const { error: updateError } = await supabase
            .from('articles')
            .update({ tags: cleanedTags })
            .eq('id', article.id);
          
          if (updateError) {
            console.error(`❌ 更新文章 ${article.id} 失败:`, updateError);
          } else {
            totalCleaned++;
            console.log(`✅ 文章 ${article.id} 标签清理完成`);
          }
        }
      }
      
      offset += batchSize;
      
      // 添加小延迟避免频繁请求
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log('\n📊 清理完成统计:');
    console.log(`   总文章数: ${totalProcessed}`);
    console.log(`   已清理: ${totalCleaned}`);
    console.log(`   无需清理: ${totalProcessed - totalCleaned}`);
    
  } catch (error) {
    console.error('❌ 清理过程出错:', error);
  }
}

// 检查是否有问题标签
async function checkProblemTags() {
  console.log('🔍 检查是否存在问题标签...');
  
  try {
    const { data: articles, error } = await supabase
      .from('articles')
      .select('id, tags')
      .limit(1000);
    
    if (error) {
      console.error('❌ 获取文章失败:', error);
      return;
    }
    
    if (!articles) {
      console.log('📄 没有找到文章');
      return;
    }
    
    let problemCount = 0;
    const sampleProblems: string[] = [];
    
    for (const article of articles) {
      if (!article.tags || !Array.isArray(article.tags)) {
        continue;
      }
      
      const hasObjects = article.tags.some(tag => 
        typeof tag === 'object' && tag !== null
      );
      
      if (hasObjects) {
        problemCount++;
        if (sampleProblems.length < 5) {
          sampleProblems.push(`${article.id}: ${JSON.stringify(article.tags)}`);
        }
      }
    }
    
    console.log(`📊 检查结果:`);
    console.log(`   检查文章数: ${articles.length}`);
    console.log(`   问题文章数: ${problemCount}`);
    
    if (problemCount > 0) {
      console.log('\n🔍 示例问题标签:');
      sampleProblems.forEach(sample => {
        console.log(`   ${sample}`);
      });
      
      console.log('\n💡 建议运行清理命令: npm run cleanup-tags');
    } else {
      console.log('✅ 没有发现问题标签');
    }
    
  } catch (error) {
    console.error('❌ 检查过程出错:', error);
  }
}

// 主函数
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  if (command === 'check') {
    await checkProblemTags();
  } else if (command === 'clean') {
    await cleanupTagsInDatabase();
  } else {
    console.log('用法:');
    console.log('  npm run tsx scripts/cleanupTags.ts check  # 检查问题标签');
    console.log('  npm run tsx scripts/cleanupTags.ts clean  # 清理问题标签');
  }
}

if (require.main === module) {
  main().catch(console.error);
} 