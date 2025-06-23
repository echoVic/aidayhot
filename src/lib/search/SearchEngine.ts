import type {
  SearchAnalytics,
  SearchConfiguration,
  SearchProvider,
  SearchQuery,
  SearchResult,
  SearchResultItem,
  SearchStats,
  SearchSuggestion,
  SuggestionOptions,
} from './types';

/**
 * Main search engine class that orchestrates search operations
 */
export class SearchEngine {
  private provider: SearchProvider;
  private config: SearchConfiguration;
  private analytics: SearchAnalytics[] = [];
  private queryCache = new Map<string, SearchResult>();

  constructor(provider: SearchProvider, config: SearchConfiguration) {
    this.provider = provider;
    this.config = config;
  }

  /**
   * Perform a search with caching and analytics
   */
  async search<T = any>(query: SearchQuery): Promise<SearchResult<T>> {
    const startTime = Date.now();
    const cacheKey = this.generateCacheKey(query);

    try {
      // Check local cache first
      if (this.config.caching?.enabled && this.queryCache.has(cacheKey)) {
        const cached = this.queryCache.get(cacheKey);
        if (cached) {
          const queryTime = Date.now() - startTime;
          this.trackSearch(query, cached, queryTime);
          return cached as SearchResult<T>;
        }
      }

      // Perform search
      const result = await this.provider.search<T>(query);
      const queryTime = Date.now() - startTime;

      // Cache results if enabled
      if (this.config.caching?.enabled && result.items.length > 0) {
        this.queryCache.set(cacheKey, result);
        
        // Clean up cache if it gets too large
        if (this.queryCache.size > (this.config.caching.maxSize || 1000)) {
          const firstKey = this.queryCache.keys().next().value;
          if (firstKey) {
            this.queryCache.delete(firstKey);
          }
        }
      }

      // Track analytics
      this.trackSearch(query, result, queryTime);

      return result;
    } catch (error) {
      const queryTime = Date.now() - startTime;
      const errorResult: SearchResult<T> = {
        items: [],
        total: 0,
        page: query.pagination?.page || 1,
        pageSize: query.pagination?.pageSize || 20,
        hasMore: false,
        queryTime,
        searchId: Math.random().toString(36).substr(2, 9),
      };

      this.trackSearch(query, errorResult, queryTime);
      throw error;
    }
  }

  /**
   * Get search suggestions
   */
  async suggest(query: string, options?: SuggestionOptions): Promise<SearchSuggestion[]> {
    if (!this.config.suggestions?.enabled || query.length < (this.config.suggestions.minQueryLength || 2)) {
      return [];
    }

    try {
      return await this.provider.suggest(query, options);
    } catch (error) {
      console.warn('Failed to get search suggestions:', error);
      return [];
    }
  }

  /**
   * Smart search with auto-correction and query expansion
   */
  async smartSearch<T = any>(
    query: string,
    options: {
      filters?: any;
      sort?: any;
      page?: number;
      pageSize?: number;
      autoCorrect?: boolean;
      expandQuery?: boolean;
    } = {}
  ): Promise<SearchResult<T> & { correctedQuery?: string; expandedTerms?: string[] }> {
    const searchQuery: SearchQuery = {
      query,
      filters: options.filters,
      sort: options.sort,
      pagination: {
        page: options.page || 1,
        pageSize: options.pageSize || 20,
      },
      highlight: true,
      suggestions: true,
    };

    let result = await this.search<T>(searchQuery);
    let correctedQuery: string | undefined;
    let expandedTerms: string[] | undefined;

    // If no results and auto-correction is enabled
    if (result.total === 0 && options.autoCorrect) {
      // Simple typo correction (in a real implementation, use a proper spell checker)
      const suggestions = await this.suggest(query, { types: ['correction'], maxSuggestions: 1 });
      if (suggestions.length > 0) {
        correctedQuery = suggestions[0].text;
        searchQuery.query = correctedQuery;
        result = await this.search<T>(searchQuery);
      }
    }

    // If still no results and query expansion is enabled
    if (result.total === 0 && options.expandQuery) {
      expandedTerms = await this.expandQueryTerms(query);
      if (expandedTerms.length > 0) {
        searchQuery.query = expandedTerms.join(' OR ');
        result = await this.search<T>(searchQuery);
      }
    }

    return {
      ...result,
      correctedQuery,
      expandedTerms,
    };
  }

  /**
   * Faceted search with dynamic filter generation
   */
  async facetedSearch<T = any>(
    query: string,
    selectedFacets: Record<string, string[]> = {},
    options: {
      page?: number;
      pageSize?: number;
      sort?: any;
    } = {}
  ): Promise<SearchResult<T>> {
    const searchQuery: SearchQuery = {
      query,
      filters: this.convertFacetsToFilters(selectedFacets),
      sort: options.sort,
      pagination: {
        page: options.page || 1,
        pageSize: options.pageSize || 20,
      },
      facets: Object.keys(selectedFacets),
      highlight: true,
    };

    return await this.search<T>(searchQuery);
  }

  /**
   * Get popular search queries
   */
  getPopularQueries(limit: number = 10): Array<{ query: string; count: number }> {
    const queryCount = new Map<string, number>();

    this.analytics.forEach(entry => {
      const count = queryCount.get(entry.query) || 0;
      queryCount.set(entry.query, count + 1);
    });

    return Array.from(queryCount.entries())
      .map(([query, count]) => ({ query, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  /**
   * Get search analytics
   */
  getAnalytics(): {
    totalSearches: number;
    uniqueQueries: number;
    averageQueryTime: number;
    zeroResultQueries: number;
    popularQueries: Array<{ query: string; count: number }>;
  } {
    const totalSearches = this.analytics.length;
    const uniqueQueries = new Set(this.analytics.map(a => a.query)).size;
    const averageQueryTime = totalSearches > 0 
      ? this.analytics.reduce((sum, a) => sum + a.queryTime, 0) / totalSearches 
      : 0;
    const zeroResultQueries = this.analytics.filter(a => a.resultCount === 0).length;

    return {
      totalSearches,
      uniqueQueries,
      averageQueryTime,
      zeroResultQueries,
      popularQueries: this.getPopularQueries(10),
    };
  }

  /**
   * Clear search cache
   */
  async clearCache(): Promise<void> {
    this.queryCache.clear();
  }

  /**
   * Get search statistics from provider
   */
  async getStats(): Promise<SearchStats> {
    return await this.provider.getStats();
  }

  private generateCacheKey(query: SearchQuery): string {
    return `search:${JSON.stringify(query)}`;
  }

  private trackSearch(query: SearchQuery, result: SearchResult, queryTime: number): void {
    if (!this.config.analytics?.enabled) return;

    this.analytics.push({
      query: query.query,
      timestamp: new Date(),
      resultCount: result.total,
      queryTime,
      filters: query.filters,
      page: query.pagination?.page || 1,
    });

    // Keep only recent analytics (last 1000 entries)
    if (this.analytics.length > 1000) {
      this.analytics = this.analytics.slice(-1000);
    }
  }

  private async expandQueryTerms(query: string): Promise<string[]> {
    // Simple query expansion - in a real implementation, use synonyms, related terms, etc.
    return query.split(' ').filter(term => term.length > 2);
  }

  private convertFacetsToFilters(facets: Record<string, string[]>): any {
    const filters: any = {};
    
    Object.entries(facets).forEach(([key, values]) => {
      if (values.length > 0) {
        filters[key] = values;
      }
    });

    return filters;
  }
}

/**
 * Local search provider implementation
 */
export class LocalSearchProvider implements SearchProvider {
  name = 'local';
  private documents: any[] = [];
  private searchIndex: Map<string, Set<number>> = new Map();
  private stats: SearchStats = {
    totalDocuments: 0,
    indexSize: 0,
    lastUpdated: new Date(),
    searchCount: 0,
    averageQueryTime: 0,
    popularQueries: [],
  };

  async search<T = any>(query: SearchQuery): Promise<SearchResult<T>> {
    const startTime = Date.now();
    const searchTerms = query.query.toLowerCase().split(' ').filter(term => term.length > 0);
    
    if (searchTerms.length === 0) {
      return {
        items: [],
        total: 0,
        page: query.pagination?.page || 1,
        pageSize: query.pagination?.pageSize || 20,
        hasMore: false,
        queryTime: Date.now() - startTime,
      };
    }

    // Find matching documents
    const matchingDocs = new Map<number, number>(); // docIndex -> score

    searchTerms.forEach(term => {
      const docIndices = this.searchIndex.get(term) || new Set();
      docIndices.forEach((docIndex: number) => {
        const currentScore = matchingDocs.get(docIndex) || 0;
        const newScore = this.calculateScore(this.documents[docIndex], searchTerms);
        matchingDocs.set(docIndex, Math.max(currentScore, newScore));
      });
    });

    // Sort by score
    const sortedMatches = Array.from(matchingDocs.entries())
      .sort(([, a], [, b]) => b - a);

    // Apply pagination
    const page = query.pagination?.page || 1;
    const pageSize = query.pagination?.pageSize || 20;
    const offset = (page - 1) * pageSize;
    const paginatedMatches = sortedMatches.slice(offset, offset + pageSize);

    // Create result items
    const items: SearchResultItem<T>[] = paginatedMatches.map(([docIndex, score]) => ({
      id: this.documents[docIndex].id || docIndex.toString(),
      data: this.documents[docIndex],
      score,
      highlights: query.highlight ? this.generateHighlights(this.documents[docIndex], searchTerms) : undefined,
    }));

    const queryTime = Date.now() - startTime;
    this.stats.searchCount++;
    this.stats.averageQueryTime = (this.stats.averageQueryTime * (this.stats.searchCount - 1) + queryTime) / this.stats.searchCount;

    return {
      items,
      total: sortedMatches.length,
      page,
      pageSize,
      hasMore: offset + pageSize < sortedMatches.length,
      queryTime,
    };
  }

  async suggest(query: string, options?: SuggestionOptions): Promise<SearchSuggestion[]> {
    const maxSuggestions = options?.maxSuggestions || 5;
    const queryLower = query.toLowerCase();
    
    const suggestions: SearchSuggestion[] = [];
    
    // Find terms that start with the query
    for (const [term] of this.searchIndex) {
      if (term.startsWith(queryLower) && term !== queryLower) {
        suggestions.push({
          text: term,
          type: 'completion',
          score: 1 - (term.length - query.length) / term.length,
        });
      }
      
      if (suggestions.length >= maxSuggestions) break;
    }
    
    return suggestions.sort((a, b) => b.score - a.score);
  }

  async index(documents: any[]): Promise<void> {
    this.documents = documents;
    this.buildIndex();
    this.stats.totalDocuments = documents.length;
    this.stats.lastUpdated = new Date();
  }

  async deleteIndex(): Promise<void> {
    this.documents = [];
    this.searchIndex.clear();
    this.stats.totalDocuments = 0;
  }

  async updateIndex(documents: any[]): Promise<void> {
    await this.index(documents);
  }

  async getStats(): Promise<SearchStats> {
    return { ...this.stats };
  }

  private buildIndex(): void {
    this.searchIndex.clear();
    
    this.documents.forEach((doc, index) => {
      const text = [doc.title, doc.content, doc.description, doc.tags?.join(' ')]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      
      const words = text.split(/\s+/).filter(word => word.length > 2);
      
      words.forEach(word => {
        if (!this.searchIndex.has(word)) {
          this.searchIndex.set(word, new Set());
        }
        this.searchIndex.get(word)!.add(index);
      });
    });
    
    this.stats.indexSize = this.searchIndex.size;
  }

  private calculateScore(doc: any, searchTerms: string[]): number {
    const text = [doc.title, doc.content, doc.description].filter(Boolean).join(' ').toLowerCase();
    let score = 0;
    
    searchTerms.forEach(term => {
      const termCount = (text.match(new RegExp(term, 'g')) || []).length;
      score += termCount;
      
      // Boost score for title matches
      if (doc.title?.toLowerCase().includes(term)) {
        score += 2;
      }
    });
    
    return score;
  }

  private generateHighlights(doc: any, searchTerms: string[]): any[] {
    const highlights: any[] = [];
    
    searchTerms.forEach(term => {
      if (doc.title?.toLowerCase().includes(term)) {
        highlights.push({
          field: 'title',
          fragments: [doc.title],
          matchedTerms: [term],
        });
      }
      
      if (doc.content?.toLowerCase().includes(term)) {
        highlights.push({
          field: 'content',
          fragments: [doc.content.substring(0, 200) + '...'],
          matchedTerms: [term],
        });
      }
    });
    
    return highlights;
  }
}

// Create and export default search engine instance
const localProvider = new LocalSearchProvider();
export const defaultSearchEngine = new SearchEngine(localProvider, {
  provider: 'local',
  index: {
    name: 'articles',
    fields: [
      { name: 'title', type: 'text', searchable: true, highlightable: true, weight: 2 },
      { name: 'content', type: 'text', searchable: true, highlightable: true },
      { name: 'author', type: 'keyword', facetable: true },
      { name: 'category', type: 'keyword', facetable: true },
      { name: 'tags', type: 'keyword', facetable: true },
      { name: 'publishTime', type: 'date', sortable: true },
    ],
    settings: {
      fuzzyMatching: true,
      stemming: true,
    },
  },
  caching: {
    enabled: true,
    maxSize: 1000,
    ttl: 300, // 5 minutes
  },
  suggestions: {
    enabled: true,
    minQueryLength: 2,
    maxSuggestions: 5,
    fuzzyMatching: true,
  },
  analytics: {
    enabled: true,
    trackQueries: true,
    trackClicks: true,
  },
});

