'use client';

import EmailSubscription from './EmailSubscription';
import { Rss, Mail, TrendingUp } from 'lucide-react';

export default function SubscriptionSidebar() {
  return (
    <div className="w-80 bg-white border-l border-gray-200 p-6 space-y-6 overflow-y-auto">
      {/* 订阅方式标题 */}
      <div className="text-center">
        <h2 className="text-xl font-bold text-gray-900 mb-2">订阅 AI 日报</h2>
        <p className="text-sm text-gray-600">选择您喜欢的订阅方式</p>
      </div>

      {/* RSS 订阅 */}
      <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
        <div className="flex items-center mb-3">
          <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center mr-3">
            <Rss className="w-4 h-4 text-white" />
          </div>
          <h3 className="font-semibold text-gray-900">RSS 订阅</h3>
        </div>
        <p className="text-sm text-gray-600 mb-3">
          使用 RSS 阅读器实时获取最新内容
        </p>
        <div className="flex gap-2">
          <a
            href="/rss.xml"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 bg-orange-500 text-white text-sm py-2 px-3 rounded hover:bg-orange-600 transition-colors text-center"
          >
            RSS 链接
          </a>
          <a
            href="/rss.xml?limit=50"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 bg-orange-100 text-orange-700 text-sm py-2 px-3 rounded hover:bg-orange-200 transition-colors text-center"
          >
            更多条目
          </a>
        </div>
      </div>

      {/* 邮箱订阅 */}
      <EmailSubscription size="sm" showDescription={false} />

      {/* 订阅统计 */}
      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
        <div className="flex items-center mb-3">
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mr-3">
            <TrendingUp className="w-4 h-4 text-white" />
          </div>
          <h3 className="font-semibold text-gray-900">订阅统计</h3>
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">RSS 订阅者</span>
            <span className="font-medium text-blue-600">1,234+</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">邮箱订阅者</span>
            <span className="font-medium text-blue-600">856+</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">日均阅读量</span>
            <span className="font-medium text-blue-600">5,678+</span>
          </div>
        </div>
      </div>

      {/* 推荐阅读器 */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="font-semibold text-gray-900 mb-3">推荐 RSS 阅读器</h3>
        <div className="space-y-2 text-sm">
          <a
            href="https://feedly.com"
            target="_blank"
            rel="noopener noreferrer"
            className="block text-blue-600 hover:text-blue-800 hover:underline"
          >
            📱 Feedly (跨平台)
          </a>
          <a
            href="https://reederapp.com"
            target="_blank"
            rel="noopener noreferrer"
            className="block text-blue-600 hover:text-blue-800 hover:underline"
          >
            🍎 Reeder (iOS/macOS)
          </a>
          <a
            href="https://www.inoreader.com"
            target="_blank"
            rel="noopener noreferrer"
            className="block text-blue-600 hover:text-blue-800 hover:underline"
          >
            🌐 Inoreader (Web)
          </a>
        </div>
      </div>

      {/* 帮助信息 */}
      <div className="text-xs text-gray-500 space-y-1">
        <p>💡 RSS 订阅可以实时获取更新</p>
        <p>📧 邮箱订阅每日定时推送</p>
        <p>🔒 我们承诺不会发送垃圾邮件</p>
      </div>
    </div>
  );
}
