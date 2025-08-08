'use client';

import { Share2 } from 'lucide-react';
import React, { useState } from 'react';
import { Report } from './DailyReportCard';
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
    setIsShareModalOpen(true);
  };

  if (variant === 'button') {
    return (
      <>
        <button
          onClick={handleClick}
          className={`flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors ${className}`}
        >
          <Share2 className={iconSizes[size]} />
          {children || '分享'}
        </button>
        
        <ShareDailyReport
          report={report}
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
        />
      </>
    );
  }

  return (
    <>
      <button
        onClick={handleClick}
        className={`${sizeClasses[size]} text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors ${className}`}
        title="分享日报"
        aria-label="分享日报"
      >
        <Share2 className={iconSizes[size]} />
      </button>
      
      <ShareDailyReport
        report={report}
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
      />
    </>
  );
};

export default ShareButton;