/**
 * Environment configuration management for Nova Platform
 */

export interface EnvironmentConfig {
  // Application
  nodeEnv: string;
  appUrl: string;
  apiUrl: string;
  
  // Database
  database: {
    host: string;
    port: number;
    user: string;
    password: string;
    ssl: boolean;
  };
  
  // JWT
  jwt: {
    secret: string;
    refreshSecret: string;
    accessExpiry: string;
    refreshExpiry: string;
  };
  
  // Security
  security: {
    bcryptRounds: number;
    sessionSecret: string;
    allowedOrigins: string[];
  };
  
  // Rate Limiting
  rateLimit: {
    maxRequests: number;
    windowMs: number;
  };
  
  // Logging
  logging: {
    level: string;
    filePath: string;
  };
  
  // Monitoring
  monitoring: {
    enabled: boolean;
    port: number;
  };
  
  // Email
  email: {
    host: string;
    port: number;
    user: string;
    password: string;
    from: string;
  };
  
  // SMS
  sms: {
    provider: string;
    twilio: {
      accountSid: string;
      authToken: string;
      phoneNumber: string;
    };
  };
  
  // AI
  ai: {
    openaiApiKey: string;
    model: string;
    maxTokens: number;
  };
  
  // Storage
  storage: {
    provider: string;
    path: string;
    aws?: {
      accessKeyId: string;
      secretAccessKey: string;
      region: string;
      bucket: string;
    };
  };
  
  // Redis
  redis: {
    url: string;
    password: string;
    db: number;
  };
  
  // Feature Flags
  features: {
    aiBooking: boolean;
    multiCabinetRouting: boolean;
    analytics: boolean;
    auditLogging: boolean;
  };
  
  // Development
  development: {
    debug: boolean;
    enableSwagger: boolean;
  };
}

class EnvironmentManager {
  private static instance: EnvironmentManager;
  private config: EnvironmentConfig;

  private constructor() {
    this.config = this.loadConfiguration();
    this.validateConfiguration();
  }

  public static getInstance(): EnvironmentManager {
    if (!EnvironmentManager.instance) {
      EnvironmentManager.instance = new EnvironmentManager();
    }
    return EnvironmentManager.instance;
  }

  private loadConfiguration(): EnvironmentConfig {
    return {
      nodeEnv: process.env.NODE_ENV || 'development',
      appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api',
      
      database: {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '3306'),
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        ssl: process.env.DB_SSL === 'true'
      },
      
      jwt: {
        secret: process.env.JWT_SECRET || 'default-secret-change-in-production',
        refreshSecret: process.env.JWT_REFRESH_SECRET || 'default-refresh-secret-change-in-production',
        accessExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
        refreshExpiry: process.env.JWT_REFRESH_EXPIRY || '7d'
      },
      
      security: {
        bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12'),
        sessionSecret: process.env.SESSION_SECRET || 'default-session-secret',
        allowedOrigins: (process.env.ALLOWED_ORIGINS || 'http://localhost:3000').split(',')
      },
      
      rateLimit: {
        maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000')
      },
      
      logging: {
        level: process.env.LOG_LEVEL || 'info',
        filePath: process.env.LOG_FILE_PATH || './logs/nova.log'
      },
      
      monitoring: {
        enabled: process.env.ENABLE_METRICS === 'true',
        port: parseInt(process.env.METRICS_PORT || '9090')
      },
      
      email: {
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        user: process.env.SMTP_USER || '',
        password: process.env.SMTP_PASSWORD || '',
        from: process.env.SMTP_FROM || 'Nova Platform <noreply@nova-platform.com>'
      },
      
      sms: {
        provider: process.env.SMS_PROVIDER || 'twilio',
        twilio: {
          accountSid: process.env.TWILIO_ACCOUNT_SID || '',
          authToken: process.env.TWILIO_AUTH_TOKEN || '',
          phoneNumber: process.env.TWILIO_PHONE_NUMBER || ''
        }
      },
      
      ai: {
        openaiApiKey: process.env.OPENAI_API_KEY || '',
        model: process.env.AI_MODEL || 'gpt-4',
        maxTokens: parseInt(process.env.AI_MAX_TOKENS || '1000')
      },
      
      storage: {
        provider: process.env.STORAGE_PROVIDER || 'local',
        path: process.env.STORAGE_PATH || './uploads',
        aws: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
          region: process.env.AWS_REGION || 'us-east-1',
          bucket: process.env.AWS_S3_BUCKET || ''
        }
      },
      
      redis: {
        url: process.env.REDIS_URL || 'redis://localhost:6379',
        password: process.env.REDIS_PASSWORD || '',
        db: parseInt(process.env.REDIS_DB || '0')
      },
      
      features: {
        aiBooking: process.env.ENABLE_AI_BOOKING === 'true',
        multiCabinetRouting: process.env.ENABLE_MULTI_CABINET_ROUTING === 'true',
        analytics: process.env.ENABLE_ANALYTICS === 'true',
        auditLogging: process.env.ENABLE_AUDIT_LOGGING === 'true'
      },
      
      development: {
        debug: process.env.DEBUG === 'true',
        enableSwagger: process.env.ENABLE_SWAGGER === 'true'
      }
    };
  }

  private validateConfiguration(): void {
    const errors: string[] = [];

    // Validate critical configuration
    if (this.config.nodeEnv === 'production') {
      if (this.config.jwt.secret === 'default-secret-change-in-production') {
        errors.push('JWT_SECRET must be set in production');
      }
      
      if (this.config.jwt.refreshSecret === 'default-refresh-secret-change-in-production') {
        errors.push('JWT_REFRESH_SECRET must be set in production');
      }
      
      if (!this.config.database.password) {
        errors.push('DB_PASSWORD must be set in production');
      }
    }

    // Validate database configuration
    if (!this.config.database.host) {
      errors.push('DB_HOST is required');
    }

    if (isNaN(this.config.database.port) || this.config.database.port <= 0) {
      errors.push('DB_PORT must be a valid port number');
    }

    // Validate rate limiting
    if (isNaN(this.config.rateLimit.maxRequests) || this.config.rateLimit.maxRequests <= 0) {
      errors.push('RATE_LIMIT_MAX_REQUESTS must be a positive number');
    }

    if (errors.length > 0) {
      console.error('Configuration validation errors:');
      errors.forEach(error => console.error(`- ${error}`));
      throw new Error('Invalid configuration');
    }
  }

  public getConfig(): EnvironmentConfig {
    return this.config;
  }

  public isDevelopment(): boolean {
    return this.config.nodeEnv === 'development';
  }

  public isProduction(): boolean {
    return this.config.nodeEnv === 'production';
  }

  public isFeatureEnabled(feature: keyof EnvironmentConfig['features']): boolean {
    return this.config.features[feature];
  }

  public getDatabaseConfig() {
    return this.config.database;
  }

  public getJWTConfig() {
    return this.config.jwt;
  }

  public getSecurityConfig() {
    return this.config.security;
  }
}

export default EnvironmentManager;