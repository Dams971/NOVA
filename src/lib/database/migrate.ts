import fs from 'fs';
import path from 'path';
import { getPool, testConnection } from './config';

interface Migration {
  id: string;
  filename: string;
  sql: string;
}

// Create migrations table if it doesn't exist
const createMigrationsTable = async () => {
  const pool = getPool();
  const sql = `
    CREATE TABLE IF NOT EXISTS migrations (
      id VARCHAR(255) PRIMARY KEY,
      filename VARCHAR(255) NOT NULL,
      executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;
  await pool.execute(sql);
};

// Get executed migrations
const getExecutedMigrations = async (): Promise<string[]> => {
  const pool = getPool();
  const [rows] = await pool.execute('SELECT id FROM migrations ORDER BY executed_at');
  return (rows as any[]).map(row => row.id);
};

// Record migration as executed
const recordMigration = async (migration: Migration) => {
  const pool = getPool();
  await pool.execute(
    'INSERT INTO migrations (id, filename) VALUES (?, ?)',
    [migration.id, migration.filename]
  );
};

// Load migration files
const loadMigrations = (): Migration[] => {
  const migrationsDir = path.join(__dirname, 'migrations');
  const files = fs.readdirSync(migrationsDir).filter(file => file.endsWith('.sql'));
  
  return files.map(filename => {
    const id = filename.replace('.sql', '');
    const filePath = path.join(migrationsDir, filename);
    const sql = fs.readFileSync(filePath, 'utf8');
    
    return { id, filename, sql };
  }).sort((a, b) => a.id.localeCompare(b.id));
};

// Execute a single migration
const executeMigration = async (migration: Migration) => {
  const pool = getPool();
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    // Split SQL by semicolons and execute each statement
    const statements = migration.sql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);
    
    for (const statement of statements) {
      await connection.execute(statement);
    }
    
    // Record migration
    await connection.execute(
      'INSERT INTO migrations (id, filename) VALUES (?, ?)',
      [migration.id, migration.filename]
    );
    
    await connection.commit();
    console.log(`✅ Migration ${migration.id} executed successfully`);
  } catch (error) {
    await connection.rollback();
    console.error(`❌ Migration ${migration.id} failed:`, error);
    throw error;
  } finally {
    connection.release();
  }
};

// Run all pending migrations
export const runMigrations = async () => {
  try {
    console.log('🚀 Starting database migrations...');

    // Test database connection first
    const isConnected = await testConnection();
    if (!isConnected) {
      throw new Error('Cannot connect to database. Please check your configuration.');
    }

    // Create migrations table
    await createMigrationsTable();
    
    // Load all migrations
    const migrations = loadMigrations();
    console.log(`📁 Found ${migrations.length} migration files`);
    
    // Get executed migrations
    const executedMigrations = await getExecutedMigrations();
    console.log(`✅ ${executedMigrations.length} migrations already executed`);
    
    // Find pending migrations
    const pendingMigrations = migrations.filter(
      migration => !executedMigrations.includes(migration.id)
    );
    
    if (pendingMigrations.length === 0) {
      console.log('✨ No pending migrations');
      return;
    }
    
    console.log(`⏳ Executing ${pendingMigrations.length} pending migrations...`);
    
    // Execute pending migrations
    for (const migration of pendingMigrations) {
      await executeMigration(migration);
    }
    
    console.log('🎉 All migrations completed successfully!');
  } catch (_error) {
    console.error('💥 Migration failed:', error);
    throw error;
  }
};

// Rollback last migration (for development)
export const rollbackLastMigration = async () => {
  const pool = getPool();
  const [rows] = await pool.execute(
    'SELECT * FROM migrations ORDER BY executed_at DESC LIMIT 1'
  );
  
  if ((rows as any[]).length === 0) {
    console.log('No migrations to rollback');
    return;
  }
  
  const lastMigration = (rows as any[])[0];
  console.log(`⚠️  Rolling back migration: ${lastMigration.id}`);
  
  // Note: This is a simple implementation
  // In a real app, you'd want to have rollback scripts
  await pool.execute('DELETE FROM migrations WHERE id = ?', [lastMigration.id]);
  console.log('✅ Migration rollback completed');
};

// CLI interface
if (require.main === module) {
  const command = process.argv[2];
  
  switch (command) {
    case 'up':
      runMigrations()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
      break;
    case 'rollback':
      rollbackLastMigration()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
      break;
    default:
      console.log('Usage: npm run migrate [up|rollback]');
      process.exit(1);
  }
}
