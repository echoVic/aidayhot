import { supabase } from './supabaseClient';

// 日志函数
function log(message: string, type: 'info' | 'error' | 'success' | 'warning' = 'info'): void {
  const timestamp = new Date().toISOString();
  const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : type === 'warning' ? '⚠️' : 'ℹ️';
  console.log(`${timestamp} ${prefix} ${message}`);
}

// 分类映射 - 从原始分类到标准分类
const categoryMapping: Record<string, string> = {}

async function updateArticleCategories(): Promise<void> {
  log('🚀 开始更新文章分类字段', 'info');

  try {
    // 1. 测试数据库连接
    log('🔗 测试数据库连接...', 'info');
    const { data: testData, error: testError } = await supabase
      .from('articles')
      .select('count')
      .limit(1);

    if (testError) {
      throw new Error(`数据库连接失败: ${testError.message}`);
    }

    log('✅ 数据库连接成功', 'success');

    // 2. 获取所有文章的分类信息
    log('📊 获取所有文章的分类信息...', 'info');
    const { data: articles, error: articlesError } = await supabase
      .from('articles')
      .select('id, category')
      .not('category', 'is', null);

    if (articlesError) {
      throw new Error(`获取文章数据失败: ${articlesError.message}`);
    }

    if (!articles || articles.length === 0) {
      log('⚠️ 数据库中没有找到任何文章', 'warning');
      return;
    }

    log(`📈 找到 ${articles.length} 篇文章需要检查分类`, 'info');

    // 3. 分析需要更新的文章
    let needUpdateCount = 0;
    let mappedCount = 0;
    let unmappedCount = 0;
    const updatePlan: Array<{ id: string; oldCategory: string; newCategory: string }> = [];
    const unmappedCategories: Set<string> = new Set();

    articles.forEach(article => {
      const oldCategory = article.category;
      let newCategory = '';
      const id = article.id.toLowerCase();

      if (id.startsWith('github')) {
        newCategory = '技术/开发';
      } else if (id.startsWith('arxiv')) {
        newCategory = '学术/研究';
      } else if (id.startsWith('rss')) {
        newCategory = '新闻/资讯';
      } else if (id.startsWith('stackoverflow')) {
        newCategory = '技术/开发';
      } else if (id.startsWith('paper-with-code')) {
        newCategory = '学术/研究';
      } else {
        // 未匹配的分类，将归类到"其他"
        newCategory = '其他';
        unmappedCategories.add(oldCategory);
        unmappedCount++;
      }

      if (oldCategory !== newCategory) {
        // 需要更新
        updatePlan.push({ 
          id: article.id, 
          oldCategory, 
          newCategory 
        });
        needUpdateCount++;
      }
      if (newCategory !== '其他') {
        mappedCount++;
      }
    });

    log(`📋 分析结果:`, 'info');
    log(`  - 需要更新: ${needUpdateCount} 篇`, 'info');
    log(`  - 已是标准分类: ${articles.length - needUpdateCount} 篇`, 'info');
    log(`  - 有映射的分类: ${mappedCount} 篇`, 'info');
    log(`  - 未映射分类: ${unmappedCount} 篇`, 'info');

    if (unmappedCategories.size > 0) {
      log('⚠️ 发现未映射的分类（将归类到"其他"）:', 'warning');
      unmappedCategories.forEach(category => {
        log(`  - "${category}"`, 'warning');
      });
    }
    
    if (needUpdateCount === 0) {
      log('🎉 所有文章分类已经是标准格式，无需更新！', 'success');
      return;
    }
    
    // 4. 执行批量更新
    log(`💾 开始批量更新 ${needUpdateCount} 篇文章的分类...`, 'info');
    
    let successCount = 0;
    let errorCount = 0;
    const batchSize = 50; // 每批处理50篇文章
    
    for (let i = 0; i < updatePlan.length; i += batchSize) {
      const batch = updatePlan.slice(i, i + batchSize);
      
      log(`🔄 处理第 ${Math.floor(i / batchSize) + 1} 批（${batch.length} 篇文章）...`, 'info');
      
      // 并行更新当前批次的文章
      const promises = batch.map(async (update) => {
        try {
          const { error } = await supabase
            .from('articles')
            .update({ 
              category: update.newCategory,
              updated_at: new Date().toISOString()
            })
            .eq('id', update.id);
          
          if (error) {
            throw error;
          }
          
          return { success: true, update };
        } catch (error) {
          return { 
            success: false, 
            update, 
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      });
      
      const results = await Promise.all(promises);
      
      // 统计结果
      results.forEach(result => {
        if (result.success) {
          successCount++;
          log(`✅ 更新文章 ${result.update.id}: "${result.update.oldCategory}" → "${result.update.newCategory}"`, 'success');
        } else {
          errorCount++;
          log(`❌ 更新文章 ${result.update.id} 失败: ${result.error}`, 'error');
        }
      });
      
      // 批次间短暂休息，避免过度请求
      if (i + batchSize < updatePlan.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    // 5. 显示最终结果
    log('', 'info');
    log('🎉 文章分类更新完成!', 'success');
    log(`📊 更新统计: ${successCount} 成功, ${errorCount} 失败`, 'info');
    log(`📈 文章总数: ${articles.length}`, 'info');
    
    if (errorCount > 0) {
      log(`⚠️ 有 ${errorCount} 篇文章更新失败，请检查错误日志`, 'warning');
    }
    
    // 6. 验证更新结果
    log('🔍 验证更新结果...', 'info');
    const { data: updatedArticles, error: verifyError } = await supabase
      .from('articles')
      .select('category')
      .not('category', 'is', null);
    
    if (verifyError) {
      log(`验证更新结果失败: ${verifyError.message}`, 'error');
    } else {
      const categoryStats: Record<string, number> = {};
      updatedArticles?.forEach(article => {
        const category = article.category || 'unknown';
        categoryStats[category] = (categoryStats[category] || 0) + 1;
      });
      
      log('📊 更新后的分类分布:', 'info');
      Object.entries(categoryStats)
        .sort(([,a], [,b]) => b - a)
        .forEach(([category, count]) => {
          const percentage = ((count / (updatedArticles?.length || 1)) * 100).toFixed(1);
          log(`  ${category}: ${count} 篇 (${percentage}%)`, 'info');
        });
    }
    
  } catch (error) {
    log(`❌ 执行过程中发生错误: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    console.error(error);
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  updateArticleCategories().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { updateArticleCategories };