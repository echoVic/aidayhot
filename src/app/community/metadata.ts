import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI社区动态 - AI每日热点',
  description: '探索AI社区的最新动态、热门讨论、开源项目和技术分享。汇集GitHub趋势、技术博客、社交媒体讨论等社区内容。',
  keywords: [
    'AI社区', '开源项目', 'GitHub趋势', '技术博客', 'AI讨论', '社区动态',
    '开发者社区', '技术分享', 'AI开源', '机器学习项目', '深度学习框架'
  ],
  openGraph: {
    title: 'AI社区动态 - AI每日热点',
    description: '探索AI社区的最新动态、热门讨论、开源项目和技术分享',
    type: 'website',
    locale: 'zh_CN',
    siteName: 'AI每日热点',
    url: 'https://aidayhot.com/community',
    images: [
      {
        url: 'https://aidayhot.com/og-community.png',
        width: 1200,
        height: 630,
        alt: 'AI社区动态 - 开源项目和技术分享',
        type: 'image/png'
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI社区动态 - AI每日热点',
    description: '探索AI社区的最新动态、热门讨论、开源项目和技术分享',
    images: ['https://aidayhot.com/og-community.png'],
  },
  alternates: {
    canonical: 'https://aidayhot.com/community',
  },
};