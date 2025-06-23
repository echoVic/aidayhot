import type { Article, Category } from './supabase'
import { supabase } from './supabase'

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

    // 获取总数
    const { count, error: countError } = await supabase
      .from('articles')
      .select('*', { count: 'exact', head: true });

    if (countError) throw countError;

    // 获取数据
    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1);

    if (error) throw error;

    const total = count || 0;
    return {
      data: data || [],
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

    // 获取总数
    const { count, error: countError } = await supabase
      .from('articles')
      .select('*', { count: 'exact', head: true })
      .eq('category', category);

    if (countError) throw countError;

    // 获取数据
    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .eq('category', category)
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1);

    if (error) throw error;

    const total = count || 0;
    return {
      data: data || [],
      total,
      hasMore: offset + pageSize < total,
      page,
      pageSize
    };
  }

  // 获取热门文章
  static async getHot(limit = 10) {
    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .eq('is_hot', true)
      .order('views', { ascending: false })
      .limit(limit)
    
    if (error) throw error
    return data
  }

  // 获取最新文章
  static async getNew(limit = 10) {
    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .eq('is_new', true)
      .order('created_at', { ascending: false })
      .limit(limit)
    
    if (error) throw error
    return data
  }

  // 搜索文章（带分页）
  static async search(query: string, page = 1, pageSize = 20): Promise<PaginatedResult<Article>> {
    const offset = (page - 1) * pageSize;

    try {
      // 首先尝试使用数据库的高级搜索函数
      const { data, error } = await supabase
        .rpc('search_articles', {
          search_query: query,
          search_limit: pageSize,
          search_offset: offset
        });

      if (error) throw error;

      // 获取搜索结果总数（需要单独查询）
      const { data: countData, error: countError } = await supabase
        .rpc('search_articles_count', { search_query: query });

      const total = countError ? 0 : (countData?.[0]?.count || 0);

      return {
        data: data || [],
        total,
        hasMore: offset + pageSize < total,
        page,
        pageSize
      };
    } catch (error) {
      console.warn('高级搜索失败，使用基础搜索:', error);

      // 回退到基础的 ILIKE 搜索
      const searchPattern = `%${query}%`;

      // 获取总数
      const { count, error: countError } = await supabase
        .from('articles')
        .select('*', { count: 'exact', head: true })
        .or(`title.ilike.${searchPattern}, summary.ilike.${searchPattern}`);

      if (countError) throw countError;

      // 获取数据
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('articles')
        .select('*')
        .or(`title.ilike.${searchPattern}, summary.ilike.${searchPattern}`)
        .order('created_at', { ascending: false })
        .range(offset, offset + pageSize - 1);

      if (fallbackError) throw fallbackError;

      const total = count || 0;
      return {
        data: fallbackData || [],
        total,
        hasMore: offset + pageSize < total,
        page,
        pageSize
      };
    }
  }

  // 创建文章
  static async create(article: Omit<Article, 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('articles')
      .insert(article)
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  // 更新文章
  static async update(id: string, updates: Partial<Article>) {
    const { data, error } = await supabase
      .from('articles')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  // 删除文章
  static async delete(id: string) {
    const { error } = await supabase
      .from('articles')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }

  // 增加浏览量
  static async incrementViews(id: string) {
    const { error } = await supabase.rpc('increment_views', { article_id: id })
    if (error) throw error
  }

  // 增加点赞数
  static async incrementLikes(id: string) {
    const { error } = await supabase.rpc('increment_likes', { article_id: id })
    if (error) throw error
  }
}

// 分类相关操作
export class CategoryService {
  // 获取所有分类
  static async getAll() {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('id', { ascending: true })
    
    if (error) throw error
    return data
  }

  // 更新分类文章数量
  static async updateCount(categoryName: string, count: number) {
    const { data, error } = await supabase
      .from('categories')
      .update({ count })
      .eq('name', categoryName)
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  // 创建分类
  static async create(category: Omit<Category, 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('categories')
      .insert(category)
      .select()
      .single()
    
    if (error) throw error
    return data
  }
}

// 实时订阅
export class RealtimeService {
  // 订阅文章变化
  static subscribeToArticles(callback: (payload: any) => void) {
    return supabase
      .channel('articles')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'articles' },
        callback
      )
      .subscribe()
  }

  // 订阅分类变化
  static subscribeToCategories(callback: (payload: any) => void) {
    return supabase
      .channel('categories')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'categories' },
        callback
      )
      .subscribe()
  }
} 