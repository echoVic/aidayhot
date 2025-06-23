'use client';

import Image from 'next/image';
import React, { useCallback, useEffect, useRef, useState } from 'react';

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

interface ImageState {
  isLoading: boolean;
  isLoaded: boolean;
  hasError: boolean;
  retryCount: number;
  currentSrc: string;
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
  const [imageState, setImageState] = useState<ImageState>({
    isLoading: !priority,
    isLoaded: false,
    hasError: false,
    retryCount: 0,
    currentSrc: src,
  });

  const imageRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Generate optimized src
  const getOptimizedSrc = useCallback(async (originalSrc: string): Promise<string> => {
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
  }, [width, quality]);

  // Handle image load
  const handleLoad = useCallback(() => {
    setImageState(prev => ({
      ...prev,
      isLoading: false,
      isLoaded: true,
      hasError: false,
    }));
    onLoad?.();
  }, [onLoad]);

  // Handle image error with retry logic
  const handleError = useCallback(async () => {
    if (retryOnError && imageState.retryCount < maxRetries) {
      console.warn(`Image load failed, retrying... (${imageState.retryCount + 1}/${maxRetries})`);
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 1000 * (imageState.retryCount + 1)));
      
      setImageState(prev => ({
        ...prev,
        retryCount: prev.retryCount + 1,
        hasError: false,
        isLoading: true,
      }));
    } else {
      setImageState(prev => ({
        ...prev,
        isLoading: false,
        hasError: true,
      }));
      onError?.();
    }
  }, [retryOnError, maxRetries, imageState.retryCount, onError]);

  // Setup intersection observer for lazy loading
  useEffect(() => {
    if (!lazy || priority || typeof window === 'undefined') return;

    const currentRef = imageRef.current;
    if (!currentRef) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setImageState(prev => ({ ...prev, isLoading: true }));
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
        isLoading: !imageState.isLoaded,
      }));
    };

    updateSrc();
  }, [src, getOptimizedSrc, imageState.isLoaded]);

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
    fadeIn && imageState.isLoaded ? 'transition-opacity duration-300 opacity-100' : '',
    fadeIn && imageState.isLoading ? 'opacity-0' : '',
    imageState.hasError ? 'opacity-50' : '',
  ].filter(Boolean).join(' ');

  // Error fallback
  if (imageState.hasError) {
    return (
      <div 
        className={`bg-gray-200 flex items-center justify-center ${className}`}
        style={{ width, height, ...style }}
        ref={imageRef}
      >
        <span className="text-gray-500 text-sm">图片加载失败</span>
      </div>
    );
  }

  return (
    <div ref={imageRef} className="relative">
      {imageState.isLoading && (
        <div 
          className="absolute inset-0 bg-gray-200 animate-pulse"
          style={{ width, height }}
        />
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
      />
    </div>
  );
}
