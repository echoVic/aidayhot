import Script from 'next/script'

interface StructuredDataProps {
  type: 'website' | 'article' | 'organization' | 'breadcrumb' | 'newsarticle'
  data: any
}

export function StructuredData({ type, data }: StructuredDataProps) {
  const getStructuredData = () => {
    const baseData = {
      '@context': 'https://schema.org',
      '@type': type.charAt(0).toUpperCase() + type.slice(1),
    }

    switch (type) {
      case 'website':
        return {
          ...baseData,
          '@type': 'WebSite',
          name: 'AI每日热点',
          alternateName: '人工智能资讯聚合平台',
          url: 'https://aidayhot.com',
          potentialAction: {
            '@type': 'SearchAction',
            target: {
              '@type': 'EntryPoint',
              urlTemplate: 'https://aidayhot.com/search?q={search_term_string}',
            },
            'query-input': 'required name=search_term_string',
          },
          description: '提供最新最热的AI人工智能资讯、技术动态、行业分析和深度报告',
          inLanguage: 'zh-CN',
        }

      case 'organization':
        return {
          ...baseData,
          '@type': 'Organization',
          name: 'AI每日热点',
          url: 'https://aidayhot.com',
          logo: 'https://aidayhot.com/logo.png',
          description: '人工智能资讯聚合平台',
          sameAs: [
            'https://twitter.com/aidayhot',
            'https://github.com/aidayhot',
          ],
          contactPoint: {
            '@type': 'ContactPoint',
            contactType: 'customer service',
            email: 'contact@aidayhot.com',
            availableLanguage: ['Chinese', 'English'],
          },
        }

      case 'newsarticle':
        return {
          ...baseData,
          '@type': 'NewsArticle',
          headline: data.title,
          description: data.description,
          image: data.image || 'https://aidayhot.com/og-image.png',
          datePublished: data.datePublished,
          dateModified: data.dateModified || data.datePublished,
          author: {
            '@type': 'Person',
            name: data.author || 'AI每日热点团队',
            url: 'https://aidayhot.com',
          },
          publisher: {
            '@type': 'Organization',
            name: 'AI每日热点',
            logo: {
              '@type': 'ImageObject',
              url: 'https://aidayhot.com/logo.png',
            },
          },
          mainEntityOfPage: {
            '@type': 'WebPage',
            '@id': data.url || 'https://aidayhot.com',
          },
          articleSection: data.category || '人工智能',
          keywords: data.keywords || ['AI', '人工智能', '技术资讯'],
          inLanguage: 'zh-CN',
        }

      case 'breadcrumb':
        return {
          ...baseData,
          '@type': 'BreadcrumbList',
          itemListElement: data.items.map((item: any, index: number) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: item.name,
            item: item.url,
          })),
        }

      default:
        return baseData
    }
  }

  const structuredData = getStructuredData()

  return (
    <Script
      id={`structured-data-${type}`}
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(structuredData, null, 2),
      }}
    />
  )
}