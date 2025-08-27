/**
 * AI服务通用提示词模板
 * 用于各种AI服务的统一prompt管理
 */

export interface PromptTemplates {
  // 文章摘要生成相关
  articleSummary: {
    system: string;
    user: (params: { title: string; content: string }) => string;
  };
  
  // 日报整体摘要生成相关
  dailySummary: {
    user: (params: { articles: Array<{ title: string; summary: string; source_name: string }>; articlesCount: number }) => string;
  };
  
  // 标题生成相关
  titleGeneration: {
    fromSummary: (summary: string) => string;
    fromArticles: (params: { articlesCount: number; categories: string[] }) => string;
  };
  
  // AI相关性分析
  aiRelevanceAnalysis: {
    user: (params: { title: string; summary: string }) => string;
  };
  
  // 系统角色定义
  systemRoles: {
    newsEditor: string;
    titleGenerator: string;
    summaryGenerator: string;
  };
}

/**
 * 通用提示词模板
 */
export const promptTemplates: PromptTemplates = {
  // 文章摘要生成
  articleSummary: {
    system: `你是一个专业的技术文章摘要生成器。请为以下文章生成一个简洁、准确的中文摘要，突出关键技术点和创新之处。摘要应该：
1. 控制在50-80字以内（更加精炼）
2. 突出文章的核心观点、技术要点或重要发现
3. 使用专业但易懂的中文表达
4. 如果是技术文章，请解释关键技术概念
5. 如果是新闻报道，请突出重要事件和影响
6. 使用简洁的表达，避免冗长的句子
7. 避免重复文章标题内容`,
    
    user: ({ title, content }) => `请阅读以下文章内容，并生成一份简洁的中文总结：

文章标题：${title}
文章内容：${content}

要求：
1. 生成50-80字的简洁中文总结（更加精炼）
2. 突出文章的核心观点、技术要点或重要发现
3. 使用专业但易懂的中文表达
4. 如果是技术文章，请解释关键技术概念
5. 如果是新闻报道，请突出重要事件和影响
6. 不要仅仅翻译或改写，要基于完整内容生成新的总结
7. 使用简洁的表达，避免冗长的句子

请生成简洁的中文总结：`
  },
  
  // 日报整体摘要生成
  dailySummary: {
    user: ({ articles, articlesCount }) => {
      const articlesText = articles.map((article, index) => 
        `${index + 1}. 【${article.source_name}】${article.title}\n   AI详细总结: ${article.summary}`
      ).join('\n\n');
      
      return `基于以下 ${articlesCount} 篇AI文章的详细总结，生成一份简洁的中文日报摘要：

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
  },
  
  // 标题生成
  titleGeneration: {
    fromSummary: (summary: string) => `根据以下中文摘要，生成一个简洁、精炼、不超过15个字的中文标题：

摘要：
${summary}

要求：
1. 准确捕捉摘要的核心内容
2. 标题要吸引人，但不能夸张失实
3. 严格控制在15个字以内
4. 直接输出标题，不要包含任何额外文字或引号

生成的标题：`,
    
    fromArticles: ({ articlesCount, categories }) => `今日收集了 ${articlesCount} 篇文章，涉及领域：${categories.join('、')}。请生成一个简洁有力的中文日报标题，体现技术前瞻性和专业感。`
  },
  
  // AI相关性分析
  aiRelevanceAnalysis: {
    user: ({ title, summary }) => `请分析以下文章是否与人工智能(AI)、机器学习(ML)、深度学习(DL)、大语言模型(LLM)等相关技术有关。

标题: ${title}
摘要: ${summary}

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

阈值: 50分以上认为相关`
  },
  
  // 系统角色定义
  systemRoles: {
    newsEditor: '你是一个专业的AI新闻编辑，你的任务是根据用户提供的内容，生成简洁、准确、专业的中文总结。',
    titleGenerator: '你是一个专业的技术日报标题生成器。请为技术日报生成一个吸引人的标题，标题应该简洁、专业，体现当日技术热点。',
    summaryGenerator: `你是一个专业的技术日报编辑。请基于今日收集的技术文章，生成一份简洁的日报总结。总结应该：
1. 控制在80-120字以内（更加浓缩）
2. 识别和突出最重要的技术趋势、研究突破或行业动态
3. 如果有重大技术突破或产品发布，请特别强调
4. 使用专业但易懂的中文表达
5. 采用简洁的要点形式，避免冗长的句子
6. 体现技术领域的整体发展方向和热点话题
7. 不要包含具体日期信息，专注于技术内容本身`
  }
};

/**
 * iflow 专用提示词模板
 * 针对 iflow AI 服务的特殊优化
 */
export const iflowPromptTemplates: PromptTemplates = {
  // 文章摘要生成（简化版）
  articleSummary: {
    system: '你是一个专业的技术文章摘要生成器，专注于生成简洁准确的中文摘要。',
    user: ({ title, content }: { title: string; content: string }) => `请为以下文章生成一个简洁的中文摘要（50-80字），突出技术要点：

标题: ${title}
内容: ${content}

请直接返回摘要文本，不要添加标题或其他格式。`
  },
  
  // 日报整体摘要生成
  dailySummary: {
    user: ({ articles, articlesCount }: { articles: Array<{ title: string; summary: string; source_name: string }>; articlesCount: number }) => {
      const articlesText = articles.map((article, index) => 
        `${index + 1}. 【${article.source_name}】${article.title}\n   摘要: ${article.summary}`
      ).join('\n\n');
      
      return `基于以下 ${articlesCount} 篇AI相关文章，生成一份今日AI日报的技术趋势总结（80-120字）：

${articlesText}

请从以下角度总结：
1. 主要技术突破点
2. 新兴趋势和方向
3. 对行业的潜在影响

请以清晰简洁的中文段落形式呈现。`;
    }
  },
  
  // 标题生成
  titleGeneration: {
    fromSummary: (summary: string) => `基于以下摘要，生成一个简洁有力的中文日报标题，体现技术前瞻性和专业感：

${summary}`,
    fromArticles: ({ articlesCount, categories }: { articlesCount: number; categories: string[] }) => 
      `基于 ${articlesCount} 篇来自 ${categories.slice(0, 3).join('、')}${categories.length > 3 ? '等' : ''} 领域的AI相关文章，生成一个简洁有力的中文日报标题，体现技术前瞻性和专业感。`
  },
  
  // AI相关性分析
  aiRelevanceAnalysis: {
    user: ({ title, summary }: { title: string; summary: string }) => `请分析以下文章是否与人工智能(AI)、机器学习(ML)、深度学习、自然语言处理、计算机视觉等相关。

标题: ${title}
摘要: ${summary}

请以JSON格式回复，包含以下字段：
{
  "isRelevant": boolean, // 是否与AI相关
  "score": number, // 相关度分数(0-100)
  "reason": string // 简短的判断理由
}

只返回JSON，不要添加其他解释。`
  },
  
  // 系统角色定义
  systemRoles: {
    newsEditor: '你是一个专业的AI新闻编辑，专注于生成简洁、准确、专业的中文总结。',
    titleGenerator: '你是一个专业的技术日报标题生成器，专注于生成简洁有力的标题。',
    summaryGenerator: '你是一个专业的技术日报编辑，专注于生成简洁的日报总结。'
  }
};

/**
 * 获取适合特定AI服务的提示词模板
 */
export function getPromptTemplatesForService(serviceName: 'volcengine' | 'github-models' | 'iflow') {
  switch (serviceName) {
    case 'iflow':
      return iflowPromptTemplates;
    case 'volcengine':
    case 'github-models':
    default:
      return promptTemplates;
  }
}