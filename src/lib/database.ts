import type { Article, Category } from './supabase'
import { supabase } from './supabase'

// 文章相关操作
export class ArticleService {
  // 获取所有文章
  static async getAll(limit = 50, offset = 0) {
    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)
    
    if (error) throw error
    return data
  }

  // 根据分类获取文章
  static async getByCategory(category: string, limit = 50, offset = 0) {
    if (category === '全部') {
      return this.getAll(limit, offset)
    }
    
    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .eq('category', category)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)
    
    if (error) throw error
    return data
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

  // 搜索文章
  static async search(query: string, limit = 20) {
    // 首先尝试使用数据库的高级搜索函数
    const { data, error } = await supabase
      .rpc('search_articles', { 
        search_query: query, 
        search_limit: limit 
      })
    
    if (error) {
      console.warn('高级搜索失败，使用基础搜索:', error);
      // 如果高级搜索失败，回退到基础的 ILIKE 搜索
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('articles')
        .select('*')
        .or(`title.ilike.%${query}%, summary.ilike.%${query}%`)
        .order('created_at', { ascending: false })
        .limit(limit)
      
      if (fallbackError) throw fallbackError
      return fallbackData
    }
    
    return data
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