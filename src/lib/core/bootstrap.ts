import DatabaseManager from '../database/connection';
import EnvironmentManager from '../config/environment';
import Logger from '../logging/logger';
import MetricsCollector from '../monitoring/metrics';
import HealthMonitor from '../monitoring/health';

/**
 * Bootstrap class to initialize core infrastructure
 */
class Bootstrap {
  private static instance: Bootstrap;
  private isInitialized = false;
  private logger: Logger;

  private constructor() {
    this.logger = Logger.getInstance();
  }

  public static getInstance(): Bootstrap {
    if (!Bootstrap.instance) {
      Bootstrap.instance = new Bootstrap();
    }
    return Bootstrap.instance;
  }

  /**
   * Initialize all core infrastructure components
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      this.logger.warn('Bootstrap already initialized');
      return;
    }

    try {
      this.logger.info('Starting Nova Platform initialization...');

      // 1. Initialize environment configuration
      const env = EnvironmentManager.getInstance();
      this.logger.info('Environment configuration loaded', {
        nodeEnv: env.getConfig().nodeEnv,
        features: env.getConfig().features
      });

      // 2. Initialize database connections
      await this.initializeDatabase();

      // 3. Initialize monitoring and metrics
      this.initializeMonitoring();

      // 4. Initialize health monitoring
      this.initializeHealthMonitoring();

      // 5. Setup graceful shutdown handlers
      this.setupGracefulShutdown();

      this.isInitialized = true;
      this.logger.info('Nova Platform initialization completed successfully');

    } catch (error) {
      this.logger.error('Failed to initialize Nova Platform', error);
      throw error;
    }
  }

  private async initializeDatabase(): Promise<void> {
    try {
      this.logger.info('Initializing database connections...');
      
      const dbManager = DatabaseManager.getInstance();
      
      // Test main database connection
      const isConnected = await dbManager.testConnection();
      if (!isConnected) {
        throw new Error('Failed to connect to main database');
      }

      this.logger.info('Database connections initialized successfully');
      
    } catch (error) {
      this.logger.error('Database initialization failed', error);
      throw error;
    }
  }

  private initializeMonitoring(): void {
    try {
      this.logger.info('Initializing monitoring and metrics...');
      
      // Initialize metrics collector
      const metrics = MetricsCollector.getInstance();
      
      // Record initialization metric
      metrics.recordMetric('system.initialization', 1, {
        timestamp: new Date().toISOString()
      });

      this.logger.info('Monitoring and metrics initialized successfully');
      
    } catch (error) {
      this.logger.error('Monitoring initialization failed', error);
      throw error;
    }
  }

  private initializeHealthMonitoring(): void {
    try {
      this.logger.info('Initializing health monitoring...');
      
      // Initialize health monitor (starts background health checks)
      HealthMonitor.getInstance();

      this.logger.info('Health monitoring initialized successfully');
      
    } catch (error) {
      this.logger.error('Health monitoring initialization failed', error);
      throw error;
    }
  }

  private setupGracefulShutdown(): void {
    const gracefulShutdown = async (signal: string) => {
      this.logger.info(`Received ${signal}, starting graceful shutdown...`);

      try {
        // Stop health monitoring
        const healthMonitor = HealthMonitor.getInstance();
        healthMonitor.stopHealthChecks();

        // Close database connections
        const dbManager = DatabaseManager.getInstance();
        await dbManager.closeAllConnections();

        this.logger.info('Graceful shutdown completed');
        process.exit(0);

      } catch (_error) {
        this.logger.error('Error during graceful shutdown', error);
        process.exit(1);
      }
    };

    // Handle different shutdown signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('SIGUSR2', () => gracefulShutdown('SIGUSR2')); // Nodemon restart

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      this.logger.error('Uncaught exception', error);
      gracefulShutdown('uncaughtException');
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      this.logger.error('Unhandled promise rejection', { reason, promise });
      gracefulShutdown('unhandledRejection');
    });
  }

  /**
   * Get initialization status
   */
  public isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * Create a new cabinet database
   */
  public async createCabinet(cabinetId: string): Promise<void> {
    try {
      this.logger.info(`Creating cabinet database: ${cabinetId}`);
      
      const dbManager = DatabaseManager.getInstance();
      await dbManager.createCabinetDatabase(cabinetId);
      
      // Record metrics
      const metrics = MetricsCollector.getInstance();
      metrics.recordCabinetEvent('creation', cabinetId, true);
      
      this.logger.info(`Cabinet database created successfully: ${cabinetId}`);
      
    } catch (_error) {
      this.logger.error(`Failed to create cabinet database: ${cabinetId}`, error);
      
      // Record failure metric
      const metrics = MetricsCollector.getInstance();
      metrics.recordCabinetEvent('creation', cabinetId, false);
      
      throw error;
    }
  }

  /**
   * Validate system readiness
   */
  public async validateSystemReadiness(): Promise<{ ready: boolean; issues: string[] }> {
    const issues: string[] = [];

    try {
      // Check database connectivity
      const dbManager = DatabaseManager.getInstance();
      const dbConnected = await dbManager.testConnection();
      if (!dbConnected) {
        issues.push('Database connection failed');
      }

      // Check environment configuration
      const env = EnvironmentManager.getInstance();
      if (env.isProduction()) {
        const config = env.getConfig();
        if (config.jwt.secret === 'default-secret-change-in-production') {
          issues.push('JWT secret not configured for production');
        }
        if (!config.database.password) {
          issues.push('Database password not configured for production');
        }
      }

      // Check health monitoring
      const healthMonitor = HealthMonitor.getInstance();
      const systemHealth = await healthMonitor.getSystemHealth();
      if (systemHealth.status === 'unhealthy') {
        issues.push('System health checks failing');
      }

    } catch (error) {
      issues.push(`System validation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return {
      ready: issues.length === 0,
      issues
    };
  }
}

export default Bootstrap;