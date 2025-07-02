'use client';

import Link from 'next/link';
import type { Article } from '../lib/supabase';
import { formatDate, formatNumber, getLanguageColor } from '../lib/utils';

interface GitHubCardProps {
  article: Article;
  layout?: 'grid' | 'list';
  onClick?: () => void;
}

export default function GitHubCard({ article, layout = 'grid', onClick }: GitHubCardProps) {
  const handleClick = () => {
    if (onClick) {
      onClick();
    }
  };

  // 从metadata中提取GitHub特有信息
  const metadata = article.metadata as any || {};
  const stars = metadata.stars || metadata.stargazers_count || 0;
  const forks = metadata.forks || metadata.forks_count || 0;
  const language = metadata.language || metadata.primary_language || '';
  const topics = metadata.topics || [];
  const lastUpdated = metadata.updated_at || metadata.pushed_at || article.publish_time;
  const owner = metadata.owner || metadata.full_name?.split('/')[0] || '';
  const repoName = metadata.name || metadata.full_name?.split('/')[1] || '';
  const isArchived = metadata.archived || false;
  const license = metadata.license?.name || metadata.license || '';



  if (layout === 'list') {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 p-6">
        <div className="flex items-start space-x-4">
          {/* GitHub图标 */}
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-gray-900 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
            </div>
          </div>

          {/* 主要内容 */}
          <div className="flex-1 min-w-0">
            {/* 仓库名称和状态 */}
            <div className="flex items-center space-x-2 mb-2">
              <Link
                href={article.source_url || '#'}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleClick}
                className="text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors truncate"
              >
                {owner && repoName ? `${owner}/${repoName}` : article.title}
              </Link>
              {isArchived && (
                <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-yellow-600 bg-yellow-100 rounded-full">
                  📦 已归档
                </span>
              )}
              {article.is_hot && (
                <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-red-600 bg-red-100 rounded-full">
                  🔥 热门
                </span>
              )}
            </div>

            {/* 描述 */}
            <p className="text-gray-600 text-sm mb-3 line-clamp-2">
              {article.summary || '暂无描述'}
            </p>

            {/* 统计信息和元数据 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                {/* Stars */}
                <div className="flex items-center space-x-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <span>{formatNumber(stars)}</span>
                </div>

                {/* Forks */}
                <div className="flex items-center space-x-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <span>{formatNumber(forks)}</span>
                </div>

                {/* 编程语言 */}
                {language && (
                  <div className="flex items-center space-x-1">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: getLanguageColor(language) }}
                    ></div>
                    <span>{language}</span>
                  </div>
                )}

                {/* 许可证 */}
                {license && (
                  <div className="flex items-center space-x-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{license}</span>
                  </div>
                )}

                {/* 更新时间 */}
                <span>更新于 {formatDate(lastUpdated)}</span>
              </div>

              {/* 浏览量 */}
              <div className="text-sm text-gray-500">
                {article.views} 次浏览
              </div>
            </div>

            {/* 主题标签 */}
            {topics.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-3">
                {topics.slice(0, 5).map((topic: string, index: number) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded-md"
                  >
                    {topic}
                  </span>
                ))}
                {topics.length > 5 && (
                  <span className="text-xs text-gray-500">+{topics.length - 5} 更多</span>
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
      <div className="p-6 pb-4">
        {/* GitHub图标和仓库名 */}
        <div className="flex items-start space-x-3 mb-3">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-gray-900 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <Link
                href={article.source_url || '#'}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleClick}
                className="text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors line-clamp-1"
              >
                {repoName || article.title}
              </Link>
              {isArchived && (
                <span className="inline-flex items-center px-1.5 py-0.5 text-xs font-medium text-yellow-600 bg-yellow-100 rounded">
                  归档
                </span>
              )}
            </div>
            {owner && (
              <p className="text-sm text-gray-500 truncate">{owner}</p>
            )}
          </div>
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

        {/* 描述 */}
        <p className="text-gray-600 text-sm mb-4 line-clamp-3">
          {article.summary || '暂无描述'}
        </p>

        {/* 统计信息 */}
        <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
          <div className="flex items-center space-x-3">
            {/* Stars */}
            <div className="flex items-center space-x-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span>{formatNumber(stars)}</span>
            </div>

            {/* Forks */}
            <div className="flex items-center space-x-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <span>{formatNumber(forks)}</span>
            </div>

            {/* 浏览量 */}
            <span>{article.views} 浏览</span>
          </div>
        </div>

        {/* 编程语言和许可证 */}
        <div className="flex items-center justify-between text-sm">
          {language && (
            <div className="flex items-center space-x-1">
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: getLanguageColor(language) }}
              ></div>
              <span className="text-gray-600">{language}</span>
            </div>
          )}
          <span className="text-gray-500">
            {formatDate(lastUpdated)}
          </span>
        </div>
      </div>

      {/* 主题标签 */}
      {topics.length > 0 && (
        <div className="px-6 pb-4">
          <div className="flex flex-wrap gap-1">
            {topics.slice(0, 3).map((topic: string, index: number) => (
              <span
                key={index}
                className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded-md"
              >
                {topic}
              </span>
            ))}
            {topics.length > 3 && (
              <span className="text-xs text-gray-500 px-2 py-1">+{topics.length - 3}</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
