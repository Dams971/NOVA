// Database configuration for Nova
import mysql from 'mysql2/promise';

export interface DatabaseConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
  ssl?: any;
  connectionLimit?: number;
  acquireTimeout?: number;
  timeout?: number;
}

// Environment-based configuration
const getDatabaseConfig = (): DatabaseConfig => {
  const config: DatabaseConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'nova_user',
    password: process.env.DB_PASSWORD || 'nova_password',
    database: process.env.DB_NAME || 'nova_db',
    connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT || '10'),
    acquireTimeout: parseInt(process.env.DB_ACQUIRE_TIMEOUT || '60000'),
    timeout: parseInt(process.env.DB_TIMEOUT || '60000'),
  };

  // Enable SSL for production
  if (process.env.NODE_ENV === 'production') {
    config.ssl = {
      rejectUnauthorized: false
    } as any;
  }

  return config;
};

// Connection pool
let pool: mysql.Pool | null = null;

export const getPool = (): mysql.Pool => {
  if (!pool) {
    const config = getDatabaseConfig();
    pool = mysql.createPool(config as any);
  }
  return pool;
};

// Test database connection
export const testConnection = async (): Promise<boolean> => {
  try {
    const connection = await getPool().getConnection();
    await connection.ping();
    connection.release();
    console.warn('✅ Database connection successful');
    return true;
  } catch (_error) {
    console.error('❌ Database connection failed:', _error);
    return false;
  }
};

// Close all connections
export const closePool = async (): Promise<void> => {
  if (pool) {
    await pool.end();
    pool = null;
  }
};
