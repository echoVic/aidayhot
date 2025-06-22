'use client';

import Link from 'next/link';

const categories = [
  { name: '全部', href: '/', icon: '🏠', count: 1234 },
  { name: '机器学习', href: '/category/ml', icon: '🤖', count: 342 },
  { name: '深度学习', href: '/category/dl', icon: '🧠', count: 256 },
  { name: '自然语言处理', href: '/category/nlp', icon: '💬', count: 198 },
  { name: '计算机视觉', href: '/category/cv', icon: '👁️', count: 167 },
  { name: '大模型', href: '/category/llm', icon: '🔮', count: 89 },
  { name: '自动驾驶', href: '/category/auto', icon: '🚗', count: 76 },
  { name: '机器人', href: '/category/robot', icon: '🦾', count: 54 },
  { name: 'AI芯片', href: '/category/chip', icon: '💾', count: 43 },
  { name: 'AI伦理', href: '/category/ethics', icon: '⚖️', count: 32 },
];

const hotTopics = [
  { name: 'ChatGPT', count: 145 },
  { name: 'Stable Diffusion', count: 98 },
  { name: 'GPT-4', count: 87 },
  { name: 'AI绘画', count: 76 },
  { name: '智能客服', count: 65 },
  { name: 'AI写作', count: 54 },
  { name: '语音识别', count: 43 },
  { name: '图像识别', count: 32 },
];

export default function Sidebar() {
  return (
    <aside className="w-64 bg-white shadow-sm border-r border-gray-200 h-screen sticky top-16 overflow-y-auto">
      <div className="p-4">
        {/* 分类导航 */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">内容分类</h3>
          <nav className="space-y-1">
            {categories.map((category) => (
              <Link
                key={category.name}
                href={category.href}
                className="flex items-center justify-between px-3 py-2 text-sm text-gray-700 rounded-lg hover:bg-gray-100 hover:text-blue-600 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-lg">{category.icon}</span>
                  <span>{category.name}</span>
                </div>
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                  {category.count}
                </span>
              </Link>
            ))}
          </nav>
        </div>

        {/* 热门话题 */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">热门话题</h3>
          <div className="space-y-2">
            {hotTopics.map((topic, index) => (
              <div
                key={topic.name}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-sm font-medium text-blue-600">
                    #{index + 1}
                  </span>
                  <span className="text-sm text-gray-700">{topic.name}</span>
                </div>
                <span className="text-xs text-gray-500">
                  {topic.count}篇
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 统计信息 */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 text-white">
          <h4 className="font-semibold mb-2">今日数据</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>新增文章</span>
              <span className="font-medium">23</span>
            </div>
            <div className="flex justify-between">
              <span>热门阅读</span>
              <span className="font-medium">1,234</span>
            </div>
            <div className="flex justify-between">
              <span>用户访问</span>
              <span className="font-medium">5,678</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
} 