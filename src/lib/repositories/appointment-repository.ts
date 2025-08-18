import { Connection } from 'mysql2/promise';
import { v4 as uuidv4 } from 'uuid';
import DatabaseManager from '../database/connection';
import { Appointment, AppointmentStatus, CreateAppointmentRequest } from '../models/appointment';

export interface ConflictCheckResult {
  hasConflict: boolean;
  conflicts: Array<{
    id: string;
    start_utc: string;
    end_utc: string;
    patient_id: string;
    status: AppointmentStatus;
  }>;
}

export interface BookingResult {
  success: boolean;
  appointment?: Appointment;
  error?: string;
  conflicts?: ConflictCheckResult['conflicts'];
}

/**
 * Thread-safe, transactional appointment repository
 * Implements race-condition protection for double-booking prevention
 */
export class AppointmentRepository {
  private dbManager: DatabaseManager;

  constructor() {
    this.dbManager = DatabaseManager.getInstance();
  }

  /**
   * Create appointment with race-condition protection
   * Uses database-level locking and conflict detection
   */
  async createAppointmentSafe(
    tenantId: string,
    data: CreateAppointmentRequest,
    userId: string
  ): Promise<BookingResult> {
    const connection = await this.dbManager.getCabinetConnection(tenantId);
    
    try {
      return await connection.transaction(async (tx) => {
        // 1. Lock practitioner to prevent concurrent bookings
        await tx.execute(
          'SELECT id FROM practitioners WHERE id = ? FOR UPDATE',
          [data.practitionerId]
        );

        // 2. Check for conflicts with existing appointments
        const conflictResult = await this.checkConflictsInTransaction(
          tx,
          data.practitionerId,
          data.startUtc,
          data.endUtc
        );

        if (conflictResult.hasConflict) {
          return {
            success: false,
            error: 'Appointment slot is no longer available',
            conflicts: conflictResult.conflicts
          };
        }

        // 3. Create the appointment
        const appointmentId = uuidv4();
        const appointment = await this.insertAppointmentInTransaction(
          tx,
          appointmentId,
          data,
          userId
        );

        // 4. Schedule automatic reminders
        await this.scheduleReminders(tx, appointmentId, data.startUtc);

        return {
          success: true,
          appointment
        };
      });
    } catch (_error) {
      console.error('Appointment creation error:', error);
      
      if (error instanceof Error) {
        // Handle specific MySQL errors
        if (error.message.includes('Duplicate entry')) {
          return {
            success: false,
            error: 'Appointment slot conflict detected'
          };
        }
      }

      return {
        success: false,
        error: 'Failed to create appointment'
      };
    }
  }

  /**
   * Reschedule appointment with conflict checking
   */
  async rescheduleAppointmentSafe(
    tenantId: string,
    appointmentId: string,
    newStartUtc: Date,
    newEndUtc: Date,
    userId: string
  ): Promise<BookingResult> {
    const connection = await this.dbManager.getCabinetConnection(tenantId);
    
    try {
      return await connection.transaction(async (tx) => {
        // 1. Get current appointment and lock practitioner
        const [appointmentRows] = await tx.execute(`
          SELECT a.*, p.id as practitioner_id
          FROM appointments a
          JOIN practitioners p ON a.practitioner_id = p.id
          WHERE a.id = ?
          FOR UPDATE
        `, [appointmentId]);

        if (!Array.isArray(appointmentRows) || appointmentRows.length === 0) {
          return {
            success: false,
            error: 'Appointment not found'
          };
        }

        const currentAppointment = appointmentRows[0] as any;

        // 2. Check for conflicts (excluding current appointment)
        const conflictResult = await this.checkConflictsInTransaction(
          tx,
          currentAppointment.practitioner_id,
          newStartUtc,
          newEndUtc,
          appointmentId
        );

        if (conflictResult.hasConflict) {
          return {
            success: false,
            error: 'New time slot is not available',
            conflicts: conflictResult.conflicts
          };
        }

        // 3. Update appointment
        await tx.execute(`
          UPDATE appointments 
          SET 
            start_utc = ?, 
            end_utc = ?, 
            scheduled_at = CONVERT_TZ(?, 'UTC', timezone),
            duration_minutes = TIMESTAMPDIFF(MINUTE, ?, ?),
            updated_by = ?,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `, [
          newStartUtc,
          newEndUtc,
          newStartUtc,
          newStartUtc,
          newEndUtc,
          userId,
          appointmentId
        ]);

        // 4. Cancel old reminders and schedule new ones
        await this.rescheduleReminders(tx, appointmentId, newStartUtc);

        // 5. Fetch updated appointment
        const updatedAppointment = await this.getAppointmentById(tenantId, appointmentId);
        
        return {
          success: true,
          appointment: updatedAppointment || undefined
        };
      });
    } catch (_error) {
      console.error('Appointment reschedule error:', error);
      return {
        success: false,
        error: 'Failed to reschedule appointment'
      };
    }
  }

  /**
   * Check for appointment conflicts within a transaction
   */
  private async checkConflictsInTransaction(
    tx: Connection,
    practitionerId: string,
    startUtc: Date,
    endUtc: Date,
    excludeAppointmentId?: string
  ): Promise<ConflictCheckResult> {
    const excludeClause = excludeAppointmentId ? 'AND id != ?' : '';
    const params = excludeAppointmentId 
      ? [practitionerId, startUtc, endUtc, excludeAppointmentId]
      : [practitionerId, startUtc, endUtc];

    const [rows] = await tx.execute(`
      SELECT 
        id, 
        start_utc, 
        end_utc, 
        patient_id, 
        status
      FROM appointments
      WHERE practitioner_id = ? 
        AND status NOT IN ('cancelled', 'no_show')
        AND NOT (end_utc <= ? OR start_utc >= ?)
        ${excludeClause}
    `, params);

    const conflicts = Array.isArray(rows) ? rows : [];

    return {
      hasConflict: conflicts.length > 0,
      conflicts: conflicts.map((row: any) => ({
        id: row.id,
        start_utc: row.start_utc,
        end_utc: row.end_utc,
        patient_id: row.patient_id,
        status: row.status
      }))
    };
  }

  /**
   * Insert appointment within transaction
   */
  private async insertAppointmentInTransaction(
    tx: Connection,
    appointmentId: string,
    data: CreateAppointmentRequest,
    userId: string
  ): Promise<Appointment> {
    const durationMinutes = Math.floor(
      (data.endUtc.getTime() - data.startUtc.getTime()) / (1000 * 60)
    );

    await tx.execute(`
      INSERT INTO appointments (
        id, patient_id, practitioner_id, service_type, 
        scheduled_at, start_utc, end_utc, timezone,
        duration_minutes, status, notes, 
        created_by, created_at
      ) VALUES (?, ?, ?, ?, 
        CONVERT_TZ(?, 'UTC', ?), ?, ?, ?,
        ?, 'scheduled', ?, 
        ?, CURRENT_TIMESTAMP)
    `, [
      appointmentId,
      data.patientId,
      data.practitionerId,
      data.serviceType,
      data.startUtc,
      data.timezone || 'Europe/Paris',
      data.startUtc,
      data.endUtc,
      data.timezone || 'Europe/Paris',
      durationMinutes,
      data.notes || null,
      userId
    ]);

    // Return the created appointment
    const [rows] = await tx.execute(`
      SELECT 
        a.*,
        CONVERT_TZ(a.start_utc, 'UTC', a.timezone) as local_start,
        CONVERT_TZ(a.end_utc, 'UTC', a.timezone) as local_end
      FROM appointments a
      WHERE a.id = ?
    `, [appointmentId]);

    const appointmentRow = (rows as any[])[0];
    
    return this.mapRowToAppointment(appointmentRow);
  }

  /**
   * Schedule automatic reminders for appointment
   */
  private async scheduleReminders(
    tx: Connection,
    appointmentId: string,
    startUtc: Date
  ): Promise<void> {
    const reminderTimes = [
      { hours: 24, type: 'email' },
      { hours: 2, type: 'sms' },
      { hours: 0.25, type: 'push' } // 15 minutes before
    ];

    for (const reminder of reminderTimes) {
      const reminderTime = new Date(startUtc.getTime() - (reminder.hours * 60 * 60 * 1000));
      
      // Only schedule future reminders
      if (reminderTime > new Date()) {
        await tx.execute(`
          INSERT INTO appointment_reminders (
            id, appointment_id, reminder_type, scheduled_for, status
          ) VALUES (?, ?, ?, ?, 'pending')
        `, [
          uuidv4(),
          appointmentId,
          reminder.type,
          reminderTime
        ]);
      }
    }
  }

  /**
   * Reschedule reminders for appointment
   */
  private async rescheduleReminders(
    tx: Connection,
    appointmentId: string,
    newStartUtc: Date
  ): Promise<void> {
    // Cancel existing pending reminders
    await tx.execute(`
      UPDATE appointment_reminders 
      SET status = 'cancelled' 
      WHERE appointment_id = ? AND status = 'pending'
    `, [appointmentId]);

    // Schedule new reminders
    await this.scheduleReminders(tx, appointmentId, newStartUtc);
  }

  /**
   * Get appointment by ID
   */
  async getAppointmentById(tenantId: string, appointmentId: string): Promise<Appointment | null> {
    const connection = await this.dbManager.getCabinetConnection(tenantId);
    
    try {
      const [rows] = await connection.execute(`
        SELECT 
          a.*,
          CONVERT_TZ(a.start_utc, 'UTC', a.timezone) as local_start,
          CONVERT_TZ(a.end_utc, 'UTC', a.timezone) as local_end,
          p.first_name as patient_first_name,
          p.last_name as patient_last_name,
          pr.first_name as practitioner_first_name,
          pr.last_name as practitioner_last_name
        FROM appointments a
        LEFT JOIN patients p ON a.patient_id = p.id
        LEFT JOIN practitioners pr ON a.practitioner_id = pr.id
        WHERE a.id = ?
      `, [appointmentId]);

      if (!Array.isArray(rows) || rows.length === 0) {
        return null;
      }

      return this.mapRowToAppointment(rows[0] as any);
    } finally {
      connection.release();
    }
  }

  /**
   * Check availability for a time slot
   */
  async checkAvailability(
    tenantId: string,
    practitionerId: string,
    startUtc: Date,
    endUtc: Date,
    excludeAppointmentId?: string
  ): Promise<ConflictCheckResult> {
    const connection = await this.dbManager.getCabinetConnection(tenantId);
    
    try {
      return await this.checkConflictsInTransaction(
        connection,
        practitionerId,
        startUtc,
        endUtc,
        excludeAppointmentId
      );
    } finally {
      connection.release();
    }
  }

  /**
   * Get practitioner's schedule for a date range
   */
  async getPractitionerSchedule(
    tenantId: string,
    practitionerId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Appointment[]> {
    const connection = await this.dbManager.getCabinetConnection(tenantId);
    
    try {
      const [rows] = await connection.execute(`
        SELECT 
          a.*,
          CONVERT_TZ(a.start_utc, 'UTC', a.timezone) as local_start,
          CONVERT_TZ(a.end_utc, 'UTC', a.timezone) as local_end,
          p.first_name as patient_first_name,
          p.last_name as patient_last_name
        FROM appointments a
        LEFT JOIN patients p ON a.patient_id = p.id
        WHERE a.practitioner_id = ?
          AND a.start_utc >= ?
          AND a.start_utc < ?
          AND a.status NOT IN ('cancelled', 'no_show')
        ORDER BY a.start_utc
      `, [practitionerId, startDate, endDate]);

      if (!Array.isArray(rows)) {
        return [];
      }

      return rows.map(row => this.mapRowToAppointment(row as any));
    } finally {
      connection.release();
    }
  }

  /**
   * Map database row to Appointment object
   */
  private mapRowToAppointment(row: any): Appointment {
    return {
      id: row.id,
      patientId: row.patient_id,
      practitionerId: row.practitioner_id,
      serviceType: row.service_type,
      scheduledAt: row.scheduled_at,
      duration: row.duration_minutes,
      status: row.status as AppointmentStatus,
      notes: row.notes,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      // Additional fields from joins
      patientName: row.patient_first_name && row.patient_last_name 
        ? `${row.patient_first_name} ${row.patient_last_name}` 
        : undefined,
      practitionerName: row.practitioner_first_name && row.practitioner_last_name
        ? `${row.practitioner_first_name} ${row.practitioner_last_name}`
        : undefined,
      // UTC and local times
      startUtc: row.start_utc,
      endUtc: row.end_utc,
      timezone: row.timezone,
      localStart: row.local_start,
      localEnd: row.local_end
    };
  }

  /**
   * Cancel appointment
   */
  async cancelAppointment(
    tenantId: string,
    appointmentId: string,
    reason: string,
    userId: string
  ): Promise<boolean> {
    const connection = await this.dbManager.getCabinetConnection(tenantId);
    
    try {
      return await connection.transaction(async (tx) => {
        // Update appointment status
        const [result] = await tx.execute(`
          UPDATE appointments 
          SET 
            status = 'cancelled',
            notes = CONCAT(IFNULL(notes, ''), '\nCancellation reason: ', ?),
            updated_by = ?,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ? AND status NOT IN ('completed', 'cancelled')
        `, [reason, userId, appointmentId]);

        const updateResult = result as any;
        
        if (updateResult.affectedRows === 0) {
          return false;
        }

        // Cancel pending reminders
        await tx.execute(`
          UPDATE appointment_reminders 
          SET status = 'cancelled' 
          WHERE appointment_id = ? AND status = 'pending'
        `, [appointmentId]);

        return true;
      });
    } catch (_error) {
      console.error('Appointment cancellation error:', error);
      return false;
    }
  }
}