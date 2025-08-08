import { Metadata } from 'next';

export const metadata: Metadata = {
  title: "订阅成功 - AI每日热点",
  description: "您已成功订阅AI每日热点资讯邮件。每日获取最新AI技术动态、行业分析和开源项目推荐。",
  keywords: ["AI订阅", "AI日报", "技术资讯", "邮件订阅", "人工智能", "技术动态"],
  openGraph: {
    title: "订阅成功 - AI每日热点",
    description: "您已成功订阅AI每日热点资讯邮件",
    type: "website",
    images: [{
      url: "https://aidayhot.com/og-subscription-success.png",
      alt: "AI每日热点订阅成功"
    }]
  },
  twitter: {
    card: "summary",
    title: "订阅成功 - AI每日热点",
    description: "您已成功订阅AI每日热点资讯邮件"
  }
};