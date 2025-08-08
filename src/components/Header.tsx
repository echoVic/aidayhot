'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Search, LayoutGrid, List, CalendarDays, Rss } from 'lucide-react';

interface HeaderProps {
  onSearch?: (query: string) => void;
  onFilterChange?: (filter: string) => void;
  onViewModeToggle?: () => void;
  onBackToToday?: () => void;
  currentFilter?: string;
  viewMode?: 'timeline' | 'grid';
}

export default function Header({ 
  onSearch, 
  onFilterChange, 
  onViewModeToggle, 
  onBackToToday, 
  currentFilter = 'all', 
  viewMode = 'timeline' 
}: HeaderProps) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = () => {
    if (onSearch && searchQuery.trim()) {
      onSearch(searchQuery.trim());
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <a href="#main-content" className="skip-link">跳到主内容</a>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo和标题 */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2" aria-label="AI每日热点首页">
              <span className="text-xl font-bold text-gray-900" aria-hidden="true">📊</span>
              <span className="text-xl font-bold text-gray-900">AI日报</span>
            </Link>
          </div>

          {/* 简化导航 - 只保留AI日报 */}
          <nav className="hidden md:flex items-center space-x-8">
            {/* 已在Logo中显示，不需要重复 */}
          </nav>

          {/* 工具栏：搜索 + 过滤 + 视图切换 */}
          <div className="flex items-center space-x-3">
            {/* 快速过滤按钮 */}
            <div className="hidden lg:flex items-center space-x-2">
              {['today', 'week', 'month', 'all'].map((filter) => (
                <button
                  key={filter}
                  onClick={() => onFilterChange?.(filter)}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    currentFilter === filter
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {filter === 'today' ? '今天' : 
                   filter === 'week' ? '本周' : 
                   filter === 'month' ? '本月' : '全部'}
                </button>
              ))}
            </div>

            {/* 搜索框 */}
            <div className="relative">
              <input
                type="text"
                placeholder="搜索日报..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                className="w-48 pl-10 pr-4 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm hidden md:block"
                aria-label="搜索AI资讯"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none hidden md:flex">
                <Search className="h-4 w-4 text-gray-400" aria-hidden="true" />
              </div>
            </div>

            {/* 视图切换和回到今天按钮 */}
            <div className="hidden md:flex items-center space-x-2">
              <button
                onClick={onViewModeToggle}
                className="p-2 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                title={viewMode === 'timeline' ? '切换到网格视图' : '切换到时间线视图'}
              >
                {viewMode === 'timeline' ? (
                  <LayoutGrid className="h-4 w-4" />
                ) : (
                  <List className="h-4 w-4" />
                )}
              </button>
              
              <button
                onClick={onBackToToday}
                className="p-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-md transition-colors"
                title="回到今天"
              >
                <CalendarDays className="h-4 w-4" />
              </button>

              {/* RSS 订阅按钮 */}
              <a
                href="/rss.xml"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-orange-100 hover:bg-orange-200 text-orange-700 rounded-md transition-colors"
                title="订阅 RSS - AI 每日日报"
              >
                <Rss className="h-4 w-4" />
              </a>
            </div>

            {/* 移动端搜索按钮 */}
            <button 
              className="md:hidden p-2 rounded-md text-gray-700 hover:text-blue-600"
              onClick={() => setIsSearchOpen(!isSearchOpen)}
            >
              <Search className="h-6 w-6" />
            </button>

            {/* 移动端不需要重复显示，已在Logo中显示 */}
          </div>
        </div>

        {/* 移动端搜索框 */}
        {isSearchOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            <div className="relative">
              <input
                type="text"
                placeholder="搜索AI资讯..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                className="w-full pl-10 pr-12 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                autoFocus
                aria-label="搜索AI资讯"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" aria-hidden="true" />
              </div>
              {searchQuery && (
                <button
                  onClick={handleSearch}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-blue-500 hover:text-blue-600"
                >
                  <Search className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}