/**
 * Search system type definitions
 * Provides interfaces for advanced search functionality
 */

export interface SearchQuery {
  query: string;
  filters?: SearchFilters;
  sort?: SearchSort;
  pagination?: SearchPagination;
  facets?: string[];
  highlight?: boolean;
  suggestions?: boolean;
}

export interface SearchFilters {
  category?: string[];
  author?: string[];
  dateRange?: {
    start?: Date;
    end?: Date;
  };
  tags?: string[];
  source?: string[];
  language?: string[];
  contentType?: string[];
  customFilters?: Record<string, any>;
}

export interface SearchSort {
  field: 'relevance' | 'date' | 'title' | 'author' | 'popularity' | 'custom';
  direction: 'asc' | 'desc';
  customField?: string;
}

export interface SearchPagination {
  page: number;
  pageSize: number;
  offset?: number;
}

export interface SearchResult<T = any> {
  items: SearchResultItem<T>[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
  facets?: SearchFacets;
  suggestions?: string[];
  queryTime: number;
  searchId?: string;
}

export interface SearchResultItem<T = any> {
  id: string;
  data: T;
  score: number;
  highlights?: SearchHighlight[];
  snippet?: string;
  metadata?: Record<string, any>;
}

export interface SearchHighlight {
  field: string;
  fragments: string[];
  matchedTerms: string[];
}

export interface SearchFacets {
  [key: string]: SearchFacetValue[];
}

export interface SearchFacetValue {
  value: string;
  count: number;
  selected?: boolean;
}

export interface SearchSuggestion {
  text: string;
  type: 'completion' | 'correction' | 'phrase';
  score: number;
  metadata?: Record<string, any>;
}

export interface SearchIndex {
  name: string;
  fields: SearchIndexField[];
  settings: SearchIndexSettings;
}

export interface SearchIndexField {
  name: string;
  type: 'text' | 'keyword' | 'date' | 'number' | 'boolean';
  searchable?: boolean;
  facetable?: boolean;
  sortable?: boolean;
  highlightable?: boolean;
  weight?: number;
  analyzer?: string;
}

export interface SearchIndexSettings {
  language?: string;
  stemming?: boolean;
  stopWords?: string[];
  synonyms?: Record<string, string[]>;
  fuzzyMatching?: boolean;
  minGram?: number;
  maxGram?: number;
}

export interface SearchProvider {
  name: string;
  search<T = any>(query: SearchQuery): Promise<SearchResult<T>>;
  suggest(query: string, options?: SuggestionOptions): Promise<SearchSuggestion[]>;
  index(documents: any[]): Promise<void>;
  deleteIndex(): Promise<void>;
  updateIndex(documents: any[]): Promise<void>;
  getStats(): Promise<SearchStats>;
}

export interface SuggestionOptions {
  maxSuggestions?: number;
  types?: ('completion' | 'correction' | 'phrase')[];
  fuzzy?: boolean;
  highlight?: boolean;
}

export interface SearchStats {
  totalDocuments: number;
  indexSize: number;
  lastUpdated: Date;
  searchCount: number;
  averageQueryTime: number;
  popularQueries: Array<{ query: string; count: number }>;
}

export interface SearchConfiguration {
  provider: 'local' | 'elasticsearch' | 'algolia' | 'meilisearch';
  index: SearchIndex;
  caching?: {
    enabled: boolean;
    ttl: number;
    maxSize: number;
  };
  analytics?: {
    enabled: boolean;
    trackQueries: boolean;
    trackClicks: boolean;
  };
  suggestions?: {
    enabled: boolean;
    minQueryLength: number;
    maxSuggestions: number;
    fuzzyMatching: boolean;
  };
}

// Article-specific search types
export interface ArticleSearchQuery extends SearchQuery {
  filters?: ArticleSearchFilters;
}

export interface ArticleSearchFilters extends SearchFilters {
  readTime?: {
    min?: number;
    max?: number;
  };
  popularity?: {
    min?: number;
    max?: number;
  };
  isHot?: boolean;
  isNew?: boolean;
}

export interface ArticleSearchResult extends SearchResult<any> {
  relatedQueries?: string[];
  trending?: string[];
}

// Search analytics types
export interface SearchAnalytics {
  query: string;
  timestamp: Date;
  userId?: string;
  sessionId?: string;
  resultCount: number;
  clickedResults?: string[];
  queryTime: number;
  filters?: SearchFilters;
  page: number;
  exitPage?: number;
}

export interface SearchMetrics {
  totalSearches: number;
  uniqueQueries: number;
  averageQueryTime: number;
  clickThroughRate: number;
  zeroResultQueries: number;
  popularQueries: Array<{ query: string; count: number; ctr: number }>;
  popularFilters: Record<string, number>;
  searchTrends: Array<{ date: string; count: number }>;
}

// Search UI types
export interface SearchUIState {
  query: string;
  filters: SearchFilters;
  sort: SearchSort;
  isLoading: boolean;
  results: SearchResult | null;
  suggestions: SearchSuggestion[];
  recentQueries: string[];
  selectedFilters: Record<string, any>;
  showFilters: boolean;
  showSuggestions: boolean;
}

export interface SearchUIActions {
  setQuery: (query: string) => void;
  setFilters: (filters: Partial<SearchFilters>) => void;
  setSort: (sort: SearchSort) => void;
  search: () => Promise<void>;
  clearFilters: () => void;
  clearQuery: () => void;
  selectSuggestion: (suggestion: SearchSuggestion) => void;
  toggleFilter: (filterType: string, value: any) => void;
  loadMore: () => Promise<void>;
}

// Search component props
export interface SearchBarProps {
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  onSearch?: (query: string) => void;
  onSuggestionSelect?: (suggestion: SearchSuggestion) => void;
  suggestions?: SearchSuggestion[];
  showSuggestions?: boolean;
  loading?: boolean;
  className?: string;
  autoComplete?: boolean;
  debounceMs?: number;
}

export interface SearchFiltersProps {
  filters: SearchFilters;
  facets?: SearchFacets;
  onChange: (filters: Partial<SearchFilters>) => void;
  onClear: () => void;
  className?: string;
  collapsible?: boolean;
  showCounts?: boolean;
}

export interface SearchResultsProps<T = any> {
  results: SearchResult<T>;
  onItemClick?: (item: SearchResultItem<T>, index: number) => void;
  onLoadMore?: () => void;
  loading?: boolean;
  className?: string;
  renderItem?: (item: SearchResultItem<T>, index: number) => React.ReactNode;
  highlightQuery?: boolean;
}

// Search hooks types
export interface UseSearchOptions {
  debounceMs?: number;
  minQueryLength?: number;
  autoSearch?: boolean;
  cacheResults?: boolean;
  trackAnalytics?: boolean;
}

export interface UseSearchReturn {
  // State
  query: string;
  filters: SearchFilters;
  sort: SearchSort;
  results: SearchResult | null;
  suggestions: SearchSuggestion[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setQuery: (query: string) => void;
  setFilters: (filters: Partial<SearchFilters>) => void;
  setSort: (sort: SearchSort) => void;
  search: () => Promise<void>;
  clear: () => void;
  loadMore: () => Promise<void>;
  
  // Utilities
  hasResults: boolean;
  hasMore: boolean;
  totalResults: number;
}
