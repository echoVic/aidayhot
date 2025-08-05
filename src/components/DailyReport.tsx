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

interface ReportItem {
  id: number;
  title: string;
  summary: string;
  source_url: string;
  source_name: string;
  display_order: number;
}

interface DailyReportData {
  id: number;
  report_date: string;
  introduction: string;
  created_at: string;
  items: ReportItem[];
}

export default function DailyReport() {
  const [currentReport, setCurrentReport] = useState<DailyReportData | null>(null);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 获取可用的日报日期列表
  const fetchAvailableDates = async () => {
    try {
      const { data, error } = await supabase
        .from('daily_reports')
        .select('report_date')
        .order('report_date', { ascending: false });

      if (error) throw error;

      const dates = data?.map(item => item.report_date) || [];
      setAvailableDates(dates);
      
      // 默认选择最新的日期
      if (dates.length > 0) {
        setSelectedDate(dates[0]);
      }
    } catch (err) {
      console.error('获取日报日期失败:', err);
      setError('无法获取日报列表');
    }
  };

  // 获取指定日期的日报内容
  const fetchDailyReport = async (date: string) => {
    if (!date) return;

    try {
      setLoading(true);
      setError(null);

      // 获取日报主记录
      const { data: reportData, error: reportError } = await supabase
        .from('daily_reports')
        .select('*')
        .eq('report_date', date)
        .single();

      if (reportError) throw reportError;

      // 获取日报条目
      const { data: itemsData, error: itemsError } = await supabase
        .from('report_items')
        .select('*')
        .eq('daily_report_id', reportData.id)
        .order('display_order', { ascending: true });

      if (itemsError) throw itemsError;

      setCurrentReport({
        ...reportData,
        items: itemsData || []
      });

    } catch (err) {
      console.error('获取日报内容失败:', err);
      setError('无法获取日报内容');
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
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
            <ClockIcon className="h-4 w-4" />
            <span>{formatDate(currentReport.report_date)}</span>
          </div>
          
          <h2 className="text-xl font-semibold text-gray-900 mb-4">今日导读</h2>
          
          <div className="prose prose-gray max-w-none">
            <p className="text-gray-700 leading-relaxed">
              {currentReport.introduction || '今日AI领域有多项重要进展，涵盖学术研究、开源项目和行业动态。'}
            </p>
          </div>
        </div>

        {/* 新闻条目列表 */}
        <div className="divide-y divide-gray-200">
          {currentReport.items.map((item, index) => (
            <div key={item.id} className="p-6 hover:bg-gray-50 transition-colors">
              <div className="flex items-start gap-4">
                {/* 序号和来源图标 */}
                <div className="flex-shrink-0 flex flex-col items-center">
                  <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                    {index + 1}
                  </div>
                  <div className="mt-2 text-lg">
                    {getSourceIcon(item.source_name)}
                  </div>
                </div>

                {/* 内容 */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-medium text-gray-900 mb-2 leading-tight">
                    {item.title}
                  </h3>
                  
                  <p className="text-gray-600 mb-3 leading-relaxed">
                    {item.summary}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {item.source_name}
                    </span>
                    
                    <a
                      href={item.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                      <span>查看原文</span>
                      <ExternalLinkIcon className="h-4 w-4" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 底部信息 */}
        <div className="p-6 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>共 {currentReport.items.length} 条资讯</span>
            <span>由 AI 自动生成和整理</span>
          </div>
        </div>
      </div>
    </div>
  );
}
