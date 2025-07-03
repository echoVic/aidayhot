'use client';

import Link from 'next/link';
import type { Article } from '../lib/supabase';

interface PaperCardProps {
  article: Article;
  layout?: 'grid' | 'list';
  onClick?: () => void;
}

export default function PaperCard({ article, layout = 'grid', onClick }: PaperCardProps) {
  const handleClick = () => {
    if (onClick) {
      onClick();
    }
  };

  // 安全获取文本值
  const getTextValue = (value: any): string => {
    if (typeof value === 'string') return value;
    if (typeof value === 'object' && value !== null) {
      return JSON.stringify(value);
    }
    return String(value || '');
  };

  // 格式化日期显示
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  // 格式化作者列表
  const formatAuthors = (authorString: string) => {
    if (!authorString) return '未知作者';
    
    const authors = authorString.split(',').map(author => author.trim());
    if (authors.length <= 3) {
      return authors.join(', ');
    }
    return `${authors.slice(0, 3).join(', ')} 等 ${authors.length} 人`;
  };

  // 解析标签
  const getTags = () => {
    try {
      if (Array.isArray(article.tags)) {
        return article.tags.slice(0, 5); // 最多显示5个标签
      }
      if (typeof article.tags === 'string') {
        return JSON.parse(article.tags).slice(0, 5);
      }
      return [];
    } catch {
      return [];
    }
  };

  // 检查是否有代码链接
  const hasCodeLink = () => {
    const url = article.source_url || '';
    return url.includes('github.com') || url.includes('paperswithcode.com');
  };

  // 获取期刊或会议信息
  const getVenue = () => {
    // 从 metadata 或其他字段中提取期刊/会议信息
    try {
      if (article.metadata && typeof article.metadata === 'object') {
        const metadata = article.metadata as any;
        return metadata.venue || metadata.journal || metadata.conference;
      }
    } catch {
      // 忽略错误
    }
    return null;
  };

  const tags = getTags();
  const venue = getVenue();

  // 列表视图
  if (layout === 'list') {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-start space-y-3 sm:space-y-0 sm:space-x-4">
          {/* 左侧：论文标识和状态 */}
          <div className="flex-shrink-0">
            <div className="flex items-center space-x-2">
              <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-purple-600 bg-purple-50 rounded-md border border-purple-200">
                📚 Paper
              </span>
              {hasCodeLink() && (
                <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-green-600 bg-green-50 rounded-md border border-green-200">
                  💻 Code
                </span>
              )}
            </div>
            <div className="mt-2 flex flex-col space-y-1">
              {article.is_new && (
                <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-green-600 bg-green-50 rounded-md">
                  ✨ 最新
                </span>
              )}
              {article.is_hot && (
                <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-orange-600 bg-orange-50 rounded-md">
                  🔥 热门
                </span>
              )}
            </div>
          </div>

          {/* 右侧：主要内容 */}
          <div className="flex-1 min-w-0">
            {/* 标题 */}
            <div className="mb-2">
              <Link
                href={article.source_url || `/article/${article.id}`}
                target={article.source_url ? "_blank" : "_self"}
                rel={article.source_url ? "noopener noreferrer" : undefined}
                onClick={handleClick}
                className="text-lg font-semibold text-gray-900 hover:text-purple-600 transition-colors line-clamp-2 block"
              >
                {getTextValue(article.title)}
              </Link>
            </div>

            {/* 作者、期刊和时间 */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 space-y-1 sm:space-y-0">
              <div className="text-sm text-gray-600">
                <span className="font-medium">作者:</span> {formatAuthors(getTextValue(article.author))}
                {venue && (
                  <span className="ml-2 text-blue-600">
                    📖 {venue}
                  </span>
                )}
              </div>
              <div className="text-sm text-gray-500">
                {formatDate(article.publish_time)}
              </div>
            </div>

            {/* 摘要 */}
            <div className="mb-3">
              <p className="text-gray-700 text-sm line-clamp-3">
                {getTextValue(article.summary)}
              </p>
            </div>

            {/* 标签 */}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-3">
                {tags.map((tag: any, index: number) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2 py-1 text-xs font-medium text-purple-600 bg-purple-50 rounded-md"
                  >
                    {getTextValue(tag)}
                  </span>
                ))}
              </div>
            )}

            {/* 底部操作 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <span>👁️ {article.views || 0} 次查看</span>
                <span>❤️ {article.likes || 0} 次点赞</span>
                {hasCodeLink() && (
                  <span className="text-green-600">⭐ 有代码</span>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    // 收藏功能
                  }}
                  className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                  title="收藏"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </button>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    // 分享功能
                  }}
                  className="p-1.5 text-gray-400 hover:text-purple-500 transition-colors"
                  title="分享"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 网格视图
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 overflow-hidden">
      {/* 头部：状态标识 */}
      <div className="p-4 pb-0">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-purple-600 bg-purple-50 rounded-md border border-purple-200">
              📚 Paper
            </span>
            {hasCodeLink() && (
              <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-green-600 bg-green-50 rounded-md border border-green-200">
                💻
              </span>
            )}
          </div>
          <div className="flex space-x-1">
            {article.is_new && (
              <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-green-600 bg-green-50 rounded-md">
                ✨
              </span>
            )}
            {article.is_hot && (
              <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-orange-600 bg-orange-50 rounded-md">
                🔥
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="p-4">
        {/* 标题 */}
        <div className="mb-3">
          <Link
            href={article.source_url || `/article/${article.id}`}
            target={article.source_url ? "_blank" : "_self"}
            rel={article.source_url ? "noopener noreferrer" : undefined}
            onClick={handleClick}
            className="text-lg font-semibold text-gray-900 hover:text-purple-600 transition-colors line-clamp-2 block"
          >
            {getTextValue(article.title)}
          </Link>
        </div>

        {/* 作者和期刊 */}
        <div className="mb-3">
          <p className="text-sm text-gray-600 line-clamp-1">
            <span className="font-medium">作者:</span> {formatAuthors(getTextValue(article.author))}
          </p>
          {venue && (
            <p className="text-sm text-blue-600 mt-1">
              📖 {venue}
            </p>
          )}
        </div>

        {/* 摘要 */}
        <div className="mb-3">
          <p className="text-gray-700 text-sm line-clamp-3">
            {getTextValue(article.summary)}
          </p>
        </div>

        {/* 标签 */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {tags.slice(0, 3).map((tag: any, index: number) => (
              <span
                key={index}
                className="inline-flex items-center px-2 py-1 text-xs font-medium text-purple-600 bg-purple-50 rounded-md"
              >
                {getTextValue(tag)}
              </span>
            ))}
            {tags.length > 3 && (
              <span className="text-xs text-gray-500">
                +{tags.length - 3} 更多
              </span>
            )}
          </div>
        )}

        {/* 底部信息 */}
        <div className="flex items-center justify-between text-sm">
          <div className="text-gray-500">
            {formatDate(article.publish_time)}
          </div>
          <div className="flex items-center space-x-3 text-gray-500">
            <span>👁️ {article.views || 0}</span>
            <span>❤️ {article.likes || 0}</span>
            {hasCodeLink() && (
              <span className="text-green-600">⭐</span>
            )}
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
          <Link
            href={article.source_url || `/article/${article.id}`}
            target={article.source_url ? "_blank" : "_self"}
            rel={article.source_url ? "noopener noreferrer" : undefined}
            className="text-sm text-purple-600 hover:text-purple-800 font-medium"
          >
            查看论文 →
          </Link>
          <div className="flex items-center space-x-2">
            <button
              onClick={(e) => {
                e.preventDefault();
                // 收藏功能
              }}
              className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
              title="收藏"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </button>
            <button
              onClick={(e) => {
                e.preventDefault();
                // 分享功能
              }}
              className="p-1.5 text-gray-400 hover:text-purple-500 transition-colors"
              title="分享"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
