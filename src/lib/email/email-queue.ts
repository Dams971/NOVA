import { z } from 'zod';
import { db } from '@/lib/database/postgresql-connection';
import EmailService, { AppointmentEmailParams, ReminderEmailParams } from './email-service';

/**
 * NOVA Email Queue System
 * Manages email scheduling, sending, and retry logic
 */

// Email queue schemas
const EmailQueueJobSchema = z.object({
  id: z.string().optional(),
  type: z.enum(['appointment_confirmation', 'appointment_reminder', 'appointment_cancellation', 'appointment_reschedule']),
  recipientEmail: z.string().email(),
  tenantId: z.string(),
  priority: z.enum(['low', 'normal', 'high']).default('normal'),
  scheduleFor: z.date().optional(),
  maxRetries: z.number().default(3),
  data: z.record(z.any()),
  status: z.enum(['pending', 'processing', 'completed', 'failed', 'cancelled']).default('pending'),
  attempts: z.number().default(0),
  lastError: z.string().optional(),
  createdAt: z.date().default(() => new Date()),
  processedAt: z.date().optional()
});

export type EmailQueueJob = z.infer<typeof EmailQueueJobSchema>;

export interface QueueStats {
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  totalJobs: number;
}

export class EmailQueue {
  private static instance: EmailQueue;
  private emailService: EmailService;
  private processingInterval: NodeJS.Timeout | null = null;
  private isProcessing = false;

  private constructor() {
    this.emailService = EmailService.getInstance();
    this.startProcessing();
  }

  public static getInstance(): EmailQueue {
    if (!EmailQueue.instance) {
      EmailQueue.instance = new EmailQueue();
    }
    return EmailQueue.instance;
  }

  /**
   * Initialize email queue database table (PostgreSQL version)
   */
  static async initializeDatabase(): Promise<void> {
    try {
      // Check if table exists (it should be created by setup-postgresql.sql)
      const tableExists = await db.queryRow(
        "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'email_queue')"
      );
      
      if (tableExists?.exists) {
        console.warn('✅ Email queue table already exists');
      } else {
        console.warn('⚠️ Email queue table not found - run setup-postgresql.sql first');
      }
    } catch (_error) {
      console.error('❌ Failed to check email queue table:', _error);
      throw _error;
    }
  }

  /**
   * Queue appointment confirmation email
   */
  async queueAppointmentConfirmation(
    params: AppointmentEmailParams,
    priority: 'low' | 'normal' | 'high' = 'normal'
  ): Promise<string> {
    const jobId = this.generateId();
    
    const job: EmailQueueJob = {
      id: jobId,
      type: 'appointment_confirmation',
      recipientEmail: params.patientEmail,
      tenantId: params.tenantId,
      priority,
      data: params,
      scheduleFor: undefined, // Send immediately
      status: 'pending',
      attempts: 0,
      maxRetries: 3,
      createdAt: new Date()
    };

    await this.addJobToDatabase(job);
    
    console.warn(`📧 Queued appointment confirmation for ${params.patientEmail}`);
    return jobId;
  }

  /**
   * Queue appointment reminder email
   */
  async queueAppointmentReminder(
    params: ReminderEmailParams,
    scheduleFor: Date,
    priority: 'low' | 'normal' | 'high' = 'normal'
  ): Promise<string> {
    const jobId = this.generateId();
    
    const job: EmailQueueJob = {
      id: jobId,
      type: 'appointment_reminder',
      recipientEmail: params.patientEmail,
      tenantId: params.tenantId,
      priority,
      data: params,
      scheduleFor,
      status: 'pending',
      attempts: 0,
      maxRetries: 3,
      createdAt: new Date()
    };

    await this.addJobToDatabase(job);
    
    console.warn(`⏰ Queued appointment reminder for ${params.patientEmail} at ${scheduleFor.toISOString()}`);
    return jobId;
  }

  /**
   * Queue appointment cancellation email
   */
  async queueAppointmentCancellation(
    params: AppointmentEmailParams,
    priority: 'low' | 'normal' | 'high' = 'normal'
  ): Promise<string> {
    const jobId = this.generateId();
    
    const job: EmailQueueJob = {
      id: jobId,
      type: 'appointment_cancellation',
      recipientEmail: params.patientEmail,
      tenantId: params.tenantId,
      priority,
      data: params,
      scheduleFor: undefined, // Send immediately
      status: 'pending',
      attempts: 0,
      maxRetries: 3,
      createdAt: new Date()
    };

    await this.addJobToDatabase(job);
    
    console.warn(`❌ Queued appointment cancellation for ${params.patientEmail}`);
    return jobId;
  }

  /**
   * Queue appointment reschedule email
   */
  async queueAppointmentReschedule(
    oldParams: AppointmentEmailParams,
    newParams: AppointmentEmailParams,
    priority: 'low' | 'normal' | 'high' = 'normal'
  ): Promise<string> {
    const jobId = this.generateId();
    
    const job: EmailQueueJob = {
      id: jobId,
      type: 'appointment_reschedule',
      recipientEmail: newParams.patientEmail,
      tenantId: newParams.tenantId,
      priority,
      data: { oldParams, newParams },
      scheduleFor: undefined, // Send immediately
      status: 'pending',
      attempts: 0,
      maxRetries: 3,
      createdAt: new Date()
    };

    await this.addJobToDatabase(job);
    
    console.warn(`🔄 Queued appointment reschedule for ${newParams.patientEmail}`);
    return jobId;
  }

  /**
   * Cancel queued email job
   */
  async cancelJob(jobId: string): Promise<boolean> {
    try {
      const result = await db.query(
        'UPDATE email_queue SET status = $1, completed_at = CURRENT_TIMESTAMP WHERE id = $2 AND status IN ($3, $4)',
        ['cancelled', jobId, 'pending', 'processing']
      );

      const success = result.rowCount > 0;
      
      if (success) {
        console.warn(`🚫 Cancelled email job ${jobId}`);
      }
      
      return success;

    } catch (_error) {
      console.error('❌ Failed to cancel email job:', _error);
      throw _error;
    }
  }

  /**
   * Get queue statistics
   */
  async getStats(): Promise<QueueStats> {
    try {
      const rows = await db.queryRows(`
        SELECT 
          status,
          COUNT(*) as count
        FROM email_queue 
        GROUP BY status
      `);

      const stats: QueueStats = {
        pending: 0,
        processing: 0,
        completed: 0,
        failed: 0,
        totalJobs: 0
      };

      rows.forEach(row => {
        stats[row.status as keyof QueueStats] = parseInt(row.count);
        stats.totalJobs += parseInt(row.count);
      });

      return stats;

    } catch (_error) {
      console.error('❌ Failed to get queue stats:', _error);
      throw _error;
    }
  }

  /**
   * Get failed jobs for manual retry
   */
  async getFailedJobs(limit: number = 100): Promise<EmailQueueJob[]> {
    try {
      const rows = await db.queryRows(
        `SELECT * FROM email_queue 
         WHERE status = 'failed' 
         ORDER BY created_at DESC 
         LIMIT $1`,
        [limit]
      );

      return rows.map(row => ({
        id: row.id,
        type: row.job_type,
        recipientEmail: row.recipient_email,
        tenantId: row.cabinet_id,
        priority: row.priority === 1 ? 'high' : row.priority === 5 ? 'normal' : 'low',
        scheduleFor: row.scheduled_for ? new Date(row.scheduled_for) : undefined,
        maxRetries: row.max_attempts,
        data: JSON.parse(row.template_data),
        status: row.status,
        attempts: row.attempts,
        lastError: row.last_error,
        createdAt: new Date(row.created_at),
        processedAt: row.completed_at ? new Date(row.completed_at) : undefined
      }));
    } catch (_error) {
      console.error('Failed to get failed jobs:', _error);
      throw _error;
    }
  }

  /**
   * Retry failed job
   */
  async retryJob(jobId: string): Promise<boolean> {
    try {
      const result = await db.query(
        `UPDATE email_queue 
         SET status = 'pending', last_error = NULL, completed_at = NULL 
         WHERE id = $1 AND status = 'failed'`,
        [jobId]
      );

      const success = result.rowCount > 0;
      
      if (success) {
        console.warn(`🔄 Retrying email job ${jobId}`);
      }
      
      return success;
    } catch (_error) {
      console.error('Failed to retry job:', _error);
      throw _error;
    }
  }

  /**
   * Start background processing
   */
  private startProcessing(): void {
    if (this.processingInterval) {
      return;
    }

    this.processingInterval = setInterval(() => {
      if (!this.isProcessing) {
        this.processQueue();
      }
    }, 10000); // Process every 10 seconds

    console.warn('📧 Email queue processing started');
  }

  /**
   * Stop background processing
   */
  stopProcessing(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
      console.warn('📧 Email queue processing stopped');
    }
  }

  /**
   * Process email queue
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing) return;
    
    this.isProcessing = true;

    try {
      // Get pending jobs ready to be processed
      const jobs = await db.queryRows(`
        SELECT * FROM email_queue 
        WHERE status = 'pending' 
        AND (scheduled_for IS NULL OR scheduled_for <= NOW())
        ORDER BY priority ASC, created_at ASC
        LIMIT 10
      `);

      if (jobs.length === 0) {
        return;
      }

      console.warn(`📧 Processing ${jobs.length} email jobs`);

      for (const jobRow of jobs) {
        await this.processJob(jobRow);
      }

    } catch (_error) {
      console.error('Email queue processing error:', _error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Process individual email job
   */
  private async processJob(jobRow: any): Promise<void> {
    const jobId = jobRow.id;

    try {
      // Mark as processing
      await db.query(
        'UPDATE email_queue SET status = $1, attempts = attempts + 1 WHERE id = $2',
        ['processing', jobId]
      );

      const job: EmailQueueJob = {
        id: jobRow.id,
        type: jobRow.job_type,
        recipientEmail: jobRow.recipient_email,
        tenantId: jobRow.cabinet_id,
        priority: jobRow.priority === 1 ? 'high' : jobRow.priority === 5 ? 'normal' : 'low',
        scheduleFor: jobRow.scheduled_for ? new Date(jobRow.scheduled_for) : undefined,
        maxRetries: jobRow.max_attempts,
        data: JSON.parse(jobRow.template_data),
        status: jobRow.status,
        attempts: jobRow.attempts,
        lastError: jobRow.last_error,
        createdAt: new Date(jobRow.created_at),
        processedAt: jobRow.completed_at ? new Date(jobRow.completed_at) : undefined
      };

      // Process email based on type
      let success = false;

      switch (job.type) {
        case 'appointment_confirmation':
          const confirmResult = await this.emailService.sendAppointmentConfirmation(job.data as AppointmentEmailParams);
          success = confirmResult.success;
          break;

        case 'appointment_reminder':
          const reminderResult = await this.emailService.sendAppointmentReminder(job.data as ReminderEmailParams);
          success = reminderResult.success;
          break;

        case 'appointment_cancellation':
          const cancelResult = await this.emailService.sendAppointmentCancellation(job.data as AppointmentEmailParams);
          success = cancelResult.success;
          break;

        case 'appointment_reschedule':
          const rescheduleResult = await this.emailService.sendAppointmentReschedule(
            job.data.oldParams as AppointmentEmailParams,
            job.data.newParams as AppointmentEmailParams
          );
          success = rescheduleResult.success;
          break;

        default:
          throw new Error(`Unknown email type: ${job.type}`);
      }

      if (success) {
        // Mark as completed
        await db.query(
          'UPDATE email_queue SET status = $1, completed_at = NOW(), last_error = NULL WHERE id = $2',
          ['completed', jobId]
        );
        console.warn(`✅ Email job ${jobId} completed successfully`);
      } else {
        throw new Error('Email sending failed');
      }

    } catch (_error) {
      const errorMessage = _error instanceof Error ? _error.message : 'Unknown error';
      const attempts = jobRow.attempts + 1;

      if (attempts >= jobRow.max_attempts) {
        // Mark as failed
        await db.query(
          'UPDATE email_queue SET status = $1, completed_at = NOW(), last_error = $2 WHERE id = $3',
          ['failed', errorMessage, jobId]
        );
        console.error(`❌ Email job ${jobId} failed after ${attempts} attempts: ${errorMessage}`);
      } else {
        // Mark as pending for retry
        await db.query(
          'UPDATE email_queue SET status = $1, last_error = $2 WHERE id = $3',
          ['pending', errorMessage, jobId]
        );
        console.warn(`⚠️ Email job ${jobId} failed (attempt ${attempts}/${jobRow.max_attempts}): ${errorMessage}`);
      }
    }
  }

  /**
   * Add job to database
   */
  private async addJobToDatabase(job: EmailQueueJob): Promise<void> {
    try {
      await db.query(`
        INSERT INTO email_queue (
          id, job_type, recipient_email, cabinet_id, priority, scheduled_for,
          max_attempts, template_data, status, attempts, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      `, [
        job.id,
        job.type,
        job.recipientEmail,
        job.tenantId,
        job.priority === 'high' ? 1 : job.priority === 'normal' ? 5 : 10, // Convert to numeric priority
        job.scheduleFor || new Date(),
        job.maxRetries || 3,
        JSON.stringify(job.data),
        job.status,
        job.attempts,
        job.createdAt
      ]);
    } catch (_error) {
      console.error('❌ Failed to add job to database:', _error);
      throw _error;
    }
  }

  /**
   * Generate unique job ID
   */
  private generateId(): string {
    // Use UUID format compatible with PostgreSQL
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 9);
    const uuid = `${timestamp}-${random}-${Math.random().toString(36).substr(2, 4)}-${Math.random().toString(36).substr(2, 4)}-${Math.random().toString(36).substr(2, 12)}`;
    return uuid;
  }

  /**
   * Cleanup old completed jobs
   */
  async cleanup(olderThanDays: number = 30): Promise<number> {
    try {
      const result = await db.query(
        `DELETE FROM email_queue WHERE status = $1 AND completed_at < NOW() - INTERVAL '${olderThanDays} days'`,
        ['completed']
      );

      const deletedCount = result.rowCount || 0;
      
      if (deletedCount > 0) {
        console.warn(`🧹 Cleaned up ${deletedCount} old email jobs`);
      }
      
      return deletedCount;
    } catch (_error) {
      console.error('Failed to cleanup old jobs:', _error);
      throw _error;
    }
  }
}

export default EmailQueue;