/**
 * Edge-compatible Authentication Service
 * Uses jose instead of jsonwebtoken for Edge Runtime compatibility
 */

import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { parsePhoneNumber } from 'libphonenumber-js';
import { v4 as uuidv4 } from 'uuid';
import { signToken, verifyToken, TokenPayload } from '@/lib/auth/jwt-edge';

// Types
export interface Patient {
  id: string;
  name: string;
  email: string;
  phone_e164: string;
  created_at: Date;
  updated_at: Date;
  email_verified: boolean;
  phone_verified: boolean;
  account_status: 'ACTIVE' | 'SUSPENDED' | 'PENDING_VERIFICATION';
}

export interface AuthSession {
  id: string;
  patient_id: string;
  token: string;
  expires_at: Date;
  created_at: Date;
  ip_address?: string;
  user_agent?: string;
  is_active: boolean;
}

export interface OTPRecord {
  id: string;
  email: string;
  code: string;
  expires_at: Date;
  attempts: number;
  created_at: Date;
  verified: boolean;
  purpose: 'SIGN_IN' | 'SIGN_UP' | 'EMAIL_VERIFICATION' | 'PASSWORD_RESET';
}

export interface GDPRConsent {
  id: string;
  patient_id: string;
  data_processing: {
    consent: boolean;
    timestamp: Date;
    ip_address?: string;
  };
  marketing_emails: {
    consent: boolean;
    timestamp: Date;
  };
  transactional_emails: {
    consent: boolean;
    timestamp: Date;
  };
  created_at: Date;
  updated_at: Date;
}

export interface AuthResult {
  success: boolean;
  patient?: Patient;
  session?: AuthSession;
  error?: string;
  requires_verification?: boolean;
  otp_sent?: boolean;
}

export interface OTPValidationResult {
  valid: boolean;
  expired?: boolean;
  max_attempts_reached?: boolean;
  remaining_attempts?: number;
  error?: string;
}

/**
 * OTP Service for secure code generation and validation
 */
export class OTPService {
  private static readonly OTP_LENGTH = 6;
  private static readonly OTP_EXPIRY_MINUTES = 5;
  private static readonly MAX_ATTEMPTS = 3;
  private static readonly RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute

  private otpStore: Map<string, OTPRecord> = new Map();
  private rateLimitStore: Map<string, { count: number; resetTime: number }> = new Map();

  /**
   * Generate cryptographically secure OTP
   */
  generateOTP(): string {
    const buffer = crypto.randomBytes(4);
    const num = buffer.readUInt32BE(0);
    return (num % 1000000).toString().padStart(OTPService.OTP_LENGTH, '0');
  }

  /**
   * Create and store OTP record
   */
  async createOTP(
    email: string, 
    purpose: OTPRecord['purpose'] = 'SIGN_IN'
  ): Promise<{ code: string; expires_at: Date } | { error: string }> {
    // Check rate limiting
    const rateLimitKey = `otp_${email}`;
    const rateLimit = this.rateLimitStore.get(rateLimitKey);
    const now = Date.now();

    if (rateLimit && now < rateLimit.resetTime) {
      if (rateLimit.count >= 1) {
        return { error: 'Rate limit exceeded. Please wait before requesting another code.' };
      }
    } else {
      // Reset rate limit window
      this.rateLimitStore.set(rateLimitKey, {
        count: 0,
        resetTime: now + OTPService.RATE_LIMIT_WINDOW
      });
    }

    // Generate new OTP
    const code = this.generateOTP();
    const expires_at = new Date(Date.now() + OTPService.OTP_EXPIRY_MINUTES * 60 * 1000);
    
    // Store OTP record
    const otpRecord: OTPRecord = {
      id: uuidv4(),
      email: email.toLowerCase().trim(),
      code,
      expires_at,
      attempts: 0,
      created_at: new Date(),
      verified: false,
      purpose
    };

    // Clean up old OTPs for this email
    const existingKeys = Array.from(this.otpStore.keys());
    for (const key of existingKeys) {
      const record = this.otpStore.get(key);
      if (record && record.email === otpRecord.email) {
        this.otpStore.delete(key);
      }
    }

    this.otpStore.set(otpRecord.id, otpRecord);

    // Update rate limit
    const currentRateLimit = this.rateLimitStore.get(rateLimitKey);
    if (currentRateLimit) {
      currentRateLimit.count++;
    }

    return { code, expires_at };
  }

  /**
   * Validate OTP with constant-time comparison
   */
  async validateOTP(email: string, inputCode: string): Promise<OTPValidationResult> {
    const normalizedEmail = email.toLowerCase().trim();
    
    // Find active OTP for email
    let activeOTP: OTPRecord | undefined;
    for (const record of this.otpStore.values()) {
      if (record.email === normalizedEmail && !record.verified) {
        if (!activeOTP || record.created_at > activeOTP.created_at) {
          activeOTP = record;
        }
      }
    }

    if (!activeOTP) {
      return { valid: false, error: 'No active verification code found' };
    }

    // Check expiry
    if (new Date() > activeOTP.expires_at) {
      return { valid: false, expired: true, error: 'Verification code has expired' };
    }

    // Check max attempts
    if (activeOTP.attempts >= OTPService.MAX_ATTEMPTS) {
      return { 
        valid: false, 
        max_attempts_reached: true, 
        error: 'Maximum verification attempts exceeded' 
      };
    }

    // Increment attempt count
    activeOTP.attempts++;

    // Constant-time comparison to prevent timing attacks
    const isValid = this.constantTimeCompare(inputCode, activeOTP.code);

    if (isValid) {
      activeOTP.verified = true;
      return { valid: true };
    } else {
      const remainingAttempts = OTPService.MAX_ATTEMPTS - activeOTP.attempts;
      return { 
        valid: false, 
        remaining_attempts: remainingAttempts,
        error: `Invalid code. ${remainingAttempts} attempts remaining.`
      };
    }
  }

  /**
   * Constant-time string comparison to prevent timing attacks
   */
  private constantTimeCompare(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false;
    }

    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }

    return result === 0;
  }

  /**
   * Clean up expired OTP records
   */
  cleanupExpiredOTPs(): number {
    const now = new Date();
    let cleaned = 0;

    for (const [id, record] of this.otpStore.entries()) {
      if (record.expires_at < now) {
        this.otpStore.delete(id);
        cleaned++;
      }
    }

    return cleaned;
  }

  /**
   * Get OTP statistics for monitoring
   */
  getOTPStats(): {
    active_otps: number;
    expired_otps: number;
    rate_limited_emails: number;
  } {
    const now = new Date();
    let active = 0;
    let expired = 0;

    for (const record of this.otpStore.values()) {
      if (record.expires_at > now && !record.verified) {
        active++;
      } else {
        expired++;
      }
    }

    const rateLimited = Array.from(this.rateLimitStore.values())
      .filter(limit => Date.now() < limit.resetTime && limit.count >= 1)
      .length;

    return {
      active_otps: active,
      expired_otps: expired,
      rate_limited_emails: rateLimited
    };
  }
}

/**
 * Main Authentication Service (Edge-compatible)
 */
export class AuthService {
  private otpService: OTPService;
  private patientStore: Map<string, Patient> = new Map();
  private sessionStore: Map<string, AuthSession> = new Map();
  private consentStore: Map<string, GDPRConsent> = new Map();
  private emailIndex: Map<string, string> = new Map(); // email -> patient_id

  private readonly SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours

  constructor() {
    this.otpService = new OTPService();
    
    // Auto-cleanup expired sessions every hour
    if (typeof window === 'undefined') {
      setInterval(() => {
        this.cleanupExpiredSessions();
        this.otpService.cleanupExpiredOTPs();
      }, 60 * 60 * 1000);
    }
  }

  /**
   * Check if patient account exists by email
   */
  async checkAccountExists(email: string): Promise<{ exists: boolean; patient?: Patient }> {
    const normalizedEmail = email.toLowerCase().trim();
    const patientId = this.emailIndex.get(normalizedEmail);
    
    if (patientId) {
      const patient = this.patientStore.get(patientId);
      return { exists: true, patient };
    }
    
    return { exists: false };
  }

  /**
   * Create new patient account
   */
  async createPatient(
    name: string,
    email: string,
    phone_e164: string,
    gdprConsent: Partial<GDPRConsent>
  ): Promise<{ patient: Patient; consent: GDPRConsent } | { error: string }> {
    const normalizedEmail = email.toLowerCase().trim();
    
    // Check if email already exists
    if (this.emailIndex.has(normalizedEmail)) {
      return { error: 'Account with this email already exists' };
    }

    // Validate phone number
    try {
      const phoneNumber = parsePhoneNumber(phone_e164);
      if (!phoneNumber.isValid() || phoneNumber.country !== 'DZ') {
        return { error: 'Invalid Algerian phone number' };
      }
    } catch {
      return { error: 'Invalid phone number format' };
    }

    // Create patient record
    const patient: Patient = {
      id: uuidv4(),
      name: name.trim(),
      email: normalizedEmail,
      phone_e164,
      created_at: new Date(),
      updated_at: new Date(),
      email_verified: false,
      phone_verified: false,
      account_status: 'PENDING_VERIFICATION'
    };

    // Create GDPR consent record
    const consent: GDPRConsent = {
      id: uuidv4(),
      patient_id: patient.id,
      data_processing: gdprConsent.data_processing || {
        consent: false,
        timestamp: new Date()
      },
      marketing_emails: gdprConsent.marketing_emails || {
        consent: false,
        timestamp: new Date()
      },
      transactional_emails: gdprConsent.transactional_emails || {
        consent: false,
        timestamp: new Date()
      },
      created_at: new Date(),
      updated_at: new Date()
    };

    // Store records
    this.patientStore.set(patient.id, patient);
    this.consentStore.set(consent.id, consent);
    this.emailIndex.set(normalizedEmail, patient.id);

    return { patient, consent };
  }

  /**
   * Initiate sign-in process with OTP
   */
  async initiateSignIn(email: string): Promise<{
    otp_sent: boolean;
    expires_at?: Date;
    error?: string;
  }> {
    const accountCheck = await this.checkAccountExists(email);
    
    if (!accountCheck.exists) {
      return { otp_sent: false, error: 'No account found with this email' };
    }

    const otpResult = await this.otpService.createOTP(email, 'SIGN_IN');
    
    if ('error' in otpResult) {
      return { otp_sent: false, error: otpResult.error };
    }

    // Here you would integrate with email service to send OTP
    // For now, we'll just return success
    return { otp_sent: true, expires_at: otpResult.expires_at };
  }

  /**
   * Complete sign-in with OTP verification
   */
  async completeSignIn(
    email: string, 
    otpCode: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<AuthResult> {
    // Validate OTP
    const otpValidation = await this.otpService.validateOTP(email, otpCode);
    
    if (!otpValidation.valid) {
      return { 
        success: false, 
        error: otpValidation.error || 'Invalid verification code'
      };
    }

    // Get patient record
    const accountCheck = await this.checkAccountExists(email);
    if (!accountCheck.exists || !accountCheck.patient) {
      return { success: false, error: 'Account not found' };
    }

    const patient = accountCheck.patient;

    // Mark email as verified
    patient.email_verified = true;
    patient.account_status = 'ACTIVE';
    patient.updated_at = new Date();

    // Create session
    const session = await this.createSession(patient.id, ipAddress, userAgent);

    return { success: true, patient, session };
  }

  /**
   * Create authenticated session with Edge-compatible JWT
   */
  async createSession(
    patientId: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<AuthSession> {
    // Invalidate existing sessions for this patient
    await this.invalidatePatientSessions(patientId);

    // Generate JWT token using jose
    const payload: TokenPayload = {
      patient_id: patientId,
      issued_at: Date.now(),
      exp: Math.floor((Date.now() + this.SESSION_DURATION) / 1000)
    };

    const token = await signToken(payload);

    // Create session record
    const session: AuthSession = {
      id: uuidv4(),
      patient_id: patientId,
      token,
      expires_at: new Date(Date.now() + this.SESSION_DURATION),
      created_at: new Date(),
      ip_address: ipAddress,
      user_agent: userAgent,
      is_active: true
    };

    this.sessionStore.set(session.id, session);
    return session;
  }

  /**
   * Validate session token using jose
   */
  async validateSession(token: string): Promise<{
    valid: boolean;
    patient?: Patient;
    session?: AuthSession;
    error?: string;
  }> {
    try {
      // Verify JWT token using jose
      const payload = await verifyToken(token);
      
      if (!payload) {
        return { valid: false, error: 'Invalid token' };
      }
      
      // Find session
      let foundSession: AuthSession | undefined;
      for (const session of this.sessionStore.values()) {
        if (session.token === token && session.patient_id === payload.patient_id) {
          foundSession = session;
          break;
        }
      }

      if (!foundSession || !foundSession.is_active) {
        return { valid: false, error: 'Session not found or inactive' };
      }

      // Check expiry
      if (new Date() > foundSession.expires_at) {
        foundSession.is_active = false;
        return { valid: false, error: 'Session expired' };
      }

      // Get patient
      const patient = this.patientStore.get(foundSession.patient_id);
      if (!patient) {
        return { valid: false, error: 'Patient not found' };
      }

      return { valid: true, patient, session: foundSession };
    } catch {
      return { valid: false, error: 'Invalid token' };
    }
  }

  /**
   * Invalidate specific session
   */
  async invalidateSession(sessionId: string): Promise<boolean> {
    const session = this.sessionStore.get(sessionId);
    if (session) {
      session.is_active = false;
      return true;
    }
    return false;
  }

  /**
   * Invalidate all sessions for a patient
   */
  async invalidatePatientSessions(patientId: string): Promise<number> {
    let invalidated = 0;
    
    for (const session of this.sessionStore.values()) {
      if (session.patient_id === patientId && session.is_active) {
        session.is_active = false;
        invalidated++;
      }
    }
    
    return invalidated;
  }

  /**
   * Update GDPR consent for patient
   */
  async updateGDPRConsent(
    patientId: string,
    consentUpdates: Partial<GDPRConsent>,
    ipAddress?: string
  ): Promise<{ consent: GDPRConsent } | { error: string }> {
    // Find existing consent record
    let existingConsent: GDPRConsent | undefined;
    for (const consent of this.consentStore.values()) {
      if (consent.patient_id === patientId) {
        existingConsent = consent;
        break;
      }
    }

    if (!existingConsent) {
      return { error: 'Consent record not found' };
    }

    // Update consent with timestamp and IP
    const now = new Date();
    const updatedConsent: GDPRConsent = {
      ...existingConsent,
      ...consentUpdates,
      updated_at: now
    };

    // Add IP address to new consents
    if (consentUpdates.data_processing?.consent) {
      updatedConsent.data_processing = {
        ...updatedConsent.data_processing,
        timestamp: now,
        ip_address: ipAddress
      };
    }

    if (consentUpdates.marketing_emails?.consent !== undefined) {
      updatedConsent.marketing_emails = {
        ...updatedConsent.marketing_emails,
        timestamp: now
      };
    }

    if (consentUpdates.transactional_emails?.consent !== undefined) {
      updatedConsent.transactional_emails = {
        ...updatedConsent.transactional_emails,
        timestamp: now
      };
    }

    this.consentStore.set(existingConsent.id, updatedConsent);
    return { consent: updatedConsent };
  }

  /**
   * Get GDPR consent status for patient
   */
  async getGDPRConsent(patientId: string): Promise<GDPRConsent | null> {
    for (const consent of this.consentStore.values()) {
      if (consent.patient_id === patientId) {
        return consent;
      }
    }
    return null;
  }

  /**
   * Clean up expired sessions
   */
  private cleanupExpiredSessions(): number {
    const now = new Date();
    let cleaned = 0;

    for (const [id, session] of this.sessionStore.entries()) {
      if (session.expires_at < now) {
        this.sessionStore.delete(id);
        cleaned++;
      }
    }

    return cleaned;
  }

  /**
   * Get authentication statistics
   */
  getAuthStats(): {
    total_patients: number;
    active_sessions: number;
    verified_emails: number;
    gdpr_consents: number;
    otp_stats: ReturnType<OTPService['getOTPStats']>;
  } {
    const verifiedEmails = Array.from(this.patientStore.values())
      .filter(p => p.email_verified).length;

    const activeSessions = Array.from(this.sessionStore.values())
      .filter(s => s.is_active && new Date() < s.expires_at).length;

    const gdprConsents = Array.from(this.consentStore.values())
      .filter(c => c.data_processing.consent).length;

    return {
      total_patients: this.patientStore.size,
      active_sessions: activeSessions,
      verified_emails: verifiedEmails,
      gdpr_consents: gdprConsents,
      otp_stats: this.otpService.getOTPStats()
    };
  }

  /**
   * Export patient data for GDPR compliance
   */
  async exportPatientData(patientId: string): Promise<{
    patient: Patient;
    consent: GDPRConsent | null;
    sessions: AuthSession[];
  } | { error: string }> {
    const patient = this.patientStore.get(patientId);
    if (!patient) {
      return { error: 'Patient not found' };
    }

    const consent = await this.getGDPRConsent(patientId);
    const sessions = Array.from(this.sessionStore.values())
      .filter(s => s.patient_id === patientId);

    return { patient, consent, sessions };
  }

  /**
   * Delete patient data for GDPR compliance
   */
  async deletePatientData(patientId: string): Promise<{ deleted: boolean; error?: string }> {
    const patient = this.patientStore.get(patientId);
    if (!patient) {
      return { deleted: false, error: 'Patient not found' };
    }

    // Remove from all stores
    this.patientStore.delete(patientId);
    this.emailIndex.delete(patient.email);
    
    // Remove consent records
    for (const [id, consent] of this.consentStore.entries()) {
      if (consent.patient_id === patientId) {
        this.consentStore.delete(id);
      }
    }

    // Remove sessions
    for (const [id, session] of this.sessionStore.entries()) {
      if (session.patient_id === patientId) {
        this.sessionStore.delete(id);
      }
    }

    return { deleted: true };
  }
}

// Export singleton instance
let sharedAuthService: AuthService | null = null;

export function getAuthService(): AuthService {
  if (!sharedAuthService) {
    sharedAuthService = new AuthService();
  }
  return sharedAuthService;
}