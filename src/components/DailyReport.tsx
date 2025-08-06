'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
// 使用简单的图标组件替代 Heroicons
const CalendarIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const ClockIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const ExternalLinkIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
  </svg>
);

interface NewsItem {
  title: string
  url: string
  summary: string
  publishTime: string
  aiSummary?: string
  source: string
}

interface DailyReportContent {
  articles: NewsItem[]
  metadata: {
    totalArticles: number
    generatedAt: string
    sources: string[]
  }
}

interface DailyReport {
  id: string
  date: string
  content: DailyReportContent
  summary: string
  created_at: string
}

export default function DailyReport() {
  const [currentReport, setCurrentReport] = useState<DailyReport | null>(null);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 获取可用日期列表
  const fetchAvailableDates = async () => {
    try {
      const { data, error } = await supabase
        .from('daily_reports')
        .select('date')
        .order('date', { ascending: false });

      if (error) throw error;

      const dates = data?.map(item => item.date) || [];
      setAvailableDates(dates);
      
      // 设置默认选中最新日期
      if (dates.length > 0 && !selectedDate) {
        setSelectedDate(dates[0]);
      }
    } catch (error) {
      console.error('获取日期列表失败:', error);
    }
  };

  // 获取指定日期的日报数据
  const fetchDailyReport = async (date: string) => {
    if (!date) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const { data: reportData, error: reportError } = await supabase
        .from('daily_reports')
        .select('*')
        .eq('date', date)
        .single();

      if (reportError) throw reportError;
      if (!reportData) {
        setError('未找到该日期的日报');
        return;
      }

      setCurrentReport(reportData);
    } catch (err) {
      console.error('获取日报失败:', err);
      setError('获取日报数据失败');
    } finally {
      setLoading(false);
    }
  };

  // 初始化数据
  useEffect(() => {
    fetchAvailableDates();
  }, []);

  // 当选择的日期改变时，获取对应的日报
  useEffect(() => {
    if (selectedDate) {
      fetchDailyReport(selectedDate);
    }
  }, [selectedDate]);

  // 格式化日期显示
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    });
  };

  // 获取来源图标
  const getSourceIcon = (sourceName: string) => {
    const name = sourceName.toLowerCase();
    if (name.includes('arxiv')) return '📚';
    if (name.includes('github')) return '🐙';
    if (name.includes('rss')) return '📰';
    return '🔗';
  };

  if (loading && !currentReport) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <p className="text-red-600 mb-4">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          重新加载
        </button>
      </div>
    );
  }

  if (!currentReport) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
        <CalendarIcon className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-yellow-800 mb-2">暂无日报</h3>
        <p className="text-yellow-600">还没有生成任何日报，请稍后再试。</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* 日期选择器 */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-3xl font-bold text-gray-900">AI 每日热点</h1>
          
          {availableDates.length > 0 && (
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-gray-500" />
              <select
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {availableDates.map(date => (
                  <option key={date} value={date}>
                    {formatDate(date)}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* 日报内容 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* 日报头部 */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800">
              {new Date(currentReport.date).toLocaleDateString('zh-CN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })} 日报
            </h2>
            <span className="text-sm text-gray-500">
              共 {currentReport.content.metadata.totalArticles} 篇文章
            </span>
          </div>

          {/* 日报总结 */}
          <div className="mb-8 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-400">
            <h3 className="text-lg font-semibold text-blue-800 mb-2">📊 今日总结</h3>
            <p className="text-gray-700 leading-relaxed">{currentReport.summary}</p>
          </div>
          <div className="space-y-6">
            {currentReport.content.articles.map((article: NewsItem, index: number) => (
              <div key={index} className="p-6 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-blue-600">{index + 1}</span>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                      {article.title}
                    </h3>
                    
                    <div className="space-y-3">
                      {article.aiSummary && (
                        <div className="text-sm text-gray-700 bg-green-50 p-3 rounded-lg border-l-4 border-green-400">
                          <span className="font-medium text-green-800">AI摘要：</span>
                          <p className="mt-1">{article.aiSummary}</p>
                        </div>
                      )}
                      
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">原始摘要：</span>
                        <p className="mt-1">{article.summary}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 mt-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <ClockIcon className="h-4 w-4" />
                        {new Date(article.publishTime).toLocaleString('zh-CN')}
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                        {article.source}
                      </span>
                      <a 
                        href={article.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1"
                      >
                        查看原文
                        <ExternalLinkIcon className="h-4 w-4" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 底部信息 */}
        <div className="p-6 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>共 {currentReport.content.articles.length} 条资讯</span>
            <span>由 AI 自动生成和整理</span>
          </div>
        </div>
      </div>
    </div>
  );
}
