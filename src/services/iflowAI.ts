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
    const response = await fetch(`${this.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: this.model,
        messages,
        temperature: 0.7,
        max_tokens: maxTokens
      })
    });

    if (!response.ok) {
      throw new Error(`iflow API error: ${response.status} ${response.statusText}`);
    }

    const data: IflowAIResponse = await response.json();
    return data.choices[0]?.message?.content || '';
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
   * 生成文章摘要
   */
  async generateArticleSummaries(articles: ArticleData[]): Promise<{ [url: string]: string }> {
    const summaries: { [url: string]: string } = {};
    const templates = getPromptTemplatesForService('iflow');

    for (const article of articles) {
      try {
        const prompt = templates.articleSummary.user({
          title: article.title,
          content: article.summary
        });

        const summary = await this.makeRequest([
          { role: 'system', content: templates.articleSummary.system },
          { role: 'user', content: prompt }
        ], 150);

        summaries[article.source_url] = summary.trim();
      } catch (error) {
        console.warn(`生成文章摘要失败: ${article.title}`, error);
        summaries[article.source_url] = article.summary;
      }
    }

    return summaries;
  }

  /**
   * 生成整体摘要
   */
  async generateOverallSummary(articles: ArticleData[], summaries: { [url: string]: string }): Promise<string> {
    const templates = getPromptTemplatesForService('iflow');
    const articlesForPrompt = articles.map(article => ({
      title: article.title,
      summary: summaries[article.source_url] || article.summary,
      source_name: article.source_name
    }));

    const prompt = templates.dailySummary.user({
      articles: articlesForPrompt,
      articlesCount: articles.length
    });

    const summary = await this.makeRequest([
      { role: 'system', content: templates.systemRoles.summaryGenerator },
      { role: 'user', content: prompt }
    ], 400);

    return summary.trim();
  }

  /**
   * 生成日报标题
   */
  async generateTitle(articles: ArticleData[]): Promise<string> {
    const templates = getPromptTemplatesForService('iflow');
    const categories = [...new Set(articles.map(a => a.source_name))];

    const prompt = templates.titleGeneration.fromArticles({
      articlesCount: articles.length,
      categories
    });

    const title = await this.makeRequest([
      { role: 'system', content: templates.systemRoles.titleGenerator },
      { role: 'user', content: prompt }
    ], 100);

    return title.trim() || `${new Date().toLocaleDateString('zh-CN')} AI资讯日报`;
  }

  /**
   * 生成完整的日报摘要
   */
  async generateDailyReportSummary(articles: ArticleData[]): Promise<{ summary: string; articles: any[] }> {
    if (articles.length === 0) {
      return {
        summary: `${new Date().toLocaleDateString('zh-CN')} 暂无AI相关资讯`,
        articles: []
      };
    }

    try {
      console.log('🤖 使用iflowAI生成日报摘要...');
      
      const summaries = await this.generateArticleSummaries(articles);
      const overallSummary = await this.generateOverallSummary(articles, summaries);
      const title = await this.generateTitle(articles);

      const enhancedArticles = articles.map(article => ({
        ...article,
        aiSummary: summaries[article.source_url] || article.summary
      }));

      return {
        summary: `# ${title}\n\n${overallSummary}`,
        articles: enhancedArticles
      };
    } catch (error) {
      console.error('iflowAI 摘要生成失败:', error);
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

    return `${new Date().toLocaleDateString('zh-CN')} AI资讯日报

今日共收集到 ${articles.length} 条AI相关资讯，来源包括：${sourceStats}。

主要内容涵盖：
• 最新的AI技术研究进展
• 开源项目和工具更新
• 行业动态和产品发布
• 学术论文和技术博客

本日报通过自动化采集和AI分析生成，为您提供AI领域的每日精选资讯。

💡 已使用iflow.cn 星火大模型生成智能摘要。`;
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