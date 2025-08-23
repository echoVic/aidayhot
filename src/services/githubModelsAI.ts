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
  summary?: string; // AI生成的文章摘要
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
    
    // 降低并发数以适应GitHub Models速率限制（每分钟10次）
    const concurrency = 2;
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
      
      // 增加批次间延迟，确保不超过速率限制
      if (chunks.indexOf(chunk) < chunks.length - 1) {
        const delay = 15000; // 15秒延迟，确保每分钟不超过4-5次调用
        console.log(`⏳ 等待 ${delay/1000} 秒以避免速率限制...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    console.log(`✅ 所有文章摘要生成完成`);
    return summaries;
  }

  /**
   * 生成 AI 日报摘要（两步式处理）
   */
  async generateDailyReportSummary(articles: Article[]): Promise<{ summary: string; articles: Article[] }> {
    try {
      console.log('📝 第一步：为每篇文章生成详细中文总结...');
      
      // 第一步：为每篇文章生成详细总结
      const summaries = await this.generateArticleSummaries(articles);
      
      // 将摘要添加到文章对象中
      const articlesWithSummaries = articles.map(article => ({
        ...article,
        summary: summaries[article.url] || this.generateFallbackSummary(article)
      }));
      
      console.log('📝 第二步：基于所有文章总结生成日报摘要...');
      
      // 第二步：基于所有文章总结生成整体日报摘要
      const dailySummary = await this.generateOverallSummary(articlesWithSummaries, summaries);
      
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
1. 控制在80-120字以内（更加浓缩）
2. 识别和突出最重要的技术趋势、研究突破或行业动态
3. 如果有重大技术突破或产品发布，请特别强调
4. 使用专业但易懂的中文表达
5. 采用简洁的要点形式，避免冗长的句子
6. 体现技术领域的整体发展方向和热点话题
7. 不要包含具体日期信息，专注于技术内容本身`
        },
        {
          role: 'user',
          content: `基于以下 ${articles.length} 篇技术文章的详细总结，生成一份简洁的技术日报摘要：\n\n${articlesWithSummaries.map((item, index) => 
            `${index + 1}. 【${item.category}】${item.title}\n   AI详细总结: ${item.summary}`
          ).join('\n\n')}\n\n要求：\n1. 基于上述文章的详细总结，提炼今日技术领域的主要动态\n2. 识别和突出最重要的技术趋势、研究突破或行业动态\n3. 生成80-120字的简洁日报摘要（更加浓缩）\n4. 采用专业但易懂的中文表达\n5. 如果有重大技术突破或产品发布，请特别强调\n6. 体现技术领域的整体发展方向和热点话题\n7. 使用简洁的要点形式，避免冗长的句子\n8. 不要包含具体日期信息，专注于技术内容本身\n\n请生成日报摘要：`
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
   * 基于摘要生成日报标题
   */
  async generateTitleFromSummary(summary: string): Promise<string> {
    try {
      const messages: ChatMessage[] = [
        {
          role: 'system',
          content: '你是一个专业的技术日报标题生成器。基于提供的日报摘要，生成一个简洁、吸引人的标题，突出技术热点和趋势。标题应该在10-20字之间。'
        },
        {
          role: 'user',
          content: `请基于以下日报摘要生成标题：\n\n${summary}`
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
      const prompt = `请分析以下文章是否与人工智能(AI)、机器学习(ML)、深度学习(DL)、大语言模型(LLM)等相关技术有关。

标题: ${article.title}
摘要: ${article.summary}

请返回JSON格式的分析结果:
{
  "isRelevant": true/false,
  "score": 0-100的相关性分数,
  "reason": "简短的判断理由"
}

判断标准:
- 90-100分: 直接讨论AI/ML技术、模型、算法
- 70-89分: 涉及AI应用、工具、平台
- 50-69分: 间接相关，如数据科学、自动化等
- 30-49分: 轻微相关，如技术趋势中提及AI
- 0-29分: 基本无关

排除内容（直接评为0分）:
- 营销活动、抽奖、促销、优惠券等商业推广
- 招聘信息、人事变动
- 纯娱乐内容、段子、表情包
- 与技术无关的企业新闻
- 活动报名、会议通知等事务性信息

阈值: 50分以上认为相关`;

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