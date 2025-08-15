import { EventEmitter } from 'events';
import nodemailer from 'nodemailer';
import { env } from '@/config/env';

export interface EmailTemplate {
  subject: string;
  html: string;
  text?: string;
}

export interface EmailJob {
  id: string;
  to: string;
  from?: string;
  subject: string;
  html: string;
  text?: string;
  priority?: 'high' | 'normal' | 'low';
  attempts?: number;
  maxAttempts?: number;
  createdAt: Date;
  scheduledFor?: Date;
  metadata?: Record<string, any>;
}

export class EmailQueue extends EventEmitter {
  private static instance: EmailQueue;
  private queue: EmailJob[] = [];
  private processing = false;
  private transporter: nodemailer.Transporter | null = null;
  private processInterval: NodeJS.Timeout | null = null;

  private constructor() {
    super();
    this.initializeTransporter();
    this.startProcessing();
  }

  public static getInstance(): EmailQueue {
    if (!EmailQueue.instance) {
      EmailQueue.instance = new EmailQueue();
    }
    return EmailQueue.instance;
  }

  private initializeTransporter(): void {
    // In development, use Mailhog or console logging
    if (env.NODE_ENV === 'development') {
      this.transporter = nodemailer.createTransporter({
        host: env.SMTP_HOST,
        port: env.SMTP_PORT,
        secure: false,
        ignoreTLS: true
      });
    } else {
      // Production configuration
      this.transporter = nodemailer.createTransporter({
        host: env.SMTP_HOST,
        port: env.SMTP_PORT,
        secure: env.SMTP_SECURE,
        auth: env.SMTP_USER ? {
          user: env.SMTP_USER,
          pass: env.SMTP_PASSWORD
        } : undefined
      });
    }
  }

  private startProcessing(): void {
    // Process queue every 5 seconds
    this.processInterval = setInterval(() => {
      this.processQueue();
    }, 5000);
  }

  public async addToQueue(email: Omit<EmailJob, 'id' | 'createdAt' | 'attempts'>): Promise<string> {
    const job: EmailJob = {
      ...email,
      id: `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      attempts: 0,
      maxAttempts: email.maxAttempts || 3,
      from: email.from || env.SMTP_FROM
    };

    // Add to queue based on priority
    if (job.priority === 'high') {
      this.queue.unshift(job);
    } else {
      this.queue.push(job);
    }

    this.emit('job:added', job);
    
    // Trigger immediate processing for high priority emails
    if (job.priority === 'high') {
      setImmediate(() => this.processQueue());
    }

    return job.id;
  }

  private async processQueue(): Promise<void> {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;

    try {
      // Get next job that is ready to be sent
      const now = new Date();
      const jobIndex = this.queue.findIndex(
        job => !job.scheduledFor || job.scheduledFor <= now
      );

      if (jobIndex === -1) {
        this.processing = false;
        return;
      }

      const job = this.queue[jobIndex];
      this.queue.splice(jobIndex, 1);

      await this.sendEmail(job);
    } catch (_error) {
      console.error('Queue processing error:', error);
    } finally {
      this.processing = false;
    }
  }

  private async sendEmail(job: EmailJob): Promise<void> {
    try {
      if (!this.transporter) {
        throw new Error('Email transporter not initialized');
      }

      // In development, just log the email
      if (env.NODE_ENV === 'development') {
        console.log('📧 Email queued:', {
          to: job.to,
          subject: job.subject,
          from: job.from
        });
        this.emit('job:completed', job);
        return;
      }

      const info = await this.transporter.sendMail({
        from: job.from,
        to: job.to,
        subject: job.subject,
        html: job.html,
        text: job.text
      });

      this.emit('job:completed', { job, info });
      console.log('Email sent:', info.messageId);
    } catch (error) {
      job.attempts = (job.attempts || 0) + 1;
      
      if (job.attempts < (job.maxAttempts || 3)) {
        // Retry with exponential backoff
        const delay = Math.pow(2, job.attempts) * 1000;
        job.scheduledFor = new Date(Date.now() + delay);
        this.queue.push(job);
        this.emit('job:retry', { job, error });
      } else {
        this.emit('job:failed', { job, error });
        console.error('Email failed after max attempts:', error);
      }
    }
  }

  public getQueueStatus(): {
    pending: number;
    processing: boolean;
    jobs: EmailJob[];
  } {
    return {
      pending: this.queue.length,
      processing: this.processing,
      jobs: [...this.queue]
    };
  }

  public clearQueue(): void {
    this.queue = [];
    this.emit('queue:cleared');
  }

  public stop(): void {
    if (this.processInterval) {
      clearInterval(this.processInterval);
      this.processInterval = null;
    }
  }

  // Email templates
  public static templates = {
    appointmentConfirmation: (data: {
      patientName: string;
      appointmentDate: string;
      appointmentTime: string;
      serviceName: string;
      cabinetName: string;
    }): EmailTemplate => ({
      subject: `Confirmation de votre rendez-vous - ${data.cabinetName}`,
      html: `
        <h2>Confirmation de rendez-vous</h2>
        <p>Bonjour ${data.patientName},</p>
        <p>Votre rendez-vous a été confirmé avec les détails suivants :</p>
        <ul>
          <li><strong>Date :</strong> ${data.appointmentDate}</li>
          <li><strong>Heure :</strong> ${data.appointmentTime}</li>
          <li><strong>Service :</strong> ${data.serviceName}</li>
          <li><strong>Cabinet :</strong> ${data.cabinetName}</li>
        </ul>
        <p>Cordialement,<br>${data.cabinetName}</p>
      `,
      text: `Confirmation de rendez-vous\n\nBonjour ${data.patientName},\n\nVotre rendez-vous a été confirmé.\nDate: ${data.appointmentDate}\nHeure: ${data.appointmentTime}\nService: ${data.serviceName}\n\nCordialement,\n${data.cabinetName}`
    }),

    appointmentReminder: (data: {
      patientName: string;
      appointmentDate: string;
      appointmentTime: string;
      serviceName: string;
      cabinetName: string;
    }): EmailTemplate => ({
      subject: `Rappel de rendez-vous - ${data.cabinetName}`,
      html: `
        <h2>Rappel de rendez-vous</h2>
        <p>Bonjour ${data.patientName},</p>
        <p>Nous vous rappelons votre rendez-vous prévu :</p>
        <ul>
          <li><strong>Date :</strong> ${data.appointmentDate}</li>
          <li><strong>Heure :</strong> ${data.appointmentTime}</li>
          <li><strong>Service :</strong> ${data.serviceName}</li>
        </ul>
        <p>Cordialement,<br>${data.cabinetName}</p>
      `,
      text: `Rappel de rendez-vous\n\nBonjour ${data.patientName},\n\nRappel de votre rendez-vous:\nDate: ${data.appointmentDate}\nHeure: ${data.appointmentTime}\nService: ${data.serviceName}\n\nCordialement,\n${data.cabinetName}`
    }),

    welcomeEmail: (data: {
      patientName: string;
      cabinetName: string;
    }): EmailTemplate => ({
      subject: `Bienvenue chez ${data.cabinetName}`,
      html: `
        <h2>Bienvenue !</h2>
        <p>Bonjour ${data.patientName},</p>
        <p>Nous sommes ravis de vous accueillir chez ${data.cabinetName}.</p>
        <p>Vous pouvez désormais :</p>
        <ul>
          <li>Prendre rendez-vous en ligne</li>
          <li>Consulter votre historique de soins</li>
          <li>Communiquer avec notre équipe</li>
        </ul>
        <p>Cordialement,<br>L'équipe ${data.cabinetName}</p>
      `,
      text: `Bienvenue !\n\nBonjour ${data.patientName},\n\nNous sommes ravis de vous accueillir chez ${data.cabinetName}.\n\nCordialement,\nL'équipe ${data.cabinetName}`
    })
  };
}

// Export singleton instance
export const emailQueue = EmailQueue.getInstance();
export default emailQueue;