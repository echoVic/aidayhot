/**
 * iflow.cn AI 服务集成
 */

import { getPromptTemplatesForService } from './prompts';

interface ArticleData {
  title: string;
  summary: string;
  source_url: string;
  source_name: string;
  publish_time: string;
}

interface IflowAIResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

interface RelevanceAnalysis {
  isRelevant: boolean;
  score: number;
  reason: string;
}

class IflowAIClient {
  private apiKey: string;
  private baseURL = 'https://apis.iflow.cn/v1';
  private model: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.model = process.env.IFLOW_MODEL || 'deepseek-v3';
  }

  private async makeRequest(messages: Array<{role: string; content: string}>, maxTokens = 1000) {
    try {
      console.log(`🔍 iflowAI API调用 - 模型: ${this.model}, 消息数: ${messages.length}`);
      
      const requestBody = {
        model: this.model,
        messages,
        temperature: 0.7,
        max_tokens: maxTokens
      };
      
      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      console.log(`📡 iflowAI API响应状态: ${response.status}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ iflowAI API错误详情: ${response.status} ${response.statusText}`);
        console.error(`❌ 错误响应内容: ${errorText}`);
        throw new Error(`iflow API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data: IflowAIResponse = await response.json();
      const content = data.choices[0]?.message?.content || '';
      
      if (!content) {
        console.warn(`⚠️ iflowAI返回空内容, 完整响应:`, JSON.stringify(data, null, 2));
      } else {
        console.log(`✅ iflowAI成功返回内容，长度: ${content.length}`);
      }
      
      return content;
    } catch (error) {
      console.error(`💥 iflowAI API调用异常:`, error);
      throw error;
    }
  }

  /**
   * 分析文章与AI的相关性
   */
  async analyzeAIRelevance(params: { title: string; summary: string }): Promise<RelevanceAnalysis> {
    try {
      const templates = getPromptTemplatesForService('iflow');
      const prompt = templates.aiRelevanceAnalysis.user(params);

      const response = await this.makeRequest([
        { role: 'user', content: prompt }
      ], 200);

      const cleanedResponse = response.trim();
      const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0]);
        return {
          isRelevant: Boolean(result.isRelevant),
          score: Math.max(0, Math.min(100, parseInt(result.score) || 0)),
          reason: String(result.reason || '')
        };
      }

      throw new Error('Invalid response format');
    } catch (error) {
      console.warn('iflowAI 相关性分析失败，使用关键词备用方案:', error);
      return this.analyzeAIRelevanceWithKeywords(params);
    }
  }

  /**
   * 使用关键词匹配分析AI相关性（备用方案）
   */
  private analyzeAIRelevanceWithKeywords(params: { title: string; summary: string }): RelevanceAnalysis {
    const aiKeywords = [
      'artificial intelligence', 'ai', '人工智能',
      'machine learning', 'ml', '机器学习',
      'deep learning', 'dl', '深度学习',
      'neural network', '神经网络',
      'large language model', 'llm', '大语言模型',
      'natural language processing', 'nlp', '自然语言处理',
      'computer vision', '计算机视觉',
      'generative ai', '生成式ai', 'genai',
      'transformer', 'bert', 'gpt',
      'openai', 'chatgpt', 'claude', 'anthropic',
      'google ai', 'deepmind', 'gemini',
      'hugging face', 'transformers',
      'stable diffusion', 'dall-e', 'midjourney'
    ];

    const text = `${params.title} ${params.summary}`.toLowerCase();
    let score = 0;
    const matchedKeywords: string[] = [];

    for (const keyword of aiKeywords) {
      if (text.includes(keyword.toLowerCase())) {
        score += keyword.length > 5 ? 15 : 10;
        matchedKeywords.push(keyword);
      }
    }

    score = Math.min(score, 100);
    const isRelevant = score >= 40;
    const reason = matchedKeywords.slice(0, 3).join(', ') || '无关键词匹配';

    return { isRelevant, score, reason };
  }

  /**
   * 为每篇文章生成详细中文总结，同时处理缺失的标题
   */
  private async generateArticleSummaries(articles: any[]): Promise<any[]> {
    const articlesWithSummaries = [];
    
    for (let i = 0; i < articles.length; i++) {
      const article = articles[i];
      console.log(`📖 处理第 ${i + 1}/${articles.length} 篇文章: ${article.title}`);
      
      let finalTitle = article.title;
      let finalSummary = article.summary;
      
      try {
        // 1. 生成摘要
        const summaryPrompt = this.buildArticlePrompt(article);
        const detailedSummary = await this.makeRequest([
          {
            role: 'user',
            content: summaryPrompt
          }
        ]);
        
        if (detailedSummary) {
          finalSummary = detailedSummary;
        }
        
        // 2. 检查并生成标题（如果需要）
        if (!article.title || article.title.trim() === '' || article.title === '无标题') {
          console.log(`   🤖 为文章生成AI标题...`);
          try {
            const generatedTitle = await this.generateTitleFromSummary(finalSummary || article.original_summary || '');
            if (generatedTitle && generatedTitle.trim() !== '') {
              finalTitle = generatedTitle.replace(/["""]/g, ''); // 移除可能的引号
              console.log(`   ✅ 生成标题: ${finalTitle}`);
            } else {
              finalTitle = '无标题';
            }
          } catch (titleError) {
            console.error(`   ❌ 标题生成失败:`, titleError);
            finalTitle = '无标题';
          }
        }
        
        articlesWithSummaries.push({
          ...article,
          title: finalTitle,
          summary: finalSummary || article.summary || '暂无摘要'
        });
        
        // 避免API调用过于频繁
        if (i < articles.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (error) {
        console.error(`❌ 文章 "${article.title}" 处理失败:`, error);
        articlesWithSummaries.push({
          ...article,
          title: finalTitle || '无标题',
          summary: article.summary || '暂无摘要'
        });
      }
    }
    
    return articlesWithSummaries;
  }

  /**
   * 基于所有文章总结生成整体日报摘要
   */
  private async generateOverallSummary(articles: any[]): Promise<string> {
    try {
      const prompt = this.buildDailyPrompt(articles);
      const response = await this.makeRequest([
        {
          role: 'user',
          content: prompt
        }
      ]);
      
      return response || this.generateFallbackSummary(articles);
    } catch (error) {
      console.error('🔥 日报整体摘要生成失败:', error);
      return this.generateFallbackSummary(articles);
    }
  }

  /**
   * 构建单篇文章的提示词
   */
  private buildArticlePrompt(article: any): string {
    const templates = getPromptTemplatesForService('iflow');
    return templates.articleSummary.user({
      title: article.title,
      content: `文章链接：${article.source_url}\n来源：${article.source_name}\n初步摘要：${article.summary}`
    });
  }

  /**
   * 从摘要中生成标题
   */
  async generateTitleFromSummary(summary: string): Promise<string> {
    try {
      const templates = getPromptTemplatesForService('iflow');
      const prompt = templates.titleGeneration.fromSummary(summary);

      const title = await this.makeRequest([
        {
          role: 'user',
          content: prompt
        }
      ]);
      
      return title || 'AI总结生成标题'; // 如果生成失败，返回一个默认标题
    } catch (error) {
      console.error('🔥 从摘要生成标题失败:', error);
      return 'AI总结生成标题';
    }
  }

  /**
   * 构建日报整体摘要的提示词
   * 注意：这里的 article.summary 已经是 AI 生成的详细总结，不是原始摘要
   */
  private buildDailyPrompt(articles: any[]): string {
    const templates = getPromptTemplatesForService('iflow');
    const articlesForPrompt = articles.map(article => ({
      title: article.title,
      summary: article.summary,
      source_name: article.source_name
    }));
    
    return templates.dailySummary.user({
      articles: articlesForPrompt,
      articlesCount: articles.length
    });
  }

  /**
   * 生成 AI 日报摘要（两步式处理）
   */
  async generateDailyReportSummary(articles: any[]): Promise<{ summary: string; articles: any[] }> {
    try {
      console.log('📝 第一步：为每篇文章生成详细中文总结...');
      
      // 第一步：为每篇文章生成详细总结
      const articlesWithSummaries = await this.generateArticleSummaries(articles);
      
      console.log('📝 第二步：基于所有文章总结生成日报摘要...');
      
      // 第二步：基于所有文章总结生成整体日报摘要
      const dailySummary = await this.generateOverallSummary(articlesWithSummaries);
      
      return {
        summary: dailySummary,
        articles: articlesWithSummaries
      };
    } catch (error) {
      console.error('🔥 iflowAI 处理失败:', error);
      return {
        summary: this.generateFallbackSummary(articles),
        articles: articles
      };
    }
  }

  /**
   * 备用摘要生成
   */
  private generateFallbackSummary(articles: ArticleData[]): string {
    const sourceCount = new Map<string, number>();
    articles.forEach(article => {
      const source = article.source_name;
      sourceCount.set(source, (sourceCount.get(source) || 0) + 1);
    });

    const sourceStats = Array.from(sourceCount.entries())
      .map(([source, count]) => `${source}(${count}条)`)
      .join('、');

    const today = new Date().toLocaleDateString('zh-CN');
    
    return `${today} AI资讯日报

今日共收集到 ${articles.length} 条AI相关资讯，来源包括：${sourceStats}。

主要内容涵盖：
• 最新的AI技术研究进展
• 开源项目和工具更新  
• 行业动态和产品发布
• 学术论文和技术博客

本日报通过自动化采集和AI分析生成，为您提供AI领域的每日精选资讯。

💡 提示：配置iflowAI API密钥可获得更智能的摘要分析。`;
  }
}

/**
 * 创建iflowAI客户端
 * 根据环境变量配置返回客户端或null
 */
export function createIflowAI() {
  const apiKey = process.env.IFLOW_API_KEY;
  
  if (!apiKey) {
    console.log('⚠️ 未配置iflowAI API密钥(IFLOW_API_KEY)，将跳过iflowAI服务');
    return null;
  }

  return new IflowAIClient(apiKey);
}