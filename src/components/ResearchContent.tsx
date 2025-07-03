'use client';

import { useMemoizedFn } from 'ahooks';
import { useEffect, useRef, useState } from 'react';
import InfiniteScroll from 'react-infinite-scroll-component';
import { ArticleService, type PaginatedResult } from '../lib/database';
import type { Article } from '../lib/supabase';
import ArxivCard from './ArxivCard';
import PaperCard from './PaperCard';
import ResearchFilter from './ResearchFilter';
import { showToast } from './ToastProvider';

interface ResearchContentProps {
  searchQuery?: string;
}

export default function ResearchContent({ searchQuery }: ResearchContentProps) {
  // 状态管理
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
  const [selectedSourceTypes, setSelectedSourceTypes] = useState<string[]>(['arxiv', 'paper']);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'latest' | 'popular' | 'trending'>('latest');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // 常量
  const PAGE_SIZE = 20;

  // 用于跟踪是否是初始加载
  const isInitialized = useRef(false);
  const isInitializing = useRef(false);

  // 生成演示数据
  const generateDemoData = (): Article[] => {
    const demoArticles: Article[] = [
      {
        id: 'demo-arxiv-1',
        title: 'Attention Is All You Need: A Comprehensive Survey of Transformer Architectures',
        summary: 'This paper presents a comprehensive survey of Transformer architectures and their applications in natural language processing. We analyze the attention mechanism and its variants, providing insights into the design choices that make Transformers effective for various tasks.',
        author: 'Ashish Vaswani, Noam Shazeer, Niki Parmar, Jakob Uszkoreit',
        publish_time: new Date().toISOString(),
        source_url: 'https://arxiv.org/abs/1706.03762',
        source_type: 'arxiv',
        category: '人工智能',
        tags: ['cs.AI', 'cs.LG', 'transformer', 'attention'],
        is_new: true,
        is_hot: true,
        views: 1250,
        likes: 89,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        metadata: {},
        read_time: '5 分钟',
        image_url: ''
      },
      {
        id: 'demo-paper-1',
        title: 'BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding',
        summary: 'We introduce a new language representation model called BERT, which stands for Bidirectional Encoder Representations from Transformers. Unlike recent language representation models, BERT is designed to pre-train deep bidirectional representations.',
        author: 'Jacob Devlin, Ming-Wei Chang, Kenton Lee, Kristina Toutanova',
        publish_time: new Date(Date.now() - 86400000).toISOString(),
        source_url: 'https://paperswithcode.com/paper/bert-pre-training-of-deep-bidirectional',
        source_type: 'paper',
        category: '自然语言处理',
        tags: ['cs.CL', 'bert', 'nlp', 'pre-training'],
        is_new: false,
        is_hot: true,
        views: 2340,
        likes: 156,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        metadata: { venue: 'NAACL 2019' },
        read_time: '8 分钟',
        image_url: ''
      },
      {
        id: 'demo-arxiv-2',
        title: 'GPT-4 Technical Report',
        summary: 'We report the development of GPT-4, a large-scale, multimodal model which can accept image and text inputs and produce text outputs. While less capable than humans in many real-world scenarios, GPT-4 exhibits human-level performance on various professional and academic benchmarks.',
        author: 'OpenAI',
        publish_time: new Date(Date.now() - 172800000).toISOString(),
        source_url: 'https://arxiv.org/abs/2303.08774',
        source_type: 'arxiv',
        category: '人工智能',
        tags: ['cs.AI', 'cs.CL', 'gpt-4', 'multimodal'],
        is_new: false,
        is_hot: true,
        views: 5670,
        likes: 423,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        metadata: {},
        read_time: '12 分钟',
        image_url: ''
      }
    ];
    return demoArticles;
  };

  // 加载学术研究数据
  const loadResearchArticles = useMemoizedFn(async (page = 1, append = false, showToastMessage = false) => {
    try {
      console.log('📚 开始加载学术研究:', {
        page,
        append,
        currentArticlesLength: articles.length,
        selectedSourceTypes,
        selectedCategories,
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

      try {
        if (searchQuery) {
          // 搜索学术相关文章
          result = await ArticleService.searchBySourceTypes(
            searchQuery,
            selectedSourceTypes,
            page,
            PAGE_SIZE,
            selectedCategories
          );
        } else {
          // 按源类型获取文章
          result = await ArticleService.getBySourceTypes(
            selectedSourceTypes,
            page,
            PAGE_SIZE,
            sortBy,
            selectedCategories
          );
        }
      } catch (dbError) {
        console.warn('数据库查询失败，使用演示数据:', dbError);
        // 如果数据库查询失败，使用演示数据
        const demoData = generateDemoData();
        result = {
          data: demoData,
          total: demoData.length,
          hasMore: false,
          page: 1,
          pageSize: PAGE_SIZE
        };
      }

      if (result.data) {
        if (append) {
          setArticles(prev => [...prev, ...result.data]);
        } else {
          setArticles(result.data);
        }

        setPagination({
          page: result.page,
          hasMore: result.hasMore,
          total: result.total
        });

        if (showToastMessage && result.data.length > 0) {
          showToast.success(`加载了 ${result.data.length} 篇学术文章`, '数据更新');
        }
      }
    } catch (err) {
      console.error('加载学术研究数据失败:', err);
      const errorMessage = err instanceof Error ? err.message : '加载失败';
      setError(errorMessage);
      showToast.error(errorMessage, '加载失败');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  });

  // 加载更多数据
  const loadMore = useMemoizedFn(() => {
    if (!loadingMore && pagination.hasMore) {
      loadResearchArticles(pagination.page + 1, true);
    }
  });

  // 初始化数据加载
  useEffect(() => {
    if (!isInitialized.current && !isInitializing.current) {
      isInitializing.current = true;
      console.log('🚀 ResearchContent 初始化加载');
      
      loadResearchArticles(1, false, false).finally(() => {
        isInitialized.current = true;
        isInitializing.current = false;
      });
    }
  }, [loadResearchArticles]);

  // 筛选条件变化时重新加载
  useEffect(() => {
    // 只有在初始化完成且不在初始化过程中才响应筛选条件变化
    if (isInitialized.current && !isInitializing.current) {
      console.log('🔬 筛选条件发生变化，重置并重新加载数据');
      // 重置分页状态
      setPagination({ page: 1, hasMore: true, total: 0 });
      setArticles([]);
      // 直接调用加载函数
      const loadFilteredData = async () => {
        try {
          setLoading(true);
          setError(null);

          let result: PaginatedResult<Article>;
          try {
            if (searchQuery) {
              result = await ArticleService.searchBySourceTypes(
                searchQuery,
                selectedSourceTypes,
                1,
                PAGE_SIZE,
                selectedCategories
              );
            } else {
              result = await ArticleService.getBySourceTypes(
                selectedSourceTypes,
                1,
                PAGE_SIZE,
                sortBy,
                selectedCategories
              );
            }
          } catch (dbError) {
            console.warn('数据库查询失败，使用演示数据:', dbError);
            // 如果数据库查询失败，使用演示数据
            const demoData = generateDemoData();
            result = {
              data: demoData,
              total: demoData.length,
              hasMore: false,
              page: 1,
              pageSize: PAGE_SIZE
            };
          }

          if (result.data) {
            setArticles(result.data);
            setPagination({
              page: result.page,
              hasMore: result.hasMore,
              total: result.total
            });
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
  }, [selectedSourceTypes, selectedCategories, sortBy, searchQuery]);

  // 处理文章点击
  const handleArticleClick = (articleId: string) => {
    console.log('点击文章:', articleId);
    // 这里可以添加文章点击的统计逻辑
  };

  // 按日期分组文章
  const groupedArticles = articles.reduce((groups, article) => {
    const date = new Date(article.publish_time).toLocaleDateString('zh-CN');
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(article);
    return groups;
  }, {} as Record<string, Article[]>);

  if (error) {
    return (
      <main className="flex-1 bg-gray-50 p-4 sm:p-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">加载失败</h3>
          <p className="text-gray-500 mb-4">{error}</p>
          <button
            onClick={() => loadResearchArticles(1, false, true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            重试
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 bg-gray-50 p-4 sm:p-6">
      {/* 页面标题和筛选器 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 space-y-2 sm:space-y-0">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">学术研究</h1>
            <p className="text-gray-600 mt-1 text-sm sm:text-base">
              {searchQuery ? `搜索结果: "${searchQuery}"` : '最新的学术论文、研究成果和科研动态'}
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
        <ResearchFilter
          selectedSourceTypes={selectedSourceTypes}
          onSourceTypesChange={setSelectedSourceTypes}
          selectedCategories={selectedCategories}
          onCategoriesChange={setSelectedCategories}
          sortBy={sortBy}
          onSortChange={setSortBy}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />
      </div>

      {/* 加载状态 */}
      {loading && articles.length === 0 ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">正在加载学术研究内容...</p>
        </div>
      ) : articles.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchQuery ? '没有找到相关学术文章' : '暂无学术研究内容'}
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

                  if (article.source_type === 'arxiv') {
                    return (
                      <ArxivCard
                        key={uniqueKey}
                        article={article}
                        layout={viewMode}
                        onClick={() => handleArticleClick(article.id)}
                      />
                    );
                  } else if (article.source_type === 'paper') {
                    return (
                      <PaperCard
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
