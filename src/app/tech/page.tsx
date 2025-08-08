'use client';

import { Suspense, useState } from 'react';
import { ErrorBoundary } from '../../components/ErrorBoundary';
import Header from '../../components/Header';
import MobileNavigation from '../../components/MobileNavigation';
import RightSidebar from '../../components/RightSidebar';
import Sidebar from '../../components/Sidebar';
import { StructuredData } from '../../components/StructuredData';
import TechContent from '../../components/TechContent';

export default function TechPage() {
  const [currentCategory, setCurrentCategory] = useState<string>('技术动态');
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
    <>
      <StructuredData 
        type="breadcrumb" 
        data={{
          items: [
            { name: '首页', url: 'https://aidayhot.com' },
            { name: '技术动态', url: 'https://aidayhot.com/tech' }
          ]
        }}
      />
      
      <ErrorBoundary>
        <div className="min-h-screen bg-gray-50">
          {/* 顶部导航 */}
          <Header onSearch={handleSearch} />

          {/* 主要布局 */}
          <div className="flex">
            {/* 左侧边栏 - 桌面端显示 */}
            <nav className="hidden lg:block" aria-label="技术分类导航">
              <Sidebar 
                selectedCategory={currentCategory}
                onCategoryChange={handleCategoryChange}
              />
            </nav>

            {/* 主内容区域 - 技术动态专用 */}
            <main id="main-content" className="flex-1 overflow-y-auto">
              <Suspense fallback={<div>加载中...</div>}>
                <TechContent searchQuery={searchQuery} />
              </Suspense>
            </main>

            {/* 右侧边栏 - 大屏幕显示 */}
            <aside className="hidden xl:block">
              <RightSidebar />
            </aside>
          </div>

          {/* 移动端导航 */}
          <MobileNavigation
            currentCategory={currentCategory}
            onCategoryChange={handleCategoryChange}
            onSearch={handleSearch}
          />
        </div>
      </ErrorBoundary>
    </>
  );
}