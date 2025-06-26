#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

function showSetupGuide() {
  console.log('🚀 aidayhot RSS管理系统 - 快速设置指南');
  console.log('==========================================\n');

  // 检查环境变量
  const hasSupabaseUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
  const hasServiceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!hasSupabaseUrl || !hasServiceKey) {
    console.log('📋 第1步: 设置环境变量');
    console.log('========================');
    console.log('请创建 .env.local 文件并添加以下内容:');
    console.log('');
    console.log('```');
    console.log('NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url');
    console.log('SUPABASE_SERVICE_ROLE_KEY=your_service_role_key');
    console.log('```');
    console.log('');
    console.log('💡 获取这些值的方法:');
    console.log('1. 登录 https://app.supabase.com');
    console.log('2. 选择您的项目');
    console.log('3. 在左侧菜单选择 "Settings" -> "API"');
    console.log('4. 复制 "URL" 和 "service_role" 密钥');
    console.log('');
  } else {
    console.log('✅ 环境变量已设置');
  }

  console.log('📋 第2步: 数据库设置');
  console.log('====================');
  
  // 读取SQL文件内容
  const sqlPath = path.join(process.cwd(), 'database/schema-feed-sources.sql');
  if (fs.existsSync(sqlPath)) {
    const sqlContent = fs.readFileSync(sqlPath, 'utf-8');
    
    console.log('选择以下方式之一来设置数据库:');
    console.log('');
    console.log('方式A: 自动脚本（需要环境变量）');
    console.log('npm run db-setup');
    console.log('');
    console.log('方式B: 手动执行（推荐）');
    console.log('1. 登录 Supabase Dashboard');
    console.log('2. 进入 SQL Editor');
    console.log('3. 复制并执行以下SQL:');
    console.log('');
    console.log('```sql');
    console.log(sqlContent);
    console.log('```');
  }

  console.log('');
  console.log('📋 第3步: 导入RSS源');
  console.log('==================');
  console.log('数据库设置完成后，运行:');
  console.log('npm run parse-opml');
  console.log('');

  console.log('📋 第4步: 收集RSS数据');
  console.log('=====================');
  console.log('RSS源导入后，运行:');
  console.log('npm run collect-rss');
  console.log('');

  console.log('🎉 完成后，运行 npm run dev 启动应用！');
}

showSetupGuide(); 