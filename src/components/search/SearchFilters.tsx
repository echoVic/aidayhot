'use client';

import { useMemoizedFn } from 'ahooks';
import React, { useState } from 'react';
import type { SearchFacets, SearchFilters } from '../../lib/search/types';

interface SearchFiltersProps {
  filters: SearchFilters;
  facets?: SearchFacets;
  onChange: (filters: Partial<SearchFilters>) => void;
  onClear: () => void;
  className?: string;
  collapsible?: boolean;
  showCounts?: boolean;
}

/**
 * Advanced search filters component with faceted navigation
 */
export default function SearchFiltersComponent({
  filters,
  facets,
  onChange,
  onClear,
  className = '',
  collapsible = true,
  showCounts = true,
}: SearchFiltersProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['category', 'author', 'dateRange'])
  );

  const toggleSection = useMemoizedFn((section: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(section)) {
        newSet.delete(section);
      } else {
        newSet.add(section);
      }
      return newSet;
    });
  });

  const handleFilterChange = useMemoizedFn((filterType: string, value: unknown) => {
    onChange({ [filterType]: value });
  });

  const handleArrayFilterToggle = useMemoizedFn((filterType: string, value: string) => {
    const currentValues = (filters as Record<string, unknown>)[filterType] as string[] || [];
    const newValues = currentValues.includes(value)
      ? currentValues.filter((v: string) => v !== value)
      : [...currentValues, value];
    
    handleFilterChange(filterType, newValues);
  });

  const hasActiveFilters = Object.values(filters).some(value => {
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'object' && value !== null) {
      return Object.values(value).some(v => v !== undefined && v !== null);
    }
    return value !== undefined && value !== null;
  });

  const getActiveFilterCount = () => {
    let count = 0;
    Object.values(filters).forEach(value => {
      if (Array.isArray(value)) count += value.length;
      else if (typeof value === 'object' && value !== null) {
        count += Object.values(value).filter(v => v !== undefined && v !== null).length;
      } else if (value !== undefined && value !== null) count += 1;
    });
    return count;
  };

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Filters
          {hasActiveFilters && (
            <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {getActiveFilterCount()}
            </span>
          )}
        </h3>
        {hasActiveFilters && (
          <button
            onClick={onClear}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Category Filter */}
      <FilterSection
        title="Category"
        isExpanded={expandedSections.has('category')}
        onToggle={() => toggleSection('category')}
        collapsible={collapsible}
      >
        <div className="space-y-2">
          {facets?.category?.map(facet => (
            <label key={facet.value} className="flex items-center">
              <input
                type="checkbox"
                checked={filters.category?.includes(facet.value) || false}
                onChange={() => handleArrayFilterToggle('category', facet.value)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700 flex-1">
                {facet.value}
                {showCounts && (
                  <span className="ml-1 text-gray-500">({facet.count})</span>
                )}
              </span>
            </label>
          )) || (
            // Default categories if no facets
            ['AI', 'Machine Learning', 'Technology', 'Science', 'Research'].map(category => (
              <label key={category} className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.category?.includes(category) || false}
                  onChange={() => handleArrayFilterToggle('category', category)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">{category}</span>
              </label>
            ))
          )}
        </div>
      </FilterSection>

      {/* Author Filter */}
      <FilterSection
        title="Author"
        isExpanded={expandedSections.has('author')}
        onToggle={() => toggleSection('author')}
        collapsible={collapsible}
      >
        <div className="space-y-2">
          {facets?.author?.slice(0, 10).map(facet => (
            <label key={facet.value} className="flex items-center">
              <input
                type="checkbox"
                checked={filters.author?.includes(facet.value) || false}
                onChange={() => handleArrayFilterToggle('author', facet.value)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700 flex-1 truncate">
                {facet.value}
                {showCounts && (
                  <span className="ml-1 text-gray-500">({facet.count})</span>
                )}
              </span>
            </label>
          )) || (
            <div className="text-sm text-gray-500">
              Authors will appear here based on search results
            </div>
          )}
        </div>
      </FilterSection>

      {/* Date Range Filter */}
      <FilterSection
        title="Date Range"
        isExpanded={expandedSections.has('dateRange')}
        onToggle={() => toggleSection('dateRange')}
        collapsible={collapsible}
      >
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                From
              </label>
              <input
                type="date"
                value={filters.dateRange?.start?.toISOString().split('T')[0] || ''}
                onChange={(e) => {
                  const date = e.target.value ? new Date(e.target.value) : undefined;
                  handleFilterChange('dateRange', {
                    ...filters.dateRange,
                    start: date,
                  });
                }}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                To
              </label>
              <input
                type="date"
                value={filters.dateRange?.end?.toISOString().split('T')[0] || ''}
                onChange={(e) => {
                  const date = e.target.value ? new Date(e.target.value) : undefined;
                  handleFilterChange('dateRange', {
                    ...filters.dateRange,
                    end: date,
                  });
                }}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          {/* Quick date filters */}
          <div className="flex flex-wrap gap-1">
            {[
              { label: 'Today', days: 0 },
              { label: 'This week', days: 7 },
              { label: 'This month', days: 30 },
              { label: 'This year', days: 365 },
            ].map(({ label, days }) => (
              <button
                key={label}
                onClick={() => {
                  const end = new Date();
                  const start = new Date();
                  start.setDate(start.getDate() - days);
                  handleFilterChange('dateRange', { start, end });
                }}
                className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors"
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </FilterSection>

      {/* Tags Filter */}
      <FilterSection
        title="Tags"
        isExpanded={expandedSections.has('tags')}
        onToggle={() => toggleSection('tags')}
        collapsible={collapsible}
      >
        <div className="space-y-2">
          {facets?.tags?.slice(0, 15).map(facet => (
            <label key={facet.value} className="flex items-center">
              <input
                type="checkbox"
                checked={filters.tags?.includes(facet.value) || false}
                onChange={() => handleArrayFilterToggle('tags', facet.value)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700 flex-1">
                #{facet.value}
                {showCounts && (
                  <span className="ml-1 text-gray-500">({facet.count})</span>
                )}
              </span>
            </label>
          )) || (
            <div className="text-sm text-gray-500">
              Tags will appear here based on search results
            </div>
          )}
        </div>
      </FilterSection>

      {/* Source Filter */}
      <FilterSection
        title="Source"
        isExpanded={expandedSections.has('source')}
        onToggle={() => toggleSection('source')}
        collapsible={collapsible}
      >
        <div className="space-y-2">
          {facets?.source?.map(facet => (
            <label key={facet.value} className="flex items-center">
              <input
                type="checkbox"
                checked={filters.source?.includes(facet.value) || false}
                onChange={() => handleArrayFilterToggle('source', facet.value)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700 flex-1">
                {facet.value}
                {showCounts && (
                  <span className="ml-1 text-gray-500">({facet.count})</span>
                )}
              </span>
            </label>
          )) || (
            ['ArXiv', 'GitHub', 'Papers with Code', 'Stack Overflow'].map(source => (
              <label key={source} className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.source?.includes(source) || false}
                  onChange={() => handleArrayFilterToggle('source', source)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">{source}</span>
              </label>
            ))
          )}
        </div>
      </FilterSection>
    </div>
  );
}

/**
 * Collapsible filter section component
 */
interface FilterSectionProps {
  title: string;
  children: React.ReactNode;
  isExpanded: boolean;
  onToggle: () => void;
  collapsible: boolean;
}

function FilterSection({
  title,
  children,
  isExpanded,
  onToggle,
  collapsible,
}: FilterSectionProps) {
  return (
    <div className="border-b border-gray-200 last:border-b-0 pb-4 mb-4 last:pb-0 last:mb-0">
      <button
        onClick={collapsible ? onToggle : undefined}
        className={`
          flex items-center justify-between w-full text-left
          ${collapsible ? 'hover:text-blue-600' : 'cursor-default'}
        `}
        disabled={!collapsible}
      >
        <h4 className="text-sm font-medium text-gray-900">{title}</h4>
        {collapsible && (
          <svg
            className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        )}
      </button>
      
      {(!collapsible || isExpanded) && (
        <div className="mt-3">
          {children}
        </div>
      )}
    </div>
  );
}
