import { Analytics } from "@vercel/analytics/next";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import ToastProvider from '../components/ToastProvider';
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "AI每日热点 - 人工智能资讯聚合平台",
    template: "%s | AI每日热点"
  },
  description: "AI每日热点提供最新的人工智能资讯、技术动态、行业分析、深度报告和开源项目推荐。每日更新，涵盖ChatGPT、OpenAI、机器学习、深度学习等领域。",
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: '32x32', type: 'image/x-icon' }
    ],
    apple: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }
    ],
    other: [
      { rel: 'mask-icon', url: '/favicon.svg', color: '#3b82f6' }
    ]
  },
  keywords: [
    'AI', '人工智能', '机器学习', '深度学习', 'ChatGPT', 'OpenAI', 
    'AI资讯', '技术动态', '行业分析', 'AI工具', 'AI应用', '大模型',
    '自然语言处理', '计算机视觉', 'AI新闻', '人工智能日报'
  ],
  authors: [{ name: 'AI每日热点团队', url: 'https://aidayhot.com' }],
  creator: 'AI每日热点团队',
  publisher: 'AI每日热点',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=5',
  themeColor: '#3b82f6',
  manifest: '/manifest.json',
  openGraph: {
    title: 'AI每日热点 - 人工智能资讯聚合平台',
    description: '每日更新的人工智能资讯平台，提供最新AI技术动态、行业分析和深度报告',
    type: 'website',
    locale: 'zh_CN',
    siteName: 'AI每日热点',
    url: 'https://aidayhot.com',
    images: [
      {
        url: 'https://aidayhot.com/og-image.png',
        width: 1200,
        height: 630,
        alt: 'AI每日热点 - 人工智能资讯聚合平台',
        type: 'image/png'
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI每日热点 - 人工智能资讯聚合平台',
    description: '每日更新的人工智能资讯平台，提供最新AI技术动态、行业分析和深度报告',
    site: '@aidayhot',
    creator: '@aidayhot',
    images: ['https://aidayhot.com/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: 'https://aidayhot.com',
    types: {
      'application/rss+xml': 'https://aidayhot.com/rss.xml',
    },
  },
  verification: {
    google: 'your-google-verification-code',
    yandex: 'your-yandex-verification-code',
  },
  other: {
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'default',
    'apple-mobile-web-app-title': 'AI每日热点',
    'format-detection': 'telephone=no',
    'mobile-web-app-capable': 'yes',
    'msapplication-TileColor': '#3b82f6',
    'msapplication-TileImage': '/mstile-144x144.png',
    'msapplication-config': '/browserconfig.xml',
    'baidu-site-verification': 'your-baidu-verification-code',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <head>
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9352722121175568"
          crossOrigin="anonymous"
        ></script>
        <meta name="google-adsense-account" content="ca-pub-9352722121175568" />
        <link rel="alternate" type="application/rss+xml" title="AI每日热点 RSS" href="/rss.xml" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <ToastProvider />
        <Analytics />
      </body>
    </html>
  );
}
