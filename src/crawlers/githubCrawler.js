const axios = require('axios');
const crypto = require('crypto');

class GitHubCrawler {
  constructor(token = null) {
    this.baseURL = 'https://api.github.com';
    this.token = token; // GitHub Personal Access Token (可选，但有助于提高API限制)
    
    // 配置axios实例
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'AI-News-Crawler/1.0'
      }
    });

    // 如果有token，添加认证头
    if (this.token) {
      this.client.defaults.headers.common['Authorization'] = `token ${this.token}`;
    }
  }

  // 搜索AI相关的仓库
  async searchRepositories(query, sort = 'updated', order = 'desc', perPage = 30) {
    try {
      console.log(`开始搜索GitHub仓库: ${query}`);
      
      const response = await this.client.get('/search/repositories', {
        params: {
          q: query,
          sort,
          order,
          per_page: perPage
        }
      });

      const repositories = response.data.items.map(repo => ({
        contentId: this.generateContentId(repo.html_url),
        sourceId: 'github',
        repoId: repo.id,
        name: repo.name,
        fullName: repo.full_name,
        title: repo.name,
        content: repo.description || '',
        contentType: 'text',
        originalUrl: repo.html_url,
        owner: {
          login: repo.owner.login,
          type: repo.owner.type,
          avatarUrl: repo.owner.avatar_url,
          profileUrl: repo.owner.html_url
        },
        stars: repo.stargazers_count,
        forks: repo.forks_count,
        watchers: repo.watchers_count,
        openIssues: repo.open_issues_count,
        language: repo.language,
        topics: repo.topics || [],
        license: repo.license ? repo.license.name : null,
        isPrivate: repo.private,
        isFork: repo.fork,
        isArchived: repo.archived,
        hasWiki: repo.has_wiki,
        hasPages: repo.has_pages,
        publishedAt: new Date(repo.created_at),
        updatedAt: new Date(repo.updated_at),
        pushedAt: repo.pushed_at ? new Date(repo.pushed_at) : null,
        crawledAt: new Date(),
        metadata: {
          size: repo.size,
          defaultBranch: repo.default_branch,
          cloneUrl: repo.clone_url,
          sshUrl: repo.ssh_url,
          homepage: repo.homepage
        },
        checksum: this.calculateChecksum(repo.full_name + repo.description)
      }));

      console.log(`成功获取 ${repositories.length} 个仓库 (总计 ${response.data.total_count} 个)`);

      return {
        query,
        totalCount: response.data.total_count,
        repositories,
        crawledAt: new Date(),
        success: true
      };
    } catch (error) {
      console.error(`GitHub仓库搜索失败 "${query}":`, error.message);
      return {
        query,
        error: error.message,
        success: false,
        crawledAt: new Date()
      };
    }
  }

  // 获取仓库的详细信息
  async getRepositoryDetails(owner, repo) {
    try {
      console.log(`获取仓库详情: ${owner}/${repo}`);
      
      const response = await this.client.get(`/repos/${owner}/${repo}`);
      const repoData = response.data;

      // 获取README内容
      let readmeContent = null;
      try {
        const readmeResponse = await this.client.get(`/repos/${owner}/${repo}/readme`);
        readmeContent = Buffer.from(readmeResponse.data.content, 'base64').toString();
      } catch (error) {
        console.warn(`无法获取README: ${error.message}`);
      }

      // 获取最新的提交信息
      let latestCommits = [];
      try {
        const commitsResponse = await this.client.get(`/repos/${owner}/${repo}/commits`, {
          params: { per_page: 5 }
        });
        latestCommits = commitsResponse.data.map(commit => ({
          sha: commit.sha,
          message: commit.commit.message,
          author: commit.commit.author.name,
          date: new Date(commit.commit.author.date),
          url: commit.html_url
        }));
      } catch (error) {
        console.warn(`无法获取提交信息: ${error.message}`);
      }

      // 获取发布信息
      let latestRelease = null;
      try {
        const releaseResponse = await this.client.get(`/repos/${owner}/${repo}/releases/latest`);
        latestRelease = {
          tagName: releaseResponse.data.tag_name,
          name: releaseResponse.data.name,
          body: releaseResponse.data.body,
          publishedAt: new Date(releaseResponse.data.published_at),
          url: releaseResponse.data.html_url
        };
      } catch (error) {
        console.warn(`无法获取发布信息: ${error.message}`);
      }

      return {
        contentId: this.generateContentId(repoData.html_url),
        sourceId: 'github',
        repoId: repoData.id,
        name: repoData.name,
        fullName: repoData.full_name,
        title: repoData.name,
        content: repoData.description || '',
        readmeContent,
        contentType: 'text',
        originalUrl: repoData.html_url,
        owner: {
          login: repoData.owner.login,
          type: repoData.owner.type,
          avatarUrl: repoData.owner.avatar_url,
          profileUrl: repoData.owner.html_url
        },
        stars: repoData.stargazers_count,
        forks: repoData.forks_count,
        watchers: repoData.watchers_count,
        openIssues: repoData.open_issues_count,
        language: repoData.language,
        topics: repoData.topics || [],
        license: repoData.license ? repoData.license.name : null,
        isPrivate: repoData.private,
        isFork: repoData.fork,
        isArchived: repoData.archived,
        publishedAt: new Date(repoData.created_at),
        updatedAt: new Date(repoData.updated_at),
        pushedAt: repoData.pushed_at ? new Date(repoData.pushed_at) : null,
        latestCommits,
        latestRelease,
        crawledAt: new Date(),
        metadata: {
          size: repoData.size,
          defaultBranch: repoData.default_branch,
          cloneUrl: repoData.clone_url,
          sshUrl: repoData.ssh_url,
          homepage: repoData.homepage,
          networkCount: repoData.network_count,
          subscribersCount: repoData.subscribers_count
        },
        checksum: this.calculateChecksum(repoData.full_name + repoData.description + (readmeContent || ''))
      };
    } catch (error) {
      console.error(`获取仓库详情失败 ${owner}/${repo}:`, error.message);
      throw error;
    }
  }

  // 获取AI相关的热门仓库
  async getTrendingAIRepositories() {
    const queries = [
      'artificial intelligence',
      'machine learning',
      'deep learning',
      'neural network',
      'transformer',
      'large language model',
      'computer vision',
      'natural language processing',
      'reinforcement learning'
    ];

    const results = {};
    
    for (const query of queries) {
      console.log(`正在搜索: ${query}...`);
      
      // 搜索最近更新的仓库
      const searchQuery = `${query} stars:>100 pushed:>2024-01-01`;
      results[query] = await this.searchRepositories(searchQuery, 'updated', 'desc', 10);
      
      // 延迟避免API限制
      await this.delay(1000);
    }

    return results;
  }

  // 获取特定组织的仓库
  async getOrganizationRepositories(org, perPage = 30) {
    try {
      console.log(`获取组织仓库: ${org}`);
      
      const response = await this.client.get(`/orgs/${org}/repos`, {
        params: {
          sort: 'updated',
          direction: 'desc',
          per_page: perPage
        }
      });

      const repositories = response.data.map(repo => ({
        contentId: this.generateContentId(repo.html_url),
        sourceId: 'github',
        repoId: repo.id,
        name: repo.name,
        fullName: repo.full_name,
        title: repo.name,
        content: repo.description || '',
        contentType: 'text',
        originalUrl: repo.html_url,
        organization: org,
        stars: repo.stargazers_count,
        forks: repo.forks_count,
        language: repo.language,
        topics: repo.topics || [],
        publishedAt: new Date(repo.created_at),
        updatedAt: new Date(repo.updated_at),
        crawledAt: new Date(),
        metadata: {
          size: repo.size,
          defaultBranch: repo.default_branch,
          homepage: repo.homepage
        }
      }));

      console.log(`成功获取 ${repositories.length} 个 ${org} 的仓库`);

      return {
        organization: org,
        repositories,
        crawledAt: new Date(),
        success: true
      };
    } catch (error) {
      console.error(`获取组织仓库失败 ${org}:`, error.message);
      return {
        organization: org,
        error: error.message,
        success: false,
        crawledAt: new Date()
      };
    }
  }

  // 获取用户的仓库
  async getUserRepositories(username, perPage = 30) {
    try {
      console.log(`获取用户仓库: ${username}`);
      
      const response = await this.client.get(`/users/${username}/repos`, {
        params: {
          sort: 'updated',
          direction: 'desc',
          per_page: perPage
        }
      });

      const repositories = response.data.map(repo => ({
        contentId: this.generateContentId(repo.html_url),
        sourceId: 'github',
        repoId: repo.id,
        name: repo.name,
        fullName: repo.full_name,
        title: repo.name,
        content: repo.description || '',
        contentType: 'text',
        originalUrl: repo.html_url,
        username,
        stars: repo.stargazers_count,
        forks: repo.forks_count,
        language: repo.language,
        topics: repo.topics || [],
        publishedAt: new Date(repo.created_at),
        updatedAt: new Date(repo.updated_at),
        crawledAt: new Date()
      }));

      console.log(`成功获取 ${repositories.length} 个 ${username} 的仓库`);

      return {
        username,
        repositories,
        crawledAt: new Date(),
        success: true
      };
    } catch (error) {
      console.error(`获取用户仓库失败 ${username}:`, error.message);
      return {
        username,
        error: error.message,
        success: false,
        crawledAt: new Date()
      };
    }
  }

  // 检查API限制
  async checkRateLimit() {
    try {
      const response = await this.client.get('/rate_limit');
      return response.data;
    } catch (error) {
      console.error('检查API限制失败:', error.message);
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

  // 测试GitHub API连接
  async testConnection() {
    console.log('测试GitHub API连接...');
    
    try {
      // 检查API限制
      const rateLimit = await this.checkRateLimit();
      
      console.log('✅ GitHub API连接成功');
      console.log(`   - 核心API限制: ${rateLimit.resources.core.remaining}/${rateLimit.resources.core.limit}`);
      console.log(`   - 搜索API限制: ${rateLimit.resources.search.remaining}/${rateLimit.resources.search.limit}`);
      
      return { success: true, rateLimit };
    } catch (error) {
      console.log('❌ GitHub API连接失败');
      console.log(`   - 错误: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  // 测试仓库搜索
  async testRepositorySearch() {
    console.log('\n测试仓库搜索功能...');
    
    const result = await this.searchRepositories('machine learning language:Python stars:>1000', 'stars', 'desc', 5);
    
    if (result.success) {
      console.log('✅ 仓库搜索成功');
      console.log(`   - 搜索结果: ${result.repositories.length} 个仓库`);
      console.log(`   - 总数: ${result.totalCount} 个`);
      
      if (result.repositories.length > 0) {
        const repo = result.repositories[0];
        console.log(`   - 示例仓库: ${repo.fullName}`);
        console.log(`   - Stars: ${repo.stars}`);
        console.log(`   - 语言: ${repo.language}`);
        console.log(`   - 描述: ${repo.content.substring(0, 100)}...`);
      }
    } else {
      console.log('❌ 仓库搜索失败');
      console.log(`   - 错误: ${result.error}`);
    }
    
    return result;
  }

  // 测试AI相关仓库获取
  async testAIRepositories() {
    console.log('\n测试AI相关仓库获取...');
    
    const results = await this.getTrendingAIRepositories();
    
    console.log('\n=== AI仓库获取结果汇总 ===');
    let totalRepos = 0;
    let successCount = 0;
    
    for (const [query, result] of Object.entries(results)) {
      if (result.success) {
        successCount++;
        totalRepos += result.repositories.length;
        console.log(`✅ ${query}: ${result.repositories.length} 个仓库`);
      } else {
        console.log(`❌ ${query}: ${result.error}`);
      }
    }
    
    console.log(`\n总计: ${successCount}/${Object.keys(results).length} 个查询成功, 共获取 ${totalRepos} 个仓库`);
    
    return results;
  }

  // 测试组织仓库获取
  async testOrganizationRepos(org = 'openai') {
    console.log(`\n测试组织仓库获取: ${org}`);
    console.log('-'.repeat(40));
    
    const result = await this.getOrganizationRepositories(org, 10);
    
    if (result.success) {
      console.log(`✅ 成功获取 ${org} 的 ${result.repositories.length} 个仓库`);
      
      result.repositories.slice(0, 3).forEach((repo, index) => {
        console.log(`\n${index + 1}. ${repo.fullName}`);
        console.log(`   Stars: ${repo.stars} | Forks: ${repo.forks}`);
        console.log(`   语言: ${repo.language || '未知'}`);
        console.log(`   描述: ${repo.content.substring(0, 100)}...`);
        console.log(`   更新: ${repo.updatedAt.toDateString()}`);
      });
    } else {
      console.log(`❌ 获取失败: ${result.error}`);
    }
    
    return result;
  }
}

module.exports = GitHubCrawler; 