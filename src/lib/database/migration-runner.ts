import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import DatabaseManager from './connection';

interface Migration {
  version: string;
  filename: string;
  sql: string;
}

export class MigrationRunner {
  private dbManager: DatabaseManager;
  private migrationsPath: string;

  constructor() {
    this.dbManager = DatabaseManager.getInstance();
    this.migrationsPath = join(__dirname, 'migrations');
  }

  async runMigrations(): Promise<void> {
    const connection = await this.dbManager.getMainConnection();

    try {
      // Create migrations tracking table if it doesn't exist
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS schema_migrations (
          version VARCHAR(10) PRIMARY KEY,
          filename VARCHAR(255) NOT NULL,
          executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Get list of migration files
      const migrations = this.getMigrationFiles();
      
      // Get already executed migrations
      const [executedRows] = await connection.execute(
        'SELECT version FROM schema_migrations ORDER BY version'
      );
      const executedVersions = new Set(
        (executedRows as any[]).map(row => row.version)
      );

      // Execute pending migrations
      for (const migration of migrations) {
        if (!executedVersions.has(migration.version)) {
          console.log(`Running migration ${migration.version}: ${migration.filename}`);
          
          try {
            // Execute migration SQL
            const statements = migration.sql.split(';').filter(stmt => stmt.trim());
            for (const statement of statements) {
              if (statement.trim()) {
                await connection.execute(statement);
              }
            }

            // Record migration as executed
            await connection.execute(
              'INSERT INTO schema_migrations (version, filename) VALUES (?, ?)',
              [migration.version, migration.filename]
            );

            console.log(`✓ Migration ${migration.version} completed successfully`);
          } catch (_error) {
            console.error(`✗ Migration ${migration.version} failed:`, error);
            throw error;
          }
        }
      }

      console.log('All migrations completed successfully');
    } catch (_error) {
      console.error('Migration runner failed:', error);
      throw error;
    }
  }

  private getMigrationFiles(): Migration[] {
    try {
      const files = readdirSync(this.migrationsPath)
        .filter(file => file.endsWith('.sql'))
        .sort();

      return files.map(filename => {
        const version = filename.split('_')[0];
        const sql = readFileSync(join(this.migrationsPath, filename), 'utf-8');
        
        return {
          version,
          filename,
          sql
        };
      });
    } catch (_error) {
      console.error('Error reading migration files:', error);
      return [];
    }
  }

  async rollbackMigration(version: string): Promise<void> {
    const connection = await this.dbManager.getMainConnection();

    try {
      // Remove migration record
      await connection.execute(
        'DELETE FROM schema_migrations WHERE version = ?',
        [version]
      );

      console.log(`Migration ${version} rolled back (record removed)`);
      console.log('Note: This only removes the migration record. Manual rollback of schema changes may be required.');
    } catch (_error) {
      console.error(`Error rolling back migration ${version}:`, error);
      throw error;
    }
  }

  async getMigrationStatus(): Promise<{ version: string; filename: string; executedAt: Date }[]> {
    const connection = await this.dbManager.getMainConnection();

    try {
      const [rows] = await connection.execute(
        'SELECT version, filename, executed_at FROM schema_migrations ORDER BY version'
      );

      return (rows as any[]).map(row => ({
        version: row.version,
        filename: row.filename,
        executedAt: new Date(row.executed_at)
      }));
    } catch (_error) {
      console.error('Error getting migration status:', error);
      return [];
    }
  }
}