import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import crypto from 'crypto';
import { sendVerificationEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const { email, preferences = { frequency: 'daily', categories: ['all'] } } = await request.json();

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return NextResponse.json(
        { error: '请输入有效的邮箱地址' },
        { status: 400 }
      );
    }

    // 检查是否已经订阅
    const { data: existingSubscriber, error: checkError } = await supabase
      .from('subscribers')
      .select('*')
      .eq('email', email)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      throw checkError;
    }

    if (existingSubscriber) {
      if (existingSubscriber.status === 'confirmed') {
        return NextResponse.json(
          { message: '该邮箱已经订阅过了' },
          { status: 409 }
        );
      } else if (existingSubscriber.status === 'pending') {
        // 重新发送验证邮件
        await sendVerificationEmail(email, existingSubscriber.verification_token);
        return NextResponse.json({
          message: '验证邮件已重新发送，请检查您的邮箱'
        });
      } else if (existingSubscriber.status === 'unsubscribed') {
        // 重新激活订阅
        const verificationToken = crypto.randomBytes(32).toString('hex');
        const { error: updateError } = await supabase
          .from('subscribers')
          .update({
            status: 'pending',
            verification_token: verificationToken,
            preferences,
            unsubscribed_at: null
          })
          .eq('email', email);

        if (updateError) throw updateError;

        await sendVerificationEmail(email, verificationToken);
        return NextResponse.json({
          message: '订阅已重新激活，请检查您的邮箱进行验证'
        });
      }
    }

    // 创建新订阅
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const { error: insertError } = await supabase
      .from('subscribers')
      .insert({
        email,
        verification_token: verificationToken,
        preferences,
        status: 'pending'
      });

    if (insertError) throw insertError;

    // 发送验证邮件
    await sendVerificationEmail(email, verificationToken);

    return NextResponse.json({
      message: '订阅成功！请检查您的邮箱并点击验证链接完成订阅'
    });

  } catch (error) {
    console.error('订阅失败:', error);
    return NextResponse.json(
      { error: '订阅失败，请稍后重试' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const token = searchParams.get('token');

    if (!email || !token) {
      return NextResponse.json(
        { error: '缺少必要参数' },
        { status: 400 }
      );
    }

    // 验证取消订阅令牌并更新状态
    const { error } = await supabase
      .from('subscribers')
      .update({
        status: 'unsubscribed',
        unsubscribed_at: new Date().toISOString()
      })
      .eq('email', email)
      .eq('verification_token', token);

    if (error) throw error;

    return NextResponse.json({
      message: '已成功取消订阅'
    });

  } catch (error) {
    console.error('取消订阅失败:', error);
    return NextResponse.json(
      { error: '取消订阅失败，请稍后重试' },
      { status: 500 }
    );
  }
}
