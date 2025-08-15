/**
 * NOVA RDV v2 - Service de gestion des rendez-vous
 * 
 * Service principal pour la logique métier des rendez-vous
 * - Intégration avec l'assistant IA Anthropic
 * - Gestion des créneaux disponibles
 * - Validation des données
 * - Notifications automatiques
 * - Conformité timezone Africa/Algiers
 */

import { z } from 'zod';
import { format, parseISO, isBefore, isAfter, addHours, startOfDay, endOfDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import { AppointmentAssistant, AppointmentResponse } from '@/lib/llm/appointments';
import { getUnifiedConnection } from '@/lib/database/unified-connection';
import { logger } from '@/lib/logging/logger';

// =============================================
// TYPES ET SCHEMAS VALIDATION
// =============================================

// Schéma validation téléphone algérien
export const phoneAlgerianSchema = z.string()
  .regex(/^\+213[567]\d{8}$/, 'Format téléphone invalide (+213[567]XXXXXXXX requis)');

// Schéma validation patient
export const PatientSchema = z.object({
  firstName: z.string().min(2, 'Prénom requis (2 caractères minimum)').max(100),
  lastName: z.string().min(2, 'Nom requis (2 caractères minimum)').max(100),
  phoneE164: phoneAlgerianSchema,
  email: z.string().email('Email invalide').optional(),
  dateOfBirth: z.string().optional(),
  gender: z.enum(['M', 'F', 'Other']).optional(),
  address: z.object({
    street: z.string().optional(),
    city: z.string().default('El Achour'),
    state: z.string().default('Alger'),
    country: z.string().default('Algérie')
  }).optional(),
  emergencyContact: z.object({
    name: z.string().optional(),
    phone: phoneAlgerianSchema.optional(),
    relationship: z.string().optional()
  }).optional(),
  medicalNotes: z.string().optional(),
  allergies: z.array(z.string()).optional(),
  communicationMethod: z.enum(['sms', 'email', 'phone', 'whatsapp', 'none']).default('sms'),
  reminderEnabled: z.boolean().default(true),
  gdprConsent: z.object({
    dataProcessing: z.object({
      consent: z.boolean(),
      date: z.string().optional()
    }),
    marketing: z.object({
      consent: z.boolean(),
      date: z.string().optional()
    }).optional()
  })
});

// Schéma validation rendez-vous
export const AppointmentSchema = z.object({
  patientId: z.string().uuid('ID patient invalide'),
  practitionerId: z.string().uuid('ID praticien invalide').optional(),
  careType: z.enum([
    'consultation', 'urgence', 'detartrage', 'soin',
    'extraction', 'prothese', 'orthodontie', 'chirurgie'
  ]),
  scheduledAt: z.string().datetime('Date/heure invalide'),
  durationMinutes: z.number().int().min(15).max(180).default(30),
  title: z.string().min(5, 'Titre requis (5 caractères minimum)').max(200),
  description: z.string().optional(),
  reason: z.string().optional(),
  price: z.number().min(0).optional(),
  isUrgent: z.boolean().default(false),
  urgencyLevel: z.number().int().min(1).max(5).optional(),
  notes: z.string().optional(),
  aiSessionId: z.string().optional(),
  originalMessage: z.string().optional()
});

// Schéma validation slot horaire
export const TimeSlotSchema = z.object({
  startISO: z.string().datetime(),
  endISO: z.string().datetime(),
  durationMinutes: z.number().int().min(15).max(180)
});

// Types TypeScript
export type Patient = z.infer<typeof PatientSchema>;
export type Appointment = z.infer<typeof AppointmentSchema>;
export type TimeSlot = z.infer<typeof TimeSlotSchema>;

export interface AvailableSlot {
  startTime: Date;
  endTime: Date;
  duration: number;
  isAvailable: boolean;
  practitionerId?: string;
  careType: string;
}

export interface AppointmentSearchOptions {
  patientId?: string;
  practitionerId?: string;
  careType?: string;
  status?: string[];
  dateFrom?: string;
  dateTo?: string;
  isUrgent?: boolean;
  limit?: number;
  offset?: number;
}

// =============================================
// CLASSE SERVICE PRINCIPALE
// =============================================

export class AppointmentService {
  private aiAssistant: AppointmentAssistant;
  private readonly CLINIC_ADDRESS = "Cité 109, Daboussy El Achour, Alger";
  private readonly TIMEZONE = "Africa/Algiers";

  constructor() {
    this.aiAssistant = new AppointmentAssistant();
  }

  // =============================================
  // GESTION PATIENTS
  // =============================================

  /**
   * Trouve ou crée un patient
   */
  async findOrCreatePatient(patientData: Patient): Promise<{ id: string; isNew: boolean }> {
    const validatedData = PatientSchema.parse(patientData);
    const connection = await getUnifiedConnection();

    try {
      // Recherche patient existant par téléphone
      const existingPatient = await connection.query(`
        SELECT id FROM patients 
        WHERE phone_primary = $1 AND is_active = true
        LIMIT 1
      `, [validatedData.phoneE164]);

      if (existingPatient.rows.length > 0) {
        logger.info(`Patient existant trouvé: ${existingPatient.rows[0].id}`);
        return { id: existingPatient.rows[0].id, isNew: false };
      }

      // Création nouveau patient
      const result = await connection.query(`
        INSERT INTO patients (
          first_name, last_name, phone_primary, email, date_of_birth, gender,
          address_street, address_city, address_state, address_country,
          emergency_contact_name, emergency_contact_phone, emergency_contact_relationship,
          medical_notes, allergies, communication_method, reminder_enabled,
          gdpr_consent, created_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, NOW()
        ) RETURNING id
      `, [
        validatedData.firstName,
        validatedData.lastName,
        validatedData.phoneE164,
        validatedData.email || null,
        validatedData.dateOfBirth || null,
        validatedData.gender || null,
        validatedData.address?.street || null,
        validatedData.address?.city || 'El Achour',
        validatedData.address?.state || 'Alger',
        validatedData.address?.country || 'Algérie',
        validatedData.emergencyContact?.name || null,
        validatedData.emergencyContact?.phone || null,
        validatedData.emergencyContact?.relationship || null,
        validatedData.medicalNotes || null,
        validatedData.allergies || [],
        validatedData.communicationMethod,
        validatedData.reminderEnabled,
        JSON.stringify({
          data_processing: validatedData.gdprConsent.dataProcessing,
          marketing: validatedData.gdprConsent.marketing || { consent: false, date: null }
        })
      ]);

      const patientId = result.rows[0].id;
      logger.info(`Nouveau patient créé: ${patientId}`);

      return { id: patientId, isNew: true };
    } catch (error) {
      logger.error('Erreur création/recherche patient:', error);
      throw new Error('Échec de la gestion du patient');
    }
  }

  /**
   * Récupère les informations d'un patient
   */
  async getPatient(patientId: string): Promise<any> {
    const connection = await getUnifiedConnection();

    const result = await connection.query(`
      SELECT 
        id, first_name, last_name, full_name, phone_primary, email,
        date_of_birth, gender, address_street, address_city, address_state,
        emergency_contact_name, emergency_contact_phone, emergency_contact_relationship,
        medical_notes, allergies, communication_method, reminder_enabled,
        total_visits, total_amount_spent, last_visit_date, next_appointment_date,
        created_at, updated_at
      FROM patients 
      WHERE id = $1 AND is_active = true
    `, [patientId]);

    if (result.rows.length === 0) {
      throw new Error('Patient non trouvé');
    }

    return result.rows[0];
  }

  // =============================================
  // GESTION CRÉNEAUX DISPONIBLES
  // =============================================

  /**
   * Récupère les créneaux disponibles pour une date et type de soin
   */
  async getAvailableSlots(
    date: string,
    careType: string = 'consultation',
    practitionerId?: string
  ): Promise<AvailableSlot[]> {
    const connection = await getUnifiedConnection();

    try {
      const result = await connection.query(`
        SELECT * FROM generate_available_slots($1, $2, $3)
      `, [date, careType, practitionerId || null]);

      return result.rows.map(row => ({
        startTime: new Date(row.start_time),
        endTime: new Date(row.end_time),
        duration: row.duration,
        isAvailable: row.is_available,
        practitionerId: practitionerId,
        careType: careType
      }));
    } catch (error) {
      logger.error('Erreur récupération créneaux:', error);
      throw new Error('Impossible de récupérer les créneaux disponibles');
    }
  }

  /**
   * Vérifie la disponibilité d'un créneau spécifique
   */
  async isSlotAvailable(
    startTime: string,
    durationMinutes: number,
    practitionerId?: string,
    excludeAppointmentId?: string
  ): Promise<boolean> {
    const connection = await getUnifiedConnection();

    try {
      const result = await connection.query(`
        SELECT check_slot_availability($1, $2, $3, $4) as is_available
      `, [startTime, durationMinutes, practitionerId || null, excludeAppointmentId || null]);

      return result.rows[0].is_available;
    } catch (error) {
      logger.error('Erreur vérification disponibilité:', error);
      return false;
    }
  }

  // =============================================
  // GESTION RENDEZ-VOUS
  // =============================================

  /**
   * Crée un nouveau rendez-vous
   */
  async createAppointment(appointmentData: Appointment): Promise<string> {
    const validatedData = AppointmentSchema.parse(appointmentData);
    const connection = await getUnifiedConnection();

    try {
      // Vérifier disponibilité du créneau
      const isAvailable = await this.isSlotAvailable(
        validatedData.scheduledAt,
        validatedData.durationMinutes,
        validatedData.practitionerId
      );

      if (!isAvailable) {
        throw new Error('Créneau non disponible');
      }

      // Récupérer le tarif du service
      let price = validatedData.price;
      if (!price) {
        const serviceResult = await connection.query(`
          SELECT price FROM services 
          WHERE care_type = $1 AND is_active = true 
          LIMIT 1
        `, [validatedData.careType]);

        price = serviceResult.rows[0]?.price || 0;
      }

      // Créer le rendez-vous
      const result = await connection.query(`
        INSERT INTO appointments (
          patient_id, practitioner_id, care_type, title, description, reason,
          scheduled_at, duration_minutes, price, is_urgent, urgency_level,
          notes, ai_session_id, original_message, status, created_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, 'scheduled', NOW()
        ) RETURNING id
      `, [
        validatedData.patientId,
        validatedData.practitionerId || null,
        validatedData.careType,
        validatedData.title,
        validatedData.description || null,
        validatedData.reason || null,
        validatedData.scheduledAt,
        validatedData.durationMinutes,
        price,
        validatedData.isUrgent,
        validatedData.urgencyLevel || null,
        validatedData.notes || null,
        validatedData.aiSessionId || null,
        validatedData.originalMessage || null
      ]);

      const appointmentId = result.rows[0].id;
      logger.info(`Rendez-vous créé: ${appointmentId}`);

      // Programmer notification
      await this.scheduleAppointmentNotification(appointmentId, 'appointment_created');

      return appointmentId;
    } catch (error) {
      logger.error('Erreur création rendez-vous:', error);
      throw error;
    }
  }

  /**
   * Met à jour un rendez-vous existant
   */
  async updateAppointment(appointmentId: string, updates: Partial<Appointment>): Promise<void> {
    const connection = await getUnifiedConnection();

    try {
      // Construire la requête de mise à jour dynamique
      const updateFields = [];
      const values = [];
      let paramIndex = 1;

      Object.entries(updates).forEach(([key, value]) => {
        if (value !== undefined) {
          const dbField = this.mapFieldToDb(key);
          updateFields.push(`${dbField} = $${paramIndex}`);
          values.push(value);
          paramIndex++;
        }
      });

      if (updateFields.length === 0) {
        return;
      }

      updateFields.push(`updated_at = NOW()`);
      values.push(appointmentId);

      const query = `
        UPDATE appointments 
        SET ${updateFields.join(', ')}
        WHERE id = $${paramIndex}
      `;

      await connection.query(query, values);
      logger.info(`Rendez-vous mis à jour: ${appointmentId}`);
    } catch (error) {
      logger.error('Erreur mise à jour rendez-vous:', error);
      throw error;
    }
  }

  /**
   * Annule un rendez-vous
   */
  async cancelAppointment(
    appointmentId: string,
    reason: string,
    cancelledBy?: string
  ): Promise<void> {
    const connection = await getUnifiedConnection();

    try {
      await connection.query(`
        UPDATE appointments 
        SET 
          status = 'cancelled',
          cancelled_reason = $1,
          cancelled_by = $2,
          updated_at = NOW()
        WHERE id = $3 AND status IN ('scheduled', 'confirmed')
      `, [reason, cancelledBy || null, appointmentId]);

      logger.info(`Rendez-vous annulé: ${appointmentId}`);

      // Notifier le patient
      await this.scheduleAppointmentNotification(appointmentId, 'appointment_cancelled');
    } catch (error) {
      logger.error('Erreur annulation rendez-vous:', error);
      throw error;
    }
  }

  /**
   * Reprogramme un rendez-vous
   */
  async rescheduleAppointment(
    appointmentId: string,
    newScheduledAt: string,
    newDurationMinutes?: number
  ): Promise<void> {
    const connection = await getUnifiedConnection();

    try {
      // Récupérer les informations actuelles
      const currentResult = await connection.query(`
        SELECT scheduled_at, duration_minutes, practitioner_id 
        FROM appointments 
        WHERE id = $1
      `, [appointmentId]);

      if (currentResult.rows.length === 0) {
        throw new Error('Rendez-vous non trouvé');
      }

      const current = currentResult.rows[0];
      const duration = newDurationMinutes || current.duration_minutes;

      // Vérifier disponibilité nouveau créneau
      const isAvailable = await this.isSlotAvailable(
        newScheduledAt,
        duration,
        current.practitioner_id,
        appointmentId
      );

      if (!isAvailable) {
        throw new Error('Nouveau créneau non disponible');
      }

      // Mettre à jour
      await connection.query(`
        UPDATE appointments 
        SET 
          original_scheduled_at = CASE 
            WHEN original_scheduled_at IS NULL THEN scheduled_at 
            ELSE original_scheduled_at 
          END,
          scheduled_at = $1,
          duration_minutes = $2,
          rescheduled_count = rescheduled_count + 1,
          status = 'scheduled',
          updated_at = NOW()
        WHERE id = $3
      `, [newScheduledAt, duration, appointmentId]);

      logger.info(`Rendez-vous reprogrammé: ${appointmentId}`);

      // Notifier le patient
      await this.scheduleAppointmentNotification(appointmentId, 'appointment_rescheduled');
    } catch (error) {
      logger.error('Erreur reprogrammation rendez-vous:', error);
      throw error;
    }
  }

  /**
   * Confirme un rendez-vous
   */
  async confirmAppointment(appointmentId: string, confirmedBy: string = 'patient'): Promise<void> {
    const connection = await getUnifiedConnection();

    try {
      await connection.query(`
        UPDATE appointments 
        SET 
          status = 'confirmed',
          confirmed_at = NOW(),
          confirmed_by = $1,
          updated_at = NOW()
        WHERE id = $2 AND status = 'scheduled'
      `, [confirmedBy, appointmentId]);

      logger.info(`Rendez-vous confirmé: ${appointmentId} par ${confirmedBy}`);
    } catch (error) {
      logger.error('Erreur confirmation rendez-vous:', error);
      throw error;
    }
  }

  // =============================================
  // RECHERCHE ET CONSULTATION
  // =============================================

  /**
   * Recherche des rendez-vous avec filtres
   */
  async searchAppointments(options: AppointmentSearchOptions): Promise<any[]> {
    const connection = await getUnifiedConnection();

    const {
      patientId,
      practitionerId,
      careType,
      status = ['scheduled', 'confirmed'],
      dateFrom,
      dateTo,
      isUrgent,
      limit = 50,
      offset = 0
    } = options;

    try {
      let query = `
        SELECT 
          a.id, a.care_type, a.title, a.description, a.reason,
          a.scheduled_at, a.duration_minutes, a.estimated_end_at,
          a.status, a.price, a.is_urgent, a.urgency_level,
          a.notes, a.confirmed_at, a.created_at,
          p.full_name as patient_name, p.phone_primary,
          pr.first_name || ' ' || pr.last_name as practitioner_name
        FROM appointments a
        JOIN patients p ON a.patient_id = p.id
        LEFT JOIN practitioners pr ON a.practitioner_id = pr.id
        WHERE 1=1
      `;

      const conditions = [];
      const values = [];
      let paramIndex = 1;

      if (patientId) {
        conditions.push(`a.patient_id = $${paramIndex}`);
        values.push(patientId);
        paramIndex++;
      }

      if (practitionerId) {
        conditions.push(`a.practitioner_id = $${paramIndex}`);
        values.push(practitionerId);
        paramIndex++;
      }

      if (careType) {
        conditions.push(`a.care_type = $${paramIndex}`);
        values.push(careType);
        paramIndex++;
      }

      if (status.length > 0) {
        conditions.push(`a.status = ANY($${paramIndex})`);
        values.push(status);
        paramIndex++;
      }

      if (dateFrom) {
        conditions.push(`a.scheduled_at >= $${paramIndex}`);
        values.push(dateFrom);
        paramIndex++;
      }

      if (dateTo) {
        conditions.push(`a.scheduled_at <= $${paramIndex}`);
        values.push(dateTo);
        paramIndex++;
      }

      if (isUrgent !== undefined) {
        conditions.push(`a.is_urgent = $${paramIndex}`);
        values.push(isUrgent);
        paramIndex++;
      }

      if (conditions.length > 0) {
        query += ' AND ' + conditions.join(' AND ');
      }

      query += ` ORDER BY a.scheduled_at ASC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      values.push(limit, offset);

      const result = await connection.query(query, values);
      return result.rows;
    } catch (error) {
      logger.error('Erreur recherche rendez-vous:', error);
      throw error;
    }
  }

  /**
   * Récupère un rendez-vous par ID
   */
  async getAppointment(appointmentId: string): Promise<any> {
    const connection = await getUnifiedConnection();

    try {
      const result = await connection.query(`
        SELECT 
          a.*,
          p.full_name as patient_name, p.phone_primary, p.email as patient_email,
          pr.first_name || ' ' || pr.last_name as practitioner_name
        FROM appointments a
        JOIN patients p ON a.patient_id = p.id
        LEFT JOIN practitioners pr ON a.practitioner_id = pr.id
        WHERE a.id = $1
      `, [appointmentId]);

      if (result.rows.length === 0) {
        throw new Error('Rendez-vous non trouvé');
      }

      return result.rows[0];
    } catch (error) {
      logger.error('Erreur récupération rendez-vous:', error);
      throw error;
    }
  }

  // =============================================
  // INTÉGRATION IA ASSISTANT
  // =============================================

  /**
   * Traite une demande de rendez-vous via l'IA
   */
  async processAIAppointmentRequest(
    userMessage: string,
    sessionId?: string
  ): Promise<AppointmentResponse> {
    try {
      logger.info(`Traitement demande IA: ${userMessage.substring(0, 100)}...`);
      
      const response = await this.aiAssistant.processAppointment(userMessage);
      
      // Enregistrer la conversation
      if (sessionId) {
        await this.saveAIConversation(sessionId, userMessage, response);
      }
      
      return response;
    } catch (error) {
      logger.error('Erreur traitement IA:', error);
      
      // Retourner une réponse d'erreur structurée
      return {
        action: "NEED_INFO",
        clinic_address: this.CLINIC_ADDRESS,
        timezone: this.TIMEZONE,
        status: "NEED_INFO",
        missing_fields: ["error_processing"],
        clarification_question: "Une erreur s'est produite. Pouvez-vous reformuler votre demande ?"
      };
    }
  }

  /**
   * Enregistre une conversation IA
   */
  async saveAIConversation(
    sessionId: string,
    userMessage: string,
    aiResponse: AppointmentResponse
  ): Promise<void> {
    const connection = await getUnifiedConnection();

    try {
      await connection.query(`
        INSERT INTO ai_conversations (
          session_id, messages, intent, extracted_entities,
          action_taken, success, model_used, status, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'active', NOW())
        ON CONFLICT (session_id) DO UPDATE SET
          messages = jsonb_insert(
            ai_conversations.messages, 
            '{-1}', 
            jsonb_build_object(
              'user', $2::text,
              'assistant', $4::text,
              'timestamp', NOW()
            )
          ),
          updated_at = NOW()
      `, [
        sessionId,
        JSON.stringify([{ user: userMessage, assistant: aiResponse, timestamp: new Date() }]),
        aiResponse.action,
        JSON.stringify(aiResponse),
        aiResponse.action,
        aiResponse.status === 'CONFIRMED',
        'claude-3-7-sonnet-20250219'
      ]);
    } catch (error) {
      logger.error('Erreur sauvegarde conversation IA:', error);
    }
  }

  // =============================================
  // NOTIFICATIONS
  // =============================================

  /**
   * Programme une notification pour un rendez-vous
   */
  async scheduleAppointmentNotification(
    appointmentId: string,
    notificationType: string
  ): Promise<void> {
    const connection = await getUnifiedConnection();

    try {
      // Récupérer les informations du rendez-vous et du patient
      const result = await connection.query(`
        SELECT 
          a.scheduled_at, a.care_type, a.title,
          p.id as patient_id, p.full_name, p.phone_primary, p.communication_method
        FROM appointments a
        JOIN patients p ON a.patient_id = p.id
        WHERE a.id = $1
      `, [appointmentId]);

      if (result.rows.length === 0) {
        return;
      }

      const { patient_id, scheduled_at, care_type, title, communication_method } = result.rows[0];

      let message = '';
      let scheduledFor = new Date();

      switch (notificationType) {
        case 'appointment_created':
          message = `Votre rendez-vous ${care_type} a été confirmé pour le ${format(new Date(scheduled_at), 'dd/MM/yyyy à HH:mm', { locale: fr })}. Cabinet NOVA, ${this.CLINIC_ADDRESS}.`;
          break;
        
        case 'appointment_reminder':
          message = `Rappel: Rendez-vous demain à ${format(new Date(scheduled_at), 'HH:mm', { locale: fr })} pour ${care_type}. Cabinet NOVA, ${this.CLINIC_ADDRESS}.`;
          scheduledFor = new Date(new Date(scheduled_at).getTime() - 24 * 60 * 60 * 1000);
          break;
        
        case 'appointment_cancelled':
          message = `Votre rendez-vous du ${format(new Date(scheduled_at), 'dd/MM/yyyy à HH:mm', { locale: fr })} a été annulé. Contactez-nous pour reprogrammer.`;
          break;
        
        case 'appointment_rescheduled':
          message = `Votre rendez-vous a été reprogrammé pour le ${format(new Date(scheduled_at), 'dd/MM/yyyy à HH:mm', { locale: fr })}. Cabinet NOVA, ${this.CLINIC_ADDRESS}.`;
          break;
      }

      await connection.query(`
        INSERT INTO notifications (
          patient_id, appointment_id, type, channel, message, scheduled_for, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
      `, [
        patient_id,
        appointmentId,
        notificationType,
        communication_method,
        message,
        scheduledFor
      ]);

    } catch (error) {
      logger.error('Erreur programmation notification:', error);
    }
  }

  // =============================================
  // UTILITAIRES PRIVÉS
  // =============================================

  /**
   * Mappe les champs JS vers les champs base de données
   */
  private mapFieldToDb(field: string): string {
    const mapping: { [key: string]: string } = {
      'scheduledAt': 'scheduled_at',
      'durationMinutes': 'duration_minutes',
      'careType': 'care_type',
      'isUrgent': 'is_urgent',
      'urgencyLevel': 'urgency_level',
      'patientId': 'patient_id',
      'practitionerId': 'practitioner_id',
      'aiSessionId': 'ai_session_id',
      'originalMessage': 'original_message'
    };

    return mapping[field] || field;
  }

  /**
   * Valide les horaires de travail (8h-18h, pas le weekend)
   */
  private validateWorkingHours(dateTime: string): boolean {
    const date = parseISO(dateTime);
    const hour = date.getHours();
    const day = date.getDay();

    // Pas dimanche (0) ou samedi après 13h
    if (day === 0 || (day === 6 && hour >= 13)) {
      return false;
    }

    // Entre 8h et 18h
    return hour >= 8 && hour < 18;
  }
}

// Export d'instance singleton
export const appointmentService = new AppointmentService();