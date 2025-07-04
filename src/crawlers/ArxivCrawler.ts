import axios, { AxiosResponse } from 'axios';
import { Parser } from 'xml2js';
import { BaseCrawler } from './BaseCrawler';
import type { 
  ArxivPaper, 
  ArxivCrawlerResult, 
  CrawlerOptions,
  CrawlerResult 
} from './types';

/**
 * ArXiv paper crawler with TypeScript support
 * Fetches academic papers from arXiv.org API with proper type safety
 */
export class ArxivCrawler extends BaseCrawler {
  private readonly baseURL: string = 'http://export.arxiv.org/api/query';
  private readonly parser: Parser;

  // Category mappings for better UX
  private readonly categoryMap: Record<string, string> = {
    'cat:cs.AI': '人工智能',
    'cat:cs.LG': '机器学习',
    'cat:cs.CL': '自然语言处理',
    'cat:cs.CV': '计算机视觉',
    'cat:cs.NE': '神经网络',
    'cat:cs.CR': '密码学与安全',
    'cat:cs.DB': '数据库',
    'cat:cs.IR': '信息检索',
    'cat:cs.RO': '机器人学',
    'cat:stat.ML': '统计机器学习',
  };

  // Default AI-related search queries
  private readonly defaultQueries: string[] = [
    'cat:cs.AI',
    'cat:cs.LG', 
    'cat:cs.CL',
    'cat:cs.CV',
    'cat:cs.NE'
  ];

  constructor(options: CrawlerOptions = {}) {
    super('ArxivCrawler', {
      delay: 1000, // ArXiv recommends 3 seconds between requests
      maxRetries: 3,
      timeout: 30000,
      ...options,
    });

    this.parser = new Parser({ 
      explicitArray: false,
      mergeAttrs: true,
      normalize: true,
      normalizeTags: true,
      trim: true
    });

    // Set rate limiting for ArXiv API
    this.setRateLimit({
      requestsPerMinute: 20, // Conservative rate limit
      requestsPerHour: 1000,
    });
  }

  /**
   * Main crawl method - fetches papers by query
   */
  public async crawl(
    query: string = 'cat:cs.AI',
    start: number = 0,
    maxResults: number = 100,
    sortBy: 'relevance' | 'lastUpdatedDate' | 'submittedDate' = 'submittedDate',
    sortOrder: 'ascending' | 'descending' = 'descending'
  ): Promise<ArxivCrawlerResult> {
    return this.fetchArxivPapers(query, start, maxResults, sortBy, sortOrder);
  }

  /**
   * Fetch ArXiv papers with comprehensive error handling and type safety
   */
  public async fetchArxivPapers(
    query: string,
    start: number = 0,
    maxResults: number = 100,
    sortBy: 'relevance' | 'lastUpdatedDate' | 'submittedDate' = 'submittedDate',
    sortOrder: 'ascending' | 'descending' = 'descending'
  ): Promise<ArxivCrawlerResult> {
    try {
      console.log(`[ArxivCrawler] Fetching papers: ${query}, count: ${maxResults}`);

      const result = await this.executeWithRetry(async () => {
        const response: AxiosResponse<string> = await axios.get(this.baseURL, {
          params: {
            search_query: query,
            start,
            max_results: maxResults,
            sortBy,
            sortOrder,
          },
          timeout: this.options.timeout,
          headers: this.options.headers,
        });

        return response.data;
      }, { query, start, maxResults });

      // Parse XML response
      const parsedResult = await this.parser.parseStringPromise(result);
      
      if (!parsedResult?.feed) {
        throw new Error('Invalid arXiv API response: missing feed element');
      }

      // Extract paper entries
      let entries = parsedResult.feed.entry;
      if (!entries) {
        console.log('[ArxivCrawler] No papers found');
        return {
          success: true,
          query,
          totalResults: 0,
          papers: [],
          crawledAt: new Date(),
        };
      }

      // Ensure entries is an array
      if (!Array.isArray(entries)) {
        entries = [entries];
      }

      // Convert entries to typed papers
      const papers: ArxivPaper[] = entries.map((entry: any) => this.parseArxivEntry(entry));

      const totalResults = parseInt(parsedResult.feed.opensearch_totalresults) || papers.length;

      console.log(`[ArxivCrawler] Successfully fetched ${papers.length} papers (total: ${totalResults})`);

      return {
        success: true,
        query,
        totalResults,
        papers,
        crawledAt: new Date(),
      };

    } catch (error) {
      const crawlerError = this.handleError(error as Error, { query, start, maxResults });
      console.error(`[ArxivCrawler] Failed to fetch papers for "${query}":`, crawlerError.message);
      
      return {
        success: false,
        query,
        totalResults: 0,
        papers: [],
        crawledAt: new Date(),
        error: crawlerError.message,
      };
    }
  }

  /**
   * Fetch latest AI-related papers across multiple categories
   */
  public async fetchLatestAIPapers(maxResults: number = 50): Promise<Record<string, ArxivCrawlerResult>> {
    const results: Record<string, ArxivCrawlerResult> = {};
    
    for (const query of this.defaultQueries) {
      const categoryName = this.getCategoryName(query);
      console.log(`[ArxivCrawler] Fetching ${categoryName} papers...`);
      
      try {
        results[categoryName] = await this.fetchArxivPapers(query, 0, maxResults);
        
        // Delay to respect rate limits
        await this.sleep(this.options.delay || 1000);
      } catch (error) {
        console.error(`[ArxivCrawler] Failed to fetch ${categoryName}:`, error);
        results[categoryName] = {
          success: false,
          query,
          totalResults: 0,
          papers: [],
          crawledAt: new Date(),
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }

    return results;
  }

  /**
   * Search papers by keywords
   */
  public async searchPapers(keywords: string, maxResults: number = 30): Promise<ArxivCrawlerResult> {
    const searchQuery = `all:${keywords}`;
    return this.fetchArxivPapers(searchQuery, 0, maxResults);
  }

  /**
   * Get papers by specific author
   */
  public async getAuthorPapers(authorName: string, maxResults: number = 50): Promise<ArxivCrawlerResult> {
    const searchQuery = `au:"${authorName}"`;
    return this.fetchArxivPapers(searchQuery, 0, maxResults);
  }

  /**
   * Parse individual ArXiv entry into typed paper object
   */
  private parseArxivEntry(entry: any): ArxivPaper {
    // Parse authors
    const authors: string[] = [];
    if (entry.author) {
      if (Array.isArray(entry.author)) {
        authors.push(...entry.author.map((a: any) => a.name || a));
      } else {
        authors.push(entry.author.name || entry.author);
      }
    }

    // Parse categories
    const categories: string[] = [];
    if (entry.category) {
      if (Array.isArray(entry.category)) {
        categories.push(...entry.category.map((c: any) => c.term || c));
      } else {
        categories.push(entry.category.term || entry.category);
      }
    }

    // Parse links
    let pdfUrl = '';
    const abstractUrl = entry.id || '';
    
    if (entry.link && Array.isArray(entry.link)) {
      const pdfLink = entry.link.find((l: any) => l.title === 'pdf');
      if (pdfLink) {
        pdfUrl = pdfLink.href;
      }
    }

    const arxivId = this.extractArxivId(entry.id);
    const title = this.cleanText(entry.title);
    const summary = this.cleanText(entry.summary);

    return {
      id: this.generateId(entry.id),
      title,
      summary,
      authors,
      published: new Date(entry.published),
      updated: new Date(entry.updated),
      categories,
      primaryCategory: entry.primary_category?.term || categories[0] || '',
      pdfUrl,
      abstractUrl,
      doi: entry.doi || undefined,
      journalRef: entry.journal_ref || undefined,
      comments: entry.comment || undefined,
      tags: categories,
      checksum: this.calculateChecksum(title + summary),
      source_type: 'paper'
    };
  }

  /**
   * Extract ArXiv ID from URL
   */
  private extractArxivId(url: string): string {
    const match = url.match(/abs\/(\d+\.\d+)/);
    return match ? match[1] : '';
  }

  /**
   * Get human-readable category name
   */
  private getCategoryName(query: string): string {
    return this.categoryMap[query] || query;
  }

  /**
   * Test ArXiv API connection
   */
  public async testConnection(): Promise<ArxivCrawlerResult> {
    console.log('[ArxivCrawler] Testing API connection...');
    const result = await this.fetchArxivPapers('cat:cs.AI', 0, 5);
    
    if (result.success) {
      console.log('✅ ArXiv API connection successful');
      console.log(`   - Query: ${result.query}`);
      console.log(`   - Total results: ${result.totalResults}`);
      console.log(`   - Fetched papers: ${result.papers.length}`);
      
      if (result.papers.length > 0) {
        const paper = result.papers[0];
        console.log(`   - Sample paper: ${paper.title}`);
        console.log(`   - Authors: ${paper.authors.join(', ')}`);
        console.log(`   - Published: ${paper.published.toDateString()}`);
      }
    } else {
      console.log('❌ ArXiv API connection failed');
      console.log(`   - Error: ${result.error}`);
    }
    
    return result;
  }

  /**
   * Test AI papers fetching
   */
  public async testAIPapers(): Promise<Record<string, ArxivCrawlerResult>> {
    console.log('[ArxivCrawler] Testing AI papers fetching...\n');
    
    const results = await this.fetchLatestAIPapers(10);
    
    console.log('\n=== AI Papers Fetching Results ===');
    let totalPapers = 0;
    let successCount = 0;
    
    for (const [category, result] of Object.entries(results)) {
      if (result.success) {
        successCount++;
        totalPapers += result.papers.length;
        console.log(`✅ ${category}: ${result.papers.length} papers`);
        
        if (result.papers.length > 0) {
          const paper = result.papers[0];
          console.log(`   Sample: ${paper.title.substring(0, 80)}...`);
        }
      } else {
        console.log(`❌ ${category}: ${result.error}`);
      }
    }
    
    console.log(`\nTotal: ${successCount}/${Object.keys(results).length} categories successful, ${totalPapers} papers fetched`);
    
    return results;
  }

  /**
   * Test keyword search
   */
  public async testKeywordSearch(keyword: string = 'large language model'): Promise<ArxivCrawlerResult> {
    console.log(`\n[ArxivCrawler] Testing keyword search: "${keyword}"`);
    console.log('-'.repeat(40));
    
    const result = await this.searchPapers(keyword, 5);
    
    if (result.success) {
      console.log(`✅ Search successful: found ${result.papers.length} related papers`);
      
      result.papers.forEach((paper, index) => {
        console.log(`\n${index + 1}. ${paper.title}`);
        console.log(`   Authors: ${paper.authors.join(', ')}`);
        console.log(`   Published: ${paper.published.toDateString()}`);
        console.log(`   Categories: ${paper.categories.join(', ')}`);
        console.log(`   Abstract: ${paper.summary.substring(0, 150)}...`);
      });
    } else {
      console.log(`❌ Search failed: ${result.error}`);
    }
    
    return result;
  }
}
