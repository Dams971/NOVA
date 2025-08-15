// Core Web Vitals monitoring and performance utilities

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
  }
}

interface WebVitalMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta?: number;
  id: string;
  navigationType?: string;
}

interface PerformanceConfig {
  enableLogging?: boolean;
  enableAnalytics?: boolean;
  sampleRate?: number;
}

const DEFAULT_CONFIG: PerformanceConfig = {
  enableLogging: process.env.NODE_ENV === 'development',
  enableAnalytics: process.env.NODE_ENV === 'production',
  sampleRate: 1, // Sample 100% of sessions in development, adjust for production
};

let config = DEFAULT_CONFIG;

// CLS value tracker
let clsValue = 0;
let clsEntries: PerformanceEntry[] = [];

// Performance thresholds based on Core Web Vitals
const THRESHOLDS = {
  LCP: { good: 2500, poor: 4000 },
  FID: { good: 100, poor: 300 },
  CLS: { good: 0.1, poor: 0.25 },
  INP: { good: 200, poor: 500 },
  TTFB: { good: 800, poor: 1800 },
};

function getRating(metricName: string, value: number): 'good' | 'needs-improvement' | 'poor' {
  const threshold = THRESHOLDS[metricName as keyof typeof THRESHOLDS];
  if (!threshold) return 'good';
  
  if (value <= threshold.good) return 'good';
  if (value <= threshold.poor) return 'needs-improvement';
  return 'poor';
}

function logMetric(metric: WebVitalMetric) {
  if (config.enableLogging) {
    console.log(`${metric.name}:`, {
      value: Math.round(metric.value),
      rating: metric.rating,
      id: metric.id,
    });
  }
}

function sendToAnalytics(metric: WebVitalMetric) {
  if (!config.enableAnalytics) return;
  
  // Skip if not in sample
  if (Math.random() > (config.sampleRate || 1)) return;

  // Send to Google Analytics if available
  if (window.gtag) {
    window.gtag('event', metric.name, {
      event_category: 'Web Vitals',
      event_label: metric.id,
      value: Math.round(metric.value),
      custom_map: { metric_rating: metric.rating },
    });
  }

  // Send to custom analytics endpoint
  if (typeof fetch !== 'undefined') {
    fetch('/api/analytics/web-vitals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(metric),
    }).catch(err => {
      if (config.enableLogging) {
        console.warn('Failed to send metric to analytics:', err);
      }
    });
  }
}

function handleMetric(metric: WebVitalMetric) {
  logMetric(metric);
  sendToAnalytics(metric);
}

// Largest Contentful Paint (LCP)
function observeLCP() {
  if (!('PerformanceObserver' in window)) return;

  const observer = new PerformanceObserver((list) => {
    const entries = list.getEntries();
    const lastEntry = entries[entries.length - 1] as PerformanceEntry & { 
      startTime: number; 
      element?: Element; 
    };
    
    if (lastEntry) {
      const metric: WebVitalMetric = {
        name: 'LCP',
        value: lastEntry.startTime,
        rating: getRating('LCP', lastEntry.startTime),
        id: `lcp-${Date.now()}`,
      };
      
      handleMetric(metric);
    }
  });

  try {
    observer.observe({ type: 'largest-contentful-paint', buffered: true });
  } catch (e) {
    if (config.enableLogging) {
      console.warn('LCP observer not supported:', e);
    }
  }
}

// First Input Delay (FID)
function observeFID() {
  if (!('PerformanceObserver' in window)) return;

  const observer = new PerformanceObserver((list) => {
    const entries = list.getEntries();
    
    for (const entry of entries) {
      const fidEntry = entry as PerformanceEntry & { 
        processingStart: number; 
        startTime: number; 
      };
      
      if (fidEntry.name === 'first-input') {
        const fidValue = fidEntry.processingStart - fidEntry.startTime;
        
        const metric: WebVitalMetric = {
          name: 'FID',
          value: fidValue,
          rating: getRating('FID', fidValue),
          id: `fid-${Date.now()}`,
        };
        
        handleMetric(metric);
      }
    }
  });

  try {
    observer.observe({ type: 'first-input', buffered: true });
  } catch (e) {
    if (config.enableLogging) {
      console.warn('FID observer not supported:', e);
    }
  }
}

// Cumulative Layout Shift (CLS)
function observeCLS() {
  if (!('PerformanceObserver' in window)) return;

  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      const clsEntry = entry as PerformanceEntry & { 
        value: number; 
        hadRecentInput: boolean; 
        sources?: Array<{ node?: Node }>;
      };
      
      // Only count layout shifts that don't have recent input
      if (!clsEntry.hadRecentInput) {
        clsValue += clsEntry.value;
        clsEntries.push(clsEntry);
      }
    }
  });

  try {
    observer.observe({ type: 'layout-shift', buffered: true });
  } catch (e) {
    if (config.enableLogging) {
      console.warn('CLS observer not supported:', e);
    }
  }

  // Report CLS on page unload
  const reportCLS = () => {
    const metric: WebVitalMetric = {
      name: 'CLS',
      value: clsValue,
      rating: getRating('CLS', clsValue),
      id: `cls-${Date.now()}`,
    };
    
    handleMetric(metric);
  };

  window.addEventListener('beforeunload', reportCLS);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      reportCLS();
    }
  });
}

// Interaction to Next Paint (INP)
function observeINP() {
  if (!('PerformanceObserver' in window)) return;
  if (!PerformanceObserver.supportedEntryTypes?.includes('event')) return;

  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      const eventEntry = entry as PerformanceEntry & { 
        duration: number; 
        interactionId?: number;
        target?: Element;
      };
      
      if (eventEntry.interactionId && eventEntry.duration > 0) {
        const metric: WebVitalMetric = {
          name: 'INP',
          value: eventEntry.duration,
          rating: getRating('INP', eventEntry.duration),
          id: `inp-${Date.now()}`,
        };
        
        handleMetric(metric);
        
        // Log slow interactions for debugging
        if (eventEntry.duration > 200 && config.enableLogging) {
          console.warn('Slow interaction detected:', {
            type: entry.name,
            duration: eventEntry.duration,
            target: eventEntry.target,
            interactionId: eventEntry.interactionId,
          });
        }
      }
    }
  });

  try {
    observer.observe({ 
      type: 'event', 
      buffered: true, 
      durationThreshold: 16 // Only observe events longer than 16ms
    });
  } catch (e) {
    if (config.enableLogging) {
      console.warn('INP observer not supported:', e);
    }
  }
}

// Time to First Byte (TTFB)
function observeTTFB() {
  if (!('PerformanceObserver' in window)) return;

  const observer = new PerformanceObserver((list) => {
    const entries = list.getEntries();
    
    for (const entry of entries) {
      const navEntry = entry as PerformanceEntry & { 
        responseStart: number; 
        requestStart: number; 
      };
      
      if (entry.entryType === 'navigation' && navEntry.responseStart > 0) {
        const ttfbValue = navEntry.responseStart - navEntry.requestStart;
        
        const metric: WebVitalMetric = {
          name: 'TTFB',
          value: ttfbValue,
          rating: getRating('TTFB', ttfbValue),
          id: `ttfb-${Date.now()}`,
        };
        
        handleMetric(metric);
      }
    }
  });

  try {
    observer.observe({ type: 'navigation', buffered: true });
  } catch (e) {
    if (config.enableLogging) {
      console.warn('TTFB observer not supported:', e);
    }
  }
}

// Memory usage monitoring
function observeMemory() {
  if (!('memory' in performance)) return;

  const checkMemory = () => {
    const memory = (performance as any).memory;
    
    if (memory) {
      const memoryUsage = {
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit,
        usageRatio: memory.usedJSHeapSize / memory.jsHeapSizeLimit,
      };
      
      if (config.enableLogging) {
        console.log('Memory usage:', {
          used: Math.round(memoryUsage.usedJSHeapSize / 1024 / 1024) + 'MB',
          total: Math.round(memoryUsage.totalJSHeapSize / 1024 / 1024) + 'MB',
          limit: Math.round(memoryUsage.jsHeapSizeLimit / 1024 / 1024) + 'MB',
          ratio: Math.round(memoryUsage.usageRatio * 100) + '%',
        });
      }
      
      // Warn if memory usage is high
      if (memoryUsage.usageRatio > 0.8) {
        console.warn('High memory usage detected:', memoryUsage);
      }
      
      // Send to analytics if configured
      if (config.enableAnalytics && window.gtag) {
        window.gtag('event', 'memory_usage', {
          event_category: 'Performance',
          value: Math.round(memoryUsage.usageRatio * 100),
        });
      }
    }
  };

  // Check memory usage every 30 seconds
  setInterval(checkMemory, 30000);
  
  // Initial check
  setTimeout(checkMemory, 1000);
}

// Long task monitoring
function observeLongTasks() {
  if (!('PerformanceObserver' in window)) return;
  if (!PerformanceObserver.supportedEntryTypes?.includes('longtask')) return;

  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (config.enableLogging) {
        console.warn('Long task detected:', {
          duration: Math.round(entry.duration),
          startTime: Math.round(entry.startTime),
        });
      }
      
      // Send to analytics
      if (config.enableAnalytics && window.gtag) {
        window.gtag('event', 'long_task', {
          event_category: 'Performance',
          value: Math.round(entry.duration),
        });
      }
    }
  });

  try {
    observer.observe({ type: 'longtask', buffered: true });
  } catch (e) {
    if (config.enableLogging) {
      console.warn('Long task observer not supported:', e);
    }
  }
}

// Initialize performance monitoring
export function initPerformanceMonitoring(userConfig?: PerformanceConfig) {
  if (typeof window === 'undefined') return;

  // Merge user config with defaults
  config = { ...DEFAULT_CONFIG, ...userConfig };

  if (config.enableLogging) {
    console.log('Initializing performance monitoring...');
  }

  // Start observing web vitals
  observeLCP();
  observeFID();
  observeCLS();
  observeINP();
  observeTTFB();
  
  // Additional monitoring
  observeMemory();
  observeLongTasks();
}

// Manual metric reporting
export function reportCustomMetric(name: string, value: number, rating?: 'good' | 'needs-improvement' | 'poor') {
  const metric: WebVitalMetric = {
    name,
    value,
    rating: rating || 'good',
    id: `custom-${name}-${Date.now()}`,
  };
  
  handleMetric(metric);
}

// Get current performance data
export function getPerformanceData() {
  return {
    cls: clsValue,
    clsEntries: clsEntries.length,
    memory: 'memory' in performance ? (performance as any).memory : null,
    navigation: performance.getEntriesByType('navigation')[0],
    resources: performance.getEntriesByType('resource').length,
  };
}

// Export for use in Next.js pages
export { handleMetric };

// Default export for easy import
export default initPerformanceMonitoring;