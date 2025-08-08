import axios, { AxiosInstance } from 'axios';
import * as zlib from 'zlib';
import { BaseCrawler } from './BaseCrawler';
import { CrawlerOptions, StackOverflowQuestion, StackOverflowResult } from './types';



interface StackOverflowAnswer {
  answerId: number;
  questionId: number;
  content: string;
  contentType: string;
  score: number;
  isAccepted: boolean;
  owner: {
    userId: number;
    displayName: string;
    reputation: number;
    profileImage?: string;
  };
  publishedAt: Date;
  updatedAt: Date;
  crawledAt: Date;
}

interface StackOverflowAnswerResult {
  questionId: number;
  answers: StackOverflowAnswer[];
  crawledAt: Date;
  success: boolean;
  error?: string;
}

export class StackOverflowCrawler extends BaseCrawler {
  private baseURL = 'https://api.stackexchange.com/2.3';
  private site = 'stackoverflow';
  private client: AxiosInstance;

  constructor(options?: CrawlerOptions) {
    super('StackOverflowCrawler', options);
    
    // 配置axios实例
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: this.options.timeout || 30000,
      headers: {
        'User-Agent': 'AI-News-Crawler/1.0',
        ...this.options.headers
      }
    });

    // 配置响应拦截器处理gzip压缩
    this.client.interceptors.response.use(
      response => {
        // Stack Exchange API 默认返回gzip压缩数据
        if (response.headers['content-encoding'] === 'gzip') {
          return new Promise((resolve, reject) => {
            zlib.gunzip(Buffer.from(response.data), (err, result) => {
              if (err) {
                reject(err);
              } else {
                try {
                  response.data = JSON.parse(result.toString());
                  resolve(response);
                } catch (parseErr) {
                  reject(parseErr);
                }
              }
            });
          });
        }
        return response;
      },
      error => Promise.reject(error)
    );
  }

  /**
   * 实现 BaseCrawler 的抽象方法
   */
  async crawl(tag?: string, maxResults = 30): Promise<StackOverflowResult> {
    return this.getAIQuestions(maxResults);
  }

  /**
   * 获取问题列表
   */
  async getQuestions(
    tag: string, 
    pageSize = 30, 
    sort: 'activity' | 'votes' | 'creation' | 'hot' | 'week' | 'month' = 'activity', 
    order: 'desc' | 'asc' = 'desc'
  ): Promise<StackOverflowResult> {
    try {
      console.log(`开始获取Stack Overflow问题: ${tag}`);
      
      const response = await this.client.get('/questions', {
        params: {
          site: this.site,
          tagged: tag,
          sort,
          order,
          pagesize: pageSize,
          filter: 'withbody' // 包含问题内容
        }
      });

      const questions: StackOverflowQuestion[] = response.data.items.map((item: any) => ({
        id: item.question_id.toString(),
        title: item.title,
        body: item.body || '',
        excerpt: this.extractExcerpt(item.body || ''),
        url: item.link,
        tags: item.tags || [],
        score: item.score,
        viewCount: item.view_count,
        answerCount: item.answer_count,
        favoriteCount: item.favorite_count || 0,
        creationDate: new Date(item.creation_date * 1000),
        lastActivityDate: new Date(item.last_activity_date * 1000),
        owner: {
          userId: item.owner?.user_id || 0,
          displayName: item.owner?.display_name || 'Unknown',
          reputation: item.owner?.reputation || 0,
          profileImage: item.owner?.profile_image
        },
        isAnswered: item.is_answered,
        hasAcceptedAnswer: !!item.accepted_answer_id,
        checksum: this.calculateChecksum(item.title + (item.body || ''))
      }));

      console.log(`成功获取 ${questions.length} 个问题`);

      return {
        success: true,
        data: questions,
        crawledAt: new Date(),
        query: tag,
        questions,
        totalFound: questions.length,
        pagination: {
          currentPage: 1,
          hasNextPage: response.data.has_more || false,
          totalPages: 1,
          totalResults: questions.length
        }
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Stack Overflow问题获取失败 "${tag}": ${errorMessage}`);
      
      return {
        success: false,
        error: errorMessage,
        crawledAt: new Date(),
        query: tag,
        questions: [],
        totalFound: 0,
        pagination: {
          currentPage: 1,
          hasNextPage: false,
          totalPages: 0,
          totalResults: 0
        }
      };
    }
  }

  /**
   * 获取问题的答案
   */
  async getAnswers(questionId: number, pageSize = 10): Promise<StackOverflowAnswerResult> {
    try {
      console.log(`获取问题答案: ${questionId}`);
      
      const response = await this.client.get(`/questions/${questionId}/answers`, {
        params: {
          site: this.site,
          sort: 'votes',
          order: 'desc',
          pagesize: pageSize,
          filter: 'withbody'
        }
      });

      const answers: StackOverflowAnswer[] = response.data.items.map((item: any) => ({
        answerId: item.answer_id,
        questionId: item.question_id,
        content: item.body,
        contentType: 'html',
        score: item.score,
        isAccepted: item.is_accepted,
        owner: {
          userId: item.owner?.user_id || 0,
          displayName: item.owner?.display_name || 'Unknown',
          reputation: item.owner?.reputation || 0,
          profileImage: item.owner?.profile_image
        },
        publishedAt: new Date(item.creation_date * 1000),
        updatedAt: new Date(item.last_activity_date * 1000),
        crawledAt: new Date()
      }));

      console.log(`成功获取 ${answers.length} 个答案`);

      return {
        questionId,
        answers,
        crawledAt: new Date(),
        success: true
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
              console.error(`获取问题答案失败 ${questionId}: ${errorMessage}`);
        
        return {
          questionId,
          answers: [],
          crawledAt: new Date(),
          success: false,
          error: errorMessage
        };
      }
    }

  /**
   * 搜索问题
   */
  async searchQuestions(
    query: string, 
    pageSize = 30, 
    sort: 'relevance' | 'activity' | 'votes' | 'creation' = 'relevance'
  ): Promise<StackOverflowResult> {
    try {
      console.log(`搜索Stack Overflow问题: ${query}`);
      
      const response = await this.client.get('/search/advanced', {
        params: {
          site: this.site,
          q: query,
          sort,
          pagesize: pageSize,
          filter: 'withbody'
        }
      });

      const questions: StackOverflowQuestion[] = response.data.items.map((item: any) => ({
        id: item.question_id.toString(),
        title: item.title,
        body: item.body || '',
        excerpt: this.extractExcerpt(item.body || ''),
        url: item.link,
        tags: item.tags || [],
        score: item.score,
        viewCount: item.view_count,
        answerCount: item.answer_count,
        favoriteCount: item.favorite_count || 0,
        creationDate: new Date(item.creation_date * 1000),
        lastActivityDate: new Date(item.last_activity_date * 1000),
        owner: {
          userId: item.owner?.user_id || 0,
          displayName: item.owner?.display_name || 'Unknown',
          reputation: item.owner?.reputation || 0,
          profileImage: item.owner?.profile_image
        },
        isAnswered: item.is_answered,
        hasAcceptedAnswer: !!item.accepted_answer_id,
        checksum: this.calculateChecksum(item.title + (item.body || ''))
      }));

      console.log(`成功搜索到 ${questions.length} 个问题`);

      return {
        success: true,
        data: questions,
        crawledAt: new Date(),
        query,
        questions,
        totalFound: questions.length,
        pagination: {
          currentPage: 1,
          hasNextPage: response.data.has_more || false,
          totalPages: 1,
          totalResults: questions.length
        }
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Stack Overflow搜索失败 "${query}": ${errorMessage}`);
      
      return {
        success: false,
        error: errorMessage,
        crawledAt: new Date(),
        query,
        questions: [],
        totalFound: 0,
        pagination: {
          currentPage: 1,
          hasNextPage: false,
          totalPages: 0,
          totalResults: 0
        }
      };
    }
  }

  /**
   * 获取AI相关问题
   */
  async getAIQuestions(maxResults = 30): Promise<StackOverflowResult> {
    const aiTags = ['machine-learning', 'tensorflow', 'pytorch', 'artificial-intelligence', 'deep-learning'];
    const randomTag = aiTags[Math.floor(Math.random() * aiTags.length)];
    
    return this.getQuestions(randomTag, maxResults, 'activity', 'desc');
  }

  /**
   * 检查API配额
   */
  async checkQuota(): Promise<{ quota_max: number; quota_remaining: number }> {
    try {
      const response = await this.client.get('/info', {
        params: { site: this.site }
      });
      
      return {
        quota_max: response.data.quota_max,
        quota_remaining: response.data.quota_remaining
      };
    } catch (error) {
      console.error(`检查配额失败: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return { quota_max: 0, quota_remaining: 0 };
    }
  }

  /**
   * 测试连接
   */
  async testConnection(): Promise<{ success: boolean; questions?: number; error?: string }> {
    try {
      const result = await this.searchQuestions('machine learning', 3);
      return {
        success: result.success,
        questions: result.questions.length,
        error: result.error
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * 提取摘要文本
   */
  private extractExcerpt(body: string, maxLength = 200): string {
    if (!body) return '';
    
    // 移除HTML标签
    const textOnly = body.replace(/<[^>]*>/g, '');
    
    // 截取指定长度
    if (textOnly.length <= maxLength) {
      return textOnly;
    }
    
    return textOnly.substring(0, maxLength).trim() + '...';
  }
}