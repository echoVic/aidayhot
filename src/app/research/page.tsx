'use client';

import { Suspense } from 'react';
import { ErrorBoundary } from '../../components/ErrorBoundary';
import Header from '../../components/Header';
import MobileNavigation from '../../components/MobileNavigation';
import ResearchContent from '../../components/ResearchContent';
import RightSidebar from '../../components/RightSidebar';
import Sidebar from '../../components/Sidebar';
import { StructuredData } from '../../components/StructuredData';

import { useState } from 'react';

export default function ResearchPage() {
  const [currentCategory, setCurrentCategory] = useState<string>('学术研究');
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
        type="website" 
        data={{
          breadcrumb: [
            { name: '首页', url: 'https://aidayhot.com' },
            { name: '学术研究', url: 'https://aidayhot.com/research' }
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
            <nav className="hidden lg:block" aria-label="研究分类导航">
              <Sidebar 
                selectedCategory={currentCategory}
                onCategoryChange={handleCategoryChange}
              />
            </nav>

            {/* 主内容区域 - 学术研究专用 */}
            <main id="main-content" className="flex-1">
              <Suspense fallback={<div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>}>
                <ResearchContent
                  searchQuery={searchQuery}
                />
              </Suspense>
            </main>

            {/* 右侧边栏 - 大屏幕显示 */}
            <aside className="hidden xl:block" aria-label="研究侧边栏">
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
