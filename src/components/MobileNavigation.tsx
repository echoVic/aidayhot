'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { CategoryService } from '../lib/database';
import type { Category } from '../lib/supabase';

interface MobileNavigationProps {
  currentCategory?: string;
  onCategoryChange?: (category: string) => void;
  onSearchToggle?: () => void;
  onSearch?: (query: string) => void;
}

export default function MobileNavigation({ 
  currentCategory, 
  onCategoryChange, 
  onSearchToggle,
  onSearch 
}: MobileNavigationProps) {
  const [activeTab, setActiveTab] = useState('home');
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const data = await CategoryService.getAll();
      setCategories(data || []);
    } catch (err) {
      console.error('加载分类失败:', err);
    }
  };

  const handleCategorySelect = (category: string) => {
    if (onCategoryChange) {
      onCategoryChange(category);
    }
    setShowCategoryModal(false);
    setActiveTab('home');
  };

  const handleSearch = () => {
    if (onSearch && searchQuery.trim()) {
      onSearch(searchQuery.trim());
      setShowSearchModal(false);
      setActiveTab('home');
    }
  };

  const categoryIcons: Record<string, string> = {
    '全部': '🏠',
    '机器学习': '🤖',
    '深度学习': '🧠',
    '自然语言处理': '💬',
    '计算机视觉': '👁️',
    '大模型': '🔮',
    '自动驾驶': '🚗',
    '机器人': '🦾',
    'AI芯片': '💾',
    'AI伦理': '⚖️',
    '开源AI': '🔓',
    'AI绘画': '🎨',
    '办公AI': '💼',
    '科学AI': '🔬'
  };

  return (
    <>
      {/* 底部导航栏 */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40">
        <div className="flex items-center justify-around py-2">
          <button 
            onClick={() => setActiveTab('home')}
            className={`flex flex-col items-center p-2 ${activeTab === 'home' ? 'text-blue-600' : 'text-gray-600'}`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v6H8V5z" />
            </svg>
            <span className="text-xs mt-1">首页</span>
          </button>

          <button 
            onClick={() => {
              setShowCategoryModal(true);
              setActiveTab('category');
            }}
            className={`flex flex-col items-center p-2 ${activeTab === 'category' ? 'text-blue-600' : 'text-gray-600'}`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <span className="text-xs mt-1">分类</span>
          </button>
          
          <button 
            onClick={() => {
              setShowSearchModal(true);
              setActiveTab('search');
            }}
            className={`flex flex-col items-center p-2 ${activeTab === 'search' ? 'text-blue-600' : 'text-gray-600'}`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span className="text-xs mt-1">搜索</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('favorite')}
            className={`flex flex-col items-center p-2 ${activeTab === 'favorite' ? 'text-blue-600' : 'text-gray-600'}`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            <span className="text-xs mt-1">收藏</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('profile')}
            className={`flex flex-col items-center p-2 ${activeTab === 'profile' ? 'text-blue-600' : 'text-gray-600'}`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="text-xs mt-1">我的</span>
          </button>
        </div>
      </div>

      {/* 分类选择模态框 */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 lg:hidden">
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-lg max-h-96 overflow-y-auto">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">选择分类</h3>
                <button 
                  onClick={() => setShowCategoryModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-4 space-y-2">
              {categories.map((category) => (
                <button
                  key={category.name}
                  onClick={() => handleCategorySelect(category.name)}
                  className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${
                    currentCategory === category.name 
                      ? 'bg-blue-50 text-blue-600 border border-blue-200' 
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-lg">
                      {categoryIcons[category.name] || '📁'}
                    </span>
                    <span className="font-medium">{category.name}</span>
                  </div>
                  <span className="text-sm text-gray-500 bg-white px-2 py-1 rounded-full">
                    {category.count}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 搜索模态框 */}
      {showSearchModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 lg:hidden">
          <div className="absolute top-0 left-0 right-0 bg-white">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <button 
                  onClick={() => setShowSearchModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                
                <div className="flex-1 relative">
                  <input
                    type="text"
                    placeholder="搜索AI资讯..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    autoFocus
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>
                
                <button 
                  onClick={handleSearch}
                  disabled={!searchQuery.trim()}
                  className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  搜索
                </button>
              </div>
            </div>
            
            <div className="p-4">
              <h4 className="text-sm font-medium text-gray-700 mb-3">热门搜索</h4>
              <div className="flex flex-wrap gap-2">
                {['ChatGPT', 'Stable Diffusion', 'GPT-4', 'AI绘画', '智能客服', 'AI写作'].map((tag) => (
                  <button
                    key={tag}
                    onClick={() => {
                      setSearchQuery(tag);
                      if (onSearch) {
                        onSearch(tag);
                        setShowSearchModal(false);
                        setActiveTab('home');
                      }
                    }}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded-full text-sm transition-colors"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
