'use client'

import LadderIcon from '@/components/LadderIcon';
import Link from 'next/link';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="text-center">
        {/* 梯子图标 */}
        <div className="mb-8 flex justify-center">
          <LadderIcon 
            className="text-red-500"
            showError={true}
          />
        </div>

        {/* 主标题 */}
        <h1 className="text-6xl font-bold text-gray-800 mb-4">出错了</h1>
        
        {/* 副标题 */}
        <h2 className="text-2xl font-semibold text-gray-700 mb-6">页面遇到了问题</h2>
        
        {/* 建设中信息 */}
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md mx-auto">
          <div className="flex items-center justify-center mb-4">
            <div className="animate-pulse">
              <div className="w-4 h-4 bg-orange-400 rounded-full mr-2 inline-block"></div>
              <div className="w-4 h-4 bg-yellow-400 rounded-full mr-2 inline-block"></div>
              <div className="w-4 h-4 bg-green-400 rounded-full inline-block"></div>
            </div>
          </div>
          
          <p className="text-xl font-medium text-gray-800 mb-2">建设中</p>
          <p className="text-gray-600 mb-6">敬请期待...</p>
          
          {/* 进度条 */}
          <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
            <div className="bg-red-500 h-2 rounded-full w-1/2 animate-pulse"></div>
          </div>
          
          {/* 操作按钮 */}
          <div className="flex gap-4 justify-center">
            <button
              onClick={reset}
              className="inline-flex items-center px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg"
            >
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              重试
            </button>
            
            <Link
              href="/"
              className="inline-flex items-center px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white font-medium rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg"
            >
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
              首页
            </Link>
          </div>
        </div>
        
        {/* 底部装饰 */}
        <div className="mt-8 text-sm text-gray-500">
          <p>我们正在努力建设更好的体验</p>
        </div>
      </div>
    </div>
  );
} 