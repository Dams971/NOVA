import 'server-only';
import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';

// Validate environment at module load
const requiredEnvVars = ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASSWORD', 'SMTP_FROM'];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

// Ensure server-only execution
if (typeof window !== 'undefined') {
  throw new Error('ionos-email.service.ts can only be used on the server');
}

interface AppointmentEmailData {
  patient_name: string;
  patient_email: string;
  patient_phone: string;
  appointment_date: string; // ISO string
  appointment_time: string;
  care_type?: string;
  reason?: string;
  appointment_id: string;
  clinic_address: string;
  clinic_phone?: string;
  clinic_email?: string;
}

class IonosEmailService {
  private transporter: nodemailer.Transporter;
  private supabase;

  constructor() {
    // Double-check server-only
    if (typeof window !== 'undefined') {
      throw new Error('IonosEmailService cannot be instantiated on the client');
    }

    // Create transporter with proper config
    this.transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST!,
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER!,
        pass: process.env.SMTP_PASSWORD!,
      },
      tls: {
        minVersion: 'TLSv1.2',
        ciphers: 'HIGH',
      },
      pool: true,
      maxConnections: 3,
      maxMessages: 50,
      connectionTimeout: 60000,
      greetingTimeout: 30000,
      socketTimeout: 60000,
    });

    // Initialize Supabase client for logging
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }

  async sendAppointmentConfirmation(
    data: AppointmentEmailData,
    userId: string
  ): Promise<boolean> {
    try {
      const { html, text } = await this.generateAppointmentTemplates(data);
      
      const mailOptions = {
        from: `"Cabinet Dentaire NOVA" <${process.env.SMTP_FROM}>`,
        to: data.patient_email,
        subject: `Confirmation de votre rendez-vous - ${this.formatDate(data.appointment_date)}`,
        html,
        text,
        headers: {
          'X-Priority': '3',
          'X-Mailer': 'NOVA RDV System',
        },
      };

      const info = await this.transporter.sendMail(mailOptions);
      
      // Log email
      await this.logEmail({
        user_id: userId,
        to_email: data.patient_email,
        subject: mailOptions.subject,
        template_name: 'appointment_confirmation',
        message_id: info.messageId,
        status: 'sent',
        metadata: {
          appointment_id: data.appointment_id,
          appointment_date: data.appointment_date,
        },
      });

      return true;
    } catch (_error) {
      console.error('Email send error:', error);
      
      // Log error
      await this.logEmail({
        user_id: userId,
        to_email: data.patient_email,
        subject: `Confirmation de votre rendez-vous`,
        template_name: 'appointment_confirmation',
        status: 'failed',
        error_message: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          appointment_id: data.appointment_id,
        },
      });

      return false;
    }
  }

  async sendOtpEmail(email: string, otp: string): Promise<boolean> {
    try {
      const { html, text } = this.generateOtpTemplates(otp);
      
      const mailOptions = {
        from: `"Cabinet Dentaire NOVA" <${process.env.SMTP_FROM}>`,
        to: email,
        subject: 'Votre code de vérification NOVA',
        html,
        text,
        headers: {
          'X-Priority': '1',
          'X-Mailer': 'NOVA RDV System',
        },
      };

      const info = await this.transporter.sendMail(mailOptions);
      
      await this.logEmail({
        to_email: email,
        subject: mailOptions.subject,
        template_name: 'otp',
        message_id: info.messageId,
        status: 'sent',
        metadata: { otp_sent_at: new Date().toISOString() },
      });

      return true;
    } catch (_error) {
      console.error('OTP email send error:', error);
      
      await this.logEmail({
        to_email: email,
        subject: 'Votre code de vérification NOVA',
        template_name: 'otp',
        status: 'failed',
        error_message: error instanceof Error ? error.message : 'Unknown error',
      });

      return false;
    }
  }

  async verifyConnection(): Promise<{ success: boolean; error?: string }> {
    if (process.env.NODE_ENV !== 'development') {
      return { 
        success: false, 
        error: 'Connection verification is only available in development' 
      };
    }

    try {
      await this.transporter.verify();
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  private async logEmail(data: {
    user_id?: string;
    to_email: string;
    subject: string;
    template_name: string;
    message_id?: string;
    status: 'sent' | 'failed';
    error_message?: string;
    metadata?: Record<string, any>;
  }) {
    try {
      await this.supabase.from('email_logs').insert({
        ...data,
        sent_at: new Date().toISOString(),
      });
    } catch (_error) {
      console.error('Failed to log email:', error);
    }
  }

  private formatDate(isoDate: string): string {
    const date = new Date(isoDate);
    return new Intl.DateTimeFormat('fr-FR', {
      dateStyle: 'full',
      timeZone: 'Africa/Algiers',
    }).format(date);
  }

  private formatDateTime(isoDate: string): string {
    const date = new Date(isoDate);
    return new Intl.DateTimeFormat('fr-FR', {
      dateStyle: 'full',
      timeStyle: 'short',
      timeZone: 'Africa/Algiers',
    }).format(date);
  }

  private async generateAppointmentTemplates(data: AppointmentEmailData) {
    // Get clinic contact from ENV or config
    const clinicPhone = process.env.CLINIC_PHONE || data.clinic_phone || '';
    const clinicEmail = process.env.CLINIC_EMAIL || data.clinic_email || '';
    
    const dateTime = this.formatDateTime(data.appointment_date);
    
    const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirmation de rendez-vous</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: white; padding: 30px; border: 1px solid #e0e0e0; border-radius: 0 0 10px 10px; }
    .info-box { background: #f7f9fc; padding: 20px; border-left: 4px solid #667eea; margin: 20px 0; }
    .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; font-size: 14px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Confirmation de votre rendez-vous</h1>
    </div>
    <div class="content">
      <p>Bonjour ${data.patient_name},</p>
      
      <p>Votre rendez-vous au Cabinet Dentaire NOVA est confirmé.</p>
      
      <div class="info-box">
        <h2 style="margin-top: 0;">Détails du rendez-vous</h2>
        <p><strong>Date et heure :</strong> ${dateTime}</p>
        <p><strong>Type de soin :</strong> ${data.care_type || 'Consultation'}</p>
        ${data.reason ? `<p><strong>Motif :</strong> ${data.reason}</p>` : ''}
        <p><strong>Référence :</strong> ${data.appointment_id}</p>
      </div>
      
      <div class="info-box">
        <h2 style="margin-top: 0;">Adresse du cabinet</h2>
        <p>${data.clinic_address}</p>
        ${clinicPhone ? `<p><strong>Téléphone :</strong> <a href="tel:${clinicPhone}">${clinicPhone}</a></p>` : ''}
        ${clinicEmail ? `<p><strong>Email :</strong> <a href="mailto:${clinicEmail}">${clinicEmail}</a></p>` : ''}
      </div>
      
      <p><strong>Important :</strong> En cas d'empêchement, merci de nous prévenir au moins 24h à l'avance.</p>
      
      <div class="footer">
        <p>Cordialement,<br>L'équipe du Cabinet Dentaire NOVA</p>
        <p style="font-size: 12px; color: #999;">Cet email a été envoyé automatiquement. Pour toute question, contactez-nous directement.</p>
      </div>
    </div>
  </div>
</body>
</html>`;

    const text = `
Confirmation de votre rendez-vous

Bonjour ${data.patient_name},

Votre rendez-vous au Cabinet Dentaire NOVA est confirmé.

DÉTAILS DU RENDEZ-VOUS
-----------------------
Date et heure : ${dateTime}
Type de soin : ${data.care_type || 'Consultation'}
${data.reason ? `Motif : ${data.reason}` : ''}
Référence : ${data.appointment_id}

ADRESSE DU CABINET
------------------
${data.clinic_address}
${clinicPhone ? `Téléphone : ${clinicPhone}` : ''}
${clinicEmail ? `Email : ${clinicEmail}` : ''}

Important : En cas d'empêchement, merci de nous prévenir au moins 24h à l'avance.

Cordialement,
L'équipe du Cabinet Dentaire NOVA

---
Cet email a été envoyé automatiquement. Pour toute question, contactez-nous directement.
`;

    return { html, text };
  }

  private generateOtpTemplates(otp: string) {
    const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Code de vérification</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 500px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: white; padding: 30px; border: 1px solid #e0e0e0; border-radius: 0 0 10px 10px; text-align: center; }
    .otp-code { font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #667eea; background: #f7f9fc; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .footer { margin-top: 20px; font-size: 14px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Code de vérification</h1>
    </div>
    <div class="content">
      <p>Voici votre code de vérification pour accéder à votre compte NOVA :</p>
      
      <div class="otp-code">${otp}</div>
      
      <p>Ce code expire dans 10 minutes.</p>
      
      <div class="footer">
        <p>Si vous n'avez pas demandé ce code, ignorez cet email.</p>
        <p style="font-size: 12px; color: #999;">Pour votre sécurité, ne partagez jamais ce code.</p>
      </div>
    </div>
  </div>
</body>
</html>`;

    const text = `
Code de vérification NOVA

Voici votre code de vérification pour accéder à votre compte NOVA :

${otp}

Ce code expire dans 10 minutes.

Si vous n'avez pas demandé ce code, ignorez cet email.

Pour votre sécurité, ne partagez jamais ce code.

---
Cabinet Dentaire NOVA
`;

    return { html, text };
  }
}

// Singleton instance
let instance: IonosEmailService | null = null;

export function getEmailService(): IonosEmailService {
  if (typeof window !== 'undefined') {
    throw new Error('Email service cannot be used on the client');
  }
  
  if (!instance) {
    instance = new IonosEmailService();
  }
  
  return instance;
}

export type { AppointmentEmailData };