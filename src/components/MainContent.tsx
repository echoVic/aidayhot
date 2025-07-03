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
        setArticles(prev => {
          const merged = [...prev, ...result.data];
          // 全局按 publish_time 降序排序
          return merged.sort((a, b) => new Date(b.publish_time).getTime() - new Date(a.publish_time).getTime());
        });
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

  // 滚动到底部自动加载更多
  useEffect(() => {
    const handleScroll = () => {
      // 检查是否滚动到接近底部（距离底部100px以内）
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;

      if (scrollTop + windowHeight >= documentHeight - 100) {
        // 如果有更多数据且当前没有在加载中，则自动加载更多
        if (pagination.hasMore && !loadingMore && !loading) {
          loadMoreArticles();
        }
      }
    };

    // 添加滚动事件监听器，使用节流避免频繁触发
    let timeoutId: NodeJS.Timeout;
    const throttledHandleScroll = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      timeoutId = setTimeout(handleScroll, 200);
    };

    window.addEventListener('scroll', throttledHandleScroll);

    return () => {
      window.removeEventListener('scroll', throttledHandleScroll);
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [pagination.hasMore, loadingMore, loading, loadMoreArticles]);

  // 只执行最新排序，其他选项暂不处理
  const sortedArticles = [...articles].sort((a, b) =>
    new Date(b.publish_time).getTime() - new Date(a.publish_time).getTime()
  );

  // 按日期分组文章
  const groupedArticles = sortedArticles.reduce((groups, article) => {
    const publishDate = new Date(article.publish_time);
    const dateKey = publishDate.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    });

    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(article);
    return groups;
  }, {} as Record<string, Article[]>);

  // 获取排序后的日期键
  const sortedDateKeys = Object.keys(groupedArticles).sort((a, b) => {
    // 通过第一篇文章的时间来排序日期
    const dateA = new Date(groupedArticles[a][0].publish_time);
    const dateB = new Date(groupedArticles[b][0].publish_time);
    return dateB.getTime() - dateA.getTime();
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
      <main className="flex-1 min-w-0 bg-gray-50 p-6">
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
      <main className="flex-1 min-w-0 bg-gray-50 p-6">
        <DataLoadError onRetry={resetAndReload} />
      </main>
    );
  }

  return (
    <main className="flex-1 bg-gray-50 p-4 sm:p-6">
      {/* 页面标题和工具栏 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 space-y-2 sm:space-y-0">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
              {category ? `${category} 相关文章` : searchQuery ? `搜索结果: "${searchQuery}"` : 'AI每日热点'}
            </h1>
            <p className="text-gray-600 mt-1 text-sm sm:text-base">
              {searchQuery ? `为您找到相关内容` : '最新的AI资讯、技术动态和行业新闻'}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-xs sm:text-sm text-gray-500">
              共 {pagination.total} 篇 {pagination.total > 0 && `(显示 ${sortedArticles.length} 篇)`}
            </span>
          </div>
        </div>

        {/* 调试信息 - 开发环境显示 */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md text-xs">
            <strong>调试信息:</strong>
            页面: {pagination.page} |
            总数: {pagination.total} |
            已显示: {sortedArticles.length} |
            还有更多: {pagination.hasMore ? '是' : '否'} |
            加载中: {loading ? '是' : '否'} |
            加载更多中: {loadingMore ? '是' : '否'}
          </div>
        )}

        {/* 筛选和控制工具栏 */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0 sm:space-x-4">
          {/* 左侧：内容类型筛选 */}
          <div className="flex flex-wrap gap-2">
            <span className="text-sm font-medium text-gray-700 flex items-center">
              内容类型:
            </span>
            <button className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-blue-100 text-blue-800 border border-blue-200">
              <span className="mr-1">📰</span>
              全部内容
            </button>
          </div>

          {/* 右侧：排序和视图控制 */}
          <div className="flex items-center space-x-4">
            {/* 排序选择 */}
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700">排序:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'latest' | 'popular' | 'trending')}
                className="text-sm border border-gray-300 rounded-md px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="latest">🕒 最新发布</option>
                <option value="popular">🔥 最受欢迎</option>
                <option value="trending">📈 趋势热门</option>
              </select>
            </div>

            {/* 视图模式切换 */}
            <div className="flex items-center space-x-1 bg-gray-100 rounded-md p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded text-sm transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                title="网格视图"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded text-sm transition-colors ${
                  viewMode === 'list'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                title="列表视图"
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
          {/* 按日期分组显示文章 */}
          <div className="space-y-10">
            {sortedDateKeys.map((dateKey, index) => (
              <div key={dateKey} className={`space-y-6 ${index > 0 ? 'pt-6 border-t border-gray-100' : ''}`}>
                {/* 日期标题 */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border-l-4 border-blue-500 p-6 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center justify-center w-12 h-12 bg-blue-500 rounded-full">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 mb-1">{dateKey}</h3>
                        <p className="text-sm text-blue-600 font-medium">共 {groupedArticles[dateKey].length} 篇文章</p>
                      </div>
                    </div>
                    <div className="hidden sm:flex items-center space-x-2 text-xs text-gray-500">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>按时间排序</span>
                    </div>
                  </div>
                </div>

                {/* 该日期下的文章列表 */}
                <div className={`${
                  viewMode === 'grid'
                    ? 'grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-6'
                    : 'space-y-3'
                } bg-gray-50 rounded-lg p-4`}>
                  {groupedArticles[dateKey].map((article) => (
                    <ArticleCard
                      key={article.id}
                      article={article}
                      layout={viewMode}
                      onClick={() => handleArticleClick(article.id)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* 自动加载状态指示器 */}
          {pagination.hasMore && (
            <div className="mt-8 text-center">
              {loadingMore ? (
                <div className="inline-flex items-center px-6 py-4 bg-white rounded-lg shadow-sm border border-gray-200">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="text-gray-600 font-medium">正在加载更多文章...</span>
                </div>
              ) : (
                <div className="inline-flex items-center px-6 py-4 bg-blue-50 rounded-lg border border-blue-200">
                  <svg className="w-5 h-5 text-blue-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                  <span className="text-blue-600 font-medium">滚动到底部自动加载更多</span>
                </div>
              )}
            </div>
          )}

          {/* 没有更多数据时的提示 */}
          {!pagination.hasMore && sortedArticles.length > 0 && (
            <div className="mt-8 text-center">
              <div className="inline-flex items-center px-6 py-4 bg-gray-50 rounded-lg border border-gray-200">
                <svg className="w-5 h-5 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-gray-500 font-medium">已加载全部文章</span>
              </div>
            </div>
          )}
        </>
      )}
    </main>
  );
}