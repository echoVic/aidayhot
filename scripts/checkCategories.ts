import { supabase } from './supabaseClient';

async function checkCategories() {
  try {
    console.log('🔍 查看数据库中的文章分类分布...\n');
    
    // 获取所有文章的分类
    const { data: articles, error } = await supabase
      .from('articles')
      .select('category')
      .not('category', 'is', null);
    
    if (error) {
      throw error;
    }
    
    if (!articles || articles.length === 0) {
      console.log('⚠️ 数据库中没有找到任何文章');
      return;
    }
    
    // 统计分类分布
    const categoryStats: Record<string, number> = {};
    articles.forEach(article => {
      const category = article.category || 'unknown';
      categoryStats[category] = (categoryStats[category] || 0) + 1;
    });
    
    console.log('📊 文章分类分布（按数量排序）:');
    console.log('=====================================');
    
    Object.entries(categoryStats)
      .sort(([,a], [,b]) => b - a)
      .forEach(([category, count]) => {
        const percentage = ((count / articles.length) * 100).toFixed(1);
        console.log(`${category.padEnd(20)} | ${count.toString().padStart(3)} 篇 | ${percentage.padStart(5)}%`);
      });
    
    console.log('=====================================');
    console.log(`总计: ${articles.length} 篇文章\n`);
    
    // 分类映射验证
    console.log('🔍 分类映射验证:');
    console.log('=====================================');
    
    const mapping: Record<string, string> = {
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
      'GitHub项目': '技术/开发',
      'GitHub仓库': '技术/开发',
      '开源项目': '技术/开发',
      '编程': '技术/开发',
      '开发工具': '技术/开发',
      '软件开发': '技术/开发',
      'Stack Overflow': '技术/开发',
      '技术问答': '技术/开发',
      'RSS文章': '新闻/资讯',
      '技术新闻': '新闻/资讯',
      '科技资讯': '新闻/资讯',
      '行业动态': '新闻/资讯',
      'ML论文': '学术/研究',
      '学术论文': '学术/研究',
      '研究报告': '学术/研究',
      '播客': '播客',
      'Podcast': '播客',
      '设计': '设计/UX',
      'UX': '设计/UX',
      'UI': '设计/UX',
      '社交': '社交媒体',
      '社交媒体': '社交媒体'
    };
    
    const mappedStats: Record<string, number> = {};
    let unmappedCount = 0;
    const unmappedCategories: Set<string> = new Set();
    
    Object.entries(categoryStats).forEach(([category, count]) => {
      const mappedCategory = mapping[category];
      if (mappedCategory) {
        mappedStats[mappedCategory] = (mappedStats[mappedCategory] || 0) + count;
      } else {
        unmappedCount += count;
        unmappedCategories.add(category);
        mappedStats['其他'] = (mappedStats['其他'] || 0) + count;
      }
    });
    
    // 计算"全部"
    mappedStats['全部'] = articles.length;
    
    console.log('映射后的分类分布:');
    Object.entries(mappedStats)
      .sort(([,a], [,b]) => b - a)
      .forEach(([category, count]) => {
        const percentage = ((count / articles.length) * 100).toFixed(1);
        console.log(`${category.padEnd(15)} | ${count.toString().padStart(3)} 篇 | ${percentage.padStart(5)}%`);
      });
    
    if (unmappedCategories.size > 0) {
      console.log('\n⚠️ 未映射的分类:');
      unmappedCategories.forEach(category => {
        console.log(`  - "${category}" (${categoryStats[category]} 篇)`);
      });
    }
    
  } catch (error) {
    console.error('❌ 查询失败:', error);
  }
}

if (require.main === module) {
  checkCategories();
}

export { checkCategories };
