import { AIResponse, ArticleData, ChatMessage } from '../types';
import { getPromptTemplatesForService } from './prompts';

interface GitHubModelsConfig {
  token: string;
  model: string;
  endpoint?: string;
}

interface ChatCompletionResponse extends AIResponse {}

export class GitHubModelsAI {
  private token: string;
  private model: string;
  private endpoint: string;

  constructor(config: GitHubModelsConfig) {
    this.token = config.token;
    this.model = config.model;
    this.endpoint = config.endpoint || 'https://models.inference.ai.azure.com';
  }

  /**
   * 调用GitHub Models API
   */
  private async callAPI(
    messages: ChatMessage[],
    maxTokens: number = 1000,
    temperature: number = 0.7
  ): Promise<string> {
    const maxRetries = 3;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🤖 调用GitHub Models API (尝试 ${attempt}/${maxRetries})`);
        
        const response = await fetch(`${this.endpoint}/chat/completions`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: this.model,
            messages,
            max_tokens: maxTokens,
            temperature,
            stream: false
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          
          // 特殊处理速率限制错误
          if (response.status === 429) {
            const errorData = JSON.parse(errorText);
            const retryAfter = this.extractRetryAfter(errorData);
            
            if (attempt < maxRetries) {
              console.log(`⏳ 遇到速率限制，等待 ${retryAfter} 秒后重试...`);
              await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
              continue;
            }
          }
          
          throw new Error(`GitHub Models API错误 (${response.status}): ${errorText}`);
        }

        const data: ChatCompletionResponse = await response.json();
        
        if (!data.choices || data.choices.length === 0) {
          throw new Error('GitHub Models API返回空响应');
        }

        const content = data.choices[0].message.content;
        if (!content) {
          throw new Error('GitHub Models API返回空内容');
        }

        console.log(`✅ GitHub Models API调用成功`);
        return content.trim();
      } catch (error) {
        lastError = error as Error;
        console.error(`❌ GitHub Models API调用失败 (尝试 ${attempt}/${maxRetries}):`, error);
        
        if (attempt < maxRetries && !(error as Error).message.includes('429')) {
          const delay = Math.pow(2, attempt) * 1000; // 指数退避
          console.log(`⏳ ${delay}ms后重试...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw new Error(`GitHub Models API调用失败，已重试${maxRetries}次: ${lastError?.message}`);
  }

  /**
   * 从错误响应中提取重试等待时间
   */
  private extractRetryAfter(errorData: any): number {
    try {
      if (errorData.error && errorData.error.message) {
        const message = errorData.error.message;
        const match = message.match(/wait (\d+) seconds/);
        if (match) {
          return parseInt(match[1], 10) + 5; // 额外增加5秒缓冲
        }
      }
    } catch (e) {
      console.warn('无法解析重试等待时间，使用默认值');
    }
    return 60; // 默认等待60秒
  }

  /**
   * 生成单篇文章摘要
   */
  async generateArticleSummary(article: ArticleData): Promise<string> {
    try {
      const templates = getPromptTemplatesForService('github-models');
      const messages: ChatMessage[] = [
        {
          role: 'system',
          content: templates.articleSummary.system
        },
        {
          role: 'user',
          content: templates.articleSummary.user({
            title: article.title,
            content: article.summary || article.original_summary || '无详细内容'
          })
        }
      ];

      const summary = await this.callAPI(messages, 200, 0.7);
      return summary;
    } catch (error) {
      console.error(`生成文章摘要失败:`, error);
      return this.generateFallbackSummary(article);
    }
  }

  /**
   * 批量生成文章摘要
   */
  async generateArticleSummaries(articles: ArticleData[]): Promise<ArticleData[]> {
    console.log(`📝 开始生成 ${articles.length} 篇文章的摘要...`);
    
    // 降低并发数以适应GitHub Models速率限制（每分钟10次）
    const concurrency = 2;
    const chunks = [];
    
    for (let i = 0; i < articles.length; i += concurrency) {
      chunks.push(articles.slice(i, i + concurrency));
    }
    
    for (const chunk of chunks) {
      const promises = chunk.map(async (article) => {
        try {
          const summary = await this.generateArticleSummary(article);
          article.summary = summary;
          
          // 检查并生成标题（如果缺失）
          if (!article.title || article.title.trim() === '') {
            console.log(`⚠️ 文章缺少标题，正在生成...`);
            try {
              article.title = await this.generateTitleFromSummary(summary);
            } catch (titleError) {
              console.error('生成标题失败:', titleError);
              article.title = '无标题';
            }
          }
          
          console.log(`✅ 文章摘要生成完成: ${article.title.substring(0, 50)}...`);
        } catch (error) {
          console.error(`生成文章摘要失败: ${article.title}`, error);
          article.summary = this.generateFallbackSummary(article);
        }
      });
      
      await Promise.all(promises);
      
      // 增加批次间延迟，确保不超过速率限制
      if (chunks.indexOf(chunk) < chunks.length - 1) {
        const delay = 15000; // 15秒延迟，确保每分钟不超过4-5次调用
        console.log(`⏳ 等待 ${delay/1000} 秒以避免速率限制...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    console.log(`✅ 所有文章摘要生成完成`);
    return articles;
  }

  /**
   * 生成 AI 日报摘要（两步式处理）
   */
  async generateDailyReportSummary(articles: ArticleData[]): Promise<{ summary: string; articles: any[] }> {
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
      console.error('🔥 日报摘要生成失败:', error);
      return {
        summary: this.generateFallbackOverallSummary(articles),
        articles: articles.map(article => ({
          ...article,
          summary: this.generateFallbackSummary(article)
        }))
      };
    }
  }

  /**
   * 生成整体日报摘要
   */
  async generateOverallSummary(articles: ArticleData[]): Promise<string> {
    try {
      const templates = getPromptTemplatesForService('github-models');
      const articlesWithSummaries = articles.map(article => ({
        title: article.title,
        summary: article.summary || '暂无摘要',
        source_name: article.source_name || '未分类'
      }));

      const messages: ChatMessage[] = [
        {
          role: 'system',
          content: templates.systemRoles.summaryGenerator
        },
        {
          role: 'user',
          content: templates.dailySummary.user({
              articles: articlesWithSummaries,
              articlesCount: articles.length
            })
        }
      ];

      const summary = await this.callAPI(messages, 200, 0.8);
      return summary;
    } catch (error) {
      console.error(`生成整体摘要失败:`, error);
      return this.generateFallbackOverallSummary(articles);
    }
  }

  /**
   * 生成日报标题
   */
  async generateTitle(articles: ArticleData[]): Promise<string> {
    try {
      const templates = getPromptTemplatesForService('github-models');
      const categories = [...new Set(articles.map(a => a.source_name).filter(Boolean))] as string[];
      const messages: ChatMessage[] = [
        {
          role: 'system',
          content: templates.systemRoles.titleGenerator
        },
        {
          role: 'user',
          content: templates.titleGeneration.fromArticles({
            articlesCount: articles.length,
            categories: categories
          })
        }
      ];

      const title = await this.callAPI(messages, 100, 0.9);
      return title;
    } catch (error) {
      console.error(`生成标题失败:`, error);
      const today = new Date().toLocaleDateString('zh-CN');
      return `AI技术日报 - ${today}`;
    }
  }

  /**
   * 基于摘要生成日报标题
   */
  async generateTitleFromSummary(summary: string): Promise<string> {
    try {
      const templates = getPromptTemplatesForService('github-models');
      const messages: ChatMessage[] = [
        {
          role: 'system',
          content: templates.systemRoles.titleGenerator
        },
        {
          role: 'user',
          content: templates.titleGeneration.fromSummary(summary)
        }
      ];

      const title = await this.callAPI(messages, 50, 0.8);
      return title.trim();
    } catch (error) {
      console.error('基于摘要生成标题失败:', error);
      const today = new Date().toLocaleDateString('zh-CN');
      return `AI技术日报 - ${today}`;
    }
  }

  /**
   * 分析文章与AI的相关性
   */
  async analyzeAIRelevance(article: { title: string; summary: string }): Promise<{ isRelevant: boolean; score: number; reason: string }> {
    try {
      const templates = getPromptTemplatesForService('github-models');
      const prompt = templates.aiRelevanceAnalysis.user({
        title: article.title,
        summary: article.summary
      });

      const response = await this.callAPI([
        { role: 'user', content: prompt }
      ], 500, 0.3);
      
      const result = JSON.parse(response);
      return {
        isRelevant: result.isRelevant && result.score >= 50,
        score: result.score || 0,
        reason: result.reason || '未知'
      };
    } catch (error) {
      console.error('AI相关性分析失败:', error);
      // 返回默认值，让调用方使用关键词匹配
      throw error;
    }
  }

  /**
   * 降级摘要生成（API不可用时）
   */
  private generateFallbackSummary(article: ArticleData): string {
    const description = article.summary || article.original_summary || '';
    if (description.length > 150) {
      return description.substring(0, 147) + '...';
    }
    return description || '暂无摘要';
  }

  /**
   * 降级整体摘要生成（API不可用时）
   */
  private generateFallbackOverallSummary(articles: ArticleData[]): string {
    const categories = [...new Set(articles.map(a => a.source_name).filter(Boolean))];
    const today = new Date().toLocaleDateString('zh-CN');
    
    return `今日(${today})共收集 ${articles.length} 篇技术文章，涵盖 ${categories.join('、')} 等领域。` +
           `主要内容包括最新的技术动态、开发工具更新、行业趋势分析等，为开发者提供及时的技术资讯。`;
  }
}

/**
 * 创建GitHub Models AI实例
 */
export function createGitHubModelsAI(): GitHubModelsAI | null {
  const token = process.env.GITHUB_TOKEN;
  
  if (!token) {
    console.log('⚠️ 未配置GitHub Token，将使用简单摘要生成');
    return null;
  }

  return new GitHubModelsAI({
    token,
    model: process.env.GITHUB_MODEL || 'gpt-4o',
    endpoint: process.env.GITHUB_ENDPOINT
  });
}