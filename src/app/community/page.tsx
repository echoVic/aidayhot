'use client';

import { useState } from 'react';
import CommunityContent from '../../components/CommunityContent';
import { ErrorBoundary } from '../../components/ErrorBoundary';
import Header from '../../components/Header';
import MobileNavigation from '../../components/MobileNavigation';
import RightSidebar from '../../components/RightSidebar';
import Sidebar from '../../components/Sidebar';

export default function CommunityPage() {
  const [currentCategory, setCurrentCategory] = useState<string>('社区动态');
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

        {/* 主要布局 */}
        <div className="flex">
          {/* 左侧边栏 - 桌面端显示 */}
          <div className="hidden lg:block">
            <Sidebar 
              selectedCategory={currentCategory}
              onCategoryChange={handleCategoryChange}
            />
          </div>

          {/* 主内容区域 - 社区动态专用 */}
          <ErrorBoundary>
            <CommunityContent
              searchQuery={searchQuery}
            />
          </ErrorBoundary>

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
