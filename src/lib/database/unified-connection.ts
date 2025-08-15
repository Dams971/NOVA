/**
 * NOVA Unified Database Connection
 * Provides database operations with automatic fallback to in-memory database
 */

import { memoryDb } from './memory-db';
import { DatabaseConnection } from './postgresql-connection';

export class UnifiedDatabase {
  private static instance: UnifiedDatabase;
  private useInMemory: boolean = true; // Default to in-memory for now
  private pgConnection: DatabaseConnection | null = null;
  
  private constructor() {
    this.initializeConnection();
  }
  
  public static getInstance(): UnifiedDatabase {
    if (!UnifiedDatabase.instance) {
      UnifiedDatabase.instance = new UnifiedDatabase();
    }
    return UnifiedDatabase.instance;
  }
  
  private async initializeConnection() {
    // Try PostgreSQL first
    try {
      if (process.env.DB_HOST && process.env.DB_NAME) {
        this.pgConnection = DatabaseConnection.getInstance();
        const isConnected = await this.pgConnection.testConnection();
        if (isConnected) {
          this.useInMemory = false;
          console.log('✅ Using PostgreSQL database');
          return;
        }
      }
    } catch (_error) {
      console.log('⚠️ PostgreSQL not available, using in-memory database');
    }
    
    // Fallback to in-memory
    this.useInMemory = true;
    console.log('✅ Using in-memory database (development mode)');
  }
  
  // Test connection
  async testConnection(): Promise<boolean> {
    if (this.useInMemory) {
      return await memoryDb.testConnection();
    }
    return await this.pgConnection!.testConnection();
  }
  
  // User operations
  async findUserByEmail(email: string): Promise<any> {
    if (this.useInMemory) {
      // Return full user data including password_hash for auth
      return await memoryDb.findUserByEmail(email);
    }
    return await this.pgConnection!.getUserByEmail(email);
  }
  
  async findUserById(id: string): Promise<any> {
    if (this.useInMemory) {
      // Return full user data including password_hash for auth
      return await memoryDb.findUserById(id);
    }
    return await this.pgConnection!.queryRow('SELECT * FROM users WHERE id = $1', [id]);
  }
  
  async createUser(data: any): Promise<any> {
    if (this.useInMemory) {
      return await memoryDb.createUser(data);
    }
    
    const result = await this.pgConnection!.query(
      `INSERT INTO users (email, password_hash, role, first_name, last_name, phone, is_active, email_verified)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [data.email, data.password_hash, data.role, data.first_name, data.last_name, data.phone, data.is_active, data.email_verified]
    );
    return result.rows[0];
  }
  
  async updateUser(id: string, data: any): Promise<any> {
    if (this.useInMemory) {
      return await memoryDb.updateUser(id, data);
    }
    
    const fields = Object.keys(data).map((key, index) => `${key} = $${index + 2}`).join(', ');
    const values = [id, ...Object.values(data)];
    
    const result = await this.pgConnection!.query(
      `UPDATE users SET ${fields}, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`,
      values
    );
    return result.rows[0];
  }
  
  // Session operations
  async createSession(userId: string, token: string, expiresIn: number = 3600): Promise<any> {
    if (this.useInMemory) {
      return await memoryDb.createSession(userId, token, expiresIn);
    }
    
    const result = await this.pgConnection!.query(
      `INSERT INTO sessions (user_id, token, expires_at)
       VALUES ($1, $2, NOW() + INTERVAL '${expiresIn} seconds')
       RETURNING *`,
      [userId, token]
    );
    return result.rows[0];
  }
  
  async findSessionByToken(token: string): Promise<any> {
    if (this.useInMemory) {
      return await memoryDb.findSessionByToken(token);
    }
    
    return await this.pgConnection!.queryRow(
      'SELECT * FROM sessions WHERE token = $1 AND expires_at > NOW()',
      [token]
    );
  }
  
  async deleteSession(token: string): Promise<boolean> {
    if (this.useInMemory) {
      return await memoryDb.deleteSession(token);
    }
    
    const result = await this.pgConnection!.query(
      'DELETE FROM sessions WHERE token = $1',
      [token]
    );
    return result.rowCount > 0;
  }
  
  // Cabinet operations
  async findCabinetById(id: string): Promise<any> {
    if (this.useInMemory) {
      return await memoryDb.findCabinetById(id);
    }
    return await this.pgConnection!.getCabinet(id);
  }
  
  async getAllCabinets(): Promise<any[]> {
    if (this.useInMemory) {
      return await memoryDb.getAllCabinets();
    }
    
    const result = await this.pgConnection!.queryRows(
      'SELECT * FROM cabinets WHERE is_active = true ORDER BY name'
    );
    return result;
  }
  
  // Patient operations
  async findPatientById(id: string): Promise<any> {
    if (this.useInMemory) {
      return await memoryDb.findPatientById(id);
    }
    
    return await this.pgConnection!.queryRow(
      'SELECT * FROM patients WHERE id = $1',
      [id]
    );
  }
  
  async findPatientsByUserId(userId: string): Promise<any[]> {
    if (this.useInMemory) {
      return await memoryDb.findPatientsByUserId(userId);
    }
    
    return await this.pgConnection!.queryRows(
      'SELECT * FROM patients WHERE user_id = $1',
      [userId]
    );
  }
  
  async findPatientsByCabinet(cabinetId: string): Promise<any[]> {
    if (this.useInMemory) {
      return await memoryDb.findPatientsByCabinet(cabinetId);
    }
    
    return await this.pgConnection!.queryRows(
      `SELECT p.*, u.first_name, u.last_name, u.email, u.phone
       FROM patients p
       JOIN users u ON p.user_id = u.id
       WHERE p.cabinet_id = $1
       ORDER BY u.last_name, u.first_name`,
      [cabinetId]
    );
  }
  
  async createPatient(data: any): Promise<any> {
    if (this.useInMemory) {
      return await memoryDb.createPatient(data);
    }
    
    const result = await this.pgConnection!.query(
      `INSERT INTO patients (user_id, cabinet_id, date_of_birth, gender, medical_notes, allergies)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [data.user_id, data.cabinet_id, data.date_of_birth, data.gender, data.medical_notes, data.allergies]
    );
    return result.rows[0];
  }
  
  async updatePatient(id: string, data: any): Promise<any> {
    if (this.useInMemory) {
      return await memoryDb.updatePatient(id, data);
    }
    
    const fields = Object.keys(data).map((key, index) => `${key} = $${index + 2}`).join(', ');
    const values = [id, ...Object.values(data)];
    
    const result = await this.pgConnection!.query(
      `UPDATE patients SET ${fields}, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`,
      values
    );
    return result.rows[0];
  }
  
  async deletePatient(id: string): Promise<boolean> {
    if (this.useInMemory) {
      return await memoryDb.deletePatient(id);
    }
    
    const result = await this.pgConnection!.query(
      'DELETE FROM patients WHERE id = $1',
      [id]
    );
    return result.rowCount > 0;
  }
  
  // Appointment operations
  async findAppointmentById(id: string): Promise<any> {
    if (this.useInMemory) {
      return await memoryDb.findAppointmentById(id);
    }
    
    return await this.pgConnection!.queryRow(
      'SELECT * FROM appointments WHERE id = $1',
      [id]
    );
  }
  
  async findAppointmentsByCabinet(cabinetId: string, startDate?: Date, endDate?: Date): Promise<any[]> {
    if (this.useInMemory) {
      return await memoryDb.findAppointmentsByCabinet(cabinetId, startDate, endDate);
    }
    
    return await this.pgConnection!.getAppointments(cabinetId, startDate || new Date(), endDate || new Date());
  }
  
  async findAppointmentsByPatient(patientId: string): Promise<any[]> {
    if (this.useInMemory) {
      return await memoryDb.findAppointmentsByPatient(patientId);
    }
    
    return await this.pgConnection!.queryRows(
      `SELECT a.*, s.name as service_name, p.first_name || ' ' || p.last_name as practitioner_name
       FROM appointments a
       LEFT JOIN services s ON a.service_id = s.id
       LEFT JOIN practitioners pr ON a.practitioner_id = pr.id
       LEFT JOIN users p ON pr.user_id = p.id
       WHERE a.patient_id = $1
       ORDER BY a.scheduled_at DESC`,
      [patientId]
    );
  }
  
  async createAppointment(data: any): Promise<any> {
    if (this.useInMemory) {
      return await memoryDb.createAppointment(data);
    }
    
    const result = await this.pgConnection!.query(
      `INSERT INTO appointments (cabinet_id, patient_id, practitioner_id, service_id, scheduled_at, duration, status, title, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [data.cabinet_id, data.patient_id, data.practitioner_id, data.service_id, data.scheduled_at, data.duration, data.status, data.title, data.notes]
    );
    return result.rows[0];
  }
  
  async updateAppointment(id: string, data: any): Promise<any> {
    if (this.useInMemory) {
      return await memoryDb.updateAppointment(id, data);
    }
    
    const fields = Object.keys(data).map((key, index) => `${key} = $${index + 2}`).join(', ');
    const values = [id, ...Object.values(data)];
    
    const result = await this.pgConnection!.query(
      `UPDATE appointments SET ${fields}, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`,
      values
    );
    return result.rows[0];
  }
  
  // Service operations
  async findServiceById(id: string): Promise<any> {
    if (this.useInMemory) {
      return await memoryDb.findServiceById(id);
    }
    
    return await this.pgConnection!.queryRow(
      'SELECT * FROM services WHERE id = $1',
      [id]
    );
  }
  
  async findServicesByCabinet(cabinetId: string): Promise<any[]> {
    if (this.useInMemory) {
      return await memoryDb.findServicesByCabinet(cabinetId);
    }
    
    return await this.pgConnection!.queryRows(
      'SELECT * FROM services WHERE cabinet_id = $1 AND is_active = true ORDER BY name',
      [cabinetId]
    );
  }
  
  // Statistics
  async getStats(): Promise<any> {
    if (this.useInMemory) {
      return await memoryDb.getStats();
    }
    
    const result = await this.pgConnection!.query(`
      SELECT 
        (SELECT COUNT(*) FROM users) as users,
        (SELECT COUNT(*) FROM cabinets) as cabinets,
        (SELECT COUNT(*) FROM patients) as patients,
        (SELECT COUNT(*) FROM appointments) as appointments,
        (SELECT COUNT(*) FROM services) as services
    `);
    return result.rows[0];
  }
}

// Export singleton instance
export const db = UnifiedDatabase.getInstance();
export default db;