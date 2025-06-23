import crypto from 'crypto';
import type { 
  BaseCrawler as IBaseCrawler, 
  CrawlerOptions, 
  CrawlerResult, 
  CrawlerError,
  RateLimitConfig,
  RateLimitStatus 
} from './types';

/**
 * Base crawler class providing common functionality for all crawlers
 * Implements retry logic, rate limiting, error handling, and caching
 */
export abstract class BaseCrawler implements IBaseCrawler {
  public readonly name: string;
  public readonly version: string = '1.0.0';
  public options: CrawlerOptions;

  protected rateLimitConfig?: RateLimitConfig;
  protected lastRequestTime: Date = new Date(0);
  protected requestCount: number = 0;
  protected requestHistory: Date[] = [];

  constructor(name: string, options: CrawlerOptions = {}) {
    this.name = name;
    this.options = {
      useMockData: false,
      delay: 1000,
      maxRetries: 3,
      timeout: 30000,
      headers: {
        'User-Agent': 'AI-News-Crawler/1.0 (https://github.com/echoVic/aidayhot)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      },
      ...options,
    };
  }

  // Abstract method to be implemented by subclasses
  abstract crawl(...args: any[]): Promise<CrawlerResult>;

  /**
   * Validate crawler configuration
   */
  public validateConfig(): boolean {
    try {
      if (!this.name || this.name.trim().length === 0) {
        throw new Error('Crawler name is required');
      }

      if (this.options.delay && this.options.delay < 0) {
        throw new Error('Delay must be non-negative');
      }

      if (this.options.maxRetries && this.options.maxRetries < 0) {
        throw new Error('Max retries must be non-negative');
      }

      if (this.options.timeout && this.options.timeout <= 0) {
        throw new Error('Timeout must be positive');
      }

      return true;
    } catch (error) {
      console.error(`Configuration validation failed for ${this.name}:`, error);
      return false;
    }
  }

  /**
   * Get crawler status and health information
   */
  public async getStatus(): Promise<{ healthy: boolean; lastRun?: Date; errors?: string[] }> {
    try {
      const isConfigValid = this.validateConfig();
      const rateLimitStatus = this.getRateLimitStatus();
      
      return {
        healthy: isConfigValid && !rateLimitStatus.remaining <= 0,
        lastRun: this.lastRequestTime > new Date(0) ? this.lastRequestTime : undefined,
        errors: isConfigValid ? [] : ['Invalid configuration'],
      };
    } catch (error) {
      return {
        healthy: false,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      };
    }
  }

  /**
   * Sleep for specified milliseconds
   */
  public async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Generate unique ID from input string
   */
  public generateId(input: string): string {
    return crypto.createHash('md5').update(input).digest('hex');
  }

  /**
   * Calculate checksum for content
   */
  public calculateChecksum(content: string): string {
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  /**
   * Handle and standardize errors
   */
  public handleError(error: Error, context?: Record<string, any>): CrawlerError {
    const crawlerError = error as CrawlerError;
    
    // Add context information
    crawlerError.context = {
      crawler: this.name,
      timestamp: new Date().toISOString(),
      ...context,
    };

    // Determine if error is retryable
    if (!crawlerError.retryable) {
      crawlerError.retryable = this.isRetryableError(error);
    }

    // Log error
    console.error(`[${this.name}] Error:`, {
      message: error.message,
      code: crawlerError.code,
      statusCode: crawlerError.statusCode,
      retryable: crawlerError.retryable,
      context: crawlerError.context,
    });

    return crawlerError;
  }

  /**
   * Determine if an error should trigger a retry
   */
  public shouldRetry(error: CrawlerError, attempt: number): boolean {
    if (attempt >= (this.options.maxRetries || 3)) {
      return false;
    }

    if (error.retryable === false) {
      return false;
    }

    // Don't retry client errors (4xx), but retry server errors (5xx) and network errors
    if (error.statusCode && error.statusCode >= 400 && error.statusCode < 500) {
      return false;
    }

    return true;
  }

  /**
   * Execute request with retry logic and rate limiting
   */
  protected async executeWithRetry<T>(
    operation: () => Promise<T>,
    context?: Record<string, any>
  ): Promise<T> {
    let lastError: CrawlerError | null = null;

    for (let attempt = 1; attempt <= (this.options.maxRetries || 3); attempt++) {
      try {
        // Apply rate limiting
        await this.enforceRateLimit();

        // Execute operation
        const result = await operation();
        
        // Update request tracking
        this.updateRequestHistory();
        
        return result;
      } catch (error) {
        lastError = this.handleError(error as Error, { 
          ...context, 
          attempt,
          maxRetries: this.options.maxRetries 
        });

        if (!this.shouldRetry(lastError, attempt)) {
          break;
        }

        // Exponential backoff
        const delay = (this.options.delay || 1000) * Math.pow(2, attempt - 1);
        console.log(`[${this.name}] Retrying in ${delay}ms (attempt ${attempt}/${this.options.maxRetries})`);
        await this.sleep(delay);
      }
    }

    throw lastError || new Error('Unknown error during retry execution');
  }

  /**
   * Set rate limiting configuration
   */
  protected setRateLimit(config: RateLimitConfig): void {
    this.rateLimitConfig = config;
  }

  /**
   * Get current rate limit status
   */
  protected getRateLimitStatus(): RateLimitStatus {
    if (!this.rateLimitConfig) {
      return {
        remaining: Infinity,
        resetTime: new Date(Date.now() + 60000),
        limit: Infinity,
      };
    }

    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 60000);
    
    // Clean old requests
    this.requestHistory = this.requestHistory.filter(time => time > oneMinuteAgo);
    
    const remaining = Math.max(0, this.rateLimitConfig.requestsPerMinute - this.requestHistory.length);
    
    return {
      remaining,
      resetTime: new Date(now.getTime() + 60000),
      limit: this.rateLimitConfig.requestsPerMinute,
    };
  }

  /**
   * Enforce rate limiting before making requests
   */
  protected async enforceRateLimit(): Promise<void> {
    if (!this.rateLimitConfig) {
      return;
    }

    const status = this.getRateLimitStatus();
    
    if (status.remaining <= 0) {
      const waitTime = status.resetTime.getTime() - Date.now();
      if (waitTime > 0) {
        console.log(`[${this.name}] Rate limit reached, waiting ${waitTime}ms`);
        await this.sleep(waitTime);
      }
    }

    // Ensure minimum delay between requests
    const timeSinceLastRequest = Date.now() - this.lastRequestTime.getTime();
    const minDelay = this.options.delay || 1000;
    
    if (timeSinceLastRequest < minDelay) {
      await this.sleep(minDelay - timeSinceLastRequest);
    }
  }

  /**
   * Update request history for rate limiting
   */
  private updateRequestHistory(): void {
    const now = new Date();
    this.lastRequestTime = now;
    this.requestHistory.push(now);
    this.requestCount++;
  }

  /**
   * Determine if an error is retryable
   */
  private isRetryableError(error: Error): boolean {
    const retryableErrors = [
      'ECONNRESET',
      'ENOTFOUND',
      'ECONNREFUSED',
      'ETIMEDOUT',
      'ECONNABORTED',
      'NETWORK_ERROR',
      'TIMEOUT',
    ];

    return retryableErrors.some(code => 
      error.message.includes(code) || 
      (error as any).code === code
    );
  }

  /**
   * Create a standardized crawler result
   */
  protected createResult<T>(
    data: T, 
    success: boolean = true, 
    error?: string,
    metadata?: Record<string, any>
  ): CrawlerResult<T> {
    return {
      success,
      data: success ? data : undefined,
      error: success ? undefined : error,
      crawledAt: new Date(),
      metadata,
    };
  }

  /**
   * Validate URL format
   */
  protected isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Clean and normalize text content
   */
  protected cleanText(text: string): string {
    if (!text) return '';
    
    return text
      .replace(/\s+/g, ' ')
      .replace(/\n+/g, ' ')
      .trim();
  }

  /**
   * Extract domain from URL
   */
  protected extractDomain(url: string): string {
    try {
      return new URL(url).hostname;
    } catch {
      return '';
    }
  }
}
