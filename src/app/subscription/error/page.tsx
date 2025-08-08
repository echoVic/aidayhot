'use client';

import Link from 'next/link';
import { AlertCircle, Home, RefreshCw } from 'lucide-react';

export default function SubscriptionErrorPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertCircle className="w-8 h-8 text-red-600" />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          验证失败
        </h1>
        
        <div className="text-gray-600 mb-8 space-y-3">
          <p>
            很抱歉，邮箱验证失败。这可能是因为：
          </p>
          <ul className="text-sm text-left space-y-1 bg-gray-50 p-4 rounded-lg">
            <li>• 验证链接已过期</li>
            <li>• 验证链接已被使用</li>
            <li>• 链接格式不正确</li>
          </ul>
        </div>
        
        <div className="space-y-3">
          <Link
            href="/"
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            重新订阅
          </Link>
          
          <Link
            href="/"
            className="w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-lg hover:bg-gray-200 transition-colors inline-flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            返回首页
          </Link>
        </div>
        
        <div className="mt-6 pt-4 border-t border-gray-100">
          <p className="text-xs text-gray-500">
            如果问题持续存在，请联系我们的技术支持
          </p>
        </div>
      </div>
    </div>
  );
}
