'use client';

import { useMemoizedFn } from 'ahooks';
import { useState } from 'react';
import type { Article } from '../lib/supabase';
import { formatDistanceToNow } from '../lib/utils';
import { Play, Pause, Eye, Heart, Bookmark, Share2 } from 'lucide-react';

interface CommunityCardProps {
  article: Article;
  layout: 'grid' | 'list';
  onClick?: () => void;
}

export default function CommunityCard({ article, layout, onClick }: CommunityCardProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showFullContent, setShowFullContent] = useState(false);

  const handleCardClick = useMemoizedFn(() => {
    onClick?.();
    if (article?.source_url) {
      window.open(article.source_url, '_blank', 'noopener,noreferrer');
    }
  });

  const handlePlayPodcast = useMemoizedFn((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsPlaying(!isPlaying);
    // 这里可以集成实际的音频播放逻辑
  });

  const handleToggleContent = useMemoizedFn((e: React.MouseEvent) => {
    e.stopPropagation();
    setShowFullContent(!showFullContent);
  });

  // 安全检查：确保article对象存在且有效
  if (!article || typeof article !== 'object') {
    console.warn('CommunityCard: 无效的article数据', article);
    return null;
  }

  // 直接根据分类判断是否为播客
  const isPodcast = article.category === '播客';
  
  // 直接根据分类判断是否为社交媒体
  const isSocialMedia = article.category === '社交媒体';

  // 获取内容类型图标和颜色
  const getContentTypeInfo = () => {
    if (isPodcast) {
      return {
        icon: '🎙️',
        label: '播客节目',
        bgColor: 'bg-purple-50',
        borderColor: 'border-purple-200',
        textColor: 'text-purple-800'
      };
    } else if (isSocialMedia) {
      return {
        icon: '💬',
        label: '社交媒体',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
        textColor: 'text-blue-800'
      };
    } else {
      return {
        icon: '📄',
        label: '社区内容',
        bgColor: 'bg-gray-50',
        borderColor: 'border-gray-200',
        textColor: 'text-gray-800'
      };
    }
  };

  const contentTypeInfo = getContentTypeInfo();

  // 处理HTML内容并截断显示
  const summary = article.summary || '暂无摘要';

  // 清理HTML标签，提取纯文本用于显示
  const cleanText = (htmlString: string) => {
    // 移除HTML标签
    const textOnly = htmlString.replace(/<[^>]*>/g, '');
    // 解码HTML实体
    const decoded = textOnly
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, ' ');
    return decoded.trim();
  };

  const cleanSummary = cleanText(summary);
  const truncatedSummary = cleanSummary.length > 150
    ? cleanSummary.substring(0, 150) + '...'
    : cleanSummary;

  const displaySummary = showFullContent ? cleanSummary : truncatedSummary;

  return (
    <div
      className={`bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 cursor-pointer group ${
        layout === 'grid' ? 'p-4' : 'p-4'
      }`}
      onClick={handleCardClick}
    >
      {/* 内容类型标识 */}
      <div className="flex items-center justify-between mb-3">
        <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${contentTypeInfo.bgColor} ${contentTypeInfo.textColor} ${contentTypeInfo.borderColor} border`}>
          <span className="mr-1">{contentTypeInfo.icon}</span>
          {contentTypeInfo.label}
        </div>
        
        {/* 发布时间 */}
        <span className="text-xs text-gray-500">
          {formatDistanceToNow(new Date(article.publish_time || new Date()))}
        </span>
      </div>

      {/* 标题 */}
      <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
        {article.title || '无标题'}
      </h3>

      {/* 作者信息 */}
      <div className="flex items-center mb-3">
        <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
          {(article.author || '未知').charAt(0).toUpperCase()}
        </div>
        <div className="ml-2">
          <p className="text-sm font-medium text-gray-900">{article.author || '未知作者'}</p>
          {article.source_name && (
            <p className="text-xs text-gray-500">{article.source_name}</p>
          )}
        </div>
      </div>

      {/* 播客特殊控制 */}
      {isPodcast && (
        <div>
          {/* <div className="mb-3 p-3 bg-purple-50 rounded-lg border border-purple-100">
           <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <button
                onClick={handlePlayPodcast}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                  isPlaying 
                    ? 'bg-purple-600 text-white' 
                    : 'bg-white text-purple-600 border border-purple-300 hover:bg-purple-50'
                }`}
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5" />
                ) : (
                  <Play className="w-5 h-5 ml-0.5" />
                )}
              </button>
              <div className="text-sm">
                <p className="font-medium text-purple-900">
                  {isPlaying ? '正在播放' : '点击播放'}
                </p>
                <p className="text-purple-600">
                  {article.read_time || '未知时长'}
                </p>
              </div>
            </div> */}
            
            {/* 播放进度条（模拟） */}
            {/* <div className="flex-1 mx-4">
              <div className="w-full bg-purple-200 rounded-full h-1">
                <div 
                  className="bg-purple-600 h-1 rounded-full transition-all duration-300"
                  style={{ width: isPlaying ? '30%' : '0%' }}
                ></div>
              </div>
            </div>
          </div> 
        </div> */}
        </div>
      )}

      {/* 内容摘要 */}
      <div className="mb-3">
        <p className="text-gray-700 text-sm leading-relaxed">
          {displaySummary}
        </p>
        {summary.length > 150 && (
          <button
            onClick={handleToggleContent}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium mt-1 transition-colors"
          >
            {showFullContent ? '收起' : '展开'}
          </button>
        )}
      </div>

      {/* 标签 */}
      {article.tags && Array.isArray(article.tags) && article.tags.length > 0 && (() => {
        // 安全处理标签数据，确保只渲染字符串
        const safeExtractTag = (tag: any): string | null => {
          if (typeof tag === 'string') return tag.trim() || null;
          if (typeof tag === 'object' && tag !== null) {
            // 处理 XML 对象，如 {@_term: "value", @_scheme: "scheme"}
            if (tag['@_term']) return String(tag['@_term']).trim() || null;
            if (tag['#text']) return String(tag['#text']).trim() || null;
            if (tag._) return String(tag._).trim() || null;
            // 获取对象的第一个字符串值
            const values = Object.values(tag);
            for (const value of values) {
              if (typeof value === 'string' && value.trim()) {
                return value.trim();
              }
            }
          }
          return null;
        };

        const validTags = article.tags
          .map(safeExtractTag)
          .filter((tag): tag is string => tag !== null && tag.length > 0);

        if (validTags.length === 0) return null;

        return (
          <div className="flex flex-wrap gap-1 mb-3">
            {validTags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="inline-block px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md"
              >
                #{tag}
              </span>
            ))}
            {validTags.length > 3 && (
              <span className="inline-block px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md">
                +{validTags.length - 3}
              </span>
            )}
          </div>
        );
      })()}

      {/* 底部统计信息 */}
      <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-gray-100">
        <div className="flex items-center space-x-4">
          <span className="flex items-center">
            <Eye className="w-4 h-4 mr-1" />
            {article.views || 0}
          </span>
          <span className="flex items-center">
            <Heart className="w-4 h-4 mr-1" />
            {article.likes || 0}
          </span>
        </div>
        
        {/* 操作按钮 */}
        <div className="flex items-center space-x-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              // 收藏功能
            }}
            className="p-1 rounded hover:bg-gray-100 transition-colors"
            title="收藏"
          >
            <Bookmark className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              // 分享功能
            }}
            className="p-1 rounded hover:bg-gray-100 transition-colors"
            title="分享"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
