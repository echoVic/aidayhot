/**
 * 统一的类型定义文件
 * 包含项目中所有共享的接口和类型定义
 */

// 文章数据接口
export interface ArticleData {
  title: string;
  summary: string;
  original_summary?: string; // 原始简短摘要（爬虫获取）
  source_url: string;
  source_name: string;
  publish_time: string;
}

// 新闻条目接口（用于组件显示）
export interface NewsItem {
  title: string;
  url: string;
  publishTime: string;
  aiSummary?: string;
  source: string;
  imageUrl?: string;
  tags?: string[];
}

// 日报内容接口
export interface DailyReportContent {
  articles: NewsItem[];
  metadata: {
    totalArticles: number;
    sources: string[];
    categories?: string[];
    keywords?: string[];
    generatedAt?: string;
  };
}

// 日报数据接口
export interface DailyReportData {
  introduction: string;
  items: ArticleData[];
}

// 日报报告接口
export interface Report {
  id?: string;
  date: string;
  summary: string;
  content: DailyReportContent;
  created_at?: string;
  updated_at?: string;
}

// 聊天消息接口
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

// 通用分页结果接口
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  hasMore: boolean;
  page: number;
  pageSize: number;
}

// AI服务配置接口
export interface AIServiceConfig {
  apiKey: string;
  endpoint?: string;
  model?: string;
  token?: string;
}

// AI响应接口
export interface AIResponse {
  choices: {
    message: {
      content: string;
    };
  }[];
}

// AI相关性分析接口
export interface RelevanceAnalysis {
  isRelevant: boolean;
  score: number;
  reason: string;
}

// 组件Props基础接口
export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
}

// Modal Props interface
export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children?: React.ReactNode;
  title?: string;
}

// Share component Props interface
export interface ShareComponentProps {
  report: Report;
  isOpen: boolean;
  onClose: () => void;
}

// Card data interface
export interface CardData {
  id: string;
  title: string;
  content: NewsItem[];
  type: 'summary' | 'articles';
}

// 错误边界状态接口
export interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

// 图片状态接口
export interface ImageState {
  loading: boolean;
  error: boolean;
  loaded: boolean;
}