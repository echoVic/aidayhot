import LadderIcon from '@/components/LadderIcon';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="text-center">
        {/* 梯子图标 */}
        <div className="mb-8 flex justify-center">
          <LadderIcon />
        </div>

        {/* 主标题 */}
        <h1 className="text-6xl font-bold text-gray-800 mb-4">404</h1>
        
        {/* 副标题 */}
        <h2 className="text-2xl font-semibold text-gray-700 mb-6">页面未找到</h2>
        
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
            <div className="bg-indigo-500 h-2 rounded-full w-3/4 animate-pulse"></div>
          </div>
          
          {/* 返回首页按钮 */}
          <Link
            href="/"
            className="inline-flex items-center px-6 py-3 bg-indigo-500 hover:bg-indigo-600 text-white font-medium rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg"
          >
            <svg
              className="w-5 h-5 mr-2"
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
            返回首页
          </Link>
        </div>
        
        {/* 底部装饰 */}
        <div className="mt-8 text-sm text-gray-500">
          <p>我们正在努力建设更好的体验</p>
        </div>
      </div>
    </div>
  );
} 