import { Resend } from 'resend';
import { supabase } from './supabase';

// 邮件配置（Resend）
const resend = new Resend(process.env.RESEND_API_KEY || '');

// 验证邮件模板
const getVerificationEmailTemplate = (verificationUrl: string) => {
  return {
    subject: '确认您的 AI 日报订阅',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>确认订阅</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; padding: 20px 0; border-bottom: 2px solid #3b82f6; }
          .content { padding: 30px 0; }
          .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 14px; color: #6b7280; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="color: #3b82f6; margin: 0;">AI 日报</h1>
          </div>
          <div class="content">
            <h2>欢迎订阅 AI 日报！</h2>
            <p>感谢您订阅我们的 AI 日报。为了确保邮件能够正常发送到您的邮箱，请点击下面的按钮确认您的订阅：</p>
            <div style="text-align: center;">
              <a href="${verificationUrl}" class="button">确认订阅</a>
            </div>
            <p>如果按钮无法点击，请复制以下链接到浏览器地址栏：</p>
            <p style="word-break: break-all; background: #f3f4f6; padding: 10px; border-radius: 4px;">
              ${verificationUrl}
            </p>
            <p><strong>您将收到什么：</strong></p>
            <ul>
              <li>每日精选的 AI 技术资讯</li>
              <li>深度分析和行业洞察</li>
              <li>开源项目和工具推荐</li>
              <li>社区讨论和热门话题</li>
            </ul>
          </div>
          <div class="footer">
            <p>如果您没有订阅此服务，请忽略此邮件。</p>
            <p>此邮件由系统自动发送，请勿直接回复。</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      欢迎订阅 AI 日报！
      
      感谢您订阅我们的 AI 日报。请点击以下链接确认您的订阅：
      ${verificationUrl}
      
      您将收到：
      - 每日精选的 AI 技术资讯
      - 深度分析和行业洞察
      - 开源项目和工具推荐
      - 社区讨论和热门话题
      
      如果您没有订阅此服务，请忽略此邮件。
    `
  };
};

// 日报邮件模板
const getDailyReportEmailTemplate = (report: any, unsubscribeUrl: string) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    });
  };

  // 邮件中仅展示前10条，其余通过站点查看
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.dayhot.top';
  const totalArticles = Array.isArray(report?.content?.articles) ? report.content.articles.length : 0;
  const remainingCount = Math.max(0, totalArticles - 10);
  const moreUrl = `${baseUrl}/?date=${encodeURIComponent(report.date)}`;

  return {
    subject: `AI 日报 - ${formatDate(report.date)}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>AI 日报</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; padding: 20px 0; border-bottom: 2px solid #3b82f6; }
          .date { color: #6b7280; font-size: 16px; margin-bottom: 10px; }
          .summary { background: #eff6ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6; }
          .articles { margin: 30px 0; }
          .article { margin-bottom: 25px; padding-bottom: 20px; border-bottom: 1px solid #e5e7eb; }
          .article:last-child { border-bottom: none; }
          .article-title { font-size: 18px; font-weight: 600; margin-bottom: 8px; }
          .article-title a { color: #1f2937; text-decoration: none; }
          .article-title a:hover { color: #3b82f6; }
          .article-meta { font-size: 14px; color: #6b7280; margin-bottom: 10px; }
          .article-summary { color: #4b5563; }
          .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 14px; color: #6b7280; text-align: center; }
          .unsubscribe { margin-top: 20px; }
          .unsubscribe a { color: #6b7280; text-decoration: underline; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="color: #3b82f6; margin: 0;">AI 日报</h1>
            <div class="date">${formatDate(report.date)}</div>
          </div>
          
          <div class="summary">
            <h2 style="margin-top: 0; color: #1e40af;">📊 今日总结</h2>
            <div>${report.summary.replace(/\n/g, '<br>')}</div>
          </div>
          
          <div class="articles">
            <h2 style="color: #1f2937;">📰 今日资讯</h2>
            ${report.content.articles.slice(0, 10).map((article: any, index: number) => `
              <div class="article">
                <div class="article-title">
                  <a href="${article.url}" target="_blank">${index + 1}. ${article.title}</a>
                </div>
                <div class="article-meta">
                  🕒 ${new Date(article.publishTime).toLocaleString('zh-CN')} | 📰 ${article.source}
                </div>
                ${article.aiSummary ? `<div class="article-summary">${article.aiSummary}</div>` : ''}
              </div>
            `).join('')}
          </div>
          
          ${remainingCount > 0 ? `
          <div class="more" style="text-align: center; margin: 16px 0 8px;">
            <a href="${moreUrl}" target="_blank" class="button">查看更多（剩余 ${remainingCount} 条）</a>
            <div style="font-size: 12px; color: #6b7280; margin-top: 8px;">在网站上查看全部 ${totalArticles} 条</div>
          </div>
          ` : ''}

          <div class="footer">
            <p>感谢您订阅 AI 日报！</p>
            <div class="unsubscribe">
              <a href="${unsubscribeUrl}">取消订阅</a>
            </div>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      AI 日报 - ${formatDate(report.date)}
      
      📊 今日总结
      ${report.summary}
      
      📰 今日资讯
       ${report.content.articles.slice(0, 10).map((article: any, index: number) => 
         `${index + 1}. ${article.title}\n   ${article.url}\n   ${article.source} | ${new Date(article.publishTime).toLocaleString('zh-CN')}\n   ${article.aiSummary || ''}\n`
      ).join('\n')}
      ${remainingCount > 0 ? `\n查看更多（剩余 ${remainingCount} 条）: ${moreUrl}\n` : ''}
       
       取消订阅: ${unsubscribeUrl}
     `
  };
};

// 发送验证邮件
export async function sendVerificationEmail(email: string, token: string) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.dayhot.top';
  const verificationUrl = `${baseUrl}/api/verify?token=${token}`;
  const template = getVerificationEmailTemplate(verificationUrl);
  
  try {
    const { data, error } = await resend.emails.send({
      from: process.env.FROM_EMAIL as string,
      to: email,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });

    if (error) throw (error instanceof Error ? error : new Error(String(error)));

    console.log('验证邮件发送成功:', data?.id);
    return { success: true, messageId: data?.id };
  } catch (error) {
    console.error('验证邮件发送失败:', error);
    throw error;
  }
}

// 发送日报邮件（可选 subscriberId 用于日志关联）
export async function sendDailyReportEmail(
  email: string,
  report: any,
  unsubscribeToken: string,
  subscriberId?: string
) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.dayhot.top';
  const unsubscribeUrl = `${baseUrl}/api/subscribe?email=${encodeURIComponent(email)}&token=${unsubscribeToken}`;
  const template = getDailyReportEmailTemplate(report, unsubscribeUrl);
  
  try {
    const { data, error } = await resend.emails.send({
      from: process.env.FROM_EMAIL as string,
      to: email,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });

    if (error) throw (error instanceof Error ? error : new Error(String(error)));

    // 记录发送日志
    await supabase
      .from('email_logs')
      .insert({
        subscriber_id: subscriberId ?? null,
        email_type: 'daily_report',
        subject: template.subject,
        status: 'sent',
        sent_at: new Date().toISOString(),
      });

    console.log('日报邮件发送成功:', data?.id);
    return { success: true, messageId: data?.id };
  } catch (error) {
    console.error('日报邮件发送失败:', error);
    
    // 记录失败日志
    await supabase
      .from('email_logs')
      .insert({
        subscriber_id: subscriberId ?? null,
        email_type: 'daily_report',
        subject: template.subject,
        status: 'failed',
        error_message: error instanceof Error ? error.message : String(error),
      });
    
    throw error;
  }
}

// 批量发送日报
export async function sendDailyReportToAllSubscribers(report: any) {
  try {
    // 获取所有已确认的订阅者
    const { data: subscribers, error } = await supabase
      .from('subscribers')
      .select('*')
      .eq('status', 'confirmed');

    if (error) throw error;

    if (!subscribers || subscribers.length === 0) {
      console.log('没有找到已确认的订阅者');
      return { success: true, sent: 0 };
    }

    let successCount = 0;
    let failureCount = 0;

    // 批量发送（建议分批处理以避免邮件服务器限制）
    for (const subscriber of subscribers) {
      try {
        await sendDailyReportEmail(
          subscriber.email,
          report,
          subscriber.verification_token || '',
          subscriber.id
        );
        successCount++;
        
        // 添加延迟以避免触发邮件服务器的速率限制
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`发送给 ${subscriber.email} 失败:`, error);
        failureCount++;
      }
    }

    console.log(`日报发送完成: 成功 ${successCount}, 失败 ${failureCount}`);
    return { success: true, sent: successCount, failed: failureCount };

  } catch (error) {
    console.error('批量发送日报失败:', error);
    throw error;
  }
}
