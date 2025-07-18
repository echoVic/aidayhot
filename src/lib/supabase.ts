import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 验证Supabase客户端
if (!supabase || typeof supabase.from !== 'function') {
  console.error('Supabase客户端初始化失败');
}

// 类型定义
export interface Article {
  id: string
  title: string
  summary: string
  category: string
  author: string
  publish_time: string
  read_time: string
  views: number
  likes: number
  tags: string[]
  image_url: string
  is_hot: boolean
  is_new: boolean
  source_url?: string
  source_type?: string
  source_name?: string
  source_category?: string
  created_at?: string
  updated_at?: string
  metadata?: any
}

export interface Category {
  id?: number
  name: string
  href: string
  count: number
  created_at?: string
}

export interface Database {
  public: {
    Tables: {
      articles: {
        Row: Article
        Insert: Omit<Article, 'created_at' | 'updated_at'>
        Update: Partial<Omit<Article, 'created_at' | 'updated_at'>>
      }
      categories: {
        Row: Category
        Insert: Omit<Category, 'id' | 'created_at'>
        Update: Partial<Omit<Category, 'id' | 'created_at'>>
      }
    }
  }
} 