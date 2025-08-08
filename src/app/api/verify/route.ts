import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: '验证令牌缺失' },
        { status: 400 }
      );
    }

    // 查找并验证令牌
    const { data: subscriber, error: findError } = await supabase
      .from('subscribers')
      .select('*')
      .eq('verification_token', token)
      .eq('status', 'pending')
      .single();

    if (findError || !subscriber) {
      return NextResponse.json(
        { error: '无效的验证令牌或链接已过期' },
        { status: 400 }
      );
    }

    // 更新订阅状态为已确认
    const { error: updateError } = await supabase
      .from('subscribers')
      .update({
        status: 'confirmed',
        confirmed_at: new Date().toISOString(),
        verification_token: null // 清除令牌
      })
      .eq('id', subscriber.id);

    if (updateError) throw updateError;

    // 重定向到成功页面
    return NextResponse.redirect(
      new URL('/subscription/success', request.url)
    );

  } catch (error) {
    console.error('邮箱验证失败:', error);
    return NextResponse.redirect(
      new URL('/subscription/error', request.url)
    );
  }
}
