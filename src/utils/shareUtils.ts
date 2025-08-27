import { Report } from '../types';

/**
 * 格式化日期为中文格式
 */
export const formatDateForShare = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  });
};

/**
 * 生成日报的 Markdown 内容
 */
export const generateReportMarkdown = (report: Report): string => {
  const formattedDate = formatDateForShare(report.date);
  
  const markdown = `# AI 日报 - ${formattedDate}

## 📊 今日总结

${report.summary}

## 📰 今日资讯 (${report.content.articles.length} 条)

${report.content.articles.map((article, index) => `
### ${index + 1}. ${article.title}

${article.aiSummary || ''}

- **来源**: ${article.source}
- **发布时间**: ${new Date(article.publishTime).toLocaleString('zh-CN')}
- **原文链接**: [查看详情](${article.url})
${article.tags ? `- **标签**: ${article.tags.join(', ')}` : ''}
`).join('\n')}

## 📊 数据来源

本日报基于 ${report.content.metadata.totalArticles} 篇文章生成，数据来源包括：

${report.content.metadata.sources.map(source => `- ${source}`).join('\n')}

---

*本日报由 AI 自动生成和整理*
`;

  return markdown;
};

/**
 * 下载文本文件
 */
export const downloadTextFile = (content: string, filename: string, mimeType: string = 'text/plain'): void => {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
};

/**
 * 复制文本到剪贴板
 */
export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('复制到剪贴板失败:', error);
    // 降级方案
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const result = document.execCommand('copy');
      document.body.removeChild(textArea);
      return result;
    } catch (fallbackError) {
      console.error('降级复制方案也失败:', fallbackError);
      return false;
    }
  }
};

/**
 * 生成分享链接
 */
export const generateShareUrl = (report: Report): string => {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  return `${baseUrl}?date=${report.date}`;
};

/**
 * 生成社交媒体分享文本
 */
export const generateSocialShareText = (report: Report): string => {
  const formattedDate = formatDateForShare(report.date);
  const shareUrl = generateShareUrl(report);
  
  return `📊 AI 日报 - ${formattedDate}

${report.summary.slice(0, 100)}${report.summary.length > 100 ? '...' : ''}

📰 今日收录 ${report.content.articles.length} 条 AI 资讯
🔗 查看完整日报: ${shareUrl}

#AI日报 #人工智能 #科技资讯`;
};

/**
 * 分享到不同平台
 */
export const shareToSocial = (platform: 'twitter' | 'weibo' | 'wechat', report: Report): void => {
  const text = generateSocialShareText(report);
  const url = generateShareUrl(report);
  
  switch (platform) {
    case 'twitter':
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank');
      break;
    case 'weibo':
      window.open(`https://service.weibo.com/share/share.php?url=${encodeURIComponent(url)}&title=${encodeURIComponent(text)}`, '_blank');
      break;
    case 'wechat':
      // 微信分享通常需要复制链接
      copyToClipboard(url);
      alert('链接已复制，请在微信中粘贴分享');
      break;
  }
};