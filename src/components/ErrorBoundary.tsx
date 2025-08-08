'use client';

import React, { Component, ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              出现了一些问题
            </h2>
            
            <p className="text-gray-600 mb-6">
              页面遇到了意外错误，请尝试刷新页面或稍后再试。
            </p>
            
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="text-left mb-4 p-3 bg-gray-100 rounded text-sm">
                <summary className="cursor-pointer font-medium text-gray-700 mb-2">
                  错误详情 (开发模式)
                </summary>
                <pre className="whitespace-pre-wrap text-red-600 text-xs">
                  {this.state.error.toString()}
                </pre>
              </details>
            )}
            
            <div className="space-y-3">
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg transition-colors"
              >
                刷新页面
              </button>
              
              <button
                onClick={() => window.history.back()}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg transition-colors"
              >
                返回上一页
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// 简化的错误显示组件
interface ErrorDisplayProps {
  error: string | Error;
  onRetry?: () => void;
  title?: string;
  showDetails?: boolean;
}

export function ErrorDisplay({ 
  error, 
  onRetry, 
  title = "加载失败", 
  showDetails = false 
}: ErrorDisplayProps) {
  const errorMessage = typeof error === 'string' ? error : error.message;
  
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <AlertCircle className="w-8 h-8 text-red-500" />
      </div>
      
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      
      <p className="text-gray-600 mb-4">
        {errorMessage || '发生了未知错误，请稍后重试'}
      </p>
      
      {showDetails && typeof error === 'object' && error.stack && (
        <details className="text-left mb-4 p-3 bg-gray-100 rounded text-sm">
          <summary className="cursor-pointer font-medium text-gray-700 mb-2">
            错误详情
          </summary>
          <pre className="whitespace-pre-wrap text-red-600 text-xs">
            {error.stack}
          </pre>
        </details>
      )}
      
      {onRetry && (
        <button 
          onClick={onRetry}
          className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-colors"
        >
          重试
        </button>
      )}
    </div>
  );
}

// 网络错误处理组件
export function NetworkError({ onRetry }: { onRetry?: () => void }) {
  return (
    <ErrorDisplay
      error="网络连接失败，请检查您的网络连接"
      onRetry={onRetry}
      title="网络错误"
    />
  );
}

// 数据加载错误组件
export function DataLoadError({ onRetry }: { onRetry?: () => void }) {
  return (
    <ErrorDisplay
      error="数据加载失败，请稍后重试"
      onRetry={onRetry}
      title="加载失败"
    />
  );
}
