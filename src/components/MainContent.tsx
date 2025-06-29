'use client';

import { useCallback, useEffect, useState } from 'react';
import { ArticleService, RealtimeService, type PaginatedResult } from '../lib/database';
import type { Article } from '../lib/supabase';
import ArticleCard from './ArticleCard';
import { DataLoadError } from './ErrorBoundary';
import { showToast } from './ToastProvider';

interface MainContentProps {
  searchQuery?: string;
  category?: string;
}

export default function MainContent({ searchQuery, category }: MainContentProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [sortBy, setSortBy] = useState<'latest' | 'popular' | 'trending'>('latest');
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 20,
    total: 0,
    hasMore: false
  });

  // 使用常量避免依赖循环
  const PAGE_SIZE = 20;

  // 加载文章数据
  const loadArticles = useCallback(async (page = 1, append = false, showToastMessage = true) => {
    try {
      if (page === 1) {
        setLoading(true);
        setError(null);
      } else {
        setLoadingMore(true);
      }

      let result: PaginatedResult<Article>;

      if (searchQuery) {
        // 搜索文章
        result = await ArticleService.search(searchQuery, page, PAGE_SIZE);
      } else if (category && category !== '全部') {
        // 按分类获取RSS类型文章
        result = await ArticleService.getRSSArticlesByCategory(category, page, PAGE_SIZE);
      } else {
        // 首页默认只显示RSS文章
        result = await ArticleService.getRSSArticles(page, PAGE_SIZE);
      }

      if (append && page > 1) {
        setArticles(prev => [...prev, ...result.data]);
      } else {
        setArticles(result.data);
      }

      setPagination({
        page: result.page,
        pageSize: result.pageSize,
        total: result.total,
        hasMore: result.hasMore
      });

      if (showToastMessage && page === 1 && result.data.length > 0) {
        showToast.success(`共找到 ${result.total} 篇文章`, '数据加载成功');
      }

    } catch (err) {
      console.error('加载文章失败:', err);
      const errorMessage = err instanceof Error ? err.message : '加载文章失败，请稍后重试';
      setError(errorMessage);
      if (showToastMessage) {
        showToast.error(errorMessage, '加载失败');
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [searchQuery, category]);

  // 加载更多文章
  const loadMoreArticles = useCallback(() => {
    if (!loadingMore && pagination.hasMore) {
      loadArticles(pagination.page + 1, true);
    }
  }, [loadArticles, loadingMore, pagination.hasMore, pagination.page]);

  // 重置并重新加载
  const resetAndReload = useCallback(() => {
    setPagination(prev => ({ ...prev, page: 1 }));
    loadArticles(1, false);
  }, [loadArticles]);

  useEffect(() => {
    resetAndReload();
  }, [category, searchQuery, resetAndReload]);

  // 实时订阅文章变化
  useEffect(() => {
    const subscription = RealtimeService.subscribeToArticles((payload) => {
      console.log('文章数据变化:', payload);
      showToast.info('检测到新内容，正在刷新...', '数据更新');
      // 重新加载数据，不显示 toast 避免循环
      loadArticles(1, false, false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [loadArticles]);

  // 排序文章
  const sortedArticles = [...articles].sort((a, b) => {
    switch (sortBy) {
      case 'popular':
        return b.views - a.views;
      case 'trending':
        return b.likes - a.likes;
      case 'latest':
      default:
        return new Date(b.created_at || b.publish_time).getTime() - 
               new Date(a.created_at || a.publish_time).getTime();
    }
  });

  // 处理文章点击（增加浏览量）
  const handleArticleClick = useCallback(async (articleId: string) => {
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
      showToast.warning('无法更新浏览量', '操作失败');
    }
  }, []);

  if (loading) {
    return (
      <main className="flex-1 bg-gray-50 p-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-spin">
            <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">正在加载文章...</h3>
          <p className="text-gray-500">请稍候</p>
        </div>
      </main>
    );
  }

  if (error && articles.length === 0) {
    return (
      <main className="flex-1 bg-gray-50 p-6">
        <DataLoadError onRetry={resetAndReload} />
      </main>
    );
  }

  return (
    <main className="flex-1 bg-gray-50 p-6">
      {/* 工具栏 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h2 className="text-lg font-semibold text-gray-900">
              {category ? `${category} 相关文章` : searchQuery ? `搜索结果: "${searchQuery}"` : 'AI每日热点'}
            </h2>
            <span className="text-sm text-gray-500">
              共 {pagination.total} 篇文章 {pagination.total > 0 && `(显示 ${sortedArticles.length} 篇)`}
            </span>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* 排序选择 */}
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">排序:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'latest' | 'popular' | 'trending')}
                className="text-sm border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="latest">最新发布</option>
                <option value="popular">热门文章</option>
                <option value="trending">趋势热点</option>
              </select>
            </div>

            {/* 视图模式切换 */}
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'list'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 文章列表 */}
      {sortedArticles.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchQuery ? '没有找到相关文章' : '暂无文章'}
          </h3>
          <p className="text-gray-500">
            {searchQuery ? '请尝试其他关键词或检查拼写' : '数据正在收集中，请稍后刷新页面'}
          </p>
        </div>
      ) : (
        <>
          <div className={`${
            viewMode === 'grid' 
              ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6' 
              : 'space-y-4'
          }`}>
            {sortedArticles.map((article) => (
                             <ArticleCard 
                 key={article.id} 
                 article={article} 
                 layout={viewMode}
                 onClick={() => handleArticleClick(article.id)}
               />
            ))}
          </div>

          {/* 加载更多按钮 */}
          {pagination.hasMore && (
            <div className="mt-8 text-center">
              <button
                onClick={loadMoreArticles}
                disabled={loadingMore}
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loadingMore ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    加载中...
                  </>
                ) : (
                  '加载更多'
                )}
              </button>
            </div>
          )}
        </>
      )}
    </main>
  );
}