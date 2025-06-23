'use client';

import React, { useCallback } from 'react';
import OptimizedImage from '../OptimizedImage';
import type { SearchResult, SearchResultItem } from '../../lib/search/types';

interface SearchResultsProps<T = any> {
  results: SearchResult<T>;
  onItemClick?: (item: SearchResultItem<T>, index: number) => void;
  onLoadMore?: () => void;
  loading?: boolean;
  className?: string;
  renderItem?: (item: SearchResultItem<T>, index: number) => React.ReactNode;
  highlightQuery?: boolean;
  showSnippets?: boolean;
  showMetadata?: boolean;
}

/**
 * Advanced search results component with highlighting and custom rendering
 */
export default function SearchResults<T = any>({
  results,
  onItemClick,
  onLoadMore,
  loading = false,
  className = '',
  renderItem,
  highlightQuery = true,
  showSnippets = true,
  showMetadata = false,
}: SearchResultsProps<T>) {
  const handleItemClick = useCallback((item: SearchResultItem<T>, index: number) => {
    onItemClick?.(item, index);
  }, [onItemClick]);

  const highlightText = useCallback((text: string, highlights?: any[]): React.ReactNode => {
    if (!highlightQuery || !highlights || highlights.length === 0) {
      return text;
    }

    // Simple highlighting implementation
    let highlightedText = text;
    highlights.forEach(highlight => {
      highlight.matchedTerms?.forEach((term: string) => {
        const regex = new RegExp(`(${term})`, 'gi');
        highlightedText = highlightedText.replace(regex, '<mark class="bg-yellow-200 px-1 rounded">$1</mark>');
      });
    });

    return <span dangerouslySetInnerHTML={{ __html: highlightedText }} />;
  }, [highlightQuery]);

  if (results.items.length === 0 && !loading) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <div className="max-w-md mx-auto">
          <svg
            className="w-16 h-16 mx-auto text-gray-400 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
          <p className="text-gray-500">
            Try adjusting your search terms or filters to find what you're looking for.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Results header */}
      <div className="flex items-center justify-between mb-6">
        <div className="text-sm text-gray-600">
          {results.total > 0 && (
            <>
              Showing {results.items.length} of {results.total.toLocaleString()} results
              {results.queryTime && (
                <span className="ml-2">
                  ({results.queryTime.toFixed(0)}ms)
                </span>
              )}
            </>
          )}
        </div>
        
        {/* Sort options could go here */}
      </div>

      {/* Results list */}
      <div className="space-y-6">
        {results.items.map((item, index) => (
          <div key={item.id || index}>
            {renderItem ? (
              renderItem(item, index)
            ) : (
              <DefaultResultItem
                item={item}
                index={index}
                onClick={() => handleItemClick(item, index)}
                highlightText={highlightText}
                showSnippets={showSnippets}
                showMetadata={showMetadata}
              />
            )}
          </div>
        ))}
      </div>

      {/* Load more button */}
      {results.hasMore && (
        <div className="mt-8 text-center">
          <button
            onClick={onLoadMore}
            disabled={loading}
            className="inline-flex items-center px-6 py-3 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-2" />
                Loading...
              </>
            ) : (
              'Load More Results'
            )}
          </button>
        </div>
      )}

      {/* Loading overlay */}
      {loading && results.items.length === 0 && (
        <div className="space-y-6">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="animate-pulse">
              <div className="flex space-x-4">
                <div className="w-16 h-16 bg-gray-200 rounded"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-3 bg-gray-200 rounded w-full"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Default result item component
 */
interface DefaultResultItemProps<T = any> {
  item: SearchResultItem<T>;
  index: number;
  onClick: () => void;
  highlightText: (text: string, highlights?: any[]) => React.ReactNode;
  showSnippets: boolean;
  showMetadata: boolean;
}

function DefaultResultItem<T = any>({
  item,
  index,
  onClick,
  highlightText,
  showSnippets,
  showMetadata,
}: DefaultResultItemProps<T>) {
  const data = item.data as any;

  return (
    <article
      className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <div className="flex space-x-4">
        {/* Image */}
        {data.imageUrl && (
          <div className="flex-shrink-0">
            <OptimizedImage
              src={data.imageUrl}
              alt={data.title || 'Article image'}
              width={80}
              height={80}
              className="rounded-lg"
              lazy={index > 2}
            />
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Title */}
          <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
            {highlightText(data.title || 'Untitled', item.highlights)}
          </h3>

          {/* Metadata */}
          <div className="flex items-center text-sm text-gray-500 mb-3 space-x-4">
            {data.author && (
              <span className="flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                {data.author}
              </span>
            )}
            
            {data.publishTime && (
              <span className="flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {new Date(data.publishTime).toLocaleDateString()}
              </span>
            )}

            {data.category && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {data.category}
              </span>
            )}

            {item.score && showMetadata && (
              <span className="text-xs text-gray-400">
                Score: {item.score.toFixed(2)}
              </span>
            )}
          </div>

          {/* Summary/Snippet */}
          {showSnippets && (data.summary || item.snippet) && (
            <p className="text-gray-700 text-sm line-clamp-3 mb-3">
              {highlightText(
                item.snippet || data.summary || '',
                item.highlights
              )}
            </p>
          )}

          {/* Tags */}
          {data.tags && data.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {data.tags.slice(0, 5).map((tag: string, tagIndex: number) => (
                <span
                  key={tagIndex}
                  className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800"
                >
                  #{tag}
                </span>
              ))}
              {data.tags.length > 5 && (
                <span className="text-xs text-gray-500">
                  +{data.tags.length - 5} more
                </span>
              )}
            </div>
          )}

          {/* Highlights */}
          {item.highlights && item.highlights.length > 0 && (
            <div className="mt-3 space-y-1">
              {item.highlights.slice(0, 2).map((highlight, highlightIndex) => (
                <div key={highlightIndex} className="text-xs text-gray-600">
                  <span className="font-medium capitalize">{highlight.field}:</span>
                  {highlight.fragments.slice(0, 1).map((fragment, fragmentIndex) => (
                    <span
                      key={fragmentIndex}
                      className="ml-1"
                      dangerouslySetInnerHTML={{ __html: fragment }}
                    />
                  ))}
                </div>
              ))}
            </div>
          )}

          {/* Source info */}
          {data.sourceUrl && (
            <div className="mt-3 flex items-center text-xs text-gray-500">
              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              <span className="truncate">{new URL(data.sourceUrl).hostname}</span>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex-shrink-0 flex flex-col space-y-2">
          {data.sourceUrl && (
            <a
              href={data.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center px-3 py-1 border border-gray-300 rounded text-xs font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              View
            </a>
          )}
        </div>
      </div>
    </article>
  );
}
