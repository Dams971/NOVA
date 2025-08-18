import { v4 as uuidv4 } from 'uuid';
import { Patient, CreatePatientRequest, UpdatePatientRequest, PatientFilters, MedicalRecord } from '../models/patient';
import { db } from './postgresql-connection';

export class PatientRepository {

  // Create a new patient
  async createPatient(data: CreatePatientRequest): Promise<Patient> {
    const client = await db.beginTransaction();
    
    try {
      
      const patientId = uuidv4();
      const userId = uuidv4();
      
      // Create user record
      await client.query(
        `INSERT INTO users (id, email, password_hash, first_name, last_name, phone, role, is_active, email_verified)
         VALUES ($1, $2, $3, $4, $5, $6, 'patient', TRUE, FALSE)`,
        [userId, data.email, 'temp_hash', data.firstName, data.lastName, data.phone || null]
      );
      
      // Create patient record
      await client.query(
        `INSERT INTO patients (
          id, user_id, cabinet_id, date_of_birth, gender,
          address_street, address_city, address_postal_code, address_country,
          emergency_contact_name, emergency_contact_phone, emergency_contact_relationship,
          preferences, is_active
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, TRUE)`,
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
      
      await db.commitTransaction(client);
      
      // Return the created patient
      const createdPatient = await this.getPatientById(patientId);
      if (!createdPatient) {
        throw new Error('Failed to retrieve created patient');
      }
      return createdPatient;
    } catch (_error) {
      await db.rollbackTransaction(client);
      throw _error;
    }
  }

  // Get patient by ID
  async getPatientById(id: string): Promise<Patient | null> {
    const row = await db.queryRow(
      `SELECT 
        p.id, p.date_of_birth, p.gender, p.total_visits, p.last_visit_date,
        p.address_street, p.address_city, p.address_postal_code, p.address_country,
        p.emergency_contact_name, p.emergency_contact_phone, p.emergency_contact_relationship,
        p.preferences, p.is_active, p.created_at, p.updated_at, p.cabinet_id,
        u.first_name, u.last_name, u.email, u.phone
       FROM patients p
       JOIN users u ON p.user_id = u.id
       WHERE p.id = $1`,
      [id]
    );

    if (!row) return null;
    return this.mapRowToPatient(row);
  }

  // Get patients with filters
  async getPatients(filters: PatientFilters): Promise<{ patients: Patient[]; total: number; hasMore: boolean }> {
    let whereClause = 'WHERE p.is_active = TRUE';
    const params: any[] = [];

    if (filters.cabinetId) {
      whereClause += ` AND p.cabinet_id = $${params.length + 1}`;
      params.push(filters.cabinetId);
    }

    if (filters.search) {
      whereClause += ` AND (u.first_name LIKE $${params.length + 1} OR u.last_name LIKE $${params.length + 2} OR u.email LIKE $${params.length + 3})`;
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    if (filters.isActive !== undefined) {
      whereClause += ` AND p.is_active = $${params.length + 1}`;
      params.push(filters.isActive);
    }

    if (filters.ageMin || filters.ageMax) {
      if (filters.ageMin) {
        whereClause += ` AND EXTRACT(YEAR FROM AGE(p.date_of_birth)) >= $${params.length + 1}`;
        params.push(filters.ageMin);
      }
      if (filters.ageMax) {
        whereClause += ` AND EXTRACT(YEAR FROM AGE(p.date_of_birth)) <= $${params.length + 1}`;
        params.push(filters.ageMax);
      }
    }

    if (filters.lastVisitFrom) {
      whereClause += ` AND p.last_visit_date >= $${params.length + 1}`;
      params.push(filters.lastVisitFrom);
    }

    if (filters.lastVisitTo) {
      whereClause += ` AND p.last_visit_date <= $${params.length + 1}`;
      params.push(filters.lastVisitTo);
    }

    // Count total
    const countRow = await db.queryRow(
      `SELECT COUNT(*) as total
       FROM patients p
       JOIN users u ON p.user_id = u.id
       ${whereClause}`,
      params
    );
    const total = parseInt(countRow?.total || '0');

    // Get patients
    const limit = filters.limit || 20;
    const offset = filters.offset || 0;
    
    params.push(limit, offset);
    const rows = await db.queryRows(
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
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    const patients = rows.map(row => this.mapRowToPatient(row));
    const hasMore = offset + limit < total;

    return { patients, total, hasMore };
  }

  // Update patient
  async updatePatient(id: string, data: UpdatePatientRequest): Promise<Patient | null> {
    const client = await db.beginTransaction();
    
    try {
      
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
        const setClause = userFields.map((_, i) => `${userFields[i].split(' = ')[0]} = $${i + 1}`).join(', ');
        await client.query(
          `UPDATE users u 
           SET ${setClause} 
           FROM patients p 
           WHERE u.id = p.user_id AND p.id = $${userParams.length + 1}`,
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
        const setClause = patientFields.map((_, i) => `${patientFields[i].split(' = ')[0]} = $${i + 1}`).join(', ');
        await client.query(
          `UPDATE patients SET ${setClause} WHERE id = $${patientParams.length + 1}`,
          [...patientParams, id]
        );
      }
      
      await db.commitTransaction(client);
      
      return await this.getPatientById(id);
    } catch (_error) {
      await db.rollbackTransaction(client);
      throw _error;
    }
  }

  // Soft delete patient
  async deletePatient(id: string): Promise<boolean> {
    const result = await db.query(
      'UPDATE patients SET is_active = FALSE WHERE id = $1',
      [id]
    );
    
    return result.rowCount > 0;
  }

  // Check if email exists in cabinet
  async emailExistsInCabinet(email: string, cabinetId: string, excludePatientId?: string): Promise<boolean> {
    let query = `
      SELECT COUNT(*) as count
      FROM patients p
      JOIN users u ON p.user_id = u.id
      WHERE u.email = $1 AND p.cabinet_id = $2 AND p.is_active = TRUE
    `;
    const params = [email, cabinetId];
    
    if (excludePatientId) {
      query += ` AND p.id != $${params.length + 1}`;
      params.push(excludePatientId);
    }
    
    const row = await db.queryRow(query, params);
    return parseInt(row?.count || '0') > 0;
  }

  // Map database row to Patient object
  private mapRowToPatient(row: any): Patient {
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
      lastVisit: row.last_visit_date ? new Date(row.last_visit_date) : undefined,
      isActive: row.is_active,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }
}
