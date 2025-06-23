'use client';

import { useEffect, useState, useCallback } from 'react';
import { ArticleService, RealtimeService, type PaginatedResult } from '../lib/database';
import type { Article } from '../lib/supabase';
import ArticleCard from './ArticleCard';
import { ErrorDisplay, DataLoadError } from './ErrorBoundary';
import { useToast, ToastContainer } from './Toast';

interface MainContentProps {
  searchQuery?: string;
  category?: string;
}

export default function MainContent({ searchQuery, category }: MainContentProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
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

  const { toasts, removeToast, showSuccess, showError, showWarning, showInfo } = useToast();

  // 加载文章数据
  const loadArticles = useCallback(async (page = 1, append = false) => {
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
        result = await ArticleService.search(searchQuery, page, pagination.pageSize);
      } else if (category && category !== '全部') {
        // 按分类获取文章
        result = await ArticleService.getByCategory(category, page, pagination.pageSize);
      } else {
        // 获取所有文章
        result = await ArticleService.getAll(page, pagination.pageSize);
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

      if (page === 1 && result.data.length > 0) {
        showSuccess('数据加载成功', `共找到 ${result.total} 篇文章`);
      }

    } catch (err) {
      console.error('加载文章失败:', err);
      const errorMessage = err instanceof Error ? err.message : '加载文章失败，请稍后重试';
      setError(errorMessage);
      showError('加载失败', errorMessage);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [searchQuery, category, pagination.pageSize, showSuccess, showError]);

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
      showInfo('数据更新', '检测到新内容，正在刷新...');
      // 重新加载数据
      resetAndReload();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [resetAndReload, showInfo]);

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
  const handleArticleClick = async (articleId: string) => {
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
      showWarning('操作失败', '无法更新浏览量');
    }
  };

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
        <ToastContainer toasts={toasts} onClose={removeToast} />
        <DataLoadError onRetry={resetAndReload} />
      </main>
    );
  }

  return (
    <main className="flex-1 bg-gray-50 p-6">
      <ToastContainer toasts={toasts} onClose={removeToast} />

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
                <option value="popular">热门阅读</option>
                <option value="trending">热门点赞</option>
              </select>
            </div>

            {/* 视图模式切换 */}
            <div className="flex items-center border border-gray-300 rounded-lg">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-l-lg transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-blue-500 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-r-lg transition-colors ${
                  viewMode === 'list'
                    ? 'bg-blue-500 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
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

      {/* 热门推荐横幅 */}
      {!searchQuery && !category && (
        <div className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-lg p-6 mb-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold mb-2">🔥 今日热门推荐</h3>
              <p className="text-blue-100 mb-4">
                精选最新AI资讯，助您把握行业动态
              </p>
              <div className="flex flex-wrap gap-2">
                {['ChatGPT', 'Stable Diffusion', 'AI芯片', '自动驾驶'].map((tag) => (
                  <span
                    key={tag}
                    className="bg-white/20 text-white px-3 py-1 rounded-full text-sm cursor-pointer hover:bg-white/30 transition-colors"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
            <div className="hidden md:block">
              <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center">
                <span className="text-3xl">🚀</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 文章列表 */}
      {sortedArticles.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">暂无相关文章</h3>
          <p className="text-gray-500">
            {searchQuery ? '尝试使用其他关键词搜索' : '该分类下暂无文章内容'}
          </p>
        </div>
      ) : (
        <div
          className={
            viewMode === 'grid'
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
              : 'space-y-4'
          }
        >
          {sortedArticles.map((article) => (
            <ArticleCard
              key={article.id}
              article={article}
              layout={viewMode}
              onClick={() => handleArticleClick(article.id)}
            />
          ))}
        </div>
      )}

      {/* 加载更多按钮 */}
      {sortedArticles.length > 0 && pagination.hasMore && (
        <div className="mt-8 text-center">
          <button
            onClick={loadMoreArticles}
            disabled={loadingMore}
            className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg transition-colors inline-flex items-center space-x-2"
          >
            {loadingMore ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>加载中...</span>
              </>
            ) : (
              <>
                <span>加载更多文章</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </>
            )}
          </button>

          <p className="text-sm text-gray-500 mt-2">
            已显示 {sortedArticles.length} / {pagination.total} 篇文章
          </p>
        </div>
      )}

      {/* 已加载完所有内容的提示 */}
      {sortedArticles.length > 0 && !pagination.hasMore && pagination.total > pagination.pageSize && (
        <div className="mt-8 text-center">
          <div className="inline-flex items-center space-x-2 text-gray-500 text-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>已显示全部 {pagination.total} 篇文章</span>
          </div>
        </div>
      )}
    </main>
  );
}