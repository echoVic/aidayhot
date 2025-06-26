import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import fs from 'fs';
import path from 'path';

// 智能加载环境变量 - 兼容本地开发和 GitHub Actions
function loadEnvironmentVariables() {
  // 检查是否已经有统一的 Supabase 环境变量（GitHub Actions 模式）
  const hasUrl = !!(process.env.SUPABASE_URL);
  const hasKey = !!(process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY);

  // 如果已经有完整的环境变量，直接使用（GitHub Actions 或系统环境变量模式）
  if (hasUrl && hasKey) {
    const source = process.env.GITHUB_ACTIONS ? 'GitHub Actions' : 'System Environment';
    console.log(`🔧 使用系统环境变量 (${source})`);
    return;
  }

  // 如果没有，尝试从 .env.local 加载（本地开发模式）
  const envPath = path.join(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    console.log('🔧 从 .env.local 加载环境变量 (本地开发)');
    config({ path: envPath });
  } else {
    console.log('⚠️ 未找到 .env.local 文件，依赖系统环境变量');
  }
}

// 加载环境变量
loadEnvironmentVariables();

// 使用统一的环境变量名称，优先服务端变量，回退前端变量
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// 环境检测和错误提示
if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase 环境变量配置错误');
  console.error('🔍 当前环境变量状态:');
  console.error(`   SUPABASE_URL: ${process.env.SUPABASE_URL ? '✅ 已设置' : '❌ 未设置'}`);
  console.error(`   NEXT_PUBLIC_SUPABASE_URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ 已设置' : '❌ 未设置'}`);
  console.error(`   SUPABASE_SERVICE_ROLE_KEY: ${process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ 已设置' : '❌ 未设置'}`);
  console.error(`   SUPABASE_ANON_KEY: ${process.env.SUPABASE_ANON_KEY ? '✅ 已设置' : '❌ 未设置'}`);
  console.error(`   NEXT_PUBLIC_SUPABASE_ANON_KEY: ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ 已设置' : '❌ 未设置'}`);
  console.error('');
  console.error('📋 本地开发模式 - 在 .env.local 中设置:');
  console.error('   SUPABASE_URL=your_supabase_url');
  console.error('   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key (推荐用于脚本)');
  console.error('   # 或者');
  console.error('   SUPABASE_ANON_KEY=your_anon_key (适用于客户端)');
  console.error('   # 或者');
  console.error('   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url');
  console.error('   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key');
  console.error('');
  console.error('🚀 GitHub Actions/生产环境 - 在 Repository Secrets 或系统环境变量中设置:');
  console.error('   SUPABASE_URL');
  console.error('   SUPABASE_SERVICE_ROLE_KEY (推荐)');
  console.error('   # 或者 SUPABASE_ANON_KEY');
  process.exit(1);
}

// 创建 Supabase 客户端
export const supabase = createClient(supabaseUrl, supabaseKey);

// 导出环境信息用于调试
export const environmentInfo = {
  isGitHubActions: !!process.env.GITHUB_ACTIONS,
  isLocal: fs.existsSync(path.join(process.cwd(), '.env.local')),
  supabaseUrl: supabaseUrl?.substring(0, 30) + '...',
  hasServiceRoleKey: !!supabaseKey
};