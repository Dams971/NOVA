# NOVA RDV - Performance Budget & Monitoring Strategy

## Vue d'Ensemble

Cette spécification définit les budgets de performance stricts et la stratégie de monitoring pour le système de design médical NOVA RDV. L'objectif est de maintenir une expérience utilisateur optimale même à 100 000+ utilisateurs simultanés.

## Performance Budget

### 1. Budget de Taille de Bundle

#### Limites Strictes par Composant

| Catégorie | Composant | Taille Max | Justification |
|-----------|-----------|------------|---------------|
| **Atoms** | Button | 2KB | Composant critique, usage fréquent |
| | Input | 3KB | Logique de validation incluse |
| | Typography | 1KB | Styles purs, pas de logique |
| | Icon | 0.5KB | SVG optimisé |
| **Molecules** | FormField | 5KB | Composition + validation |
| | SearchBox | 8KB | Recherche + autocomplétion |
| | StatusCard | 4KB | Affichage + interactions |
| | DatePicker | 12KB | Calendrier + i18n |
| **Organisms** | AppointmentForm | 20KB | Formulaire complexe + validation |
| | PatientTable | 15KB | Virtualisation + tri |
| | Calendar | 25KB | Calendrier médical complet |
| | Navigation | 8KB | Menu + routing |

#### Budget Global

```typescript
// src/design-system/config/performance-budget.ts
export const performanceBudget = {
  // Bundle sizes (en bytes)
  bundles: {
    core: 15 * 1024,        // 15KB - Tokens + utilitaires de base
    atoms: 10 * 1024,       // 10KB - Tous les composants atomiques
    molecules: 20 * 1024,   // 20KB - Composants moléculaires
    organisms: 50 * 1024,   // 50KB - Organismes (lazy loaded)
    total: 50 * 1024,       // 50KB - Bundle initial total
  },
  
  // Assets
  assets: {
    fonts: 100 * 1024,      // 100KB - Inter + JetBrains Mono
    icons: 20 * 1024,       // 20KB - Icônes SVG optimisées
    images: 200 * 1024,     // 200KB - Images optimisées
  },
  
  // Code splitting
  chunks: {
    vendor: 150 * 1024,     // 150KB - React + Next.js
    common: 30 * 1024,      // 30KB - Utilitaires partagés
    page: 100 * 1024,       // 100KB - Maximum par page
  }
} as const;

// Validation du budget
export function validateBundleSize(bundleName: keyof typeof performanceBudget.bundles, actualSize: number): void {
  const budget = performanceBudget.bundles[bundleName];
  
  if (actualSize > budget) {
    throw new Error(
      `❌ Budget dépassé pour ${bundleName}: ${actualSize} bytes > ${budget} bytes (${((actualSize - budget) / budget * 100).toFixed(1)}% de dépassement)`
    );
  }
  
  console.log(`✅ Budget respecté pour ${bundleName}: ${actualSize} bytes / ${budget} bytes`);
}
```

### 2. Budget Core Web Vitals

#### Cibles Strictes

```typescript
// src/design-system/config/vitals-budget.ts
export const coreWebVitalsBudget = {
  // Largest Contentful Paint (LCP)
  lcp: {
    excellent: 1500,    // 1.5s - Cible médicale
    good: 2500,         // 2.5s - Acceptable
    needsImprovement: 4000, // 4s - Limite
  },
  
  // First Input Delay (FID)
  fid: {
    excellent: 50,      // 50ms - Réactivité médicale
    good: 100,          // 100ms - Acceptable
    needsImprovement: 300, // 300ms - Limite
  },
  
  // Cumulative Layout Shift (CLS)
  cls: {
    excellent: 0.05,    // 0.05 - Stabilité médicale
    good: 0.1,          // 0.1 - Acceptable
    needsImprovement: 0.25, // 0.25 - Limite
  },
  
  // First Contentful Paint (FCP)
  fcp: {
    excellent: 1000,    // 1s - Perception de rapidité
    good: 1800,         // 1.8s - Acceptable
    needsImprovement: 3000, // 3s - Limite
  },
  
  // Time to Interactive (TTI)
  tti: {
    excellent: 2000,    // 2s - Interactivité médicale
    good: 3800,         // 3.8s - Acceptable
    needsImprovement: 7300, // 7.3s - Limite
  }
} as const;

// Validation des vitals
export function validateWebVital(metric: keyof typeof coreWebVitalsBudget, value: number): 'excellent' | 'good' | 'needs-improvement' | 'poor' {
  const budget = coreWebVitalsBudget[metric];
  
  if (value <= budget.excellent) return 'excellent';
  if (value <= budget.good) return 'good';
  if (value <= budget.needsImprovement) return 'needs-improvement';
  return 'poor';
}
```

### 3. Budget Médical Spécialisé

#### Métriques Spécifiques au Secteur Médical

```typescript
// src/design-system/config/medical-performance-budget.ts
export const medicalPerformanceBudget = {
  // Temps de réponse pour les actions critiques
  criticalActions: {
    emergencyButtonClick: 50,     // 50ms - Bouton d'urgence
    formSubmission: 200,          // 200ms - Soumission formulaire
    searchResults: 300,           // 300ms - Résultats de recherche
    patientDataLoad: 500,         // 500ms - Chargement données patient
    appointmentBooking: 1000,     // 1s - Confirmation RDV
  },
  
  // Temps de rendu des composants
  componentRenderTime: {
    button: 5,                    // 5ms - Bouton simple
    input: 8,                     // 8ms - Champ de saisie
    formField: 15,               // 15ms - Champ complet
    card: 12,                    // 12ms - Carte
    table: 50,                   // 50ms - Tableau (sans données)
    calendar: 100,               // 100ms - Calendrier
    form: 80,                    // 80ms - Formulaire complet
  },
  
  // Accessibilité performance
  accessibility: {
    screenReaderAnnouncement: 100,  // 100ms - Annonce lecteur d'écran
    focusTransition: 16,           // 16ms - Transition de focus (60 FPS)
    keyboardNavigation: 50,        // 50ms - Navigation clavier
    ariaUpdates: 200,             // 200ms - Mise à jour ARIA
  },
  
  // Métriques de charge
  loadCapacity: {
    maxUsers: 100000,             // 100k utilisateurs simultanés
    maxRequestsPerSecond: 10000,  // 10k requêtes/seconde
    maxDatabaseConnections: 500,  // 500 connexions DB
    averageResponseTime: 150,     // 150ms réponse moyenne
  }
} as const;
```

## Monitoring en Temps Réel

### 1. Performance Monitoring Client

```typescript
// src/design-system/monitoring/client-monitor.ts
export class ClientPerformanceMonitor {
  private observer: PerformanceObserver | null = null;
  private metrics: Map<string, number[]> = new Map();
  
  constructor() {
    this.initializeObserver();
    this.trackPageMetrics();
    this.trackComponentMetrics();
  }
  
  private initializeObserver() {
    if ('PerformanceObserver' in window) {
      this.observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.processPerformanceEntry(entry);
        }
      });
      
      // Observer tous les types d'événements performance
      this.observer.observe({ 
        entryTypes: ['navigation', 'paint', 'largest-contentful-paint', 'layout-shift'] 
      });
    }
  }
  
  private processPerformanceEntry(entry: PerformanceEntry) {
    switch (entry.entryType) {
      case 'largest-contentful-paint':
        this.trackMetric('lcp', (entry as PerformanceEntry).startTime);
        break;
        
      case 'paint':
        if (entry.name === 'first-contentful-paint') {
          this.trackMetric('fcp', entry.startTime);
        }
        break;
        
      case 'layout-shift':
        const layoutShiftEntry = entry as any;
        if (!layoutShiftEntry.hadRecentInput) {
          this.trackMetric('cls', layoutShiftEntry.value);
        }
        break;
    }
  }
  
  // Tracking des métriques de composants
  trackComponentRender(componentName: string, renderTime: number) {
    this.trackMetric(`component-${componentName}`, renderTime);
    
    // Validation du budget
    const budget = medicalPerformanceBudget.componentRenderTime[componentName as keyof typeof medicalPerformanceBudget.componentRenderTime];
    
    if (budget && renderTime > budget) {
      this.reportBudgetViolation('component-render', componentName, renderTime, budget);
    }
  }
  
  // Tracking des actions critiques
  trackCriticalAction(actionName: string, duration: number) {
    this.trackMetric(`action-${actionName}`, duration);
    
    const budget = medicalPerformanceBudget.criticalActions[actionName as keyof typeof medicalPerformanceBudget.criticalActions];
    
    if (budget && duration > budget) {
      this.reportBudgetViolation('critical-action', actionName, duration, budget);
    }
  }
  
  private trackMetric(metricName: string, value: number) {
    if (!this.metrics.has(metricName)) {
      this.metrics.set(metricName, []);
    }
    
    this.metrics.get(metricName)!.push(value);
    
    // Envoyer au service de monitoring si nécessaire
    this.sendToMonitoringService(metricName, value);
  }
  
  private reportBudgetViolation(type: string, name: string, actual: number, budget: number) {
    console.warn(`⚠️ Performance budget violation: ${type}/${name} - ${actual}ms > ${budget}ms`);
    
    // En production, envoyer à un service d'alerting
    if (process.env.NODE_ENV === 'production') {
      this.sendAlert({
        type: 'budget-violation',
        category: type,
        name,
        actual,
        budget,
        timestamp: Date.now(),
        url: window.location.href,
        userAgent: navigator.userAgent
      });
    }
  }
  
  private sendToMonitoringService(metric: string, value: number) {
    // Implémentation du service de monitoring
    if (process.env.NODE_ENV === 'production') {
      // Exemple avec un service comme DataDog, New Relic, etc.
      fetch('/api/metrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          metric,
          value,
          timestamp: Date.now(),
          tags: {
            component: 'design-system',
            environment: process.env.NODE_ENV,
            page: window.location.pathname
          }
        })
      });
    }
  }
  
  private sendAlert(alertData: any) {
    fetch('/api/alerts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(alertData)
    });
  }
  
  // Générer un rapport de performance
  generateReport(): PerformanceReport {
    const report: PerformanceReport = {
      timestamp: Date.now(),
      metrics: {},
      violations: [],
      recommendations: []
    };
    
    // Calculer les moyennes et percentiles
    for (const [metricName, values] of this.metrics.entries()) {
      report.metrics[metricName] = {
        count: values.length,
        average: values.reduce((a, b) => a + b, 0) / values.length,
        median: this.calculatePercentile(values, 50),
        p95: this.calculatePercentile(values, 95),
        p99: this.calculatePercentile(values, 99),
        min: Math.min(...values),
        max: Math.max(...values)
      };
    }
    
    return report;
  }
  
  private calculatePercentile(values: number[], percentile: number): number {
    const sorted = values.slice().sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[index];
  }
}

interface PerformanceReport {
  timestamp: number;
  metrics: Record<string, {
    count: number;
    average: number;
    median: number;
    p95: number;
    p99: number;
    min: number;
    max: number;
  }>;
  violations: any[];
  recommendations: string[];
}

// Instance globale
export const performanceMonitor = new ClientPerformanceMonitor();
```

### 2. Hook de Performance pour React

```typescript
// src/design-system/hooks/usePerformanceTracking.ts
import { useEffect, useRef } from 'react';
import { performanceMonitor } from '../monitoring/client-monitor';

export function usePerformanceTracking(componentName: string) {
  const renderStartTime = useRef<number>(performance.now());
  const mountStartTime = useRef<number>(performance.now());
  
  // Tracking du temps de mount
  useEffect(() => {
    const mountTime = performance.now() - mountStartTime.current;
    performanceMonitor.trackComponentRender(`${componentName}-mount`, mountTime);
  }, [componentName]);
  
  // Tracking du temps de render
  useEffect(() => {
    const renderTime = performance.now() - renderStartTime.current;
    performanceMonitor.trackComponentRender(`${componentName}-render`, renderTime);
    renderStartTime.current = performance.now();
  });
  
  // Hook pour tracker une action spécifique
  const trackAction = (actionName: string, actionFn: () => void | Promise<void>) => {
    return async () => {
      const startTime = performance.now();
      
      try {
        await actionFn();
      } finally {
        const duration = performance.now() - startTime;
        performanceMonitor.trackCriticalAction(actionName, duration);
      }
    };
  };
  
  return { trackAction };
}

// HOC pour le tracking automatique
export function withPerformanceTracking<T extends Record<string, any>>(
  Component: React.ComponentType<T>,
  componentName?: string
) {
  const TrackedComponent = (props: T) => {
    const name = componentName || Component.displayName || Component.name || 'Unknown';
    usePerformanceTracking(name);
    
    return <Component {...props} />;
  };
  
  TrackedComponent.displayName = `withPerformanceTracking(${Component.displayName || Component.name})`;
  
  return TrackedComponent;
}

// Exemple d'utilisation
export const TrackedMedicalButton = withPerformanceTracking(MedicalButton, 'MedicalButton');
```

### 3. Bundle Size Monitoring

```typescript
// scripts/bundle-monitor.ts
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { performanceBudget } from '../src/design-system/config/performance-budget';

interface BundleAnalysis {
  name: string;
  size: number;
  gzipSize: number;
  budget: number;
  status: 'ok' | 'warning' | 'error';
  violation?: number;
}

export class BundleMonitor {
  private buildPath: string;
  
  constructor(buildPath = 'dist') {
    this.buildPath = buildPath;
  }
  
  async analyzeBundles(): Promise<BundleAnalysis[]> {
    const results: BundleAnalysis[] = [];
    
    // Analyser les chunks principaux
    const chunkFiles = this.getChunkFiles();
    
    for (const [chunkName, filePath] of Object.entries(chunkFiles)) {
      const stats = fs.statSync(filePath);
      const gzipSize = this.getGzipSize(filePath);
      const budget = performanceBudget.bundles[chunkName as keyof typeof performanceBudget.bundles] || 0;
      
      const analysis: BundleAnalysis = {
        name: chunkName,
        size: stats.size,
        gzipSize,
        budget,
        status: this.getBundleStatus(stats.size, budget),
        violation: stats.size > budget ? stats.size - budget : undefined
      };
      
      results.push(analysis);
    }
    
    return results;
  }
  
  private getChunkFiles(): Record<string, string> {
    // Mapper les noms de chunks aux fichiers réels
    const manifestPath = path.join(this.buildPath, 'asset-manifest.json');
    
    if (!fs.existsSync(manifestPath)) {
      throw new Error('Asset manifest not found. Run build first.');
    }
    
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    
    return {
      core: manifest.files['static/js/core.js'],
      atoms: manifest.files['static/js/atoms.js'],
      molecules: manifest.files['static/js/molecules.js'],
      organisms: manifest.files['static/js/organisms.js'],
    };
  }
  
  private getGzipSize(filePath: string): number {
    try {
      const gzipOutput = execSync(`gzip -c "${filePath}" | wc -c`, { encoding: 'utf-8' });
      return parseInt(gzipOutput.trim());
    } catch {
      return 0;
    }
  }
  
  private getBundleStatus(size: number, budget: number): 'ok' | 'warning' | 'error' {
    if (size <= budget) return 'ok';
    if (size <= budget * 1.1) return 'warning'; // 10% de tolérance
    return 'error';
  }
  
  generateReport(analyses: BundleAnalysis[]): string {
    let report = '\n=== BUNDLE SIZE ANALYSIS ===\n\n';
    
    analyses.forEach(analysis => {
      const statusIcon = analysis.status === 'ok' ? '✅' : analysis.status === 'warning' ? '⚠️' : '❌';
      const sizeKB = (analysis.size / 1024).toFixed(1);
      const gzipKB = (analysis.gzipSize / 1024).toFixed(1);
      const budgetKB = (analysis.budget / 1024).toFixed(1);
      
      report += `${statusIcon} ${analysis.name}:\n`;
      report += `  Size: ${sizeKB} KB (gzip: ${gzipKB} KB)\n`;
      report += `  Budget: ${budgetKB} KB\n`;
      
      if (analysis.violation) {
        const violationKB = (analysis.violation / 1024).toFixed(1);
        const percentage = ((analysis.violation / analysis.budget) * 100).toFixed(1);
        report += `  Violation: +${violationKB} KB (+${percentage}%)\n`;
      }
      
      report += '\n';
    });
    
    const totalViolations = analyses.filter(a => a.status === 'error').length;
    const totalWarnings = analyses.filter(a => a.status === 'warning').length;
    
    report += `Summary: ${totalViolations} violations, ${totalWarnings} warnings\n`;
    
    return report;
  }
  
  async checkBudgets(): Promise<boolean> {
    const analyses = await this.analyzeBundles();
    const report = this.generateReport(analyses);
    
    console.log(report);
    
    const hasViolations = analyses.some(a => a.status === 'error');
    
    if (hasViolations) {
      console.error('❌ Bundle size budget violations detected!');
      return false;
    }
    
    console.log('✅ All bundle sizes within budget');
    return true;
  }
}

// CLI usage
if (require.main === module) {
  const monitor = new BundleMonitor();
  monitor.checkBudgets().then(success => {
    process.exit(success ? 0 : 1);
  });
}
```

### 4. Lighthouse CI Integration

```yaml
# .lighthouserc.js
module.exports = {
  ci: {
    collect: {
      url: [
        'http://localhost:3000/',
        'http://localhost:3000/rdv',
        'http://localhost:3000/manager',
        'http://localhost:3000/urgences'
      ],
      startServerCommand: 'npm run start',
      startServerReadyPattern: 'ready on',
      numberOfRuns: 3
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.95 }],
        'categories:accessibility': ['error', { minScore: 1.0 }],
        'categories:best-practices': ['error', { minScore: 0.95 }],
        'categories:seo': ['error', { minScore: 0.9 }],
        
        // Core Web Vitals
        'first-contentful-paint': ['error', { maxNumericValue: 1500 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'total-blocking-time': ['error', { maxNumericValue: 300 }],
        
        // Bundle size
        'total-byte-weight': ['error', { maxNumericValue: 512000 }], // 512KB
        'unused-javascript': ['warn', { maxNumericValue: 20000 }],   // 20KB
        
        // Accessibility specifics
        'color-contrast': 'error',
        'focusable-controls': 'error',
        'interactive-element-affordance': 'error',
        'logical-tab-order': 'error',
        'managed-focus': 'error',
        'use-landmarks': 'error'
      }
    },
    upload: {
      target: 'lhci',
      serverBaseUrl: process.env.LHCI_SERVER_URL
    }
  }
};
```

### 5. Alerting et Notifications

```typescript
// src/design-system/monitoring/alerting.ts
export interface Alert {
  level: 'info' | 'warning' | 'error' | 'critical';
  title: string;
  message: string;
  timestamp: number;
  metadata: Record<string, any>;
}

export class AlertingService {
  private alerts: Alert[] = [];
  private thresholds = {
    bundleSize: {
      warning: 0.9,  // 90% du budget
      error: 1.0,    // 100% du budget
      critical: 1.2  // 120% du budget
    },
    renderTime: {
      warning: 16,   // 16ms (60 FPS)
      error: 33,     // 33ms (30 FPS)
      critical: 100  // 100ms
    },
    webVitals: {
      lcp: { warning: 2000, error: 2500, critical: 4000 },
      fid: { warning: 80, error: 100, critical: 300 },
      cls: { warning: 0.1, error: 0.15, critical: 0.25 }
    }
  };
  
  checkBundleSize(bundleName: string, actualSize: number, budget: number): void {
    const ratio = actualSize / budget;
    
    if (ratio >= this.thresholds.bundleSize.critical) {
      this.createAlert('critical', `Bundle ${bundleName} critique`, 
        `Taille: ${(actualSize / 1024).toFixed(1)}KB / ${(budget / 1024).toFixed(1)}KB`, {
          bundleName, actualSize, budget, ratio
        });
    } else if (ratio >= this.thresholds.bundleSize.error) {
      this.createAlert('error', `Budget dépassé: ${bundleName}`, 
        `Taille: ${(actualSize / 1024).toFixed(1)}KB / ${(budget / 1024).toFixed(1)}KB`, {
          bundleName, actualSize, budget, ratio
        });
    } else if (ratio >= this.thresholds.bundleSize.warning) {
      this.createAlert('warning', `Approche limite: ${bundleName}`, 
        `Taille: ${(actualSize / 1024).toFixed(1)}KB / ${(budget / 1024).toFixed(1)}KB`, {
          bundleName, actualSize, budget, ratio
        });
    }
  }
  
  checkRenderTime(componentName: string, renderTime: number): void {
    if (renderTime >= this.thresholds.renderTime.critical) {
      this.createAlert('critical', `Rendu très lent: ${componentName}`, 
        `Temps: ${renderTime.toFixed(1)}ms`, {
          componentName, renderTime
        });
    } else if (renderTime >= this.thresholds.renderTime.error) {
      this.createAlert('error', `Rendu lent: ${componentName}`, 
        `Temps: ${renderTime.toFixed(1)}ms`, {
          componentName, renderTime
        });
    } else if (renderTime >= this.thresholds.renderTime.warning) {
      this.createAlert('warning', `Rendu sous-optimal: ${componentName}`, 
        `Temps: ${renderTime.toFixed(1)}ms`, {
          componentName, renderTime
        });
    }
  }
  
  checkWebVital(metric: 'lcp' | 'fid' | 'cls', value: number): void {
    const thresholds = this.thresholds.webVitals[metric];
    
    if (value >= thresholds.critical) {
      this.createAlert('critical', `Web Vital critique: ${metric.toUpperCase()}`, 
        `Valeur: ${value}`, { metric, value });
    } else if (value >= thresholds.error) {
      this.createAlert('error', `Web Vital dégradé: ${metric.toUpperCase()}`, 
        `Valeur: ${value}`, { metric, value });
    } else if (value >= thresholds.warning) {
      this.createAlert('warning', `Web Vital attention: ${metric.toUpperCase()}`, 
        `Valeur: ${value}`, { metric, value });
    }
  }
  
  private createAlert(level: Alert['level'], title: string, message: string, metadata: Record<string, any>): void {
    const alert: Alert = {
      level,
      title,
      message,
      timestamp: Date.now(),
      metadata
    };
    
    this.alerts.push(alert);
    
    // Envoyer immédiatement les alertes critiques
    if (level === 'critical' || level === 'error') {
      this.sendAlert(alert);
    }
    
    // Log dans la console
    const icon = level === 'critical' ? '🚨' : level === 'error' ? '❌' : level === 'warning' ? '⚠️' : 'ℹ️';
    console.log(`${icon} [${level.toUpperCase()}] ${title}: ${message}`);
  }
  
  private async sendAlert(alert: Alert): Promise<void> {
    // Intégration avec service d'alerting (Slack, email, etc.)
    if (process.env.NODE_ENV === 'production') {
      try {
        await fetch('/api/alerts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(alert)
        });
      } catch (error) {
        console.error('Failed to send alert:', error);
      }
    }
  }
  
  getRecentAlerts(hours = 24): Alert[] {
    const cutoff = Date.now() - (hours * 60 * 60 * 1000);
    return this.alerts.filter(alert => alert.timestamp >= cutoff);
  }
  
  generateAlertSummary(): string {
    const recent = this.getRecentAlerts();
    const bySeverity = {
      critical: recent.filter(a => a.level === 'critical').length,
      error: recent.filter(a => a.level === 'error').length,
      warning: recent.filter(a => a.level === 'warning').length,
      info: recent.filter(a => a.level === 'info').length
    };
    
    return `Alertes (24h): ${bySeverity.critical} critiques, ${bySeverity.error} erreurs, ${bySeverity.warning} avertissements`;
  }
}

// Instance globale
export const alertingService = new AlertingService();
```

## Configuration CI/CD

### GitHub Actions Workflow

```yaml
# .github/workflows/performance-budget.yml
name: Performance Budget Check

on:
  pull_request:
    branches: [main, develop]
  push:
    branches: [main]

jobs:
  performance-budget:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout
        uses: actions/checkout@v3
        
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Build project
        run: npm run build
        
      - name: Check bundle sizes
        run: npm run bundle-check
        
      - name: Run Lighthouse CI
        run: npm run lighthouse-ci
        
      - name: Performance tests
        run: npm run test:performance
        
      - name: Generate performance report
        run: npm run performance-report
        
      - name: Upload artifacts
        uses: actions/upload-artifact@v3
        with:
          name: performance-reports
          path: |
            performance-report.json
            lighthouse-reports/
            bundle-analysis.json
            
      - name: Comment PR with results
        if: github.event_name == 'pull_request'
        uses: actions/github-script@v6
        with:
          script: |
            const fs = require('fs');
            const report = JSON.parse(fs.readFileSync('performance-report.json'));
            
            const comment = `
            ## 📊 Performance Budget Check
            
            ### Bundle Sizes
            ${report.bundles.map(b => 
              `- **${b.name}**: ${(b.size/1024).toFixed(1)}KB / ${(b.budget/1024).toFixed(1)}KB ${b.status === 'ok' ? '✅' : b.status === 'warning' ? '⚠️' : '❌'}`
            ).join('\n')}
            
            ### Core Web Vitals
            - **LCP**: ${report.vitals.lcp}ms ${report.vitals.lcp <= 2500 ? '✅' : '❌'}
            - **FID**: ${report.vitals.fid}ms ${report.vitals.fid <= 100 ? '✅' : '❌'}
            - **CLS**: ${report.vitals.cls} ${report.vitals.cls <= 0.1 ? '✅' : '❌'}
            
            ${report.violations.length > 0 ? '### ⚠️ Budget Violations\n' + report.violations.join('\n') : '### ✅ All budgets respected'}
            `;
            
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: comment
            });
```

## Dashboard de Monitoring

### Configuration Grafana

```json
{
  "dashboard": {
    "title": "NOVA RDV - Design System Performance",
    "panels": [
      {
        "title": "Bundle Sizes",
        "type": "stat",
        "targets": [
          {
            "expr": "bundle_size_bytes{component=\"design-system\"}",
            "legendFormat": "{{bundle_name}}"
          }
        ],
        "thresholds": [
          { "color": "green", "value": 0 },
          { "color": "yellow", "value": 45000 },
          { "color": "red", "value": 50000 }
        ]
      },
      {
        "title": "Core Web Vitals",
        "type": "timeseries",
        "targets": [
          {
            "expr": "web_vitals_lcp_milliseconds",
            "legendFormat": "LCP"
          },
          {
            "expr": "web_vitals_fid_milliseconds", 
            "legendFormat": "FID"
          },
          {
            "expr": "web_vitals_cls_score * 1000",
            "legendFormat": "CLS (x1000)"
          }
        ]
      },
      {
        "title": "Component Render Times",
        "type": "heatmap",
        "targets": [
          {
            "expr": "component_render_time_milliseconds",
            "legendFormat": "{{component_name}}"
          }
        ]
      }
    ]
  }
}
```

Cette stratégie de performance complète garantit que NOVA RDV maintient une expérience utilisateur optimale tout en respectant les contraintes strictes du secteur médical.

**Prochaine étape** : Finaliser avec la stratégie d'accessibilité complète.