'use client';

import React from 'react';

interface CommunityErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

interface CommunityErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error?: Error; retry: () => void }>;
}

/**
 * 社区动态专用错误边界组件
 * 提供更友好的错误处理和恢复机制
 */
export class CommunityErrorBoundary extends React.Component<
  CommunityErrorBoundaryProps,
  CommunityErrorBoundaryState
> {
  constructor(props: CommunityErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): CommunityErrorBoundaryState {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('社区动态页面错误:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultCommunityErrorFallback;
      return <FallbackComponent error={this.state.error} retry={this.handleRetry} />;
    }

    return this.props.children;
  }
}

/**
 * 默认的社区动态错误回退组件
 */
function DefaultCommunityErrorFallback({ 
  error, 
  retry 
}: { 
  error?: Error; 
  retry: () => void; 
}) {
  return (
    <div className="flex-1 bg-gray-50 p-6">
      <div className="bg-white rounded-lg shadow-sm border border-red-200 p-8 text-center max-w-md mx-auto">
        {/* 错误图标 */}
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" 
            />
          </svg>
        </div>

        {/* 错误标题 */}
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          社区动态加载失败
        </h3>

        {/* 错误描述 */}
        <p className="text-gray-600 mb-6">
          抱歉，社区动态内容暂时无法加载。这可能是网络连接问题或服务器临时故障。
        </p>

        {/* 错误详情（开发环境） */}
        {process.env.NODE_ENV === 'development' && error && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-md text-left">
            <p className="text-sm font-medium text-red-800 mb-1">错误详情:</p>
            <p className="text-xs text-red-700 font-mono break-all">
              {error.message}
            </p>
          </div>
        )}

        {/* 操作按钮 */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={retry}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            重试加载
          </button>
          
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            刷新页面
          </button>
        </div>

        {/* 帮助信息 */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            如果问题持续存在，请尝试：
          </p>
          <ul className="text-xs text-gray-500 mt-1 space-y-1">
            <li>• 检查网络连接</li>
            <li>• 清除浏览器缓存</li>
            <li>• 稍后再试</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

/**
 * 社区动态加载骨架屏组件
 */
export function CommunityLoadingSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 animate-pulse">
          {/* 头部信息骨架 */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <div className="w-16 h-6 bg-gray-200 rounded-full"></div>
            </div>
            <div className="w-12 h-4 bg-gray-200 rounded"></div>
          </div>

          {/* 标题骨架 */}
          <div className="space-y-2 mb-3">
            <div className="h-5 bg-gray-200 rounded w-3/4"></div>
            <div className="h-5 bg-gray-200 rounded w-1/2"></div>
          </div>

          {/* 作者信息骨架 */}
          <div className="flex items-center mb-3">
            <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
            <div className="ml-2 space-y-1">
              <div className="h-4 bg-gray-200 rounded w-20"></div>
              <div className="h-3 bg-gray-200 rounded w-16"></div>
            </div>
          </div>

          {/* 内容骨架 */}
          <div className="space-y-2 mb-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>

          {/* 标签骨架 */}
          <div className="flex space-x-2 mb-3">
            <div className="w-12 h-6 bg-gray-200 rounded-md"></div>
            <div className="w-16 h-6 bg-gray-200 rounded-md"></div>
            <div className="w-14 h-6 bg-gray-200 rounded-md"></div>
          </div>

          {/* 底部统计骨架 */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-4 bg-gray-200 rounded"></div>
              <div className="w-12 h-4 bg-gray-200 rounded"></div>
            </div>
            <div className="flex space-x-2">
              <div className="w-6 h-6 bg-gray-200 rounded"></div>
              <div className="w-6 h-6 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * 社区动态空状态组件
 */
export function CommunityEmptyState({ 
  title = "暂无社区动态", 
  description = "数据正在收集中，请稍后刷新页面",
  onRefresh
}: {
  title?: string;
  description?: string;
  onRefresh?: () => void;
}) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a2 2 0 01-2-2v-6a2 2 0 012-2h8z" />
        </svg>
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-500 mb-4">{description}</p>
      {onRefresh && (
        <button
          onClick={onRefresh}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          刷新数据
        </button>
      )}
    </div>
  );
}
