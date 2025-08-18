import { z } from 'zod';

// Environment validation schema for NOVA platform
const EnvSchema = z.object({
  // Application
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),
  
  // JWT & Authentication
  JWT_ACCESS_SECRET: z.string().min(32, 'JWT access secret must be at least 32 characters'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT refresh secret must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('15m'),
  REFRESH_EXPIRES_IN: z.string().default('7d'),
  
  // Database (Optional when using Supabase)
  DATABASE_URL: z.string().url('Invalid database URL').optional(),
  DB_HOST: z.string().default('localhost'),
  DB_PORT: z.coerce.number().default(5432),
  DB_USER: z.string().default('nova_user'),
  DB_PASSWORD: z.string().optional(), // Optional when using Supabase
  DB_NAME: z.string().default('nova_db'),
  DB_SSL: z.string().default('false'),
  
  // Supabase Configuration
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('Invalid Supabase URL').optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().optional(),
  
  // Redis (for rate limiting, caching, real-time features)
  REDIS_URL: z.string().url('Invalid Redis URL').default('redis://localhost:6379'),
  
  // Email & SMS
  SMTP_HOST: z.string().default('localhost'),
  SMTP_PORT: z.coerce.number().default(1025),
  SMTP_SECURE: z.coerce.boolean().default(false),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  SMTP_FROM: z.string().email().default('noreply@nova-dental.fr'),
  
  // File Storage (S3/MinIO)
  STORAGE_ENDPOINT: z.string().url().optional(),
  STORAGE_BUCKET: z.string().default('nova-medical-files'),
  STORAGE_ACCESS_KEY: z.string().optional(),
  STORAGE_SECRET_KEY: z.string().optional(),
  STORAGE_REGION: z.string().default('eu-west-1'),
  
  // AI/LLM Integration
  LLM_PROVIDER: z.enum(['none', 'openai', 'anthropic', 'vertex']).default('none'),
  LLM_API_KEY: z.string().optional(),
  LLM_MODEL: z.string().default('gpt-4'),
  
  // Healthcare Compliance
  AUDIT_LOG_RETENTION_DAYS: z.coerce.number().default(2555), // 7 years for medical records
  PHI_ENCRYPTION_KEY: z.string().min(32, 'PHI encryption key must be at least 32 characters').optional(),
  
  // Rate Limiting
  RATE_LIMIT_REQUESTS_PER_MINUTE: z.coerce.number().default(100),
  RATE_LIMIT_BURST_SIZE: z.coerce.number().default(10),
  
  // Monitoring & Logging
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  ENABLE_REQUEST_LOGGING: z.string().transform(val => val === 'true').default('true'),
  
  // Feature Flags
  ENABLE_MFA: z.string().transform(val => val === 'true').default('true'),
  ENABLE_AI_CHATBOT: z.string().transform(val => val === 'true').default('false'),
  ENABLE_REALTIME_UPDATES: z.string().transform(val => val === 'true').default('false'),
  ENABLE_ANALYTICS: z.string().transform(val => val === 'true').default('true'),
}).passthrough();

// Parse and validate environment variables
const parseEnv = () => {
  try {
    return EnvSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map(err => 
        `${err.path.join('.')}: ${err.message}`
      ).join('\n');
      
      throw new Error(`Environment validation failed:\n${errorMessages}`);
    }
    throw error;
  }
};

// Export validated environment
export const env = parseEnv();

// Export schema for testing
export { EnvSchema };

// Type-safe environment object
export type Environment = z.infer<typeof EnvSchema>;

// Helper functions
export const isProduction = () => env.NODE_ENV === 'production';
export const isDevelopment = () => env.NODE_ENV === 'development';
export const isTest = () => env.NODE_ENV === 'test';

// Validation helper for runtime checks
export const validateEnvForProduction = () => {
  if (!isProduction()) return { valid: true, errors: [] };
  
  const errors: string[] = [];
  
  // Production-specific validations
  if (env.JWT_ACCESS_SECRET.includes('default') || env.JWT_ACCESS_SECRET.length < 64) {
    errors.push('JWT_ACCESS_SECRET must be a strong, unique secret in production');
  }
  
  if (env.JWT_REFRESH_SECRET.includes('default') || env.JWT_REFRESH_SECRET.length < 64) {
    errors.push('JWT_REFRESH_SECRET must be a strong, unique secret in production');
  }
  
  // Check if using Supabase or traditional database
  if (!env.NEXT_PUBLIC_SUPABASE_URL && !env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    // Only validate DB_PASSWORD if not using Supabase
    if (!env.DB_PASSWORD || env.DB_PASSWORD === 'password' || env.DB_PASSWORD.length < 12) {
      errors.push('DB_PASSWORD must be strong and unique in production (or use Supabase)');
    }
  }
  
  if (env.NEXT_PUBLIC_APP_URL.includes('localhost')) {
    errors.push('NEXT_PUBLIC_APP_URL must be set to production URL');
  }
  
  if (!env.PHI_ENCRYPTION_KEY) {
    errors.push('PHI_ENCRYPTION_KEY is required in production for healthcare compliance');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};