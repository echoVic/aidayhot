import type { SearchQuery, SearchFilters, SearchSort } from './types';

/**
 * Search utility functions
 */

/**
 * Create a standardized search query object
 */
export function createSearchQuery(
  query: string,
  options: {
    filters?: SearchFilters;
    sort?: SearchSort;
    page?: number;
    pageSize?: number;
    highlight?: boolean;
    suggestions?: boolean;
  } = {}
): SearchQuery {
  return {
    query: query.trim(),
    filters: options.filters || {},
    sort: options.sort || { field: 'relevance', direction: 'desc' },
    pagination: {
      page: options.page || 1,
      pageSize: options.pageSize || 20,
    },
    highlight: options.highlight !== false,
    suggestions: options.suggestions !== false,
  };
}

/**
 * Parse search query string into structured query
 */
export function parseSearchQuery(queryString: string): {
  terms: string[];
  filters: Record<string, string[]>;
  operators: string[];
} {
  const terms: string[] = [];
  const filters: Record<string, string[]> = {};
  const operators: string[] = [];

  // Extract quoted phrases
  const quotedPhrases = queryString.match(/"([^"]+)"/g) || [];
  quotedPhrases.forEach(phrase => {
    terms.push(phrase.replace(/"/g, ''));
    queryString = queryString.replace(phrase, '');
  });

  // Extract filters (key:value format)
  const filterMatches = queryString.match(/(\w+):(\w+)/g) || [];
  filterMatches.forEach(match => {
    const [key, value] = match.split(':');
    if (!filters[key]) filters[key] = [];
    filters[key].push(value);
    queryString = queryString.replace(match, '');
  });

  // Extract operators
  const operatorMatches = queryString.match(/\b(AND|OR|NOT)\b/gi) || [];
  operators.push(...operatorMatches.map(op => op.toUpperCase()));
  queryString = queryString.replace(/\b(AND|OR|NOT)\b/gi, '');

  // Extract remaining terms
  const remainingTerms = queryString
    .split(/\s+/)
    .filter(term => term.trim().length > 0);
  terms.push(...remainingTerms);

  return { terms, filters, operators };
}

/**
 * Validate search query
 */
export function validateSearchQuery(query: SearchQuery): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Check query length
  if (!query.query || query.query.trim().length === 0) {
    errors.push('Query cannot be empty');
  } else if (query.query.length > 1000) {
    errors.push('Query is too long (max 1000 characters)');
  }

  // Check pagination
  if (query.pagination) {
    if (query.pagination.page < 1) {
      errors.push('Page number must be greater than 0');
    }
    if (query.pagination.pageSize < 1 || query.pagination.pageSize > 100) {
      errors.push('Page size must be between 1 and 100');
    }
  }

  // Check sort field
  if (query.sort) {
    const validSortFields = ['relevance', 'date', 'title', 'author', 'popularity'];
    if (!validSortFields.includes(query.sort.field) && !query.sort.customField) {
      errors.push(`Invalid sort field: ${query.sort.field}`);
    }
  }

  // Check date range filters
  if (query.filters?.dateRange) {
    const { start, end } = query.filters.dateRange;
    if (start && end && start > end) {
      errors.push('Start date must be before end date');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Generate cache key for search query
 */
export function generateSearchCacheKey(query: SearchQuery): string {
  const keyParts = [
    `q:${query.query}`,
    query.filters ? `f:${JSON.stringify(query.filters)}` : '',
    query.sort ? `s:${query.sort.field}:${query.sort.direction}` : '',
    query.pagination ? `p:${query.pagination.page}:${query.pagination.pageSize}` : '',
  ].filter(Boolean);

  return keyParts.join('|');
}

/**
 * Normalize search terms for better matching
 */
export function normalizeSearchTerms(terms: string[]): string[] {
  return terms
    .map(term => term.toLowerCase().trim())
    .filter(term => term.length > 1)
    .map(term => {
      // Remove special characters
      return term.replace(/[^\w\s-]/g, '');
    })
    .filter(term => term.length > 0);
}

/**
 * Calculate text similarity using Levenshtein distance
 */
export function calculateSimilarity(str1: string, str2: string): number {
  const matrix: number[][] = [];
  const len1 = str1.length;
  const len2 = str2.length;

  // Initialize matrix
  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  // Fill matrix
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,     // deletion
        matrix[i][j - 1] + 1,     // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }

  const maxLen = Math.max(len1, len2);
  return maxLen === 0 ? 1 : (maxLen - matrix[len1][len2]) / maxLen;
}

/**
 * Generate search suggestions based on input
 */
export function generateSearchSuggestions(
  input: string,
  documents: any[],
  maxSuggestions: number = 5
): string[] {
  const suggestions = new Set<string>();
  const inputLower = input.toLowerCase();

  // Extract words from documents
  const words = new Set<string>();
  documents.forEach(doc => {
    const text = `${doc.title || ''} ${doc.content || ''} ${doc.summary || ''}`;
    const docWords = text.toLowerCase().match(/\b\w{3,}\b/g) || [];
    docWords.forEach(word => words.add(word));
  });

  // Find matching words
  Array.from(words).forEach(word => {
    if (word.startsWith(inputLower) && word !== inputLower) {
      suggestions.add(word);
    }
  });

  // Find similar words if not enough exact matches
  if (suggestions.size < maxSuggestions) {
    Array.from(words).forEach(word => {
      if (!suggestions.has(word)) {
        const similarity = calculateSimilarity(inputLower, word);
        if (similarity > 0.7) {
          suggestions.add(word);
        }
      }
    });
  }

  return Array.from(suggestions).slice(0, maxSuggestions);
}

/**
 * Extract and rank keywords from text
 */
export function extractKeywords(
  text: string,
  maxKeywords: number = 10,
  minLength: number = 3
): Array<{ word: string; frequency: number; score: number }> {
  // Common stop words
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have',
    'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should',
    'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those',
  ]);

  // Extract words
  const words = text.toLowerCase().match(/\b\w+\b/g) || [];
  const wordFreq = new Map<string, number>();

  // Count word frequencies
  words.forEach(word => {
    if (word.length >= minLength && !stopWords.has(word)) {
      wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
    }
  });

  // Calculate scores (frequency + length bonus)
  const keywords = Array.from(wordFreq.entries()).map(([word, frequency]) => ({
    word,
    frequency,
    score: frequency + (word.length > 5 ? 1 : 0),
  }));

  // Sort by score and return top keywords
  return keywords
    .sort((a, b) => b.score - a.score)
    .slice(0, maxKeywords);
}

/**
 * Create search filters from URL parameters
 */
export function createFiltersFromParams(params: URLSearchParams): SearchFilters {
  const filters: SearchFilters = {};

  // Category filter
  const categories = params.getAll('category');
  if (categories.length > 0) {
    filters.category = categories;
  }

  // Author filter
  const authors = params.getAll('author');
  if (authors.length > 0) {
    filters.author = authors;
  }

  // Tags filter
  const tags = params.getAll('tag');
  if (tags.length > 0) {
    filters.tags = tags;
  }

  // Source filter
  const sources = params.getAll('source');
  if (sources.length > 0) {
    filters.source = sources;
  }

  // Date range filter
  const startDate = params.get('start_date');
  const endDate = params.get('end_date');
  if (startDate || endDate) {
    filters.dateRange = {
      start: startDate ? new Date(startDate) : undefined,
      end: endDate ? new Date(endDate) : undefined,
    };
  }

  return filters;
}

/**
 * Convert search filters to URL parameters
 */
export function filtersToParams(filters: SearchFilters): URLSearchParams {
  const params = new URLSearchParams();

  // Category filter
  if (filters.category) {
    filters.category.forEach(category => params.append('category', category));
  }

  // Author filter
  if (filters.author) {
    filters.author.forEach(author => params.append('author', author));
  }

  // Tags filter
  if (filters.tags) {
    filters.tags.forEach(tag => params.append('tag', tag));
  }

  // Source filter
  if (filters.source) {
    filters.source.forEach(source => params.append('source', source));
  }

  // Date range filter
  if (filters.dateRange) {
    if (filters.dateRange.start) {
      params.set('start_date', filters.dateRange.start.toISOString().split('T')[0]);
    }
    if (filters.dateRange.end) {
      params.set('end_date', filters.dateRange.end.toISOString().split('T')[0]);
    }
  }

  return params;
}

/**
 * Debounce function for search input
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Throttle function for search operations
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Format search result count
 */
export function formatResultCount(count: number): string {
  if (count === 0) return 'No results';
  if (count === 1) return '1 result';
  if (count < 1000) return `${count} results`;
  if (count < 1000000) return `${(count / 1000).toFixed(1)}K results`;
  return `${(count / 1000000).toFixed(1)}M results`;
}

/**
 * Format search time
 */
export function formatSearchTime(milliseconds: number): string {
  if (milliseconds < 1000) return `${Math.round(milliseconds)}ms`;
  return `${(milliseconds / 1000).toFixed(1)}s`;
}

/**
 * Escape special regex characters in search query
 */
export function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Create highlight regex from search terms
 */
export function createHighlightRegex(terms: string[]): RegExp {
  const escapedTerms = terms.map(escapeRegex);
  return new RegExp(`(${escapedTerms.join('|')})`, 'gi');
}
