import { supabase } from './supabaseClient';

interface FeedSource {
  id: number;
  name: string;
  url: string;
  category: string;
  is_active: boolean;
  item_count: number;
  error_count: number;
  last_error?: string;
  created_at: string;
  updated_at: string;
}

interface SourceAnalysis {
  name: string;
  url: string;
  category: string;
  item_count: number;
  error_count: number;
  reliability_score: number;
  professional_score: number;
  coverage_score: number;
  total_score: number;
}

async function analyzeFeedSources() {
  console.log('🔍 分析 feed_sources 表中的信息源...\n');

  try {
    // 获取所有激活的信息源
    const { data: sources, error } = await supabase
      .from('feed_sources')
      .select('*')
      .eq('is_active', true)
      .order('item_count', { ascending: false });

    if (error) {
      console.error('❌ 查询失败:', error);
      return;
    }

    if (!sources || sources.length === 0) {
      console.log('📭 没有找到激活的信息源');
      return;
    }

    console.log(`📊 找到 ${sources.length} 个激活的信息源\n`);

    // 分析每个信息源
    const analysis: SourceAnalysis[] = sources.map((source: FeedSource) => {
      // 可靠性评分 (基于错误率)
      const errorRate = source.error_count / Math.max(source.item_count, 1);
      const reliabilityScore = Math.max(0, 100 - errorRate * 100);

      // 专业性评分 (基于类别和名称关键词)
      let professionalScore = 50; // 基础分
      
      // 专业类别加分
      const professionalCategories = [
        'AI/机器学习', '技术博客', '研究', '学术', '工程', '开发'
      ];
      if (professionalCategories.some(cat => source.category.includes(cat))) {
        professionalScore += 20;
      }

      // 知名机构加分
      const professionalKeywords = [
        'google', 'microsoft', 'aws', 'apple', 'meta', 'netflix', 'github',
        'openai', 'anthropic', 'deepmind', 'huggingface', 'stanford', 'mit',
        'research', 'engineering', 'developers', 'ai', 'machine learning'
      ];
      const nameLower = source.name.toLowerCase();
      const urlLower = source.url.toLowerCase();
      const keywordMatches = professionalKeywords.filter(keyword => 
        nameLower.includes(keyword) || urlLower.includes(keyword)
      ).length;
      professionalScore += Math.min(30, keywordMatches * 5);

      // 覆盖度评分 (基于文章数量)
      const coverageScore = Math.min(100, source.item_count / 10);

      // 总分
      const totalScore = (reliabilityScore * 0.3 + professionalScore * 0.4 + coverageScore * 0.3);

      return {
        name: source.name,
        url: source.url,
        category: source.category,
        item_count: source.item_count,
        error_count: source.error_count,
        reliability_score: Math.round(reliabilityScore),
        professional_score: Math.round(professionalScore),
        coverage_score: Math.round(coverageScore),
        total_score: Math.round(totalScore)
      };
    });

    // 按总分排序
    analysis.sort((a, b) => b.total_score - a.total_score);

    // 显示前20个最优质的信息源
    console.log('🏆 最优质的信息源 (前20名):\n');
    console.log('排名 | 名称 | 类别 | 文章数 | 错误数 | 可靠性 | 专业性 | 覆盖度 | 总分');
    console.log('-----|------|------|--------|--------|--------|--------|--------|------');

    analysis.slice(0, 20).forEach((source, index) => {
      console.log(
        `${(index + 1).toString().padStart(4)} | ` +
        `${source.name.substring(0, 20).padEnd(20)} | ` +
        `${source.category.substring(0, 8).padEnd(8)} | ` +
        `${source.item_count.toString().padStart(6)} | ` +
        `${source.error_count.toString().padStart(6)} | ` +
        `${source.reliability_score.toString().padStart(6)} | ` +
        `${source.professional_score.toString().padStart(6)} | ` +
        `${source.coverage_score.toString().padStart(6)} | ` +
        `${source.total_score.toString().padStart(4)}`
      );
    });

    // 按类别分组显示
    console.log('\n📂 按类别分组:\n');
    const categoryGroups = analysis.reduce((groups, source) => {
      const category = source.category || '其他';
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(source);
      return groups;
    }, {} as Record<string, SourceAnalysis[]>);

    Object.entries(categoryGroups).forEach(([category, sources]) => {
      console.log(`\n🔹 ${category} (${sources.length} 个信息源):`);
      sources.slice(0, 5).forEach((source, index) => {
        console.log(`   ${index + 1}. ${source.name} (${source.total_score}分)`);
      });
    });

    // 推荐5-10个最专业的信息源
    console.log('\n💡 推荐专注的5-10个信息源:\n');
    const topSources = analysis.slice(0, 10);
    topSources.forEach((source, index) => {
      console.log(`${index + 1}. ${source.name}`);
      console.log(`   类别: ${source.category}`);
      console.log(`   文章数: ${source.item_count}`);
      console.log(`   总分: ${source.total_score}`);
      console.log(`   URL: ${source.url}`);
      console.log('');
    });

    // 统计信息
    const totalItems = analysis.reduce((sum, source) => sum + source.item_count, 0);
    const totalErrors = analysis.reduce((sum, source) => sum + source.error_count, 0);
    const avgScore = analysis.reduce((sum, source) => sum + source.total_score, 0) / analysis.length;

    console.log('📈 统计信息:');
    console.log(`   总信息源数: ${analysis.length}`);
    console.log(`   总文章数: ${totalItems}`);
    console.log(`   总错误数: ${totalErrors}`);
    console.log(`   平均评分: ${Math.round(avgScore)}`);
    console.log(`   错误率: ${((totalErrors / Math.max(totalItems, 1)) * 100).toFixed(2)}%`);

  } catch (error) {
    console.error('❌ 分析失败:', error);
  }
}

// 运行分析
analyzeFeedSources(); 