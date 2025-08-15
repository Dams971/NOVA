import { z } from 'zod';
import { db } from '@/lib/database/postgresql-connection';
import { Problems } from '@/lib/http/problem';

/**
 * NOVA AI Chatbot - Patient Management Tools
 * Handles patient operations for the AI chatbot with multi-tenant support
 */

// Input validation schemas
const FindByEmailSchema = z.object({
  tenantId: z.string(),
  email: z.string().email()
});

const CreatePatientSchema = z.object({
  tenantId: z.string(),
  email: z.string().email(),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  phone: z.string().optional(),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  gender: z.enum(['M', 'F', 'Other']).optional(),
  preferences: z.record(z.any()).optional(),
  medicalNotes: z.string().optional()
});

const UpdatePatientSchema = z.object({
  tenantId: z.string(),
  patientId: z.string(),
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  phone: z.string().optional(),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  gender: z.enum(['M', 'F', 'Other']).optional(),
  preferences: z.record(z.any()).optional(),
  medicalNotes: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional()
});

const GetPatientHistorySchema = z.object({
  tenantId: z.string(),
  patientId: z.string(),
  limit: z.number().min(1).max(100).default(20)
});

export type FindByEmailParams = z.infer<typeof FindByEmailSchema>;
export type CreatePatientParams = z.infer<typeof CreatePatientSchema>;
export type UpdatePatientParams = z.infer<typeof UpdatePatientSchema>;
export type GetPatientHistoryParams = z.infer<typeof GetPatientHistorySchema>;

export interface PatientInfo {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: 'M' | 'F' | 'Other';
  preferences?: Record<string, any>;
  medicalNotes?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  isActive: boolean;
  totalVisits: number;
  lastVisit?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AppointmentHistory {
  id: string;
  practitionerName: string;
  serviceType: string;
  scheduledAt: string;
  status: string;
  notes?: string;
}

export interface MedicalRecordSummary {
  id: string;
  recordDate: string;
  recordType: string;
  title: string;
  practitionerName: string;
}

export interface PatientHistoryResult {
  patient: PatientInfo;
  recentAppointments: AppointmentHistory[];
  medicalRecords: MedicalRecordSummary[];
}

export class PatientTools {
  private static instance: PatientTools;

  private constructor() {}

  public static getInstance(): PatientTools {
    if (!PatientTools.instance) {
      PatientTools.instance = new PatientTools();
    }
    return PatientTools.instance;
  }

  /**
   * Find patient by email
   */
  async findByEmail(params: FindByEmailParams): Promise<PatientInfo | null> {
    const validated = FindByEmailSchema.parse(params);
    
    const connection = await this.getTenantConnection(validated.tenantId);
    
    try {
      const [rows] = await connection.execute<RowDataPacket[]>(
        `SELECT id, first_name, last_name, email, phone, date_of_birth, gender,
                emergency_contact_name, emergency_contact_phone, medical_notes,
                preferences, is_active, total_visits, last_visit, created_at, updated_at
         FROM patients WHERE email = ? AND is_active = TRUE`,
        [validated.email]
      );

      if (rows.length === 0) {
        return null;
      }

      const patient = rows[0];
      
      return {
        id: patient.id,
        firstName: patient.first_name,
        lastName: patient.last_name,
        email: patient.email,
        phone: patient.phone,
        dateOfBirth: patient.date_of_birth ? patient.date_of_birth.toISOString().split('T')[0] : undefined,
        gender: patient.gender,
        preferences: patient.preferences ? JSON.parse(patient.preferences) : {},
        medicalNotes: patient.medical_notes,
        emergencyContactName: patient.emergency_contact_name,
        emergencyContactPhone: patient.emergency_contact_phone,
        isActive: patient.is_active,
        totalVisits: patient.total_visits,
        lastVisit: patient.last_visit ? patient.last_visit.toISOString() : undefined,
        createdAt: patient.created_at.toISOString(),
        updatedAt: patient.updated_at.toISOString()
      };

    } finally {
      await connection.end();
    }
  }

  /**
   * Create a new patient
   */
  async create(params: CreatePatientParams): Promise<PatientInfo> {
    const validated = CreatePatientSchema.parse(params);
    
    const connection = await this.getTenantConnection(validated.tenantId);
    
    try {
      // Check if patient already exists
      const existingPatient = await this.findByEmail({
        tenantId: validated.tenantId,
        email: validated.email
      });

      if (existingPatient) {
        throw Problems.patientAlreadyExists(validated.email);
      }

      const patientId = this.generateId();
      const preferencesJson = validated.preferences ? JSON.stringify(validated.preferences) : null;

      await connection.execute(
        `INSERT INTO patients (
          id, first_name, last_name, email, phone, date_of_birth, gender,
          medical_notes, preferences, is_active, total_visits
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE, 0)`,
        [
          patientId,
          validated.firstName,
          validated.lastName,
          validated.email,
          validated.phone,
          validated.dateOfBirth,
          validated.gender,
          validated.medicalNotes,
          preferencesJson
        ]
      );

      // Return the created patient
      const createdPatient = await this.findByEmail({
        tenantId: validated.tenantId,
        email: validated.email
      });

      if (!createdPatient) {
        throw Problems.internalServerError('Failed to retrieve created patient');
      }

      return createdPatient;

    } finally {
      await connection.end();
    }
  }

  /**
   * Update patient information
   */
  async update(params: UpdatePatientParams): Promise<PatientInfo> {
    const validated = UpdatePatientSchema.parse(params);
    
    const connection = await this.getTenantConnection(validated.tenantId);
    
    try {
      // Build dynamic update query
      const updateFields: string[] = [];
      const updateValues: any[] = [];

      if (validated.firstName !== undefined) {
        updateFields.push('first_name = ?');
        updateValues.push(validated.firstName);
      }

      if (validated.lastName !== undefined) {
        updateFields.push('last_name = ?');
        updateValues.push(validated.lastName);
      }

      if (validated.phone !== undefined) {
        updateFields.push('phone = ?');
        updateValues.push(validated.phone);
      }

      if (validated.dateOfBirth !== undefined) {
        updateFields.push('date_of_birth = ?');
        updateValues.push(validated.dateOfBirth);
      }

      if (validated.gender !== undefined) {
        updateFields.push('gender = ?');
        updateValues.push(validated.gender);
      }

      if (validated.preferences !== undefined) {
        updateFields.push('preferences = ?');
        updateValues.push(JSON.stringify(validated.preferences));
      }

      if (validated.medicalNotes !== undefined) {
        updateFields.push('medical_notes = ?');
        updateValues.push(validated.medicalNotes);
      }

      if (validated.emergencyContactName !== undefined) {
        updateFields.push('emergency_contact_name = ?');
        updateValues.push(validated.emergencyContactName);
      }

      if (validated.emergencyContactPhone !== undefined) {
        updateFields.push('emergency_contact_phone = ?');
        updateValues.push(validated.emergencyContactPhone);
      }

      if (updateFields.length === 0) {
        throw Problems.validationError([{ field: 'update', message: 'No fields provided for update' }]);
      }

      updateFields.push('updated_at = CURRENT_TIMESTAMP');
      updateValues.push(validated.patientId);

      const [result] = await connection.execute(
        `UPDATE patients SET ${updateFields.join(', ')} WHERE id = ? AND is_active = TRUE`,
        updateValues
      );

      if ((result as any).affectedRows === 0) {
        throw Problems.resourceNotFound('patient', validated.patientId);
      }

      // Return updated patient
      const [patientRows] = await connection.execute<RowDataPacket[]>(
        `SELECT id, first_name, last_name, email, phone, date_of_birth, gender,
                emergency_contact_name, emergency_contact_phone, medical_notes,
                preferences, is_active, total_visits, last_visit, created_at, updated_at
         FROM patients WHERE id = ?`,
        [validated.patientId]
      );

      const patient = patientRows[0];
      
      return {
        id: patient.id,
        firstName: patient.first_name,
        lastName: patient.last_name,
        email: patient.email,
        phone: patient.phone,
        dateOfBirth: patient.date_of_birth ? patient.date_of_birth.toISOString().split('T')[0] : undefined,
        gender: patient.gender,
        preferences: patient.preferences ? JSON.parse(patient.preferences) : {},
        medicalNotes: patient.medical_notes,
        emergencyContactName: patient.emergency_contact_name,
        emergencyContactPhone: patient.emergency_contact_phone,
        isActive: patient.is_active,
        totalVisits: patient.total_visits,
        lastVisit: patient.last_visit ? patient.last_visit.toISOString() : undefined,
        createdAt: patient.created_at.toISOString(),
        updatedAt: patient.updated_at.toISOString()
      };

    } finally {
      await connection.end();
    }
  }

  /**
   * Get patient history (appointments and medical records)
   */
  async getHistory(params: GetPatientHistoryParams): Promise<PatientHistoryResult> {
    const validated = GetPatientHistorySchema.parse(params);
    
    const connection = await this.getTenantConnection(validated.tenantId);
    
    try {
      // Get patient info
      const [patientRows] = await connection.execute<RowDataPacket[]>(
        `SELECT id, first_name, last_name, email, phone, date_of_birth, gender,
                emergency_contact_name, emergency_contact_phone, medical_notes,
                preferences, is_active, total_visits, last_visit, created_at, updated_at
         FROM patients WHERE id = ? AND is_active = TRUE`,
        [validated.patientId]
      );

      if (patientRows.length === 0) {
        throw Problems.resourceNotFound('patient', validated.patientId);
      }

      const patientData = patientRows[0];
      const patient: PatientInfo = {
        id: patientData.id,
        firstName: patientData.first_name,
        lastName: patientData.last_name,
        email: patientData.email,
        phone: patientData.phone,
        dateOfBirth: patientData.date_of_birth ? patientData.date_of_birth.toISOString().split('T')[0] : undefined,
        gender: patientData.gender,
        preferences: patientData.preferences ? JSON.parse(patientData.preferences) : {},
        medicalNotes: patientData.medical_notes,
        emergencyContactName: patientData.emergency_contact_name,
        emergencyContactPhone: patientData.emergency_contact_phone,
        isActive: patientData.is_active,
        totalVisits: patientData.total_visits,
        lastVisit: patientData.last_visit ? patientData.last_visit.toISOString() : undefined,
        createdAt: patientData.created_at.toISOString(),
        updatedAt: patientData.updated_at.toISOString()
      };

      // Get recent appointments
      const [appointmentRows] = await connection.execute<RowDataPacket[]>(
        `SELECT a.id, a.service_type, a.scheduled_at, a.status, a.notes,
                pr.first_name as practitioner_first_name, pr.last_name as practitioner_last_name
         FROM appointments a
         JOIN practitioners pr ON a.practitioner_id = pr.id
         WHERE a.patient_id = ?
         ORDER BY a.scheduled_at DESC
         LIMIT ?`,
        [validated.patientId, validated.limit]
      );

      const recentAppointments: AppointmentHistory[] = appointmentRows.map(row => ({
        id: row.id,
        practitionerName: `${row.practitioner_first_name} ${row.practitioner_last_name}`,
        serviceType: row.service_type,
        scheduledAt: row.scheduled_at.toISOString(),
        status: row.status,
        notes: row.notes
      }));

      // Get medical records
      const [recordRows] = await connection.execute<RowDataPacket[]>(
        `SELECT mr.id, mr.record_date, mr.record_type, mr.title,
                pr.first_name as practitioner_first_name, pr.last_name as practitioner_last_name
         FROM medical_records mr
         LEFT JOIN practitioners pr ON mr.practitioner_id = pr.id
         WHERE mr.patient_id = ? AND mr.is_confidential = FALSE
         ORDER BY mr.record_date DESC
         LIMIT ?`,
        [validated.patientId, validated.limit]
      );

      const medicalRecords: MedicalRecordSummary[] = recordRows.map(row => ({
        id: row.id,
        recordDate: row.record_date.toISOString(),
        recordType: row.record_type,
        title: row.title,
        practitionerName: row.practitioner_first_name ? 
          `${row.practitioner_first_name} ${row.practitioner_last_name}` : 
          'System'
      }));

      return {
        patient,
        recentAppointments,
        medicalRecords
      };

    } finally {
      await connection.end();
    }
  }

  /**
   * Quick patient lookup for chatbot (minimal info)
   */
  async quickLookup(tenantId: string, email: string): Promise<{ id: string; name: string; phone?: string } | null> {
    const connection = await this.getTenantConnection(tenantId);
    
    try {
      const [rows] = await connection.execute<RowDataPacket[]>(
        'SELECT id, first_name, last_name, phone FROM patients WHERE email = ? AND is_active = TRUE',
        [email]
      );

      if (rows.length === 0) {
        return null;
      }

      const patient = rows[0];
      
      return {
        id: patient.id,
        name: `${patient.first_name} ${patient.last_name}`,
        phone: patient.phone
      };

    } finally {
      await connection.end();
    }
  }

  /**
   * Update patient preferences (for chatbot customization)
   */
  async updatePreferences(tenantId: string, patientId: string, preferences: Record<string, any>): Promise<void> {
    const connection = await this.getTenantConnection(tenantId);
    
    try {
      const [result] = await connection.execute(
        'UPDATE patients SET preferences = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND is_active = TRUE',
        [JSON.stringify(preferences), patientId]
      );

      if ((result as any).affectedRows === 0) {
        throw Problems.resourceNotFound('patient', patientId);
      }

    } finally {
      await connection.end();
    }
  }

  /**
   * Get patient communication preferences
   */
  async getCommunicationPreferences(tenantId: string, email: string): Promise<{
    method: 'email' | 'sms' | 'phone';
    reminderEnabled: boolean;
    reminderHours: number[];
    language: string;
  } | null> {
    const connection = await this.getTenantConnection(tenantId);
    
    try {
      const [rows] = await connection.execute<RowDataPacket[]>(
        'SELECT preferences FROM patients WHERE email = ? AND is_active = TRUE',
        [email]
      );

      if (rows.length === 0) {
        return null;
      }

      const preferences = rows[0].preferences ? JSON.parse(rows[0].preferences) : {};
      
      return {
        method: preferences.communicationMethod || 'email',
        reminderEnabled: preferences.reminderEnabled ?? true,
        reminderHours: preferences.reminderHours || [24, 2],
        language: preferences.preferredLanguage || 'fr'
      };

    } finally {
      await connection.end();
    }
  }

  // Private helper methods

  private async getTenantConnection(tenantId: string): Promise<Connection> {
    // Get tenant database name from main database
    const mainConnection = await createConnection();
    
    try {
      const [rows] = await mainConnection.execute<RowDataPacket[]>(
        'SELECT database_name FROM cabinets WHERE id = ?',
        [tenantId]
      );

      if (rows.length === 0) {
        throw Problems.resourceNotFound('cabinet', tenantId);
      }

      const databaseName = rows[0].database_name;
      return await createConnection(databaseName);

    } finally {
      await mainConnection.end();
    }
  }

  private generateId(): string {
    return 'patient_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }
}

export default PatientTools;