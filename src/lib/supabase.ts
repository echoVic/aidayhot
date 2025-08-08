import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 验证Supabase客户端
if (!supabase || typeof supabase.from !== 'function') {
  console.error('Supabase客户端初始化失败');
}

// 类型定义


// Article 类型已被移除 - articles 表已清理
// 如果需要文章相关功能，请重新定义相关类型
