/**
 * 火山引擎大模型 AI 服务
 * 用于生成 AI 日报摘要
 */

interface VolcengineConfig {
  apiKey: string;
  endpoint?: string;
  model?: string;
}

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ChatResponse {
  choices: {
    message: {
      content: string;
    };
  }[];
}

export class VolcengineAI {
  private apiKey: string;
  private endpoint: string;
  private model: string;

  constructor(config: VolcengineConfig) {
    this.apiKey = config.apiKey;
    this.endpoint = config.endpoint || 'https://ark.cn-beijing.volces.com/api/v3/chat/completions';
    this.model = config.model || 'ep-20250806144921-5qqcz'; // 默认模型，可根据实际情况调整
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
      console.error('🔥 火山引擎 AI 处理失败:', error);
      return {
        summary: this.generateFallbackSummary(articles),
        articles: articles
      };
    }
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
        const detailedSummary = await this.callAPI([
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
      const response = await this.callAPI([
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
    return `请阅读以下文章链接的完整内容，并生成一份简洁的中文总结：

文章标题：${article.title}
文章链接：${article.source_url}
来源：${article.source_name}
初步摘要：${article.summary}

要求：
1. 请直接访问链接，阅读完整的文章内容
2. 生成50-80字的简洁中文总结（更加精炼）
3. 突出文章的核心观点、技术要点或重要发现
4. 使用专业但易懂的中文表达
5. 如果是技术文章，请解释关键技术概念
6. 如果是新闻报道，请突出重要事件和影响
7. 不要仅仅翻译或改写初步摘要，要基于完整内容生成新的总结
8. 使用简洁的表达，避免冗长的句子

请生成简洁的中文总结：`;
  }

  /**
   * 构建日报整体摘要的提示词
   * 注意：这里的 article.summary 已经是 AI 生成的详细总结，不是原始摘要
   */
  /**
   * 从摘要中生成标题
   */
  async generateTitleFromSummary(summary: string): Promise<string> {
    try {
      const prompt = `根据以下中文摘要，生成一个简洁、精炼、不超过15个字的中文标题：

摘要：
${summary}

要求：
1. 准确捕捉摘要的核心内容。
2. 标题要吸引人，但不能夸张失实。
3. 严格控制在15个字以内。
4. 直接输出标题，不要包含任何额外文字或引号。

生成的标题：`;

      const title = await this.callAPI([
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
    const articlesText = articles.map((article, index) => 
      `${index + 1}. 【${article.source_name}】${article.title}\n   AI详细总结: ${article.summary}`
    ).join('\n\n');

    return `基于以下 ${articles.length} 篇AI文章的详细总结，生成一份简洁的中文日报摘要：

${articlesText}

要求：
1. 基于上述文章的AI详细总结，提炼今日AI领域的主要动态
2. 识别和突出最重要的技术趋势、研究突破或行业动态
3. 生成80-120字的简洁日报摘要（更加浓缩）
4. 采用专业但易懂的中文表达
5. 如果有重大技术突破或产品发布，请特别强调
6. 体现AI领域的整体发展方向和热点话题
7. 注意：输入的已经是AI生成的详细总结，请基于这些高质量总结进行二次提炼
8. 使用简洁的要点形式，避免冗长的句子

请生成日报摘要：`;
  }

  /**
   * 调用火山引擎 API
   */
  private async callAPI(messages: ChatMessage[], retries = 2, timeout = 20000): Promise<string | null> {
    const systemMessage: ChatMessage = {
      role: 'system',
      content: '你是一个专业的AI新闻编辑，你的任务是根据用户提供的内容，生成简洁、准确、专业的中文总结。'
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: [systemMessage, ...messages],
          max_tokens: 500,
          temperature: 0.7,
          stream: false
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`火山引擎 API 错误: ${response.status} ${response.statusText}`);
      }

      const data: ChatResponse = await response.json();
      return data.choices?.[0]?.message?.content || null;
    } catch (error) {
      if (retries > 0) {
        console.log(`🔄 重试 ${retries} 次...`);
        return this.callAPI(messages, retries - 1, timeout);
      } else {
        console.error('🔥 火山引擎 API 调用失败:', error);
        return null;
      }
    }
  }

  /**
   * 备用摘要生成（当 API 不可用时）
   */
  private generateFallbackSummary(articles: any[]): string {
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

💡 提示：配置火山引擎API密钥可获得更智能的摘要分析。`;
  }
}

/**
 * 创建火山引擎 AI 实例
 */
export function createVolcengineAI(): VolcengineAI | null {
  const apiKey = process.env.VOLCENGINE_API_KEY;
  
  if (!apiKey) {
    console.log('⚠️ 未配置火山引擎API密钥，将使用简单摘要生成');
    return null;
  }

  return new VolcengineAI({
    apiKey,
    endpoint: process.env.VOLCENGINE_ENDPOINT,
    model: process.env.VOLCENGINE_MODEL
  });
}
