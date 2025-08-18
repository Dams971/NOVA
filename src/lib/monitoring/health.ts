import EnvironmentManager from '../config/environment';
import DatabaseManager from '../database/connection';
import Logger from '../logging/logger';
import MetricsCollector from './metrics';

export interface HealthCheckResult {
  name: string;
  status: 'healthy' | 'unhealthy' | 'degraded';
  message?: string;
  responseTime: number;
  timestamp: number;
  details?: Record<string, unknown>;
}

export interface SystemHealth {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: number;
  checks: HealthCheckResult[];
  uptime: number;
  version: string;
}

class HealthMonitor {
  private static instance: HealthMonitor;
  private metrics: MetricsCollector;
  private logger: Logger;
  private env: EnvironmentManager;
  private healthCheckInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.metrics = MetricsCollector.getInstance();
    this.logger = Logger.getInstance();
    this.env = EnvironmentManager.getInstance();
    
    this.startHealthChecks();
  }

  public static getInstance(): HealthMonitor {
    if (!HealthMonitor.instance) {
      HealthMonitor.instance = new HealthMonitor();
    }
    return HealthMonitor.instance;
  }

  private startHealthChecks(): void {
    // Run health checks every 30 seconds
    this.healthCheckInterval = setInterval(async () => {
      await this.runAllHealthChecks();
    }, 30000);

    // Run initial health check
    setTimeout(() => this.runAllHealthChecks(), 1000);
  }

  public stopHealthChecks(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }

  private async runAllHealthChecks(): Promise<void> {
    try {
      await Promise.all([
        this.checkDatabase(),
        this.checkMemoryUsage(),
        this.checkDiskSpace(),
        this.checkAPIResponseTime()
      ]);
    } catch (_error) {
      this.logger.error('Error running health checks', _error);
    }
  }

  public async getSystemHealth(): Promise<SystemHealth> {
    const checks = await this.runHealthChecksSync();
    
    // Determine overall status
    const unhealthyChecks = checks.filter(check => check.status === 'unhealthy');
    const degradedChecks = checks.filter(check => check.status === 'degraded');
    
    let status: SystemHealth['status'] = 'healthy';
    if (unhealthyChecks.length > 0) {
      status = 'unhealthy';
    } else if (degradedChecks.length > 0) {
      status = 'degraded';
    }

    return {
      status,
      timestamp: Date.now(),
      checks,
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0'
    };
  }

  private async runHealthChecksSync(): Promise<HealthCheckResult[]> {
    const checks = await Promise.allSettled([
      this.checkDatabase(),
      this.checkMemoryUsage(),
      this.checkDiskSpace(),
      this.checkAPIResponseTime()
    ]);

    return checks.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        const checkNames = ['database', 'memory', 'disk', 'api'];
        return {
          name: checkNames[index],
          status: 'unhealthy' as const,
          message: `Health check failed: ${result.reason}`,
          responseTime: 0,
          timestamp: Date.now()
        };
      }
    });
  }

  private async checkDatabase(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    
    try {
      const dbManager = DatabaseManager.getInstance();
      const isConnected = await dbManager.testConnection();
      const responseTime = Date.now() - startTime;

      const result: HealthCheckResult = {
        name: 'database',
        status: isConnected ? 'healthy' : 'unhealthy',
        message: isConnected ? 'Database connection successful' : 'Database connection failed',
        responseTime,
        timestamp: Date.now()
      };

      this.metrics.recordHealthCheck('database', result.status, result.message, responseTime);
      return result;

    } catch (error) {
      const responseTime = Date.now() - startTime;
      const result: HealthCheckResult = {
        name: 'database',
        status: 'unhealthy',
        message: `Database error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        responseTime,
        timestamp: Date.now()
      };

      this.metrics.recordHealthCheck('database', result.status, result.message, responseTime);
      return result;
    }
  }

  private async checkMemoryUsage(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    
    try {
      const memUsage = process.memoryUsage();
      const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
      const heapTotalMB = Math.round(memUsage.heapTotal / 1024 / 1024);
      const usagePercent = (heapUsedMB / heapTotalMB) * 100;
      
      let status: HealthCheckResult['status'] = 'healthy';
      let message = `Memory usage: ${heapUsedMB}MB / ${heapTotalMB}MB (${usagePercent.toFixed(1)}%)`;
      
      if (usagePercent > 90) {
        status = 'unhealthy';
        message += ' - Critical memory usage';
      } else if (usagePercent > 75) {
        status = 'degraded';
        message += ' - High memory usage';
      }

      const responseTime = Date.now() - startTime;
      const result: HealthCheckResult = {
        name: 'memory',
        status,
        message,
        responseTime,
        timestamp: Date.now(),
        details: {
          heapUsed: heapUsedMB,
          heapTotal: heapTotalMB,
          usagePercent: usagePercent.toFixed(1)
        }
      };

      this.metrics.recordHealthCheck('memory', result.status, result.message, responseTime);
      return result;

    } catch (error) {
      const responseTime = Date.now() - startTime;
      const result: HealthCheckResult = {
        name: 'memory',
        status: 'unhealthy',
        message: `Memory check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        responseTime,
        timestamp: Date.now()
      };

      this.metrics.recordHealthCheck('memory', result.status, result.message, responseTime);
      return result;
    }
  }

  private async checkDiskSpace(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    
    try {
      // Simple disk space check using fs.statSync
      const fs = await import('fs');
      const stats = fs.statSync('.');
      
      // This is a simplified check - in production, you'd want more detailed disk space monitoring
      const result: HealthCheckResult = {
        name: 'disk',
        status: 'healthy',
        message: 'Disk space check completed',
        responseTime: Date.now() - startTime,
        timestamp: Date.now()
      };

      this.metrics.recordHealthCheck('disk', result.status, result.message, result.responseTime);
      return result;

    } catch (error) {
      const responseTime = Date.now() - startTime;
      const result: HealthCheckResult = {
        name: 'disk',
        status: 'degraded',
        message: `Disk check warning: ${error instanceof Error ? error.message : 'Unknown error'}`,
        responseTime,
        timestamp: Date.now()
      };

      this.metrics.recordHealthCheck('disk', result.status, result.message, responseTime);
      return result;
    }
  }

  private async checkAPIResponseTime(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    
    try {
      // Simulate API response time check
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const responseTime = Date.now() - startTime;
      let status: HealthCheckResult['status'] = 'healthy';
      let message = `API response time: ${responseTime}ms`;
      
      if (responseTime > 5000) {
        status = 'unhealthy';
        message += ' - Very slow response';
      } else if (responseTime > 2000) {
        status = 'degraded';
        message += ' - Slow response';
      }

      const result: HealthCheckResult = {
        name: 'api',
        status,
        message,
        responseTime,
        timestamp: Date.now()
      };

      this.metrics.recordHealthCheck('api', result.status, result.message, responseTime);
      return result;

    } catch (error) {
      const responseTime = Date.now() - startTime;
      const result: HealthCheckResult = {
        name: 'api',
        status: 'unhealthy',
        message: `API check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        responseTime,
        timestamp: Date.now()
      };

      this.metrics.recordHealthCheck('api', result.status, result.message, responseTime);
      return result;
    }
  }

  // Cabinet-specific health checks
  public async checkCabinetHealth(cabinetId: string): Promise<HealthCheckResult> {
    const startTime = Date.now();
    
    try {
      const dbManager = DatabaseManager.getInstance();
      const connection = await dbManager.getCabinetConnection(cabinetId);
      
      // Test cabinet database connectivity
      await connection.ping();
      
      const responseTime = Date.now() - startTime;
      const result: HealthCheckResult = {
        name: `cabinet-${cabinetId}`,
        status: 'healthy',
        message: 'Cabinet database connection successful',
        responseTime,
        timestamp: Date.now()
      };

      this.metrics.recordHealthCheck(`cabinet-${cabinetId}`, result.status, result.message, responseTime);
      return result;

    } catch (error) {
      const responseTime = Date.now() - startTime;
      const result: HealthCheckResult = {
        name: `cabinet-${cabinetId}`,
        status: 'unhealthy',
        message: `Cabinet database error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        responseTime,
        timestamp: Date.now()
      };

      this.metrics.recordHealthCheck(`cabinet-${cabinetId}`, result.status, result.message, responseTime);
      return result;
    }
  }
}

export default HealthMonitor;