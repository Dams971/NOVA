/**
 * NOVA RDV+ - IONOS Email Service
 * 
 * Handles transactional emails via IONOS SMTP
 * Sends appointment confirmations and OTP emails
 */

import nodemailer from 'nodemailer';
import { supabase } from '@/lib/supabase/client';

// Email configuration from environment
const emailConfig = {
  host: process.env.SMTP_HOST || 'smtp.ionos.fr',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  user: process.env.SMTP_USER || 'contact@skillnest.fr',
  password: process.env.SMTP_PASSWORD,
  from: process.env.SMTP_FROM || 'contact@skillnest.fr'
};

// Create reusable transporter
const createTransporter = () => {
  return nodemailer.createTransporter({
    host: emailConfig.host,
    port: emailConfig.port,
    secure: emailConfig.secure,
    auth: {
      user: emailConfig.user,
      pass: emailConfig.password
    },
    tls: {
      rejectUnauthorized: false // For STARTTLS
    }
  });
};

export interface AppointmentEmailData {
  patient_name: string;
  patient_email: string;
  patient_phone_e164: string;
  start_at: string;
  end_at: string;
  care_type: string;
  reason?: string;
  appointment_id: string;
}

export class IONOSEmailService {
  private transporter: any;

  constructor() {
    if (typeof window === 'undefined') {
      // Only create transporter on server side
      this.transporter = createTransporter();
    }
  }

  /**
   * Send appointment confirmation email
   */
  async sendAppointmentConfirmation(
    data: AppointmentEmailData,
    userId: string
  ): Promise<boolean> {
    try {
      const html = this.generateAppointmentHtml(data);
      const text = this.generateAppointmentText(data);

      const mailOptions = {
        from: `Cabinet NOVA <${emailConfig.from}>`,
        to: data.patient_email,
        subject: 'Confirmation de votre rendez-vous - Cabinet Dentaire NOVA',
        html,
        text,
        headers: {
          'X-Priority': '3',
          'X-Mailer': 'NOVA RDV System'
        }
      };

      // Send email
      const info = await this.transporter.sendMail(mailOptions);

      // Log in database
      await this.logEmail(
        userId,
        data.patient_email,
        mailOptions.subject,
        'appointment_confirmation',
        info.messageId,
        'SENT'
      );

      return true;
    } catch (error: any) {
      console.error('Email send error:', error);

      // Log failure
      await this.logEmail(
        userId,
        data.patient_email,
        'Confirmation de votre rendez-vous',
        'appointment_confirmation',
        null,
        'FAILED',
        error.message
      );

      return false;
    }
  }

  /**
   * Send OTP verification email
   */
  async sendOtpEmail(
    email: string,
    otp: string
  ): Promise<boolean> {
    try {
      const html = this.generateOtpHtml(otp);
      const text = this.generateOtpText(otp);

      const mailOptions = {
        from: `Cabinet NOVA <${emailConfig.from}>`,
        to: email,
        subject: 'Code de vérification - Cabinet NOVA',
        html,
        text,
        priority: 'high'
      };

      await this.transporter.sendMail(mailOptions);
      return true;
    } catch (error) {
      console.error('OTP email error:', error);
      return false;
    }
  }

  /**
   * Generate appointment confirmation HTML
   */
  private generateAppointmentHtml(data: AppointmentEmailData): string {
    const appointmentDate = new Date(data.start_at);
    const formattedDate = appointmentDate.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const formattedTime = appointmentDate.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });

    const careTypeLabels: Record<string, string> = {
      consultation: 'Consultation',
      urgence: 'Urgence',
      detartrage: 'Détartrage',
      soin: 'Soin dentaire',
      extraction: 'Extraction',
      prothese: 'Prothèse',
      orthodontie: 'Orthodontie',
      chirurgie: 'Chirurgie'
    };

    return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirmation de rendez-vous</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      margin: 0;
      padding: 0;
      background-color: #f5f5f5;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background: white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .header {
      background: linear-gradient(135deg, #0066FF 0%, #004AC1 100%);
      color: white;
      padding: 30px 20px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 600;
    }
    .logo {
      font-size: 40px;
      margin-bottom: 10px;
    }
    .content {
      padding: 30px 20px;
    }
    .appointment-card {
      background: #f8f9fa;
      border-left: 4px solid #0066FF;
      padding: 20px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .info-row {
      margin: 10px 0;
      display: flex;
      align-items: center;
    }
    .info-label {
      font-weight: 600;
      color: #666;
      min-width: 120px;
    }
    .info-value {
      color: #333;
    }
    .clinic-info {
      background: #fff3cd;
      border: 1px solid #ffc107;
      padding: 15px;
      border-radius: 4px;
      margin: 20px 0;
    }
    .buttons {
      text-align: center;
      margin: 30px 0;
    }
    .button {
      display: inline-block;
      padding: 12px 30px;
      margin: 0 10px;
      text-decoration: none;
      border-radius: 4px;
      font-weight: 600;
    }
    .button-primary {
      background: #0066FF;
      color: white;
    }
    .button-secondary {
      background: #6c757d;
      color: white;
    }
    .footer {
      background: #f8f9fa;
      padding: 20px;
      text-align: center;
      color: #666;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">🦷</div>
      <h1>Cabinet Dentaire NOVA</h1>
      <p style="margin: 5px 0; opacity: 0.9;">Excellence en soins dentaires</p>
    </div>
    
    <div class="content">
      <h2 style="color: #0066FF;">Votre rendez-vous est confirmé !</h2>
      <p>Bonjour ${data.patient_name},</p>
      <p>Nous avons le plaisir de vous confirmer votre rendez-vous au Cabinet Dentaire NOVA.</p>
      
      <div class="appointment-card">
        <div class="info-row">
          <span class="info-label">📅 Date :</span>
          <span class="info-value">${formattedDate}</span>
        </div>
        <div class="info-row">
          <span class="info-label">🕐 Heure :</span>
          <span class="info-value">${formattedTime}</span>
        </div>
        <div class="info-row">
          <span class="info-label">🦷 Type de soin :</span>
          <span class="info-value">${careTypeLabels[data.care_type] || data.care_type}</span>
        </div>
        ${data.reason ? `
        <div class="info-row">
          <span class="info-label">📝 Motif :</span>
          <span class="info-value">${data.reason}</span>
        </div>
        ` : ''}
        <div class="info-row">
          <span class="info-label">🔖 Référence :</span>
          <span class="info-value" style="font-family: monospace;">${data.appointment_id.substring(0, 8).toUpperCase()}</span>
        </div>
      </div>
      
      <div class="clinic-info">
        <h3 style="margin-top: 0; color: #856404;">📍 Adresse du cabinet</h3>
        <p style="margin: 5px 0;"><strong>Cité 109, Daboussy El Achour, Alger</strong></p>
        <p style="margin: 5px 0;">📞 Téléphone : +213 555 123 456</p>
      </div>
      
      <h3>Rappels importants</h3>
      <ul>
        <li>Merci d'arriver 10 minutes avant l'heure de votre rendez-vous</li>
        <li>N'oubliez pas d'apporter votre carte d'assurance maladie</li>
        <li>En cas d'empêchement, merci de nous prévenir au moins 24h à l'avance</li>
      </ul>
      
      <div class="buttons">
        <a href="https://maps.google.com/?q=Cité+109+Daboussy+El+Achour+Alger" class="button button-primary">
          Voir sur la carte
        </a>
        <a href="mailto:contact@nova-dental.dz?subject=Annulation RDV ${data.appointment_id.substring(0, 8)}" class="button button-secondary">
          Annuler le RDV
        </a>
      </div>
    </div>
    
    <div class="footer">
      <p>Cabinet Dentaire NOVA - Cité 109, Daboussy El Achour, Alger</p>
      <p>© 2025 NOVA. Tous droits réservés.</p>
      <p style="margin-top: 10px; font-size: 12px;">
        Cet email est un message transactionnel concernant votre rendez-vous.
      </p>
    </div>
  </div>
</body>
</html>
    `;
  }

  /**
   * Generate appointment confirmation text
   */
  private generateAppointmentText(data: AppointmentEmailData): string {
    const appointmentDate = new Date(data.start_at);
    const formattedDate = appointmentDate.toLocaleDateString('fr-FR');
    const formattedTime = appointmentDate.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });

    return `
Cabinet Dentaire NOVA
Confirmation de votre rendez-vous

Bonjour ${data.patient_name},

Votre rendez-vous est confirmé :
- Date : ${formattedDate}
- Heure : ${formattedTime}
- Type de soin : ${data.care_type}
${data.reason ? `- Motif : ${data.reason}` : ''}
- Référence : ${data.appointment_id.substring(0, 8).toUpperCase()}

Adresse du cabinet :
Cité 109, Daboussy El Achour, Alger
Téléphone : +213 555 123 456

Rappels importants :
- Arrivez 10 minutes avant l'heure
- Apportez votre carte d'assurance
- Prévenez-nous 24h à l'avance en cas d'empêchement

Cabinet Dentaire NOVA
Excellence en soins dentaires
    `;
  }

  /**
   * Generate OTP HTML email
   */
  private generateOtpHtml(otp: string): string {
    return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
    .container { max-width: 500px; margin: 0 auto; background: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .header { text-align: center; margin-bottom: 30px; }
    .logo { font-size: 40px; margin-bottom: 10px; }
    .otp-box { background: #f8f9fa; border: 2px solid #0066FF; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0; }
    .otp-code { font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #0066FF; }
    .footer { text-align: center; color: #666; font-size: 14px; margin-top: 30px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">🦷</div>
      <h1 style="color: #0066FF; margin: 0;">Cabinet NOVA</h1>
    </div>
    
    <h2>Code de vérification</h2>
    <p>Voici votre code de vérification pour vous connecter :</p>
    
    <div class="otp-box">
      <div class="otp-code">${otp}</div>
    </div>
    
    <p><strong>Ce code expire dans 5 minutes.</strong></p>
    <p>Si vous n'avez pas demandé ce code, ignorez cet email.</p>
    
    <div class="footer">
      <p>Cabinet Dentaire NOVA<br>
      Cité 109, Daboussy El Achour, Alger</p>
    </div>
  </div>
</body>
</html>
    `;
  }

  /**
   * Generate OTP text email
   */
  private generateOtpText(otp: string): string {
    return `
Cabinet NOVA - Code de vérification

Votre code de vérification : ${otp}

Ce code expire dans 5 minutes.

Si vous n'avez pas demandé ce code, ignorez cet email.

Cabinet Dentaire NOVA
Cité 109, Daboussy El Achour, Alger
    `;
  }

  /**
   * Log email in database
   */
  private async logEmail(
    userId: string,
    toEmail: string,
    subject: string,
    templateName: string,
    messageId: string | null,
    status: string,
    errorMessage?: string
  ): Promise<void> {
    try {
      await supabase
        .from('email_logs')
        .insert({
          user_id: userId,
          to_email: toEmail,
          subject,
          template_name: templateName,
          message_id: messageId,
          status,
          error_message: errorMessage,
          metadata: {
            provider: 'IONOS',
            timestamp: new Date().toISOString()
          }
        });
    } catch (error) {
      console.error('Email logging error:', error);
    }
  }
}