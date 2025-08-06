'use client';

import { useState } from 'react';
import { ErrorBoundary } from '../components/ErrorBoundary';
import Header from '../components/Header';
import DailyReport from '../components/DailyReport';

export default function Home() {
  // 只保留日报模式，移除资讯列表
  const [searchQuery, setSearchQuery] = useState<string>('');

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50">
        {/* 顶部导航 */}
        <Header onSearch={handleSearch} />

        {/* 页面标题 - 只显示AI日报 */}
        <div className="bg-white border-b border-gray-200 sticky top-16 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="py-4">
              <h1 className="text-xl font-semibold text-gray-900">
                📊 AI日报
              </h1>
            </div>
          </div>
        </div>

        {/* 主要内容 - 只显示AI日报 */}
        <div className="min-h-screen bg-gray-50">
          <DailyReport />
        </div>
      </div>
    </ErrorBoundary>
  );
}
