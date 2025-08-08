import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI学术研究 - AI每日热点',
  description: '探索最新的AI学术研究、论文发表、技术突破和前沿发现。涵盖arXiv论文、机器学习研究、深度学习论文、人工智能学术动态等。',
  keywords: [
    'AI学术研究', 'arXiv论文', '机器学习论文', '深度学习研究', '人工智能论文',
    '学术动态', '技术突破', '前沿研究', 'AI论文', '研究进展', '学术论文'
  ],
  openGraph: {
    title: 'AI学术研究 - AI每日热点',
    description: '探索最新的AI学术研究、论文发表、技术突破和前沿发现',
    type: 'website',
    locale: 'zh_CN',
    siteName: 'AI每日热点',
    url: 'https://aidayhot.com/research',
    images: [
      {
        url: 'https://aidayhot.com/og-research.png',
        width: 1200,
        height: 630,
        alt: 'AI学术研究 - 论文和技术突破',
        type: 'image/png'
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI学术研究 - AI每日热点',
    description: '探索最新的AI学术研究、论文发表、技术突破和前沿发现',
    images: ['https://aidayhot.com/og-research.png'],
  },
  alternates: {
    canonical: 'https://aidayhot.com/research',
  },
};