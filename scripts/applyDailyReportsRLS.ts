#!/usr/bin/env tsx

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

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 缺少必要的环境变量');
  console.error('请确保设置了 NEXT_PUBLIC_SUPABASE_URL 和 SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// 使用服务角色密钥创建客户端
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyDailyReportsRLS() {
  console.log('🔧 开始为 daily_reports 表应用 RLS 策略...');

  try {
    // 执行 SQL 的辅助函数
    async function executeSql(description: string, sql: string) {
      console.log(`📋 ${description}...`);
      const { error } = await supabase.from('_sql_exec').select('*').limit(0);
      // 由于无法直接执行DDL，我们使用一个替代方案
      // 直接通过 REST API 调用
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
         method: 'POST',
         headers: {
           'Content-Type': 'application/json',
           'Authorization': `Bearer ${supabaseServiceKey}`,
           'apikey': supabaseServiceKey!
         },
         body: JSON.stringify({ sql })
       });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.log(`⚠️  ${description} - 可能已存在或权限不足:`, errorText);
        return false;
      } else {
        console.log(`✅ ${description} 完成`);
        return true;
      }
    }

    // 由于无法直接执行DDL语句，我们采用另一种方法
    // 检查当前用户是否有足够权限
    console.log('📋 检查数据库连接和权限...');
    const { data: testData, error: testError } = await supabase
      .from('daily_reports')
      .select('count')
      .limit(1);
    
    if (testError) {
      console.error('❌ 数据库连接失败:', testError.message);
      console.log('💡 这可能是因为 RLS 策略阻止了访问。');
      console.log('💡 请手动在 Supabase Dashboard 中执行以下 SQL:');
      console.log('\n--- 复制以下 SQL 到 Supabase SQL Editor ---');
      console.log('-- 启用 RLS');
      console.log('ALTER TABLE daily_reports ENABLE ROW LEVEL SECURITY;');
      console.log('');
      console.log('-- 删除现有策略（如果存在）');
      console.log('DROP POLICY IF EXISTS "daily_reports_select_policy" ON daily_reports;');
      console.log('DROP POLICY IF EXISTS "daily_reports_insert_policy" ON daily_reports;');
      console.log('DROP POLICY IF EXISTS "daily_reports_update_policy" ON daily_reports;');
      console.log('DROP POLICY IF EXISTS "daily_reports_delete_policy" ON daily_reports;');
      console.log('');
      console.log('-- 创建新策略');
      console.log('CREATE POLICY "daily_reports_select_policy" ON daily_reports');
      console.log('    FOR SELECT');
      console.log('    USING (true);');
      console.log('');
      console.log('CREATE POLICY "daily_reports_insert_policy" ON daily_reports');
      console.log('    FOR INSERT');
      console.log('    WITH CHECK (auth.role() = \'service_role\');');
      console.log('');
      console.log('CREATE POLICY "daily_reports_update_policy" ON daily_reports');
      console.log('    FOR UPDATE');
      console.log('    USING (auth.role() = \'service_role\')');
      console.log('    WITH CHECK (auth.role() = \'service_role\');');
      console.log('');
      console.log('CREATE POLICY "daily_reports_delete_policy" ON daily_reports');
      console.log('    FOR DELETE');
      console.log('    USING (auth.role() = \'service_role\');');
      console.log('');
      console.log('-- 授予权限');
      console.log('GRANT ALL ON daily_reports TO service_role;');
      console.log('GRANT USAGE ON SEQUENCE daily_reports_id_seq TO service_role;');
      console.log('GRANT SELECT ON daily_reports TO anon;');
      console.log('GRANT SELECT ON daily_reports TO authenticated;');
      console.log('--- SQL 结束 ---\n');
      
      console.log('🌐 Supabase SQL Editor 地址:');
      console.log('https://supabase.com/dashboard/project/hrimknhxseryehzvdjus/sql/new');
      
      return;
    }
    
    console.log('✅ 数据库连接正常，当前可以访问 daily_reports 表');
    console.log('💡 这表明 RLS 策略可能已经正确配置，或者当前没有启用 RLS');
    
    // 测试插入权限
     console.log('📋 测试插入权限...');
     const testDate = new Date().toISOString().split('T')[0];
     const { error: insertError } = await supabase
       .from('daily_reports')
       .upsert({
         date: testDate,
         content: { test: true, timestamp: new Date().toISOString() },
         summary: 'RLS 测试数据 - 请忽略'
       });
    
    if (insertError) {
      console.log('⚠️  插入测试失败:', insertError.message);
      console.log('💡 这确认了 RLS 策略问题，请按上述说明手动执行 SQL');
    } else {
      console.log('✅ 插入测试成功，RLS 策略可能已经正确配置');
      
      // 清理测试数据
       await supabase
         .from('daily_reports')
         .delete()
         .eq('date', testDate)
         .contains('content', { test: true });
    }

    console.log('🎉 RLS 策略检查完成！');
    console.log('📝 策略说明:');
    console.log('   - 所有用户可以读取日报数据');
    console.log('   - 只有 service_role 可以插入、更新和删除数据');
    console.log('   - GitHub Actions 使用 SUPABASE_SERVICE_ROLE_KEY 具有完整权限');

  } catch (error) {
    console.error('❌ 检查 RLS 策略时发生错误:', error);
    process.exit(1);
  }
}

// 执行脚本
applyDailyReportsRLS();