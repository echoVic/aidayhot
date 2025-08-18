'use client';

import { toPng, toJpeg } from 'html-to-image';
import { FileText, Image, Link2, MessageCircle, Twitter } from 'lucide-react';
import React, { useRef, useState } from 'react';
import {
  copyToClipboard,
  downloadTextFile,
  formatDateForShare,
  generateReportMarkdown,
  generateShareUrl,
  shareToSocial
} from '../utils/shareUtils';
import { Report } from './DailyReportCard';
import ShareModal from './ShareModal';

interface ShareDailyReportProps {
  report: Report;
  isOpen: boolean;
  onClose: () => void;
}

const ShareDailyReport: React.FC<ShareDailyReportProps> = ({ report, isOpen, onClose }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [imageFormat, setImageFormat] = useState<'png' | 'jpeg'>('png');
  const cardRef = useRef<HTMLDivElement>(null);

  // 重置状态当弹窗关闭时
  React.useEffect(() => {
    if (!isOpen) {
      setIsGenerating(false);
      setShareUrl('');
    }
  }, [isOpen]);

  // 生成分享链接
  const handleGenerateShareUrl = async () => {
    const url = generateShareUrl(report);
    setShareUrl(url);
    
    // 复制到剪贴板
    const success = await copyToClipboard(url);
    if (success) {
      alert('分享链接已复制到剪贴板！');
    } else {
      alert('复制失败，请手动复制链接');
    }
  };

  // 生成图片
  const generateImage = async () => {
    if (!cardRef.current) return;
    
    setIsGenerating(true);
    try {
      // 等待内容完全渲染
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const generateFunction = imageFormat === 'png' ? toPng : toJpeg;
      const fileExtension = imageFormat === 'png' ? 'png' : 'jpg';
      
      const dataUrl = await generateFunction(cardRef.current, {
        quality: 1.0,
        pixelRatio: 4, // 提高像素密度
        backgroundColor: '#ffffff',
        // 使用实际元素尺寸，确保响应式设计正确渲染
        width: cardRef.current.offsetWidth,
        height: cardRef.current.scrollHeight,
        fetchRequestInit: {
          cache: 'no-cache',
        },
        skipFonts: false,
        style: {
          overflow: 'visible',
          boxSizing: 'border-box',
          // 添加文字渲染优化
          textRendering: 'optimizeLegibility',
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale'
        } as any,
        // 优化的过滤函数
        filter: (node) => {
          if (node.nodeType === Node.TEXT_NODE) return true;
          if (node.tagName === 'SCRIPT' || node.tagName === 'STYLE') return false;
          return true;
        }
      });
      
      // 下载图片
      const link = document.createElement('a');
      link.download = `AI日报-${report.date}.${fileExtension}`;
      link.href = dataUrl;
      link.click();
      
      console.log('图片生成成功');
    } catch (error) {
      console.error('生成图片失败:', error);
      alert('生成图片失败，请重试');
    } finally {
      setIsGenerating(false);
    }
  };

  // 生成 Markdown
  const handleGenerateMarkdown = () => {
    const markdown = generateReportMarkdown(report);
    downloadTextFile(markdown, `AI日报-${report.date}.md`, 'text/markdown');
  };

  if (!isOpen) return null;

  return (
    <ShareModal
      isOpen={isOpen}
      onClose={onClose}
      title="分享日报"
      maxWidth="max-w-4xl"
    >
      <div className="space-y-8">
        {/* 图片格式选择 */}
        <div className="mb-6">
          <div className="text-center mb-4">
            <h3 className="text-lg font-medium text-gray-900 mb-2">图片格式选择</h3>
            <p className="text-sm text-gray-500">选择适合的图片格式以获得最佳效果</p>
          </div>
          <div className="flex justify-center gap-3">
            <button
              onClick={() => setImageFormat('png')}
              className={`px-4 py-2 rounded-lg border transition-all duration-200 ${
                imageFormat === 'png'
                  ? 'bg-blue-500 text-white border-blue-500 shadow-md'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-blue-300'
              }`}
            >
              PNG (推荐)
            </button>
            <button
              onClick={() => setImageFormat('jpeg')}
              className={`px-4 py-2 rounded-lg border transition-all duration-200 ${
                imageFormat === 'jpeg'
                  ? 'bg-blue-500 text-white border-blue-500 shadow-md'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-blue-300'
              }`}
            >
              JPEG
            </button>
          </div>
          <div className="text-center mt-2">
            <p className="text-xs text-gray-500">
              {imageFormat === 'png' 
                ? 'PNG格式：无损压缩，文字更清晰，适合公众号分享' 
                : 'JPEG格式：文件更小，加载更快，适合网络分享'
              }
            </p>
          </div>
        </div>

        {/* 主要分享选项 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* 生成图片 */}
          <button
            onClick={generateImage}
            disabled={isGenerating}
            className="group relative overflow-hidden bg-gradient-to-br from-blue-50 to-blue-100/50 hover:from-blue-100 hover:to-blue-200/50 border border-blue-200/50 rounded-xl p-4 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            <div className="flex flex-col items-center space-y-2">
              <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center group-hover:bg-blue-500/20 transition-colors duration-300">
                <Image className={`h-4 w-4 text-blue-600 ${isGenerating ? 'animate-pulse' : ''}`} />
              </div>
              <div className="text-center">
                <div className="font-medium text-gray-900 text-xs">
                  {isGenerating ? '生成中...' : '生成图片'}
                </div>
                <div className="text-[10px] text-gray-600 leading-tight mt-0.5">
                  高清 {imageFormat.toUpperCase()} 格式
                </div>
              </div>
            </div>
            {/* 微妙的光效 */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
          </button>

          {/* 生成 Markdown */}
          <button
            onClick={handleGenerateMarkdown}
            className="group relative overflow-hidden bg-gradient-to-br from-emerald-50 to-emerald-100/50 hover:from-emerald-100 hover:to-emerald-200/50 border border-emerald-200/50 rounded-xl p-4 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg"
          >
            <div className="flex flex-col items-center space-y-2">
              <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors duration-300">
                <FileText className="h-4 w-4 text-emerald-600" />
              </div>
              <div className="text-center">
                <div className="font-medium text-gray-900 text-xs">导出 Markdown</div>
                <div className="text-[10px] text-gray-600 leading-tight mt-0.5">
                  结构化文档
                </div>
              </div>
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
          </button>

          {/* 分享链接 */}
          <button
            onClick={handleGenerateShareUrl}
            className="group relative overflow-hidden bg-gradient-to-br from-purple-50 to-purple-100/50 hover:from-purple-100 hover:to-purple-200/50 border border-purple-200/50 rounded-xl p-4 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg"
          >
            <div className="flex flex-col items-center space-y-2">
              <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center group-hover:bg-purple-500/20 transition-colors duration-300">
                <Link2 className="h-4 w-4 text-purple-600" />
              </div>
              <div className="text-center">
                <div className="font-medium text-gray-900 text-xs">复制链接</div>
                <div className="text-[10px] text-gray-600 leading-tight mt-0.5">
                  快速分享
                </div>
              </div>
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
          </button>
        </div>

        {/* 社交媒体分享 */}
        <div className="pt-2">
          <div className="text-center mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">社交平台</h3>
            <p className="text-sm text-gray-500">一键分享到你喜欢的平台</p>
          </div>
          <div className="flex justify-center gap-3">
            <button
              onClick={() => shareToSocial('twitter', report)}
              className="group flex items-center gap-3 px-6 py-3 bg-[#1DA1F2] hover:bg-[#1a91da] text-white rounded-xl transition-all duration-200 hover:scale-105 hover:shadow-lg"
            >
              <Twitter className="h-5 w-5" />
              <span className="font-medium">Twitter</span>
            </button>
            <button
              onClick={() => shareToSocial('weibo', report)}
              className="group flex items-center gap-3 px-6 py-3 bg-[#E6162D] hover:bg-[#d1142a] text-white rounded-xl transition-all duration-200 hover:scale-105 hover:shadow-lg"
            >
              <MessageCircle className="h-5 w-5" />
              <span className="font-medium">微博</span>
            </button>
            <button
              onClick={() => shareToSocial('wechat', report)}
              className="group flex items-center gap-3 px-6 py-3 bg-[#07C160] hover:bg-[#06ad56] text-white rounded-xl transition-all duration-200 hover:scale-105 hover:shadow-lg"
            >
              <MessageCircle className="h-5 w-5" />
              <span className="font-medium">微信</span>
            </button>
            </div>
          </div>
        </div>

        {/* 预览卡片 */}
        <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 rounded-2xl p-6 border border-slate-200/50">
          <div className="text-center mb-4">
            <h3 className="text-base font-medium text-gray-900 mb-1">预览效果</h3>
            <p className="text-xs text-gray-500">生成图片时的预览效果（显示完整日报内容）</p>
          </div>
          <div>
            <div className="flex justify-center w-full px-4">
              <div 
                ref={cardRef}
                style={{ 
                  width: '100%',
                  maxWidth: '1200px',
                  minWidth: '320px',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                  fontSize: 'clamp(12px, 1.2vw, 16px)', // 响应式字体大小
                  lineHeight: '1.4',
                  boxSizing: 'border-box',
                  backgroundColor: '#ffffff',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  boxShadow: '0 20px 40px rgba(0, 0, 0, 0.08), 0 8px 16px rgba(0, 0, 0, 0.04)',
                  border: '1px solid rgba(0, 0, 0, 0.06)',
                  // 添加文字渲染优化
                  textRendering: 'optimizeLegibility',
                  WebkitFontSmoothing: 'antialiased',
                  MozOsxFontSmoothing: 'grayscale'
                } as any}
              >
            {/* 卡片头部 */}
            <div style={{
              background: 'linear-gradient(135deg, #1D4ED8 0%, #3B82F6 50%, #60A5FA 100%)',
              color: 'white',
              padding: '32px',
              textAlign: 'center',
              borderRadius: '16px 16px 0 0',
              boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.1)'
            }}>
              <h1 style={{
                fontSize: 'clamp(24px, 3vw, 36px)', // 响应式标题大小
                fontWeight: '600',
                margin: '0 0 clamp(12px, 1.5vw, 20px) 0', // 响应式间距
                letterSpacing: '-0.5px',
                textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)'
              }}>AI 每日热点</h1>
              <p style={{
                fontSize: 'clamp(12px, 1.4vw, 16px)', // 响应式日期大小
                opacity: '0.85',
                margin: '0',
                fontWeight: '500',
                letterSpacing: '0.2px'
              }}>{formatDateForShare(report.date)}</p>
            </div>

            {/* 卡片内容 */}
            <div style={{ 
              padding: 'clamp(16px, 2.5vw, 32px)', // 响应式内边距
              boxSizing: 'border-box',
              width: '100%'
            }}>
              {/* 总结部分 */}
              <div style={{ marginBottom: 'clamp(16px, 2vw, 24px)' }}> {/* 响应式间距 */}
                <h2 style={{
                  fontSize: 'clamp(16px, 1.8vw, 20px)', // 响应式标题大小
                  fontWeight: '600',
                  color: '#1f2937',
                  margin: '0 0 clamp(8px, 1vw, 12px) 0', // 响应式间距
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'clamp(6px, 0.8vw, 8px)', // 响应式间距
                  width: '100%',
                  boxSizing: 'border-box',
                  letterSpacing: '-0.2px'
                }}>
                  <span>📊</span>
                  今日总结
                </h2>
                <p style={{
                  fontSize: 'clamp(12px, 1.4vw, 16px)', // 响应式正文大小
                  color: '#6b7280',
                  lineHeight: '1.6',
                  margin: '0',
                  wordWrap: 'break-word',
                  width: '100%',
                  boxSizing: 'border-box'
                }}>{report.summary}</p>
              </div>

              {/* 统计信息 */}
              <div style={{
                display: 'flex',
                gap: 'clamp(12px, 1.5vw, 20px)', // 响应式间距
                marginBottom: 'clamp(12px, 1.5vw, 20px)', // 响应式间距
                justifyContent: 'center',
                flexWrap: 'wrap' // 小屏幕时允许换行
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    fontSize: 'clamp(20px, 2.5vw, 28px)', // 响应式数字大小
                    fontWeight: '600',
                    color: '#3b82f6',
                    letterSpacing: '-0.3px'
                  }}>{report.content.articles.length}</div>
                  <div style={{
                    fontSize: 'clamp(11px, 1.2vw, 14px)', // 响应式描述文字大小
                    color: '#6b7280',
                    fontWeight: '500'
                  }}>今日资讯</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    fontSize: 'clamp(20px, 2.5vw, 28px)', // 响应式数字大小
                    fontWeight: '600',
                    color: '#10b981',
                    letterSpacing: '-0.3px'
                  }}>{report.content.metadata.sources.length}</div>
                  <div style={{
                    fontSize: 'clamp(11px, 1.2vw, 14px)', // 响应式描述文字大小
                    color: '#6b7280',
                    fontWeight: '500'
                  }}>数据来源</div>
                </div>
              </div>

              {/* 所有文章列表 */}
              <div>
                <h3 style={{
                  fontSize: 'clamp(16px, 1.8vw, 20px)', // 响应式标题大小
                  fontWeight: '600',
                  color: '#1f2937',
                  margin: '0 0 clamp(12px, 1.5vw, 16px) 0', // 响应式间距
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'clamp(6px, 0.8vw, 8px)', // 响应式间距
                  letterSpacing: '-0.2px'
                }}>
                  <span>📰</span>
                  今日资讯
                </h3>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', // 响应式网格
                  gap: 'clamp(12px, 1.5vw, 16px)', // 响应式间距
                  width: '100%'
                }}>
                  {report.content.articles.map((article, index) => (
                    <div key={index} style={{
                      padding: 'clamp(8px, 1vw, 12px)', // 响应式内边距
                      backgroundColor: '#f8fafc',
                      borderRadius: 'clamp(6px, 0.8vw, 8px)', // 响应式圆角
                      border: '1px solid #e2e8f0',
                      boxSizing: 'border-box'
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 'clamp(6px, 0.8vw, 8px)', // 响应式间距
                        marginBottom: 'clamp(4px, 0.6vw, 6px)' // 响应式间距
                      }}>
                        <div style={{
                          width: 'clamp(16px, 1.5vw, 18px)', // 响应式序号大小
                          height: 'clamp(16px, 1.5vw, 18px)', // 响应式序号大小
                          background: '#3b82f6',
                          color: 'white',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 'clamp(9px, 1vw, 11px)', // 响应式序号字体
                          fontWeight: 'bold',
                          flexShrink: 0
                        }}>{index + 1}</div>
                        <h4 style={{
                          fontSize: 'clamp(11px, 1.2vw, 14px)', // 响应式标题字体
                          fontWeight: '600',
                          color: '#111827',
                          margin: '0',
                          lineHeight: '1.3',
                          wordWrap: 'break-word',
                          flex: 1
                        }}>{article.title}</h4>
                      </div>
                      {article.aiSummary && (
                        <p style={{
                          fontSize: 'clamp(9px, 1vw, 12px)', // 响应式摘要字体
                          color: '#64748b',
                          margin: '0 0 clamp(4px, 0.6vw, 6px) 0', // 响应式间距
                          lineHeight: '1.4',
                          fontStyle: 'italic'
                        }}>💭 {article.aiSummary}</p>
                      )}
                      <p style={{
                        fontSize: 'clamp(9px, 1vw, 11px)', // 响应式来源字体
                        color: '#94a3b8',
                        margin: '0'
                      }}>
                        {article.source} • {new Date(article.publishTime).toLocaleDateString('zh-CN')}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 卡片底部 */}
            <div style={{
              background: '#f9fafb',
              padding: 'clamp(12px, 1.5vw, 16px) clamp(16px, 2vw, 20px)', // 响应式内边距
              textAlign: 'center',
              borderTop: '1px solid #f3f4f6'
            }}>
              <p style={{
                fontSize: 'clamp(11px, 1.2vw, 14px)', // 响应式版权字体
                color: '#6b7280',
                margin: '0 0 clamp(4px, 0.6vw, 6px) 0' // 响应式间距
              }}>由 AI 自动生成和整理</p>
              <p style={{
                fontSize: 'clamp(10px, 1vw, 12px)', // 响应式描述字体
                color: '#9ca3af',
                margin: '0',
                fontWeight: '500'
              }}>aidayhot.com</p>
            </div>
              </div>
            </div>
          </div>
        </div>

        {/* 分享链接显示 */}
        {shareUrl && (
          <div className="border-t bg-gradient-to-r from-green-50 to-blue-50 p-6">
            <div className="max-w-2xl mx-auto">
              <div className="text-center mb-4">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  链接已生成
                </div>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0">
                    <Link2 className="h-5 w-5 text-gray-400" />
                  </div>
                  <code className="flex-1 text-sm text-gray-700 bg-gray-50 px-3 py-2 rounded border font-mono">
                    {shareUrl}
                  </code>
                  <button
                    onClick={() => copyToClipboard(shareUrl)}
                    className="flex-shrink-0 px-3 py-2 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors"
                  >
                    复制
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
    </ShareModal>
  );
};

export default ShareDailyReport;