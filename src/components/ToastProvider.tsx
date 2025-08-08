'use client';

import { Toaster } from 'react-hot-toast';


// Toast Provider 组件
export default function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      reverseOrder={false}
      gutter={8}
      containerClassName=""
      containerStyle={{
        top: 80, // 考虑到 header 的高度
      }}
      toastOptions={{
        duration: 3000,
        style: {
          borderRadius: '8px',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          fontSize: '14px',
          fontWeight: '500',
          padding: '12px 16px',
          maxWidth: '400px',
        },
        success: {
          style: {
            background: '#F0FDF4',
            color: '#166534',
            border: '1px solid #BBF7D0',
          },
          iconTheme: {
            primary: '#10B981',
            secondary: '#F0FDF4',
          },
        },
        error: {
          style: {
            background: '#FEF2F2',
            color: '#991B1B',
            border: '1px solid #FECACA',
          },
          iconTheme: {
            primary: '#EF4444',
            secondary: '#FEF2F2',
          },
        },
        loading: {
          style: {
            background: '#F9FAFB',
            color: '#374151',
            border: '1px solid #E5E7EB',
          },
        },
      }}
    />
  );
} 