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

// 分类相关操作
export class CategoryService {
  // 获取所有分类
  static async getAll(): Promise<Category[]> {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name');
    
    if (error) throw error;
    return data || [];
  }

  // 获取RSS文章的分类统计
  static async getRSSCategories(): Promise<Category[]> {
    // 动态计算RSS类型文章的分类统计
    const { data: rssStats, error } = await supabase
      .from('articles')
      .select('category')
      .eq('source_type', 'rss');
    
    if (error) throw error;
    
    // 统计每个分类的文章数量
    const categoryCount: Record<string, number> = {};
    let totalCount = 0;
    
    (rssStats || []).forEach(article => {
      const category = article.category || '其他';
      categoryCount[category] = (categoryCount[category] || 0) + 1;
      totalCount++;
    });
    
    // 构建分类数组，包含"全部"分类
    const categories: Category[] = [
      {
        id: 0,
        name: '全部',
        href: '/',
        count: totalCount,
        created_at: new Date().toISOString()
      }
    ];
    
    // 添加其他分类
    Object.entries(categoryCount)
      .sort(([a], [b]) => a.localeCompare(b, 'zh-CN'))
      .forEach(([name, count], index) => {
        categories.push({
          id: index + 1,
          name,
          href: `/${name}`,
          count,
          created_at: new Date().toISOString()
        });
      });
    
    return categories;
  }

  // 更新分类文章数量
  static async updateCount(categoryName: string, count: number): Promise<void> {
    const { error } = await supabase
      .from('categories')
      .update({ count })
      .eq('name', categoryName);
    
    if (error) throw error;
  }

  // 创建分类
  static async create(category: Omit<Category, 'id' | 'created_at'>): Promise<Category> {
    const { data, error } = await supabase
      .from('categories')
      .insert(category)
      .select()
      .single();

    if (error) throw error;
    return data;
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