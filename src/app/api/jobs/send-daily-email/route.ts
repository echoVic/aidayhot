import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { sendDailyReportToAllSubscribers } from '@/lib/email';

// 验证请求授权（支持 Vercel Cron 或 Bearer token）
function isAuthorized(request: NextRequest): boolean {
  // 检查 Vercel Cron 头
  const vecelCronHeader = request.headers.get('x-vercel-cron');
  if (vecelCronHeader === '1') {
    return true;
  }

  // 检查 Bearer token
  const authHeader = request.headers.get('authorization');
  const expectedToken = process.env.CRON_SECRET;
  if (expectedToken && authHeader === `Bearer ${expectedToken}`) {
    return true;
  }

  // 检查 URL token 参数（备用方案）
  const { searchParams } = new URL(request.url);
  const urlToken = searchParams.get('token');
  if (expectedToken && urlToken === expectedToken) {
    return true;
  }

  return false;
}

export async function POST(request: NextRequest) {
  try {
    // 验证请求来源
    if (!isAuthorized(request)) {
      return NextResponse.json(
        { error: '未授权访问' },
        { status: 401 }
      );
    }

    // 获取今天的日报
    const today = new Date().toISOString().split('T')[0];
    const { data: report, error } = await supabase
      .from('daily_reports')
      .select('*')
      .eq('date', today)
      .single();

    if (error || !report) {
      console.log('今日暂无日报数据');
      return NextResponse.json({
        message: '今日暂无日报数据',
        date: today
      });
    }

    // 发送邮件给所有订阅者
    const result = await sendDailyReportToAllSubscribers(report);

    return NextResponse.json({
      message: '日报邮件发送完成',
      date: today,
      sent: result.sent,
      failed: result.failed || 0
    });

  } catch (error) {
    console.error('发送日报邮件失败:', error);
    return NextResponse.json(
      { error: '发送失败', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// 手动触发发送（用于测试）
export async function GET(request: NextRequest) {
  try {
    // 验证请求来源
    if (!isAuthorized(request)) {
      return NextResponse.json(
        { error: '未授权访问' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];
    
    // 获取指定日期的日报
    const { data: report, error } = await supabase
      .from('daily_reports')
      .select('*')
      .eq('date', date)
      .single();

    if (error || !report) {
      return NextResponse.json(
        { error: `${date} 日期的日报数据不存在` },
        { status: 404 }
      );
    }

    // 发送邮件给所有订阅者
    const result = await sendDailyReportToAllSubscribers(report);

    return NextResponse.json({
      message: '测试邮件发送完成',
      date: date,
      sent: result.sent,
      failed: result.failed || 0
    });

  } catch (error) {
    console.error('测试发送失败:', error);
    return NextResponse.json(
      { error: '发送失败', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
