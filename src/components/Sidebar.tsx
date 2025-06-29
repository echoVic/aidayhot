'use client';

import { useEffect, useState } from 'react';
import { CategoryService, RealtimeService } from '../lib/database';
import type { Category } from '../lib/supabase';

const categoryIcons: Record<string, string> = {
  '全部': '🏠',
  'AI/机器学习': '🤖',
  '社交媒体': '💬',
  '技术/开发': '💻',
  '新闻/资讯': '📰',
  '播客': '🎙️',
  '设计/UX': '🎨',
  '学术/研究': '🔬',
  '其他': '📁'
};

const hotTopics = [
  { name: 'ChatGPT', count: 145 },
  { name: 'Stable Diffusion', count: 98 },
  { name: 'GPT-4', count: 87 },
  { name: 'AI绘画', count: 76 },
  { name: '智能客服', count: 65 },
  { name: 'AI写作', count: 54 },
  { name: '语音识别', count: 43 },
  { name: '图像识别', count: 32 },
];

interface SidebarProps {
  currentCategory?: string;
  onCategoryChange: (category: string) => void;
}

export default function Sidebar({ currentCategory = '全部', onCategoryChange }: SidebarProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    newArticles: 0,
    totalViews: 0,
    totalUsers: 0
  });

  // 加载分类数据
  useEffect(() => {
    loadCategories();
  }, []);

  // 实时订阅分类变化
  useEffect(() => {
    const subscription = RealtimeService.subscribeToCategories((payload) => {
      console.log('分类数据变化:', payload);
      loadCategories();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const data = await CategoryService.getRSSCategories();
      // 计算总数
      const totalCount = data.reduce((sum, cat) => sum + cat.count, 0);
      // 前端插入"全部"分类
      const categoriesWithAll = [
        { id: 0, name: '全部', count: totalCount, href: '/', created_at: '' },
        ...data
      ];
      setCategories(categoriesWithAll);
      // 统计数据也用总数
      setStats({
        newArticles: Math.floor(totalCount * 0.1),
        totalViews: Math.floor(totalCount * 15),
        totalUsers: Math.floor(totalCount * 3)
      });
    } catch (err) {
      console.error('加载分类失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryClick = (categoryName: string) => {
    onCategoryChange(categoryName);
  };

  if (loading) {
    return (
      <aside className="w-64 bg-white shadow-sm border-r border-gray-200 h-screen sticky top-16 overflow-y-auto">
        <div className="p-4">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-gray-300 rounded w-3/4"></div>
            {[...Array(8)].map((_, i) => (
              <div key={i} className="flex items-center space-x-3">
                <div className="h-4 w-4 bg-gray-300 rounded"></div>
                <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                <div className="h-4 w-8 bg-gray-300 rounded ml-auto"></div>
              </div>
            ))}
          </div>
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-64 bg-white shadow-sm border-r border-gray-200 h-screen sticky top-16 overflow-y-auto">
      <div className="p-4">
        {/* 分类导航 */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">内容分类</h3>
          <nav className="space-y-1">
            {categories.map((category, index) => (
              <button
                key={category.id || `category-${index}`}
                onClick={() => handleCategoryClick(category.name)}
                className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg hover:bg-gray-100 transition-colors group ${
                  currentCategory === category.name
                    ? 'bg-blue-50 text-blue-600 border border-blue-200'
                    : 'text-gray-700 hover:text-blue-600'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-lg group-hover:scale-110 transition-transform">
                    {categoryIcons[category.name] || '📁'}
                  </span>
                  <span className="font-medium">{category.name}</span>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full group-hover:bg-blue-100 transition-colors ${
                  currentCategory === category.name
                    ? 'bg-blue-100 text-blue-600'
                    : 'text-gray-500 bg-gray-100'
                }`}>
                  {category.count}
                </span>
              </button>
            ))}
          </nav>
        </div>

        {/* 热门话题 */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">热门话题</h3>
          <div className="space-y-2">
            {hotTopics.map((topic, index) => (
              <div
                key={topic.name}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors group"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-sm font-medium text-blue-600 group-hover:text-blue-700">
                    #{index + 1}
                  </span>
                  <span className="text-sm text-gray-700 group-hover:text-gray-900">
                    {topic.name}
                  </span>
                </div>
                <span className="text-xs text-gray-500">
                  {topic.count}篇
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 网站统计 */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 text-white">
          <h4 className="font-semibold mb-2 flex items-center">
            <span className="mr-2">📊</span>
            网站统计
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between items-center">
              <span>新增文章</span>
              <span className="font-medium bg-white/20 px-2 py-1 rounded">
                {stats.newArticles}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span>总阅读量</span>
              <span className="font-medium bg-white/20 px-2 py-1 rounded">
                {stats.totalViews.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span>文章总数</span>
              <span className="font-medium bg-white/20 px-2 py-1 rounded">
                {/* 文章总数直接用分类总和 */}
                {categories.reduce((sum, cat) => sum + cat.count, 0)}
              </span>
            </div>
          </div>
          {/* 实时指示器 */}
          <div className="mt-3 flex items-center text-xs text-blue-100">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse mr-2"></div>
            实时更新
          </div>
        </div>

        {/* 快捷操作 */}
        {/* ... 此处原有按钮已全部移除，如无内容则整个div一并删除 ... */}
      </div>
    </aside>
  );
} 