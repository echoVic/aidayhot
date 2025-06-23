/**
 * Search system exports
 * Provides comprehensive search functionality for the application
 */

// Export types
export * from './types';

// Export search engine and providers
export { SearchEngine, LocalSearchProvider, defaultSearchEngine } from './SearchEngine';

// Export utility functions
export { createSearchQuery, parseSearchQuery, validateSearchQuery } from './utils';

// Re-export for convenience
export type {
  SearchQuery,
  SearchResult,
  SearchResultItem,
  SearchSuggestion,
  SearchFilters,
  SearchSort,
  SearchProvider,
  SearchConfiguration,
} from './types';

/**
 * Quick setup functions for common search configurations
 */
export function createLocalSearch(documents: any[] = []) {
  const { LocalSearchProvider, SearchEngine } = require('./SearchEngine');
  
  const provider = new LocalSearchProvider();
  const engine = new SearchEngine(provider, {
    provider: 'local',
    index: {
      name: 'default',
      fields: [
        { name: 'title', type: 'text', searchable: true, highlightable: true, weight: 2 },
        { name: 'content', type: 'text', searchable: true, highlightable: true, weight: 1 },
        { name: 'summary', type: 'text', searchable: true, highlightable: true, weight: 1.5 },
      ],
      settings: {
        language: 'en',
        stemming: true,
        fuzzyMatching: true,
      },
    },
    caching: {
      enabled: true,
      ttl: 300,
      maxSize: 1000,
    },
    suggestions: {
      enabled: true,
      minQueryLength: 2,
      maxSuggestions: 5,
      fuzzyMatching: true,
    },
  });

  if (documents.length > 0) {
    provider.index(documents);
  }

  return engine;
}

/**
 * Search configuration presets
 */
export const SearchPresets = {
  // Fast, memory-only search for small datasets
  fast: {
    provider: 'local' as const,
    index: {
      name: 'fast',
      fields: [
        { name: 'title', type: 'text' as const, searchable: true, weight: 2 },
        { name: 'content', type: 'text' as const, searchable: true, weight: 1 },
      ],
      settings: {
        language: 'en',
        fuzzyMatching: false,
      },
    },
    caching: {
      enabled: true,
      ttl: 60,
      maxSize: 100,
    },
    suggestions: {
      enabled: false,
      minQueryLength: 3,
      maxSuggestions: 3,
    },
  },

  // Balanced search with moderate features
  balanced: {
    provider: 'local' as const,
    index: {
      name: 'balanced',
      fields: [
        { name: 'title', type: 'text' as const, searchable: true, highlightable: true, weight: 2 },
        { name: 'content', type: 'text' as const, searchable: true, highlightable: true, weight: 1 },
        { name: 'summary', type: 'text' as const, searchable: true, highlightable: true, weight: 1.5 },
        { name: 'category', type: 'keyword' as const, facetable: true },
        { name: 'tags', type: 'keyword' as const, facetable: true },
      ],
      settings: {
        language: 'en',
        stemming: true,
        fuzzyMatching: true,
      },
    },
    caching: {
      enabled: true,
      ttl: 300,
      maxSize: 1000,
    },
    analytics: {
      enabled: true,
      trackQueries: true,
      trackClicks: false,
    },
    suggestions: {
      enabled: true,
      minQueryLength: 2,
      maxSuggestions: 5,
      fuzzyMatching: true,
    },
  },

  // Full-featured search for large datasets
  advanced: {
    provider: 'local' as const,
    index: {
      name: 'advanced',
      fields: [
        { name: 'title', type: 'text' as const, searchable: true, highlightable: true, weight: 3 },
        { name: 'content', type: 'text' as const, searchable: true, highlightable: true, weight: 1 },
        { name: 'summary', type: 'text' as const, searchable: true, highlightable: true, weight: 2 },
        { name: 'category', type: 'keyword' as const, facetable: true, sortable: true },
        { name: 'author', type: 'keyword' as const, facetable: true, sortable: true },
        { name: 'tags', type: 'keyword' as const, facetable: true },
        { name: 'publishTime', type: 'date' as const, sortable: true },
        { name: 'popularity', type: 'number' as const, sortable: true },
      ],
      settings: {
        language: 'en',
        stemming: true,
        fuzzyMatching: true,
        stopWords: ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'],
        synonyms: {
          'ai': ['artificial intelligence', 'machine learning'],
          'ml': ['machine learning', 'artificial intelligence'],
          'nlp': ['natural language processing', 'text processing'],
        },
      },
    },
    caching: {
      enabled: true,
      ttl: 600,
      maxSize: 5000,
    },
    analytics: {
      enabled: true,
      trackQueries: true,
      trackClicks: true,
    },
    suggestions: {
      enabled: true,
      minQueryLength: 1,
      maxSuggestions: 10,
      fuzzyMatching: true,
    },
  },
} as const;

/**
 * Initialize search system with preset configuration
 */
export function initializeSearch(
  preset: keyof typeof SearchPresets = 'balanced',
  documents: any[] = []
) {
  const config = SearchPresets[preset];
  const engine = createLocalSearch(documents);
  return engine;
}

/**
 * Search utilities and helpers
 */
export class SearchUtils {
  /**
   * Normalize search query
   */
  static normalizeQuery(query: string): string {
    return query
      .trim()
      .toLowerCase()
      .replace(/[^\w\s-]/g, ' ')
      .replace(/\s+/g, ' ');
  }

  /**
   * Extract search terms from query
   */
  static extractTerms(query: string): string[] {
    return this.normalizeQuery(query)
      .split(' ')
      .filter(term => term.length > 1);
  }

  /**
   * Generate search suggestions based on query
   */
  static generateQuerySuggestions(query: string, documents: any[]): string[] {
    const terms = this.extractTerms(query);
    const suggestions = new Set<string>();

    documents.forEach(doc => {
      const text = `${doc.title || ''} ${doc.content || ''} ${doc.summary || ''}`.toLowerCase();
      
      terms.forEach(term => {
        const words = text.split(/\s+/);
        words.forEach(word => {
          if (word.startsWith(term) && word.length > term.length) {
            suggestions.add(word);
          }
        });
      });
    });

    return Array.from(suggestions).slice(0, 10);
  }

  /**
   * Calculate search relevance score
   */
  static calculateRelevance(document: any, query: string): number {
    const terms = this.extractTerms(query);
    let score = 0;

    const title = (document.title || '').toLowerCase();
    const content = (document.content || '').toLowerCase();
    const summary = (document.summary || '').toLowerCase();

    terms.forEach(term => {
      // Title matches get highest weight
      const titleMatches = (title.match(new RegExp(term, 'g')) || []).length;
      score += titleMatches * 3;

      // Summary matches get medium weight
      const summaryMatches = (summary.match(new RegExp(term, 'g')) || []).length;
      score += summaryMatches * 2;

      // Content matches get base weight
      const contentMatches = (content.match(new RegExp(term, 'g')) || []).length;
      score += contentMatches * 1;
    });

    return score;
  }

  /**
   * Highlight search terms in text
   */
  static highlightTerms(text: string, query: string, className: string = 'highlight'): string {
    const terms = this.extractTerms(query);
    let highlightedText = text;

    terms.forEach(term => {
      const regex = new RegExp(`(${term})`, 'gi');
      highlightedText = highlightedText.replace(
        regex,
        `<span class="${className}">$1</span>`
      );
    });

    return highlightedText;
  }

  /**
   * Generate search snippet from content
   */
  static generateSnippet(
    content: string,
    query: string,
    maxLength: number = 200
  ): string {
    const terms = this.extractTerms(query);
    const sentences = content.split(/[.!?]+/);
    
    // Find sentences containing search terms
    const relevantSentences = sentences.filter(sentence => {
      const lowerSentence = sentence.toLowerCase();
      return terms.some(term => lowerSentence.includes(term));
    });

    if (relevantSentences.length === 0) {
      return content.substring(0, maxLength) + (content.length > maxLength ? '...' : '');
    }

    let snippet = relevantSentences[0];
    if (snippet.length > maxLength) {
      snippet = snippet.substring(0, maxLength) + '...';
    }

    return snippet.trim();
  }
}

// Global search utilities instance
export const searchUtils = SearchUtils;

/**
 * Search performance monitor
 */
export class SearchPerformanceMonitor {
  private metrics = new Map<string, any>();

  /**
   * Start monitoring a search operation
   */
  startSearch(query: string): string {
    const searchId = `search_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.metrics.set(searchId, {
      query,
      startTime: performance.now(),
      endTime: null,
      duration: null,
      resultCount: 0,
      cacheHit: false,
    });
    return searchId;
  }

  /**
   * End monitoring a search operation
   */
  endSearch(searchId: string, resultCount: number, cacheHit: boolean = false): void {
    const metric = this.metrics.get(searchId);
    if (metric) {
      const endTime = performance.now();
      metric.endTime = endTime;
      metric.duration = endTime - metric.startTime;
      metric.resultCount = resultCount;
      metric.cacheHit = cacheHit;
    }
  }

  /**
   * Get performance metrics
   */
  getMetrics(): any {
    const metrics = Array.from(this.metrics.values());
    const totalSearches = metrics.length;
    const averageDuration = metrics.reduce((sum, m) => sum + (m.duration || 0), 0) / totalSearches;
    const cacheHitRate = metrics.filter(m => m.cacheHit).length / totalSearches;

    return {
      totalSearches,
      averageDuration,
      cacheHitRate,
      recentSearches: metrics.slice(-10),
    };
  }

  /**
   * Clear metrics
   */
  clearMetrics(): void {
    this.metrics.clear();
  }
}

// Global performance monitor instance
export const searchPerformanceMonitor = new SearchPerformanceMonitor();
