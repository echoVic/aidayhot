'use client';

import { toJpeg, toPng, toSvg } from 'html-to-image';
import { Download } from 'lucide-react';
import React, { useRef, useState } from 'react';
import { CardData, Report, ShareComponentProps } from '../types';
import { formatDateForShare } from '../utils/shareUtils';
import ShareModal from './ShareModal';

const MultiCardShare: React.FC<ShareComponentProps> = ({ report, isOpen, onClose }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [imageFormat, setImageFormat] = useState<'png' | 'jpeg' | 'webp' | 'svg'>('png');
  const [selectedCards, setSelectedCards] = useState<Set<string>>(new Set());
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // 根据内容长度智能拆分卡片
  const splitIntoCards = (report: Report): CardData[] => {
    const cards: CardData[] = [];
    const articles = report.content.articles;
    const maxArticlesPerCard = 6; // 每张卡片最多6篇文章
    
    // 总结卡片
    cards.push({
      id: 'summary',
      title: '今日总结',
      content: [],
      type: 'summary'
    });
    
    // 按文章数量拆分
    for (let i = 0; i < articles.length; i += maxArticlesPerCard) {
      const cardArticles = articles.slice(i, i + maxArticlesPerCard);
      const cardNumber = Math.floor(i / maxArticlesPerCard) + 1;
      
      cards.push({
        id: `articles-${cardNumber}`,
        title: `今日资讯 (${cardNumber}/${Math.ceil(articles.length / maxArticlesPerCard)})`,
        content: cardArticles,
        type: 'articles'
      });
    }
    
    return cards;
  };

  const cards = splitIntoCards(report);

  // 切换卡片选择
  const toggleCardSelection = (cardId: string) => {
    const newSelected = new Set(selectedCards);
    if (newSelected.has(cardId)) {
      newSelected.delete(cardId);
    } else {
      newSelected.add(cardId);
    }
    setSelectedCards(newSelected);
  };

  // 全选/取消全选
  const toggleSelectAll = () => {
    if (selectedCards.size === cards.length) {
      setSelectedCards(new Set());
    } else {
      setSelectedCards(new Set(cards.map(card => card.id)));
    }
  };

  // 生成单张卡片图片
  const generateSingleCardImage = async (cardId: string) => {
    const cardElement = cardRefs.current.get(cardId);
    if (!cardElement) return;

    setIsGenerating(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      let generateFunction;
      let fileExtension;
      
      switch (imageFormat) {
        case 'png':
          generateFunction = toPng;
          fileExtension = 'png';
          break;
        case 'jpeg':
          generateFunction = toJpeg;
          fileExtension = 'jpg';
          break;
        case 'webp':
          generateFunction = toPng;
          fileExtension = 'webp';
          break;
        case 'svg':
          generateFunction = toSvg;
          fileExtension = 'svg';
          break;
        default:
          generateFunction = toPng;
          fileExtension = 'png';
      }
      
      const options: any = {
        quality: 1.0,
        backgroundColor: '#ffffff',
        width: cardElement.offsetWidth,
        height: cardElement.scrollHeight,
        pixelRatio: imageFormat !== 'svg' ? 3 : 1,
        style: {
          overflow: 'visible',
          boxSizing: 'border-box',
          textRendering: 'optimizeLegibility',
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale'
        }
      };
      
      let dataUrl = await generateFunction(cardElement, options);
      
      // WebP格式转换
      if (imageFormat === 'webp') {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = document.createElement('img');
        
        await new Promise<void>((resolve, reject) => {
          img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx?.drawImage(img, 0, 0);
            dataUrl = canvas.toDataURL('image/webp', 0.9);
            resolve();
          };
          img.onerror = () => reject(new Error('Failed to load image'));
          img.src = dataUrl;
        });
      }
      
      const link = document.createElement('a');
      const card = cards.find(c => c.id === cardId);
      link.download = `AI日报-${report.date}-${card?.title || cardId}.${fileExtension}`;
      link.href = dataUrl;
      link.click();
      
    } catch (error) {
      console.error('生成图片失败:', error);
      alert('生成图片失败，请重试');
    } finally {
      setIsGenerating(false);
    }
  };

  // 批量下载选中的卡片
  const downloadSelectedCards = async () => {
    if (selectedCards.size === 0) {
      alert('请先选择要下载的卡片');
      return;
    }

    setIsGenerating(true);
    try {
      for (const cardId of selectedCards) {
        await generateSingleCardImage(cardId);
        // 添加延迟避免浏览器阻止多个下载
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } finally {
      setIsGenerating(false);
    }
  };

  // 渲染卡片内容
  const renderCard = (card: CardData) => {
    return (
      <div
        key={card.id}
        ref={(el) => {
          if (el) {
            cardRefs.current.set(card.id, el);
          }
        }}
        style={{
          width: '100%',
          maxWidth: '600px',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          fontSize: '14px',
          lineHeight: '1.5',
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          border: '1px solid rgba(0, 0, 0, 0.06)',
          textRendering: 'optimizeLegibility',
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale'
        } as any}
      >
        {/* 卡片头部 */}
        <div style={{
          background: 'linear-gradient(135deg, #1D4ED8 0%, #3B82F6 50%, #60A5FA 100%)',
          color: 'white',
          padding: '24px',
          textAlign: 'center'
        }}>
          <h1 style={{
            fontSize: '24px',
            fontWeight: '600',
            margin: '0 0 8px 0',
            letterSpacing: '-0.5px'
          }}>AI 每日热点</h1>
          <p style={{
            fontSize: '14px',
            opacity: '0.9',
            margin: '0 0 4px 0',
            fontWeight: '500'
          }}>{formatDateForShare(report.date)}</p>
          <p style={{
            fontSize: '12px',
            opacity: '0.8',
            margin: '0',
            fontWeight: '400'
          }}>{card.title}</p>
        </div>

        {/* 卡片内容 */}
        <div style={{ padding: '24px' }}>
          {card.type === 'summary' ? (
            // 总结卡片
            <div>
              <h2 style={{
                fontSize: '18px',
                fontWeight: '600',
                color: '#1f2937',
                margin: '0 0 12px 0',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span>📊</span>
                今日总结
              </h2>
              <div style={{
                backgroundColor: '#f0f9ff',
                border: '1px solid #e0f2fe',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '16px'
              }}>
                <p style={{
                  fontSize: '14px',
                  color: '#374151',
                  lineHeight: '1.6',
                  margin: '0'
                }}>{report.summary}</p>
              </div>
              
              {/* 统计信息 */}
              <div style={{
                display: 'flex',
                gap: '24px',
                justifyContent: 'center',
                marginTop: '16px'
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    fontSize: '24px',
                    fontWeight: '600',
                    color: '#3b82f6'
                  }}>{report.content.articles.length}</div>
                  <div style={{
                    fontSize: '12px',
                    color: '#6b7280',
                    fontWeight: '500'
                  }}>今日资讯</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    fontSize: '24px',
                    fontWeight: '600',
                    color: '#10b981'
                  }}>{report.content.metadata.sources.length}</div>
                  <div style={{
                    fontSize: '12px',
                    color: '#6b7280',
                    fontWeight: '500'
                  }}>数据来源</div>
                </div>
              </div>
            </div>
          ) : (
            // 文章卡片
            <div>
              <h2 style={{
                fontSize: '18px',
                fontWeight: '600',
                color: '#1f2937',
                margin: '0 0 16px 0',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span>📰</span>
                {card.title}
              </h2>
              <div style={{
                display: 'grid',
                gap: '12px'
              }}>
                {card.content.map((article, index) => (
                  <div key={index} style={{
                    padding: '12px',
                    backgroundColor: '#f8fafc',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '8px',
                      marginBottom: '6px'
                    }}>
                      <div style={{
                        width: '18px',
                        height: '18px',
                        background: '#3b82f6',
                        color: 'white',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '10px',
                        fontWeight: 'bold',
                        flexShrink: 0
                      }}>{index + 1}</div>
                      <h4 style={{
                        fontSize: '13px',
                        fontWeight: '600',
                        color: '#111827',
                        margin: '0',
                        lineHeight: '1.3',
                        flex: 1
                      }}>{article.title}</h4>
                    </div>
                    {article.aiSummary && (
                      <p style={{
                        fontSize: '11px',
                        color: '#64748b',
                        margin: '0 0 6px 0',
                        lineHeight: '1.4',
                        fontStyle: 'italic',
                        paddingLeft: '26px'
                      }}>💭 {article.aiSummary}</p>
                    )}
                    <p style={{
                      fontSize: '10px',
                      color: '#94a3b8',
                      margin: '0',
                      paddingLeft: '26px'
                    }}>
                      {article.source} • {new Date(article.publishTime).toLocaleDateString('zh-CN')}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 卡片底部 */}
        <div style={{
          background: '#f9fafb',
          padding: '12px 16px',
          textAlign: 'center',
          borderTop: '1px solid #f3f4f6'
        }}>
          <p style={{
            fontSize: '11px',
            color: '#6b7280',
            margin: '0 0 4px 0'
          }}>由 AI 自动生成和整理</p>
          <p style={{
            fontSize: '10px',
            color: '#9ca3af',
            margin: '0',
            fontWeight: '500'
          }}>dayhot.top</p>
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <ShareModal
      isOpen={isOpen}
      onClose={onClose}
      title="多卡片分享"
      maxWidth="max-w-6xl"
    >
      <div className="space-y-6">
        {/* 格式选择 */}
        <div className="space-y-4">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">选择图片格式</h3>
            <p className="text-sm text-gray-600">选择适合的图片格式以获得最佳效果</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 max-w-2xl mx-auto">
            {(['png', 'jpeg', 'webp', 'svg'] as const).map((format) => (
              <button
                key={format}
                onClick={() => setImageFormat(format)}
                className={`p-3 rounded-lg border transition-all duration-200 ${
                  imageFormat === format
                    ? 'bg-blue-500 text-white border-blue-500 shadow-md'
                    : 'bg-white hover:bg-blue-50 border-gray-200 hover:border-blue-300 text-gray-900'
                }`}
              >
                <div className="text-xs font-semibold mb-1">{format.toUpperCase()}</div>
                <div className="text-[10px] opacity-80">
                  {format === 'png' && '无损压缩，文字清晰'}
                  {format === 'jpeg' && '文件更小，加载快'}
                  {format === 'webp' && '现代格式，体积小'}
                  {format === 'svg' && '矢量格式，无限缩放'}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* 卡片选择 */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">选择要下载的卡片</h3>
            <div className="flex items-center gap-3">
              <button
                onClick={toggleSelectAll}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                {selectedCards.size === cards.length ? '取消全选' : '全选'}
              </button>
              <button
                onClick={downloadSelectedCards}
                disabled={selectedCards.size === 0 || isGenerating}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Download className="h-4 w-4" />
                {isGenerating ? '生成中...' : `下载选中 (${selectedCards.size})`}
              </button>
            </div>
          </div>
          
          <div className="text-sm text-gray-600">
            根据内容长度，已自动拆分为 {cards.length} 张卡片，便于社交平台分享
          </div>
        </div>

        {/* 卡片预览网格 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {cards.map((card) => (
            <div key={card.id} className="space-y-3">
              {/* 卡片选择器 */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedCards.has(card.id)}
                    onChange={() => toggleCardSelection(card.id)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="font-medium text-gray-900">{card.title}</span>
                  {card.type === 'articles' && (
                    <span className="text-xs text-gray-500">({card.content.length} 篇文章)</span>
                  )}
                </label>
                <button
                  onClick={() => generateSingleCardImage(card.id)}
                  disabled={isGenerating}
                  className="flex items-center gap-1 px-3 py-1 text-xs bg-white border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-50 transition-colors"
                >
                  <Download className="h-3 w-3" />
                  单独下载
                </button>
              </div>
              
              {/* 卡片预览 */}
              <div className="flex justify-center">
                <div className="transform scale-75 origin-top">
                  {renderCard(card)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </ShareModal>
  );
};

export default MultiCardShare;