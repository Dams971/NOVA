import nodemailer from 'nodemailer';
import { z } from 'zod';
import { env } from '@/config/env';

/**
 * NOVA Email Notification Service
 * Handles appointment confirmations, reminders, and notifications
 */

// Email validation schemas
const SendEmailSchema = z.object({
  to: z.string().email(),
  subject: z.string().min(1).max(200),
  html: z.string(),
  text: z.string().optional(),
  from: z.string().email().optional(),
  replyTo: z.string().email().optional(),
  attachments: z.array(z.object({
    filename: z.string(),
    content: z.string(),
    contentType: z.string().optional()
  })).optional()
});

const AppointmentEmailSchema = z.object({
  tenantId: z.string(),
  appointmentId: z.string(),
  patientEmail: z.string().email(),
  patientName: z.string(),
  practitionerName: z.string(),
  appointmentDate: z.string(),
  appointmentTime: z.string(),
  serviceType: z.string(),
  cabinetName: z.string(),
  cabinetAddress: z.string().optional(),
  cabinetPhone: z.string().optional(),
  notes: z.string().optional(),
  locale: z.string().default('fr')
});

const ReminderEmailSchema = z.object({
  tenantId: z.string(),
  appointmentId: z.string(),
  patientEmail: z.string().email(),
  patientName: z.string(),
  practitionerName: z.string(),
  appointmentDate: z.string(),
  appointmentTime: z.string(),
  serviceType: z.string(),
  cabinetName: z.string(),
  cabinetPhone: z.string().optional(),
  hoursUntilAppointment: z.number(),
  locale: z.string().default('fr')
});

export type SendEmailParams = z.infer<typeof SendEmailSchema>;
export type AppointmentEmailParams = z.infer<typeof AppointmentEmailSchema>;
export type ReminderEmailParams = z.infer<typeof ReminderEmailSchema>;

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export class EmailService {
  private static instance: EmailService;
  private transporter: nodemailer.Transporter | null = null;

  private constructor() {
    this.initializeTransporter();
  }

  public static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  /**
   * Initialize SMTP transporter
   */
  private initializeTransporter(): void {
    try {
      this.transporter = nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: env.SMTP_PORT,
        secure: env.SMTP_SECURE, // true for 465, false for other ports
        auth: {
          user: env.SMTP_USER,
          pass: env.SMTP_PASSWORD,
        },
        pool: true,
        maxConnections: 5,
        maxMessages: 100,
      });

      // Verify connection
      this.transporter.verify((error, success) => {
        if (error) {
          console.error('❌ SMTP connection failed:', error);
        } else {
          console.warn('✅ SMTP server ready for messages');
        }
      });

    } catch (_error) {
      console.error('Failed to initialize email transporter:', _error);
    }
  }

  /**
   * Send email with validation
   */
  async sendEmail(params: SendEmailParams): Promise<EmailResult> {
    try {
      const validated = SendEmailSchema.parse(params);

      if (!this.transporter) {
        return { success: false, error: 'Email transporter not initialized' };
      }

      const mailOptions = {
        from: validated.from || env.SMTP_FROM,
        to: validated.to,
        subject: validated.subject,
        text: validated.text,
        html: validated.html,
        replyTo: validated.replyTo,
        attachments: validated.attachments
      };

      const result = await this.transporter.sendMail(mailOptions);

      console.warn('📧 Email sent successfully:', {
        to: validated.to,
        subject: validated.subject,
        messageId: result.messageId
      });

      return {
        success: true,
        messageId: result.messageId
      };

    } catch (_error) {
      console.error('Email send error:', _error);
      return {
        success: false,
        error: _error instanceof Error ? _error.message : 'Failed to send email'
      };
    }
  }

  /**
   * Send appointment confirmation email
   */
  async sendAppointmentConfirmation(params: AppointmentEmailParams): Promise<EmailResult> {
    try {
      const validated = AppointmentEmailSchema.parse(params);

      const subject = `Confirmation de rendez-vous - ${validated.cabinetName}`;
      const { html, text } = this.generateAppointmentConfirmationTemplate(validated);

      return await this.sendEmail({
        to: validated.patientEmail,
        subject,
        html,
        text,
        replyTo: `noreply@nova-dental.fr`
      });

    } catch (_error) {
      console.error('Failed to send appointment confirmation:', _error);
      return {
        success: false,
        error: _error instanceof Error ? _error.message : 'Failed to send confirmation'
      };
    }
  }

  /**
   * Send appointment reminder email
   */
  async sendAppointmentReminder(params: ReminderEmailParams): Promise<EmailResult> {
    try {
      const validated = ReminderEmailSchema.parse(params);

      const subject = `Rappel de rendez-vous dans ${validated.hoursUntilAppointment}h - ${validated.cabinetName}`;
      const { html, text } = this.generateAppointmentReminderTemplate(validated);

      return await this.sendEmail({
        to: validated.patientEmail,
        subject,
        html,
        text,
        replyTo: `noreply@nova-dental.fr`
      });

    } catch (_error) {
      console.error('Failed to send appointment reminder:', _error);
      return {
        success: false,
        error: _error instanceof Error ? _error.message : 'Failed to send reminder'
      };
    }
  }

  /**
   * Send appointment cancellation email
   */
  async sendAppointmentCancellation(params: AppointmentEmailParams): Promise<EmailResult> {
    try {
      const validated = AppointmentEmailSchema.parse(params);

      const subject = `Annulation de rendez-vous - ${validated.cabinetName}`;
      const { html, text } = this.generateAppointmentCancellationTemplate(validated);

      return await this.sendEmail({
        to: validated.patientEmail,
        subject,
        html,
        text,
        replyTo: `noreply@nova-dental.fr`
      });

    } catch (_error) {
      console.error('Failed to send appointment cancellation:', _error);
      return {
        success: false,
        error: _error instanceof Error ? _error.message : 'Failed to send cancellation'
      };
    }
  }

  /**
   * Send appointment reschedule email
   */
  async sendAppointmentReschedule(
    oldParams: AppointmentEmailParams,
    newParams: AppointmentEmailParams
  ): Promise<EmailResult> {
    try {
      const validated = AppointmentEmailSchema.parse(newParams);

      const subject = `Modification de rendez-vous - ${validated.cabinetName}`;
      const { html, text } = this.generateAppointmentRescheduleTemplate(oldParams, newParams);

      return await this.sendEmail({
        to: validated.patientEmail,
        subject,
        html,
        text,
        replyTo: `noreply@nova-dental.fr`
      });

    } catch (_error) {
      console.error('Failed to send appointment reschedule:', _error);
      return {
        success: false,
        error: _error instanceof Error ? _error.message : 'Failed to send reschedule notification'
      };
    }
  }

  /**
   * Generate appointment confirmation template
   */
  private generateAppointmentConfirmationTemplate(params: AppointmentEmailParams): { html: string; text: string } {
    const formattedDate = this.formatDate(params.appointmentDate, params.locale);
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Confirmation de rendez-vous</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #3b82f6, #1e40af); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
          .appointment-card { background: white; border-radius: 8px; padding: 20px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          .appointment-detail { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
          .appointment-detail:last-child { border-bottom: none; }
          .label { font-weight: bold; color: #374151; }
          .value { color: #1f2937; }
          .cta-button { background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0; }
          .footer { text-align: center; color: #6b7280; font-size: 14px; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🦷 Confirmation de rendez-vous</h1>
          <p>Votre rendez-vous a été confirmé avec succès</p>
        </div>
        
        <div class="content">
          <p>Bonjour ${params.patientName},</p>
          
          <p>Nous vous confirmons votre rendez-vous chez <strong>${params.cabinetName}</strong>.</p>
          
          <div class="appointment-card">
            <h3>📅 Détails du rendez-vous</h3>
            
            <div class="appointment-detail">
              <span class="label">Date :</span>
              <span class="value">${formattedDate}</span>
            </div>
            
            <div class="appointment-detail">
              <span class="label">Heure :</span>
              <span class="value">${params.appointmentTime}</span>
            </div>
            
            <div class="appointment-detail">
              <span class="label">Praticien :</span>
              <span class="value">${params.practitionerName}</span>
            </div>
            
            <div class="appointment-detail">
              <span class="label">Soin :</span>
              <span class="value">${params.serviceType}</span>
            </div>
            
            <div class="appointment-detail">
              <span class="label">ID Rendez-vous :</span>
              <span class="value">${params.appointmentId}</span>
            </div>
          </div>
          
          ${params.cabinetAddress ? `
            <div class="appointment-card">
              <h3>📍 Adresse du cabinet</h3>
              <p>${params.cabinetAddress}</p>
              ${params.cabinetPhone ? `<p>📞 ${params.cabinetPhone}</p>` : ''}
            </div>
          ` : ''}
          
          ${params.notes ? `
            <div class="appointment-card">
              <h3>📝 Notes</h3>
              <p>${params.notes}</p>
            </div>
          ` : ''}
          
          <div class="appointment-card">
            <h3>ℹ️ Informations importantes</h3>
            <ul>
              <li>Merci d'arriver 10 minutes avant votre rendez-vous</li>
              <li>En cas d'empêchement, prévenez-nous au moins 24h à l'avance</li>
              <li>N'oubliez pas d'apporter votre carte de sécurité sociale et votre mutuelle</li>
              <li>Vous recevrez un rappel 24h avant votre rendez-vous</li>
            </ul>
          </div>
          
          <div style="text-align: center;">
            <a href="mailto:${params.cabinetPhone ? params.cabinetPhone.replace(/\s/g, '') : 'contact@nova-dental.fr'}" class="cta-button">
              Nous contacter
            </a>
          </div>
        </div>
        
        <div class="footer">
          <p>Merci de votre confiance !</p>
          <p>${params.cabinetName}</p>
          <p><small>Cet email a été envoyé automatiquement, merci de ne pas y répondre.</small></p>
        </div>
      </body>
      </html>
    `;

    const text = `
CONFIRMATION DE RENDEZ-VOUS

Bonjour ${params.patientName},

Nous vous confirmons votre rendez-vous chez ${params.cabinetName}.

DÉTAILS DU RENDEZ-VOUS :
- Date : ${formattedDate}
- Heure : ${params.appointmentTime}
- Praticien : ${params.practitionerName}
- Soin : ${params.serviceType}
- ID Rendez-vous : ${params.appointmentId}

${params.cabinetAddress ? `ADRESSE DU CABINET :
${params.cabinetAddress}` : ''}

${params.cabinetPhone ? `TÉLÉPHONE : ${params.cabinetPhone}` : ''}

${params.notes ? `NOTES :
${params.notes}` : ''}

INFORMATIONS IMPORTANTES :
- Merci d'arriver 10 minutes avant votre rendez-vous
- En cas d'empêchement, prévenez-nous au moins 24h à l'avance
- N'oubliez pas d'apporter votre carte de sécurité sociale et votre mutuelle
- Vous recevrez un rappel 24h avant votre rendez-vous

Merci de votre confiance !
${params.cabinetName}
    `;

    return { html, text };
  }

  /**
   * Generate appointment reminder template
   */
  private generateAppointmentReminderTemplate(params: ReminderEmailParams): { html: string; text: string } {
    const formattedDate = this.formatDate(params.appointmentDate, params.locale);
    const timeUntil = params.hoursUntilAppointment === 24 ? 'demain' : `dans ${params.hoursUntilAppointment}h`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Rappel de rendez-vous</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #f59e0b, #d97706); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #fffbeb; padding: 30px; border-radius: 0 0 8px 8px; }
          .reminder-card { background: white; border-left: 4px solid #f59e0b; border-radius: 8px; padding: 20px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          .appointment-detail { display: flex; justify-content: space-between; padding: 8px 0; }
          .label { font-weight: bold; color: #92400e; }
          .value { color: #1f2937; }
          .cta-button { background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 10px 5px; }
          .cancel-button { background: #ef4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 10px 5px; }
          .footer { text-align: center; color: #92400e; font-size: 14px; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>⏰ Rappel de rendez-vous</h1>
          <p>Votre rendez-vous est ${timeUntil}</p>
        </div>
        
        <div class="content">
          <p>Bonjour ${params.patientName},</p>
          
          <p>Nous vous rappelons que vous avez un rendez-vous <strong>${timeUntil}</strong> chez <strong>${params.cabinetName}</strong>.</p>
          
          <div class="reminder-card">
            <h3>📅 Rappel de votre rendez-vous</h3>
            
            <div class="appointment-detail">
              <span class="label">Date :</span>
              <span class="value">${formattedDate}</span>
            </div>
            
            <div class="appointment-detail">
              <span class="label">Heure :</span>
              <span class="value">${params.appointmentTime}</span>
            </div>
            
            <div class="appointment-detail">
              <span class="label">Praticien :</span>
              <span class="value">${params.practitionerName}</span>
            </div>
            
            <div class="appointment-detail">
              <span class="label">Soin :</span>
              <span class="value">${params.serviceType}</span>
            </div>
          </div>
          
          <div class="reminder-card">
            <h3>📋 À ne pas oublier</h3>
            <ul>
              <li>Arriver 10 minutes avant votre rendez-vous</li>
              <li>Apporter votre carte de sécurité sociale</li>
              <li>Apporter votre carte de mutuelle</li>
              <li>Apporter vos dernières radiographies si vous en avez</li>
            </ul>
          </div>
          
          <div style="text-align: center;">
            <a href="mailto:${params.cabinetPhone ? params.cabinetPhone.replace(/\s/g, '') : 'contact@nova-dental.fr'}" class="cta-button">
              Confirmer ma présence
            </a>
            <a href="mailto:${params.cabinetPhone ? params.cabinetPhone.replace(/\s/g, '') : 'contact@nova-dental.fr'}?subject=Annulation%20RDV%20${params.appointmentId}" class="cancel-button">
              Annuler le rendez-vous
            </a>
          </div>
        </div>
        
        <div class="footer">
          <p>À bientôt !</p>
          <p>${params.cabinetName}</p>
          ${params.cabinetPhone ? `<p>☎️ ${params.cabinetPhone}</p>` : ''}
        </div>
      </body>
      </html>
    `;

    const text = `
RAPPEL DE RENDEZ-VOUS

Bonjour ${params.patientName},

Nous vous rappelons que vous avez un rendez-vous ${timeUntil} chez ${params.cabinetName}.

RAPPEL DE VOTRE RENDEZ-VOUS :
- Date : ${formattedDate}
- Heure : ${params.appointmentTime}
- Praticien : ${params.practitionerName}
- Soin : ${params.serviceType}

À NE PAS OUBLIER :
- Arriver 10 minutes avant votre rendez-vous
- Apporter votre carte de sécurité sociale
- Apporter votre carte de mutuelle
- Apporter vos dernières radiographies si vous en avez

${params.cabinetPhone ? `Pour toute question : ${params.cabinetPhone}` : ''}

À bientôt !
${params.cabinetName}
    `;

    return { html, text };
  }

  /**
   * Generate appointment cancellation template
   */
  private generateAppointmentCancellationTemplate(params: AppointmentEmailParams): { html: string; text: string } {
    const formattedDate = this.formatDate(params.appointmentDate, params.locale);
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Annulation de rendez-vous</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #ef4444, #dc2626); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #fef2f2; padding: 30px; border-radius: 0 0 8px 8px; }
          .cancellation-card { background: white; border-left: 4px solid #ef4444; border-radius: 8px; padding: 20px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          .appointment-detail { display: flex; justify-content: space-between; padding: 8px 0; }
          .label { font-weight: bold; color: #991b1b; }
          .value { color: #1f2937; text-decoration: line-through; opacity: 0.7; }
          .cta-button { background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0; }
          .footer { text-align: center; color: #991b1b; font-size: 14px; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>❌ Annulation de rendez-vous</h1>
          <p>Votre rendez-vous a été annulé</p>
        </div>
        
        <div class="content">
          <p>Bonjour ${params.patientName},</p>
          
          <p>Nous vous confirmons l'annulation de votre rendez-vous chez <strong>${params.cabinetName}</strong>.</p>
          
          <div class="cancellation-card">
            <h3>📅 Rendez-vous annulé</h3>
            
            <div class="appointment-detail">
              <span class="label">Date :</span>
              <span class="value">${formattedDate}</span>
            </div>
            
            <div class="appointment-detail">
              <span class="label">Heure :</span>
              <span class="value">${params.appointmentTime}</span>
            </div>
            
            <div class="appointment-detail">
              <span class="label">Praticien :</span>
              <span class="value">${params.practitionerName}</span>
            </div>
            
            <div class="appointment-detail">
              <span class="label">Soin :</span>
              <span class="value">${params.serviceType}</span>
            </div>
          </div>
          
          <div class="cancellation-card">
            <h3>💡 Reprendre un rendez-vous</h3>
            <p>Vous souhaitez reprendre un nouveau rendez-vous ? N'hésitez pas à nous contacter ou à utiliser notre assistant en ligne.</p>
            
            <div style="text-align: center;">
              <a href="mailto:${params.cabinetPhone ? params.cabinetPhone.replace(/\s/g, '') : 'contact@nova-dental.fr'}?subject=Nouveau%20rendez-vous" class="cta-button">
                Prendre un nouveau rendez-vous
              </a>
            </div>
          </div>
        </div>
        
        <div class="footer">
          <p>Nous espérons vous revoir bientôt !</p>
          <p>${params.cabinetName}</p>
        </div>
      </body>
      </html>
    `;

    const text = `
ANNULATION DE RENDEZ-VOUS

Bonjour ${params.patientName},

Nous vous confirmons l'annulation de votre rendez-vous chez ${params.cabinetName}.

RENDEZ-VOUS ANNULÉ :
- Date : ${formattedDate}
- Heure : ${params.appointmentTime}
- Praticien : ${params.practitionerName}
- Soin : ${params.serviceType}

REPRENDRE UN RENDEZ-VOUS :
Vous souhaitez reprendre un nouveau rendez-vous ? N'hésitez pas à nous contacter.

Nous espérons vous revoir bientôt !
${params.cabinetName}
    `;

    return { html, text };
  }

  /**
   * Generate appointment reschedule template
   */
  private generateAppointmentRescheduleTemplate(
    oldParams: AppointmentEmailParams,
    newParams: AppointmentEmailParams
  ): { html: string; text: string } {
    const oldFormattedDate = this.formatDate(oldParams.appointmentDate, oldParams.locale);
    const newFormattedDate = this.formatDate(newParams.appointmentDate, newParams.locale);
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Modification de rendez-vous</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #8b5cf6, #7c3aed); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #faf5ff; padding: 30px; border-radius: 0 0 8px 8px; }
          .change-card { background: white; border-radius: 8px; padding: 20px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          .old-appointment { border-left: 4px solid #ef4444; }
          .new-appointment { border-left: 4px solid #10b981; }
          .appointment-detail { display: flex; justify-content: space-between; padding: 8px 0; }
          .old-label { font-weight: bold; color: #991b1b; }
          .new-label { font-weight: bold; color: #065f46; }
          .old-value { color: #ef4444; text-decoration: line-through; opacity: 0.7; }
          .new-value { color: #10b981; font-weight: bold; }
          .cta-button { background: #8b5cf6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0; }
          .footer { text-align: center; color: #7c3aed; font-size: 14px; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🔄 Modification de rendez-vous</h1>
          <p>Votre rendez-vous a été reporté</p>
        </div>
        
        <div class="content">
          <p>Bonjour ${newParams.patientName},</p>
          
          <p>Nous vous confirmons la modification de votre rendez-vous chez <strong>${newParams.cabinetName}</strong>.</p>
          
          <div class="change-card old-appointment">
            <h3>❌ Ancien rendez-vous (annulé)</h3>
            
            <div class="appointment-detail">
              <span class="old-label">Date :</span>
              <span class="old-value">${oldFormattedDate}</span>
            </div>
            
            <div class="appointment-detail">
              <span class="old-label">Heure :</span>
              <span class="old-value">${oldParams.appointmentTime}</span>
            </div>
          </div>
          
          <div class="change-card new-appointment">
            <h3>✅ Nouveau rendez-vous (confirmé)</h3>
            
            <div class="appointment-detail">
              <span class="new-label">Date :</span>
              <span class="new-value">${newFormattedDate}</span>
            </div>
            
            <div class="appointment-detail">
              <span class="new-label">Heure :</span>
              <span class="new-value">${newParams.appointmentTime}</span>
            </div>
            
            <div class="appointment-detail">
              <span class="new-label">Praticien :</span>
              <span class="new-value">${newParams.practitionerName}</span>
            </div>
            
            <div class="appointment-detail">
              <span class="new-label">Soin :</span>
              <span class="new-value">${newParams.serviceType}</span>
            </div>
            
            <div class="appointment-detail">
              <span class="new-label">ID Rendez-vous :</span>
              <span class="new-value">${newParams.appointmentId}</span>
            </div>
          </div>
          
          <div class="change-card">
            <h3>ℹ️ Informations importantes</h3>
            <ul>
              <li>Merci d'arriver 10 minutes avant votre nouveau rendez-vous</li>
              <li>Vous recevrez un rappel 24h avant la nouvelle date</li>
              <li>En cas de nouveau changement, prévenez-nous au moins 24h à l'avance</li>
            </ul>
            
            <div style="text-align: center;">
              <a href="mailto:${newParams.cabinetPhone ? newParams.cabinetPhone.replace(/\s/g, '') : 'contact@nova-dental.fr'}" class="cta-button">
                Nous contacter
              </a>
            </div>
          </div>
        </div>
        
        <div class="footer">
          <p>Merci de votre compréhension !</p>
          <p>${newParams.cabinetName}</p>
        </div>
      </body>
      </html>
    `;

    const text = `
MODIFICATION DE RENDEZ-VOUS

Bonjour ${newParams.patientName},

Nous vous confirmons la modification de votre rendez-vous chez ${newParams.cabinetName}.

ANCIEN RENDEZ-VOUS (ANNULÉ) :
- Date : ${oldFormattedDate}
- Heure : ${oldParams.appointmentTime}

NOUVEAU RENDEZ-VOUS (CONFIRMÉ) :
- Date : ${newFormattedDate}
- Heure : ${newParams.appointmentTime}
- Praticien : ${newParams.practitionerName}
- Soin : ${newParams.serviceType}
- ID Rendez-vous : ${newParams.appointmentId}

INFORMATIONS IMPORTANTES :
- Merci d'arriver 10 minutes avant votre nouveau rendez-vous
- Vous recevrez un rappel 24h avant la nouvelle date
- En cas de nouveau changement, prévenez-nous au moins 24h à l'avance

Merci de votre compréhension !
${newParams.cabinetName}
    `;

    return { html, text };
  }

  /**
   * Format date for display
   */
  private formatDate(dateString: string, locale: string = 'fr'): string {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString(locale, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  }

  /**
   * Health check for email service
   */
  async healthCheck(): Promise<boolean> {
    try {
      if (!this.transporter) {
        return false;
      }

      return new Promise((resolve) => {
        this.transporter!.verify((error, success) => {
          resolve(success && !error);
        });
      });
    } catch (_error) {
      console.error('Email service health check failed:', _error);
      return false;
    }
  }
}

export default EmailService;