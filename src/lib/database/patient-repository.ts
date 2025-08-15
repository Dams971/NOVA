import { getPool } from './config';
import { Patient, CreatePatientRequest, UpdatePatientRequest, PatientFilters, MedicalRecord } from '../models/patient';
import { v4 as uuidv4 } from 'uuid';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export class PatientRepository {
  private pool = getPool();

  // Create a new patient
  async createPatient(data: CreatePatientRequest): Promise<Patient> {
    const connection = await this.pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      const patientId = uuidv4();
      const userId = uuidv4();
      
      // Create user record
      await connection.execute(
        `INSERT INTO users (id, email, password_hash, first_name, last_name, phone, role, is_active, email_verified)
         VALUES (?, ?, ?, ?, ?, ?, 'patient', TRUE, FALSE)`,
        [userId, data.email, 'temp_hash', data.firstName, data.lastName, data.phone || null]
      );
      
      // Create patient record
      await connection.execute(
        `INSERT INTO patients (
          id, user_id, cabinet_id, date_of_birth, gender,
          address_street, address_city, address_postal_code, address_country,
          emergency_contact_name, emergency_contact_phone, emergency_contact_relationship,
          preferences, is_active
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE)`,
        [
          patientId,
          userId,
          data.cabinetId,
          data.dateOfBirth,
          data.gender || null,
          data.address?.street || null,
          data.address?.city || null,
          data.address?.postalCode || null,
          data.address?.country || 'France',
          data.emergencyContact?.name || null,
          data.emergencyContact?.phone || null,
          data.emergencyContact?.relationship || null,
          JSON.stringify(data.preferences || {})
        ]
      );
      
      await connection.commit();
      
      // Return the created patient
      return await this.getPatientById(patientId);
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // Get patient by ID
  async getPatientById(id: string): Promise<Patient | null> {
    const [rows] = await this.pool.execute(
      `SELECT 
        p.id, p.date_of_birth, p.gender, p.total_visits, p.last_visit_date,
        p.address_street, p.address_city, p.address_postal_code, p.address_country,
        p.emergency_contact_name, p.emergency_contact_phone, p.emergency_contact_relationship,
        p.preferences, p.is_active, p.created_at, p.updated_at, p.cabinet_id,
        u.first_name, u.last_name, u.email, u.phone
       FROM patients p
       JOIN users u ON p.user_id = u.id
       WHERE p.id = ?`,
      [id]
    );

    const patientRows = rows as RowDataPacket[];
    if (patientRows.length === 0) return null;

    const row = patientRows[0];
    return this.mapRowToPatient(row);
  }

  // Get patients with filters
  async getPatients(filters: PatientFilters): Promise<{ patients: Patient[]; total: number; hasMore: boolean }> {
    let whereClause = 'WHERE p.is_active = TRUE';
    const params: any[] = [];

    if (filters.cabinetId) {
      whereClause += ' AND p.cabinet_id = ?';
      params.push(filters.cabinetId);
    }

    if (filters.search) {
      whereClause += ' AND (u.first_name LIKE ? OR u.last_name LIKE ? OR u.email LIKE ?)';
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    if (filters.isActive !== undefined) {
      whereClause += ' AND p.is_active = ?';
      params.push(filters.isActive);
    }

    if (filters.ageMin || filters.ageMax) {
      if (filters.ageMin) {
        whereClause += ' AND TIMESTAMPDIFF(YEAR, p.date_of_birth, CURDATE()) >= ?';
        params.push(filters.ageMin);
      }
      if (filters.ageMax) {
        whereClause += ' AND TIMESTAMPDIFF(YEAR, p.date_of_birth, CURDATE()) <= ?';
        params.push(filters.ageMax);
      }
    }

    if (filters.lastVisitFrom) {
      whereClause += ' AND p.last_visit_date >= ?';
      params.push(filters.lastVisitFrom);
    }

    if (filters.lastVisitTo) {
      whereClause += ' AND p.last_visit_date <= ?';
      params.push(filters.lastVisitTo);
    }

    // Count total
    const [countRows] = await this.pool.execute(
      `SELECT COUNT(*) as total
       FROM patients p
       JOIN users u ON p.user_id = u.id
       ${whereClause}`,
      params
    );
    const total = (countRows as RowDataPacket[])[0].total;

    // Get patients
    const limit = filters.limit || 20;
    const offset = filters.offset || 0;
    
    const [rows] = await this.pool.execute(
      `SELECT 
        p.id, p.date_of_birth, p.gender, p.total_visits, p.last_visit_date,
        p.address_street, p.address_city, p.address_postal_code, p.address_country,
        p.emergency_contact_name, p.emergency_contact_phone, p.emergency_contact_relationship,
        p.preferences, p.is_active, p.created_at, p.updated_at, p.cabinet_id,
        u.first_name, u.last_name, u.email, u.phone
       FROM patients p
       JOIN users u ON p.user_id = u.id
       ${whereClause}
       ORDER BY u.last_name, u.first_name
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    const patients = (rows as RowDataPacket[]).map(row => this.mapRowToPatient(row));
    const hasMore = offset + limit < total;

    return { patients, total, hasMore };
  }

  // Update patient
  async updatePatient(id: string, data: UpdatePatientRequest): Promise<Patient | null> {
    const connection = await this.pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Update user data
      const userFields: string[] = [];
      const userParams: any[] = [];
      
      if (data.firstName) {
        userFields.push('first_name = ?');
        userParams.push(data.firstName);
      }
      if (data.lastName) {
        userFields.push('last_name = ?');
        userParams.push(data.lastName);
      }
      if (data.email) {
        userFields.push('email = ?');
        userParams.push(data.email);
      }
      if (data.phone) {
        userFields.push('phone = ?');
        userParams.push(data.phone);
      }
      
      if (userFields.length > 0) {
        await connection.execute(
          `UPDATE users u 
           JOIN patients p ON u.id = p.user_id 
           SET ${userFields.join(', ')} 
           WHERE p.id = ?`,
          [...userParams, id]
        );
      }
      
      // Update patient data
      const patientFields: string[] = [];
      const patientParams: any[] = [];
      
      if (data.dateOfBirth) {
        patientFields.push('date_of_birth = ?');
        patientParams.push(data.dateOfBirth);
      }
      if (data.gender) {
        patientFields.push('gender = ?');
        patientParams.push(data.gender);
      }
      if (data.address) {
        patientFields.push('address_street = ?', 'address_city = ?', 'address_postal_code = ?', 'address_country = ?');
        patientParams.push(data.address.street, data.address.city, data.address.postalCode, data.address.country);
      }
      if (data.emergencyContact) {
        patientFields.push('emergency_contact_name = ?', 'emergency_contact_phone = ?', 'emergency_contact_relationship = ?');
        patientParams.push(data.emergencyContact.name, data.emergencyContact.phone, data.emergencyContact.relationship);
      }
      if (data.preferences) {
        patientFields.push('preferences = ?');
        patientParams.push(JSON.stringify(data.preferences));
      }
      
      if (patientFields.length > 0) {
        await connection.execute(
          `UPDATE patients SET ${patientFields.join(', ')} WHERE id = ?`,
          [...patientParams, id]
        );
      }
      
      await connection.commit();
      
      return await this.getPatientById(id);
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // Soft delete patient
  async deletePatient(id: string): Promise<boolean> {
    const [result] = await this.pool.execute(
      'UPDATE patients SET is_active = FALSE WHERE id = ?',
      [id]
    );
    
    return (result as ResultSetHeader).affectedRows > 0;
  }

  // Check if email exists in cabinet
  async emailExistsInCabinet(email: string, cabinetId: string, excludePatientId?: string): Promise<boolean> {
    let query = `
      SELECT COUNT(*) as count
      FROM patients p
      JOIN users u ON p.user_id = u.id
      WHERE u.email = ? AND p.cabinet_id = ? AND p.is_active = TRUE
    `;
    const params = [email, cabinetId];
    
    if (excludePatientId) {
      query += ' AND p.id != ?';
      params.push(excludePatientId);
    }
    
    const [rows] = await this.pool.execute(query, params);
    return (rows as RowDataPacket[])[0].count > 0;
  }

  // Map database row to Patient object
  private mapRowToPatient(row: RowDataPacket): Patient {
    return {
      id: row.id,
      firstName: row.first_name,
      lastName: row.last_name,
      email: row.email,
      phone: row.phone,
      dateOfBirth: new Date(row.date_of_birth),
      gender: row.gender,
      cabinetId: row.cabinet_id,
      address: row.address_street ? {
        street: row.address_street,
        city: row.address_city,
        postalCode: row.address_postal_code,
        country: row.address_country
      } : undefined,
      emergencyContact: row.emergency_contact_name ? {
        name: row.emergency_contact_name,
        phone: row.emergency_contact_phone,
        relationship: row.emergency_contact_relationship
      } : undefined,
      preferences: JSON.parse(row.preferences || '{}'),
      medicalHistory: [], // Will be loaded separately
      totalVisits: row.total_visits,
      lastVisitDate: row.last_visit_date ? new Date(row.last_visit_date) : undefined,
      isActive: row.is_active,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }
}
