'use client';

import { useMemoizedFn } from 'ahooks';
import { useEffect, useState } from 'react';
import InfiniteScroll from 'react-infinite-scroll-component';
import { getPageConfig } from '../config/pageConfig';
import { ArticleService, type PaginatedResult } from '../lib/database';
import type { Article } from '../lib/supabase';
import CommunityCard from './CommunityCard';
import CommunityFilter from './CommunityFilter';
import { DataLoadError } from './ErrorBoundary';
import { showToast } from './ToastProvider';

interface CommunityContentProps {
  searchQuery?: string;
}

const PAGE_SIZE = 20;

export default function CommunityContent({ searchQuery }: CommunityContentProps) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    hasMore: true,
    total: 0
  });

  // 筛选状态
  const [selectedContentType, setSelectedContentType] = useState<string>('全部');
  const [sortBy, setSortBy] = useState<'latest' | 'popular' | 'trending'>('latest');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

  // 获取页面配置
  const pageConfig = getPageConfig('community');

  // 加载社区动态数据
  const loadCommunityContent = useMemoizedFn(async (page = 1, append = false, showToastMessage = false) => {
    try {
      console.log('📊 开始加载社区动态:', {
        page,
        append,
        currentArticlesLength: articles.length,
        selectedContentType,
        sortBy,
        searchQuery
      });

      if (page === 1) {
        setLoading(true);
        setError(null);
      }

      let result: PaginatedResult<Article>;

      if (searchQuery) {
        // 搜索社区动态内容
        result = await ArticleService.searchCommunityContent(
          searchQuery,
          page,
          PAGE_SIZE,
          selectedContentType
        );
      } else {
        // 获取社区动态内容
        result = await ArticleService.getCommunityContent(
          page,
          PAGE_SIZE,
          selectedContentType
        );
      }

      console.log('📈 数据库查询结果:', {
        page: result.page,
        total: result.total,
        hasMore: result.hasMore,
        dataLength: result.data?.length || 0,
        append
      });

      if (result.data) {
        // 验证和清理数据
        const newArticles = result.data.filter(article => {
          if (!article || typeof article !== 'object') {
            console.warn('发现无效文章数据:', article);
            return false;
          }
          if (!article.id) {
            console.warn('文章缺少ID:', article);
            return false;
          }
          return true;
        });

        console.log('📊 验证后的文章数据:', {
          原始数量: result.data.length,
          有效数量: newArticles.length,
          示例数据: newArticles[0]
        });

        if (append && page > 1) {
          console.log('📝 追加文章到现有列表');
          setArticles(prev => [...prev, ...newArticles]);
        } else {
          console.log('🔄 替换现有文章列表');
          setArticles(newArticles);
        }

        setPagination({
          page: result.page,
          hasMore: result.hasMore,
          total: result.total
        });

        if (showToastMessage && page === 1 && result.data.length > 0) {
          showToast.success(`共找到 ${result.total} 条社区动态`, '数据加载成功');
        }
      }

    } catch (err) {
      console.error('加载社区动态失败:', err);
      const errorMessage = err instanceof Error ? err.message : '加载社区动态失败，请稍后重试';
      setError(errorMessage);
      if (showToastMessage) {
        showToast.error(errorMessage, '加载失败');
      }
    } finally {
      setLoading(false);
    }
  });

  // 加载更多内容
  const loadMore = useMemoizedFn(() => {
    if (pagination.hasMore && !loading) {
      loadCommunityContent(pagination.page + 1, true);
    }
  });

  // 重置并重新加载
  const resetAndReload = useMemoizedFn(() => {
    setPagination(prev => ({ ...prev, page: 1 }));
    loadCommunityContent(1, false);
  });

  // 处理筛选变化
  const handleFilterChange = useMemoizedFn((filters: {
    contentType?: string;
    sortBy?: 'latest' | 'popular' | 'trending';
    viewMode?: 'grid' | 'list';
  }) => {
    if (filters.contentType !== undefined) {
      setSelectedContentType(filters.contentType);
    }
    if (filters.sortBy !== undefined) {
      setSortBy(filters.sortBy);
    }
    if (filters.viewMode !== undefined) {
      setViewMode(filters.viewMode);
    }
    
    // 重新加载数据
    setTimeout(() => resetAndReload(), 0);
  });

  // 初始加载和依赖变化时重新加载
  useEffect(() => {
    resetAndReload();
  }, [searchQuery, selectedContentType, resetAndReload]);

  // 处理文章点击（增加浏览量）
  const handleArticleClick = useMemoizedFn(async (articleId: string) => {
    try {
      await ArticleService.incrementViews(articleId);
      // 更新本地状态
      setArticles(prev => prev.map(article =>
        article.id === articleId
          ? { ...article, views: article.views + 1 }
          : article
      ));
    } catch (err) {
      console.error('更新浏览量失败:', err);
    }
  });

  if (loading && articles.length === 0) {
    return (
      <main className="flex-1 min-w-0 bg-gray-50 p-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="mb-6">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
              {pageConfig?.title || '社区动态'}
            </h1>
            <p className="text-gray-600 text-sm sm:text-base">
              {pageConfig?.description || '社交媒体讨论、播客节目和社区观点'}
            </p>
          </div>
          <div className="animate-pulse space-y-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="bg-gray-100 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-20 h-6 bg-gray-200 rounded-full"></div>
                  <div className="w-16 h-4 bg-gray-200 rounded"></div>
                </div>
                <div className="space-y-2 mb-3">
                  <div className="h-5 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-5 bg-gray-200 rounded w-1/2"></div>
                </div>
                <div className="flex items-center mb-3">
                  <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                  <div className="ml-2 space-y-1">
                    <div className="h-4 bg-gray-200 rounded w-20"></div>
                    <div className="h-3 bg-gray-200 rounded w-16"></div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    );
  }

  if (error && articles.length === 0) {
    return (
      <main className="flex-1 min-w-0 bg-gray-50 p-6">
        <DataLoadError onRetry={resetAndReload} />
      </main>
    );
  }

  return (
    <main className="flex-1 bg-gray-50 p-4 sm:p-6">
      {/* 页面标题和描述 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 space-y-2 sm:space-y-0">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
              {pageConfig?.title || '社区动态'}
            </h1>
            <p className="text-gray-600 mt-1 text-sm sm:text-base">
              {searchQuery ? `搜索结果: "${searchQuery}"` : (pageConfig?.description || '社交媒体讨论、播客节目和社区观点')}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-xs sm:text-sm text-gray-500">
              共 {pagination.total} 条 {pagination.total > 0 && `(显示 ${articles.length} 条)`}
            </span>
          </div>
        </div>

        {/* 筛选器 */}
        <CommunityFilter
          selectedContentType={selectedContentType}
          sortBy={sortBy}
          viewMode={viewMode}
          onFilterChange={handleFilterChange}
        />
      </div>

      {/* 内容列表 */}
      {articles.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a2 2 0 01-2-2v-6a2 2 0 012-2h8z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchQuery ? '没有找到相关内容' : '暂无社区动态'}
          </h3>
          <p className="text-gray-500">
            {searchQuery ? '请尝试其他关键词或检查拼写' : '数据正在收集中，请稍后刷新页面'}
          </p>
        </div>
      ) : (
        <InfiniteScroll
          dataLength={articles.length}
          next={loadMore}
          hasMore={pagination.hasMore}
          loader={
            <div className="text-center py-8">
              <div className="inline-flex items-center px-6 py-4 bg-white rounded-lg shadow-sm border border-gray-200">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="text-gray-600 font-medium">正在加载更多内容...</span>
              </div>
            </div>
          }
          endMessage={
            <div className="text-center py-8">
              <div className="inline-flex items-center px-6 py-4 bg-gray-50 rounded-lg border border-gray-200">
                <svg className="w-5 h-5 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-gray-500 font-medium">已加载全部内容</span>
              </div>
            </div>
          }
        >
          <div className={`${
            viewMode === 'grid'
              ? 'grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-6'
              : 'space-y-4'
          }`}>
            {articles.filter(article => article && article.id).map((article) => (
              <CommunityCard
                key={article.id}
                article={article}
                layout={viewMode}
                onClick={() => handleArticleClick(article.id)}
              />
            ))}
          </div>
        </InfiniteScroll>
      )}
    </main>
  );
}
