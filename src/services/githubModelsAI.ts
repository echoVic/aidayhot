// 定义Article接口，兼容现有代码结构
interface Article {
  id?: string;
  title: string;
  description?: string;
  content?: string;
  url: string;
  category?: string;
  author?: string;
  publishTime?: string;
  tags?: string[];
  source?: string;
}

interface GitHubModelsConfig {
  token: string;
  model: string;
  endpoint?: string;
}

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ChatCompletionResponse {
  choices: {
    message: {
      content: string;
    };
  }[];
}

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
        
        if (attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 1000; // 指数退避
          console.log(`⏳ ${delay}ms后重试...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw new Error(`GitHub Models API调用失败，已重试${maxRetries}次: ${lastError?.message}`);
  }

  /**
   * 生成单篇文章摘要
   */
  async generateArticleSummary(article: Article): Promise<string> {
    try {
      const messages: ChatMessage[] = [
        {
          role: 'system',
          content: `你是一个专业的技术文章摘要生成器。请为以下文章生成一个简洁、准确的中文摘要，突出关键技术点和创新之处。摘要应该：
1. 控制在100-150字以内
2. 突出技术要点和实用价值
3. 使用简洁明了的语言
4. 避免重复文章标题内容`
        },
        {
          role: 'user',
          content: `文章标题：${article.title}\n\n文章内容：${article.content || article.description || '无详细内容'}`
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
  async generateArticleSummaries(articles: Article[]): Promise<{ [key: string]: string }> {
    console.log(`📝 开始生成 ${articles.length} 篇文章的摘要...`);
    const summaries: { [key: string]: string } = {};
    
    // 并发处理，但限制并发数量避免API限流
    const concurrency = 3;
    const chunks = [];
    
    for (let i = 0; i < articles.length; i += concurrency) {
      chunks.push(articles.slice(i, i + concurrency));
    }
    
    for (const chunk of chunks) {
      const promises = chunk.map(async (article) => {
        const summary = await this.generateArticleSummary(article);
        summaries[article.url] = summary;
        console.log(`✅ 文章摘要生成完成: ${article.title.substring(0, 50)}...`);
      });
      
      await Promise.all(promises);
      
      // 批次间稍作延迟，避免API限流
      if (chunks.indexOf(chunk) < chunks.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    console.log(`✅ 所有文章摘要生成完成`);
    return summaries;
  }

  /**
   * 生成整体日报摘要
   */
  async generateOverallSummary(articles: Article[], summaries: { [key: string]: string }): Promise<string> {
    try {
      const articlesWithSummaries = articles.map(article => ({
        title: article.title,
        summary: summaries[article.url] || '暂无摘要',
        category: article.category || '未分类'
      }));

      const messages: ChatMessage[] = [
        {
          role: 'system',
          content: `你是一个专业的技术日报编辑。请基于今日收集的技术文章，生成一份简洁的日报总结。总结应该：
1. 控制在200-300字以内
2. 突出今日技术热点和趋势
3. 按重要性和相关性组织内容
4. 使用专业但易懂的语言
5. 体现技术发展的连贯性和前瞻性`
        },
        {
          role: 'user',
          content: `今日收集到 ${articles.length} 篇技术文章，请生成日报总结：\n\n${articlesWithSummaries.map((item, index) => 
            `${index + 1}. 【${item.category}】${item.title}\n   摘要：${item.summary}`
          ).join('\n\n')}`
        }
      ];

      const summary = await this.callAPI(messages, 400, 0.8);
      return summary;
    } catch (error) {
      console.error(`生成整体摘要失败:`, error);
      return this.generateFallbackOverallSummary(articles);
    }
  }

  /**
   * 生成日报标题
   */
  async generateTitle(articles: Article[]): Promise<string> {
    try {
      const categories = [...new Set(articles.map(a => a.category).filter(Boolean))];
      const messages: ChatMessage[] = [
        {
          role: 'system',
          content: '你是一个专业的技术日报标题生成器。请为技术日报生成一个吸引人的标题，标题应该简洁、专业，体现当日技术热点。'
        },
        {
          role: 'user',
          content: `今日收集了 ${articles.length} 篇文章，涉及领域：${categories.join('、')}。请生成一个日报标题。`
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
   * 降级摘要生成（API不可用时）
   */
  private generateFallbackSummary(article: Article): string {
    const description = article.description || article.content || '';
    if (description.length > 150) {
      return description.substring(0, 147) + '...';
    }
    return description || '暂无摘要';
  }

  /**
   * 降级整体摘要生成（API不可用时）
   */
  private generateFallbackOverallSummary(articles: Article[]): string {
    const categories = [...new Set(articles.map(a => a.category).filter(Boolean))];
    const today = new Date().toLocaleDateString('zh-CN');
    
    return `今日(${today})共收集 ${articles.length} 篇技术文章，涵盖 ${categories.join('、')} 等领域。` +
           `主要内容包括最新的技术动态、开发工具更新、行业趋势分析等，为开发者提供及时的技术资讯。`;
  }
}

/**
 * 创建GitHub Models AI服务实例
 */
export function createGitHubModelsAI(config: GitHubModelsConfig): GitHubModelsAI {
  return new GitHubModelsAI(config);
}