import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "技术动态 - AI每日热点",
  description: "最新的开源项目、技术问答和开发趋势。发现GitHub热门项目，解决StackOverflow技术难题。",
  keywords: "GitHub, StackOverflow, 开源项目, 技术问答, 编程, 开发, 技术趋势",
  openGraph: {
    title: '技术动态 - AI每日热点',
    description: '最新的开源项目、技术问答和开发趋势',
    type: 'website',
    locale: 'zh_CN',
  },
  twitter: {
    card: 'summary_large_image',
    title: '技术动态 - AI每日热点',
    description: '最新的开源项目、技术问答和开发趋势',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function TechLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
