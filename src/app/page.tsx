'use client';

import { useState } from 'react';
import { ErrorBoundary } from '../components/ErrorBoundary';
import Header from '../components/Header';
import MainContent from '../components/MainContent';
import DailyReport from '../components/DailyReport';
import MobileNavigation from '../components/MobileNavigation';
import RightSidebar from '../components/RightSidebar';
import Sidebar from '../components/Sidebar';

export default function Home() {
  const [viewMode, setViewMode] = useState<'articles' | 'daily-report'>('daily-report'); // 默认显示日报
  const [currentCategory, setCurrentCategory] = useState<string>('全部');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const handleCategoryChange = (category: string) => {
    setCurrentCategory(category);
    setSearchQuery(''); // 清除搜索查询
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query) {
      setCurrentCategory(''); // 搜索时清除分类筛选
    }
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50">
        {/* 顶部导航 */}
        <Header onSearch={handleSearch} />

        {/* 视图模式切换 */}
        <div className="bg-white border-b border-gray-200 sticky top-16 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex space-x-8">
              <button
                onClick={() => setViewMode('daily-report')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  viewMode === 'daily-report'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                📊 AI日报
              </button>
              <button
                onClick={() => setViewMode('articles')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  viewMode === 'articles'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                📰 资讯列表
              </button>
            </div>
          </div>
        </div>

        {/* 主要布局 */}
        {viewMode === 'daily-report' ? (
          /* 日报模式 - 全宽布局 */
          <div className="min-h-screen bg-gray-50">
            <DailyReport />
          </div>
        ) : (
          /* 资讯列表模式 - 原有布局 */
          <div className="flex min-h-screen">
            {/* 左侧边栏 - 桌面端显示 */}
            <div className="hidden lg:block">
              <Sidebar 
                selectedCategory={currentCategory}
                onCategoryChange={handleCategoryChange}
              />
            </div>

            {/* 主内容区域 */}
            <MainContent
              category={currentCategory}
              searchQuery={searchQuery}
            />

            {/* 右侧边栏 - 大屏幕显示 */}
            <div className="hidden xl:block">
              <RightSidebar />
            </div>
          </div>
        )}

        {/* 移动端导航 - 只在资讯列表模式显示 */}
        {viewMode === 'articles' && (
          <MobileNavigation
            currentCategory={currentCategory}
            onCategoryChange={handleCategoryChange}
            onSearch={handleSearch}
          />
        )}
      </div>
    </ErrorBoundary>
  );
}
