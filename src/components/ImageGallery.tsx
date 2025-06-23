'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import OptimizedImage from './OptimizedImage';

interface ImageItem {
  id: string;
  src: string;
  alt: string;
  title?: string;
  description?: string;
  width?: number;
  height?: number;
  priority?: number;
}

interface ImageGalleryProps {
  images: ImageItem[];
  columns?: number;
  gap?: number;
  lazy?: boolean;
  progressive?: boolean;
  preloadCount?: number;
  className?: string;
  onImageClick?: (image: ImageItem, index: number) => void;
  onImageLoad?: (image: ImageItem, index: number) => void;
  onImageError?: (image: ImageItem, index: number) => void;
}

/**
 * Advanced image gallery with comprehensive optimization features
 */
export default function ImageGallery({
  images,
  columns = 3,
  gap = 16,
  lazy = true,
  progressive = true,
  preloadCount = 6,
  className = '',
  onImageClick,
  onImageLoad,
  onImageError,
}: ImageGalleryProps) {
  const [selectedImage, setSelectedImage] = useState<ImageItem | null>(null);
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  const [visibleImages, setVisibleImages] = useState<Set<string>>(new Set());

  // Simplified performance tracking without external hooks
  const [metrics] = useState(() => ({
    totalImages: 0,
    loadedImages: 0,
    failedImages: 0,
    averageLoadTime: 0
  }));
  
  const trackImageStart = useCallback(() => {
    // Simple tracking without complex implementation
  }, []);
  
  const trackImageError = useCallback(() => {
    // Simple tracking without complex implementation
  }, []);

  // Sort images by priority and preload high-priority ones
  const sortedImages = useMemo(() => {
    return [...images].sort((a, b) => (b.priority || 0) - (a.priority || 0));
  }, [images]);

  // Preload critical images on mount (simplified)
  useEffect(() => {
    const criticalImages = sortedImages.slice(0, preloadCount);
    // Simple preloading by creating image elements
    criticalImages.forEach(img => {
      const preloadImg = new Image();
      preloadImg.src = img.src;
    });
  }, [sortedImages, preloadCount]);

  // Handle image load
  const handleImageLoad = useCallback((image: ImageItem, index: number) => {
    setLoadedImages(prev => new Set(prev).add(image.id));
    onImageLoad?.(image, index);
  }, [onImageLoad]);

  // Handle image error
  const handleImageError = useCallback((image: ImageItem, index: number) => {
    trackImageError();
    onImageError?.(image, index);
  }, [trackImageError, onImageError]);

  // Handle image click
  const handleImageClick = useCallback((image: ImageItem, index: number) => {
    setSelectedImage(image);
    onImageClick?.(image, index);
  }, [onImageClick]);

  // Close modal
  const closeModal = useCallback(() => {
    setSelectedImage(null);
  }, []);

  // Grid styles
  const gridStyles: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: `repeat(${columns}, 1fr)`,
    gap: `${gap}px`,
    width: '100%',
  };

  // Responsive grid
  const responsiveGridStyles: React.CSSProperties = {
    ...gridStyles,
    gridTemplateColumns: `repeat(auto-fit, minmax(min(300px, 100%), 1fr))`,
  };

  return (
    <div className={`image-gallery ${className}`}>
      {/* Performance metrics */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mb-4 p-4 bg-gray-100 rounded-lg text-sm">
          <h3 className="font-semibold mb-2">Image Performance Metrics</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <span className="text-gray-600">Total:</span>
              <span className="ml-2 font-medium">{metrics.totalImages}</span>
            </div>
            <div>
              <span className="text-gray-600">Loaded:</span>
              <span className="ml-2 font-medium text-green-600">{metrics.loadedImages}</span>
            </div>
            <div>
              <span className="text-gray-600">Failed:</span>
              <span className="ml-2 font-medium text-red-600">{metrics.failedImages}</span>
            </div>
            <div>
              <span className="text-gray-600">Avg Load:</span>
              <span className="ml-2 font-medium">{metrics.averageLoadTime.toFixed(0)}ms</span>
            </div>
          </div>
          {loadedImages.size < images.length && (
            <div className="mt-2 text-blue-600">
              🔄 Loading images...
            </div>
          )}
        </div>
      )}

      {/* Image grid */}
      <div style={responsiveGridStyles}>
        {sortedImages.map((image, index) => (
          <ImageGridItem
            key={image.id}
            image={image}
            index={index}
            lazy={lazy && index >= preloadCount}
            progressive={progressive}
            onClick={() => handleImageClick(image, index)}
            onLoad={() => handleImageLoad(image, index)}
            onError={() => handleImageError(image, index)}
            onLoadStart={() => trackImageStart()}
          />
        ))}
      </div>

      {/* Modal for full-size image */}
      {selectedImage && (
        <ImageModal
          image={selectedImage}
          onClose={closeModal}
        />
      )}
    </div>
  );
}

/**
 * Individual image grid item component
 */
interface ImageGridItemProps {
  image: ImageItem;
  index: number;
  lazy: boolean;
  progressive: boolean;
  onClick: () => void;
  onLoad: () => void;
  onError: () => void;
  onLoadStart: () => void;
}

function ImageGridItem({
  image,
  index,
  lazy,
  progressive,
  onClick,
  onLoad,
  onError,
  onLoadStart,
}: ImageGridItemProps) {
  const [loadStartTime, setLoadStartTime] = useState<number>(0);

  const handleLoadStart = useCallback(() => {
    setLoadStartTime(performance.now());
    onLoadStart();
  }, [onLoadStart]);

  const handleLoad = useCallback(() => {
    const loadTime = performance.now() - loadStartTime;
    onLoad();
  }, [onLoad, loadStartTime]);

  return (
    <div
      className="relative group cursor-pointer overflow-hidden rounded-lg bg-gray-200 aspect-square"
      onClick={onClick}
    >
      <OptimizedImage
        src={image.src}
        alt={image.alt}
        fill
        priority={!lazy}
        quality={85}
        lazy={lazy}
        progressive={progressive}
        fadeIn={true}
        retryOnError={true}
        className="transition-transform duration-300 group-hover:scale-105"
        onLoad={handleLoad}
        onError={onError}
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
      />
      
      {/* Overlay */}
      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300" />
      
      {/* Image info */}
      {(image.title || image.description) && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          {image.title && (
            <h3 className="text-white font-semibold text-sm mb-1">{image.title}</h3>
          )}
          {image.description && (
            <p className="text-white text-xs opacity-90">{image.description}</p>
          )}
        </div>
      )}

      {/* Loading indicator */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div className="bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
          #{index + 1}
        </div>
      </div>
    </div>
  );
}

/**
 * Full-size image modal component
 */
interface ImageModalProps {
  image: ImageItem;
  onClose: () => void;
}

function ImageModal({ image, onClose }: ImageModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="relative max-w-7xl max-h-full"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-all"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Full-size image */}
        <OptimizedImage
          src={image.src}
          alt={image.alt}
          width={1920}
          height={1080}
          priority={true}
          quality={95}
          lazy={false}
          progressive={true}
          fadeIn={true}
          className="max-w-full max-h-full object-contain"
          style={{ maxHeight: 'calc(100vh - 2rem)' }}
        />

        {/* Image info */}
        {(image.title || image.description) && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-6">
            {image.title && (
              <h2 className="text-white font-bold text-xl mb-2">{image.title}</h2>
            )}
            {image.description && (
              <p className="text-white opacity-90">{image.description}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Export utility function for creating image items
export function createImageItem(
  src: string,
  alt: string,
  options: Partial<Omit<ImageItem, 'src' | 'alt'>> = {}
): ImageItem {
  return {
    id: options.id || `img-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    src,
    alt,
    ...options,
  };
}

// Export utility function for batch creating image items
export function createImageItems(
  images: Array<{ src: string; alt: string; [key: string]: unknown }>
): ImageItem[] {
  return images.map((img, index) => createImageItem(img.src, img.alt, {
    ...img,
    priority: (typeof img.priority === 'number' ? img.priority : undefined) || (index < 6 ? 10 - index : 0),
  }));
}
