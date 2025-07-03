/**
 * 社区动态相关的类型定义
 */

import type { Article } from '../lib/supabase';

/**
 * 社区内容类型
 */
export type CommunityContentType = '全部' | '社交媒体' | '播客';

/**
 * 排序方式
 */
export type SortBy = 'latest' | 'popular' | 'trending';

/**
 * 视图模式
 */
export type ViewMode = 'grid' | 'list';

/**
 * 社区动态文章（扩展基础Article类型）
 */
export interface CommunityArticle extends Article {
  /** 是否为播客内容 */
  isPodcast?: boolean;
  /** 是否为社交媒体内容 */
  isSocialMedia?: boolean;
  /** 播客时长（分钟） */
  duration?: number;
  /** 播放次数 */
  playCount?: number;
  /** 社交媒体平台 */
  platform?: string;
  /** 原始帖子ID */
  originalPostId?: string;
  /** 转发数 */
  shareCount?: number;
  /** 评论数 */
  commentCount?: number;
}

/**
 * 筛选器配置
 */
export interface CommunityFilterConfig {
  /** 选中的内容类型 */
  selectedContentType: CommunityContentType;
  /** 排序方式 */
  sortBy: SortBy;
  /** 视图模式 */
  viewMode: ViewMode;
  /** 筛选变化回调 */
  onFilterChange: (filters: Partial<CommunityFilterConfig>) => void;
}

/**
 * 社区卡片属性
 */
export interface CommunityCardProps {
  /** 文章数据 */
  article: CommunityArticle;
  /** 布局模式 */
  layout: ViewMode;
  /** 点击回调 */
  onClick?: () => void;
  /** 播放回调（播客专用） */
  onPlay?: (articleId: string) => void;
  /** 收藏回调 */
  onBookmark?: (articleId: string) => void;
  /** 分享回调 */
  onShare?: (articleId: string) => void;
}

/**
 * 播客播放状态
 */
export interface PodcastPlayState {
  /** 是否正在播放 */
  isPlaying: boolean;
  /** 当前播放进度（0-100） */
  progress: number;
  /** 当前播放时间（秒） */
  currentTime: number;
  /** 总时长（秒） */
  duration: number;
  /** 音量（0-1） */
  volume: number;
}

/**
 * 社区动态加载状态
 */
export interface CommunityLoadingState {
  /** 是否正在初始加载 */
  loading: boolean;
  /** 是否正在加载更多 */
  loadingMore: boolean;
  /** 错误信息 */
  error: string | null;
  /** 是否有更多数据 */
  hasMore: boolean;
  /** 当前页码 */
  page: number;
  /** 总数量 */
  total: number;
}

/**
 * 社区内容统计信息
 */
export interface CommunityStats {
  /** 总内容数 */
  totalContent: number;
  /** 社交媒体内容数 */
  socialMediaCount: number;
  /** 播客内容数 */
  podcastCount: number;
  /** 今日新增 */
  todayCount: number;
  /** 本周新增 */
  weekCount: number;
}

/**
 * 内容类型信息
 */
export interface ContentTypeInfo {
  /** 图标 */
  icon: string;
  /** 标签文本 */
  label: string;
  /** 背景颜色类名 */
  bgColor: string;
  /** 边框颜色类名 */
  borderColor: string;
  /** 文字颜色类名 */
  textColor: string;
}

/**
 * 社区动态搜索参数
 */
export interface CommunitySearchParams {
  /** 搜索关键词 */
  query: string;
  /** 内容类型筛选 */
  contentType?: CommunityContentType;
  /** 排序方式 */
  sortBy?: SortBy;
  /** 页码 */
  page?: number;
  /** 每页数量 */
  pageSize?: number;
  /** 标签筛选 */
  tags?: string[];
  /** 时间范围筛选 */
  dateRange?: {
    start: Date;
    end: Date;
  };
}

/**
 * 社区动态API响应
 */
export interface CommunityApiResponse {
  /** 内容列表 */
  data: CommunityArticle[];
  /** 总数量 */
  total: number;
  /** 是否有更多 */
  hasMore: boolean;
  /** 当前页码 */
  page: number;
  /** 每页数量 */
  pageSize: number;
  /** 统计信息 */
  stats?: CommunityStats;
}

/**
 * 播客控制器属性
 */
export interface PodcastControllerProps {
  /** 播客文章 */
  article: CommunityArticle;
  /** 播放状态 */
  playState: PodcastPlayState;
  /** 播放控制回调 */
  onPlay: () => void;
  /** 暂停控制回调 */
  onPause: () => void;
  /** 进度变化回调 */
  onProgressChange: (progress: number) => void;
  /** 音量变化回调 */
  onVolumeChange: (volume: number) => void;
}

/**
 * 社交媒体平台信息
 */
export interface SocialMediaPlatform {
  /** 平台名称 */
  name: string;
  /** 平台图标 */
  icon: string;
  /** 平台颜色 */
  color: string;
  /** 平台URL模式 */
  urlPattern: string;
}

/**
 * 常用的社交媒体平台配置
 */
export const SOCIAL_MEDIA_PLATFORMS: Record<string, SocialMediaPlatform> = {
  twitter: {
    name: 'Twitter',
    icon: '🐦',
    color: '#1DA1F2',
    urlPattern: 'https://twitter.com/'
  },
  weibo: {
    name: '微博',
    icon: '📱',
    color: '#E6162D',
    urlPattern: 'https://weibo.com/'
  },
  zhihu: {
    name: '知乎',
    icon: '🔍',
    color: '#0084FF',
    urlPattern: 'https://zhihu.com/'
  },
  reddit: {
    name: 'Reddit',
    icon: '🤖',
    color: '#FF4500',
    urlPattern: 'https://reddit.com/'
  }
};

/**
 * 播客平台信息
 */
export interface PodcastPlatform {
  /** 平台名称 */
  name: string;
  /** 平台图标 */
  icon: string;
  /** 平台颜色 */
  color: string;
  /** 是否支持在线播放 */
  supportsStreaming: boolean;
}

/**
 * 常用的播客平台配置
 */
export const PODCAST_PLATFORMS: Record<string, PodcastPlatform> = {
  spotify: {
    name: 'Spotify',
    icon: '🎵',
    color: '#1DB954',
    supportsStreaming: true
  },
  apple: {
    name: 'Apple Podcasts',
    icon: '🎧',
    color: '#A855F7',
    supportsStreaming: false
  },
  google: {
    name: 'Google Podcasts',
    icon: '🎙️',
    color: '#4285F4',
    supportsStreaming: true
  },
  xiaoyuzhou: {
    name: '小宇宙',
    icon: '🌌',
    color: '#FF6B35',
    supportsStreaming: true
  }
};
