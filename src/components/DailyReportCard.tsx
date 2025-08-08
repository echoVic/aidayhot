'use client';

import { CalendarDays, ChevronDown, ChevronRight, Clock, ExternalLink } from 'lucide-react';
import React from 'react';
import ReactMarkdown from 'react-markdown';
import OptimizedImage from './OptimizedImage';
import ShareButton from './ShareButton';

// 类型定义
export interface NewsItem {
  title: string;
  url: string;
  publishTime: string;
  aiSummary?: string;
  source: string;
  imageUrl?: string;
  tags?: string[];
}

interface DailyReportContent {
  articles: NewsItem[];
  metadata: {
    totalArticles: number;
    sources: string[];
    categories?: string[];
    keywords?: string[];
  };
}

export interface Report {
  id?: string;
  date: string;
  summary: string;
  content: DailyReportContent;
}

// React.memo 优化的日报卡片组件
interface DailyReportCardProps {
  report: Report;
  isExpanded: boolean;
  onToggleExpansion: (reportId: string) => void;
  formatDate: (dateString: string) => string;
  isMobile?: boolean;
  onShare?: (report: Report) => void;
}

const DailyReportCard = React.memo<DailyReportCardProps>(({ 
  report, 
  isExpanded, 
  onToggleExpansion, 
  formatDate,
  isMobile = false,
  onShare
}) => {

  return (
    <div className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
      {/* 日报头部 - 可点击展开/收起 */}
      <div 
        className={`cursor-pointer select-none hover:bg-gray-50 transition-colors ${
          isMobile ? 'p-4' : 'p-6'
        }`}
        onClick={() => onToggleExpansion(report.date)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <CalendarDays className="h-5 w-5 text-blue-600" />
              </div>
            </div>
            <div>
              <h2 className={`font-bold text-gray-900 ${
                isMobile ? 'text-lg' : 'text-xl'
              }`}>
                {formatDate(report.date)}
              </h2>
              <p className={`text-gray-500 mt-1 ${
                isMobile ? 'text-xs' : 'text-sm'
              }`}>
                基于 {report.content.metadata.totalArticles} 篇文章生成
              </p>
            </div>
          </div>
          
          {/* 操作按钮区 */}
          <div className="flex items-center gap-2">
            {/* 分享按钮 */}
            <ShareButton report={report} />
            
            {/* 展开/收起图标 */}
            <div className="flex-shrink-0">
              {isExpanded ? (
                <ChevronDown className="h-6 w-6 text-gray-400" />
              ) : (
                <ChevronRight className="h-6 w-6 text-gray-400" />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 日报内容 - 可展开 */}
      {isExpanded && (
        <div className="border-t border-gray-100">
          {/* 日报总结 */}
          <div className="p-6 pb-4">
            <div className="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-400">
              <h3 className="text-lg font-semibold text-blue-800 mb-2 flex items-center gap-2">
                <span>📊</span>
                今日总结
              </h3>
              <div className="text-gray-700 leading-relaxed prose prose-sm max-w-none">
                <ReactMarkdown>{report.summary}</ReactMarkdown>
              </div>
            </div>
          </div>
          
          {/* 文章列表 */}
          <div className="px-6 pb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <span>📰</span>
              今日资讯
            </h3>
            <div className="space-y-4">
              {report.content.articles.map((article: NewsItem, articleIndex: number) => (
                <div key={articleIndex} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-xs font-medium text-blue-600">{articleIndex + 1}</span>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      {/* 文章标题和图片布局 */}
                      <div className="flex flex-col md:flex-row md:items-start gap-3">
                        <div className="flex-1">
                          <h4 className="text-base font-medium text-gray-900 mb-2 line-clamp-2">
                            <a 
                              href={article.url} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="hover:text-blue-600 transition-colors"
                            >
                              {article.title}
                            </a>
                          </h4>
                          
                          {/* 文章标签 */}
                          {article.tags && article.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-2">
                              {article.tags.map((tag, tagIndex) => (
                                <span 
                                  key={tagIndex} 
                                  className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-xs"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        
                        {/* 文章图片 */}
                        {article.imageUrl && (
                          <div className="flex-shrink-0 w-full md:w-32 h-24 rounded overflow-hidden">
                            <OptimizedImage
                              src={article.imageUrl}
                              alt={article.title}
                              width={128}
                              height={96}
                              className="w-full h-full object-cover"
                              lazy={true}
                            />
                          </div>
                        )}
                      </div>
                      
                      {/* 文章摘要 */}
                      {article.aiSummary && (
                        <div className="text-sm text-gray-700 mb-3">
                          <div className="prose prose-sm max-w-none">
                            <ReactMarkdown>{article.aiSummary}</ReactMarkdown>
                          </div>
                        </div>
                      )}
                      
                      {/* 文章元信息 */}
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
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
                          className="text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 transition-colors"
                        >
                          查看原文
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* 数据来源信息 */}
          <div className="px-6 pb-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <span>📊</span>
                数据来源
              </h4>
              <div className="flex flex-wrap gap-2">
                {report.content.metadata.sources.map((source: string, sourceIndex: number) => (
                  <span key={sourceIndex} className="px-2 py-1 bg-white rounded text-xs text-gray-600 border">
                    {source}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* 底部信息 */}
      <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 rounded-b-lg">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>基于 {report.content.articles.length} 条资讯生成</span>
          <span>由 AI 自动生成和整理</span>
        </div>
      </div>


    </div>
  );
});

DailyReportCard.displayName = 'DailyReportCard';

export default DailyReportCard;