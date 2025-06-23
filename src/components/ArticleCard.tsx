import Image from 'next/image';
import Link from 'next/link';
import type { Article } from '../lib/supabase';

interface ArticleCardProps {
  article: Article;
  layout?: 'grid' | 'list';
  onClick?: () => void;
}

export default function ArticleCard({ article, layout = 'grid', onClick }: ArticleCardProps) {
  const handleClick = () => {
    if (onClick) {
      onClick();
    }
  };

  // 格式化日期显示
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('zh-CN');
    } catch {
      return dateString;
    }
  };

  // 格式化数字显示
  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
  };

  if (layout === 'list') {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200">
        <div className="p-6">
          <div className="flex items-start space-x-4">
            {article.image_url && (
              <div className="flex-shrink-0">
                <Image
                  src={article.image_url}
                  alt={article.title}
                  width={120}
                  height={80}
                  className="rounded-lg object-cover"
                />
              </div>
            )}
            <div className="flex-1 min-w-0">
              {/* 标题和标签 */}
              <div className="flex items-center space-x-2 mb-2">
                <Link
                  href={article.source_url || `/article/${article.id}`}
                  target={article.source_url ? "_blank" : "_self"}
                  rel={article.source_url ? "noopener noreferrer" : undefined}
                  onClick={handleClick}
                  className="text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors line-clamp-2"
                >
                  {article.title}
                </Link>
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
              
              {/* 摘要 */}
              <p className="text-gray-600 text-sm leading-relaxed mb-3 line-clamp-2">
                {article.summary}
              </p>
              
              {/* 标签 */}
              <div className="flex flex-wrap gap-2 mb-3">
                {article.tags?.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-2 py-1 text-xs text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 cursor-pointer"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
              
              {/* 元信息 */}
              <div className="flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center space-x-4">
                  <span className="flex items-center space-x-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span>{article.author}</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{formatDate(article.publish_time)}</span>
                  </span>
                  <span>{article.read_time} 阅读</span>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="flex items-center space-x-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    <span>{formatNumber(article.views)}</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    <span>{formatNumber(article.likes)}</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200 overflow-hidden">
      {/* 图片 */}
      {article.image_url && (
        <div className="relative h-48 bg-gray-200">
          <Image
            src={article.image_url}
            alt={article.title}
            fill
            className="object-cover"
          />
          <div className="absolute top-3 left-3 flex space-x-2">
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
      )}
      
      <div className="p-6">
        {/* 分类 */}
        <div className="flex items-center justify-between mb-3">
          <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded-md">
            {article.category}
          </span>
          <span className="text-xs text-gray-500">{article.read_time} 阅读</span>
        </div>
        
        {/* 标题 */}
        <a
          href={article.source_url || `/article/${article.id}`}
          target={article.source_url ? "_blank" : "_self"}
          rel={article.source_url ? "noopener noreferrer" : undefined}
          onClick={handleClick}
          className="block text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors mb-3 line-clamp-2"
        >
          {article.title}
        </a>
        
        {/* 摘要 */}
        <p className="text-gray-600 text-sm leading-relaxed mb-4 line-clamp-3">
          {article.summary}
        </p>
        
        {/* 标签 */}
        <div className="flex flex-wrap gap-2 mb-4">
          {article.tags?.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center px-2 py-1 text-xs text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 cursor-pointer"
            >
              #{tag}
            </span>
          ))}
        </div>
        
        {/* 元信息 */}
        <div className="flex items-center justify-between text-xs text-gray-500 pt-4 border-t border-gray-100">
          <div className="flex items-center space-x-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span>{article.author}</span>
            <span>•</span>
            <span>{formatDate(article.publish_time)}</span>
          </div>
          <div className="flex items-center space-x-3">
            <span className="flex items-center space-x-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              <span>{formatNumber(article.views)}</span>
            </span>
            <span className="flex items-center space-x-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <span>{formatNumber(article.likes)}</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
} 