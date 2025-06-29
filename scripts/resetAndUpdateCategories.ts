import { supabase } from './supabaseClient';

// 日志函数
function log(message: string, type: 'info' | 'error' | 'success' | 'warning' = 'info'): void {
  const timestamp = new Date().toISOString();
  const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : type === 'warning' ? '⚠️' : 'ℹ️';
  console.log(`${timestamp} ${prefix} ${message}`);
}

// 分类映射 - 与collectDataToSupabase.ts保持一致
const categoryMapping: Record<string, string> = {
  // ArXiv分类映射
  'cs.AI': 'AI/机器学习',
  'cs.CV': 'AI/机器学习',
  'cs.CL': 'AI/机器学习',
  'cs.LG': 'AI/机器学习',
  'cs.NE': 'AI/机器学习',
  'stat.ML': 'AI/机器学习',
  '机器学习': 'AI/机器学习',
  '深度学习': 'AI/机器学习',
  '自然语言处理': 'AI/机器学习',
  '计算机视觉': 'AI/机器学习',
  '大模型': 'AI/机器学习',
  '人工智能': 'AI/机器学习',
  'AI绘画': 'AI/机器学习',
  '神经网络': 'AI/机器学习',
  
  // GitHub和技术相关
  'GitHub项目': '技术/开发',
  'GitHub仓库': '技术/开发',
  '开源项目': '技术/开发',
  '编程': '技术/开发',
  '开发工具': '技术/开发',
  '软件开发': '技术/开发',
  
  // RSS和新闻相关
  'RSS文章': '新闻/资讯',
  '技术新闻': '新闻/资讯',
  '科技资讯': '新闻/资讯',
  '行业动态': '新闻/资讯',
  
  // ML论文相关
  'ML论文': '学术/研究',
  '学术论文': '学术/研究',
  '研究报告': '学术/研究',
  
  // Stack Overflow
  'Stack Overflow': '技术/开发',
  '技术问答': '技术/开发',
  
  // 播客相关
  '播客': '播客',
  'Podcast': '播客',
  
  // 设计相关
  '设计': '设计/UX',
  'UX': '设计/UX',
  'UI': '设计/UX',
  
  // 社交媒体
  '社交': '社交媒体',
  '社交媒体': '社交媒体'
};

async function resetAndUpdateCategories(): Promise<void> {
  log('🚀 开始重置和更新分类统计', 'info');
  
  // 初始化 Supabase
  
  
  log(`连接到 Supabase: ${process.env.SUPABASE_URL}`, 'info');
  log(`使用密钥类型: ${process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SERVICE_ROLE_KEY' : 'ANON_KEY'}`, 'info');
  
  // const supabase = createClient(supabaseUrl, supabaseKey);
  
  try {
    // 1. 测试数据库连接
    log('🔗 测试数据库连接...', 'info');
    const { data: testData, error: testError } = await supabase
      .from('categories')
      .select('count')
      .limit(1);
    
    if (testError) {
      throw new Error(`数据库连接失败: ${testError.message}`);
    }
    
    log('✅ 数据库连接成功', 'success');
    
    // 2. 重置所有分类的count为0
    log('🔄 重置所有分类统计为0...', 'info');
    const { error: resetError } = await supabase
      .from('categories')
      .update({ count: 0 })
      .neq('name', null); // 添加WHERE子句选择所有非空name的记录
    
    if (resetError) {
      throw new Error(`重置分类统计失败: ${resetError.message}`);
    }
    
    log('✅ 所有分类统计已重置为0', 'success');
    
    // 3. 获取所有文章的分类信息
    log('🔍 获取所有文章的分类信息...', 'info');
    const { data: articles, error: articlesError } = await supabase
      .from('articles')
      .select('category')
      .not('category', 'is', null);
    
    if (articlesError) {
      throw new Error(`获取文章数据失败: ${articlesError.message}`);
    }
    
    if (!articles || articles.length === 0) {
      log('⚠️ 数据库中没有找到任何文章', 'warning');
      return;
    }
    
    log(`📈 找到 ${articles.length} 篇文章`, 'info');
    
    // 4. 统计分类数量（现在文章分类已经是标准格式）
    log('🔍 开始分类统计...', 'info');
    const mappedCategoryCounts: Record<string, number> = {};
    let totalArticles = 0;
    
    articles.forEach(article => {
      const category = article.category || '其他';
      mappedCategoryCounts[category] = (mappedCategoryCounts[category] || 0) + 1;
      totalArticles++;
    });
    
    // 不再写入"全部"分类的总数
    // mappedCategoryCounts['全部'] = totalArticles;
    
    // 显示统计结果
    log(`📊 分类统计完成，总计 ${totalArticles} 篇文章`, 'success');
    log('📋 分类分布详情:', 'info');
    Object.entries(mappedCategoryCounts)
      .sort(([,a], [,b]) => b - a) // 按数量降序排列
      .forEach(([category, count]) => {
        const percentage = ((count / totalArticles) * 100).toFixed(1);
        log(`   ${category}: ${count} 篇 (${percentage}%)`, 'info');
      });
    
    // 现在分类已经是标准格式，不需要显示未映射分类
    
    // 5. 更新数据库中的分类统计
    log('💾 开始更新数据库分类统计...', 'info');
    let updateSuccessCount = 0;
    let updateFailCount = 0;
    
    for (const [categoryName, count] of Object.entries(mappedCategoryCounts)) {
      try {
        const { error: updateError } = await supabase
          .from('categories')
          .update({ count })
          .eq('name', categoryName);
        
        if (updateError) {
          log(`❌ 更新分类 "${categoryName}" 失败: ${updateError.message}`, 'error');
          updateFailCount++;
        } else {
          log(`✅ 更新分类 "${categoryName}": ${count} 篇文章`, 'success');
          updateSuccessCount++;
        }
      } catch (error) {
        log(`❌ 更新分类 "${categoryName}" 时发生错误: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
        updateFailCount++;
      }
    }
    
    // 6. 显示最终结果
    log('', 'info');
    log('🎉 分类统计更新完成!', 'success');
    log(`📊 更新统计: ${updateSuccessCount} 成功, ${updateFailCount} 失败`, 'info');
    log(`📈 文章总数: ${totalArticles}`, 'info');
    log(`🏷️ 分类总数: ${Object.keys(mappedCategoryCounts).length}`, 'info');
    // 分类已标准化，无需显示未映射信息
    
  } catch (error) {
    log(`❌ 执行过程中发生错误: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    console.error(error);
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  resetAndUpdateCategories().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { resetAndUpdateCategories };
