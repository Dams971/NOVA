import { Pool, Client, PoolClient, PoolConfig } from 'pg';
import { env } from '@/config/env';

/**
 * NOVA PostgreSQL Database Connection Manager
 * Handles connection pooling and multi-tenant database access
 */

interface DatabaseConfig extends PoolConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
  ssl?: boolean | object;
  max?: number; // maximum number of clients in the pool
  idleTimeoutMillis?: number;
  connectionTimeoutMillis?: number;
}

export class PostgreSQLManager {
  private static instance: PostgreSQLManager;
  private pools: Map<string, Pool> = new Map();
  private config: DatabaseConfig;

  private constructor() {
    this.config = {
      host: env.DB_HOST || 'localhost',
      port: parseInt(env.DB_PORT || '5432'),
      user: env.DB_USER || 'nova_user',
      password: env.DB_PASSWORD || 'nova_password',
      database: env.DB_NAME || 'nova_db',
      ssl: env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
      max: 20, // max number of clients in pool
      idleTimeoutMillis: 30000, // close idle clients after 30 seconds
      connectionTimeoutMillis: 2000, // return error after 2 seconds if connection could not be established
    };
  }

  public static getInstance(): PostgreSQLManager {
    if (!PostgreSQLManager.instance) {
      PostgreSQLManager.instance = new PostgreSQLManager();
    }
    return PostgreSQLManager.instance;
  }

  /**
   * Get connection pool for the main database
   */
  public getMainPool(): Pool {
    const key = 'main';
    
    if (!this.pools.has(key)) {
      const pool = new Pool(this.config);
      
      // Handle pool errors
      pool.on('error', (err) => {
        console.error('Unexpected error on idle PostgreSQL client', err);
      });

      // Handle client connections
      pool.on('connect', (client) => {
        console.log('New PostgreSQL client connected');
      });

      this.pools.set(key, pool);
    }

    return this.pools.get(key)!;
  }

  /**
   * Get a client from the main pool
   */
  public async getMainClient(): Promise<PoolClient> {
    const pool = this.getMainPool();
    return await pool.connect();
  }

  /**
   * Execute a query on the main database
   */
  public async query(text: string, params?: any[]): Promise<any> {
    const client = await this.getMainClient();
    try {
      const result = await client.query(text, params);
      return result;
    } finally {
      client.release();
    }
  }

  /**
   * Execute a query and return only the rows
   */
  public async queryRows(text: string, params?: any[]): Promise<any[]> {
    const result = await this.query(text, params);
    return result.rows;
  }

  /**
   * Execute a query and return only the first row
   */
  public async queryRow(text: string, params?: any[]): Promise<any | null> {
    const rows = await this.queryRows(text, params);
    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * Begin a transaction
   */
  public async beginTransaction(): Promise<PoolClient> {
    const client = await this.getMainClient();
    await client.query('BEGIN');
    return client;
  }

  /**
   * Commit a transaction
   */
  public async commitTransaction(client: PoolClient): Promise<void> {
    try {
      await client.query('COMMIT');
    } finally {
      client.release();
    }
  }

  /**
   * Rollback a transaction
   */
  public async rollbackTransaction(client: PoolClient): Promise<void> {
    try {
      await client.query('ROLLBACK');
    } finally {
      client.release();
    }
  }

  /**
   * Execute queries in a transaction
   */
  public async transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.beginTransaction();
    
    try {
      const result = await callback(client);
      await this.commitTransaction(client);
      return result;
    } catch (error) {
      await this.rollbackTransaction(client);
      throw error;
    }
  }

  /**
   * Test database connectivity
   */
  public async testConnection(): Promise<boolean> {
    try {
      const result = await this.query('SELECT 1 as test');
      return result.rows[0]?.test === 1;
    } catch (_error) {
      console.error('PostgreSQL connection test failed:', error);
      return false;
    }
  }

  /**
   * Get database statistics
   */
  public async getStats(): Promise<any> {
    const pool = this.getMainPool();
    return {
      totalCount: pool.totalCount,
      idleCount: pool.idleCount,
      waitingCount: pool.waitingCount,
    };
  }

  /**
   * Close all connection pools
   */
  public async closeAllPools(): Promise<void> {
    const closePromises = Array.from(this.pools.entries()).map(async ([key, pool]) => {
      try {
        await pool.end();
        console.log(`Closed PostgreSQL pool: ${key}`);
      } catch (_error) {
        console.error(`Error closing PostgreSQL pool ${key}:`, error);
      }
    });

    await Promise.all(closePromises);
    this.pools.clear();
  }

  /**
   * Initialize database (run migrations, create tables, etc.)
   */
  public async initialize(): Promise<void> {
    try {
      // Test connection
      const isConnected = await this.testConnection();
      if (!isConnected) {
        throw new Error('Failed to connect to PostgreSQL database');
      }

      console.log('✅ PostgreSQL database connected successfully');
      
      // Check if tables exist
      const tablesExist = await this.checkTablesExist();
      if (!tablesExist) {
        console.log('⚠️ Database tables not found. Please run the setup-postgresql.sql script first.');
      } else {
        console.log('✅ Database tables verified');
      }

    } catch (_error) {
      console.error('❌ Database initialization failed:', error);
      throw error;
    }
  }

  /**
   * Check if main tables exist
   */
  private async checkTablesExist(): Promise<boolean> {
    try {
      const result = await this.query(`
        SELECT COUNT(*) as count 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('users', 'cabinets', 'appointments', 'email_queue')
      `);
      
      return result.rows[0]?.count >= 4;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get cabinet by ID
   */
  public async getCabinet(cabinetId: string): Promise<any | null> {
    return await this.queryRow(
      'SELECT * FROM cabinets WHERE id = $1 AND is_active = true',
      [cabinetId]
    );
  }

  /**
   * Get user by email
   */
  public async getUserByEmail(email: string): Promise<any | null> {
    return await this.queryRow(
      'SELECT * FROM users WHERE email = $1 AND is_active = true',
      [email]
    );
  }

  /**
   * Get practitioner with user info
   */
  public async getPractitioner(practitionerId: string): Promise<any | null> {
    return await this.queryRow(`
      SELECT p.*, u.first_name, u.last_name, u.email, u.phone
      FROM practitioners p
      JOIN users u ON p.user_id = u.id
      WHERE p.id = $1 AND p.is_active = true AND u.is_active = true
    `, [practitionerId]);
  }

  /**
   * Get appointments for a cabinet within date range
   */
  public async getAppointments(cabinetId: string, startDate: Date, endDate: Date): Promise<any[]> {
    return await this.queryRows(`
      SELECT a.*, 
             p.first_name as practitioner_first_name,
             p.last_name as practitioner_last_name,
             s.name as service_name,
             s.color as service_color
      FROM appointments a
      LEFT JOIN practitioners pr ON a.practitioner_id = pr.id
      LEFT JOIN users p ON pr.user_id = p.id  
      LEFT JOIN services s ON a.service_id = s.id
      WHERE a.cabinet_id = $1 
      AND a.scheduled_at >= $2 
      AND a.scheduled_at <= $3
      AND a.status != 'cancelled'
      ORDER BY a.scheduled_at ASC
    `, [cabinetId, startDate, endDate]);
  }
}

// Export singleton instance
export const db = PostgreSQLManager.getInstance();

// Legacy compatibility exports
export const createConnection = () => db.getMainPool();
export const DatabaseConnection = PostgreSQLManager;

export default db;