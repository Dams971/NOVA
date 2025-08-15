import { createConnection, Connection, ConnectionOptions } from 'mysql2/promise';

interface DatabaseConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database?: string;
  ssl?: boolean;
}

class DatabaseManager {
  private static instance: DatabaseManager;
  private connections: Map<string, Connection> = new Map();
  private config: DatabaseConfig;

  private constructor() {
    this.config = {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      ssl: process.env.DB_SSL === 'true'
    };
  }

  public static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  /**
   * Get connection to main platform database
   */
  public async getMainConnection(): Promise<Connection> {
    const key = 'main';
    
    if (!this.connections.has(key)) {
      const connection = await createConnection({
        ...this.config,
        database: 'nova_main'
      });
      this.connections.set(key, connection);
    }

    return this.connections.get(key)!;
  }

  /**
   * Get connection to cabinet-specific database
   */
  public async getCabinetConnection(cabinetId: string): Promise<Connection> {
    const key = `cabinet_${cabinetId}`;
    
    if (!this.connections.has(key)) {
      const connection = await createConnection({
        ...this.config,
        database: `nova_cabinet_${cabinetId}`
      });
      this.connections.set(key, connection);
    }

    return this.connections.get(key)!;
  }

  /**
   * Create a new cabinet database
   */
  public async createCabinetDatabase(cabinetId: string): Promise<void> {
    const mainConnection = await this.getMainConnection();
    
    try {
      // Create cabinet database
      await mainConnection.execute(`CREATE DATABASE IF NOT EXISTS nova_cabinet_${cabinetId}`);
      
      // Get connection to new cabinet database
      const cabinetConnection = await this.getCabinetConnection(cabinetId);
      
      // Create cabinet-specific tables
      const cabinetSchema = `
        CREATE TABLE patients (
          id VARCHAR(36) PRIMARY KEY,
          first_name VARCHAR(100) NOT NULL,
          last_name VARCHAR(100) NOT NULL,
          email VARCHAR(255),
          phone VARCHAR(50),
          date_of_birth DATE,
          gender ENUM('M', 'F', 'Other'),
          address_street VARCHAR(255),
          address_city VARCHAR(100),
          address_postal_code VARCHAR(20),
          emergency_contact_name VARCHAR(200),
          emergency_contact_phone VARCHAR(50),
          medical_notes TEXT,
          preferences JSON,
          is_active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_name (last_name, first_name),
          INDEX idx_email (email),
          INDEX idx_phone (phone)
        );

        CREATE TABLE appointments (
          id VARCHAR(36) PRIMARY KEY,
          patient_id VARCHAR(36) NOT NULL,
          practitioner_id VARCHAR(36),
          service_type VARCHAR(100) NOT NULL,
          scheduled_at DATETIME NOT NULL,
          duration_minutes INT DEFAULT 30,
          status ENUM('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show') DEFAULT 'scheduled',
          notes TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
          INDEX idx_scheduled_at (scheduled_at),
          INDEX idx_patient (patient_id),
          INDEX idx_status (status)
        );

        CREATE TABLE practitioners (
          id VARCHAR(36) PRIMARY KEY,
          user_id VARCHAR(36),
          first_name VARCHAR(100) NOT NULL,
          last_name VARCHAR(100) NOT NULL,
          specialization VARCHAR(100),
          license_number VARCHAR(100),
          phone VARCHAR(50),
          email VARCHAR(255),
          schedule_config JSON,
          is_active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_user_id (user_id),
          INDEX idx_active (is_active)
        );

        CREATE TABLE services (
          id VARCHAR(36) PRIMARY KEY,
          name VARCHAR(200) NOT NULL,
          description TEXT,
          duration_minutes INT DEFAULT 30,
          price DECIMAL(10,2),
          is_active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        );

        CREATE TABLE ai_conversations (
          id VARCHAR(36) PRIMARY KEY,
          session_id VARCHAR(100) NOT NULL,
          patient_phone VARCHAR(50),
          patient_email VARCHAR(255),
          conversation_data JSON,
          intent VARCHAR(100),
          status ENUM('active', 'completed', 'abandoned') DEFAULT 'active',
          appointment_id VARCHAR(36),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE SET NULL,
          INDEX idx_session (session_id),
          INDEX idx_status (status)
        );
      `;

      // Execute schema creation
      const statements = cabinetSchema.split(';').filter(stmt => stmt.trim());
      for (const statement of statements) {
        if (statement.trim()) {
          await cabinetConnection.execute(statement);
        }
      }

    } catch (_error) {
      console.error(`Error creating cabinet database for ${cabinetId}:`, error);
      throw error;
    }
  }

  /**
   * Close all connections
   */
  public async closeAllConnections(): Promise<void> {
    for (const [key, connection] of this.connections) {
      try {
        await connection.end();
      } catch (_error) {
        console.error(`Error closing connection ${key}:`, error);
      }
    }
    this.connections.clear();
  }

  /**
   * Test database connectivity
   */
  public async testConnection(): Promise<boolean> {
    try {
      const connection = await this.getMainConnection();
      await connection.ping();
      return true;
    } catch (_error) {
      console.error('Database connection test failed:', error);
      return false;
    }
  }
}

export default DatabaseManager;
export { DatabaseConfig };