'use client';

import Link from 'next/link';
import type { Article } from '../lib/supabase';
import { formatDate, formatNumber, getQuestionStatus, STATUS_COLORS } from '../lib/utils';
import { ArrowUp, MessageCircle, Eye, ExternalLink } from 'lucide-react';

interface StackOverflowCardProps {
  article: Article;
  layout?: 'grid' | 'list';
  onClick?: () => void;
}

export default function StackOverflowCard({ article, layout = 'grid', onClick }: StackOverflowCardProps) {
  const handleClick = () => {
    if (onClick) {
      onClick();
    }
  };

  // 从metadata中提取StackOverflow特有信息
  const metadata = article.metadata as any || {};
  const score = metadata.score || 0;
  const answerCount = metadata.answer_count || 0;
  const viewCount = metadata.view_count || article.views || 0;
  const isAnswered = metadata.is_answered || answerCount > 0;
  const hasAcceptedAnswer = metadata.has_accepted_answer || false;
  const questionId = metadata.question_id || '';
  const tags = metadata.tags || [];
  const askedDate = metadata.creation_date || article.publish_time;
  const lastActivity = metadata.last_activity_date || article.updated_at;
  const asker = metadata.owner?.display_name || article.author || '匿名用户';
  const askerReputation = metadata.owner?.reputation || 0;

  // 获取问题状态
  const questionStatus = getQuestionStatus(hasAcceptedAnswer, isAnswered);

  if (layout === 'list') {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 p-6">
        <div className="flex items-start space-x-4">
          {/* StackOverflow图标 */}
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center" aria-label="Stack Overflow">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M15.725 0l-1.72 1.277 6.39 8.588 1.716-1.277L15.725 0zm-3.94 3.418l-1.369 1.644 8.225 6.85 1.369-1.644-8.225-6.85zm-3.15 4.465l-.905 1.94 9.702 4.517.904-1.94-9.701-4.517zm-1.85 4.86l-.44 2.093 10.473 2.201.44-2.092L6.785 12.743zM1.89 15.47V24h19.19v-8.53H1.89zm2.133 6.397V17.6h14.92v4.267H4.023z"/>
              </svg>
            </div>
          </div>

          {/* 主要内容 */}
          <div className="flex-1 min-w-0">
            {/* 问题标题和状态 */}
            <div className="flex items-start justify-between mb-2">
              <Link
                href={article.source_url || '#'}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleClick}
                className="text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors line-clamp-2 flex-1 mr-4"
              >
                {article.title}
              </Link>
              <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${STATUS_COLORS[questionStatus.status as keyof typeof STATUS_COLORS]}`}>
                {questionStatus.icon} {questionStatus.label}
              </span>
            </div>

            {/* 问题摘要 */}
            <p className="text-gray-600 text-sm mb-3 line-clamp-2">
              {article.summary || '暂无描述'}
            </p>

            {/* 统计信息 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                {/* 投票数 */}
                <div className="flex items-center space-x-1">
                  <ArrowUp className="w-4 h-4" aria-hidden="true" />
                  <span><span className="sr-only">投票数：</span>{score} 票</span>
                </div>

                {/* 回答数 */}
                <div className="flex items-center space-x-1">
                  <MessageCircle className="w-4 h-4" aria-hidden="true" />
                  <span><span className="sr-only">回答数：</span>{answerCount} 回答</span>
                </div>

                {/* 浏览数 */}
                <div className="flex items-center space-x-1">
                  <Eye className="w-4 h-4" aria-hidden="true" />
                  <span><span className="sr-only">浏览量：</span>{formatNumber(viewCount)}</span>
                </div>

                {/* 提问者 */}
                <div className="flex items-center space-x-1">
                  <span>by {asker}</span>
                  {askerReputation > 0 && (
                    <span className="text-xs text-blue-600">({formatNumber(askerReputation)})</span>
                  )}
                </div>

                {/* 时间 */}
                <span>提问于 {formatDate(askedDate)}</span>
              </div>
            </div>

            {/* 标签 */}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-3">
                {tags.slice(0, 6).map((tag: string, index: number) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded-md"
                  >
                    {tag}
                  </span>
                ))}
                {tags.length > 6 && (
                  <span className="text-xs text-gray-500">+{tags.length - 6} 更多</span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 网格布局
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 overflow-hidden">
      {/* 头部 */}
      <div className="p-6">
        {/* StackOverflow图标和状态 */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center" aria-label="Stack Overflow">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M15.725 0l-1.72 1.277 6.39 8.588 1.716-1.277L15.725 0zm-3.94 3.418l-1.369 1.644 8.225 6.85 1.369-1.644-8.225-6.85zm-3.15 4.465l-.905 1.94 9.702 4.517.904-1.94-9.701-4.517zm-1.85 4.86l-.44 2.093 10.473 2.201.44-2.092L6.785 12.743zM1.89 15.47V24h19.19v-8.53H1.89zm2.133 6.397V17.6h14.92v4.267H4.023z"/>
                </svg>
              </div>
            </div>
            <div className="text-sm text-gray-500">
              Stack Overflow
            </div>
          </div>
          <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${STATUS_COLORS[questionStatus.status as keyof typeof STATUS_COLORS]}`}>
            {questionStatus.icon} {questionStatus.label}
          </span>
        </div>

        {/* 问题标题 */}
        <Link
          href={article.source_url || '#'}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleClick}
          className="block text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors line-clamp-3 mb-3"
        >
          {article.title}
        </Link>

        {/* 问题摘要 */}
        <p className="text-gray-600 text-sm mb-4 line-clamp-3">
          {article.summary || '暂无描述'}
        </p>

        {/* 统计信息 */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          {/* 投票数 */}
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900">{score}</div>
            <div className="text-xs text-gray-500">投票</div>
          </div>

          {/* 回答数 */}
          <div className="text-center">
            <div className={`text-lg font-semibold ${hasAcceptedAnswer ? 'text-green-600' : answerCount > 0 ? 'text-blue-600' : 'text-gray-900'}`}>
              {answerCount}
            </div>
            <div className="text-xs text-gray-500">回答</div>
          </div>

          {/* 浏览数 */}
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900">{formatNumber(viewCount)}</div>
            <div className="text-xs text-gray-500">浏览</div>
          </div>
        </div>

        {/* 提问者信息 */}
        <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
          <div className="flex items-center space-x-1">
            <span>提问者: {asker}</span>
            {askerReputation > 0 && (
              <span className="text-xs text-blue-600">({formatNumber(askerReputation)})</span>
            )}
          </div>
          <span>{formatDate(askedDate)}</span>
        </div>

        {/* 状态标签 */}
        <div className="flex items-center space-x-2 mb-3">
          {article.is_hot && (
            <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-red-600 bg-red-100 rounded-full">
              🔥 热门
            </span>
          )}
          {article.is_new && (
            <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-green-600 bg-green-100 rounded-full">
              ✨ 最新
            </span>
          )}
        </div>
      </div>

      {/* 标签区域 */}
      {tags.length > 0 && (
        <div className="px-6 pb-4">
          <div className="flex flex-wrap gap-1">
            {tags.slice(0, 4).map((tag: string, index: number) => (
              <span
                key={index}
                className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded-md"
              >
                {tag}
              </span>
            ))}
            {tags.length > 4 && (
              <span className="text-xs text-gray-500 px-2 py-1">+{tags.length - 4}</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
