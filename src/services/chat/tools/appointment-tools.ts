import { z } from 'zod';
import { env } from '@/config/env';
import { db } from '@/lib/database/postgresql-connection';
import EmailQueue from '@/lib/email/email-queue';
import { Problems } from '@/lib/http/problem';

/**
 * NOVA AI Chatbot - Appointment Management Tools
 * Handles appointment operations for the AI chatbot with multi-tenant support
 */

// Input validation schemas
const CheckAvailabilitySchema = z.object({
  tenantId: z.string(),
  practitionerId: z.string().optional(),
  serviceType: z.string(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  timeWindow: z.enum(['morning', 'afternoon', 'evening']).optional(),
  timezone: z.string().default('Europe/Paris')
});

const BookAppointmentSchema = z.object({
  tenantId: z.string(),
  patientEmail: z.string().email(),
  practitionerId: z.string(),
  serviceType: z.string(),
  serviceId: z.string().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  timezone: z.string().default('Europe/Paris'),
  duration: z.number().min(15).max(480).optional(),
  notes: z.string().optional(),
  bookedBy: z.string()
});

const RescheduleAppointmentSchema = z.object({
  tenantId: z.string(),
  appointmentId: z.string(),
  newDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  newTime: z.string().regex(/^\d{2}:\d{2}$/),
  timezone: z.string().default('Europe/Paris'),
  rescheduledBy: z.string()
});

const CancelAppointmentSchema = z.object({
  tenantId: z.string(),
  appointmentId: z.string(),
  reason: z.string().optional(),
  cancelledBy: z.string()
});

const FindPatientAppointmentsSchema = z.object({
  tenantId: z.string(),
  patientEmail: z.string().email(),
  status: z.array(z.enum(['scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show'])).optional()
});

export type CheckAvailabilityParams = z.infer<typeof CheckAvailabilitySchema>;
export type BookAppointmentParams = z.infer<typeof BookAppointmentSchema>;
export type RescheduleAppointmentParams = z.infer<typeof RescheduleAppointmentSchema>;
export type CancelAppointmentParams = z.infer<typeof CancelAppointmentSchema>;
export type FindPatientAppointmentsParams = z.infer<typeof FindPatientAppointmentsSchema>;

export interface AvailabilitySlot {
  startTime: string;
  endTime: string;
  time: string; // Human readable
  practitionerId: string;
  practitionerName: string;
  serviceId?: string;
  duration: number;
}

export interface AvailabilityResult {
  date: string;
  slots: AvailabilitySlot[];
  businessHours: {
    open: string;
    close: string;
  };
}

export interface AppointmentResult {
  id: string;
  patientId: string;
  patientEmail: string;
  practitionerId: string;
  practitionerName: string;
  serviceType: string;
  date: string;
  time: string;
  startUtc: string;
  endUtc: string;
  status: string;
  notes?: string;
}

export class AppointmentTools {
  private static instance: AppointmentTools;
  private emailQueue: EmailQueue;

  private constructor() {
    this.emailQueue = EmailQueue.getInstance();
  }

  public static getInstance(): AppointmentTools {
    if (!AppointmentTools.instance) {
      AppointmentTools.instance = new AppointmentTools();
    }
    return AppointmentTools.instance;
  }

  /**
   * Check availability for appointments
   */
  async checkAvailability(params: CheckAvailabilityParams): Promise<AvailabilityResult> {
    const validated = CheckAvailabilitySchema.parse(params);
    
    const connection = await this.getTenantConnection(validated.tenantId);
    
    try {
      // Get business hours for the day
      const dayOfWeek = this.getDayOfWeek(validated.date);
      const businessHours = await this.getBusinessHours(connection, dayOfWeek);
      
      if (!businessHours.open || !businessHours.close) {
        return {
          date: validated.date,
          slots: [],
          businessHours
        };
      }

      // Get practitioners based on service type or specific practitioner
      const practitioners = await this.getAvailablePractitioners(
        connection,
        validated.serviceType,
        validated.practitionerId
      );

      if (practitioners.length === 0) {
        return {
          date: validated.date,
          slots: [],
          businessHours
        };
      }

      // Get existing appointments for the date
      const existingAppointments = await this.getExistingAppointments(
        connection,
        validated.date,
        practitioners.map(p => p.id)
      );

      // Generate available slots
      const availableSlots: AvailabilitySlot[] = [];
      
      for (const practitioner of practitioners) {
        const practitionerSlots = await this.generatePractitionerSlots(
          practitioner,
          validated.date,
          businessHours,
          existingAppointments.filter(apt => apt.practitioner_id === practitioner.id),
          validated.timeWindow,
          validated.serviceType
        );
        
        availableSlots.push(...practitionerSlots);
      }

      // Sort by time
      availableSlots.sort((a, b) => a.startTime.localeCompare(b.startTime));

      return {
        date: validated.date,
        slots: availableSlots,
        businessHours
      };

    } finally {
      await connection.end();
    }
  }

  /**
   * Book an appointment
   */
  async bookAppointment(params: BookAppointmentParams): Promise<AppointmentResult> {
    const validated = BookAppointmentSchema.parse(params);
    
    const connection = await this.getTenantConnection(validated.tenantId);
    
    try {
      await connection.beginTransaction();

      // 1. Find or create patient
      const patient = await this.findOrCreatePatient(connection, validated.patientEmail, validated.tenantId);

      // 2. Get service details
      const service = await this.getServiceByType(connection, validated.serviceType);
      const duration = validated.duration || service?.duration_minutes || 30;

      // 3. Calculate UTC times
      const { startUtc, endUtc, localDateTime } = this.calculateAppointmentTimes(
        validated.date,
        validated.time,
        duration,
        validated.timezone
      );

      // 4. Check for conflicts using SELECT FOR UPDATE
      await connection.execute(
        'SELECT id FROM practitioners WHERE id = ? FOR UPDATE',
        [validated.practitionerId]
      );

      const conflictQuery = `
        SELECT id, start_utc, end_utc 
        FROM appointments 
        WHERE practitioner_id = ? 
        AND status IN ('scheduled', 'confirmed', 'in_progress')
        AND (
          (start_utc <= ? AND end_utc > ?) OR
          (start_utc < ? AND end_utc >= ?) OR
          (start_utc >= ? AND start_utc < ?)
        )
        FOR UPDATE
      `;

      const [conflicts] = await connection.execute<RowDataPacket[]>(conflictQuery, [
        validated.practitionerId,
        startUtc, startUtc,  // New appointment starts during existing
        endUtc, endUtc,      // New appointment ends during existing  
        startUtc, endUtc     // New appointment completely contains existing
      ]);

      if (conflicts.length > 0) {
        await connection.rollback();
        throw Problems.appointmentConflict(
          conflicts.map(c => ({
            id: c.id,
            startTime: c.start_utc,
            endTime: c.end_utc
          }))
        );
      }

      // 5. Create the appointment
      const appointmentId = this.generateId();
      
      const insertQuery = `
        INSERT INTO appointments (
          id, patient_id, practitioner_id, service_id, service_type,
          scheduled_at, start_utc, end_utc, timezone, duration_minutes,
          status, notes, created_by, version
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'scheduled', ?, ?, 1)
      `;

      await connection.execute(insertQuery, [
        appointmentId,
        patient.id,
        validated.practitionerId,
        service?.id,
        validated.serviceType,
        localDateTime,
        startUtc,
        endUtc,
        validated.timezone,
        duration,
        validated.notes,
        validated.bookedBy
      ]);

      // 6. Get practitioner name for response
      const [practitionerRows] = await connection.execute<RowDataPacket[]>(
        'SELECT first_name, last_name FROM practitioners WHERE id = ?',
        [validated.practitionerId]
      );

      const practitioner = practitionerRows[0];
      
      await connection.commit();

      const result = {
        id: appointmentId,
        patientId: patient.id,
        patientEmail: validated.patientEmail,
        practitionerId: validated.practitionerId,
        practitionerName: `${practitioner.first_name} ${practitioner.last_name}`,
        serviceType: validated.serviceType,
        date: validated.date,
        time: validated.time,
        startUtc,
        endUtc,
        status: 'scheduled',
        notes: validated.notes
      };

      // Queue confirmation email
      try {
        await this.queueConfirmationEmail(validated.tenantId, result);
        await this.queueReminderEmails(validated.tenantId, result);
      } catch (emailError) {
        console.error('Failed to queue appointment emails:', emailError);
        // Don't fail the booking if email fails
      }

      return result;

    } catch (_error) {
      await connection.rollback();
      throw error;
    } finally {
      await connection.end();
    }
  }

  /**
   * Reschedule an appointment
   */
  async rescheduleAppointment(params: RescheduleAppointmentParams): Promise<AppointmentResult> {
    const validated = RescheduleAppointmentSchema.parse(params);
    
    const connection = await this.getTenantConnection(validated.tenantId);
    
    try {
      await connection.beginTransaction();

      // 1. Get existing appointment
      const [appointmentRows] = await connection.execute<RowDataPacket[]>(
        `SELECT a.*, p.first_name as patient_first_name, p.last_name as patient_last_name, p.email,
                pr.first_name as practitioner_first_name, pr.last_name as practitioner_last_name
         FROM appointments a
         JOIN patients p ON a.patient_id = p.id
         JOIN practitioners pr ON a.practitioner_id = pr.id
         WHERE a.id = ? FOR UPDATE`,
        [validated.appointmentId]
      );

      if (appointmentRows.length === 0) {
        await connection.rollback();
        throw Problems.resourceNotFound('appointment', validated.appointmentId);
      }

      const appointment = appointmentRows[0];

      // 2. Calculate new UTC times
      const { startUtc, endUtc, localDateTime } = this.calculateAppointmentTimes(
        validated.newDate,
        validated.newTime,
        appointment.duration_minutes,
        validated.timezone
      );

      // 3. Check for conflicts (excluding current appointment)
      const conflictQuery = `
        SELECT id, start_utc, end_utc 
        FROM appointments 
        WHERE practitioner_id = ? 
        AND id != ?
        AND status IN ('scheduled', 'confirmed', 'in_progress')
        AND (
          (start_utc <= ? AND end_utc > ?) OR
          (start_utc < ? AND end_utc >= ?) OR
          (start_utc >= ? AND start_utc < ?)
        )
      `;

      const [conflicts] = await connection.execute<RowDataPacket[]>(conflictQuery, [
        appointment.practitioner_id,
        validated.appointmentId,
        startUtc, startUtc,
        endUtc, endUtc,
        startUtc, endUtc
      ]);

      if (conflicts.length > 0) {
        await connection.rollback();
        throw Problems.appointmentConflict(
          conflicts.map(c => ({
            id: c.id,
            startTime: c.start_utc,
            endTime: c.end_utc
          }))
        );
      }

      // 4. Update appointment
      await connection.execute(
        `UPDATE appointments 
         SET scheduled_at = ?, start_utc = ?, end_utc = ?, timezone = ?,
             updated_by = ?, version = version + 1
         WHERE id = ?`,
        [localDateTime, startUtc, endUtc, validated.timezone, validated.rescheduledBy, validated.appointmentId]
      );

      await connection.commit();

      return {
        id: validated.appointmentId,
        patientId: appointment.patient_id,
        patientEmail: appointment.email,
        practitionerId: appointment.practitioner_id,
        practitionerName: `${appointment.practitioner_first_name} ${appointment.practitioner_last_name}`,
        serviceType: appointment.service_type,
        date: validated.newDate,
        time: validated.newTime,
        startUtc,
        endUtc,
        status: appointment.status
      };

    } catch (_error) {
      await connection.rollback();
      throw error;
    } finally {
      await connection.end();
    }
  }

  /**
   * Cancel an appointment
   */
  async cancelAppointment(params: CancelAppointmentParams): Promise<void> {
    const validated = CancelAppointmentSchema.parse(params);
    
    const connection = await this.getTenantConnection(validated.tenantId);
    
    try {
      // Get appointment details before cancelling
      const [appointmentRows] = await connection.execute<RowDataPacket[]>(
        `SELECT a.*, p.email as patient_email, pr.first_name as practitioner_first_name, pr.last_name as practitioner_last_name
         FROM appointments a
         JOIN patients p ON a.patient_id = p.id
         JOIN practitioners pr ON a.practitioner_id = pr.id
         WHERE a.id = ? AND a.status IN ('scheduled', 'confirmed')`,
        [validated.appointmentId]
      );

      if (appointmentRows.length === 0) {
        throw Problems.resourceNotFound('appointment', validated.appointmentId);
      }

      const appointment = appointmentRows[0];

      const [result] = await connection.execute(
        `UPDATE appointments 
         SET status = 'cancelled', updated_by = ?, version = version + 1
         WHERE id = ? AND status IN ('scheduled', 'confirmed')`,
        [validated.cancelledBy, validated.appointmentId]
      );

      if ((result as any).affectedRows === 0) {
        throw Problems.resourceNotFound('appointment', validated.appointmentId);
      }

      // Queue cancellation email
      try {
        const appointmentResult: AppointmentResult = {
          id: appointment.id,
          patientId: appointment.patient_id,
          patientEmail: appointment.patient_email,
          practitionerId: appointment.practitioner_id,
          practitionerName: `${appointment.practitioner_first_name} ${appointment.practitioner_last_name}`,
          serviceType: appointment.service_type,
          date: appointment.scheduled_at.toISOString().split('T')[0],
          time: appointment.scheduled_at.toTimeString().slice(0, 5),
          startUtc: appointment.start_utc,
          endUtc: appointment.end_utc,
          status: 'cancelled'
        };

        await this.queueCancellationEmail(validated.tenantId, appointmentResult);
      } catch (emailError) {
        console.error('Failed to queue cancellation email:', emailError);
        // Don't fail the cancellation if email fails
      }

    } finally {
      await connection.end();
    }
  }

  /**
   * Find patient appointments
   */
  async findPatientAppointments(params: FindPatientAppointmentsParams): Promise<AppointmentResult[]> {
    const validated = FindPatientAppointmentsSchema.parse(params);
    
    const connection = await this.getTenantConnection(validated.tenantId);
    
    try {
      const statusFilter = validated.status ? `AND a.status IN (${validated.status.map(() => '?').join(',')})` : '';
      
      const [rows] = await connection.execute<RowDataPacket[]>(
        `SELECT a.*, pr.first_name as practitioner_first_name, pr.last_name as practitioner_last_name
         FROM appointments a
         JOIN patients p ON a.patient_id = p.id
         JOIN practitioners pr ON a.practitioner_id = pr.id
         WHERE p.email = ? ${statusFilter}
         ORDER BY a.scheduled_at ASC`,
        validated.status ? [validated.patientEmail, ...validated.status] : [validated.patientEmail]
      );

      return rows.map(row => ({
        id: row.id,
        patientId: row.patient_id,
        patientEmail: validated.patientEmail,
        practitionerId: row.practitioner_id,
        practitionerName: `${row.practitioner_first_name} ${row.practitioner_last_name}`,
        serviceType: row.service_type,
        date: row.scheduled_at.toISOString().split('T')[0],
        time: row.scheduled_at.toTimeString().slice(0, 5),
        startUtc: row.start_utc,
        endUtc: row.end_utc,
        status: row.status,
        notes: row.notes
      }));

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

  private getDayOfWeek(date: string): string {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return days[new Date(date).getDay()];
  }

  private async getBusinessHours(connection: Connection, dayOfWeek: string): Promise<{ open: string; close: string }> {
    // This would typically come from cabinet configuration
    // For now, return default hours
    const defaultHours = {
      monday: { open: '08:00', close: '18:00' },
      tuesday: { open: '08:00', close: '18:00' },
      wednesday: { open: '08:00', close: '18:00' },
      thursday: { open: '08:00', close: '18:00' },
      friday: { open: '08:00', close: '18:00' },
      saturday: { open: '09:00', close: '13:00' },
      sunday: { open: '', close: '' }
    };

    return defaultHours[dayOfWeek as keyof typeof defaultHours] || { open: '', close: '' };
  }

  private async getAvailablePractitioners(
    connection: Connection,
    serviceType: string,
    practitionerId?: string
  ): Promise<Array<{ id: string; name: string; specialization: string; scheduleConfig: any }>> {
    let query = `
      SELECT id, first_name, last_name, specialization, schedule_config
      FROM practitioners 
      WHERE is_active = TRUE
    `;
    
    const params: any[] = [];
    
    if (practitionerId) {
      query += ' AND id = ?';
      params.push(practitionerId);
    } else {
      // Filter by service type/specialization if needed
      // For now, return all active practitioners
    }

    const [rows] = await connection.execute<RowDataPacket[]>(query, params);
    
    return rows.map(row => ({
      id: row.id,
      name: `${row.first_name} ${row.last_name}`,
      specialization: row.specialization,
      scheduleConfig: row.schedule_config ? JSON.parse(row.schedule_config) : {}
    }));
  }

  private async getExistingAppointments(
    connection: Connection,
    date: string,
    practitionerIds: string[]
  ): Promise<Array<{ practitioner_id: string; start_utc: string; end_utc: string }>> {
    if (practitionerIds.length === 0) return [];
    
    const placeholders = practitionerIds.map(() => '?').join(',');
    const startOfDay = `${date} 00:00:00`;
    const endOfDay = `${date} 23:59:59`;

    const [rows] = await connection.execute<RowDataPacket[]>(
      `SELECT practitioner_id, start_utc, end_utc
       FROM appointments
       WHERE practitioner_id IN (${placeholders})
       AND status IN ('scheduled', 'confirmed', 'in_progress')
       AND start_utc >= ? AND start_utc <= ?`,
      [...practitionerIds, startOfDay, endOfDay]
    );

    return rows.map(row => ({
      practitioner_id: row.practitioner_id,
      start_utc: row.start_utc,
      end_utc: row.end_utc
    }));
  }

  private async generatePractitionerSlots(
    practitioner: any,
    date: string,
    businessHours: { open: string; close: string },
    existingAppointments: Array<{ start_utc: string; end_utc: string }>,
    timeWindow?: 'morning' | 'afternoon' | 'evening',
    serviceType?: string
  ): Promise<AvailabilitySlot[]> {
    const slots: AvailabilitySlot[] = [];
    const slotDuration = 30; // Default 30 minutes
    
    // Parse business hours
    const [openHour, openMinute] = businessHours.open.split(':').map(Number);
    const [closeHour, closeMinute] = businessHours.close.split(':').map(Number);
    
    let startHour = openHour;
    let endHour = closeHour;
    
    // Apply time window filter
    if (timeWindow === 'morning') {
      endHour = Math.min(endHour, 12);
    } else if (timeWindow === 'afternoon') {
      startHour = Math.max(startHour, 12);
      endHour = Math.min(endHour, 18);
    } else if (timeWindow === 'evening') {
      startHour = Math.max(startHour, 18);
    }
    
    // Generate time slots
    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += slotDuration) {
        if (hour === closeHour && minute >= closeMinute) break;
        
        const slotTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        const slotStart = new Date(`${date}T${slotTime}:00`);
        const slotEnd = new Date(slotStart.getTime() + slotDuration * 60000);
        
        // Check if slot conflicts with existing appointments
        const hasConflict = existingAppointments.some(apt => {
          const aptStart = new Date(apt.start_utc);
          const aptEnd = new Date(apt.end_utc);
          return slotStart < aptEnd && slotEnd > aptStart;
        });
        
        if (!hasConflict) {
          slots.push({
            startTime: slotTime,
            endTime: `${slotEnd.getHours().toString().padStart(2, '0')}:${slotEnd.getMinutes().toString().padStart(2, '0')}`,
            time: slotTime,
            practitionerId: practitioner.id,
            practitionerName: practitioner.name,
            duration: slotDuration
          });
        }
      }
    }
    
    return slots;
  }

  private async findOrCreatePatient(connection: Connection, email: string, tenantId: string): Promise<{ id: string; email: string }> {
    // Try to find existing patient
    const [rows] = await connection.execute<RowDataPacket[]>(
      'SELECT id, email FROM patients WHERE email = ?',
      [email]
    );

    if (rows.length > 0) {
      return { id: rows[0].id, email: rows[0].email };
    }

    // Create new patient
    const patientId = this.generateId();
    await connection.execute(
      'INSERT INTO patients (id, email, first_name, last_name, is_active) VALUES (?, ?, ?, ?, TRUE)',
      [patientId, email, 'Patient', 'Name'] // Minimal data for chatbot booking
    );

    return { id: patientId, email };
  }

  private async getServiceByType(connection: Connection, serviceType: string): Promise<{ id: string; duration_minutes: number } | null> {
    const [rows] = await connection.execute<RowDataPacket[]>(
      'SELECT id, duration_minutes FROM services WHERE name LIKE ? OR category LIKE ? LIMIT 1',
      [`%${serviceType}%`, `%${serviceType}%`]
    );

    return rows.length > 0 ? { id: rows[0].id, duration_minutes: rows[0].duration_minutes } : null;
  }

  private calculateAppointmentTimes(date: string, time: string, duration: number, timezone: string) {
    const localDateTime = `${date} ${time}:00`;
    const startLocal = new Date(`${date}T${time}:00`);
    const endLocal = new Date(startLocal.getTime() + duration * 60000);
    
    // For simplicity, assume Europe/Paris timezone (UTC+1/UTC+2)
    // In production, use a proper timezone library
    const utcOffset = 1; // Hours
    const startUtc = new Date(startLocal.getTime() - utcOffset * 60 * 60000).toISOString().slice(0, 19).replace('T', ' ');
    const endUtc = new Date(endLocal.getTime() - utcOffset * 60 * 60000).toISOString().slice(0, 19).replace('T', ' ');
    
    return { startUtc, endUtc, localDateTime };
  }

  private generateId(): string {
    return 'appt_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  // Email notification methods

  /**
   * Queue appointment confirmation email
   */
  private async queueConfirmationEmail(tenantId: string, appointment: AppointmentResult): Promise<void> {
    // Get cabinet info for email
    const cabinetInfo = await this.getCabinetInfo(tenantId);
    
    const emailParams = {
      tenantId,
      appointmentId: appointment.id,
      patientEmail: appointment.patientEmail,
      patientName: await this.getPatientName(tenantId, appointment.patientId),
      practitionerName: appointment.practitionerName,
      appointmentDate: appointment.date,
      appointmentTime: appointment.time,
      serviceType: appointment.serviceType,
      cabinetName: cabinetInfo.name,
      cabinetAddress: cabinetInfo.address,
      cabinetPhone: cabinetInfo.phone,
      notes: appointment.notes
    };

    await this.emailQueue.queueAppointmentConfirmation(emailParams, 'high');
  }

  /**
   * Queue appointment reminder emails (24h and 2h before)
   */
  private async queueReminderEmails(tenantId: string, appointment: AppointmentResult): Promise<void> {
    const appointmentDateTime = new Date(`${appointment.date}T${appointment.time}:00`);
    const now = new Date();
    
    // Queue 24h reminder
    const reminder24h = new Date(appointmentDateTime.getTime() - 24 * 60 * 60 * 1000);
    if (reminder24h > now) {
      const cabinetInfo = await this.getCabinetInfo(tenantId);
      
      const reminderParams = {
        tenantId,
        appointmentId: appointment.id,
        patientEmail: appointment.patientEmail,
        patientName: await this.getPatientName(tenantId, appointment.patientId),
        practitionerName: appointment.practitionerName,
        appointmentDate: appointment.date,
        appointmentTime: appointment.time,
        serviceType: appointment.serviceType,
        cabinetName: cabinetInfo.name,
        cabinetPhone: cabinetInfo.phone,
        hoursUntilAppointment: 24
      };

      await this.emailQueue.queueAppointmentReminder(reminderParams, reminder24h, 'normal');
    }

    // Queue 2h reminder
    const reminder2h = new Date(appointmentDateTime.getTime() - 2 * 60 * 60 * 1000);
    if (reminder2h > now) {
      const cabinetInfo = await this.getCabinetInfo(tenantId);
      
      const reminderParams = {
        tenantId,
        appointmentId: appointment.id,
        patientEmail: appointment.patientEmail,
        patientName: await this.getPatientName(tenantId, appointment.patientId),
        practitionerName: appointment.practitionerName,
        appointmentDate: appointment.date,
        appointmentTime: appointment.time,
        serviceType: appointment.serviceType,
        cabinetName: cabinetInfo.name,
        cabinetPhone: cabinetInfo.phone,
        hoursUntilAppointment: 2
      };

      await this.emailQueue.queueAppointmentReminder(reminderParams, reminder2h, 'normal');
    }
  }

  /**
   * Queue appointment cancellation email
   */
  private async queueCancellationEmail(tenantId: string, appointment: AppointmentResult): Promise<void> {
    const cabinetInfo = await this.getCabinetInfo(tenantId);
    
    const emailParams = {
      tenantId,
      appointmentId: appointment.id,
      patientEmail: appointment.patientEmail,
      patientName: await this.getPatientName(tenantId, appointment.patientId),
      practitionerName: appointment.practitionerName,
      appointmentDate: appointment.date,
      appointmentTime: appointment.time,
      serviceType: appointment.serviceType,
      cabinetName: cabinetInfo.name,
      cabinetAddress: cabinetInfo.address,
      cabinetPhone: cabinetInfo.phone
    };

    await this.emailQueue.queueAppointmentCancellation(emailParams, 'normal');
  }

  /**
   * Get cabinet information for emails
   */
  private async getCabinetInfo(tenantId: string): Promise<{
    name: string;
    address?: string;
    phone?: string;
  }> {
    const mainConnection = await createConnection();
    
    try {
      const [rows] = await mainConnection.execute<RowDataPacket[]>(
        'SELECT name, address_street, address_city, phone FROM cabinets WHERE id = ?',
        [tenantId]
      );

      if (rows.length === 0) {
        return { name: 'Cabinet Dentaire' };
      }

      const cabinet = rows[0];
      return {
        name: cabinet.name,
        address: cabinet.address_street && cabinet.address_city 
          ? `${cabinet.address_street}, ${cabinet.address_city}` 
          : undefined,
        phone: cabinet.phone
      };

    } finally {
      await mainConnection.end();
    }
  }

  /**
   * Get patient name for emails
   */
  private async getPatientName(tenantId: string, patientId: string): Promise<string> {
    const connection = await this.getTenantConnection(tenantId);
    
    try {
      const [rows] = await connection.execute<RowDataPacket[]>(
        'SELECT first_name, last_name FROM patients WHERE id = ?',
        [patientId]
      );

      if (rows.length === 0) {
        return 'Patient';
      }

      const patient = rows[0];
      return `${patient.first_name} ${patient.last_name}`;

    } finally {
      await connection.end();
    }
  }
}

export default AppointmentTools;