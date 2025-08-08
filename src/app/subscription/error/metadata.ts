import { Metadata } from 'next';

export const metadata: Metadata = {
  title: "订阅验证失败 - AI每日热点",
  description: "邮箱订阅验证失败页面。可能原因：验证链接过期、已被使用或格式错误。请重新订阅或联系技术支持。",
  keywords: ["订阅失败", "邮箱验证", "AI订阅", "技术资讯", "邮件订阅错误"],
  openGraph: {
    title: "订阅验证失败 - AI每日热点",
    description: "邮箱订阅验证失败，请重新订阅或联系技术支持",
    type: "website",
    images: [{
      url: "https://aidayhot.com/og-subscription-error.png",
      alt: "AI每日热点订阅失败"
    }]
  },
  twitter: {
    card: "summary",
    title: "订阅验证失败 - AI每日热点",
    description: "邮箱订阅验证失败，请重新订阅或联系技术支持"
  }
};