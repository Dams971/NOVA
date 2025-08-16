# NOVA Medical Performance Strategy

## Overview

This document outlines the comprehensive performance optimization strategy for the NOVA medical platform, focusing on Core Web Vitals, medical workflow efficiency, and user experience optimization for healthcare environments.

## Performance Goals

### Core Web Vitals Targets

#### Medical-Grade Performance Metrics
```typescript
const performanceTargets = {
  // Core Web Vitals - 75th percentile
  largestContentfulPaint: {
    good: 2.5, // seconds
    target: 2.0, // Medical applications should be faster
    critical: 1.5, // Emergency interfaces
  },
  
  firstInputDelay: {
    good: 100, // milliseconds
    target: 50, // Medical responsiveness
    critical: 25, // Emergency actions
  },
  
  cumulativeLayoutShift: {
    good: 0.1,
    target: 0.05, // Medical precision
    critical: 0.01, // Critical medical interfaces
  },
  
  interactionToNextPaint: {
    good: 200, // milliseconds
    target: 100, // Medical workflow efficiency
    critical: 50, // Emergency responsiveness
  },
  
  // Medical-specific metrics
  timeToInteractive: {
    target: 3.0, // seconds
    critical: 2.0, // Emergency interfaces
  },
  
  timeToFirstByte: {
    target: 600, // milliseconds
    critical: 400, // Medical API responses
  },
};
```

### Medical Context Performance Requirements

#### Patient Workflow Performance
- **Appointment Booking**: < 3 seconds total flow
- **Patient Form Submission**: < 2 seconds response
- **Medical Record Access**: < 1 second retrieval
- **Emergency Actions**: < 500ms response time
- **Search Results**: < 1 second display

#### Clinical Workflow Performance
- **Patient Dashboard Load**: < 2 seconds
- **Medical History Retrieval**: < 1.5 seconds
- **Prescription Entry**: < 100ms per character
- **Lab Result Display**: < 1 second
- **Imaging Loading**: Progressive enhancement

## Performance Architecture

### Next.js 15 Optimization Strategy

#### App Router Performance Optimizations
```typescript
// src/app/layout.tsx - Root layout optimization
import { Inter, Montserrat } from 'next/font/google';
import { Metadata } from 'next';

// Optimized font loading with variable fonts
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
  preload: true,
});

const montserrat = Montserrat({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-montserrat',
  preload: true,
});

// Critical CSS inlining for medical interfaces
const criticalCSS = `
  .emergency-button { background: #dc2626; color: white; }
  .medical-form { padding: 1rem; }
  .touch-target { min-height: 44px; min-width: 44px; }
`;

export const metadata: Metadata = {
  title: 'NOVA - Rendez-vous Médicaux',
  description: 'Plateforme de prise de rendez-vous médicaux accessible et performante',
  // Performance optimizations
  other: {
    'preload-fonts': 'true',
    'critical-css': 'inline',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className={`${inter.variable} ${montserrat.variable}`}>
      <head>
        {/* Critical resource preloads */}
        <link rel="preload" href="/api/health" as="fetch" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="dns-prefetch" href="//api.nova-rdv.dz" />
        
        {/* Critical CSS inline */}
        <style dangerouslySetInnerHTML={{ __html: criticalCSS }} />
      </head>
      <body className="font-inter antialiased">
        {children}
      </body>
    </html>
  );
}
```

#### Streaming and Suspense Strategy
```typescript
// src/app/dashboard/page.tsx - Medical dashboard with streaming
import { Suspense } from 'react';
import { PatientDashboardSkeleton } from '@/components/ui/skeletons';

export default function DashboardPage() {
  return (
    <div className="medical-dashboard">
      {/* Critical above-the-fold content loads first */}
      <header className="dashboard-header">
        <h1>Tableau de bord médical</h1>
        <EmergencyActions /> {/* Always loads immediately */}
      </header>
      
      {/* Non-critical content streams in */}
      <main className="dashboard-content">
        <Suspense fallback={<PatientDashboardSkeleton />}>
          <PatientDataAsync />
        </Suspense>
        
        <Suspense fallback={<AppointmentsSkeleton />}>
          <AppointmentsAsync />
        </Suspense>
        
        <Suspense fallback={<MedicalHistorySkeleton />}>
          <MedicalHistoryAsync />
        </Suspense>
      </main>
    </div>
  );
}

// Async components with error boundaries
async function PatientDataAsync() {
  try {
    const patientData = await fetchPatientData();
    return <PatientOverview data={patientData} />;
  } catch (error) {
    return <PatientDataError />;
  }
}
```

### Image Optimization Strategy

#### Medical Image Optimization
```typescript
// src/components/medical/MedicalImage.tsx
import Image from 'next/image';
import { useState } from 'react';

interface MedicalImageProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  priority?: boolean;
  medical?: boolean;
  sensitive?: boolean;
}

export const MedicalImage = ({
  src,
  alt,
  width,
  height,
  priority = false,
  medical = false,
  sensitive = false,
}: MedicalImageProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="relative">
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        priority={priority}
        quality={medical ? 90 : 75} // Higher quality for medical images
        placeholder="blur"
        blurDataURL="data:image/svg+xml;base64,..." // Custom medical placeholder
        sizes={
          medical 
            ? "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            : "(max-width: 768px) 100vw, 50vw"
        }
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false);
          setError('Erreur de chargement de l\'image médicale');
        }}
        className={cn(
          'transition-opacity duration-300',
          isLoading && 'opacity-0',
          sensitive && 'blur-sm hover:blur-none transition-all duration-300'
        )}
        // Medical-specific optimizations
        {...(medical && {
          unoptimized: false, // Ensure optimization for medical images
          loader: ({ src, width, quality }) => {
            // Custom loader for medical images with additional security
            return `${src}?w=${width}&q=${quality || 75}&medical=true`;
          },
        })}
      />
      
      {isLoading && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse rounded" />
      )}
      
      {error && (
        <div className="absolute inset-0 bg-red-50 border-2 border-red-200 rounded flex items-center justify-center">
          <span className="text-red-600 text-sm">{error}</span>
        </div>
      )}
      
      {sensitive && (
        <div className="absolute top-2 right-2 bg-blue-500 text-white px-2 py-1 rounded text-xs">
          🔒 Sensible
        </div>
      )}
    </div>
  );
};
```

#### Image Preloading Strategy
```typescript
// src/lib/performance/image-preloader.ts
export class MedicalImagePreloader {
  private preloadQueue: Set<string> = new Set();
  private loadedImages: Set<string> = new Set();

  public preloadCriticalImages(imagePaths: string[]): void {
    const criticalImages = imagePaths.filter(path => 
      path.includes('emergency') || 
      path.includes('hero') || 
      path.includes('logo')
    );

    criticalImages.forEach(path => this.preloadImage(path));
  }

  public preloadMedicalImages(imagePaths: string[]): void {
    // Preload medical images with lower priority
    imagePaths.forEach(path => {
      if (!this.loadedImages.has(path)) {
        this.schedulePreload(path, 1000); // Delay for non-critical images
      }
    });
  }

  private preloadImage(src: string): Promise<void> {
    if (this.preloadQueue.has(src) || this.loadedImages.has(src)) {
      return Promise.resolve();
    }

    this.preloadQueue.add(src);

    return new Promise((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => {
        this.loadedImages.add(src);
        this.preloadQueue.delete(src);
        resolve();
      };
      
      img.onerror = () => {
        this.preloadQueue.delete(src);
        reject(new Error(`Failed to preload image: ${src}`));
      };
      
      img.src = src;
    });
  }

  private schedulePreload(src: string, delay: number): void {
    setTimeout(() => {
      this.preloadImage(src).catch(console.warn);
    }, delay);
  }
}

// Usage in medical pages
export const useMedicalImagePreloader = (imagePaths: string[]) => {
  useEffect(() => {
    const preloader = new MedicalImagePreloader();
    preloader.preloadCriticalImages(imagePaths);
    
    // Preload medical images after initial load
    const timer = setTimeout(() => {
      preloader.preloadMedicalImages(imagePaths);
    }, 2000);

    return () => clearTimeout(timer);
  }, [imagePaths]);
};
```

### Code Splitting and Lazy Loading

#### Medical Component Lazy Loading
```typescript
// src/lib/performance/medical-lazy-loading.ts
import { lazy, ComponentType } from 'react';

// Critical medical components - never lazy load
export const EmergencyButton = lazy(() => import('@/components/medical/EmergencyButton'));
export const PatientForm = lazy(() => import('@/components/medical/PatientForm'));

// Non-critical components - lazy load with medical priorities
export const MedicalChart = lazy(() => 
  import('@/components/medical/MedicalChart').then(module => ({
    default: module.MedicalChart
  }))
);

export const PatientHistory = lazy(() => 
  import('@/components/medical/PatientHistory').then(module => ({
    default: module.PatientHistory
  }))
);

export const MedicalReports = lazy(() => 
  import('@/components/medical/MedicalReports').then(module => ({
    default: module.MedicalReports
  }))
);

// Administrative components - lowest priority
export const AdminAnalytics = lazy(() => 
  import('@/components/admin/AdminAnalytics')
);

// Smart loading based on user type
export const loadComponentsByUserType = (userType: 'patient' | 'practitioner' | 'admin') => {
  const componentMap = {
    patient: [
      () => import('@/components/patient/AppointmentBooking'),
      () => import('@/components/patient/MedicalHistory'),
    ],
    practitioner: [
      () => import('@/components/practitioner/PatientManagement'),
      () => import('@/components/practitioner/ScheduleManagement'),
    ],
    admin: [
      () => import('@/components/admin/SystemAnalytics'),
      () => import('@/components/admin/UserManagement'),
    ],
  };

  return componentMap[userType] || [];
};

// Medical-specific lazy loading hook
export const useMedicalLazyLoading = (userType: string, priority: 'high' | 'medium' | 'low') => {
  useEffect(() => {
    const loadComponents = async () => {
      const components = loadComponentsByUserType(userType as any);
      
      if (priority === 'high') {
        // Load immediately
        await Promise.all(components.map(loader => loader()));
      } else if (priority === 'medium') {
        // Load after 1 second
        setTimeout(async () => {
          await Promise.all(components.map(loader => loader()));
        }, 1000);
      } else {
        // Load when idle
        if ('requestIdleCallback' in window) {
          requestIdleCallback(async () => {
            await Promise.all(components.map(loader => loader()));
          });
        }
      }
    };

    loadComponents();
  }, [userType, priority]);
};
```

#### Route-Based Code Splitting
```typescript
// src/app/routes.ts - Medical route optimization
export const medicalRoutes = {
  // Critical routes - preloaded
  critical: [
    '/emergency',
    '/rdv',
    '/auth/login',
  ],
  
  // High priority - loaded on demand
  highPriority: [
    '/dashboard',
    '/appointments',
    '/patient-portal',
  ],
  
  // Medium priority - background loading
  mediumPriority: [
    '/medical-history',
    '/prescriptions',
    '/lab-results',
  ],
  
  // Low priority - lazy loaded
  lowPriority: [
    '/admin',
    '/analytics',
    '/settings',
  ],
};

// Route preloading strategy
export const preloadMedicalRoutes = () => {
  // Preload critical routes immediately
  medicalRoutes.critical.forEach(route => {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = route;
    document.head.appendChild(link);
  });

  // Preload high priority routes after initial load
  setTimeout(() => {
    medicalRoutes.highPriority.forEach(route => {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = route;
      document.head.appendChild(link);
    });
  }, 2000);
};
```

### Medical Data Caching Strategy

#### Medical-Safe Caching
```typescript
// src/lib/performance/medical-cache.ts
interface MedicalCacheOptions {
  ttl: number; // Time to live in milliseconds
  maxSize: number; // Maximum cache size
  sensitive: boolean; // Is this sensitive medical data?
  encryption?: boolean; // Should data be encrypted in cache?
}

export class MedicalCache {
  private cache = new Map<string, CacheEntry>();
  private sensitiveCache = new Map<string, EncryptedCacheEntry>();

  public set(
    key: string, 
    value: any, 
    options: MedicalCacheOptions
  ): void {
    if (options.sensitive) {
      this.setSensitive(key, value, options);
    } else {
      this.setRegular(key, value, options);
    }
  }

  public get(key: string, sensitive: boolean = false): any | null {
    if (sensitive) {
      return this.getSensitive(key);
    } else {
      return this.getRegular(key);
    }
  }

  private setRegular(key: string, value: any, options: MedicalCacheOptions): void {
    const entry: CacheEntry = {
      value,
      timestamp: Date.now(),
      ttl: options.ttl,
      accessCount: 0,
    };

    this.cache.set(key, entry);
    this.enforceMaxSize(options.maxSize);
  }

  private setSensitive(key: string, value: any, options: MedicalCacheOptions): void {
    // Encrypt sensitive medical data
    const encrypted = this.encryptData(value);
    
    const entry: EncryptedCacheEntry = {
      encryptedValue: encrypted,
      timestamp: Date.now(),
      ttl: Math.min(options.ttl, 300000), // Max 5 minutes for sensitive data
      accessCount: 0,
    };

    this.sensitiveCache.set(key, entry);
    
    // Clear sensitive data automatically
    setTimeout(() => {
      this.sensitiveCache.delete(key);
    }, entry.ttl);
  }

  private getRegular(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    entry.accessCount++;
    return entry.value;
  }

  private getSensitive(key: string): any | null {
    const entry = this.sensitiveCache.get(key);
    if (!entry) return null;

    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.sensitiveCache.delete(key);
      return null;
    }

    entry.accessCount++;
    return this.decryptData(entry.encryptedValue);
  }

  private encryptData(data: any): string {
    // Simple encryption for demo - use proper encryption in production
    return btoa(JSON.stringify(data));
  }

  private decryptData(encrypted: string): any {
    try {
      return JSON.parse(atob(encrypted));
    } catch {
      return null;
    }
  }

  private enforceMaxSize(maxSize: number): void {
    if (this.cache.size > maxSize) {
      // Remove least recently used items
      const entries = Array.from(this.cache.entries())
        .sort((a, b) => a[1].accessCount - b[1].accessCount);
      
      const toRemove = entries.slice(0, this.cache.size - maxSize);
      toRemove.forEach(([key]) => this.cache.delete(key));
    }
  }
}

interface CacheEntry {
  value: any;
  timestamp: number;
  ttl: number;
  accessCount: number;
}

interface EncryptedCacheEntry {
  encryptedValue: string;
  timestamp: number;
  ttl: number;
  accessCount: number;
}

// Cache configuration for different data types
export const medicalCacheConfig = {
  // Public data - can be cached longer
  publicData: {
    ttl: 3600000, // 1 hour
    maxSize: 1000,
    sensitive: false,
  },
  
  // User preferences - medium term
  userPreferences: {
    ttl: 1800000, // 30 minutes
    maxSize: 100,
    sensitive: false,
  },
  
  // Patient data - short term, sensitive
  patientData: {
    ttl: 300000, // 5 minutes
    maxSize: 50,
    sensitive: true,
    encryption: true,
  },
  
  // Medical records - very short term, highly sensitive
  medicalRecords: {
    ttl: 60000, // 1 minute
    maxSize: 10,
    sensitive: true,
    encryption: true,
  },
};
```

#### API Response Caching
```typescript
// src/lib/performance/api-cache.ts
export class MedicalAPICache {
  private cache: MedicalCache;

  constructor() {
    this.cache = new MedicalCache();
  }

  public async fetchWithCache<T>(
    url: string,
    options: RequestInit & { cacheConfig: MedicalCacheOptions }
  ): Promise<T> {
    const cacheKey = this.generateCacheKey(url, options);
    
    // Check cache first
    const cached = this.cache.get(cacheKey, options.cacheConfig.sensitive);
    if (cached) {
      return cached;
    }

    // Fetch from API
    try {
      const response = await fetch(url, options);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Cache the response
      this.cache.set(cacheKey, data, options.cacheConfig);
      
      return data;
    } catch (error) {
      console.error('API fetch error:', error);
      throw error;
    }
  }

  private generateCacheKey(url: string, options: RequestInit): string {
    const method = options.method || 'GET';
    const body = options.body ? JSON.stringify(options.body) : '';
    return `${method}:${url}:${body}`;
  }
}

// React hook for cached API calls
export const useMedicalAPI = <T>(
  url: string,
  options: RequestInit & { cacheConfig: MedicalCacheOptions }
) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const apiCache = useRef(new MedicalAPICache());

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const result = await apiCache.current.fetchWithCache<T>(url, options);
        setData(result);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [url]);

  return { data, loading, error };
};
```

### Performance Monitoring

#### Medical Performance Monitoring
```typescript
// src/lib/performance/monitoring.ts
interface MedicalPerformanceMetrics {
  // Standard Web Vitals
  lcp: number;
  fid: number;
  cls: number;
  inp: number;
  ttfb: number;
  
  // Medical-specific metrics
  emergencyResponseTime: number;
  formSubmissionTime: number;
  medicalDataLoadTime: number;
  patientSearchTime: number;
  appointmentBookingTime: number;
}

export class MedicalPerformanceMonitor {
  private metrics: Partial<MedicalPerformanceMetrics> = {};
  private observer: PerformanceObserver | null = null;

  constructor() {
    this.initializeObservers();
  }

  private initializeObservers(): void {
    // Core Web Vitals observer
    if ('PerformanceObserver' in window) {
      this.observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.processPerformanceEntry(entry);
        }
      });

      this.observer.observe({ 
        entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift'] 
      });
    }

    // Custom medical metrics
    this.initializeCustomMetrics();
  }

  private processPerformanceEntry(entry: PerformanceEntry): void {
    switch (entry.entryType) {
      case 'largest-contentful-paint':
        this.metrics.lcp = entry.startTime;
        break;
      case 'first-input':
        this.metrics.fid = (entry as PerformanceEventTiming).processingStart - entry.startTime;
        break;
      case 'layout-shift':
        if (!(entry as any).hadRecentInput) {
          this.metrics.cls = (this.metrics.cls || 0) + (entry as any).value;
        }
        break;
    }
  }

  private initializeCustomMetrics(): void {
    // Monitor emergency button clicks
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      if (target.dataset.emergency) {
        const startTime = performance.now();
        
        // Measure response time to emergency action
        setTimeout(() => {
          this.metrics.emergencyResponseTime = performance.now() - startTime;
          this.reportMedicalMetric('emergency_response', this.metrics.emergencyResponseTime);
        }, 0);
      }
    });

    // Monitor form submissions
    document.addEventListener('submit', (event) => {
      const form = event.target as HTMLFormElement;
      if (form.dataset.medical) {
        const startTime = performance.now();
        
        form.addEventListener('submit', () => {
          this.metrics.formSubmissionTime = performance.now() - startTime;
          this.reportMedicalMetric('form_submission', this.metrics.formSubmissionTime);
        }, { once: true });
      }
    });
  }

  public measureMedicalAction(action: string, startTime: number): void {
    const duration = performance.now() - startTime;
    
    switch (action) {
      case 'patient_search':
        this.metrics.patientSearchTime = duration;
        break;
      case 'medical_data_load':
        this.metrics.medicalDataLoadTime = duration;
        break;
      case 'appointment_booking':
        this.metrics.appointmentBookingTime = duration;
        break;
    }

    this.reportMedicalMetric(action, duration);
  }

  private reportMedicalMetric(metric: string, value: number): void {
    // Report to analytics service
    if (process.env.NODE_ENV === 'production') {
      this.sendToAnalytics(metric, value);
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`Medical Performance Metric - ${metric}: ${value.toFixed(2)}ms`);
    }

    // Check thresholds and alert if necessary
    this.checkPerformanceThresholds(metric, value);
  }

  private checkPerformanceThresholds(metric: string, value: number): void {
    const thresholds = {
      emergency_response: 500, // 500ms max for emergency actions
      form_submission: 2000, // 2s max for form submissions
      patient_search: 1000, // 1s max for patient search
      medical_data_load: 1500, // 1.5s max for medical data
      appointment_booking: 3000, // 3s max for appointment booking
    };

    const threshold = thresholds[metric as keyof typeof thresholds];
    if (threshold && value > threshold) {
      console.warn(`Performance threshold exceeded for ${metric}: ${value}ms > ${threshold}ms`);
      
      // Could trigger alerts or automatic optimization
      this.triggerPerformanceAlert(metric, value, threshold);
    }
  }

  private triggerPerformanceAlert(metric: string, value: number, threshold: number): void {
    // In a real application, this would trigger monitoring alerts
    const alertData = {
      metric,
      value,
      threshold,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    // Send alert to monitoring service
    console.error('Performance Alert:', alertData);
  }

  private sendToAnalytics(metric: string, value: number): void {
    // Integration with analytics service
    if (typeof window !== 'undefined' && 'gtag' in window) {
      (window as any).gtag('event', 'medical_performance', {
        event_category: 'performance',
        event_label: metric,
        value: Math.round(value),
        custom_map: {
          metric_type: 'medical_workflow',
        },
      });
    }
  }

  public getPerformanceReport(): MedicalPerformanceMetrics {
    return this.metrics as MedicalPerformanceMetrics;
  }

  public disconnect(): void {
    if (this.observer) {
      this.observer.disconnect();
    }
  }
}

// React hook for performance monitoring
export const useMedicalPerformanceMonitoring = () => {
  const monitorRef = useRef<MedicalPerformanceMonitor>();

  useEffect(() => {
    monitorRef.current = new MedicalPerformanceMonitor();
    
    return () => {
      monitorRef.current?.disconnect();
    };
  }, []);

  const measureAction = useCallback((action: string) => {
    const startTime = performance.now();
    
    return () => {
      monitorRef.current?.measureMedicalAction(action, startTime);
    };
  }, []);

  return { measureAction };
};
```

### Bundle Size Optimization

#### Medical Bundle Analysis
```typescript
// src/lib/performance/bundle-analyzer.ts
export const analyzeMedicalBundles = () => {
  const bundleTargets = {
    // Critical medical bundles
    emergency: {
      maxSize: 50, // KB
      components: ['EmergencyButton', 'EmergencyModal', 'AlertSystem'],
    },
    
    // Core medical functionality
    patientForms: {
      maxSize: 150, // KB
      components: ['PatientForm', 'MedicalHistory', 'ConsentForm'],
    },
    
    // Secondary medical features
    analytics: {
      maxSize: 200, // KB
      components: ['Charts', 'Reports', 'Analytics'],
    },
    
    // Administrative features
    admin: {
      maxSize: 300, // KB
      components: ['AdminDashboard', 'UserManagement', 'SystemConfig'],
    },
  };

  // Webpack bundle analyzer configuration
  const webpackConfig = {
    optimization: {
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          // Critical medical code
          medical: {
            test: /[\\/]src[\\/]components[\\/]medical[\\/]/,
            name: 'medical',
            priority: 30,
            enforce: true,
          },
          
          // Emergency components (highest priority)
          emergency: {
            test: /[\\/]src[\\/]components[\\/]emergency[\\/]/,
            name: 'emergency',
            priority: 40,
            enforce: true,
          },
          
          // UI components
          ui: {
            test: /[\\/]src[\\/]components[\\/]ui[\\/]/,
            name: 'ui',
            priority: 20,
          },
          
          // Vendor libraries
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            priority: 10,
          },
        },
      },
    },
  };

  return { bundleTargets, webpackConfig };
};
```

#### Tree Shaking for Medical Components
```typescript
// src/lib/performance/tree-shaking.ts

// Proper tree-shakeable exports
export { Button } from './Button';
export { Input } from './Input';
export { MedicalForm } from './MedicalForm';
export { EmergencyButton } from './EmergencyButton';

// Instead of default exports, use named exports for better tree shaking
export const MedicalComponents = {
  // Only export what's actually used
  Button,
  Input,
  MedicalForm,
  EmergencyButton,
} as const;

// Medical utilities with tree shaking
export const medicalUtils = {
  formatPhoneNumber: (phone: string) => phone.replace(/\D/g, ''),
  validateMedicalId: (id: string) => /^PAT-\d{8}$/.test(id),
  calculateAge: (birthDate: string) => {
    const today = new Date();
    const birth = new Date(birthDate);
    return today.getFullYear() - birth.getFullYear();
  },
} as const;

// Dynamic imports for non-critical features
export const loadMedicalFeature = async (feature: string) => {
  switch (feature) {
    case 'analytics':
      return import('./features/analytics');
    case 'reports':
      return import('./features/reports');
    case 'advanced-charts':
      return import('./features/charts');
    default:
      throw new Error(`Unknown medical feature: ${feature}`);
  }
};
```

### Medical Workflow Performance Optimization

#### Appointment Booking Optimization
```typescript
// src/lib/performance/appointment-optimization.ts
export class AppointmentBookingOptimizer {
  private cache = new Map<string, any>();
  private prefetchController = new AbortController();

  public async optimizeBookingFlow(userId: string): Promise<void> {
    // Prefetch user data
    this.prefetchUserData(userId);
    
    // Preload available time slots
    this.prefetchTimeSlots();
    
    // Warm up form validation
    this.warmupValidation();
  }

  private async prefetchUserData(userId: string): Promise<void> {
    try {
      const userData = await fetch(`/api/users/${userId}`, {
        signal: this.prefetchController.signal,
      }).then(res => res.json());
      
      this.cache.set(`user-${userId}`, userData);
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.warn('Failed to prefetch user data:', error);
      }
    }
  }

  private async prefetchTimeSlots(): Promise<void> {
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    try {
      const slots = await fetch(`/api/appointments/slots?from=${today.toISOString()}&to=${nextWeek.toISOString()}`, {
        signal: this.prefetchController.signal,
      }).then(res => res.json());
      
      this.cache.set('time-slots', slots);
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.warn('Failed to prefetch time slots:', error);
      }
    }
  }

  private warmupValidation(): void {
    // Pre-compile validation functions
    const phoneRegex = /^\+213[567]\d{8}$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const nameRegex = /^[a-zA-ZÀ-ÿ\s-']{2,50}$/;
    
    // Test validation functions to warm up V8
    phoneRegex.test('+213555123456');
    emailRegex.test('test@example.com');
    nameRegex.test('Jean Dupont');
  }

  public getCachedData(key: string): any {
    return this.cache.get(key);
  }

  public cleanup(): void {
    this.prefetchController.abort();
    this.cache.clear();
  }
}

// React hook for appointment booking optimization
export const useAppointmentBookingOptimization = (userId: string) => {
  const optimizerRef = useRef<AppointmentBookingOptimizer>();

  useEffect(() => {
    optimizerRef.current = new AppointmentBookingOptimizer();
    optimizerRef.current.optimizeBookingFlow(userId);
    
    return () => {
      optimizerRef.current?.cleanup();
    };
  }, [userId]);

  const getCachedData = useCallback((key: string) => {
    return optimizerRef.current?.getCachedData(key);
  }, []);

  return { getCachedData };
};
```

#### Medical Search Optimization
```typescript
// src/lib/performance/medical-search.ts
export class MedicalSearchOptimizer {
  private searchCache = new Map<string, any>();
  private debounceTimer: NodeJS.Timeout | null = null;
  private searchHistory: string[] = [];

  public async optimizedSearch(
    query: string,
    options: {
      debounceMs?: number;
      cacheResults?: boolean;
      predictiveSearch?: boolean;
    } = {}
  ): Promise<any> {
    const {
      debounceMs = 300,
      cacheResults = true,
      predictiveSearch = true,
    } = options;

    // Check cache first
    if (cacheResults && this.searchCache.has(query)) {
      return this.searchCache.get(query);
    }

    // Debounce search requests
    return new Promise((resolve) => {
      if (this.debounceTimer) {
        clearTimeout(this.debounceTimer);
      }

      this.debounceTimer = setTimeout(async () => {
        try {
          const results = await this.performSearch(query);
          
          if (cacheResults) {
            this.searchCache.set(query, results);
          }
          
          if (predictiveSearch) {
            this.updateSearchHistory(query);
            this.prefetchPredictiveResults(query);
          }
          
          resolve(results);
        } catch (error) {
          console.error('Search error:', error);
          resolve([]);
        }
      }, debounceMs);
    });
  }

  private async performSearch(query: string): Promise<any> {
    const searchParams = new URLSearchParams({
      q: query,
      limit: '10',
      type: 'medical',
    });

    const response = await fetch(`/api/search?${searchParams}`);
    return response.json();
  }

  private updateSearchHistory(query: string): void {
    this.searchHistory.unshift(query);
    
    // Keep only last 20 searches
    if (this.searchHistory.length > 20) {
      this.searchHistory = this.searchHistory.slice(0, 20);
    }
  }

  private async prefetchPredictiveResults(query: string): void {
    // Generate predictive queries based on common medical terms
    const medicalSuffixes = ['ologie', 'isme', 'pathie', 'thérapie'];
    const predictiveQueries = medicalSuffixes
      .map(suffix => query + suffix)
      .filter(predictive => !this.searchCache.has(predictive));

    // Prefetch predictive results in background
    predictiveQueries.forEach(async (predictiveQuery) => {
      try {
        const results = await this.performSearch(predictiveQuery);
        this.searchCache.set(predictiveQuery, results);
      } catch (error) {
        // Silently fail for predictive searches
      }
    });
  }

  public getSearchSuggestions(partial: string): string[] {
    return this.searchHistory
      .filter(query => query.toLowerCase().includes(partial.toLowerCase()))
      .slice(0, 5);
  }

  public clearCache(): void {
    this.searchCache.clear();
  }
}

// React hook for optimized medical search
export const useMedicalSearch = () => {
  const searcherRef = useRef<MedicalSearchOptimizer>();
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    searcherRef.current = new MedicalSearchOptimizer();
  }, []);

  const search = useCallback(async (query: string) => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    
    try {
      const searchResults = await searcherRef.current!.optimizedSearch(query);
      setResults(searchResults);
    } finally {
      setLoading(false);
    }
  }, []);

  const getSuggestions = useCallback((partial: string) => {
    return searcherRef.current?.getSearchSuggestions(partial) || [];
  }, []);

  return { search, results, loading, getSuggestions };
};
```

## Performance Budget

### Medical Performance Budget
```typescript
export const medicalPerformanceBudget = {
  // Bundle sizes (KB)
  bundles: {
    emergency: { max: 50, warning: 40 },
    medical: { max: 200, warning: 150 },
    ui: { max: 100, warning: 80 },
    admin: { max: 300, warning: 250 },
  },
  
  // Loading times (ms)
  loadTimes: {
    emergencyResponse: { max: 500, warning: 300 },
    patientFormLoad: { max: 2000, warning: 1500 },
    medicalDataFetch: { max: 1500, warning: 1000 },
    appointmentBooking: { max: 3000, warning: 2500 },
  },
  
  // Core Web Vitals
  webVitals: {
    lcp: { max: 2500, warning: 2000 },
    fid: { max: 100, warning: 50 },
    cls: { max: 0.1, warning: 0.05 },
    inp: { max: 200, warning: 100 },
  },
  
  // Medical-specific metrics
  medical: {
    patientSearchTime: { max: 1000, warning: 500 },
    formValidationTime: { max: 100, warning: 50 },
    medicalRecordAccess: { max: 2000, warning: 1000 },
  },
};

// Performance budget checker
export const checkPerformanceBudget = (metrics: any) => {
  const violations = [];
  const warnings = [];

  Object.entries(medicalPerformanceBudget).forEach(([category, budgets]) => {
    Object.entries(budgets).forEach(([metric, limits]: [string, any]) => {
      const value = metrics[category]?.[metric];
      
      if (value > limits.max) {
        violations.push({
          category,
          metric,
          value,
          limit: limits.max,
          severity: 'violation',
        });
      } else if (value > limits.warning) {
        warnings.push({
          category,
          metric,
          value,
          limit: limits.warning,
          severity: 'warning',
        });
      }
    });
  });

  return { violations, warnings };
};
```

## Implementation Roadmap

### Phase 1: Foundation (Week 1-2)
- [ ] Implement Core Web Vitals monitoring
- [ ] Set up medical performance metrics
- [ ] Configure Next.js optimization
- [ ] Implement basic caching strategy

### Phase 2: Medical Optimization (Week 3-4)
- [ ] Optimize medical component loading
- [ ] Implement medical data caching
- [ ] Optimize appointment booking flow
- [ ] Add medical search optimization

### Phase 3: Advanced Features (Week 5-6)
- [ ] Implement predictive loading
- [ ] Add performance budget monitoring
- [ ] Optimize emergency workflows
- [ ] Fine-tune bundle splitting

### Phase 4: Monitoring & Alerts (Week 7-8)
- [ ] Set up performance alerting
- [ ] Implement automated optimization
- [ ] Add performance dashboards
- [ ] Document optimization procedures

---

**Performance Strategy Version**: 1.0  
**Last Updated**: 2025-08-15  
**Compliance**: Core Web Vitals, Medical Workflow Standards  
**Framework**: Next.js 15, React 19, Medical Performance Standards