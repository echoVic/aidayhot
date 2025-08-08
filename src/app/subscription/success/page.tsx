'use client';

import Link from 'next/link';
import { CheckCircle, Home, Mail } from 'lucide-react';

export default function SubscriptionSuccessPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          订阅确认成功！
        </h1>
        
        <div className="text-gray-600 mb-8 space-y-3">
          <p>
            🎉 恭喜！您已成功确认订阅 AI 日报。
          </p>
          <p>
            从明天开始，您将每日收到精选的 AI 技术资讯和深度分析。
          </p>
        </div>

        <div className="bg-blue-50 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-center mb-2">
            <Mail className="w-5 h-5 text-blue-600 mr-2" />
            <span className="text-blue-800 font-medium">您将收到：</span>
          </div>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• 每日精选 AI 技术资讯</li>
            <li>• 深度分析和行业洞察</li>
            <li>• 开源项目和工具推荐</li>
            <li>• 社区讨论和热门话题</li>
          </ul>
        </div>
        
        <div className="space-y-3">
          <Link
            href="/"
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            返回首页
          </Link>
          
          <p className="text-xs text-gray-500">
            如需取消订阅，每封邮件底部都有取消订阅链接
          </p>
        </div>
      </div>
    </div>
  );
}
