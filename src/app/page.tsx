'use client';

import { useState } from 'react';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import MainContent from '../components/MainContent';
import RightSidebar from '../components/RightSidebar';
import MobileNavigation from '../components/MobileNavigation';
import { ErrorBoundary } from '../components/ErrorBoundary';

export default function Home() {
  const [currentCategory, setCurrentCategory] = useState<string>('全部');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const handleCategoryChange = (category: string) => {
    setCurrentCategory(category);
    setSearchQuery(''); // 清除搜索查询
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentCategory(''); // 清除分类筛选
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50">
        {/* 顶部导航 */}
        <Header onSearch={handleSearch} />

        {/* 主要布局 */}
        <div className="flex">
          {/* 左侧边栏 - 桌面端显示 */}
          <div className="hidden lg:block">
            <Sidebar />
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

        {/* 移动端导航 */}
        <MobileNavigation
          currentCategory={currentCategory}
          onCategoryChange={handleCategoryChange}
          onSearch={handleSearch}
        />
      </div>
    </ErrorBoundary>
  );
}
