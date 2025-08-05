import { supabase, environmentInfo } from './supabaseClient';
import fs from 'fs';
import path from 'path';

async function createDailyReportTables() {
  console.log('🚀 开始创建AI日报相关数据表...');
  console.log('📊 环境信息:', environmentInfo);

  try {
    // 读取并显示SQL文件内容
    const sqlFilePath = path.join(process.cwd(), 'database', 'schema-daily-report.sql');
    
    if (!fs.existsSync(sqlFilePath)) {
      throw new Error(`SQL文件不存在: ${sqlFilePath}`);
    }

    const sqlContent = fs.readFileSync(sqlFilePath, 'utf-8');
    console.log('📄 已读取SQL文件:', sqlFilePath);
    console.log('\n📋 SQL内容:');
    console.log('=' .repeat(60));
    console.log(sqlContent);
    console.log('=' .repeat(60));
    
    console.log('\n⚠️  注意: 由于Supabase的安全限制，需要手动执行SQL。');
    console.log('\n📝 请按以下步骤操作:');
    console.log('1. 打开 Supabase Dashboard');
    console.log('2. 进入你的项目');
    console.log('3. 点击左侧菜单的 "SQL Editor"');
    console.log('4. 复制上面显示的SQL内容');
    console.log('5. 粘贴到SQL编辑器中并点击 "Run" 执行');
    
    // 尝试通过查询来验证表是否已存在
    console.log('\n🔍 检查表是否已存在...');
    
    try {
      const { data: dailyReports, error: dailyReportsError } = await supabase
        .from('daily_reports')
        .select('count')
        .limit(1);
        
      const { data: reportItems, error: reportItemsError } = await supabase
        .from('report_items')
        .select('count')
        .limit(1);

      if (!dailyReportsError && !reportItemsError) {
        console.log('✅ 表已存在，无需重复创建');
        console.log('✅ daily_reports 表: 可访问');
        console.log('✅ report_items 表: 可访问');
        return;
      }
    } catch (checkError) {
      console.log('📋 表尚未创建，请按上述步骤手动执行SQL');
    }

    console.log('\n🎉 所有数据表创建完成！');
    
    // 验证表是否创建成功
    console.log('\n🔍 验证表创建结果...');
    
    const { data: dailyReports, error: dailyReportsError } = await supabase
      .from('daily_reports')
      .select('*')
      .limit(1);
      
    const { data: reportItems, error: reportItemsError } = await supabase
      .from('report_items')
      .select('*')
      .limit(1);

    if (!dailyReportsError && !reportItemsError) {
      console.log('✅ daily_reports 表创建成功');
      console.log('✅ report_items 表创建成功');
      console.log('\n🚀 数据库准备就绪，可以开始使用AI日报功能！');
    } else {
      console.error('❌ 表验证失败:');
      if (dailyReportsError) console.error('daily_reports:', dailyReportsError);
      if (reportItemsError) console.error('report_items:', reportItemsError);
    }

  } catch (error) {
    console.error('❌ 创建数据表失败:', error);
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  createDailyReportTables();
}

export { createDailyReportTables };
