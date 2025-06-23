/**
 * TypeScript type definitions for web crawlers
 * Provides type safety for all crawler operations and data structures
 */

// Base interfaces for crawler operations
export interface CrawlerOptions {
  useMockData?: boolean;
  delay?: number;
  maxRetries?: number;
  timeout?: number;
  headers?: Record<string, string>;
}

export interface CrawlerResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  crawledAt: Date;
  metadata?: Record<string, any>;
}

export interface PaginatedCrawlerResult<T = any> extends CrawlerResult<T[]> {
  pagination?: {
    currentPage: number;
    hasNextPage: boolean;
    nextPageUrl?: string;
    totalPages?: number;
    totalResults?: number;
  };
}

// Article/Content interfaces
export interface CrawledArticle {
  id: string;
  title: string;
  summary: string;
  content?: string;
  author: string;
  publishTime: string;
  category: string;
  tags: string[];
  imageUrl?: string;
  sourceUrl: string;
  sourceType: string;
  sourceId: string;
  readTime?: string;
  views?: number;
  likes?: number;
  isHot?: boolean;
  isNew?: boolean;
  checksum?: string;
  metadata?: Record<string, any>;
}

// ArXiv specific interfaces
export interface ArxivPaper {
  id: string;
  title: string;
  summary: string;
  authors: string[];
  published: Date;
  updated: Date;
  categories: string[];
  primaryCategory: string;
  pdfUrl: string;
  abstractUrl: string;
  doi?: string;
  journalRef?: string;
  comments?: string;
  tags: string[];
  checksum: string;
}

export interface ArxivCrawlerResult extends CrawlerResult<ArxivPaper[]> {
  query: string;
  totalResults: number;
  papers: ArxivPaper[];
}

// GitHub specific interfaces
export interface GitHubRepository {
  id: string;
  name: string;
  fullName: string;
  description: string;
  url: string;
  homepage?: string;
  language: string;
  stars: number;
  forks: number;
  watchers: number;
  issues: number;
  size: number;
  createdAt: Date;
  updatedAt: Date;
  pushedAt: Date;
  topics: string[];
  license?: string;
  isPrivate: boolean;
  isFork: boolean;
  isArchived: boolean;
  hasWiki: boolean;
  hasPages: boolean;
  hasDownloads: boolean;
  defaultBranch: string;
  owner: {
    login: string;
    id: number;
    avatarUrl: string;
    type: string;
  };
  checksum: string;
}

export interface GitHubCrawlerResult extends CrawlerResult<GitHubRepository[]> {
  query?: string;
  username?: string;
  repositories: GitHubRepository[];
}

// RSS specific interfaces
export interface RSSItem {
  id: string;
  title: string;
  description: string;
  link: string;
  pubDate: Date;
  author?: string;
  categories: string[];
  guid?: string;
  enclosure?: {
    url: string;
    type: string;
    length?: number;
  };
  content?: string;
  contentSnippet?: string;
  checksum: string;
}

export interface RSSFeed {
  title: string;
  description: string;
  link: string;
  language?: string;
  lastBuildDate?: Date;
  pubDate?: Date;
  ttl?: number;
  items: RSSItem[];
}

export interface RSSCrawlerResult extends CrawlerResult<RSSFeed> {
  sourceId: string;
  feedUrl: string;
  feed: RSSFeed;
}

// Video platform interfaces
export interface VideoContent {
  id: string;
  title: string;
  description: string;
  url: string;
  thumbnailUrl?: string;
  duration?: string;
  publishedAt: Date;
  channelId: string;
  channelTitle: string;
  viewCount?: number;
  likeCount?: number;
  commentCount?: number;
  tags: string[];
  category?: string;
  language?: string;
  quality?: string;
  platform: 'youtube' | 'bilibili' | 'other';
  checksum: string;
}

export interface VideoCrawlerResult extends CrawlerResult<VideoContent[]> {
  query?: string;
  platform: string;
  videos: VideoContent[];
}

// Web scraping interfaces
export interface WebSiteConfig {
  name: string;
  url: string;
  category: string;
  selectors: {
    article: string;
    title: string;
    link: string;
    excerpt?: string;
    date?: string;
    author?: string;
    image?: string;
  };
  baseUrl?: string;
  encoding?: string;
}

export interface WebArticle {
  title: string;
  link: string;
  excerpt?: string;
  date?: string;
  author?: string;
  imageUrl?: string;
  siteName: string;
  category: string;
  checksum?: string;
}

export interface WebCrawlerResult extends CrawlerResult<WebArticle[]> {
  siteName: string;
  articles: WebArticle[];
}

// Papers with Code interfaces
export interface PapersWithCodePaper {
  id: string;
  title: string;
  abstract: string;
  url: string;
  pdfUrl?: string;
  codeUrl?: string;
  authors: string[];
  publishedAt: Date;
  venue?: string;
  tasks: string[];
  datasets: string[];
  methods: string[];
  stars?: number;
  forks?: number;
  framework?: string;
  checksum: string;
}

export interface PapersWithCodeResult extends PaginatedCrawlerResult<PapersWithCodePaper> {
  query: string;
  papers: PapersWithCodePaper[];
  totalFound: number;
}

// Stack Overflow interfaces
export interface StackOverflowQuestion {
  id: string;
  title: string;
  body?: string;
  excerpt?: string;
  url: string;
  tags: string[];
  score: number;
  viewCount: number;
  answerCount: number;
  favoriteCount?: number;
  creationDate: Date;
  lastActivityDate: Date;
  owner: {
    userId: number;
    displayName: string;
    reputation: number;
    profileImage?: string;
  };
  isAnswered: boolean;
  hasAcceptedAnswer: boolean;
  checksum: string;
}

export interface StackOverflowResult extends PaginatedCrawlerResult<StackOverflowQuestion> {
  query: string;
  questions: StackOverflowQuestion[];
  totalFound: number;
}

// Social media interfaces
export interface SocialMediaPost {
  id: string;
  content: string;
  url: string;
  author: {
    username: string;
    displayName: string;
    avatarUrl?: string;
    verified?: boolean;
  };
  publishedAt: Date;
  platform: 'twitter' | 'reddit' | 'linkedin' | 'other';
  metrics: {
    likes?: number;
    shares?: number;
    comments?: number;
    views?: number;
  };
  hashtags: string[];
  mentions: string[];
  mediaUrls: string[];
  checksum: string;
}

export interface SocialMediaResult extends CrawlerResult<SocialMediaPost[]> {
  platform: string;
  query?: string;
  posts: SocialMediaPost[];
}

// Error handling interfaces
export interface CrawlerError extends Error {
  code?: string;
  statusCode?: number;
  retryable?: boolean;
  context?: Record<string, any>;
}

// Cache interfaces
export interface CacheEntry<T = any> {
  data: T;
  timestamp: Date;
  ttl: number;
  key: string;
}

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  maxSize?: number;
  strategy?: 'lru' | 'fifo' | 'ttl';
}

// Rate limiting interfaces
export interface RateLimitConfig {
  requestsPerMinute: number;
  requestsPerHour?: number;
  requestsPerDay?: number;
  burstLimit?: number;
}

export interface RateLimitStatus {
  remaining: number;
  resetTime: Date;
  limit: number;
}

// Base crawler interface
export interface BaseCrawler {
  readonly name: string;
  readonly version: string;
  options: CrawlerOptions;
  
  // Core methods
  crawl(...args: any[]): Promise<CrawlerResult>;
  validateConfig(): boolean;
  getStatus(): Promise<{ healthy: boolean; lastRun?: Date; errors?: string[] }>;
  
  // Utility methods
  sleep(ms: number): Promise<void>;
  generateId(input: string): string;
  calculateChecksum(content: string): string;
  
  // Error handling
  handleError(error: Error, context?: Record<string, any>): CrawlerError;
  shouldRetry(error: CrawlerError, attempt: number): boolean;
}
