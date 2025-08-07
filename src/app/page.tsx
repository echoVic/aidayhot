'use client';

import { useState, useRef } from 'react';
import { ErrorBoundary } from '../components/ErrorBoundary';
import Header from '../components/Header';
import DailyReport from '../components/DailyReport';

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

        {/* 主要内容 - 只显示AI日报 */}
        <DailyReport ref={dailyReportRef} />
      </div>
    </ErrorBoundary>
  );
}
