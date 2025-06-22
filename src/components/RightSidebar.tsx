import Link from 'next/link';

const trendingArticles = [
  {
    id: '1',
    title: 'ChatGPT-4发布重大更新，多模态能力全面提升',
    views: 12843,
    category: '大模型'
  },
  {
    id: '2',
    title: '谷歌发布新一代AI芯片TPU v5，性能提升300%',
    views: 9876,
    category: 'AI芯片'
  },
  {
    id: '3',
    title: 'Meta开源Llama 3模型，免费商用许可引发热议',
    views: 8765,
    category: '开源AI'
  },
  {
    id: '4',
    title: '自动驾驶技术新突破：百度Apollo实现L4级量产',
    views: 7654,
    category: '自动驾驶'
  },
  {
    id: '5',
    title: 'AI绘画版权争议升级：艺术家集体起诉AI公司',
    views: 6543,
    category: 'AI伦理'
  }
];

const quickLinks = [
  { name: 'AI工具导航', href: '/tools', icon: '🛠️' },
  { name: '学习资源', href: '/resources', icon: '📚' },
  { name: '技术论坛', href: '/forum', icon: '💬' },
  { name: '招聘信息', href: '/jobs', icon: '💼' },
  { name: '开源项目', href: '/projects', icon: '🚀' },
  { name: '会议活动', href: '/events', icon: '📅' },
];

const aiNews = [
  {
    title: 'OpenAI CEO称AGI将在2025年实现',
    time: '2小时前',
    source: 'TechCrunch'
  },
  {
    title: '微软Azure AI服务新增语音克隆功能',
    time: '4小时前',
    source: 'Microsoft'
  },
  {
    title: '英伟达股价再创历史新高，市值突破2万亿美元',
    time: '6小时前',
    source: 'Reuters'
  },
  {
    title: '中科院发布首个中文大模型评测基准',
    time: '8小时前',
    source: '科技日报'
  }
];

export default function RightSidebar() {
  return (
    <aside className="w-80 bg-white shadow-sm border-l border-gray-200 h-screen sticky top-16 overflow-y-auto">
      <div className="p-4 space-y-6">
        {/* 热门文章 */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <span className="mr-2">🔥</span>
            今日热门
          </h3>
          <div className="space-y-3">
            {trendingArticles.map((article, index) => (
              <Link
                key={article.id}
                href={`/article/${article.id}`}
                className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-start space-x-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                    {index + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-gray-900 line-clamp-2 mb-1">
                      {article.title}
                    </h4>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span className="bg-blue-100 text-blue-600 px-2 py-1 rounded">
                        {article.category}
                      </span>
                      <span className="flex items-center">
                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        {article.views.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* 快捷链接 */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <span className="mr-2">⚡</span>
            快捷导航
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {quickLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="flex flex-col items-center p-3 bg-gray-50 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-colors"
              >
                <span className="text-2xl mb-1">{link.icon}</span>
                <span className="text-xs font-medium text-center">{link.name}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* 实时资讯 */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <span className="mr-2">📰</span>
            实时资讯
          </h3>
          <div className="space-y-3">
            {aiNews.map((news, index) => (
              <div
                key={index}
                className="p-3 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors cursor-pointer"
              >
                <h4 className="text-sm font-medium text-gray-900 line-clamp-2 mb-2">
                  {news.title}
                </h4>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{news.source}</span>
                  <span>{news.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 广告位/推荐 */}
        <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg p-4 text-white">
          <h4 className="font-semibold mb-2">🎯 AI学习专区</h4>
          <p className="text-sm mb-3 opacity-90">
            免费AI课程、实战项目、技术分享，助你快速入门人工智能
          </p>
          <button className="w-full bg-white/20 hover:bg-white/30 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors">
            立即学习 →
          </button>
        </div>

        {/* 统计图表区域 */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 mb-3">📊 网站统计</h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">今日访问</span>
              <span className="font-medium text-blue-600">12,345</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">文章总数</span>
              <span className="font-medium text-green-600">8,976</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">用户数量</span>
              <span className="font-medium text-purple-600">45,632</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">评论数量</span>
              <span className="font-medium text-orange-600">23,456</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
} 