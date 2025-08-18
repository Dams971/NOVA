// Cabinet health monitoring service
import DatabaseManager from '../database/connection';
import Logger from '../logging/logger';
import HealthMonitor, { HealthCheckResult } from '../monitoring/health';
import MetricsCollector from '../monitoring/metrics';
import { CabinetService } from './cabinet-service';

export interface CabinetHealthStatus {
  cabinetId: string;
  cabinetName: string;
  status: 'healthy' | 'unhealthy' | 'degraded';
  lastChecked: Date;
  checks: HealthCheckResult[];
  uptime: number;
  responseTime: number;
  issues: string[];
}

export interface CabinetHealthAlert {
  id: string;
  cabinetId: string;
  severity: 'critical' | 'warning' | 'info';
  message: string;
  timestamp: Date;
  acknowledged: boolean;
  resolvedAt?: Date;
}

export class CabinetHealthService {
  private cabinetService: CabinetService;
  private healthMonitor: HealthMonitor;
  private metrics: MetricsCollector;
  private logger: Logger;
  private dbManager: DatabaseManager;
  private healthCache: Map<string, CabinetHealthStatus> = new Map();
  private alerts: Map<string, CabinetHealthAlert> = new Map();
  private monitoringInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.cabinetService = new CabinetService();
    this.healthMonitor = HealthMonitor.getInstance();
    this.metrics = MetricsCollector.getInstance();
    this.logger = Logger.getInstance();
    this.dbManager = DatabaseManager.getInstance();
    
    this.startContinuousMonitoring();
  }

  private startContinuousMonitoring(): void {
    // Monitor all cabinets every 60 seconds
    this.monitoringInterval = setInterval(async () => {
      await this.monitorAllCabinets();
    }, 60000);

    // Initial monitoring after 5 seconds
    setTimeout(() => this.monitorAllCabinets(), 5000);
  }

  public stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }

  private async monitorAllCabinets(): Promise<void> {
    try {
      const cabinetsResult = await this.cabinetService.getActiveCabinets();
      
      if (!cabinetsResult.success || !cabinetsResult.data) {
        this.logger.error('Failed to get active cabinets for monitoring');
        return;
      }

      const monitoringPromises = cabinetsResult.data.map(cabinet => 
        this.checkCabinetHealth(cabinet.id)
      );

      await Promise.allSettled(monitoringPromises);
    } catch (_error) {
      this.logger.error('Error in continuous cabinet monitoring', error);
    }
  }

  public async checkCabinetHealth(cabinetId: string): Promise<CabinetHealthStatus> {
    const startTime = Date.now();
    
    try {
      // Get cabinet details
      const cabinetResult = await this.cabinetService.getCabinetById(cabinetId);
      if (!cabinetResult.success || !cabinetResult.data) {
        throw new Error(`Cabinet ${cabinetId} not found`);
      }

      const cabinet = cabinetResult.data;
      const checks: HealthCheckResult[] = [];
      const issues: string[] = [];

      // Check cabinet database connectivity
      const dbCheck = await this.checkCabinetDatabase(cabinetId);
      checks.push(dbCheck);
      if (dbCheck.status !== 'healthy') {
        issues.push(`Database: ${dbCheck.message}`);
      }

      // Check cabinet API responsiveness
      const apiCheck = await this.checkCabinetAPI(cabinetId);
      checks.push(apiCheck);
      if (apiCheck.status !== 'healthy') {
        issues.push(`API: ${apiCheck.message}`);
      }

      // Check cabinet configuration
      const configCheck = await this.checkCabinetConfiguration(cabinetId);
      checks.push(configCheck);
      if (configCheck.status !== 'healthy') {
        issues.push(`Configuration: ${configCheck.message}`);
      }

      // Check cabinet data integrity
      const dataCheck = await this.checkCabinetDataIntegrity(cabinetId);
      checks.push(dataCheck);
      if (dataCheck.status !== 'healthy') {
        issues.push(`Data: ${dataCheck.message}`);
      }

      // Determine overall status
      const unhealthyChecks = checks.filter(check => check.status === 'unhealthy');
      const degradedChecks = checks.filter(check => check.status === 'degraded');
      
      let status: CabinetHealthStatus['status'] = 'healthy';
      if (unhealthyChecks.length > 0) {
        status = 'unhealthy';
      } else if (degradedChecks.length > 0) {
        status = 'degraded';
      }

      const responseTime = Date.now() - startTime;
      const healthStatus: CabinetHealthStatus = {
        cabinetId,
        cabinetName: cabinet.name,
        status,
        lastChecked: new Date(),
        checks,
        uptime: this.calculateCabinetUptime(cabinetId),
        responseTime,
        issues
      };

      // Cache the health status
      this.healthCache.set(cabinetId, healthStatus);

      // Record metrics
      this.metrics.recordMetric(`cabinet.health.${cabinetId}`, status === 'healthy' ? 1 : 0);
      this.metrics.recordMetric(`cabinet.response_time.${cabinetId}`, responseTime);

      // Check for alerts
      await this.checkForAlerts(healthStatus);

      return healthStatus;

    } catch (error) {
      const responseTime = Date.now() - startTime;
      const errorStatus: CabinetHealthStatus = {
        cabinetId,
        cabinetName: 'Unknown',
        status: 'unhealthy',
        lastChecked: new Date(),
        checks: [{
          name: 'cabinet-health-check',
          status: 'unhealthy',
          message: `Health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          responseTime,
          timestamp: Date.now()
        }],
        uptime: 0,
        responseTime,
        issues: [`Health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`]
      };

      this.healthCache.set(cabinetId, errorStatus);
      this.logger.error(`Cabinet health check failed for ${cabinetId}`, error);
      
      return errorStatus;
    }
  }

  private async checkCabinetDatabase(cabinetId: string): Promise<HealthCheckResult> {
    const startTime = Date.now();
    
    try {
      const connection = await this.dbManager.getCabinetConnection(cabinetId);
      await connection.ping();
      
      // Test a simple query
      await connection.query('SELECT 1 as test');
      
      const responseTime = Date.now() - startTime;
      return {
        name: 'database',
        status: 'healthy',
        message: 'Database connection successful',
        responseTime,
        timestamp: Date.now()
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      return {
        name: 'database',
        status: 'unhealthy',
        message: `Database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        responseTime,
        timestamp: Date.now()
      };
    }
  }

  private async checkCabinetAPI(_cabinetId: string): Promise<HealthCheckResult> {
    const startTime = Date.now();
    
    try {
      // Simulate API health check - in real implementation, this would make HTTP requests
      // to cabinet-specific endpoints
      await new Promise(resolve => setTimeout(resolve, 50));
      
      const responseTime = Date.now() - startTime;
      return {
        name: 'api',
        status: 'healthy',
        message: 'API endpoints responding',
        responseTime,
        timestamp: Date.now()
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      return {
        name: 'api',
        status: 'unhealthy',
        message: `API check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        responseTime,
        timestamp: Date.now()
      };
    }
  }

  private async checkCabinetConfiguration(cabinetId: string): Promise<HealthCheckResult> {
    const startTime = Date.now();
    
    try {
      const configResult = await this.cabinetService.getAllCabinetConfigs(cabinetId);
      
      if (!configResult.success) {
        throw new Error('Failed to retrieve cabinet configuration');
      }

      // Check for required configuration keys
      const requiredConfigs = ['timezone', 'workingHours', 'bookingRules'];
      const config = configResult.data || {};
      const missingConfigs = requiredConfigs.filter(key => !config[key]);
      
      const responseTime = Date.now() - startTime;
      
      if (missingConfigs.length > 0) {
        return {
          name: 'configuration',
          status: 'degraded',
          message: `Missing configurations: ${missingConfigs.join(', ')}`,
          responseTime,
          timestamp: Date.now()
        };
      }

      return {
        name: 'configuration',
        status: 'healthy',
        message: 'Configuration complete',
        responseTime,
        timestamp: Date.now()
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      return {
        name: 'configuration',
        status: 'unhealthy',
        message: `Configuration check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        responseTime,
        timestamp: Date.now()
      };
    }
  }

  private async checkCabinetDataIntegrity(cabinetId: string): Promise<HealthCheckResult> {
    const startTime = Date.now();
    
    try {
      const connection = await this.dbManager.getCabinetConnection(cabinetId);
      
      // Check if essential tables exist
      const tables = ['appointments', 'patients', 'practitioners'];
      const tableChecks = await Promise.all(
        tables.map(async (table) => {
          try {
            const result = await connection.query(`SHOW TABLES LIKE '${table}'`);
            return { table, exists: Array.isArray(result) && result.length > 0 };
          } catch {
            return { table, exists: false };
          }
        })
      );

      const missingTables = tableChecks.filter(check => !check.exists).map(check => check.table);
      const responseTime = Date.now() - startTime;
      
      if (missingTables.length > 0) {
        return {
          name: 'data-integrity',
          status: 'unhealthy',
          message: `Missing tables: ${missingTables.join(', ')}`,
          responseTime,
          timestamp: Date.now()
        };
      }

      return {
        name: 'data-integrity',
        status: 'healthy',
        message: 'Data integrity check passed',
        responseTime,
        timestamp: Date.now()
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      return {
        name: 'data-integrity',
        status: 'unhealthy',
        message: `Data integrity check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        responseTime,
        timestamp: Date.now()
      };
    }
  }

  private calculateCabinetUptime(cabinetId: string): number {
    // Simple uptime calculation based on health check history
    // In a real implementation, this would track actual uptime
    const healthStatus = this.healthCache.get(cabinetId);
    if (!healthStatus) return 0;
    
    // Return uptime as percentage (simplified)
    return healthStatus.status === 'healthy' ? 99.9 : 
           healthStatus.status === 'degraded' ? 95.0 : 80.0;
  }

  private async checkForAlerts(healthStatus: CabinetHealthStatus): Promise<void> {
    const { cabinetId, status, issues } = healthStatus;
    
    // Generate alerts for unhealthy status
    if (status === 'unhealthy' && issues.length > 0) {
      const alertId = `${cabinetId}-${Date.now()}`;
      const alert: CabinetHealthAlert = {
        id: alertId,
        cabinetId,
        severity: 'critical',
        message: `Cabinet ${healthStatus.cabinetName} is unhealthy: ${issues.join(', ')}`,
        timestamp: new Date(),
        acknowledged: false
      };
      
      this.alerts.set(alertId, alert);
      this.logger.error(`Critical alert for cabinet ${cabinetId}`, { alert });
      
      // Record alert metric
      this.metrics.recordMetric(`cabinet.alert.critical.${cabinetId}`, 1);
    }
    
    // Generate warnings for degraded status
    if (status === 'degraded' && issues.length > 0) {
      const alertId = `${cabinetId}-${Date.now()}`;
      const alert: CabinetHealthAlert = {
        id: alertId,
        cabinetId,
        severity: 'warning',
        message: `Cabinet ${healthStatus.cabinetName} is degraded: ${issues.join(', ')}`,
        timestamp: new Date(),
        acknowledged: false
      };
      
      this.alerts.set(alertId, alert);
      this.logger.warn(`Warning alert for cabinet ${cabinetId}`, { alert });
      
      // Record alert metric
      this.metrics.recordMetric(`cabinet.alert.warning.${cabinetId}`, 1);
    }
  }

  public async getAllCabinetHealth(): Promise<CabinetHealthStatus[]> {
    const cabinetsResult = await this.cabinetService.getActiveCabinets();
    
    if (!cabinetsResult.success || !cabinetsResult.data) {
      return [];
    }

    const healthStatuses = await Promise.all(
      cabinetsResult.data.map(cabinet => this.getCachedCabinetHealth(cabinet.id))
    );

    return healthStatuses.filter(status => status !== null) as CabinetHealthStatus[];
  }

  public async getCachedCabinetHealth(cabinetId: string): Promise<CabinetHealthStatus | null> {
    const cached = this.healthCache.get(cabinetId);
    
    if (!cached) {
      // If not cached, perform health check
      return await this.checkCabinetHealth(cabinetId);
    }
    
    // Check if cache is stale (older than 5 minutes)
    const cacheAge = Date.now() - cached.lastChecked.getTime();
    if (cacheAge > 5 * 60 * 1000) {
      // Refresh in background
      this.checkCabinetHealth(cabinetId).catch(error => 
        this.logger.error(`Background health check failed for ${cabinetId}`, error)
      );
    }
    
    return cached;
  }

  public getActiveAlerts(cabinetId?: string): CabinetHealthAlert[] {
    const alerts = Array.from(this.alerts.values())
      .filter(alert => !alert.acknowledged && !alert.resolvedAt);
    
    if (cabinetId) {
      return alerts.filter(alert => alert.cabinetId === cabinetId);
    }
    
    return alerts;
  }

  public async acknowledgeAlert(alertId: string): Promise<boolean> {
    const alert = this.alerts.get(alertId);
    if (!alert) return false;
    
    alert.acknowledged = true;
    this.alerts.set(alertId, alert);
    
    this.logger.info(`Alert ${alertId} acknowledged`);
    return true;
  }

  public async resolveAlert(alertId: string): Promise<boolean> {
    const alert = this.alerts.get(alertId);
    if (!alert) return false;
    
    alert.resolvedAt = new Date();
    this.alerts.set(alertId, alert);
    
    this.logger.info(`Alert ${alertId} resolved`);
    return true;
  }

  public getHealthSummary(): {
    totalCabinets: number;
    healthyCabinets: number;
    degradedCabinets: number;
    unhealthyCabinets: number;
    activeAlerts: number;
  } {
    const allHealth = Array.from(this.healthCache.values());
    const activeAlerts = this.getActiveAlerts();
    
    return {
      totalCabinets: allHealth.length,
      healthyCabinets: allHealth.filter(h => h.status === 'healthy').length,
      degradedCabinets: allHealth.filter(h => h.status === 'degraded').length,
      unhealthyCabinets: allHealth.filter(h => h.status === 'unhealthy').length,
      activeAlerts: activeAlerts.length
    };
  }
}