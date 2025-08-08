import { Metadata } from 'next';

export const metadata: Metadata = {
  title: '技术动态 - AI每日热点',
  description: '最新AI技术动态、开源项目、工具发布和技术突破资讯。每日更新ChatGPT、OpenAI、机器学习、深度学习等技术领域的最新进展。',
  keywords: [
    'AI技术动态', '开源项目', '技术突破', 'ChatGPT技术', 'OpenAI更新',
    '机器学习技术', '深度学习技术', 'AI工具发布', '技术资讯', 'AI开发'
  ],
  openGraph: {
    title: '技术动态 - AI每日热点',
    description: '最新AI技术动态和开源项目资讯',
    type: 'website',
    locale: 'zh_CN',
    siteName: 'AI每日热点',
    url: 'https://aidayhot.com/tech',
    images: [
      {
        url: 'https://aidayhot.com/og-tech.png',
        width: 1200,
        height: 630,
        alt: 'AI技术动态 - 最新技术资讯',
        type: 'image/png'
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: '技术动态 - AI每日热点',
    description: '最新AI技术动态和开源项目资讯',
    images: ['https://aidayhot.com/og-tech.png'],
  },
  alternates: {
    canonical: 'https://aidayhot.com/tech',
  },
};