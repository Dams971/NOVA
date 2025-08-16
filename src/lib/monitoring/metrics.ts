import EnvironmentManager from '../config/environment';
import Logger from '../logging/logger';

export interface Metric {
  name: string;
  value: number;
  timestamp: number;
  tags?: Record<string, string>;
}

export interface HealthCheck {
  name: string;
  status: 'healthy' | 'unhealthy' | 'degraded';
  message?: string;
  timestamp: number;
  responseTime?: number;
}

class MetricsCollector {
  private static instance: MetricsCollector;
  private metrics: Map<string, Metric[]> = new Map();
  private healthChecks: Map<string, HealthCheck> = new Map();
  private logger: Logger;
  private isEnabled: boolean;

  private constructor() {
    const env = EnvironmentManager.getInstance();
    this.isEnabled = env.getConfig().monitoring.enabled;
    this.logger = Logger.getInstance();
    
    if (this.isEnabled) {
      this.startMetricsCollection();
    }
  }

  public static getInstance(): MetricsCollector {
    if (!MetricsCollector.instance) {
      MetricsCollector.instance = new MetricsCollector();
    }
    return MetricsCollector.instance;
  }

  private startMetricsCollection(): void {
    // Collect system metrics every 30 seconds
    setInterval(() => {
      this.collectSystemMetrics();
    }, 30000);

    // Clean old metrics every 5 minutes
    setInterval(() => {
      this.cleanOldMetrics();
    }, 300000);
  }

  private collectSystemMetrics(): void {
    try {
      const memUsage = process.memoryUsage();
      const cpuUsage = process.cpuUsage();

      // Memory metrics
      this.recordMetric('system.memory.used', memUsage.heapUsed);
      this.recordMetric('system.memory.total', memUsage.heapTotal);
      this.recordMetric('system.memory.external', memUsage.external);

      // CPU metrics
      this.recordMetric('system.cpu.user', cpuUsage.user);
      this.recordMetric('system.cpu.system', cpuUsage.system);

      // Process uptime
      this.recordMetric('system.uptime', process.uptime());

    } catch (_error) {
      this.logger.error('Failed to collect system metrics', error);
    }
  }

  private cleanOldMetrics(): void {
    const cutoffTime = Date.now() - (24 * 60 * 60 * 1000); // 24 hours ago

    for (const [name, metrics] of this.metrics.entries()) {
      const filteredMetrics = metrics.filter(metric => metric.timestamp > cutoffTime);
      this.metrics.set(name, filteredMetrics);
    }
  }

  public recordMetric(name: string, value: number, tags?: Record<string, string>): void {
    if (!this.isEnabled) return;

    const metric: Metric = {
      name,
      value,
      timestamp: Date.now(),
      tags
    };

    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }

    this.metrics.get(name)!.push(metric);

    // Log significant metrics
    if (this.isSignificantMetric(name, value)) {
      this.logger.info(`Metric recorded: ${name} = ${value}`, { tags });
    }
  }

  private isSignificantMetric(name: string, value: number): boolean {
    // Define which metrics should be logged
    const significantMetrics = [
      'api.request.duration',
      'database.query.duration',
      'auth.login.success',
      'auth.login.failure',
      'cabinet.deployment.success',
      'cabinet.deployment.failure'
    ];

    return significantMetrics.some(metric => name.startsWith(metric));
  }

  public getMetrics(name?: string, since?: number): Metric[] {
    if (name) {
      const metrics = this.metrics.get(name) || [];
      return since ? metrics.filter(m => m.timestamp >= since) : metrics;
    }

    // Return all metrics
    const allMetrics: Metric[] = [];
    for (const metrics of this.metrics.values()) {
      allMetrics.push(...(since ? metrics.filter(m => m.timestamp >= since) : metrics));
    }
    return allMetrics;
  }

  public recordHealthCheck(name: string, status: HealthCheck['status'], message?: string, responseTime?: number): void {
    const healthCheck: HealthCheck = {
      name,
      status,
      message,
      timestamp: Date.now(),
      responseTime
    };

    this.healthChecks.set(name, healthCheck);

    // Log health check changes
    this.logger.info(`Health check: ${name} = ${status}`, { message, responseTime });

    // Record as metric
    this.recordMetric(`health.${name}`, status === 'healthy' ? 1 : 0);
  }

  public getHealthChecks(): HealthCheck[] {
    return Array.from(this.healthChecks.values());
  }

  public getOverallHealth(): { status: string; checks: HealthCheck[] } {
    const checks = this.getHealthChecks();
    const unhealthyChecks = checks.filter(check => check.status === 'unhealthy');
    const degradedChecks = checks.filter(check => check.status === 'degraded');

    let status = 'healthy';
    if (unhealthyChecks.length > 0) {
      status = 'unhealthy';
    } else if (degradedChecks.length > 0) {
      status = 'degraded';
    }

    return { status, checks };
  }

  // Business metrics
  public recordAPIRequest(method: string, path: string, duration: number, status: number, cabinetId?: string): void {
    const tags = { method, path, status: status.toString() };
    if (cabinetId) tags.cabinetId = cabinetId;

    this.recordMetric('api.request.count', 1, tags);
    this.recordMetric('api.request.duration', duration, tags);

    if (status >= 400) {
      this.recordMetric('api.request.error', 1, tags);
    }
  }

  public recordDatabaseQuery(operation: string, table: string, duration: number, success: boolean): void {
    const tags = { operation, table, success: success.toString() };
    
    this.recordMetric('database.query.count', 1, tags);
    this.recordMetric('database.query.duration', duration, tags);

    if (!success) {
      this.recordMetric('database.query.error', 1, tags);
    }
  }

  public recordAuthEvent(event: string, success: boolean, userId?: string): void {
    const tags = { event, success: success.toString() };
    if (userId) tags.userId = userId;

    this.recordMetric(`auth.${event}.count`, 1, tags);
    
    if (success) {
      this.recordMetric(`auth.${event}.success`, 1, tags);
    } else {
      this.recordMetric(`auth.${event}.failure`, 1, tags);
    }
  }

  public recordCabinetEvent(event: string, cabinetId: string, success: boolean): void {
    const tags = { event, cabinetId, success: success.toString() };
    
    this.recordMetric(`cabinet.${event}.count`, 1, tags);
    
    if (success) {
      this.recordMetric(`cabinet.${event}.success`, 1, tags);
    } else {
      this.recordMetric(`cabinet.${event}.failure`, 1, tags);
    }
  }

  public recordAIBookingEvent(event: string, cabinetId: string, success: boolean, duration?: number): void {
    const tags = { event, cabinetId, success: success.toString() };
    
    this.recordMetric(`ai.booking.${event}.count`, 1, tags);
    
    if (duration) {
      this.recordMetric(`ai.booking.${event}.duration`, duration, tags);
    }
    
    if (success) {
      this.recordMetric(`ai.booking.${event}.success`, 1, tags);
    } else {
      this.recordMetric(`ai.booking.${event}.failure`, 1, tags);
    }
  }

  // Performance monitoring
  public startTimer(name: string): () => void {
    const startTime = Date.now();
    
    return () => {
      const duration = Date.now() - startTime;
      this.recordMetric(`timer.${name}`, duration);
      return duration;
    };
  }

  public async measureAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const timer = this.startTimer(name);
    try {
      const result = await fn();
      timer();
      return result;
    } catch (error) {
      timer();
      this.recordMetric(`timer.${name}.error`, 1);
      throw error;
    }
  }
}

export default MetricsCollector;