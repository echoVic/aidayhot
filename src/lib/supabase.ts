import { createClient } from '@supabase/supabase-js';

// 获取环境变量的函数
function getSupabaseConfig() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  
  // 检查是否在客户端
  const isClient = typeof window !== 'undefined';
  
  // 调试信息
  console.log('Supabase环境变量检查:', {
    supabaseUrl: supabaseUrl ? `SET (${supabaseUrl.substring(0, 20)}...)` : 'NOT_SET',
    supabaseAnonKey: supabaseAnonKey ? `SET (${supabaseAnonKey.substring(0, 20)}...)` : 'NOT_SET',
    supabaseServiceRoleKey: supabaseServiceRoleKey ? 'SET' : 'NOT_SET',
    isClient
  });
  
  // 验证必需的环境变量
  if (!supabaseUrl) {
    console.error('❌ NEXT_PUBLIC_SUPABASE_URL 环境变量未设置');
    throw new Error('supabaseUrl is required');
  }
  
  if (!supabaseAnonKey) {
    console.error('❌ NEXT_PUBLIC_SUPABASE_ANON_KEY 环境变量未设置');
    throw new Error('supabaseKey is required');
  }
  
  console.log('✅ Supabase环境变量验证通过');
  
  return {
    supabaseUrl,
    supabaseAnonKey,
    supabaseServiceRoleKey
  };
}

// 懒加载的客户端实例
let _supabase: any = null;
let _supabaseAdmin: any = null;

// 获取普通客户端（用于前端，受RLS限制）
export const getSupabase = () => {
  if (!_supabase) {
    const config = getSupabaseConfig();
    _supabase = createClient(config.supabaseUrl, config.supabaseAnonKey);
  }
  return _supabase;
};

// 获取管理员客户端（用于后端，绕过RLS限制）
export const getSupabaseAdmin = () => {
  if (!_supabaseAdmin) {
    const config = getSupabaseConfig();
    _supabaseAdmin = createClient(config.supabaseUrl, config.supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  }
  return _supabaseAdmin;
};

// 为了向后兼容，保留原有的导出（懒加载）
export const supabase = {
  get from() { return getSupabase().from; },
  get auth() { return getSupabase().auth; },
  get storage() { return getSupabase().storage; },
  get realtime() { return getSupabase().realtime; },
  get functions() { return getSupabase().functions; },
  get rpc() { return getSupabase().rpc; }
};

export const supabaseAdmin = {
  get from() { return getSupabaseAdmin().from; },
  get auth() { return getSupabaseAdmin().auth; },
  get storage() { return getSupabaseAdmin().storage; },
  get realtime() { return getSupabaseAdmin().realtime; },
  get functions() { return getSupabaseAdmin().functions; },
  get rpc() { return getSupabaseAdmin().rpc; }
};

// 验证函数，可在需要时调用
export const validateSupabaseClients = () => {
  try {
    const client = getSupabase();
    if (!client || typeof client.from !== 'function') {
      console.error('❌ Supabase客户端初始化失败');
      return false;
    }
    
    const adminClient = getSupabaseAdmin();
    if (!adminClient || typeof adminClient.from !== 'function') {
      console.error('❌ Supabase管理员客户端初始化失败');
      return false;
    }
    
    const envConfig = getSupabaseConfig();
    if (!envConfig.supabaseServiceRoleKey) {
      console.warn('⚠️ SUPABASE_SERVICE_ROLE_KEY 未设置，管理员功能将不可用');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Supabase客户端验证失败:', error);
    return false;
  }
};

// 类型定义


// Article 类型已被移除 - articles 表已清理
// 如果需要文章相关功能，请重新定义相关类型
