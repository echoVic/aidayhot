import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'AI每日热点 - 人工智能资讯聚合平台',
    short_name: 'AI日报',
    description: '提供最新最热的AI人工智能资讯、技术动态、行业分析和深度报告。每日更新，涵盖ChatGPT、OpenAI、机器学习、深度学习等领域。',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#3b82f6',
    icons: [
      {
        src: '/favicon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/favicon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
    categories: ['news', 'technology', 'productivity', 'artificial-intelligence'],
    lang: 'zh-CN',
    orientation: 'portrait',
    scope: '/',
    dir: 'ltr',
    prefer_related_applications: false,
    screenshots: [
      {
        src: '/screenshot-desktop.png',
        sizes: '1280x720',
        type: 'image/png',
        form_factor: 'wide',
        label: 'AI每日热点桌面版界面',
      },
      {
        src: '/screenshot-mobile.png',
        sizes: '390x844',
        type: 'image/png',
        form_factor: 'narrow',
        label: 'AI每日热点移动版界面',
      },
    ],
  }
}