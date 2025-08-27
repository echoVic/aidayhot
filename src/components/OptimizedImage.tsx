'use client';

import { useMemoizedFn } from 'ahooks';
import Image from 'next/image';
import React, { useEffect, useRef, useState } from 'react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  quality?: number;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  sizes?: string;
  fill?: boolean;
  style?: React.CSSProperties;
  onLoad?: () => void;
  onError?: () => void;
  // Advanced optimization options
  lazy?: boolean;
  progressive?: boolean;
  webpFallback?: boolean;
  responsive?: boolean;
  preload?: boolean;
  fadeIn?: boolean;
  retryOnError?: boolean;
  maxRetries?: number;
}



/**
 * Optimized image component with advanced features
 */
export default function OptimizedImage({
  src,
  alt,
  width,
  height,
  className = '',
  priority = false,
  quality = 75,
  placeholder = 'blur',
  blurDataURL,
  sizes,
  fill = false,
  style,
  onLoad,
  onError,
  lazy = true,
  progressive = true,
  webpFallback = true,
  responsive = true,
  preload = false,
  fadeIn = true,
  retryOnError = true,
  maxRetries = 3,
}: OptimizedImageProps) {
  const [imageState, setImageState] = useState({
    loading: !priority,
    loaded: false,
    error: false,
    retryCount: 0,
    currentSrc: src,
  });

  const imageRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Generate optimized src
  const getOptimizedSrc = useMemoizedFn(async (originalSrc: string): Promise<string> => {
    try {
      // For external images or when optimization is not needed, return original
      if (originalSrc.startsWith('http') && !originalSrc.includes(window.location.hostname)) {
        return originalSrc;
      }

      // Use Next.js built-in image optimization
      const params = new URLSearchParams({
        url: originalSrc,
        w: width?.toString() || '800',
        q: quality.toString(),
      });

      return `/_next/image?${params.toString()}`;
    } catch (error) {
      console.warn('Image optimization failed:', error);
      return originalSrc;
    }
  });

  // Handle image load
  const handleLoad = useMemoizedFn(() => {
    setImageState(prev => ({
      ...prev,
      loading: false,
      loaded: true,
      error: false,
    }));
    onLoad?.();
  });

  // Handle image error with retry logic
  const handleError = useMemoizedFn(async () => {
    if (retryOnError && imageState.retryCount < maxRetries) {
      console.warn(`Image load failed, retrying... (${imageState.retryCount + 1}/${maxRetries})`);

      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 1000 * (imageState.retryCount + 1)));

      setImageState(prev => ({
        ...prev,
        retryCount: prev.retryCount + 1,
        error: false,
        loading: true,
      }));
    } else {
      setImageState(prev => ({
        ...prev,
        loading: false,
        error: true,
      }));
      onError?.();
    }
  });

  // Setup intersection observer for lazy loading
  useEffect(() => {
    if (!lazy || priority || typeof window === 'undefined') return;

    const currentRef = imageRef.current;
    if (!currentRef) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setImageState(prev => ({ ...prev, loading: true }));
            observerRef.current?.disconnect();
          }
        });
      },
      { threshold: 0.1, rootMargin: '50px' }
    );

    observerRef.current.observe(currentRef);

    return () => {
      observerRef.current?.disconnect();
    };
  }, [lazy, priority]);

  // Update src when props change
  useEffect(() => {
    const updateSrc = async () => {
      const optimizedSrc = await getOptimizedSrc(src);
      setImageState(prev => ({
        ...prev,
        currentSrc: optimizedSrc,
        loading: !imageState.loaded,
      }));
    };

    updateSrc();
  }, [src, getOptimizedSrc, imageState.loaded]);

  // Generate responsive sizes if not provided
  const responsiveSizes = sizes || (responsive ?
    '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw' :
    undefined
  );

  // Generate blur placeholder
  const defaultBlurDataURL = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIHZpZXdCb3g9IjAgMCAxMCAxMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSIjZjNmNGY2Ii8+Cjwvc3ZnPgo=';

  // Component classes
  const imageClasses = [
    className,
    fadeIn && imageState.loaded ? 'transition-opacity duration-300 opacity-100' : '',
    fadeIn && imageState.loading ? 'opacity-0' : '',
    imageState.error ? 'opacity-50' : '',
  ].filter(Boolean).join(' ');

  // Error fallback
  if (imageState.error) {
    return (
      <div
        className={`bg-gray-200 flex items-center justify-center ${className}`}
        style={{ width, height, ...style }}
        ref={imageRef}
        role="img"
        aria-label={alt}
      >
        <span className="text-gray-500 text-sm">图片加载失败</span>
      </div>
    );
  }

  return (
    <div ref={imageRef} className="relative">
      {imageState.loading && (
        <div
          className="absolute inset-0 bg-gray-200 animate-pulse"
          style={{ width, height }}
          role="status"
          aria-label="图片加载中"
        >
          <span className="sr-only">图片加载中...</span>
        </div>
      )}

      <Image
        src={imageState.currentSrc}
        alt={alt}
        width={width}
        height={height}
        fill={fill}
        sizes={responsiveSizes}
        quality={quality}
        priority={priority}
        placeholder={placeholder}
        blurDataURL={blurDataURL || defaultBlurDataURL}
        className={imageClasses}
        style={style}
        onLoad={handleLoad}
        onError={handleError}
        unoptimized={imageState.currentSrc.startsWith('http') && !imageState.currentSrc.includes('_next/image')}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
      />
    </div>
  );
}
