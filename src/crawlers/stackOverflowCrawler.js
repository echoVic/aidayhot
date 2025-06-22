const axios = require('axios');
const crypto = require('crypto');
const zlib = require('zlib');

class StackOverflowCrawler {
  constructor() {
    this.baseURL = 'https://api.stackexchange.com/2.3';
    this.site = 'stackoverflow';
    
    // 配置axios实例
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
      headers: {
        'User-Agent': 'AI-News-Crawler/1.0'
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
                response.data = JSON.parse(result.toString());
                resolve(response);
              }
            });
          });
        }
        return response;
      },
      error => Promise.reject(error)
    );
  }

  // 获取问题列表
  async getQuestions(tag, pageSize = 30, sort = 'activity', order = 'desc') {
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

      const questions = response.data.items.map(item => ({
        contentId: this.generateContentId(item.link),
        sourceId: 'stackoverflow',
        questionId: item.question_id,
        title: item.title,
        content: item.body || '',
        contentType: 'html',
        originalUrl: item.link,
        tags: item.tags || [],
        score: item.score,
        viewCount: item.view_count,
        answerCount: item.answer_count,
        favoriteCount: item.favorite_count || 0,
        isAnswered: item.is_answered,
        hasAcceptedAnswer: item.accepted_answer_id ? true : false,
        owner: {
          userId: item.owner.user_id,
          displayName: item.owner.display_name,
          reputation: item.owner.reputation,
          profileImage: item.owner.profile_image,
          userType: item.owner.user_type
        },
        publishedAt: new Date(item.creation_date * 1000),
        updatedAt: new Date(item.last_activity_date * 1000),
        crawledAt: new Date(),
        metadata: {
          closedDate: item.closed_date ? new Date(item.closed_date * 1000) : null,
          closedReason: item.closed_reason,
          communityOwnedDate: item.community_owned_date ? new Date(item.community_owned_date * 1000) : null,
          lockedDate: item.locked_date ? new Date(item.locked_date * 1000) : null,
          protectedDate: item.protected_date ? new Date(item.protected_date * 1000) : null,
          bountyAmount: item.bounty_amount || 0,
          bountyClosesDate: item.bounty_closes_date ? new Date(item.bounty_closes_date * 1000) : null
        },
        checksum: this.calculateChecksum(item.title + item.body)
      }));

      console.log(`成功获取 ${questions.length} 个问题`);

      return {
        tag,
        questions,
        hasMore: response.data.has_more,
        quotaMax: response.data.quota_max,
        quotaRemaining: response.data.quota_remaining,
        crawledAt: new Date(),
        success: true
      };
    } catch (error) {
      console.error(`Stack Overflow问题获取失败 "${tag}":`, error.message);
      return {
        tag,
        error: error.message,
        success: false,
        crawledAt: new Date()
      };
    }
  }

  // 获取问题的答案
  async getAnswers(questionId, pageSize = 10) {
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

      const answers = response.data.items.map(item => ({
        answerId: item.answer_id,
        questionId: item.question_id,
        content: item.body,
        contentType: 'html',
        score: item.score,
        isAccepted: item.is_accepted,
        owner: {
          userId: item.owner.user_id,
          displayName: item.owner.display_name,
          reputation: item.owner.reputation,
          profileImage: item.owner.profile_image
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
      console.error(`获取问题答案失败 ${questionId}:`, error.message);
      return {
        questionId,
        error: error.message,
        success: false,
        crawledAt: new Date()
      };
    }
  }

  // 搜索问题
  async searchQuestions(query, pageSize = 30, sort = 'relevance') {
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

      const questions = response.data.items.map(item => ({
        contentId: this.generateContentId(item.link),
        sourceId: 'stackoverflow',
        questionId: item.question_id,
        title: item.title,
        content: item.body || '',
        contentType: 'html',
        originalUrl: item.link,
        tags: item.tags || [],
        score: item.score,
        viewCount: item.view_count,
        answerCount: item.answer_count,
        isAnswered: item.is_answered,
        owner: item.owner ? {
          userId: item.owner.user_id,
          displayName: item.owner.display_name,
          reputation: item.owner.reputation
        } : null,
        publishedAt: new Date(item.creation_date * 1000),
        updatedAt: new Date(item.last_activity_date * 1000),
        crawledAt: new Date(),
        checksum: this.calculateChecksum(item.title + item.body)
      }));

      console.log(`搜索到 ${questions.length} 个问题`);

      return {
        query,
        questions,
        hasMore: response.data.has_more,
        quotaRemaining: response.data.quota_remaining,
        crawledAt: new Date(),
        success: true
      };
    } catch (error) {
      console.error(`Stack Overflow问题搜索失败 "${query}":`, error.message);
      return {
        query,
        error: error.message,
        success: false,
        crawledAt: new Date()
      };
    }
  }

  // 获取AI相关的热门问题
  async getAIQuestions() {
    const tags = [
      'artificial-intelligence',
      'machine-learning',
      'deep-learning',
      'neural-network',
      'tensorflow',
      'pytorch',
      'scikit-learn',
      'opencv',
      'nlp',
      'computer-vision'
    ];

    const results = {};
    
    for (const tag of tags) {
      console.log(`正在获取 ${tag} 标签的问题...`);
      
      results[tag] = await this.getQuestions(tag, 10);
      
      // 延迟避免API限制
      await this.delay(100);
    }

    return results;
  }

  // 获取用户信息
  async getUserInfo(userId) {
    try {
      console.log(`获取用户信息: ${userId}`);
      
      const response = await this.client.get(`/users/${userId}`, {
        params: {
          site: this.site
        }
      });

      if (response.data.items.length === 0) {
        throw new Error('User not found');
      }

      const user = response.data.items[0];
      
      return {
        userId: user.user_id,
        displayName: user.display_name,
        reputation: user.reputation,
        profileImage: user.profile_image,
        websiteUrl: user.website_url,
        location: user.location,
        aboutMe: user.about_me,
        creationDate: new Date(user.creation_date * 1000),
        lastAccessDate: new Date(user.last_access_date * 1000),
        questionCount: user.question_count,
        answerCount: user.answer_count,
        upVoteCount: user.up_vote_count,
        downVoteCount: user.down_vote_count,
        acceptRate: user.accept_rate,
        isEmployee: user.is_employee,
        badgeCounts: user.badge_counts,
        crawledAt: new Date(),
        success: true
      };
    } catch (error) {
      console.error(`获取用户信息失败 ${userId}:`, error.message);
      return {
        userId,
        error: error.message,
        success: false,
        crawledAt: new Date()
      };
    }
  }

  // 获取标签信息
  async getTagInfo(tagName) {
    try {
      console.log(`获取标签信息: ${tagName}`);
      
      const response = await this.client.get('/tags', {
        params: {
          site: this.site,
          inname: tagName,
          sort: 'popular'
        }
      });

      if (response.data.items.length === 0) {
        throw new Error('Tag not found');
      }

      const tag = response.data.items[0];
      
      return {
        name: tag.name,
        count: tag.count,
        excerpt: tag.excerpt,
        description: tag.wiki_excerpt,
        isModeratorOnly: tag.is_moderator_only,
        isRequired: tag.is_required,
        synonyms: tag.synonyms || [],
        crawledAt: new Date(),
        success: true
      };
    } catch (error) {
      console.error(`获取标签信息失败 ${tagName}:`, error.message);
      return {
        tagName,
        error: error.message,
        success: false,
        crawledAt: new Date()
      };
    }
  }

  // 检查API配额
  async checkQuota() {
    try {
      const response = await this.client.get('/info', {
        params: {
          site: this.site
        }
      });

      return {
        quotaMax: response.data.quota_max,
        quotaRemaining: response.data.quota_remaining,
        success: true
      };
    } catch (error) {
      console.error('检查API配额失败:', error.message);
      throw error;
    }
  }

  // 生成内容ID
  generateContentId(url) {
    return crypto.createHash('md5').update(url).digest('hex');
  }

  // 计算内容校验和
  calculateChecksum(content) {
    if (!content) return null;
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  // 延迟函数
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // 测试Stack Overflow API连接
  async testConnection() {
    console.log('测试Stack Overflow API连接...');
    
    try {
      const quota = await this.checkQuota();
      
      console.log('✅ Stack Overflow API连接成功');
      console.log(`   - API配额剩余: ${quota.quotaRemaining}/${quota.quotaMax}`);
      
      return { success: true, quota };
    } catch (error) {
      console.log('❌ Stack Overflow API连接失败');
      console.log(`   - 错误: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  // 测试问题获取
  async testQuestionFetching() {
    console.log('\n测试问题获取功能...');
    
    const result = await this.getQuestions('machine-learning', 5);
    
    if (result.success) {
      console.log('✅ 问题获取成功');
      console.log(`   - 标签: ${result.tag}`);
      console.log(`   - 问题数量: ${result.questions.length}`);
      console.log(`   - API配额剩余: ${result.quotaRemaining}`);
      
      if (result.questions.length > 0) {
        const question = result.questions[0];
        console.log(`   - 示例问题: ${question.title}`);
        console.log(`   - 评分: ${question.score}`);
        console.log(`   - 浏览次数: ${question.viewCount}`);
        console.log(`   - 答案数: ${question.answerCount}`);
        console.log(`   - 标签: ${question.tags.join(', ')}`);
      }
    } else {
      console.log('❌ 问题获取失败');
      console.log(`   - 错误: ${result.error}`);
    }
    
    return result;
  }

  // 测试搜索功能
  async testSearch(query = 'tensorflow') {
    console.log(`\n测试搜索功能: "${query}"`);
    console.log('-'.repeat(40));
    
    const result = await this.searchQuestions(query, 5);
    
    if (result.success) {
      console.log(`✅ 搜索成功: 找到 ${result.questions.length} 个相关问题`);
      
      result.questions.slice(0, 3).forEach((question, index) => {
        console.log(`\n${index + 1}. ${question.title}`);
        console.log(`   评分: ${question.score} | 浏览: ${question.viewCount} | 答案: ${question.answerCount}`);
        console.log(`   标签: ${question.tags.join(', ')}`);
        console.log(`   提问时间: ${question.publishedAt.toDateString()}`);
        if (question.owner) {
          console.log(`   提问者: ${question.owner.displayName} (声望: ${question.owner.reputation})`);
        }
      });
    } else {
      console.log(`❌ 搜索失败: ${result.error}`);
    }
    
    return result;
  }

  // 测试AI相关问题获取
  async testAIQuestions() {
    console.log('\n测试AI相关问题获取...');
    
    const results = await this.getAIQuestions();
    
    console.log('\n=== AI问题获取结果汇总 ===');
    let totalQuestions = 0;
    let successCount = 0;
    
    for (const [tag, result] of Object.entries(results)) {
      if (result.success) {
        successCount++;
        totalQuestions += result.questions.length;
        console.log(`✅ ${tag}: ${result.questions.length} 个问题`);
      } else {
        console.log(`❌ ${tag}: ${result.error}`);
      }
    }
    
    console.log(`\n总计: ${successCount}/${Object.keys(results).length} 个标签成功, 共获取 ${totalQuestions} 个问题`);
    
    return results;
  }

  // 测试答案获取
  async testAnswerFetching() {
    console.log('\n测试答案获取功能...');
    
    // 先获取一个问题
    const questionsResult = await this.getQuestions('python', 1);
    
    if (!questionsResult.success || questionsResult.questions.length === 0) {
      console.log('❌ 无法获取问题来测试答案功能');
      return;
    }
    
    const questionId = questionsResult.questions[0].questionId;
    console.log(`测试问题ID: ${questionId}`);
    
    const answersResult = await this.getAnswers(questionId, 3);
    
    if (answersResult.success) {
      console.log(`✅ 成功获取 ${answersResult.answers.length} 个答案`);
      
      answersResult.answers.forEach((answer, index) => {
        console.log(`\n答案 ${index + 1}:`);
        console.log(`   评分: ${answer.score}`);
        console.log(`   是否被采纳: ${answer.isAccepted ? '是' : '否'}`);
        console.log(`   回答者: ${answer.owner.displayName} (声望: ${answer.owner.reputation})`);
        console.log(`   回答时间: ${answer.publishedAt.toDateString()}`);
      });
    } else {
      console.log(`❌ 获取答案失败: ${answersResult.error}`);
    }
    
    return answersResult;
  }
}

module.exports = StackOverflowCrawler; 