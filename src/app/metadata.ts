import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI每日热点 - 最新人工智能资讯聚合平台',
  description: 'AI每日热点提供最新的人工智能资讯、技术动态、行业分析、深度报告和开源项目推荐。每日更新，涵盖ChatGPT、OpenAI、机器学习、深度学习等领域。',
  keywords: [
    'AI资讯', '人工智能新闻', '技术动态', 'ChatGPT', 'OpenAI', '机器学习',
    '深度学习', '大模型', 'AI工具', 'AI应用', '每日AI资讯', 'AI日报'
  ],
  openGraph: {
    title: 'AI每日热点 - 最新人工智能资讯聚合平台',
    description: '每日更新的人工智能资讯平台，提供最新AI技术动态、行业分析和深度报告',
    type: 'website',
    locale: 'zh_CN',
    siteName: 'AI每日热点',
    url: 'https://aidayhot.com',
    images: [
      {
        url: 'https://aidayhot.com/og-home.png',
        width: 1200,
        height: 630,
        alt: 'AI每日热点 - 人工智能资讯聚合平台',
        type: 'image/png'
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI每日热点 - 最新人工智能资讯聚合平台',
    description: '每日更新的人工智能资讯平台，提供最新AI技术动态、行业分析和深度报告',
    images: ['https://aidayhot.com/og-home.png'],
  },
  alternates: {
    canonical: 'https://aidayhot.com',
  },
};