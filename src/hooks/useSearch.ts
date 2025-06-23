'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { defaultSearchEngine } from '../lib/search/SearchEngine';
import type {
    SearchFilters,
    SearchQuery,
    SearchResult,
    SearchSort,
    SearchSuggestion,
    UseSearchOptions,
    UseSearchReturn,
} from '../lib/search/types';

/**
 * Advanced search hook with debouncing, caching, and analytics
 */
export function useSearch(options: UseSearchOptions = {}): UseSearchReturn {
  const {
    debounceMs = 300,
    minQueryLength = 2,
    autoSearch = false,
    cacheResults = true,
    trackAnalytics = true,
  } = options;

  // State
  const [query, setQuery] = useState<string>('');
  const [filters, setFilters] = useState<SearchFilters>({});
  const [sort, setSort] = useState<SearchSort>({ field: 'relevance', direction: 'desc' });
  const [results, setResults] = useState<SearchResult | null>(null);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Refs
  const debounceRef = useRef<NodeJS.Timeout>();
  const abortControllerRef = useRef<AbortController>();
  const searchHistoryRef = useRef<string[]>([]);

  // Debounced search function
  const debouncedSearch = useCallback(
    (searchQuery: string, searchFilters: SearchFilters, searchSort: SearchSort) => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      debounceRef.current = setTimeout(() => {
        if (searchQuery.length >= minQueryLength) {
          performSearch(searchQuery, searchFilters, searchSort);
        } else {
          setResults(null);
          setSuggestions([]);
        }
      }, debounceMs);
    },
    [debounceMs, minQueryLength]
  );

  // Perform actual search
  const performSearch = useCallback(
    async (searchQuery: string, searchFilters: SearchFilters, searchSort: SearchSort, page: number = 1) => {
      // Cancel previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();
      setIsLoading(true);
      setError(null);

      try {
        const searchRequest: SearchQuery = {
          query: searchQuery,
          filters: searchFilters,
          sort: searchSort,
          pagination: {
            page,
            pageSize: 20,
          },
          highlight: true,
          suggestions: true,
        };

        const result = await defaultSearchEngine.search(searchRequest);
        
        if (page === 1) {
          setResults(result);
        } else {
          // Append results for pagination
          setResults(prev => prev ? {
            ...result,
            items: [...prev.items, ...result.items],
          } : result);
        }

        // Add to search history
        if (!searchHistoryRef.current.includes(searchQuery)) {
          searchHistoryRef.current.unshift(searchQuery);
          searchHistoryRef.current = searchHistoryRef.current.slice(0, 10); // Keep last 10
        }

      } catch (err) {
        if (err instanceof Error && err.name !== 'AbortError') {
          setError(err.message);
          console.error('Search error:', err);
        }
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Get search suggestions
  const getSuggestions = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < minQueryLength) {
      setSuggestions([]);
      return;
    }

    try {
      const suggestions = await defaultSearchEngine.suggest(searchQuery, {
        maxSuggestions: 5,
        types: ['completion', 'correction'],
        fuzzy: true,
      });
      setSuggestions(suggestions);
    } catch (err) {
      console.error('Suggestions error:', err);
      setSuggestions([]);
    }
  }, [minQueryLength]);

  // Update query
  const updateQuery = useCallback((newQuery: string) => {
    setQuery(newQuery);
    
    if (autoSearch) {
      debouncedSearch(newQuery, filters, sort);
    }
    
    // Get suggestions
    getSuggestions(newQuery);
  }, [autoSearch, filters, sort, debouncedSearch, getSuggestions]);

  // Update filters
  const updateFilters = useCallback((newFilters: Partial<SearchFilters>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    
    if (autoSearch && query.length >= minQueryLength) {
      debouncedSearch(query, updatedFilters, sort);
    }
  }, [filters, autoSearch, query, minQueryLength, sort, debouncedSearch]);

  // Update sort
  const updateSort = useCallback((newSort: SearchSort) => {
    setSort(newSort);
    
    if (autoSearch && query.length >= minQueryLength) {
      debouncedSearch(query, filters, newSort);
    }
  }, [autoSearch, query, minQueryLength, filters, debouncedSearch]);

  // Manual search
  const search = useCallback(async () => {
    if (query.length >= minQueryLength) {
      await performSearch(query, filters, sort);
    }
  }, [query, filters, sort, minQueryLength, performSearch]);

  // Clear search
  const clear = useCallback(() => {
    setQuery('');
    setFilters({});
    setResults(null);
    setSuggestions([]);
    setError(null);
    
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
  }, []);

  // Load more results
  const loadMore = useCallback(async () => {
    if (results && results.hasMore && !isLoading) {
      const nextPage = results.page + 1;
      await performSearch(query, filters, sort, nextPage);
    }
  }, [results, isLoading, query, filters, sort, performSearch]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Computed values
  const hasResults = results !== null && results.items.length > 0;
  const hasMore = results?.hasMore || false;
  const totalResults = results?.total || 0;

  return {
    // State
    query,
    filters,
    sort,
    results,
    suggestions,
    isLoading,
    error,
    
    // Actions
    setQuery: updateQuery,
    setFilters: updateFilters,
    setSort: updateSort,
    search,
    clear,
    loadMore,
    
    // Utilities
    hasResults,
    hasMore,
    totalResults,
  };
}

/**
 * Hook for search suggestions with auto-complete
 */
export function useSearchSuggestions(query: string, options: {
  debounceMs?: number;
  minQueryLength?: number;
  maxSuggestions?: number;
} = {}) {
  const {
    debounceMs = 200,
    minQueryLength = 2,
    maxSuggestions = 5,
  } = options;

  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const debounceRef = useRef<NodeJS.Timeout>();

  const getSuggestions = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < minQueryLength) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);

    try {
      const suggestions = await defaultSearchEngine.suggest(searchQuery, {
        maxSuggestions,
        types: ['completion', 'correction', 'phrase'],
        fuzzy: true,
      });
      setSuggestions(suggestions);
    } catch (error) {
      console.error('Suggestions error:', error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  }, [minQueryLength, maxSuggestions]);

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      getSuggestions(query);
    }, debounceMs);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query, debounceMs, getSuggestions]);

  return {
    suggestions,
    isLoading,
  };
}

/**
 * Hook for search analytics and metrics
 */
export function useSearchAnalytics() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const loadAnalytics = useCallback(async () => {
    setIsLoading(true);
    
    try {
      const data = defaultSearchEngine.getAnalytics();
      setAnalytics(data);
    } catch (error) {
      console.error('Analytics error:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getPopularQueries = useCallback((limit: number = 10) => {
    return defaultSearchEngine.getPopularQueries(limit);
  }, []);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  return {
    analytics,
    isLoading,
    loadAnalytics,
    getPopularQueries,
  };
}

/**
 * Hook for search history management
 */
export function useSearchHistory() {
  const [history, setHistory] = useState<string[]>([]);

  const addToHistory = useCallback((query: string) => {
    setHistory(prev => {
      const filtered = prev.filter(q => q !== query);
      return [query, ...filtered].slice(0, 20); // Keep last 20
    });
  }, []);

  const removeFromHistory = useCallback((query: string) => {
    setHistory(prev => prev.filter(q => q !== query));
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('searchHistory');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (error) {
        console.error('Failed to load search history:', error);
      }
    }
  }, []);

  // Save to localStorage when history changes
  useEffect(() => {
    localStorage.setItem('searchHistory', JSON.stringify(history));
  }, [history]);

  return {
    history,
    addToHistory,
    removeFromHistory,
    clearHistory,
  };
}

/**
 * Hook for faceted search
 */
export function useFacetedSearch(initialQuery: string = '') {
  const [query, setQuery] = useState<string>(initialQuery);
  const [selectedFacets, setSelectedFacets] = useState<Record<string, string[]>>({});
  const [results, setResults] = useState<SearchResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const search = useCallback(async (page: number = 1) => {
    if (!query.trim()) return;

    setIsLoading(true);

    try {
      const result = await defaultSearchEngine.facetedSearch(query, selectedFacets, { page });
      
      if (page === 1) {
        setResults(result);
      } else {
        setResults(prev => prev ? {
          ...result,
          items: [...prev.items, ...result.items],
        } : result);
      }
    } catch (error) {
      console.error('Faceted search error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [query, selectedFacets]);

  const toggleFacet = useCallback((facetType: string, value: string) => {
    setSelectedFacets(prev => {
      const current = prev[facetType] || [];
      const updated = current.includes(value)
        ? current.filter(v => v !== value)
        : [...current, value];
      
      return {
        ...prev,
        [facetType]: updated,
      };
    });
  }, []);

  const clearFacets = useCallback(() => {
    setSelectedFacets({});
  }, []);

  const loadMore = useCallback(async () => {
    if (results?.hasMore && !isLoading) {
      await search(results.page + 1);
    }
  }, [results, isLoading, search]);

  useEffect(() => {
    if (query.trim()) {
      search();
    }
  }, [query, selectedFacets, search]);

  return {
    query,
    setQuery,
    selectedFacets,
    toggleFacet,
    clearFacets,
    results,
    isLoading,
    search,
    loadMore,
  };
}
