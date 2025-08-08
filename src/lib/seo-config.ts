/**
 * SEO配置中心
 * 统一管理网站的SEO设置
 */

export interface SEOConfig {
  siteName: string;
  siteUrl: string;
  defaultTitle: string;
  defaultDescription: string;
  defaultKeywords: string[];
  author: string;
  twitterHandle: string;
  locale: string;
  siteLocale: string;
  type: string;
}

export const seoConfig: SEOConfig = {
  siteName: 'AI每日热点',
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://aidayhot.com',
  defaultTitle: 'AI每日热点 - 人工智能资讯聚合平台',
  defaultDescription: 'AI每日热点提供最新的人工智能资讯、技术动态、行业分析、深度报告和开源项目推荐。每日更新，涵盖ChatGPT、OpenAI、机器学习、深度学习等领域。',
  defaultKeywords: [
    'AI', '人工智能', '机器学习', '深度学习', 'ChatGPT', 'OpenAI',
    'AI资讯', '技术动态', '行业分析', 'AI工具', 'AI应用', '大模型',
    '自然语言处理', '计算机视觉', 'AI新闻', '人工智能日报'
  ],
  author: 'AI每日热点团队',
  twitterHandle: '@aidayhot',
  locale: 'zh_CN',
  siteLocale: 'zh_CN',
  type: 'website'
};

// 页面特定的SEO配置
export const pageSEO = {
  home: {
    title: 'AI每日热点 - 最新人工智能资讯聚合平台',
    description: 'AI每日热点提供最新的人工智能资讯、技术动态、行业分析、深度报告和开源项目推荐。每日更新，涵盖ChatGPT、OpenAI、机器学习、深度学习等领域。',
    keywords: [
      'AI资讯', '人工智能新闻', '技术动态', 'ChatGPT', 'OpenAI', '机器学习',
      '深度学习', '大模型', 'AI工具', 'AI应用', '每日AI资讯', 'AI日报'
    ],
    openGraph: {
      title: 'AI每日热点 - 最新人工智能资讯聚合平台',
      description: '每日更新的人工智能资讯平台，提供最新AI技术动态、行业分析和深度报告',
      images: ['/og-home.png']
    }
  },
  tech: {
    title: '技术动态 - AI每日热点',
    description: '最新AI技术动态、开源项目、工具发布和技术突破资讯。每日更新ChatGPT、OpenAI、机器学习、深度学习等技术领域的最新进展。',
    keywords: [
      'AI技术动态', '开源项目', '技术突破', 'ChatGPT技术', 'OpenAI更新',
      '机器学习技术', '深度学习技术', 'AI工具发布', '技术资讯', 'AI开发'
    ],
    openGraph: {
      title: '技术动态 - AI每日热点',
      description: '最新AI技术动态和开源项目资讯',
      images: ['/og-tech.png']
    }
  },
  research: {
    title: '研究报告 - AI每日热点',
    description: '最新AI研究报告、学术论文、技术白皮书和行业分析。每日更新人工智能领域的最新研究成果。',
    keywords: [
      'AI研究报告', '学术论文', '技术白皮书', '行业分析', 'AI研究',
      '机器学习论文', '深度学习研究', 'AI趋势分析', '技术报告', '研究动态'
    ],
    openGraph: {
      title: '研究报告 - AI每日热点',
      description: '最新AI研究报告和学术论文资讯',
      images: ['/og-research.png']
    }
  },
  community: {
    title: '社区讨论 - AI每日热点',
    description: 'AI社区热门讨论、技术问答、经验分享和行业观点。汇聚全球AI从业者的智慧交流。',
    keywords: [
      'AI社区', '技术讨论', '经验分享', 'AI问答', '行业观点',
      '开发者社区', 'AI论坛', '技术交流', 'AI从业者', '社区动态'
    ],
    openGraph: {
      title: '社区讨论 - AI每日热点',
      description: 'AI社区热门讨论和技术问答资讯',
      images: ['/og-community.png']
    }
  },
  subscription: {
    title: '订阅服务 - AI每日热点',
    description: '订阅AI每日热点，获取个性化AI资讯推送。支持邮件订阅、RSS订阅和API接口。',
    keywords: [
      'AI订阅', '邮件订阅', 'RSS订阅', '资讯推送', '个性化推荐',
      'API接口', 'AI日报订阅', '技术资讯推送', '订阅服务', 'AI资讯'
    ],
    openGraph: {
      title: '订阅服务 - AI每日热点',
      description: '个性化AI资讯订阅服务',
      images: ['/og-subscription.png']
    }
  }
};

// 文章分类的SEO配置
export const categorySEO = {
  '大模型': {
    keywords: ['大语言模型', 'LLM', 'GPT', 'Claude', '大模型应用', 'AI大模型'],
    description: '最新大语言模型技术动态和应用案例'
  },
  'AI芯片': {
    keywords: ['AI芯片', 'GPU', 'NPU', '芯片技术', 'AI硬件', '算力'],
    description: 'AI芯片技术发展和硬件创新资讯'
  },
  '开源AI': {
    keywords: ['开源AI', '开源项目', 'GitHub', '开源模型', '开源工具', 'AI开源'],
    description: '开源AI项目和工具的最新动态'
  },
  '自动驾驶': {
    keywords: ['自动驾驶', '无人驾驶', '智能汽车', '自动驾驶技术', '车联网', 'ADAS'],
    description: '自动驾驶技术发展和行业应用资讯'
  },
  'AI伦理': {
    keywords: ['AI伦理', 'AI安全', '算法偏见', 'AI治理', '人工智能伦理', 'AI监管'],
    description: 'AI伦理、安全和治理相关资讯和讨论'
  },
  '机器学习': {
    keywords: ['机器学习', 'ML', '深度学习', '神经网络', '算法', '模型训练'],
    description: '机器学习算法、模型和应用的最新进展'
  },
  '深度学习': {
    keywords: ['深度学习', 'DL', '神经网络', 'CNN', 'RNN', 'Transformer'],
    description: '深度学习技术、模型架构和应用的最新发展'
  }
};

// 结构化数据模板
export const structuredDataTemplates = {
  website: {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: seoConfig.siteName,
    url: seoConfig.siteUrl,
    description: seoConfig.defaultDescription,
    publisher: {
      '@type': 'Organization',
      name: seoConfig.siteName,
      url: seoConfig.siteUrl
    }
  },
  
  organization: {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: seoConfig.siteName,
    url: seoConfig.siteUrl,
    logo: `${seoConfig.siteUrl}/logo.png`,
    description: seoConfig.defaultDescription,
    sameAs: [
      'https://twitter.com/aidayhot',
      'https://github.com/aidayhot'
    ]
  },

  breadcrumb: (items: Array<{name: string; url: string}>) => ({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url
    }))
  }),

  article: (article: any) => ({
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: article.title,
    description: article.summary || article.description,
    image: article.image || `${seoConfig.siteUrl}/og-default.png`,
    datePublished: article.publish_time || article.created_at,
    dateModified: article.updated_at || article.publish_time,
    author: {
      '@type': 'Person',
      name: article.author || seoConfig.author
    },
    publisher: {
      '@type': 'Organization',
      name: seoConfig.siteName,
      logo: {
        '@type': 'ImageObject',
        url: `${seoConfig.siteUrl}/logo.png`
      }
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': article.url || `${seoConfig.siteUrl}/article/${article.id}`
    }
  })
};

// 图片SEO优化配置
export const imageSEO = {
  formats: ['image/webp', 'image/avif', 'image/jpeg', 'image/png'],
  sizes: {
    thumbnail: { width: 150, height: 150 },
    small: { width: 300, height: 200 },
    medium: { width: 600, height: 400 },
    large: { width: 1200, height: 630 },
    og: { width: 1200, height: 630 }
  },
  altTemplates: {
    article: (title: string, category?: string) => 
      `${title} - ${category ? category + ' ' : ''}AI每日热点`,
    category: (category: string) => 
      `${category} - AI每日热点分类页面`,
    homepage: 'AI每日热点 - 人工智能资讯聚合平台首页'
  }
};

// 元标签模板
export const metaTemplates = {
  title: (pageTitle?: string, siteName = seoConfig.siteName) => 
    pageTitle ? `${pageTitle} | ${siteName}` : siteName,
  
  description: (desc?: string) => desc || seoConfig.defaultDescription,
  
  keywords: (keywords?: string[], additional?: string[]) => 
    [...(keywords || []), ...(additional || []), ...seoConfig.defaultKeywords].join(', '),
  
  canonical: (path?: string) => path ? `${seoConfig.siteUrl}${path}` : seoConfig.siteUrl,
  
  ogUrl: (path?: string) => path ? `${seoConfig.siteUrl}${path}` : seoConfig.siteUrl
};