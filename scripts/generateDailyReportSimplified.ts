/**
 * 简化版 AI 日报生成器
 * 使用单表结构，日报数据以 JSON 格式存储
 */

import { createClient } from '@supabase/supabase-js'
import { createVolcengineAI } from '../src/services/volcengineAI'

// 环境变量配置 - 支持本地和GitHub Actions两种环境
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// 使用 Service Role Key 以获得完整权限
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// 初始化火山引擎AI服务
const volcengineAI = createVolcengineAI()
if (!volcengineAI) {
  console.error('❌ 火山引擎AI服务初始化失败')
  process.exit(1)
}

interface NewsItem {
  title: string
  url: string
  summary: string
  publishTime: string
  aiSummary?: string
  source: string
}

interface DailyReportData {
  articles: NewsItem[]
  metadata: {
    totalArticles: number
    generatedAt: string
    sources: string[]
  }
}

/**
 * 获取今日新闻数据
 * 这里应该集成你的实际新闻源
 */
async function getTodayNews(): Promise<NewsItem[]> {
  // 示例数据 - 实际使用时应该从你的爬虫获取
  return [
    {
      title: "AI技术新突破：大模型在代码生成领域的应用",
      url: "https://example.com/ai-breakthrough",
      summary: "最新研究显示，大语言模型在代码生成和调试方面取得了显著进展，开发效率提升30%以上。",
      publishTime: new Date().toISOString(),
      source: "TechNews"
    },
    {
      title: "开源社区动态：新兴框架受到开发者关注",
      url: "https://example.com/opensource-news",
      summary: "一个新的前端框架在GitHub上获得了大量关注，其创新的设计理念吸引了众多开发者。",
      publishTime: new Date().toISOString(),
      source: "GitHub Trending"
    },
    {
      title: "云计算发展趋势：边缘计算成为新热点",
      url: "https://example.com/cloud-computing",
      summary: "随着5G技术的普及，边缘计算正在成为云计算领域的新趋势，预计市场规模将快速增长。",
      publishTime: new Date().toISOString(),
      source: "CloudTech"
    }
  ]
}

/**
 * 为每篇文章生成AI摘要
 */
async function generateArticleSummaries(articles: NewsItem[]): Promise<NewsItem[]> {
  console.log(`🤖 开始为 ${articles.length} 篇文章生成AI摘要...`)
  
  const summariesPromises = articles.map(async (article, index) => {
    try {
      console.log(`  处理第 ${index + 1}/${articles.length} 篇: ${article.title}`)
      
      const result = await volcengineAI.generateDailyReportSummary([{
        title: article.title,
        summary: article.summary,
        source_url: article.url,
        source_name: article.source
      }])
      
      const aiSummary = result.articles[0]?.summary || article.summary
      
      return { ...article, aiSummary }
    } catch (error) {
      console.error(`  ❌ 生成文章摘要失败: ${article.title}`, error)
      return { ...article, aiSummary: article.summary }
    }
  })
  
  const result = await Promise.all(summariesPromises)
  console.log(`✅ AI摘要生成完成`)
  return result
}

/**
 * 生成日报总结
 */
async function generateDailySummary(articles: NewsItem[]): Promise<string> {
  console.log('📝 生成日报总结...')
  
  const articleSummaries = articles.map((article, index) => 
    `${index + 1}. ${article.title}: ${article.aiSummary || article.summary}`
  ).join('\n')
  
  const prompt = `基于以下今日新闻，生成一份简洁的日报总结（200字以内）：

${articleSummaries}

要求：
1. 用中文回复
2. 概括主要趋势和亮点
3. 语言简洁专业
4. 突出技术发展动态`
  
  try {
    const result = await volcengineAI.generateDailyReportSummary(
      articles.map((article: NewsItem) => ({
        title: article.title,
        summary: article.aiSummary || article.summary,
        source_url: article.url,
        source_name: article.source
      }))
    )
    const summary = result.summary
    console.log('✅ 日报总结生成完成')
    return summary
  } catch (error) {
    console.error('❌ 生成日报总结失败:', error)
    return `今日共收集到 ${articles.length} 条新闻，涵盖了AI技术、开源社区、云计算等多个领域的最新动态。`
  }
}

/**
 * 保存日报到数据库
 */
async function saveDailyReport(reportData: DailyReportData, summary: string): Promise<boolean> {
  try {
    const today = new Date().toISOString().split('T')[0]
    
    console.log('💾 保存日报到数据库...')
    
    const { data, error } = await supabase
      .from('daily_reports')
      .upsert({
        date: today,
        content: reportData,
        summary: summary
      }, {
        onConflict: 'date'
      })
    
    if (error) {
      console.error('❌ 保存日报失败:', error)
      return false
    }
    
    console.log('✅ 日报保存成功')
    return true
    
  } catch (error) {
    console.error('❌ 保存日报异常:', error)
    return false
  }
}

/**
 * 主函数：生成完整的日报
 */
async function generateDailyReport(): Promise<boolean> {
  try {
    console.log('🚀 开始生成每日AI报告...')
    console.log('📅 日期:', new Date().toISOString().split('T')[0])
    
    // 1. 获取今日新闻
    console.log('\n📰 获取今日新闻...')
    const articles = await getTodayNews()
    console.log(`📄 获取到 ${articles.length} 条新闻`)
    
    // 2. 为每篇文章生成AI摘要
    console.log('\n🤖 生成文章AI摘要...')
    const articlesWithSummaries = await generateArticleSummaries(articles)
    
    // 3. 生成日报总结
    console.log('\n📝 生成日报总结...')
    const dailySummary = await generateDailySummary(articlesWithSummaries)
    
    // 4. 准备日报数据
    const reportData: DailyReportData = {
      articles: articlesWithSummaries,
      metadata: {
        totalArticles: articlesWithSummaries.length,
        generatedAt: new Date().toISOString(),
        sources: [...new Set(articlesWithSummaries.map(article => article.source))]
      }
    }
    
    // 5. 保存到数据库
    console.log('\n💾 保存日报到数据库...')
    const success = await saveDailyReport(reportData, dailySummary)
    
    if (success) {
      console.log('\n🎉 每日AI报告生成完成！')
      console.log('📊 统计信息:')
      console.log(`  - 文章数量: ${reportData.metadata.totalArticles}`)
      console.log(`  - 数据源: ${reportData.metadata.sources.join(', ')}`)
      console.log(`  - 生成时间: ${reportData.metadata.generatedAt}`)
      console.log('\n📄 日报总结:')
      console.log(dailySummary)
      return true
    } else {
      console.log('\n❌ 日报生成失败')
      return false
    }
    
  } catch (error) {
    console.error('\n💥 生成每日AI报告异常:', error)
    return false
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  generateDailyReport()
    .then(success => {
      process.exit(success ? 0 : 1)
    })
    .catch(error => {
      console.error('脚本执行失败:', error)
      process.exit(1)
    })
}

export { generateDailyReport }
export type { DailyReportData, NewsItem }

