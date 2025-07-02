'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import InfiniteScroll from 'react-infinite-scroll-component';
import { ArticleService, type PaginatedResult } from '../lib/database';
import type { Article } from '../lib/supabase';
import { DataLoadError } from './ErrorBoundary';
import GitHubCard from './GitHubCard';
import StackOverflowCard from './StackOverflowCard';
import TechFilter from './TechFilter';
import { showToast } from './ToastProvider';

interface TechContentProps {
  searchQuery?: string;
}

const PAGE_SIZE = 20;

export default function TechContent({ searchQuery }: TechContentProps) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    hasMore: true,
    total: 0
  });

  // 筛选状态
  const [selectedSourceTypes, setSelectedSourceTypes] = useState<string[]>(['github', 'stackoverflow']);
  const [selectedTechTags, setSelectedTechTags] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'latest' | 'popular' | 'trending'>('latest');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // 用于跟踪是否是初始加载
  const isInitialized = useRef(false);
  const isInitializing = useRef(false);

  // 加载技术动态数据
  const loadTechArticles = useCallback(async (page = 1, append = false, showToastMessage = false) => {
    try {
      console.log('📊 开始加载技术动态:', {
        page,
        append,
        currentArticlesLength: articles.length,
        selectedSourceTypes,
        selectedTechTags,
        sortBy,
        searchQuery
      });

      if (page === 1) {
        setLoading(true);
        setError(null);
      } else {
        setLoadingMore(true);
      }

      let result: PaginatedResult<Article>;

      if (searchQuery) {
        // 搜索技术相关文章
        result = await ArticleService.searchBySourceTypes(
          searchQuery,
          selectedSourceTypes,
          page,
          PAGE_SIZE,
          selectedTechTags
        );
      } else {
        // 按源类型获取文章
        result = await ArticleService.getBySourceTypes(
          selectedSourceTypes,  
          page,
          PAGE_SIZE,
          sortBy,
          selectedTechTags
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
        const newArticles = result.data;
        
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

        if (showToastMessage && page === 1 && newArticles.length > 0) {
          // 暂时注释掉，避免双重显示
          console.log('📢 本来要显示 toast:', `加载了 ${newArticles.length} 篇技术动态`);
          // showToast.success(`加载了 ${newArticles.length} 篇技术动态`, '数据更新');
        }
      } else {
        throw new Error('获取数据失败');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '加载失败';
      console.error('加载技术动态失败:', err);
      setError(errorMessage);
      
      if (showToastMessage) {
        showToast.error(errorMessage, '加载失败');
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [searchQuery, selectedSourceTypes, selectedTechTags, sortBy]);

  // 初始加载
  useEffect(() => {
    // 防止重复初始化
    if (isInitializing.current) {
      console.log('⚠️ 已在初始化中，跳过重复初始化');
      return;
    }
    
    console.log('🔄 组件初始化，开始首次加载');
    isInitializing.current = true;
    isInitialized.current = true;
    
    const initializeData = async () => {
      await loadTechArticles(1, false, false);
      isInitializing.current = false;
    };
    
    initializeData();
  }, []); // 空依赖数组，只在组件挂载时执行一次

  // 筛选条件变化时重新加载
  useEffect(() => {
    // 只有在初始化完成且不在初始化过程中才响应筛选条件变化
    if (isInitialized.current && !isInitializing.current) {
      console.log('🔧 筛选条件发生变化，重置并重新加载数据');
      // 重置分页状态
      setPagination({ page: 1, hasMore: true, total: 0 });
      setArticles([]);
      // 直接调用加载函数，不依赖 loadTechArticles
      const loadFilteredData = async () => {
        try {
          setLoading(true);
          setError(null);

          let result: PaginatedResult<Article>;
          if (searchQuery) {
            result = await ArticleService.searchBySourceTypes(
              searchQuery,
              selectedSourceTypes,
              1,
              PAGE_SIZE,
              selectedTechTags
            );
          } else {
            result = await ArticleService.getBySourceTypes(
              selectedSourceTypes,  
              1,
              PAGE_SIZE,
              sortBy,
              selectedTechTags
            );
          }

          if (result.data) {
            setArticles(result.data);
            setPagination({
              page: result.page,
              hasMore: result.hasMore,
              total: result.total
            });
            // 移除这里的 toast，因为这是自动触发的筛选，不需要提示用户
            // showToast.success(`加载了 ${result.data.length} 篇技术动态`, '数据更新');
          }
        } catch (err) {
          console.error('加载筛选数据失败:', err);
          setError(err instanceof Error ? err.message : '加载失败');
        } finally {
          setLoading(false);
        }
      };

      loadFilteredData();
    } else {
      console.log('⏸️ 跳过筛选条件变化处理 (初始化中或未初始化)');
    }
  }, [selectedSourceTypes, selectedTechTags, sortBy, searchQuery]); // 移除 loadTechArticles 依赖

  // 加载更多
  const loadMore = useCallback(() => {
    console.log('🔄 loadMore 被调用:', {
      loading,
      loadingMore,
      hasMore: pagination.hasMore,
      currentPage: pagination.page,
      articlesLength: articles.length,
      total: pagination.total
    });

    if (!loading && !loadingMore && pagination.hasMore) {
      console.log('✅ 开始加载下一页:', pagination.page + 1);
      loadTechArticles(pagination.page + 1, true, false);
    } else {
      console.log('❌ 无法加载更多:', {
        loading,
        loadingMore,
        hasMore: pagination.hasMore
      });
    }
  }, [loadTechArticles, loading, loadingMore, pagination.hasMore, pagination.page]);

  // 实时订阅技术动态变化 - 暂时禁用以修复分页问题
  useEffect(() => {
    // 暂时禁用实时订阅，因为它会干扰无限滚动分页
    console.log('⚠️ 实时订阅已暂时禁用以修复分页问题');
    return () => {
      // 空的清理函数
    };

    /* 原实时订阅代码 - 暂时注释
    let lastUpdateTime = 0;
    const UPDATE_THROTTLE = 30000; // 30秒内最多显示一次toast

    const subscription = RealtimeService.subscribeToArticles((payload) => {
      console.log('📡 技术动态数据变化:', payload);

      // 如果正在加载，跳过实时更新以避免干扰分页
      if (loading || loadingMore) {
        console.log('⏳ 正在加载中，跳过实时更新');
        return;
      }

      const now = Date.now();
      const shouldShowToast = now - lastUpdateTime > UPDATE_THROTTLE;

      if (shouldShowToast) {
        showToast.info('检测到新的技术动态', '数据更新');
        lastUpdateTime = now;
      }

      // 只在第一页时才进行实时更新
      if (pagination.page === 1) {
        console.log('🔄 执行实时数据更新 (仅第一页)');
        loadTechArticles(1, false, false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
    */
  }, []);

  // 重置并重新加载
  const resetAndReload = useCallback(() => {
    console.log('🔄 重置并重新加载数据');
    setPagination({ page: 1, hasMore: true, total: 0 });
    setArticles([]);
    loadTechArticles(1, false, false); // 不显示 toast
  }, [loadTechArticles]);

  // 处理文章点击（增加浏览量）
  const handleArticleClick = useCallback(async (articleId: string) => {
    try {
      await ArticleService.incrementViews(articleId);
      setArticles(prev => prev.map(article =>
        article.id === articleId
          ? { ...article, views: article.views + 1 }
          : article
      ));
    } catch (err) {
      console.error('更新浏览量失败:', err);
      // 移除浏览量更新失败的toast，因为这是后台操作，不需要打扰用户
    }
  }, []);

  // 按日期分组文章
  const groupedArticles = articles.reduce((groups, article) => {
    const date = new Date(article.publish_time || article.created_at || new Date()).toLocaleDateString('zh-CN');
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(article);
    return groups;
  }, {} as Record<string, Article[]>);

  if (error && articles.length === 0) {
    return (
      <main className="flex-1 bg-gray-50 p-6">
        <DataLoadError onRetry={resetAndReload} />
      </main>
    );
  }

  return (
    <main className="flex-1 bg-gray-50 p-4 sm:p-6">
      {/* 页面标题和筛选器 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 space-y-2 sm:space-y-0">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">技术动态</h1>
            <p className="text-gray-600 mt-1 text-sm sm:text-base">
              {searchQuery ? `搜索结果: "${searchQuery}"` : '最新的开源项目、技术问答和开发趋势'}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-xs sm:text-sm text-gray-500">
              共 {pagination.total} 篇 {pagination.total > 0 && `(显示 ${articles.length} 篇)`}
            </span>
          </div>
        </div>

        {/* 调试信息 - 开发环境显示 */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md text-xs">
            <strong>调试信息:</strong> 
            页面: {pagination.page} | 
            总数: {pagination.total} | 
            已显示: {articles.length} | 
            还有更多: {pagination.hasMore ? '是' : '否'} | 
            加载中: {loading ? '是' : '否'} | 
            加载更多中: {loadingMore ? '是' : '否'}
          </div>
        )}

        {/* 筛选器组件 */}
        <TechFilter
          selectedSourceTypes={selectedSourceTypes}
          onSourceTypesChange={setSelectedSourceTypes}
          selectedTechTags={selectedTechTags}
          onTechTagsChange={setSelectedTechTags}
          sortBy={sortBy}
          onSortChange={setSortBy}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />
      </div>

      {/* 内容区域 */}
      {loading && articles.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">正在加载技术动态...</p>
        </div>
      ) : articles.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchQuery ? '没有找到相关技术动态' : '暂无技术动态'}
          </h3>
          <p className="text-gray-500">
            {searchQuery ? '请尝试其他关键词或调整筛选条件' : '数据正在收集中，请稍后刷新页面'}
          </p>
        </div>
      ) : (
        <InfiniteScroll
          dataLength={articles.length}
          next={loadMore}
          hasMore={pagination.hasMore}
          loader={
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-gray-500">正在加载更多...</p>
            </div>
          }
          endMessage={
            <div className="text-center py-8">
              <p className="text-gray-500">🎉 已显示全部内容</p>
            </div>
          }
          scrollThreshold={0.95}
          style={{ overflow: 'visible' }}
        >
          {/* 按日期分组显示文章 */}
          {Object.entries(groupedArticles).map(([date, dateArticles]) => (
            <div key={date} className="mb-8">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                  {date}
                </span>
                <span className="ml-3 text-sm text-gray-500">
                  {dateArticles.length} 篇
                </span>
              </h3>

              <div className={`grid gap-4 sm:gap-6 ${
                viewMode === 'grid'
                  ? 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3'
                  : 'grid-cols-1'
              }`}>
                {dateArticles.map((article, index) => {
                  // 使用 source_type、id 和索引组合确保 key 的唯一性
                  const uniqueKey = `${article.source_type}_${article.id || 'unknown'}_${index}`;

                  if (article.source_type === 'github') {
                    return (
                      <GitHubCard
                        key={uniqueKey}
                        article={article}
                        layout={viewMode}
                        onClick={() => handleArticleClick(article.id)}
                      />
                    );
                  } else if (article.source_type === 'stackoverflow') {
                    return (
                      <StackOverflowCard
                        key={uniqueKey}
                        article={article}
                        layout={viewMode}
                        onClick={() => handleArticleClick(article.id)}
                      />
                    );
                  }
                  return null;
                })}
              </div>
            </div>
          ))}
        </InfiniteScroll>
      )}
    </main>
  );
}
