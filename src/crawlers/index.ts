/**
 * TypeScript Crawlers Export Module
 * Provides centralized access to all crawler implementations
 */

// Export types
export * from './types';

// Export base crawler
export { BaseCrawler } from './BaseCrawler';

// Export specific crawlers
export { ArxivCrawler } from './ArxivCrawler';
export { GitHubCrawler } from './GitHubCrawler';

// Legacy JavaScript crawlers (if they exist)
// Note: These should be migrated to TypeScript
export { default as PapersWithCodeCrawlerJS } from './papersWithCodeCrawler.js';
export { default as RSSCrawlerJS } from './rssCrawler.js';
export { default as SocialMediaCrawlerJS } from './socialMediaCrawler.js';
export { default as StackOverflowCrawlerJS } from './stackOverflowCrawler.js';
export { default as VideoCrawlerJS } from './videoCrawler.js';
export { default as WebCrawlerJS } from './webCrawler.js';

// Crawler factory
import { ArxivCrawler } from './ArxivCrawler';
import { GitHubCrawler } from './GitHubCrawler';
import type { CrawlerOptions } from './types';

export interface CrawlerFactory {
  createArxivCrawler(options?: CrawlerOptions): ArxivCrawler;
  createGitHubCrawler(token?: string, options?: CrawlerOptions): GitHubCrawler;
}

export const crawlerFactory: CrawlerFactory = {
  createArxivCrawler(options?: CrawlerOptions) {
    return new ArxivCrawler(options);
  },
  
  createGitHubCrawler(token?: string, options?: CrawlerOptions) {
    return new GitHubCrawler(token, options);
  },
};

// Crawler manager for handling multiple crawlers
export class CrawlerManager {
  private crawlers: Map<string, any> = new Map();

  /**
   * Register a crawler with a unique name
   */
  register(name: string, crawler: any): void {
    if (this.crawlers.has(name)) {
      console.warn(`[CrawlerManager] Overwriting existing crawler: ${name}`);
    }
    this.crawlers.set(name, crawler);
  }

  /**
   * Get a registered crawler by name
   */
  get(name: string): any | undefined {
    const crawler = this.crawlers.get(name);
    if (!crawler) {
      console.warn(`[CrawlerManager] Crawler not found: ${name}`);
    }
    return crawler;
  }

  /**
   * Get all registered crawler names
   */
  getNames(): string[] {
    return Array.from(this.crawlers.keys());
  }

  /**
   * Check health of all registered crawlers
   */
  async checkHealth(): Promise<Record<string, { healthy: boolean; error?: string }>> {
    const healthChecks: Record<string, { healthy: boolean; error?: string }> = {};

    for (const [name, crawler] of this.crawlers) {
      try {
        if (typeof crawler.validateConfig === 'function') {
          const isValid = crawler.validateConfig();
          healthChecks[name] = { healthy: isValid };
        } else {
          healthChecks[name] = { healthy: true };
        }
      } catch (error) {
        healthChecks[name] = {
          healthy: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }

    return healthChecks;
  }

  /**
   * Run all crawlers with optional timeout
   */
  async runAll(options?: { timeout?: number }): Promise<Record<string, any>> {
    const results: Record<string, any> = {};
    const timeout = options?.timeout || 30000;

    const promises = Array.from(this.crawlers.entries()).map(async ([name, crawler]) => {
      try {
        if (typeof crawler.crawl === 'function') {
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error(`Timeout after ${timeout}ms`)), timeout)
          );

          const result = await Promise.race([
            crawler.crawl(),
            timeoutPromise,
          ]);

          results[name] = result;
        } else {
          results[name] = { error: 'Crawler does not implement crawl method' };
        }
      } catch (error) {
        results[name] = {
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    });

    await Promise.allSettled(promises);
    return results;
  }
}

// Test utility function
export async function testAllCrawlers(): Promise<void> {
  console.log('🧪 Testing all TypeScript crawlers...');

  try {
    // Test ArXiv crawler
    const arxivCrawler = new ArxivCrawler();
    console.log('📄 Testing ArXiv crawler...');
    const arxivResult = await arxivCrawler.testConnection();
    console.log(`ArXiv: ${arxivResult.success ? '✅' : '❌'} (${arxivResult.papers?.length || 0} papers)`);

    // Test GitHub crawler
    const githubCrawler = new GitHubCrawler();
    console.log('🐙 Testing GitHub crawler...');
    const githubResult = await githubCrawler.testConnection();
    console.log(`GitHub: ${githubResult.success ? '✅' : '❌'}`);

  } catch (error) {
    console.error('❌ Crawler testing failed:', error);
  }
}

// Migration helper for converting JS results to TS types
export class CrawlerMigrationHelper {
  /**
   * Convert old JavaScript ArXiv results to TypeScript format
   */
  static convertArxivResult(jsResult: any): import('./types').ArxivCrawlerResult {
    return {
      success: jsResult.success || false,
      query: jsResult.query || '',
      totalResults: jsResult.totalResults || 0,
      papers: jsResult.papers || [],
      crawledAt: jsResult.crawledAt ? new Date(jsResult.crawledAt) : new Date(),
      error: jsResult.error,
    };
  }

  /**
   * Convert old JavaScript GitHub results to TypeScript format
   */
  static convertGitHubResult(jsResult: any): import('./types').GitHubCrawlerResult {
    return {
      success: jsResult.success || false,
      query: jsResult.query,
      username: jsResult.username,
      repositories: jsResult.repositories || [],
      crawledAt: jsResult.crawledAt ? new Date(jsResult.crawledAt) : new Date(),
      error: jsResult.error,
    };
  }
}
