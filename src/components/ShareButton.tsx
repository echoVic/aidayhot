'use client';

import { Share2 } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { Report } from './DailyReportCard';
import MultiCardShare from './MultiCardShare';
import ShareDailyReport from './ShareDailyReport';

interface ShareButtonProps {
  report: Report;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'icon' | 'button';
  children?: React.ReactNode;
}

const ShareButton: React.FC<ShareButtonProps> = ({
  report,
  className = '',
  size = 'md',
  variant = 'icon',
  children
}) => {
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isMultiCardModalOpen, setIsMultiCardModalOpen] = useState(false);
  const [showShareOptions, setShowShareOptions] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 点击外部关闭下拉菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowShareOptions(false);
      }
    };

    if (showShareOptions) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showShareOptions]);

  const sizeClasses = {
    sm: 'p-1.5',
    md: 'p-2',
    lg: 'p-3'
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowShareOptions(!showShareOptions);
  };

  const handleSingleCardShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsShareModalOpen(true);
    setShowShareOptions(false);
  };

  const handleMultiCardShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMultiCardModalOpen(true);
    setShowShareOptions(false);
  };

  if (variant === 'button') {
    return (
      <>
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={handleClick}
            className={`flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors ${className}`}
          >
            <Share2 className={iconSizes[size]} />
            {children || '分享'}
          </button>
          
          {/* 分享选项下拉菜单 */}
          {showShareOptions && (
            <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
              <div className="py-2">
                <button
                  onClick={handleMultiCardShare}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                >
                  <Share2 className="h-4 w-4" />
                  多卡片分享
                  <span className="ml-auto text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">推荐</span>
                </button>
                <button
                  onClick={handleSingleCardShare}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                >
                  <Share2 className="h-4 w-4" />
                  单张卡片分享
                </button>
              </div>
            </div>
          )}
        </div>
        
        <ShareDailyReport
          report={report}
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
        />
        
        <MultiCardShare
          report={report}
          isOpen={isMultiCardModalOpen}
          onClose={() => setIsMultiCardModalOpen(false)}
        />
      </>
    );
  }

  return (
    <>
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={handleClick}
          className={`${sizeClasses[size]} text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors ${className}`}
          title="分享日报"
          aria-label="分享日报"
        >
          <Share2 className={iconSizes[size]} />
        </button>
        
        {/* 分享选项下拉菜单 */}
        {showShareOptions && (
          <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
            <div className="py-2">
               <button
                onClick={handleMultiCardShare}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
              >
                <Share2 className="h-4 w-4" />
                多卡片分享
                <span className="ml-auto text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">推荐</span>
              </button>
              <button
                onClick={handleSingleCardShare}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
              >
                <Share2 className="h-4 w-4" />
                单张卡片分享
              </button>
            </div>
          </div>
        )}
      </div>
      
      <ShareDailyReport
        report={report}
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
      />
      
      <MultiCardShare
        report={report}
        isOpen={isMultiCardModalOpen}
        onClose={() => setIsMultiCardModalOpen(false)}
      />
    </>
  );
};

export default ShareButton;