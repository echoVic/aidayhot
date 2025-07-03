// 页面内容配置
export interface PageConfig {
  sourceTypes: string[];
  feedCategories: string[];
  defaultCategory?: string;
  title: string;
  description: string;
}

// 页面映射配置
export const PAGE_CONFIGS: Record<string, PageConfig> = {
  // 首页 - 综合资讯和RSS文章
  homepage: {
    sourceTypes: ['rss', 'openai'],
    feedCategories: ['AI/机器学习', '新闻/资讯', 'RSS文章'],
    title: '每日热点',
    description: '最新的AI资讯、技术动态和行业新闻'
  },
  
  // 技术动态 - GitHub项目和技术问答
  tech: {
    sourceTypes: ['github', 'stackoverflow'],
    feedCategories: ['技术/开发', 'RSS文章'],
    title: '技术动态', 
    description: '最新的开源项目、技术问答和开发趋势'
  },
  
  // 学术研究 - 论文和学术内容
  research: {
    sourceTypes: ['arxiv', 'paper'],
    feedCategories: ['学术/研究'],
    title: '学术研究',
    description: '最新的学术论文、研究成果和科研动态'
  },

  // 社区动态 - 社交媒体和播客内容
  community: {
    sourceTypes: ['rss'],
    feedCategories: ['社交媒体', '播客'],
    title: '社区动态',
    description: '社交媒体讨论、播客节目和社区观点'
  },

  // 设计灵感 - 设计和UX相关内容  
  design: {
    sourceTypes: ['rss'],
    feedCategories: ['设计/用户体验'],
    title: '设计灵感', 
    description: '用户体验设计、界面设计和创意灵感'
  }
};

// 获取页面应该显示的source_type列表
export function getPageSourceTypes(page: string): string[] {
  return PAGE_CONFIGS[page]?.sourceTypes || [];
}

// 新增：获取页面应该显示的feed_sources分类列表
export function getPageFeedCategories(page: string): string[] {
  return PAGE_CONFIGS[page]?.feedCategories || [];
}

// 获取页面配置
export function getPageConfig(page: string): PageConfig | null {
  return PAGE_CONFIGS[page] || null;
}

// 根据source_type判断应该在哪个页面显示
export function getSourceTypePage(sourceType: string): string | null {
  for (const [page, config] of Object.entries(PAGE_CONFIGS)) {
    if (config.sourceTypes.includes(sourceType)) {
      return page;
    }
  }
  return null;
}

// 新增：根据feed分类判断应该在哪个页面显示
export function getFeedCategoryPage(category: string): string | null {
  for (const [page, config] of Object.entries(PAGE_CONFIGS)) {
    if (config.feedCategories.includes(category)) {
      return page;
    }
  }
  return null;
}

// 内容分类映射（用于统一显示）
export const CONTENT_CATEGORY_MAPPING: Record<string, string> = {
  'rss': '技术资讯',
  'openai': 'AI前沿', 
  'github': '开源项目',
  'stackoverflow': '技术问答',
  'arxiv': '学术论文',
  'paper': '研究成果'
};

// RSS源分类映射（用于显示）
export const RSS_CATEGORY_MAPPING: Record<string, string> = {
  'AI/机器学习': '🤖 AI前沿',
  '技术/开发': '💻 技术开发', 
  '新闻/资讯': '📰 科技资讯',
  '播客': '🎙️ 播客节目',
  '学术/研究': '🔬 学术研究',
  '社交媒体': '💬 社区讨论',
  '设计/用户体验': '🎨 设计灵感',
  'RSS文章': '📄 综合内容',
  '其他': '📋 其他内容'
};

// 获取source_type的显示名称
export function getSourceTypeDisplayName(sourceType: string): string {
  return CONTENT_CATEGORY_MAPPING[sourceType] || sourceType;
}

// 获取RSS分类的显示名称  
export function getRSSCategoryDisplayName(category: string): string {
  return RSS_CATEGORY_MAPPING[category] || category;
} 