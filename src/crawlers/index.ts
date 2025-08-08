/**
 * TypeScript Crawlers Export Module
 * Provides centralized access to all crawler implementations
 */

// Export types
export * from './types';

// Export specific crawlers (only used ones)
export { ArxivCrawler } from './ArxivCrawler';
export { GitHubCrawler } from './GitHubCrawler';
export { RSSCrawler } from './RSSCrawler';
export { StackOverflowCrawler } from './StackOverflowCrawler';

// Crawler manager for handling multiple crawlers
class CrawlerManager {
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

