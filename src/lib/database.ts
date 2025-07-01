import { getPageFeedCategories, getPageSourceTypes } from '../config/pageConfig';
import type { Article, Category } from './supabase';
import { supabase } from './supabase';

// 分页结果接口
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  hasMore: boolean;
  page: number;
  pageSize: number;
}

// 文章相关操作
export class ArticleService {
  // 获取所有文章（带分页）
  static async getAll(page = 1, pageSize = 20): Promise<PaginatedResult<Article>> {
    const offset = (page - 1) * pageSize;

    // 并行查询总数和数据以提高性能
    const [countResult, dataResult] = await Promise.all([
      supabase.from('articles').select('*', { count: 'exact', head: true }),
      supabase.from('articles')
        .select('*')
        .order('publish_time', { ascending: false })
        .order('created_at', { ascending: false })
        .range(offset, offset + pageSize - 1)
    ]);

    if (countResult.error) throw countResult.error;
    if (dataResult.error) throw dataResult.error;

    const total = countResult.count || 0;
    return {
      data: dataResult.data || [],
      total,
      hasMore: offset + pageSize < total,
      page,
      pageSize
    };
  }

  // 根据分类获取文章（带分页）
  static async getByCategory(category: string, page = 1, pageSize = 20): Promise<PaginatedResult<Article>> {
    if (category === '全部') {
      return this.getAll(page, pageSize);
    }

    const offset = (page - 1) * pageSize;

    // 现在articles表的category字段已经是标准分类名，可以直接查询
    const [countResult, dataResult] = await Promise.all([
      supabase.from('articles')
        .select('*', { count: 'exact', head: true })
        .eq('category', category),
      supabase.from('articles')
        .select('*')
        .eq('category', category)
        .order('publish_time', { ascending: false })
        .order('created_at', { ascending: false })
        .range(offset, offset + pageSize - 1)
    ]);

    if (countResult.error) throw countResult.error;
    if (dataResult.error) throw dataResult.error;

    const total = countResult.count || 0;
    return {
      data: dataResult.data || [],
      total,
      hasMore: offset + pageSize < total,
      page,
      pageSize
    };
  }

  // 根据来源类型获取文章（带分页）
  static async getBySourceType(sourceType: string, page = 1, pageSize = 20): Promise<PaginatedResult<Article>> {
    const offset = (page - 1) * pageSize;

    const [countResult, dataResult] = await Promise.all([
      supabase.from('articles')
        .select('*', { count: 'exact', head: true })
        .eq('source_type', sourceType),
      supabase.from('articles')
        .select('*')
        .eq('source_type', sourceType)
        .order('publish_time', { ascending: false })
        .order('created_at', { ascending: false })
        .range(offset, offset + pageSize - 1)
    ]);

    if (countResult.error) throw countResult.error;
    if (dataResult.error) throw dataResult.error;

    const total = countResult.count || 0;
    return {
      data: dataResult.data || [],
      total,
      hasMore: offset + pageSize < total,
      page,
      pageSize
    };
  }

  // 获取RSS文章（带分页） - 专门用于首页
  static async getRSSArticles(page = 1, pageSize = 20): Promise<PaginatedResult<Article>> {
    return this.getBySourceType('rss', page, pageSize);
  }

  // 获取RSS文章的指定分类（带分页）
  static async getRSSArticlesByCategory(category: string, page = 1, pageSize = 20): Promise<PaginatedResult<Article>> {
    if (category === '全部') {
      return this.getRSSArticles(page, pageSize);
    }

    const offset = (page - 1) * pageSize;

    const [countResult, dataResult] = await Promise.all([
      supabase.from('articles')
        .select('*', { count: 'exact', head: true })
        .eq('category', category)
        .eq('source_type', 'rss'),
      supabase.from('articles')
        .select('*')
        .eq('category', category)
        .eq('source_type', 'rss')
        .order('publish_time', { ascending: false })
        .order('created_at', { ascending: false })
        .range(offset, offset + pageSize - 1)
    ]);

    if (countResult.error) throw countResult.error;
    if (dataResult.error) throw dataResult.error;

    const total = countResult.count || 0;
    return {
      data: dataResult.data || [],
      total,
      hasMore: offset + pageSize < total,
      page,
      pageSize
    };
  }

   // 获取热门文章
   static async getHot(limit = 10): Promise<Article[]> {
     const { data, error } = await supabase
      .from('articles')
      .select('*')
      .eq('is_hot', true)
      .order('publish_time', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    return data || [];
  }

  // 获取最新文章
  static async getNew(limit = 10): Promise<Article[]> {
    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .eq('is_new', true)
      .order('publish_time', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    return data || [];
  }

  // 搜索文章（带分页）
  static async search(query: string, page = 1, pageSize = 20): Promise<PaginatedResult<Article>> {
    const offset = (page - 1) * pageSize;

    try {
      // 首先尝试使用数据库的全文搜索函数
      const [countResult, dataResult] = await Promise.all([
        supabase.rpc('search_articles_count', { search_query: query }),
        supabase.rpc('search_articles', {
          search_query: query,
          search_limit: pageSize,
          search_offset: offset
        })
      ]);

      if (dataResult.error) throw dataResult.error;

      const total = countResult.error ? 0 : (countResult.data?.[0]?.count || 0);
      return {
        data: dataResult.data || [],
        total,
        hasMore: offset + pageSize < total,
        page,
        pageSize
      };
    } catch (error) {
      console.warn('全文搜索失败，使用基础搜索:', error);

      // 回退到基础的 ILIKE 搜索
      const searchPattern = `%${query}%`;

      const [countResult, dataResult] = await Promise.all([
        supabase.from('articles')
          .select('*', { count: 'exact', head: true })
          .or(`title.ilike.${searchPattern},summary.ilike.${searchPattern},content.ilike.${searchPattern}`),
        supabase.from('articles')
          .select('*')
          .or(`title.ilike.${searchPattern},summary.ilike.${searchPattern},content.ilike.${searchPattern}`)
          .order('publish_time', { ascending: false })
          .order('created_at', { ascending: false })
          .range(offset, offset + pageSize - 1)
      ]);

      if (countResult.error) throw countResult.error;
      if (dataResult.error) throw dataResult.error;

      const total = countResult.count || 0;
      return {
        data: dataResult.data || [],
        total,
        hasMore: offset + pageSize < total,
        page,
        pageSize
      };
    }
  }

  // 获取单篇文章
  static async getById(id: string): Promise<Article | null> {
    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = not found
    return data;
  }

  // 创建文章
  static async create(article: Omit<Article, 'created_at' | 'updated_at'>): Promise<Article> {
    const { data, error } = await supabase
      .from('articles')
      .insert(article)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // 更新文章
  static async update(id: string, updates: Partial<Article>): Promise<Article> {
    const { data, error } = await supabase
      .from('articles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // 删除文章
  static async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('articles')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // 增加浏览量
  static async incrementViews(id: string): Promise<void> {
    const { error } = await supabase.rpc('increment_views', { article_id: id });
    if (error) console.error('增加浏览量失败:', error);
  }

  // 增加点赞数
  static async incrementLikes(id: string): Promise<void> {
    const { error } = await supabase.rpc('increment_likes', { article_id: id });
    if (error) console.error('增加点赞数失败:', error);
  }
}

// 辅助函数
function getSourceTypeDisplayName(sourceType: string): string {
  const displayNames: Record<string, string> = {
    'rss': 'RSS订阅',
    'github': 'GitHub项目',
    'arxiv': 'arXiv论文',
    'paper': '学术论文',
    'stackoverflow': 'Stack Overflow',
    'openai': 'OpenAI资讯'
  };
  return displayNames[sourceType] || sourceType;
}

function getRSSCategoryDisplayName(category: string): string {
  const displayNames: Record<string, string> = {
    'AI/机器学习': '🤖 AI/机器学习',
    '技术/开发': '💻 技术/开发', 
    '新闻/资讯': '📰 新闻/资讯',
    '学术/研究': '📚 学术/研究',
    '社交媒体': '💬 社交媒体',
    '播客': '🎙️ 播客',
    '设计/用户体验': '🎨 设计/用户体验',
    '其他': '📁 其他'
  };
  return displayNames[category] || category;
}

// 新增：页面内容服务 - 替代传统的CategoryService
export class PageContentService {
  // 获取页面导航配置
  static async getPageNavigation(): Promise<Array<{
    id: string;
    name: string; 
    href: string;
    count: number;
    icon?: string;
  }>> {
    try {
      const pages = [
        { id: 'homepage', name: '每日热点', href: '/', icon: '📰' },
        { id: 'tech', name: '技术动态', href: '/tech', icon: '💻' },
        { id: 'research', name: '学术研究', href: '/research', icon: '📚' },
        { id: 'community', name: '社区动态', href: '/community', icon: '💬' },
        { id: 'design', name: '设计灵感', href: '/design', icon: '🎨' }
      ];

      // 获取所有文章数据用于统计
      const { data: allArticles, error } = await supabase
        .from('articles')
        .select('source_type');
      
      if (error || !allArticles) {
        console.error('查询文章失败:', error?.message);
        return [];
      }

      // 并行计算每个页面的文章数量
      const pageStats = pages.map(page => {
        const sourceTypes = getPageSourceTypes(page.id);
        const count = sourceTypes.length > 0 
          ? allArticles.filter(article => sourceTypes.includes(article.source_type)).length
          : 0;
        
        return {
          ...page,
          count
        };
      });

      // 添加"全部"页面
      return [
        { id: 'all', name: '全部', href: '/', count: allArticles.length, icon: '🌐' },
        ...pageStats
      ];
    } catch (error) {
      console.error('获取页面导航失败:', error);
      return [];
    }
  }

  // 获取页面内容筛选选项
  static async getPageFilters(page: string): Promise<Array<{
    name: string;
    value: string;
    count: number;
  }>> {
    try {
      const sourceTypes = getPageSourceTypes(page);
      if (sourceTypes.length === 0) return [];

      const { data, error } = await supabase
        .from('articles')
        .select('source_type, category')
        .in('source_type', sourceTypes);

      if (error || !data) return [];

      // 按source_type统计
      const filterStats: Record<string, number> = {};
      data.forEach(article => {
        const sourceType = article.source_type;
        filterStats[sourceType] = (filterStats[sourceType] || 0) + 1;
      });

      // 转换为筛选选项格式
      return Object.entries(filterStats).map(([sourceType, count]) => ({
        name: getSourceTypeDisplayName(sourceType),
        value: sourceType,
        count
      }));
    } catch (error) {
      console.error('获取页面筛选选项失败:', error);
      return [];
    }
  }

  // 获取RSS源分类统计（用于高级筛选）
  static async getRSSCategoryStats(): Promise<Array<{
    name: string;
    value: string; 
    count: number;
    feedCount: number;
  }>> {
    try {
      const { data: feedData, error: feedError } = await supabase
        .from('feed_sources')
        .select('category, is_active, item_count');

      if (feedError || !feedData) return [];

      const categoryStats: Record<string, { count: number; feedCount: number; items: number }> = {};
      
      feedData.forEach(feed => {
        const category = feed.category || '其他';
        if (!categoryStats[category]) {
          categoryStats[category] = { count: 0, feedCount: 0, items: 0 };
        }
        categoryStats[category].feedCount += 1;
        if (feed.is_active) {
          categoryStats[category].items += feed.item_count || 0;
        }
      });

      return Object.entries(categoryStats).map(([category, stats]) => ({
        name: getRSSCategoryDisplayName(category),
        value: category,
        count: stats.items,
        feedCount: stats.feedCount
      }));
    } catch (error) {
      console.error('获取RSS分类统计失败:', error);
      return [];
    }
  }
}

// 保留CategoryService以便向后兼容，但使用新的实现
export class CategoryService {
  // 获取所有分类 - 现在基于页面映射
  static async getAll(): Promise<Category[]> {
    console.warn('⚠️ CategoryService.getAll() 已过时，建议使用 PageContentService.getPageNavigation()');
    
    const pageNav = await PageContentService.getPageNavigation();
    return pageNav.map((page, index) => ({
      id: index,
      name: page.name,
      href: page.href,
      count: page.count,
      created_at: new Date().toISOString()
    }));
  }

  // 获取RSS文章的分类统计 - 现在基于source_type
  static async getRSSCategories(): Promise<Category[]> {
    console.warn('⚠️ CategoryService.getRSSCategories() 已过时，建议使用 PageContentService.getPageFilters()');
    
    try {
      const { data, error } = await supabase
        .from('articles')
        .select('source_type')
        .eq('source_type', 'rss');

      if (error || !data) return [];

      const totalCount = data.length;
      
      return [
        {
          id: 0,
          name: '全部',
          href: '/',
          count: totalCount,
          created_at: new Date().toISOString()
        },
        {
          id: 1, 
          name: 'RSS文章',
          href: '/rss',
          count: totalCount,
          created_at: new Date().toISOString()
        }
      ];
    } catch (error) {
      console.error('获取RSS分类失败:', error);
      return [];
    }
  }

  // 其他方法标记为废弃
  static async updateCount(categoryName: string, count: number): Promise<void> {
    console.warn('⚠️ CategoryService.updateCount() 已废弃，新架构中无需手动更新统计');
  }

  static async create(category: Omit<Category, 'id' | 'created_at'>): Promise<Category> {
    console.warn('⚠️ CategoryService.create() 已废弃，请使用页面映射配置');
    throw new Error('CategoryService.create() 已废弃');
  }
}

// 实时订阅服务
export class RealtimeService {
  // 订阅文章变化
  static subscribeToArticles(callback: (payload: any) => void) {
    return supabase
      .channel('articles')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'articles' }, callback)
      .subscribe();
  }

  // 订阅分类变化
  static subscribeToCategories(callback: (payload: any) => void) {
    return supabase
      .channel('categories')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, callback)
      .subscribe();
  }
}

// 更新：根据页面类型获取文章（支持feed_sources分类）
export async function getArticlesByPage(
  page: string,
  options: {
    limit?: number;
    category?: string;
    sortBy?: 'latest' | 'popular';
    timeRange?: 'today' | 'week' | 'month' | 'all';
    includeRSSByCategory?: boolean; // 是否包含feed_sources分类筛选
  } = {}
) {
  try {
    const {
      limit = 20,
      category,
      sortBy = 'latest',
      timeRange = 'all',
      includeRSSByCategory = true
    } = options;

    // 获取该页面应该显示的source_type列表
    const sourceTypes = getPageSourceTypes(page);
    
    if (sourceTypes.length === 0) {
      console.warn(`未知页面类型: ${page}`);
      return { data: [], error: null };
    }

    let query = supabase
      .from('articles')
      .select(`
        id,
        title,
        summary,
        category,
        author,
        publish_time,
        source_url,
        source_type,
        tags,
        views,
        likes,
        is_hot,
        created_at
      `)
      .in('source_type', sourceTypes);

    // 如果启用RSS分类筛选，且页面有配置feed分类
    if (includeRSSByCategory) {
      const feedCategories = getPageFeedCategories(page);
      
      if (feedCategories.length > 0) {
        // 需要联合查询：既要符合source_type，又要符合feed分类（针对RSS类型）
        // 这需要更复杂的查询逻辑，暂时先保持简单的source_type筛选
        // TODO: 实现联合feed_sources表的查询
        console.log(`页面 ${page} 需要额外筛选feed分类: ${feedCategories.join(', ')}`);
      }
    }

    // 按分类过滤
    if (category && category !== '全部') {
      query = query.eq('category', category);
    }

    // 按时间范围过滤
    if (timeRange !== 'all') {
      const now = new Date();
      let fromDate: Date;
      
      switch (timeRange) {
        case 'today':
          fromDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          fromDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          fromDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        default:
          fromDate = new Date(0);
      }
      
      query = query.gte('publish_time', fromDate.toISOString());
    }

    // 排序
    if (sortBy === 'popular') {
      query = query.order('views', { ascending: false })
                  .order('likes', { ascending: false });
    } else {
      query = query.order('publish_time', { ascending: false });
    }

    const { data, error } = await query.limit(limit);

    if (error) {
      console.error('获取页面文章失败:', error);
      return { data: [], error };
    }

    return { data: data || [], error: null };
  } catch (error) {
    console.error('获取页面文章出错:', error);
    return { data: [], error: error as Error };
  }
}

// 新增：获取feed_sources统计信息
export async function getFeedSourcesStats() {
  try {
    const { data, error } = await supabase
      .from('feed_sources')
      .select('category, is_active, item_count');

    if (error) {
      return { total: 0, byCategory: {}, active: 0, error };
    }

    const stats = {
      total: data?.length || 0,
      active: data?.filter(feed => feed.is_active).length || 0,
      byCategory: {} as Record<string, { total: number; active: number; items: number }>
    };

    data?.forEach(feed => {
      const category = feed.category || '其他';
      if (!stats.byCategory[category]) {
        stats.byCategory[category] = { total: 0, active: 0, items: 0 };
      }
      stats.byCategory[category].total += 1;
      if (feed.is_active) {
        stats.byCategory[category].active += 1;
        stats.byCategory[category].items += feed.item_count || 0;
      }
    });

    return { ...stats, error: null };
  } catch (error) {
    return { total: 0, byCategory: {}, active: 0, error: error as Error };
  }
}

// 更新：获取页面统计信息（包含feed_sources）
export async function getPageStats(page: string) {
  try {
    const sourceTypes = getPageSourceTypes(page);
    const feedCategories = getPageFeedCategories(page);
    
    if (sourceTypes.length === 0) {
      return { total: 0, bySource: {}, feedStats: null, error: null };
    }

    // 获取articles统计
    const { data, error } = await supabase
      .from('articles')
      .select('source_type')
      .in('source_type', sourceTypes);

    if (error) {
      return { total: 0, bySource: {}, feedStats: null, error };
    }

    const bySource: Record<string, number> = {};
    sourceTypes.forEach(type => bySource[type] = 0);
    
    data?.forEach(article => {
      bySource[article.source_type] = (bySource[article.source_type] || 0) + 1;
    });

    // 获取feed_sources统计（如果页面有配置）
    let feedStats = null;
    if (feedCategories.length > 0) {
      const feedData = await supabase
        .from('feed_sources')
        .select('category, is_active, item_count')
        .in('category', feedCategories);

      if (!feedData.error && feedData.data) {
        feedStats = {
          totalFeeds: feedData.data.length,
          activeFeeds: feedData.data.filter(f => f.is_active).length,
          totalItems: feedData.data.reduce((sum, f) => sum + (f.item_count || 0), 0)
        };
      }
    }

    return {
      total: data?.length || 0,
      bySource,
      feedStats,
      error: null
    };
  } catch (error) {
    return { total: 0, bySource: {}, feedStats: null, error: error as Error };
  }
} 