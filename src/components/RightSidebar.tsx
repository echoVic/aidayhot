'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Eye, FileText } from 'lucide-react';
import { ArticleService } from '../lib/database';
import type { Article } from '../lib/supabase';
import { showToast } from './ToastProvider';

const quickLinks = [
  { name: 'AI工具导航', href: '/tools', icon: '🛠️' },
  { name: '学习资源', href: '/resources', icon: '📚' },
  { name: '技术论坛', href: '/forum', icon: '💬' },
  { name: '招聘信息', href: '/jobs', icon: '💼' },
  { name: '开源项目', href: '/projects', icon: '🚀' },
  { name: '会议活动', href: '/events', icon: '📅' },
];

const aiNews = [
  {
    title: 'OpenAI CEO称AGI将在2025年实现',
    time: '2小时前',
    source: 'TechCrunch'
  },
  {
    title: '微软Azure AI服务新增语音克隆功能',
    time: '4小时前',
    source: 'Microsoft'
  },
  {
    title: '英伟达股价再创历史新高，市值突破2万亿美元',
    time: '6小时前',
    source: 'Reuters'
  },
  {
    title: '中科院发布首个中文大模型评测基准',
    time: '8小时前',
    source: '科技日报'
  }
];

interface TrendingStats {
  todayVisits: number;
  totalArticles: number;
  totalUsers: number;
  totalComments: number;
}

export default function RightSidebar() {
  const [trendingArticles, setTrendingArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<TrendingStats>({
    todayVisits: 0,
    totalArticles: 0,
    totalUsers: 0,
    totalComments: 0,
  });

  useEffect(() => {
    loadTrendingArticles();
  }, []);

  const loadTrendingArticles = async () => {
    try {
      setLoading(true);
      
      // 并行获取热门文章和新文章
      const [hotArticles, newArticles] = await Promise.all([
        ArticleService.getHot(3),
        ArticleService.getNew(2)
      ]);

      // 如果热门文章不足，用新文章补充
      const combinedArticles = [...hotArticles];
      if (combinedArticles.length < 5) {
        const needed = 5 - combinedArticles.length;
        const additionalArticles = newArticles
          .filter(article => !combinedArticles.find(a => a.id === article.id))
          .slice(0, needed);
        combinedArticles.push(...additionalArticles);
      }

      // 如果还不够，从所有文章中获取更多
      if (combinedArticles.length < 5) {
        try {
          const allArticlesResult = await ArticleService.getAll(1, 10);
          const additionalArticles = allArticlesResult.data
            .filter(article => !combinedArticles.find(a => a.id === article.id))
            .slice(0, 5 - combinedArticles.length);
          combinedArticles.push(...additionalArticles);
        } catch (err) {
          console.warn('获取更多文章失败:', err);
        }
      }

      setTrendingArticles(combinedArticles);

      // 计算统计数据
      const totalViews = combinedArticles.reduce((sum, article) => sum + article.views, 0);
      const totalLikes = combinedArticles.reduce((sum, article) => sum + article.likes, 0);
      
      setStats({
        todayVisits: Math.floor(totalViews * 0.3), // 假设30%是今日访问
        totalArticles: combinedArticles.length * 1500, // 估算总文章数
        totalUsers: Math.floor(totalViews * 0.1), // 假设每10次阅读对应1个用户
        totalComments: totalLikes * 2, // 假设评论数是点赞数的2倍
      });

    } catch (err) {
      console.error('加载热门文章失败:', err);
      showToast.error('加载热门文章失败', '数据加载失败');
    } finally {
      setLoading(false);
    }
  };

  const formatViews = (views: number): string => {
    if (views >= 10000) {
      return `${(views / 10000).toFixed(1)}万`;
    }
    return views.toLocaleString();
  };

  const getCategoryColor = (category: string): string => {
    const colors: Record<string, string> = {
      '大模型': 'bg-purple-100 text-purple-600',
      'AI芯片': 'bg-blue-100 text-blue-600',
      '开源AI': 'bg-green-100 text-green-600',
      '自动驾驶': 'bg-red-100 text-red-600',
      'AI伦理': 'bg-orange-100 text-orange-600',
      '机器学习': 'bg-indigo-100 text-indigo-600',
      '深度学习': 'bg-pink-100 text-pink-600',
    };
    return colors[category] || 'bg-gray-100 text-gray-600';
  };

  return (
    <aside className="w-80 bg-white shadow-sm border-l border-gray-200 h-screen sticky top-16 overflow-y-auto">
      <div className="p-4 space-y-6">
        {/* 热门文章 */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <span className="mr-2">🔥</span>
            今日热门
          </h3>
          
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="p-3 bg-gray-50 rounded-lg animate-pulse">
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-gray-300 rounded-full"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : trendingArticles.length > 0 ? (
            <div className="space-y-3">
              {trendingArticles.map((article, index) => (
                <div
                  key={article.id}
                  className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                  onClick={() => window.open(article.source_url, '_blank')}
                >
                  <div className="flex items-start space-x-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                      {index + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-900 line-clamp-2 mb-1 hover:text-blue-600 transition-colors">
                        {article.title}
                      </h4>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span className={`px-2 py-1 rounded ${getCategoryColor(article.category)}`}>
                          {article.category}
                        </span>
                        <span className="flex items-center">
                          <Eye className="w-3 h-3 mr-1" />
                          {formatViews(article.views)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <FileText className="w-6 h-6 text-gray-400" />
              </div>
              <p className="text-sm text-gray-500">暂无热门文章</p>
            </div>
          )}
        </div>

        {/* 快捷链接 */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <span className="mr-2">⚡</span>
            快捷导航
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {quickLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="flex flex-col items-center p-3 bg-gray-50 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-colors"
              >
                <span className="text-2xl mb-1">{link.icon}</span>
                <span className="text-xs font-medium text-center">{link.name}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* 实时资讯 */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <span className="mr-2">📰</span>
            实时资讯
          </h3>
          <div className="space-y-3">
            {aiNews.map((news, index) => (
              <div
                key={index}
                className="p-3 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors cursor-pointer"
              >
                <h4 className="text-sm font-medium text-gray-900 line-clamp-2 mb-2">
                  {news.title}
                </h4>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{news.source}</span>
                  <span>{news.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 广告位/推荐 */}
        <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg p-4 text-white">
          <h4 className="font-semibold mb-2">🎯 AI学习专区</h4>
          <p className="text-sm mb-3 opacity-90">
            免费AI课程、实战项目、技术分享，助你快速入门人工智能
          </p>
          <button className="w-full bg-white/20 hover:bg-white/30 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors">
            立即学习 →
          </button>
        </div>
      </div>
    </aside>
  );
} 