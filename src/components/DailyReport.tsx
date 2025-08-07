'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo, forwardRef, useImperativeHandle } from 'react';
import { VariableSizeList, ListChildComponentProps } from 'react-window';
import ReactMarkdown from 'react-markdown';
import { supabase } from '@/lib/supabase';

// 类型定义
interface NewsItem {
  title: string;
  url: string;
  publishTime: string;
  aiSummary?: string;
  source: string;
}

interface DailyReportContent {
  articles: NewsItem[];
  metadata: {
    totalArticles: number;
    sources: string[];
  };
}

interface Report {
  id?: string;
  date: string;
  summary: string;
  content: DailyReportContent;
}

type ViewMode = 'timeline' | 'grid';
type QuickFilter = 'today' | 'week' | 'month' | 'all';

// 图标组件
const CalendarIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const HomeIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m0 0V11a1 1 0 011-1h2a1 1 0 011 1v10m0 0h3a1 1 0 001-1V10M9 21h6" />
  </svg>
);

const SearchIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const ClockIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const ExternalLinkIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
  </svg>
);

const ChevronDownIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

const ChevronRightIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);

const GridIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
  </svg>
);

const TimelineIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);

// React.memo 优化的日报卡片组件
interface DailyReportCardProps {
  report: Report;
  isExpanded: boolean;
  onToggleExpansion: (reportId: string) => void;
  formatDate: (dateString: string) => string;
  isMobile?: boolean;
}

const DailyReportCard = React.memo<DailyReportCardProps>(({ 
  report, 
  isExpanded, 
  onToggleExpansion, 
  formatDate,
  isMobile = false
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
      {/* 日报头部 - 可点击展开/收起 */}
      <div 
        className={`cursor-pointer select-none hover:bg-gray-50 transition-colors ${
          isMobile ? 'p-4' : 'p-6'
        }`}
        onClick={() => onToggleExpansion(report.date)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <CalendarIcon className="h-5 w-5 text-blue-600" />
              </div>
            </div>
            <div>
              <h2 className={`font-bold text-gray-900 ${
                isMobile ? 'text-lg' : 'text-xl'
              }`}>
                {formatDate(report.date)}
              </h2>
              <p className={`text-gray-500 mt-1 ${
                isMobile ? 'text-xs' : 'text-sm'
              }`}>
                基于 {report.content.metadata.totalArticles} 篇文章生成
              </p>
            </div>
          </div>
          
          {/* 展开/收起图标 */}
          <div className="flex-shrink-0">
            {isExpanded ? (
              <ChevronDownIcon className="h-6 w-6 text-gray-400" />
            ) : (
              <ChevronRightIcon className="h-6 w-6 text-gray-400" />
            )}
          </div>
        </div>
      </div>

      {/* 日报内容 - 可展开 */}
      {isExpanded && (
        <div className="border-t border-gray-100">
          {/* 日报总结 */}
          <div className="p-6 pb-4">
            <div className="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-400">
              <h3 className="text-lg font-semibold text-blue-800 mb-2 flex items-center gap-2">
                <span>📊</span>
                今日总结
              </h3>
              <div className="text-gray-700 leading-relaxed prose prose-sm max-w-none">
                <ReactMarkdown>{report.summary}</ReactMarkdown>
              </div>
            </div>
          </div>
          
          {/* 文章列表 */}
          <div className="px-6 pb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <span>📰</span>
              今日资讯
            </h3>
            <div className="space-y-4">
              {report.content.articles.map((article: NewsItem, articleIndex: number) => (
                <div key={articleIndex} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-xs font-medium text-blue-600">{articleIndex + 1}</span>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h4 className="text-base font-medium text-gray-900 mb-2 line-clamp-2">
                        <a 
                          href={article.url} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="hover:text-blue-600 transition-colors"
                        >
                          {article.title}
                        </a>
                      </h4>
                      
                      {article.aiSummary && (
                        <div className="text-sm text-gray-700 mb-3">
                          <div className="prose prose-sm max-w-none">
                            <ReactMarkdown>{article.aiSummary}</ReactMarkdown>
                          </div>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <ClockIcon className="h-3 w-3" />
                          {new Date(article.publishTime).toLocaleString('zh-CN')}
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                          {article.source}
                        </span>
                        <a 
                          href={article.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 transition-colors"
                        >
                          查看原文
                          <ExternalLinkIcon className="h-3 w-3" />
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* 数据来源信息 */}
          <div className="px-6 pb-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <span>📊</span>
                数据来源
              </h4>
              <div className="flex flex-wrap gap-2">
                {report.content.metadata.sources.map((source: string, sourceIndex: number) => (
                  <span key={sourceIndex} className="px-2 py-1 bg-white rounded text-xs text-gray-600 border">
                    {source}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* 底部信息 */}
      <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 rounded-b-lg">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>基于 {report.content.articles.length} 条资讯生成</span>
          <span>由 AI 自动生成和整理</span>
        </div>
      </div>
    </div>
  );
});

DailyReportCard.displayName = 'DailyReportCard';

// react-window 虚拟列表项组件
interface VirtualListItemProps extends ListChildComponentProps {
  data: {
    reports: Report[];
    expandedCards: Set<string>;
    toggleCardExpansion: (reportId: string) => void;
    formatDate: (dateString: string) => string;
    isMobile: boolean;
  };
}

const VirtualListItem: React.FC<VirtualListItemProps> = ({ index, style, data }) => {
  const { reports, expandedCards, toggleCardExpansion, formatDate, isMobile } = data;
  const report = reports[index];
  
  if (!report) return null;
  
  return (
    <div style={style} className="px-2 pb-4 sm:pb-6">
      <DailyReportCard
        report={report}
        isExpanded={expandedCards.has(report.date)}
        onToggleExpansion={toggleCardExpansion}
        formatDate={formatDate}
        isMobile={isMobile}
      />
    </div>
  );
};

VirtualListItem.displayName = 'VirtualListItem';

// 错误边界组件
interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class DailyReportErrorBoundary extends React.Component<
  React.PropsWithChildren, 
  ErrorBoundaryState
> {
  constructor(props: React.PropsWithChildren) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('DailyReport Error Boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-sm border p-6 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">⚠️</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">页面发生错误</h3>
            <p className="text-gray-600 mb-4">
              很抱歉，日报页面遇到了意外错误。请刷新页面重试。
            </p>
            <div className="space-y-3">
              <button
                onClick={() => window.location.reload()}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                刷新页面
              </button>
              {this.state.error && (
                <details className="text-left">
                  <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                    查看错误详情
                  </summary>
                  <div className="mt-2 p-3 bg-gray-50 rounded text-xs text-gray-600 overflow-auto max-h-32">
                    <pre>{this.state.error.toString()}</pre>
                  </div>
                </details>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

interface DailyReportRef {
  handleSearch: (query: string) => void;
  handleQuickFilter: (filter: string) => void;
  setViewMode: (mode: 'timeline' | 'grid') => void;
  scrollToToday: () => void;
}

const DailyReport = forwardRef<DailyReportRef>((props, ref) => {
  // 状态变量
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [quickFilter, setQuickFilter] = useState<QuickFilter>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('timeline');
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [currentPage, setCurrentPage] = useState<number>(0);

  const [cache, setCache] = useState<Map<string, Report[]>>(new Map());
  const [showScrollToTop, setShowScrollToTop] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  
  // react-window 虚拟滚动状态
  const [enableVirtualScroll, setEnableVirtualScroll] = useState<boolean>(false);
  const [listHeight, setListHeight] = useState<number>(600);
  const [itemHeights, setItemHeights] = useState<Map<number, number>>(new Map());
  
  // Refs
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const listRef = useRef<VariableSizeList | null>(null);
  
  // 常量
  const pageSize = 10;
  const ITEM_HEIGHT = isMobile ? 120 : 150; // 每个日报卡片的估计高度
  const VIRTUAL_SCROLL_THRESHOLD = 50; // 超过50条数据启用虚拟滚动
  const BUFFER_SIZE = 5; // 上下缓冲区大小
  
  // 移动端检测
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  // 触摸手势处理
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe || isRightSwipe) {
      // 左滑/右滑切换日期（移动端特有功能）
      const direction = isLeftSwipe ? 1 : -1;
      const currentDate = new Date();
      currentDate.setDate(currentDate.getDate() + direction);
      
      // 这里可以添加日期切换逻辑
      console.log(`滑动切换到: ${currentDate.toDateString()}`);
    }
  }, [touchStart, touchEnd]);

  // react-window 动态高度计算
  const getItemHeight = useCallback((index: number): number => {
    const report = reports[index];
    if (!report) return ITEM_HEIGHT;
    
    // 从缓存获取高度
    const cachedHeight = itemHeights.get(index);
    if (cachedHeight) return cachedHeight;
    
    // 根据展开状态计算高度
    const isExpanded = expandedCards.has(report.date);
    const baseHeight = ITEM_HEIGHT;
    const expandedHeight = baseHeight * 3; // 展开时高度增加3倍
    
    return isExpanded ? expandedHeight : baseHeight;
  }, [reports, expandedCards, itemHeights, ITEM_HEIGHT]);

  // 缓存项目高度
  const setItemHeight = useCallback((index: number, height: number) => {
    setItemHeights(prev => {
      const newMap = new Map(prev);
      newMap.set(index, height);
      return newMap;
    });
  }, []);

  // 容器高度计算
  const updateListHeight = useCallback(() => {
    if (scrollRef.current) {
      const height = scrollRef.current.clientHeight - 160; // 减去顶部导航高度
      setListHeight(Math.max(400, height));
    }
  }, []);

  // 滚动到顶部功能
  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // 卡片展开/收起切换
  const toggleCardExpansion = useCallback((reportId: string) => {
    setExpandedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(reportId)) {
        newSet.delete(reportId);
      } else {
        newSet.add(reportId);
      }
      return newSet;
    });
  }, []);

  // 获取日报数据（支持分页、搜索和缓存）
  const fetchReports = useCallback(async (page: number = 0, reset: boolean = false, filter?: QuickFilter, search?: string) => {
    try {
      // 生成缓存键
      const cacheKey = `${filter || 'all'}-${search || ''}-${page.toString()}`;
      
      // 检查缓存
      if (!reset && cache.has(cacheKey)) {
        const cachedReports = cache.get(cacheKey)!;
        setReports(prev => reset ? cachedReports : [...prev, ...cachedReports]);
        setHasMore(cachedReports.length === pageSize);
        setCurrentPage(page);
        return;
      }
      
      if (reset) {
        setLoading(true);
        setError(null);
      } else {
        setLoadingMore(true);
      }

      let query = supabase
        .from('daily_reports')
        .select('*')
        .order('date', { ascending: false });

      // 日期范围过滤
      if (filter && filter !== 'all') {
        const now = new Date();
        let startDate: Date;
        
        switch (filter) {
          case 'today':
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            break;
          case 'week':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case 'month':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            break;
          default:
            startDate = new Date(0);
        }
        
        query = query.gte('date', startDate.toISOString().split('T')[0]);
      }

      // 分页
      const from = page * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data, error } = await query;
      
      if (error) throw error;

      const newReports = data || [];
      
      // 搜索过滤（客户端）
      const filteredReports = search 
        ? newReports.filter(report => 
            report.summary.toLowerCase().includes(search.toLowerCase()) ||
            report.content.articles.some((article: NewsItem) => 
              article.title.toLowerCase().includes(search.toLowerCase()) ||
              (article.aiSummary && article.aiSummary.toLowerCase().includes(search.toLowerCase()))
            )
          )
        : newReports;

      // 更新缓存
      setCache(prev => {
        const newCache = new Map(prev);
        newCache.set(cacheKey, filteredReports);
        // 限制缓存大小，保留最近50个条目
        if (newCache.size > 50) {
          const firstKey = newCache.keys().next().value;
          if (firstKey) {
            newCache.delete(firstKey);
          }
        }
        return newCache;
      });

      if (reset) {
        setReports(filteredReports);
        setCurrentPage(0);
        // 设置默认展开所有日报
        setExpandedCards(new Set(filteredReports.map(report => report.date)));
      } else {
        setReports(prev => [...prev, ...filteredReports]);
        // 为新加载的日报也设置为展开状态
        setExpandedCards(prev => {
          const newSet = new Set(prev);
          filteredReports.forEach(report => newSet.add(report.date));
          return newSet;
        });
      }

      setHasMore(filteredReports.length === pageSize);
      setCurrentPage(page);

      
    } catch (err) {
      console.error('获取日报失败:', err);
      setError('获取日报数据失败');

    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [pageSize, cache]);

  // 加载更多数据
  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore) {
      fetchReports(currentPage + 1, false, quickFilter, searchQuery);
    }
  }, [fetchReports, loadingMore, hasMore, currentPage, quickFilter, searchQuery]);

  // 重置和刷新数据
  const refreshData = useCallback((filter?: QuickFilter, search?: string) => {
    setReports([]);
    setExpandedCards(new Set());
    fetchReports(0, true, filter || quickFilter, search || searchQuery);
  }, [fetchReports, quickFilter, searchQuery]);

  // 搜索处理
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    refreshData(quickFilter, query);
  }, [refreshData, quickFilter]);

  // 快速过滤处理
  const handleQuickFilter = useCallback((filter: QuickFilter) => {
    setQuickFilter(filter);
    refreshData(filter, searchQuery);
  }, [refreshData, searchQuery]);

  // 回到今天
  const scrollToToday = useCallback(() => {
    setQuickFilter('today');
    refreshData('today', searchQuery);
    scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [refreshData, searchQuery]);

  // 键盘导航
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return; // 忽略输入框中的按键
      
      switch (e.key) {
        case 'ArrowLeft':
        case 'ArrowUp':
          e.preventDefault();
          // 向上滚动一个日报的高度
          scrollRef.current?.scrollBy({ top: -400, behavior: 'smooth' });
          break;
        case 'ArrowRight':
        case 'ArrowDown':
          e.preventDefault();
          // 向下滚动一个日报的高度
          scrollRef.current?.scrollBy({ top: 400, behavior: 'smooth' });
          break;
        case 'Home':
          e.preventDefault();
          scrollToToday();
          break;
      }
    };
    
    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [scrollToToday]);

  // react-window 虚拟滚动自动启用逻辑
  useEffect(() => {
    const shouldEnableVirtualScroll = reports.length > VIRTUAL_SCROLL_THRESHOLD;
    setEnableVirtualScroll(shouldEnableVirtualScroll);
    
    // 更新容器高度
    updateListHeight();
  }, [reports.length, VIRTUAL_SCROLL_THRESHOLD, updateListHeight]);

  // 窗口尺寸变化监听
  useEffect(() => {
    updateListHeight();
    window.addEventListener('resize', updateListHeight);
    return () => window.removeEventListener('resize', updateListHeight);
  }, [updateListHeight]);

  // 滚动监听（显示/隐藏回到顶部按钮）
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      setShowScrollToTop(scrollTop > 400);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 无限滚动监听
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && hasMore && !loadingMore) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );
    
    observerRef.current = observer;
    
    return () => observer.disconnect();
  }, [loadMore, hasMore, loadingMore]);

  // 暴露方法给父组件
  useImperativeHandle(ref, () => ({
    handleSearch: (query: string) => {
      setSearchQuery(query);
      handleSearch(query);
    },
    handleQuickFilter: (filter: string) => {
      handleQuickFilter(filter as QuickFilter);
    },
    setViewMode: (mode: 'timeline' | 'grid') => {
      setViewMode(mode as ViewMode);
    },
    scrollToToday: () => {
      scrollToToday();
    }
  }), [handleSearch, handleQuickFilter, scrollToToday]);

  // 初始化数据加载
  useEffect(() => {
    fetchReports(0, true, 'all', '');
  }, [fetchReports]); // 使用固定参数避免依赖循环

  // 格式化日期显示
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    });
  };

  // 获取来源图标
  const getSourceIcon = (sourceName: string) => {
    const name = sourceName.toLowerCase();
    if (name.includes('arxiv')) return '📚';
    if (name.includes('github')) return '🐙';
    if (name.includes('rss')) return '📰';
    return '🔗';
  };

  return (
    <div className="bg-gray-50">
      {/* 主内容区域 - 支持触摸手势 */}
      <div 
        ref={scrollRef}
        className="max-w-6xl mx-auto px-2 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* 优化的加载状态 - 更真实的骨架屏 */}
        {loading && reports.length === 0 && (
          <div className="space-y-6 animate-fadeIn">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-300">
                {/* 骨架屏头部 */}
                <div className="p-6">
                  <div className="flex items-center gap-3 animate-pulse">
                    <div className="w-10 h-10 bg-blue-100 rounded-full animate-shimmer"></div>
                    <div className="space-y-2 flex-1">
                      <div className="h-6 bg-gradient-to-r from-gray-200 to-gray-300 rounded animate-shimmer" style={{width: `${60 + i * 10}%`}}></div>
                      <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded animate-shimmer" style={{width: `${40 + i * 5}%`}}></div>
                    </div>
                    <div className="w-6 h-6 bg-gray-200 rounded animate-shimmer"></div>
                  </div>
                </div>
                {/* 骨架屏底部 */}
                <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 rounded-b-lg animate-pulse">
                  <div className="flex justify-between items-center">
                    <div className="h-3 bg-gray-200 rounded animate-shimmer w-24"></div>
                    <div className="h-3 bg-gray-200 rounded animate-shimmer w-32"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 错误状态 */}
        {error && reports.length === 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <button 
              onClick={() => refreshData()}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              重新加载
            </button>
          </div>
        )}

        {/* 日报列表 - 支持虚拟滚动 */}
        {reports.length > 0 && (
          <div className={`reports-container ${
            viewMode === 'grid' 
              ? 'grid grid-cols-1 lg:grid-cols-2 gap-6' 
              : 'space-y-6'
          }`}>
            {enableVirtualScroll ? (
              /* react-window 虚拟列表渲染 */
              <div className="react-window-container">
                <VariableSizeList
                  ref={listRef}
                  height={listHeight}
                  width="100%"
                  itemCount={reports.length}
                  itemSize={getItemHeight}
                  itemData={{
                    reports,
                    expandedCards,
                    toggleCardExpansion,
                    formatDate,
                    isMobile
                  }}
                  overscanCount={5}
                  className="react-window-list"
                >
                  {VirtualListItem}
                </VariableSizeList>
                
                {/* react-window 虚拟滚动提示 */}
                <div className="virtual-scroll-indicator fixed bottom-4 left-4 bg-blue-600 text-white text-xs px-2 py-1 rounded shadow-lg z-30">
                  🚀 react-window: {reports.length} 条数据
                </div>
              </div>
            ) : (
              /* 常规渲染 */
              reports.map((report) => (
                <div
                  key={report.id}
                  className="daily-report-card bg-white rounded-lg shadow-sm"
                >
                  <DailyReportCard
                    report={report}
                    isExpanded={expandedCards.has(report.date)}
                    onToggleExpansion={toggleCardExpansion}
                    formatDate={formatDate}
                    isMobile={isMobile}
                  />
                </div>
              ))
            )}
          </div>
        )}

        {/* 无限滚动加载更多 */}
        {hasMore && (
          <div 
            ref={(el) => {
              if (el && observerRef.current) {
                observerRef.current.observe(el);
              }
            }}
            className="py-8 text-center"
          >
            {loadingMore ? (
              <div className="flex items-center justify-center gap-3">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                <span className="text-gray-600">加载中...</span>
              </div>
            ) : (
              <button 
                onClick={loadMore}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                加载更多
              </button>
            )}
          </div>
        )}
        
        {/* 没有更多数据提示 */}
        {!hasMore && reports.length > 0 && (
          <div className="text-center py-8 text-gray-500">
            <p>已加载全部日报 📖</p>
          </div>
        )}
        
        {/* 无数据状态 */}
        {!loading && !error && reports.length === 0 && (
          <div className="text-center py-12">
            <CalendarIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">暂无日报数据</h3>
            <p className="text-gray-500">请稍后再试或调整搜索条件</p>
          </div>
        )}
      </div>
      {/* 回到顶部按钮 */}
      {showScrollToTop && (
        <button
          onClick={() => scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-8 right-8 w-12 h-12 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-all duration-200 flex items-center justify-center z-40"
          aria-label="回到顶部"
        >
          <HomeIcon className="h-6 w-6" />
        </button>
      )}
    </div>
  );
});

DailyReport.displayName = 'DailyReport';

// 用错误边界包装的日报组件
const DailyReportWithErrorBoundary = forwardRef<DailyReportRef>((props, ref) => {
  return (
    <DailyReportErrorBoundary>
      <DailyReport ref={ref} />
    </DailyReportErrorBoundary>
  );
});

DailyReportWithErrorBoundary.displayName = 'DailyReportWithErrorBoundary';

export default DailyReportWithErrorBoundary;
