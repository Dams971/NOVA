import { v4 as uuidv4 } from 'uuid';
import { db } from '../database/postgresql-connection';
import { PoolClient } from 'pg';
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
  conflicts?: any[];
}

/**
 * Thread-safe, transactional appointment repository
 * Implements race-condition protection for double-booking prevention
 */
export class AppointmentRepository {
  constructor() {
  }

  /**
   * Create appointment with race-condition protection
   * Uses row-level locking to prevent double-booking
   */
  async createAppointmentSafe(
    tenantId: string,
    data: CreateAppointmentRequest,
    userId: string
  ): Promise<BookingResult> {
    try {
      return await db.transaction(async (tx: PoolClient) => {
        // Validate required fields
        if (!data.practitionerId) {
          return {
            success: false,
            error: 'Practitioner ID is required'
          };
        }

        // 1. Lock practitioner to prevent concurrent bookings
        await tx.query(
          'SELECT id FROM practitioners WHERE id = $1 FOR UPDATE',
          [data.practitionerId]
        );

        // 2. Check for conflicts with row-level locking
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
      console.error('Appointment creation error:', _error);
      
      if (_error instanceof Error) {
        // Handle specific database errors
        if (_error.message.includes('duplicate key')) {
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
  async rescheduleAppointment(
    tenantId: string,
    appointmentId: string,
    newStartUtc: Date,
    newEndUtc: Date,
    userId: string
  ): Promise<BookingResult> {
    return await db.transaction(async (tx: PoolClient) => {
      try {
        // 1. Lock and get current appointment
        const appointmentResult = await tx.query(`
          SELECT * FROM appointments 
          WHERE id = $1 
          FOR UPDATE
        `, [appointmentId]);

        const currentAppointment = appointmentResult.rows[0];
        
        if (!currentAppointment) {
          return {
            success: false,
            error: 'Appointment not found'
          };
        }

        if (currentAppointment.status === 'completed' || currentAppointment.status === 'no_show') {
          return {
            success: false,
            error: 'Cannot reschedule completed appointments'
          };
        }

        // 2. Check conflicts for new time slot
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
        await tx.query(`
          UPDATE appointments 
          SET 
            start_utc = $1,
            end_utc = $2,
            scheduled_at = $3 AT TIME ZONE $4,
            duration_minutes = $5,
            updated_at = CURRENT_TIMESTAMP,
            updated_by = $6
          WHERE id = $7
        `, [
          newStartUtc,
          newEndUtc,
          newStartUtc,
          currentAppointment.timezone || 'UTC',
          Math.floor((newEndUtc.getTime() - newStartUtc.getTime()) / (1000 * 60)),
          userId,
          appointmentId
        ]);

        // 4. Reschedule reminders
        await this.rescheduleReminders(tx, appointmentId, newStartUtc);

        // 5. Fetch updated appointment
        const updatedAppointment = await this.getAppointmentById(tenantId, appointmentId);
        
        return {
          success: true,
          appointment: updatedAppointment || undefined
        };
      } catch (_error) {
        console.error('Appointment reschedule error:', _error);
        return {
          success: false,
          error: 'Failed to reschedule appointment'
        };
      }
    });
  }

  /**
   * Check for appointment conflicts (internal transaction version)
   */
  private async checkConflictsInTransaction(
    tx: PoolClient,
    practitionerId: string,
    startUtc: Date,
    endUtc: Date,
    excludeAppointmentId?: string
  ): Promise<ConflictCheckResult> {
    const excludeClause = excludeAppointmentId ? 'AND id != $4' : '';
    const params = excludeAppointmentId 
      ? [practitionerId, startUtc, endUtc, excludeAppointmentId]
      : [practitionerId, startUtc, endUtc];

    const result = await tx.query(`
      SELECT 
        id, 
        start_utc, 
        end_utc, 
        patient_id, 
        status
      FROM appointments
      WHERE practitioner_id = $1 
        AND status NOT IN ('cancelled', 'no_show')
        AND NOT (end_utc <= $2 OR start_utc >= $3)
        ${excludeClause}
    `, params);

    const conflicts = result.rows || [];

    return {
      hasConflict: conflicts.length > 0,
      conflicts: conflicts.map((row: any) => ({
        id: row.id,
        start_utc: row.start_utc.toISOString(),
        end_utc: row.end_utc.toISOString(),
        patient_id: row.patient_id,
        status: row.status
      }))
    };
  }

  /**
   * Insert appointment (internal transaction version)
   */
  private async insertAppointmentInTransaction(
    tx: PoolClient,
    appointmentId: string,
    data: CreateAppointmentRequest,
    userId: string
  ): Promise<Appointment> {
    const durationMinutes = Math.floor(
      (data.endUtc.getTime() - data.startUtc.getTime()) / (1000 * 60)
    );

    await tx.query(`
      INSERT INTO appointments (
        id, patient_id, practitioner_id, service_type, 
        scheduled_at, start_utc, end_utc, timezone,
        duration_minutes, status, notes, 
        created_by, created_at
      ) VALUES ($1, $2, $3, $4, 
        $5 AT TIME ZONE $6, $7, $8, $9,
        $10, 'scheduled', $11, 
        $12, CURRENT_TIMESTAMP)
    `, [
      appointmentId,
      data.patientId,
      data.practitionerId,
      data.serviceType,
      data.startUtc,
      data.timezone || 'UTC',
      data.startUtc,
      data.endUtc,
      data.timezone || 'UTC',
      durationMinutes,
      data.notes || null,
      userId
    ]);

    const result = await tx.query(`
      SELECT * FROM appointments WHERE id = $1
    `, [appointmentId]);

    return this.mapRowToAppointment(result.rows[0]);
  }

  /**
   * Schedule appointment reminders (internal transaction version)
   */
  private async scheduleReminders(
    tx: PoolClient,
    appointmentId: string,
    startUtc: Date
  ): Promise<void> {
    const reminderTimes = [
      { hours: 24, type: 'email' },
      { hours: 2, type: 'sms' },
      { hours: 0.25, type: 'push' } // 15 minutes before
    ];

    for (const reminder of reminderTimes) {
      const sendAt = new Date(startUtc.getTime() - (reminder.hours * 60 * 60 * 1000));
      
      if (sendAt > new Date()) {
        await tx.query(`
          INSERT INTO appointment_reminders (
            id, appointment_id, reminder_type, 
            send_at, status, created_at
          ) VALUES ($1, $2, $3, $4, 'pending', CURRENT_TIMESTAMP)
        `, [
          uuidv4(),
          appointmentId,
          reminder.type,
          sendAt
        ]);
      }
    }
  }

  /**
   * Reschedule appointment reminders (internal transaction version)
   */
  private async rescheduleReminders(
    tx: PoolClient,
    appointmentId: string,
    newStartUtc: Date
  ): Promise<void> {
    // Cancel existing pending reminders
    await tx.query(`
      UPDATE appointment_reminders 
      SET status = 'cancelled' 
      WHERE appointment_id = $1 AND status = 'pending'
    `, [appointmentId]);

    // Schedule new reminders
    await this.scheduleReminders(tx, appointmentId, newStartUtc);
  }

  /**
   * Get appointment by ID
   */
  async getAppointmentById(tenantId: string, appointmentId: string): Promise<Appointment | null> {
    try {
      const result = await db.query(`
        SELECT 
          a.*, 
          p.first_name as patient_first_name,
          p.last_name as patient_last_name,
          pr.first_name as practitioner_first_name,
          pr.last_name as practitioner_last_name
        FROM appointments a
        LEFT JOIN patients pat ON a.patient_id = pat.id
        LEFT JOIN users p ON pat.user_id = p.id
        LEFT JOIN practitioners prac ON a.practitioner_id = prac.id
        LEFT JOIN users pr ON prac.user_id = pr.id
        WHERE a.id = $1
      `, [appointmentId]);

      if (result.rows.length === 0) {
        return null;
      }

      return this.mapRowToAppointment(result.rows[0]);
    } catch (_error) {
      console.error('Get appointment error:', _error);
      return null;
    }
  }

  /**
   * Check appointment conflicts (public version)
   */
  async checkConflicts(
    tenantId: string,
    practitionerId: string,
    startUtc: Date,
    endUtc: Date,
    excludeAppointmentId?: string
  ): Promise<ConflictCheckResult> {
    const excludeClause = excludeAppointmentId ? 'AND id != $4' : '';
    const params = excludeAppointmentId 
      ? [practitionerId, startUtc, endUtc, excludeAppointmentId]
      : [practitionerId, startUtc, endUtc];
    
    try {
      const result = await db.query(`
        SELECT 
          id, 
          start_utc, 
          end_utc, 
          patient_id, 
          status
        FROM appointments
        WHERE practitioner_id = $1 
          AND status NOT IN ('cancelled', 'no_show')
          AND NOT (end_utc <= $2 OR start_utc >= $3)
          ${excludeClause}
      `, params);

      const conflicts = result.rows || [];

      return {
        hasConflict: conflicts.length > 0,
        conflicts: conflicts.map((row: any) => ({
          id: row.id,
          start_utc: row.start_utc.toISOString(),
          end_utc: row.end_utc.toISOString(),
          patient_id: row.patient_id,
          status: row.status
        }))
      };
    } catch (_error) {
      console.error('Check conflicts error:', _error);
      return {
        hasConflict: false,
        conflicts: []
      };
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
    try {
      const result = await db.query(`
        SELECT 
          a.*,
          p.first_name as patient_first_name,
          p.last_name as patient_last_name
        FROM appointments a
        LEFT JOIN patients pat ON a.patient_id = pat.id
        LEFT JOIN users p ON pat.user_id = p.id
        WHERE a.practitioner_id = $1
          AND a.scheduled_at >= $2
          AND a.scheduled_at < $3
          AND a.status NOT IN ('cancelled')
        ORDER BY a.scheduled_at ASC
      `, [practitionerId, startDate, endDate]);

      return result.rows.map((row: any) => this.mapRowToAppointment(row));
    } catch (_error) {
      console.error('Get practitioner schedule error:', _error);
      return [];
    }
  }

  /**
   * Cancel appointment
   */
  async cancelAppointment(
    tenantId: string,
    appointmentId: string,
    reason: string,
    userId: string
  ): Promise<BookingResult> {
    return await db.transaction(async (tx: PoolClient) => {
      try {
        // 1. Check if appointment exists and can be cancelled
        const appointmentResult = await tx.query(`
          SELECT * FROM appointments 
          WHERE id = $1 
          FOR UPDATE
        `, [appointmentId]);

        const appointment = appointmentResult.rows[0];
        
        if (!appointment) {
          return {
            success: false,
            error: 'Appointment not found'
          };
        }

        if (appointment.status === 'completed' || appointment.status === 'cancelled') {
          return {
            success: false,
            error: `Cannot cancel ${appointment.status} appointment`
          };
        }

        // 2. Update appointment status
        await tx.query(`
          UPDATE appointments 
          SET 
            status = 'cancelled',
            cancellation_reason = $1,
            cancelled_at = CURRENT_TIMESTAMP,
            cancelled_by = $2,
            updated_at = CURRENT_TIMESTAMP,
            updated_by = $2
          WHERE id = $3
        `, [reason, userId, appointmentId]);

        // 3. Cancel pending reminders
        await tx.query(`
          UPDATE appointment_reminders 
          SET status = 'cancelled' 
          WHERE appointment_id = $1 AND status = 'pending'
        `, [appointmentId]);

        // 4. Fetch updated appointment
        const updatedAppointment = await this.getAppointmentById(tenantId, appointmentId);
        
        return {
          success: true,
          appointment: updatedAppointment || undefined
        };
      } catch (_error) {
        console.error('Appointment cancellation error:', _error);
        return {
          success: false,
          error: 'Failed to cancel appointment'
        };
      }
    });
  }

  /**
   * Map database row to Appointment model
   */
  private mapRowToAppointment(row: any): Appointment {
    return {
      id: row.id,
      patientId: row.patient_id,
      practitionerId: row.practitioner_id,
      serviceType: row.service_type,
      scheduledAt: row.scheduled_at,
      startUtc: row.start_utc,
      endUtc: row.end_utc,
      timezone: row.timezone,
      durationMinutes: row.duration_minutes,
      status: row.status,
      notes: row.notes,
      patientName: row.patient_first_name && row.patient_last_name 
        ? `${row.patient_first_name} ${row.patient_last_name}` 
        : undefined,
      practitionerName: row.practitioner_first_name && row.practitioner_last_name
        ? `${row.practitioner_first_name} ${row.practitioner_last_name}`
        : undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      createdBy: row.created_by,
      updatedBy: row.updated_by,
      cancellationReason: row.cancellation_reason,
      cancelledAt: row.cancelled_at,
      cancelledBy: row.cancelled_by
    };
  }
}

export default AppointmentRepository;