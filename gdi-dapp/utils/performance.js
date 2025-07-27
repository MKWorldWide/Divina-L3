/**
 * Performance Optimization Utilities for GameDin L3 DApp
 * 
 * This module provides performance optimization utilities including:
 * - Image optimization
 * - Lazy loading
 * - Resource preloading
 * - Performance monitoring
 * - Caching strategies
 */

import { useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import Head from 'next/head';
import { throttle, debounce } from 'lodash';

// Performance metrics tracking
const metrics = {
  navigationStart: 0,
  pageLoadStart: 0,
  domInteractive: 0,
  domComplete: 0,
  firstContentfulPaint: 0,
  largestContentfulPaint: 0,
  firstInputDelay: 0,
  cumulativeLayoutShift: 0,
  totalBlockingTime: 0,
};

/**
 * Track performance metrics
 */
export const initPerformanceTracking = () => {
  if (typeof window === 'undefined') return;

  // Navigation Timing API
  const navigationTiming = window.performance?.timing;
  if (navigationTiming) {
    metrics.navigationStart = navigationTiming.navigationStart;
    metrics.pageLoadStart = navigationTiming.domLoading - navigationTiming.navigationStart;
    metrics.domInteractive = navigationTiming.domInteractive - navigationTiming.navigationStart;
    metrics.domComplete = navigationTiming.domComplete - navigationTiming.navigationStart;
  }

  // Performance Observer for modern metrics
  if ('PerformanceObserver' in window) {
    // First Input Delay (FID) polyfill
    new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      for (const entry of entries) {
        if (entry.entryType === 'first-input') {
          metrics.firstInputDelay = entry.processingStart - entry.startTime;
        }
      }
    }).observe({ type: 'first-input', buffered: true });

    // Largest Contentful Paint (LCP)
    new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      const lastEntry = entries[entries.length - 1];
      metrics.largestContentfulPaint = lastEntry.renderTime || lastEntry.loadTime;
    }).observe({ type: 'largest-contentful-paint', buffered: true });

    // Cumulative Layout Shift (CLS)
    new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      for (const entry of entries) {
        if (!entry.hadRecentInput) {
          metrics.cumulativeLayoutShift += entry.value;
        }
      }
    }).observe({ type: 'layout-shift', buffered: true });

    // Total Blocking Time (TBT)
    new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      for (const entry of entries) {
        if (entry.duration > 50) {
          metrics.totalBlockingTime += entry.duration - 50;
        }
      }
    }).observe({ type: 'longtask', buffered: true });
  }

  // Report metrics to analytics
  const reportMetrics = throttle(() => {
    if (typeof window.gtag === 'function') {
      // Core Web Vitals
      window.gtag('event', 'web_vitals', {
        event_category: 'Web Vitals',
        event_label: 'LCP',
        value: Math.round(metrics.largestContentfulPaint),
        non_interaction: true,
      });
      
      window.gtag('event', 'web_vitals', {
        event_category: 'Web Vitals',
        event_label: 'FID',
        value: Math.round(metrics.firstInputDelay),
        non_interaction: true,
      });
      
      window.gtag('event', 'web_vitals', {
        event_category: 'Web Vitals',
        event_label: 'CLS',
        value: Math.round(metrics.cumulativeLayoutShift * 1000) / 1000,
        non_interaction: true,
      });
    }
  }, 1000);

  // Report metrics when page is hidden or after 5 seconds
  const handleVisibilityChange = () => {
    if (document.visibilityState === 'hidden') {
      reportMetrics();
    }
  };

  document.addEventListener('visibilitychange', handleVisibilityChange, false);
  setTimeout(reportMetrics, 5000);

  return () => {
    document.removeEventListener('visibilitychange', handleVisibilityChange);
  };
};

/**
 * Preload critical resources
 */
export const PreloadResources = () => {
  const router = useRouter();
  
  useEffect(() => {
    // Preload critical resources for the current route
    const preloadResources = (url) => {
      // Add preload links for critical resources
      const preloadLinks = [
        // Preload fonts
        { href: '/fonts/Inter.woff2', as: 'font', type: 'font/woff2', crossOrigin: 'anonymous' },
        // Add other critical resources here
      ];

      preloadLinks.forEach(({ href, as, type, crossOrigin }) => {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.href = href;
        if (as) link.as = as;
        if (type) link.type = type;
        if (crossOrigin) link.crossOrigin = crossOrigin;
        document.head.appendChild(link);
      });
    };

    // Preload resources for initial page load
    preloadResources(router.pathname);

    // Cleanup function
    return () => {
      // Remove any preload links we added
      document.querySelectorAll('link[rel="preload"]').forEach(link => {
        if (link.getAttribute('data-preload') === 'true') {
          document.head.removeChild(link);
        }
      });
    };
  }, [router.pathname]);

  return null;
};

/**
 * Lazy load components with loading state
 */
export const lazyLoad = (importFunc, { loading: Loading = null } = {}) => {
  return dynamic(importFunc, {
    loading: () => Loading,
    ssr: false, // Disable server-side rendering for these components
  });
};

/**
 * Optimize images with WebP fallback
 */
export const OptimizedImage = ({
  src,
  alt,
  width,
  height,
  className = '',
  priority = false,
  quality = 75,
  ...props
}) => {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const optimizedSrc = useMemo(() => {
    if (!src) return '';
    
    // If it's an external URL, return as is
    if (src.startsWith('http') || src.startsWith('//')) {
      return src;
    }
    
    // If it's an IPFS URL, use the configured gateway
    if (src.startsWith('ipfs://')) {
      const cid = src.replace('ipfs://', '');
      return `${process.env.NEXT_PUBLIC_IPFS_GATEWAY || 'https://ipfs.io/ipfs/'}${cid}`;
    }
    
    // For local images, use Next.js Image optimization
    return src;
  }, [src]);

  const handleError = useCallback(() => {
    setImageError(true);
  }, []);

  const handleLoad = useCallback(() => {
    setIsLoading(false);
  }, []);

  if (!optimizedSrc) {
    return <div className={`${className} bg-gray-100`} style={{ width, height }} {...props} />;
  }

  return (
    <div className={`relative ${className}`} style={{ width, height }}>
      {isLoading && (
        <div className="absolute inset-0 bg-gray-100 animate-pulse" />
      )}
      <img
        src={optimizedSrc}
        alt={alt || ''}
        width={width}
        height={height}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          isLoading ? 'opacity-0' : 'opacity-100'
        }`}
        onError={handleError}
        onLoad={handleLoad}
        {...props}
      />
      {imageError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 text-gray-400">
          <span>Image not available</span>
        </div>
      )}
    </div>
  );
};

/**
 * Memoize expensive calculations
 */
export const useMemoizedValue = (factory, deps) => {
  return useMemo(factory, deps);
};

/**
 * Debounce function calls
 */
export const useDebounce = (callback, delay) => {
  return useCallback(debounce(callback, delay), [delay]);
};

/**
 * Throttle function calls
 */
export const useThrottle = (callback, delay) => {
  return useCallback(throttle(callback, delay, { leading: true, trailing: true }), [delay]);
};

/**
 * Virtualized list for large datasets
 */
export const VirtualizedList = ({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  overscanCount = 5,
  ...props
}) => {
  const containerRef = useRef();
  const [scrollTop, setScrollTop] = useState(0);
  
  const handleScroll = useThrottle((e) => {
    setScrollTop(e.target.scrollTop);
  }, 16);
  
  const totalHeight = items.length * itemHeight;
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscanCount);
  const endIndex = Math.min(
    items.length - 1,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscanCount
  );
  
  const visibleItems = useMemo(() => {
    return items.slice(startIndex, endIndex + 1);
  }, [items, startIndex, endIndex]);
  
  return (
    <div
      ref={containerRef}
      style={{ height: `${containerHeight}px`, overflowY: 'auto' }}
      onScroll={handleScroll}
      {...props}
    >
      <div style={{ height: `${totalHeight}px`, position: 'relative' }}>
        <div style={{
          position: 'absolute',
          top: `${startIndex * itemHeight}px`,
          width: '100%',
        }}>
          {visibleItems.map((item, index) => (
            <div key={index} style={{ height: `${itemHeight}px` }}>
              {renderItem(item, startIndex + index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/**
 * Optimize network requests with SWR
 */
export const useOptimizedFetch = (key, fetcher, options = {}) => {
  const { data, error, isValidating, mutate } = useSWR(key, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    dedupingInterval: 10000, // 10 seconds
    focusThrottleInterval: 60000, // 1 minute
    ...options,
  });
  
  const refresh = useCallback(() => mutate(), [mutate]);
  
  return {
    data,
    error,
    isLoading: !error && !data,
    isValidating,
    refresh,
  };
};

export default {
  initPerformanceTracking,
  PreloadResources,
  lazyLoad,
  OptimizedImage,
  useMemoizedValue,
  useDebounce,
  useThrottle,
  VirtualizedList,
  useOptimizedFetch,
  metrics,
};
