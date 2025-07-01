'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { PageContentService } from '../lib/database';

interface SidebarProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
}

export default function Sidebar({ selectedCategory, onCategoryChange }: SidebarProps) {
  const pathname = usePathname();
  const [pageNavigation, setPageNavigation] = useState<Array<{
    id: string;
    name: string; 
    href: string;
    count: number;
    icon?: string;
  }>>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPageNavigation();
  }, []);

  const loadPageNavigation = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const data = await PageContentService.getPageNavigation();
      setPageNavigation(data);
      
    } catch (error) {
      console.error('加载页面导航失败:', error);
      setError('加载失败，请刷新重试');
    } finally {
      setIsLoading(false);
    }
  };

  // 单选逻辑：点击"全部"时只选全部，点击其他分类时只选该分类
  const handleCategoryClick = (category: string) => {
    if (category === '全部') {
      onCategoryChange('全部');
    } else {
      onCategoryChange(category);
    }
  };

  if (isLoading) {
    return (
      <aside className="w-64 bg-white shadow-sm border-r border-gray-200 h-screen sticky top-16 overflow-y-auto">
        <div className="p-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">内容分类</h2>
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-10 bg-gray-200 rounded animate-pulse" />
            ))}
          </div>
        </div>
      </aside>
    );
  }

  if (error) {
    return (
      <aside className="w-64 bg-white shadow-sm border-r border-gray-200 h-screen sticky top-16 overflow-y-auto">
        <div className="p-4">
          <div className="text-red-500 text-sm">{error}</div>
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-64 bg-white shadow-sm border-r border-gray-200 h-screen sticky top-16 overflow-y-auto">
      <div className="p-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">内容分类</h2>
        
        <nav className="space-y-1">
          {pageNavigation.map((page) => {
            const isActive = selectedCategory === page.name;
            return (
              <button
                key={page.id}
                type="button"
                onClick={() => handleCategoryClick(page.name)}
                className={`
                  w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors
                  ${isActive 
                    ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }
                `}
              >
                <span className="flex items-center">
                  {page.icon && <span className="mr-2">{page.icon}</span>}
                  {page.name}
                </span>
                <span className={`
                  text-xs px-2 py-1 rounded-full
                  ${isActive 
                    ? 'bg-blue-100 text-blue-600' 
                    : 'bg-gray-100 text-gray-500'
                  }
                `}>
                  {page.count}
                </span>
              </button>
            );
          })}
        </nav>

        {/* 热门话题卡片 */}
        <div className="my-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">热门话题</h3>
          <div className="space-y-2">
            {[
              { name: 'ChatGPT', count: 145 },
              { name: 'Stable Diffusion', count: 98 },
              { name: 'GPT-4', count: 87 },
              { name: 'AI绘画', count: 76 },
              { name: '智能客服', count: 65 },
              { name: 'AI写作', count: 54 },
              { name: '语音识别', count: 43 },
              { name: '图像识别', count: 32 },
            ].map((topic, idx) => (
              <div
                key={topic.name}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-sm font-bold text-blue-600">{`#${idx + 1}`}</span>
                  <span className="text-sm text-gray-800">{topic.name}</span>
                </div>
                <span className="text-xs text-gray-400">{topic.count}篇</span>
              </div>
            ))}
          </div>
        </div>

        {/* 网站统计卡片 */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 text-white shadow mb-4">
          <h4 className="font-semibold mb-2 flex items-center">
            <span className="mr-2">📊</span>
            网站统计
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between items-center">
              <span>新增文章</span>
              <span className="font-bold bg-white/20 px-2 py-1 rounded">7</span>
            </div>
            <div className="flex justify-between items-center">
              <span>总阅读量</span>
              <span className="font-bold bg-white/20 px-2 py-1 rounded">1,050</span>
            </div>
            <div className="flex justify-between items-center">
              <span>文章总数</span>
              <span className="font-bold bg-white/20 px-2 py-1 rounded">140</span>
            </div>
          </div>
          <div className="mt-3 flex items-center text-xs text-blue-100">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse mr-2"></div>
            实时更新
          </div>
        </div>

        {/* 统计信息 */}
        {pageNavigation.length > 0 && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="text-xs text-gray-500 space-y-1">
              <div className="flex justify-between">
                <span>总文章数</span>
                <span className="font-medium">
                  {pageNavigation.reduce((sum, page) => sum + page.count, 0)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>活跃页面</span>
                <span className="font-medium">{pageNavigation.length}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
} 