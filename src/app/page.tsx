'use client';

import { Suspense, useRef, useState } from 'react';
import DailyReport from '../components/DailyReport';
import { ErrorBoundary } from '../components/ErrorBoundary';
import Header from '../components/Header';
import { StructuredData } from '../components/StructuredData';
import SubscriptionSidebar from '../components/SubscriptionSidebar';


// DailyReport组件的ref接口
interface DailyReportRef {
  handleSearch: (query: string) => void;
  handleQuickFilter: (filter: string) => void;
  setViewMode: (mode: 'timeline' | 'grid') => void;
  scrollToToday: () => void;
}

export default function Home() {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentFilter, setCurrentFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'timeline' | 'grid'>('timeline');
  const dailyReportRef = useRef<DailyReportRef>(null);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    // 触发DailyReport组件的搜索
    if (dailyReportRef.current?.handleSearch) {
      dailyReportRef.current.handleSearch(query);
    }
  };

  const handleFilterChange = (filter: string) => {
    setCurrentFilter(filter);
    // 触发DailyReport组件的过滤
    if (dailyReportRef.current?.handleQuickFilter) {
      dailyReportRef.current.handleQuickFilter(filter);
    }
  };

  const handleViewModeToggle = () => {
    const newMode = viewMode === 'timeline' ? 'grid' : 'timeline';
    setViewMode(newMode);
    // 触发DailyReport组件的视图切换
    if (dailyReportRef.current?.setViewMode) {
      dailyReportRef.current.setViewMode(newMode);
    }
  };

  const handleBackToToday = () => {
    // 触发DailyReport组件回到今天
    if (dailyReportRef.current?.scrollToToday) {
      dailyReportRef.current.scrollToToday();
    }
  };

  return (
    <>
      <StructuredData 
        type="website" 
        data={{}}
      />
      <StructuredData 
        type="organization" 
        data={{}}
      />
      
      <ErrorBoundary>
        <div className="min-h-screen bg-gray-50">
          {/* 顶部导航 - 集成所有工具 */}
          <Header 
            onSearch={handleSearch}
            onFilterChange={handleFilterChange}
            onViewModeToggle={handleViewModeToggle}
            onBackToToday={handleBackToToday}
            currentFilter={currentFilter}
            viewMode={viewMode}
          />

          {/* 主要内容区域 */}
          <div className="flex">
            {/* AI日报主内容 */}
            <main id="main-content" className="flex-1">
              <Suspense fallback={<div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>}>
                <DailyReport ref={dailyReportRef} />
              </Suspense>
            </main>
            
            {/* 订阅侧边栏 */}
            <aside className="hidden lg:block w-80">
              <SubscriptionSidebar />
            </aside>
          </div>
        </div>
      </ErrorBoundary>
    </>
  );
}
