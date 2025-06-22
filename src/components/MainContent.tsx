'use client';

import { useState } from 'react';
import ArticleCard from './ArticleCard';
import { mockArticles } from '../data/mockData';

interface MainContentProps {
  searchQuery?: string;
  category?: string;
}

export default function MainContent({ searchQuery, category }: MainContentProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'latest' | 'popular' | 'trending'>('latest');

  // 过滤和排序文章
  const filteredArticles = mockArticles.filter(article => {
    if (category && category !== '全部') {
      return article.category === category;
    }
    if (searchQuery) {
      return article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
             article.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
             article.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    return true;
  });

  const sortedArticles = [...filteredArticles].sort((a, b) => {
    switch (sortBy) {
      case 'popular':
        return b.views - a.views;
      case 'trending':
        return b.likes - a.likes;
      case 'latest':
      default:
        return new Date(b.publishTime).getTime() - new Date(a.publishTime).getTime();
    }
  });

  return (
    <main className="flex-1 bg-gray-50 p-6">
      {/* 工具栏 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h2 className="text-lg font-semibold text-gray-900">
              {category ? `${category} 相关文章` : searchQuery ? `搜索结果: "${searchQuery}"` : 'AI每日热点'}
            </h2>
            <span className="text-sm text-gray-500">
              共 {sortedArticles.length} 篇文章
            </span>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* 排序选择 */}
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">排序:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'latest' | 'popular' | 'trending')}
                className="text-sm border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="latest">最新发布</option>
                <option value="popular">热门阅读</option>
                <option value="trending">热门点赞</option>
              </select>
            </div>

            {/* 视图模式切换 */}
            <div className="flex items-center border border-gray-300 rounded-lg">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-l-lg transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-blue-500 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-r-lg transition-colors ${
                  viewMode === 'list'
                    ? 'bg-blue-500 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 热门推荐横幅 */}
      {!searchQuery && !category && (
        <div className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-lg p-6 mb-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold mb-2">🔥 今日热门推荐</h3>
              <p className="text-blue-100 mb-4">
                精选最新AI资讯，助您把握行业动态
              </p>
              <div className="flex flex-wrap gap-2">
                {['ChatGPT', 'Stable Diffusion', 'AI芯片', '自动驾驶'].map((tag) => (
                  <span
                    key={tag}
                    className="bg-white/20 text-white px-3 py-1 rounded-full text-sm cursor-pointer hover:bg-white/30 transition-colors"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
            <div className="hidden md:block">
              <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center">
                <span className="text-3xl">🚀</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 文章列表 */}
      {sortedArticles.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">暂无相关文章</h3>
          <p className="text-gray-500">
            {searchQuery ? '尝试使用其他关键词搜索' : '该分类下暂无文章内容'}
          </p>
        </div>
      ) : (
        <div
          className={
            viewMode === 'grid'
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
              : 'space-y-4'
          }
        >
          {sortedArticles.map((article) => (
            <ArticleCard
              key={article.id}
              article={article}
              layout={viewMode}
            />
          ))}
        </div>
      )}

      {/* 加载更多按钮 */}
      {sortedArticles.length > 0 && (
        <div className="mt-8 text-center">
          <button className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg transition-colors inline-flex items-center space-x-2">
            <span>加载更多文章</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </button>
        </div>
      )}
    </main>
  );
} 