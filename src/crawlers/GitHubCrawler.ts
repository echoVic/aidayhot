import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { BaseCrawler } from './BaseCrawler';
import type {
    CrawlerOptions,
    GitHubCrawlerResult,
    GitHubRepository
} from './types';

/**
 * GitHub repository crawler with TypeScript support
 * Fetches repositories, issues, and other GitHub data with proper type safety
 */
export class GitHubCrawler extends BaseCrawler {
  private readonly baseURL: string = 'https://api.github.com';
  private readonly client: AxiosInstance;
  private readonly token?: string;

  // Default AI-related search queries
  private readonly defaultQueries: string[] = [
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

  constructor(token?: string, options: CrawlerOptions = {}) {
    super('GitHubCrawler', {
      delay: 1000, // GitHub API rate limiting
      maxRetries: 3,
      timeout: 30000,
      ...options,
    });

    this.token = token || process.env.GITHUB_TOKEN;

    // Configure axios instance
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: this.options.timeout,
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'AI-News-Crawler/1.0',
        ...this.options.headers,
      },
    });

    // Add authentication if token is provided
    if (this.token) {
      this.client.defaults.headers.common['Authorization'] = `token ${this.token}`;
    }

    // Set rate limiting based on authentication status
    this.setRateLimit({
      requestsPerMinute: this.token ? 60 : 10, // Authenticated vs unauthenticated
      requestsPerHour: this.token ? 5000 : 60,
    });
  }

  /**
   * Main crawl method - searches repositories by query
   */
  public async crawl(
    query: string = 'artificial intelligence',
    sort: 'stars' | 'forks' | 'help-wanted-issues' | 'updated' = 'updated',
    order: 'asc' | 'desc' = 'desc',
    perPage: number = 30
  ): Promise<GitHubCrawlerResult> {
    return this.searchRepositories(query, sort, order, perPage);
  }

  /**
   * Search GitHub repositories with comprehensive error handling
   */
  public async searchRepositories(
    query: string,
    sort: 'stars' | 'forks' | 'help-wanted-issues' | 'updated' = 'updated',
    order: 'asc' | 'desc' = 'desc',
    perPage: number = 30
  ): Promise<GitHubCrawlerResult> {
    try {
      console.log(`[GitHubCrawler] Searching repositories: ${query}`);

      const result = await this.executeWithRetry(async () => {
        const response: AxiosResponse<any> = await this.client.get('/search/repositories', {
          params: {
            q: query,
            sort,
            order,
            per_page: perPage,
          },
        });

        return response.data;
      }, { query, sort, order, perPage });

      const repositories: GitHubRepository[] = result.items.map((repo: any) => 
        this.parseRepositoryData(repo)
      );

      console.log(`[GitHubCrawler] Successfully fetched ${repositories.length} repositories (total: ${result.total_count})`);

      return {
        success: true,
        query,
        repositories,
        crawledAt: new Date(),
        metadata: {
          totalCount: result.total_count,
          incompleteResults: result.incomplete_results,
        },
      };

    } catch (error) {
      const crawlerError = this.handleError(error as Error, { query, sort, order, perPage });
      console.error(`[GitHubCrawler] Failed to search repositories for "${query}":`, crawlerError.message);
      
      return {
        success: false,
        query,
        repositories: [],
        crawledAt: new Date(),
        error: crawlerError.message,
      };
    }
  }

  /**
   * Get detailed repository information including README and commits
   */
  public async getRepositoryDetails(owner: string, repo: string): Promise<GitHubRepository> {
    try {
      console.log(`[GitHubCrawler] Fetching repository details: ${owner}/${repo}`);

      const [repoData, readmeContent, latestCommits, latestRelease] = await Promise.allSettled([
        this.client.get(`/repos/${owner}/${repo}`),
        this.getRepositoryReadme(owner, repo),
        this.getRepositoryCommits(owner, repo, 5),
        this.getLatestRelease(owner, repo),
      ]);

      if (repoData.status === 'rejected') {
        throw new Error(`Failed to fetch repository data: ${repoData.reason}`);
      }

      const repository = this.parseRepositoryData(repoData.value.data);

      // Add additional data if available
      if (readmeContent.status === 'fulfilled') {
        repository.metadata = {
          ...repository.metadata,
          readmeContent: readmeContent.value,
        };
      }

      if (latestCommits.status === 'fulfilled') {
        repository.metadata = {
          ...repository.metadata,
          latestCommits: latestCommits.value,
        };
      }

      if (latestRelease.status === 'fulfilled') {
        repository.metadata = {
          ...repository.metadata,
          latestRelease: latestRelease.value,
        };
      }

      return repository;

    } catch (error) {
      const crawlerError = this.handleError(error as Error, { owner, repo });
      throw crawlerError;
    }
  }

  /**
   * Get trending AI repositories across multiple categories
   */
  public async getTrendingAIRepositories(): Promise<Record<string, GitHubCrawlerResult>> {
    const results: Record<string, GitHubCrawlerResult> = {};
    
    for (const query of this.defaultQueries) {
      console.log(`[GitHubCrawler] Searching trending: ${query}...`);
      
      try {
        // Search for repositories with good activity and stars
        const searchQuery = `${query} stars:>100 pushed:>2024-01-01`;
        results[query] = await this.searchRepositories(searchQuery, 'updated', 'desc', 10);
        
        // Delay to respect rate limits
        await this.sleep(this.options.delay || 1000);
      } catch (error) {
        console.error(`[GitHubCrawler] Failed to fetch trending ${query}:`, error);
        results[query] = {
          success: false,
          query,
          repositories: [],
          crawledAt: new Date(),
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }

    return results;
  }

  /**
   * Get repositories from a specific organization
   */
  public async getOrganizationRepositories(
    org: string, 
    perPage: number = 30
  ): Promise<GitHubCrawlerResult> {
    try {
      console.log(`[GitHubCrawler] Fetching organization repositories: ${org}`);

      const result = await this.executeWithRetry(async () => {
        const response: AxiosResponse<any[]> = await this.client.get(`/orgs/${org}/repos`, {
          params: {
            sort: 'updated',
            direction: 'desc',
            per_page: perPage,
          },
        });

        return response.data;
      }, { org, perPage });

      const repositories: GitHubRepository[] = result.map((repo: any) => 
        this.parseRepositoryData(repo)
      );

      console.log(`[GitHubCrawler] Successfully fetched ${repositories.length} repositories from ${org}`);

      return {
        success: true,
        repositories,
        crawledAt: new Date(),
        metadata: { organization: org },
      };

    } catch (error) {
      const crawlerError = this.handleError(error as Error, { org, perPage });
      console.error(`[GitHubCrawler] Failed to fetch organization repositories for ${org}:`, crawlerError.message);
      
      return {
        success: false,
        repositories: [],
        crawledAt: new Date(),
        error: crawlerError.message,
        metadata: { organization: org },
      };
    }
  }

  /**
   * Get repositories from a specific user
   */
  public async getUserRepositories(
    username: string, 
    perPage: number = 30
  ): Promise<GitHubCrawlerResult> {
    try {
      console.log(`[GitHubCrawler] Fetching user repositories: ${username}`);

      const result = await this.executeWithRetry(async () => {
        const response: AxiosResponse<any[]> = await this.client.get(`/users/${username}/repos`, {
          params: {
            sort: 'updated',
            direction: 'desc',
            per_page: perPage,
          },
        });

        return response.data;
      }, { username, perPage });

      const repositories: GitHubRepository[] = result.map((repo: any) => 
        this.parseRepositoryData(repo)
      );

      console.log(`[GitHubCrawler] Successfully fetched ${repositories.length} repositories from ${username}`);

      return {
        success: true,
        repositories,
        crawledAt: new Date(),
        metadata: { username },
      };

    } catch (error) {
      const crawlerError = this.handleError(error as Error, { username, perPage });
      console.error(`[GitHubCrawler] Failed to fetch user repositories for ${username}:`, crawlerError.message);
      
      return {
        success: false,
        repositories: [],
        crawledAt: new Date(),
        error: crawlerError.message,
        metadata: { username },
      };
    }
  }

  /**
   * Check GitHub API rate limit status
   */
  public async checkRateLimit(): Promise<any> {
    try {
      const response = await this.client.get('/rate_limit');
      return response.data;
    } catch (error) {
      const crawlerError = this.handleError(error as Error);
      throw crawlerError;
    }
  }

  /**
   * Parse repository data into typed GitHubRepository object
   */
  private parseRepositoryData(repo: any): GitHubRepository {
    return {
      id: this.generateId(repo.html_url),
      name: repo.name,
      fullName: repo.full_name,
      description: repo.description || '',
      url: repo.html_url,
      homepage: repo.homepage || undefined,
      language: repo.language || '',
      stars: repo.stargazers_count || 0,
      forks: repo.forks_count || 0,
      watchers: repo.watchers_count || 0,
      issues: repo.open_issues_count || 0,
      size: repo.size || 0,
      createdAt: new Date(repo.created_at),
      updatedAt: new Date(repo.updated_at),
      pushedAt: new Date(repo.pushed_at),
      topics: repo.topics || [],
      license: repo.license?.name || undefined,
      isPrivate: repo.private || false,
      isFork: repo.fork || false,
      isArchived: repo.archived || false,
      hasWiki: repo.has_wiki || false,
      hasPages: repo.has_pages || false,
      hasDownloads: repo.has_downloads || false,
      defaultBranch: repo.default_branch || 'main',
      owner: {
        login: repo.owner.login,
        id: repo.owner.id,
        avatarUrl: repo.owner.avatar_url,
        type: repo.owner.type,
      },
      checksum: this.calculateChecksum(repo.full_name + (repo.description || '')),
      metadata: {
        cloneUrl: repo.clone_url,
        sshUrl: repo.ssh_url,
        networkCount: repo.network_count,
        subscribersCount: repo.subscribers_count,
      },
      source_type: 'github'
    };
  }

  /**
   * Get repository README content
   */
  private async getRepositoryReadme(owner: string, repo: string): Promise<string | null> {
    try {
      const response = await this.client.get(`/repos/${owner}/${repo}/readme`);
      return Buffer.from(response.data.content, 'base64').toString();
    } catch (error) {
      console.warn(`[GitHubCrawler] Could not fetch README for ${owner}/${repo}:`, error);
      return null;
    }
  }

  /**
   * Get repository latest commits
   */
  private async getRepositoryCommits(owner: string, repo: string, count: number = 5): Promise<any[]> {
    try {
      const response = await this.client.get(`/repos/${owner}/${repo}/commits`, {
        params: { per_page: count },
      });

      return response.data.map((commit: any) => ({
        sha: commit.sha,
        message: commit.commit.message,
        author: commit.commit.author.name,
        date: new Date(commit.commit.author.date),
        url: commit.html_url,
      }));
    } catch (error) {
      console.warn(`[GitHubCrawler] Could not fetch commits for ${owner}/${repo}:`, error);
      return [];
    }
  }

  /**
   * Get latest release information
   */
  private async getLatestRelease(owner: string, repo: string): Promise<any | null> {
    try {
      const response = await this.client.get(`/repos/${owner}/${repo}/releases/latest`);
      return {
        tagName: response.data.tag_name,
        name: response.data.name,
        body: response.data.body,
        publishedAt: new Date(response.data.published_at),
        url: response.data.html_url,
      };
    } catch (error) {
      console.warn(`[GitHubCrawler] Could not fetch latest release for ${owner}/${repo}:`, error);
      return null;
    }
  }

  /**
   * Test GitHub API connection
   */
  public async testConnection(): Promise<{ success: boolean; rateLimit?: any; error?: string }> {
    console.log('[GitHubCrawler] Testing API connection...');

    try {
      const rateLimit = await this.checkRateLimit();

      console.log('✅ GitHub API connection successful');
      console.log(`   - Core API limit: ${rateLimit.resources.core.remaining}/${rateLimit.resources.core.limit}`);
      console.log(`   - Search API limit: ${rateLimit.resources.search.remaining}/${rateLimit.resources.search.limit}`);

      return { success: true, rateLimit };
    } catch (error) {
      console.log('❌ GitHub API connection failed');
      console.log(`   - Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Test repository search functionality
   */
  public async testRepositorySearch(): Promise<GitHubCrawlerResult> {
    console.log('\n[GitHubCrawler] Testing repository search...');

    const result = await this.searchRepositories('machine learning language:Python stars:>1000', 'stars', 'desc', 5);

    if (result.success) {
      console.log('✅ Repository search successful');
      console.log(`   - Search results: ${result.repositories.length} repositories`);
      console.log(`   - Total: ${result.metadata?.totalCount || 'unknown'}`);

      if (result.repositories.length > 0) {
        const repo = result.repositories[0];
        console.log(`   - Sample repository: ${repo.fullName}`);
        console.log(`   - Stars: ${repo.stars}`);
        console.log(`   - Language: ${repo.language}`);
        console.log(`   - Description: ${repo.description.substring(0, 100)}...`);
      }
    } else {
      console.log('❌ Repository search failed');
      console.log(`   - Error: ${result.error}`);
    }

    return result;
  }

  /**
   * Test AI repositories fetching
   */
  public async testAIRepositories(): Promise<Record<string, GitHubCrawlerResult>> {
    console.log('\n[GitHubCrawler] Testing AI repositories fetching...');

    const results = await this.getTrendingAIRepositories();

    console.log('\n=== AI Repositories Fetching Results ===');
    let totalRepos = 0;
    let successCount = 0;

    for (const [query, result] of Object.entries(results)) {
      if (result.success) {
        successCount++;
        totalRepos += result.repositories.length;
        console.log(`✅ ${query}: ${result.repositories.length} repositories`);
      } else {
        console.log(`❌ ${query}: ${result.error}`);
      }
    }

    console.log(`\nTotal: ${successCount}/${Object.keys(results).length} queries successful, ${totalRepos} repositories fetched`);

    return results;
  }

  /**
   * Test organization repositories fetching
   */
  public async testOrganizationRepos(org: string = 'openai'): Promise<GitHubCrawlerResult> {
    console.log(`\n[GitHubCrawler] Testing organization repositories: ${org}`);
    console.log('-'.repeat(40));

    const result = await this.getOrganizationRepositories(org, 10);

    if (result.success) {
      console.log(`✅ Successfully fetched ${result.repositories.length} repositories from ${org}`);

      result.repositories.slice(0, 3).forEach((repo, index) => {
        console.log(`\n${index + 1}. ${repo.fullName}`);
        console.log(`   Stars: ${repo.stars} | Forks: ${repo.forks}`);
        console.log(`   Language: ${repo.language || 'Unknown'}`);
        console.log(`   Description: ${repo.description.substring(0, 100)}...`);
        console.log(`   Updated: ${repo.updatedAt.toDateString()}`);
      });
    } else {
      console.log(`❌ Fetch failed: ${result.error}`);
    }

    return result;
  }
}
