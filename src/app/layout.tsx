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
  title: "AI每日热点 - 人工智能资讯聚合平台",
  description: "提供最新最热的AI人工智能资讯、技术动态、行业分析和深度报告。",
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: '32x32', type: 'image/x-icon' }
    ],
    apple: { url: '/favicon.svg', type: 'image/svg+xml' },
  },
  keywords: 'AI, 人工智能, 机器学习, 深度学习, ChatGPT, OpenAI',
  authors: [{ name: 'AI每日热点团队' }],
  viewport: 'width=device-width, initial-scale=1',
  openGraph: {
    title: 'AI每日热点',
    description: '人工智能资讯聚合平台',
    type: 'website',
    locale: 'zh_CN',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI每日热点',
    description: '人工智能资讯聚合平台',
  },
  robots: 'index, follow',
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
