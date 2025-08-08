'use client';

import { Copy } from 'lucide-react';
import React from 'react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  url: string;
  title: string;
  copySuccess: boolean;
  onCopy: () => void;
}

const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  url,
  title,
  copySuccess,
  onCopy
}) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">分享日报</h3>
          <p className="text-gray-600 mb-4">{title}</p>
          
          <div className="flex items-center gap-2 mb-6">
            <input 
              type="text" 
              value={url} 
              readOnly 
              className="flex-1 p-2 border border-gray-300 rounded text-sm bg-gray-50"
            />
            <button
              onClick={onCopy}
              className="p-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center gap-1"
            >
              <Copy className="h-4 w-4" />
              {copySuccess ? '已复制' : '复制'}
            </button>
          </div>
          
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
            >
              关闭
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;