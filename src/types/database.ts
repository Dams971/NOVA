/**
 * Database types for NOVA RDV platform
 */

// Base database entity
export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

// Database query result types
export interface QueryResult<T = unknown> {
  rows: T[];
  rowCount: number;
  command: string;
  fields?: Array<{
    name: string;
    dataTypeID: number;
  }>;
}

export interface QueryParams {
  text: string;
  values?: unknown[];
}

// Transaction types
export interface DatabaseTransaction {
  query: (text: string, params?: unknown[]) => Promise<QueryResult>;
  commit: () => Promise<void>;
  rollback: () => Promise<void>;
}

export interface TransactionCallback<T> {
  (transaction: DatabaseTransaction): Promise<T>;
}

// Database connection configuration
export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl?: boolean | {
    rejectUnauthorized?: boolean;
    ca?: string;
    cert?: string;
    key?: string;
  };
  pool?: {
    min?: number;
    max?: number;
    idleTimeoutMillis?: number;
    connectionTimeoutMillis?: number;
  };
}

// Connection pool status
export interface PoolStatus {
  totalConnections: number;
  idleConnections: number;
  activeConnections: number;
  waitingCount: number;
}

// Database migration types
export interface Migration {
  id: string;
  name: string;
  version: string;
  up: string;
  down: string;
  checksum: string;
  appliedAt?: Date;
}

export interface MigrationResult {
  success: boolean;
  migrationsRun: string[];
  errors: Array<{
    migration: string;
    error: string;
  }>;
}

// Repository base types
export interface RepositoryOptions {
  transaction?: DatabaseTransaction;
  include?: string[];
  select?: string[];
  orderBy?: Array<{
    field: string;
    direction: 'ASC' | 'DESC';
  }>;
  limit?: number;
  offset?: number;
}

export interface FindOptions extends RepositoryOptions {
  where?: Record<string, unknown>;
}

export interface UpdateOptions extends RepositoryOptions {
  where: Record<string, unknown>;
}

export interface DeleteOptions extends RepositoryOptions {
  where: Record<string, unknown>;
}

// Query builder types
export interface QueryBuilder {
  select: (fields: string | string[]) => QueryBuilder;
  from: (table: string) => QueryBuilder;
  join: (table: string, condition: string) => QueryBuilder;
  leftJoin: (table: string, condition: string) => QueryBuilder;
  where: (condition: string, value?: unknown) => QueryBuilder;
  whereIn: (field: string, values: unknown[]) => QueryBuilder;
  whereNotNull: (field: string) => QueryBuilder;
  whereNull: (field: string) => QueryBuilder;
  orderBy: (field: string, direction?: 'ASC' | 'DESC') => QueryBuilder;
  groupBy: (fields: string | string[]) => QueryBuilder;
  having: (condition: string, value?: unknown) => QueryBuilder;
  limit: (count: number) => QueryBuilder;
  offset: (count: number) => QueryBuilder;
  build: () => QueryParams;
  execute: () => Promise<QueryResult>;
}

// Database health monitoring
export interface DatabaseHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  connectionCount: number;
  responseTime: number;
  lastQuery: Date;
  errors: number;
  uptime: number;
}

// Backup and restore types
export interface BackupConfig {
  schedule: string;
  retentionDays: number;
  compression: boolean;
  encryption?: {
    enabled: boolean;
    key?: string;
  };
}

export interface BackupResult {
  id: string;
  filename: string;
  size: number;
  createdAt: Date;
  checksum: string;
  tables: string[];
}

// Index management
export interface IndexInfo {
  name: string;
  table: string;
  columns: string[];
  unique: boolean;
  type: 'btree' | 'hash' | 'gin' | 'gist';
  size: number;
  usage: {
    scans: number;
    tuples_read: number;
    tuples_fetched: number;
  };
}

// Database statistics
export interface TableStats {
  table: string;
  rowCount: number;
  size: number;
  lastVacuum: Date;
  lastAnalyze: Date;
  deadTuples: number;
}

export interface DatabaseStats {
  size: number;
  connectionCount: number;
  activeQueries: number;
  slowQueries: number;
  cacheHitRatio: number;
  tables: TableStats[];
  indexes: IndexInfo[];
}

// Error types
export interface DatabaseError extends Error {
  code: string;
  severity: string;
  detail?: string;
  hint?: string;
  position?: string;
  internalPosition?: string;
  internalQuery?: string;
  where?: string;
  schema?: string;
  table?: string;
  column?: string;
  dataType?: string;
  constraint?: string;
  file?: string;
  line?: string;
  routine?: string;
}

// Event types for database monitoring
export interface DatabaseEvent {
  type: 'connection' | 'query' | 'error' | 'slow_query' | 'deadlock';
  timestamp: Date;
  duration?: number;
  query?: string;
  parameters?: unknown[];
  error?: DatabaseError;
  connectionId?: string;
  userId?: string;
}

// Connection pool events
export interface PoolEvent {
  type: 'acquire' | 'release' | 'error' | 'connect' | 'disconnect';
  timestamp: Date;
  connectionId: string;
  duration?: number;
  error?: Error;
}