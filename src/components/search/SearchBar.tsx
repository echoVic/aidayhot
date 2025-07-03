'use client';

import { useMemoizedFn } from 'ahooks';
import React, { useEffect, useRef, useState } from 'react';
import { useSearchHistory, useSearchSuggestions } from '../../hooks/useSearch';
import type { SearchSuggestion } from '../../lib/search/types';

interface SearchBarProps {
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  onSearch?: (query: string) => void;
  onSuggestionSelect?: (suggestion: SearchSuggestion) => void;
  className?: string;
  autoComplete?: boolean;
  showHistory?: boolean;
  showSuggestions?: boolean;
  debounceMs?: number;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'minimal' | 'rounded';
}

/**
 * Advanced search bar with auto-complete, suggestions, and history
 */
export default function SearchBar({
  placeholder = 'Search articles...',
  value = '',
  onChange,
  onSearch,
  onSuggestionSelect,
  className = '',
  autoComplete = true,
  showHistory = true,
  showSuggestions = true,
  debounceMs = 300,
  size = 'md',
  variant = 'default',
}: SearchBarProps) {
  const [query, setQuery] = useState<string>(value);
  const [isFocused, setIsFocused] = useState<boolean>(false);
  const [showDropdown, setShowDropdown] = useState<boolean>(false);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);

  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { suggestions, isLoading: suggestionsLoading } = useSearchSuggestions(
    query,
    { debounceMs, minQueryLength: 2, maxSuggestions: 5 }
  );

  const { history, addToHistory, removeFromHistory } = useSearchHistory();

  // Handle input change
  const handleInputChange = useMemoizedFn((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setQuery(newValue);
    setSelectedIndex(-1);
    onChange?.(newValue);
  });

  // Handle search submission
  const handleSearch = useMemoizedFn((searchQuery?: string) => {
    const finalQuery = searchQuery || query;
    if (finalQuery.trim()) {
      addToHistory(finalQuery.trim());
      onSearch?.(finalQuery.trim());
      setShowDropdown(false);
      inputRef.current?.blur();
    }
  });

  // Handle suggestion selection
  const handleSuggestionSelect = useMemoizedFn((suggestion: SearchSuggestion) => {
    setQuery(suggestion.text);
    onChange?.(suggestion.text);
    onSuggestionSelect?.(suggestion);
    handleSearch(suggestion.text);
  });

  // Handle history item selection
  const handleHistorySelect = useMemoizedFn((historyItem: string) => {
    setQuery(historyItem);
    onChange?.(historyItem);
    handleSearch(historyItem);
  });

  // Handle keyboard navigation
  const handleKeyDown = useMemoizedFn((e: React.KeyboardEvent) => {
    const items = [
      ...(showHistory ? history.slice(0, 3) : []),
      ...(showSuggestions ? suggestions.map(s => s.text) : []),
    ];

    switch (e.key) {
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && items[selectedIndex]) {
          if (selectedIndex < history.length) {
            handleHistorySelect(items[selectedIndex]);
          } else {
            const suggestion = suggestions[selectedIndex - history.length];
            handleSuggestionSelect(suggestion);
          }
        } else {
          handleSearch();
        }
        break;

      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, items.length - 1));
        break;

      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, -1));
        break;

      case 'Escape':
        setShowDropdown(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;

      case 'Tab':
        if (selectedIndex >= 0 && items[selectedIndex]) {
          e.preventDefault();
          setQuery(items[selectedIndex]);
          onChange?.(items[selectedIndex]);
        }
        break;
    }
  });

  // Handle focus
  const handleFocus = useMemoizedFn(() => {
    setIsFocused(true);
    setShowDropdown(true);
  });

  // Handle blur
  const handleBlur = useMemoizedFn((e: React.FocusEvent) => {
    // Delay hiding dropdown to allow for clicks
    setTimeout(() => {
      if (!dropdownRef.current?.contains(document.activeElement)) {
        setIsFocused(false);
        setShowDropdown(false);
        setSelectedIndex(-1);
      }
    }, 150);
  });

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        inputRef.current &&
        !inputRef.current.contains(event.target as Node) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update query when value prop changes
  useEffect(() => {
    setQuery(value);
  }, [value]);

  // Size classes
  const sizeClasses = {
    sm: 'h-8 text-sm px-3',
    md: 'h-10 text-base px-4',
    lg: 'h-12 text-lg px-5',
  };

  // Variant classes
  const variantClasses = {
    default: 'border border-gray-300 rounded-md',
    minimal: 'border-0 border-b-2 border-gray-300 rounded-none',
    rounded: 'border border-gray-300 rounded-full',
  };

  const shouldShowDropdown = showDropdown && isFocused && (
    (showHistory && history.length > 0) ||
    (showSuggestions && suggestions.length > 0)
  );

  return (
    <div className={`relative ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          autoComplete={autoComplete ? 'on' : 'off'}
          className={`
            w-full
            ${sizeClasses[size]}
            ${variantClasses[variant]}
            bg-white
            text-gray-900
            placeholder-gray-500
            focus:outline-none
            focus:ring-2
            focus:ring-blue-500
            focus:border-transparent
            transition-all
            duration-200
            pr-10
          `}
        />

        {/* Search Icon */}
        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
          {suggestionsLoading ? (
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          ) : (
            <button
              onClick={() => handleSearch()}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Dropdown */}
      {shouldShowDropdown && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-80 overflow-y-auto"
        >
          {/* Search History */}
          {showHistory && history.length > 0 && (
            <div className="py-2">
              <div className="px-3 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Recent Searches
              </div>
              {history.slice(0, 3).map((item, index) => (
                <button
                  key={`history-${index}`}
                  onClick={() => handleHistorySelect(item)}
                  className={`
                    w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center
                    ${selectedIndex === index ? 'bg-blue-50 text-blue-600' : 'text-gray-700'}
                  `}
                >
                  <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="flex-1 truncate">{item}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFromHistory(item);
                    }}
                    className="ml-2 text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </button>
              ))}
            </div>
          )}

          {/* Suggestions */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="py-2 border-t border-gray-100">
              <div className="px-3 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Suggestions
              </div>
              {suggestions.map((suggestion, index) => {
                const adjustedIndex = (showHistory ? history.slice(0, 3).length : 0) + index;
                return (
                  <button
                    key={`suggestion-${index}`}
                    onClick={() => handleSuggestionSelect(suggestion)}
                    className={`
                      w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center
                      ${selectedIndex === adjustedIndex ? 'bg-blue-50 text-blue-600' : 'text-gray-700'}
                    `}
                  >
                    <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <span className="flex-1">
                      {suggestion.text}
                      {suggestion.type === 'correction' && (
                        <span className="ml-2 text-xs text-gray-500">(suggested)</span>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* No results */}
          {query.length >= 2 && !suggestionsLoading && suggestions.length === 0 && history.length === 0 && (
            <div className="px-3 py-4 text-sm text-gray-500 text-center">
              No suggestions found
            </div>
          )}
        </div>
      )}
    </div>
  );
}
