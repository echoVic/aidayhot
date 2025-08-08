'use client';

import { useState } from 'react';
import { Mail, Check, AlertCircle, Loader2 } from 'lucide-react';

interface EmailSubscriptionProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showDescription?: boolean;
}

export default function EmailSubscription({ 
  className = '', 
  size = 'md',
  showDescription = true 
}: EmailSubscriptionProps) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setStatus('error');
      setMessage('请输入邮箱地址');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setStatus('error');
      setMessage('请输入有效的邮箱地址');
      return;
    }

    setStatus('loading');
    setMessage('');

    try {
      const response = await fetch('/api/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email,
          preferences: {
            frequency: 'daily',
            categories: ['all']
          }
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus('success');
        setMessage(data.message || '订阅成功！请检查您的邮箱');
        setEmail('');
      } else {
        setStatus('error');
        setMessage(data.error || '订阅失败，请稍后重试');
      }
    } catch (error) {
      setStatus('error');
      setMessage('网络错误，请稍后重试');
      console.error('订阅失败:', error);
    }
  };

  const sizeClasses = {
    sm: {
      container: 'p-4',
      title: 'text-lg',
      description: 'text-sm',
      input: 'px-3 py-2 text-sm',
      button: 'px-4 py-2 text-sm',
      icon: 'w-4 h-4'
    },
    md: {
      container: 'p-6',
      title: 'text-xl',
      description: 'text-base',
      input: 'px-4 py-3',
      button: 'px-6 py-3',
      icon: 'w-5 h-5'
    },
    lg: {
      container: 'p-8',
      title: 'text-2xl',
      description: 'text-lg',
      input: 'px-5 py-4 text-lg',
      button: 'px-8 py-4 text-lg',
      icon: 'w-6 h-6'
    }
  };

  const currentSize = sizeClasses[size];

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${currentSize.container} ${className}`}>
      <div className="text-center mb-6">
        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Mail className="w-6 h-6 text-blue-600" />
        </div>
        <h3 className={`font-bold text-gray-900 mb-2 ${currentSize.title}`}>
          订阅 AI 日报
        </h3>
        {showDescription && (
          <p className={`text-gray-600 ${currentSize.description}`}>
            每日精选 AI 资讯，直接发送到您的邮箱
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="请输入您的邮箱地址"
            className={`w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${currentSize.input}`}
            disabled={status === 'loading'}
          />
        </div>

        <button
          type="submit"
          disabled={status === 'loading'}
          className={`w-full bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 ${currentSize.button}`}
        >
          {status === 'loading' ? (
            <>
              <Loader2 className={`animate-spin ${currentSize.icon}`} />
              订阅中...
            </>
          ) : (
            <>
              <Mail className={currentSize.icon} />
              立即订阅
            </>
          )}
        </button>
      </form>

      {/* 状态消息 */}
      {message && (
        <div className={`mt-4 p-3 rounded-lg flex items-center gap-2 ${
          status === 'success' 
            ? 'bg-green-50 text-green-700 border border-green-200' 
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {status === 'success' ? (
            <Check className="w-4 h-4 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
          )}
          <span className="text-sm">{message}</span>
        </div>
      )}

      {/* 订阅说明 */}
      {showDescription && (
        <div className="mt-6 pt-4 border-t border-gray-100">
          <div className="text-xs text-gray-500 space-y-1">
            <p>• 每日推送精选 AI 技术资讯</p>
            <p>• 深度分析和行业洞察</p>
            <p>• 开源项目和工具推荐</p>
            <p>• 随时可以取消订阅</p>
          </div>
        </div>
      )}
    </div>
  );
}
