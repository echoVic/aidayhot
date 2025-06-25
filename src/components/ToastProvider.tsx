'use client';

import { Toaster, toast } from 'react-hot-toast';

// Toast 方法
export const showToast = {
  success: (message: string, title?: string) => {
    toast.success(title ? `${title}: ${message}` : message, {
      duration: 3000,
      position: 'top-right',
      style: {
        background: '#10B981',
        color: '#fff',
        fontSize: '14px',
        fontWeight: '500',
      },
    });
  },
  error: (message: string, title?: string) => {
    toast.error(title ? `${title}: ${message}` : message, {
      duration: 5000,
      position: 'top-right',
      style: {
        background: '#EF4444',
        color: '#fff',
        fontSize: '14px',
        fontWeight: '500',
      },
    });
  },
  warning: (message: string, title?: string) => {
    toast(title ? `${title}: ${message}` : message, {
      duration: 4000,
      position: 'top-right',
      icon: '⚠️',
      style: {
        background: '#F59E0B',
        color: '#fff',
        fontSize: '14px',
        fontWeight: '500',
      },
    });
  },
  info: (message: string, title?: string) => {
    toast(title ? `${title}: ${message}` : message, {
      duration: 3000,
      position: 'top-right',
      icon: 'ℹ️',
      style: {
        background: '#3B82F6',
        color: '#fff',
        fontSize: '14px',
        fontWeight: '500',
      },
    });
  },
  loading: (message: string) => {
    return toast.loading(message, {
      position: 'top-right',
      style: {
        background: '#6B7280',
        color: '#fff',
        fontSize: '14px',
        fontWeight: '500',
      },
    });
  },
  dismiss: (toastId?: string) => {
    toast.dismiss(toastId);
  },
};

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