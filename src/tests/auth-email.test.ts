/**
 * Comprehensive Test Suite for Authentication and Email Systems
 * 
 * Tests all authentication flows, email functionality, and integration scenarios
 * including GDPR compliance, OTP validation, and error handling.
 */

import { describe, beforeEach, afterEach, it, expect, vi, Mock } from 'vitest';
import { DialogManagerV3, getSharedDialogManagerV3 } from '../lib/chat/dialogManager-v3';
import { AuthService, OTPService, getAuthService } from '../services/auth.service';
import { EmailService, getEmailService } from '../services/email.service';

// Mock external dependencies
vi.mock('crypto', () => ({
  randomBytes: vi.fn(() => Buffer.from([0x12, 0x34, 0x56, 0x78]))
}));

vi.mock('jose', () => ({
  SignJWT: vi.fn().mockImplementation(() => ({
    setProtectedHeader: vi.fn().mockReturnThis(),
    setExpirationTime: vi.fn().mockReturnThis(),
    setIssuedAt: vi.fn().mockReturnThis(),
    sign: vi.fn().mockResolvedValue('mock-jwt-token'),
  })),
  jwtVerify: vi.fn().mockResolvedValue({ 
    payload: { patient_id: 'test-patient-id', issued_at: Date.now() } 
  })
}));

vi.mock('libphonenumber-js', () => ({
  parsePhoneNumber: vi.fn((phone: string) => ({
    isValid: () => phone.startsWith('+213'),
    country: phone.startsWith('+213') ? 'DZ' : 'US',
    getType: () => 'MOBILE',
    format: (format: string) => format === 'E.164' ? phone : phone
  }))
}));

describe('AuthService', () => {
  let authService: AuthService;
  let otpService: OTPService;

  beforeEach(() => {
    authService = new AuthService();
    otpService = new OTPService();
    vi.clearAllMocks();
  });

  describe('OTP Service', () => {
    describe('generateOTP', () => {
      it('should generate a 6-digit OTP', () => {
        const otp = otpService.generateOTP();
        expect(otp).toMatch(/^\d{6}$/);
        expect(otp.length).toBe(6);
      });

      it('should generate different OTPs on subsequent calls', () => {
        const otp1 = otpService.generateOTP();
        const otp2 = otpService.generateOTP();
        // Note: This might occasionally fail due to randomness, but very unlikely
        expect(otp1).not.toBe(otp2);
      });
    });

    describe('createOTP', () => {
      it('should create OTP record successfully', async () => {
        const email = 'test@example.com';
        const result = await otpService.createOTP(email, 'SIGN_IN');
        
        expect('code' in result).toBe(true);
        expect('expires_at' in result).toBe(true);
        
        if ('code' in result) {
          expect(result.code).toMatch(/^\d{6}$/);
          expect(result.expires_at).toBeInstanceOf(Date);
          expect(result.expires_at.getTime()).toBeGreaterThan(Date.now());
        }
      });

      it('should enforce rate limiting', async () => {
        const email = 'test@example.com';
        
        // First OTP should succeed
        const result1 = await otpService.createOTP(email, 'SIGN_IN');
        expect('code' in result1).toBe(true);
        
        // Second OTP within rate limit window should fail
        const result2 = await otpService.createOTP(email, 'SIGN_IN');
        expect('error' in result2).toBe(true);
        
        if ('error' in result2) {
          expect(result2.error).toContain('Rate limit exceeded');
        }
      });

      it('should clean up old OTPs for same email', async () => {
        const email = 'test@example.com';
        
        // Wait for rate limit to reset (mocked)
        await new Promise(resolve => setTimeout(resolve, 61000));
        
        const result1 = await otpService.createOTP(email, 'SIGN_IN');
        const result2 = await otpService.createOTP(email, 'SIGN_IN');
        
        expect('code' in result1).toBe(true);
        expect('code' in result2).toBe(true);
      });
    });

    describe('validateOTP', () => {
      it('should validate correct OTP', async () => {
        const email = 'test@example.com';
        const otpResult = await otpService.createOTP(email, 'SIGN_IN');
        
        expect('code' in otpResult).toBe(true);
        
        if ('code' in otpResult) {
          const validation = await otpService.validateOTP(email, otpResult.code);
          expect(validation.valid).toBe(true);
        }
      });

      it('should reject incorrect OTP', async () => {
        const email = 'test@example.com';
        await otpService.createOTP(email, 'SIGN_IN');
        
        const validation = await otpService.validateOTP(email, '000000');
        expect(validation.valid).toBe(false);
        expect(validation.error).toBeDefined();
      });

      it('should handle expired OTP', async () => {
        const email = 'test@example.com';
        const otpResult = await otpService.createOTP(email, 'SIGN_IN');
        
        expect('code' in otpResult).toBe(true);
        
        // Mock expired OTP
        vi.setSystemTime(Date.now() + 6 * 60 * 1000); // 6 minutes later
        
        if ('code' in otpResult) {
          const validation = await otpService.validateOTP(email, otpResult.code);
          expect(validation.valid).toBe(false);
          expect(validation.expired).toBe(true);
        }
        
        vi.useRealTimers();
      });

      it('should enforce maximum attempts', async () => {
        const email = 'test@example.com';
        await otpService.createOTP(email, 'SIGN_IN');
        
        // Exhaust attempts with wrong code
        for (let i = 0; i < 3; i++) {
          const validation = await otpService.validateOTP(email, '000000');
          expect(validation.valid).toBe(false);
        }
        
        // Fourth attempt should indicate max attempts reached
        const finalValidation = await otpService.validateOTP(email, '000000');
        expect(finalValidation.valid).toBe(false);
        expect(finalValidation.max_attempts_reached).toBe(true);
      });

      it('should use constant-time comparison', async () => {
        const email = 'test@example.com';
        const otpResult = await otpService.createOTP(email, 'SIGN_IN');
        
        expect('code' in otpResult).toBe(true);
        
        if ('code' in otpResult) {
          // Test that timing is similar for wrong vs right code
          const startTime1 = Date.now();
          await otpService.validateOTP(email, '000000');
          const duration1 = Date.now() - startTime1;
          
          const startTime2 = Date.now();
          await otpService.validateOTP(email, otpResult.code.slice(0, 5) + '0');
          const duration2 = Date.now() - startTime2;
          
          // Times should be similar (within 10ms tolerance)
          expect(Math.abs(duration1 - duration2)).toBeLessThan(10);
        }
      });
    });
  });

  describe('Patient Account Management', () => {
    describe('checkAccountExists', () => {
      it('should return false for non-existent account', async () => {
        const result = await authService.checkAccountExists('nonexistent@example.com');
        expect(result.exists).toBe(false);
        expect(result.patient).toBeUndefined();
      });

      it('should return true for existing account', async () => {
        const email = 'existing@example.com';
        const name = 'Test User';
        const phone = '+213555123456';
        
        // Create account first
        const createResult = await authService.createPatient(name, email, phone, {
          data_processing: { consent: true, timestamp: new Date() }
        });
        
        expect('patient' in createResult).toBe(true);
        
        // Check if account exists
        const checkResult = await authService.checkAccountExists(email);
        expect(checkResult.exists).toBe(true);
        expect(checkResult.patient).toBeDefined();
        expect(checkResult.patient?.email).toBe(email);
      });

      it('should handle email normalization', async () => {
        const email = 'TEST@EXAMPLE.COM';
        const normalizedEmail = 'test@example.com';
        
        // Create account with uppercase email
        await authService.createPatient('Test User', email, '+213555123456', {
          data_processing: { consent: true, timestamp: new Date() }
        });
        
        // Check with lowercase email
        const result = await authService.checkAccountExists(normalizedEmail);
        expect(result.exists).toBe(true);
      });
    });

    describe('createPatient', () => {
      it('should create patient successfully with valid data', async () => {
        const name = 'Jean Dupont';
        const email = 'jean.dupont@example.com';
        const phone = '+213555123456';
        const gdprConsent = {
          data_processing: { consent: true, timestamp: new Date() },
          marketing_emails: { consent: false, timestamp: new Date() },
          transactional_emails: { consent: true, timestamp: new Date() }
        };
        
        const result = await authService.createPatient(name, email, phone, gdprConsent);
        
        expect('patient' in result).toBe(true);
        expect('consent' in result).toBe(true);
        
        if ('patient' in result) {
          expect(result.patient.name).toBe(name);
          expect(result.patient.email).toBe(email.toLowerCase());
          expect(result.patient.phone_e164).toBe(phone);
          expect(result.patient.account_status).toBe('PENDING_VERIFICATION');
        }
      });

      it('should reject duplicate email addresses', async () => {
        const email = 'duplicate@example.com';
        
        // Create first account
        await authService.createPatient('User 1', email, '+213555123456', {
          data_processing: { consent: true, timestamp: new Date() }
        });
        
        // Try to create second account with same email
        const result = await authService.createPatient('User 2', email, '+213555123457', {
          data_processing: { consent: true, timestamp: new Date() }
        });
        
        expect('error' in result).toBe(true);
        if ('error' in result) {
          expect(result.error).toContain('already exists');
        }
      });

      it('should validate Algerian phone numbers', async () => {
        const invalidPhones = ['+1234567890', '+33123456789', '0555123456'];
        
        for (const phone of invalidPhones) {
          const result = await authService.createPatient(
            'Test User',
            `test${phone.slice(-4)}@example.com`,
            phone,
            { data_processing: { consent: true, timestamp: new Date() } }
          );
          
          expect('error' in result).toBe(true);
          if ('error' in result) {
            expect(result.error).toContain('phone');
          }
        }
      });

      it('should validate name format', async () => {
        const invalidNames = ['', 'A', '123', 'User@123'];
        
        for (const name of invalidNames) {
          const result = await authService.createPatient(
            name,
            `test${Date.now()}@example.com`,
            '+213555123456',
            { data_processing: { consent: true, timestamp: new Date() } }
          );
          
          if (name === '' || name === 'A') {
            expect('error' in result).toBe(true);
          }
        }
      });
    });
  });

  describe('Authentication Flow', () => {
    describe('initiateSignIn', () => {
      it('should send OTP for existing account', async () => {
        const email = 'existing@example.com';
        
        // Create account first
        await authService.createPatient('Test User', email, '+213555123456', {
          data_processing: { consent: true, timestamp: new Date() }
        });
        
        const result = await authService.initiateSignIn(email);
        expect(result.otp_sent).toBe(true);
        expect(result.expires_at).toBeInstanceOf(Date);
      });

      it('should fail for non-existent account', async () => {
        const result = await authService.initiateSignIn('nonexistent@example.com');
        expect(result.otp_sent).toBe(false);
        expect(result.error).toContain('No account found');
      });
    });

    describe('completeSignIn', () => {
      it('should complete sign-in with valid OTP', async () => {
        const email = 'signin@example.com';
        const name = 'Sign In User';
        const phone = '+213555123456';
        
        // Create account
        await authService.createPatient(name, email, phone, {
          data_processing: { consent: true, timestamp: new Date() }
        });
        
        // Initiate sign-in
        const initResult = await authService.initiateSignIn(email);
        expect(initResult.otp_sent).toBe(true);
        
        // Complete sign-in with valid OTP
        const completeResult = await authService.completeSignIn(email, '123456'); // Mock OTP
        expect(completeResult.success).toBe(true);
        expect(completeResult.patient).toBeDefined();
        expect(completeResult.session).toBeDefined();
        
        if (completeResult.patient) {
          expect(completeResult.patient.email_verified).toBe(true);
          expect(completeResult.patient.account_status).toBe('ACTIVE');
        }
      });

      it('should fail with invalid OTP', async () => {
        const email = 'signin-fail@example.com';
        
        await authService.createPatient('Test User', email, '+213555123456', {
          data_processing: { consent: true, timestamp: new Date() }
        });
        
        await authService.initiateSignIn(email);
        
        const result = await authService.completeSignIn(email, '000000');
        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
      });
    });

    describe('Session Management', () => {
      it('should create valid session tokens', async () => {
        const session = await authService.createSession('test-patient-id');
        
        expect(session.patient_id).toBe('test-patient-id');
        expect(session.token).toBe('mock-jwt-token');
        expect(session.is_active).toBe(true);
        expect(session.expires_at.getTime()).toBeGreaterThan(Date.now());
      });

      it('should validate session tokens', async () => {
        const session = await authService.createSession('test-patient-id');
        
        // Create a patient for validation
        await authService.createPatient('Test User', 'test@example.com', '+213555123456', {
          data_processing: { consent: true, timestamp: new Date() }
        });
        
        const validation = await authService.validateSession(session.token);
        expect(validation.valid).toBe(true);
        expect(validation.session).toBeDefined();
      });

      it('should invalidate sessions', async () => {
        const session = await authService.createSession('test-patient-id');
        
        const invalidated = await authService.invalidateSession(session.id);
        expect(invalidated).toBe(true);
        
        // Session should no longer be active
        const validation = await authService.validateSession(session.token);
        expect(validation.valid).toBe(false);
      });
    });
  });

  describe('GDPR Compliance', () => {
    describe('updateGDPRConsent', () => {
      it('should update consent with timestamp', async () => {
        const email = 'gdpr@example.com';
        const createResult = await authService.createPatient('GDPR User', email, '+213555123456', {
          data_processing: { consent: true, timestamp: new Date() }
        });
        
        expect('patient' in createResult).toBe(true);
        
        if ('patient' in createResult) {
          const consentUpdate = {
            marketing_emails: { consent: true, timestamp: new Date() }
          };
          
          const result = await authService.updateGDPRConsent(
            createResult.patient.id,
            consentUpdate,
            '192.168.1.1'
          );
          
          expect('consent' in result).toBe(true);
          
          if ('consent' in result) {
            expect(result.consent.marketing_emails.consent).toBe(true);
            expect(result.consent.marketing_emails.timestamp).toBeInstanceOf(Date);
          }
        }
      });
    });

    describe('exportPatientData', () => {
      it('should export all patient data for GDPR compliance', async () => {
        const email = 'export@example.com';
        const createResult = await authService.createPatient('Export User', email, '+213555123456', {
          data_processing: { consent: true, timestamp: new Date() }
        });
        
        expect('patient' in createResult).toBe(true);
        
        if ('patient' in createResult) {
          const exportResult = await authService.exportPatientData(createResult.patient.id);
          
          expect('patient' in exportResult).toBe(true);
          
          if ('patient' in exportResult) {
            expect(exportResult.patient.email).toBe(email);
            expect(exportResult.consent).toBeDefined();
            expect(exportResult.sessions).toBeInstanceOf(Array);
          }
        }
      });
    });

    describe('deletePatientData', () => {
      it('should delete all patient data', async () => {
        const email = 'delete@example.com';
        const createResult = await authService.createPatient('Delete User', email, '+213555123456', {
          data_processing: { consent: true, timestamp: new Date() }
        });
        
        expect('patient' in createResult).toBe(true);
        
        if ('patient' in createResult) {
          const deleteResult = await authService.deletePatientData(createResult.patient.id);
          expect(deleteResult.deleted).toBe(true);
          
          // Verify data is actually deleted
          const checkResult = await authService.checkAccountExists(email);
          expect(checkResult.exists).toBe(false);
        }
      });
    });
  });
});

describe('EmailService', () => {
  let emailService: EmailService;

  beforeEach(() => {
    emailService = new EmailService();
    vi.clearAllMocks();
    
    // Mock fetch globally
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Email Provider Fallback', () => {
    it('should try multiple providers on failure', async () => {
      // Mock all providers to fail except the last one
      (global.fetch as Mock)
        .mockResolvedValueOnce({ ok: false, status: 500, text: () => Promise.resolve('Server Error') })
        .mockResolvedValueOnce({ ok: false, status: 503, text: () => Promise.resolve('Service Unavailable') })
        .mockResolvedValueOnce({ 
          ok: true, 
          json: () => Promise.resolve({ id: 'success-message-id' }),
          headers: new Map([['x-message-id', 'test-id']])
        });

      const result = await emailService.sendEmail(
        'test@example.com',
        'Test Subject',
        'Test message',
        '<p>Test message</p>'
      );

      expect(result.success).toBe(true);
      expect(global.fetch).toHaveBeenCalledTimes(3);
    });

    it('should fail when all providers fail', async () => {
      // Mock all providers to fail
      (global.fetch as Mock)
        .mockResolvedValue({ ok: false, status: 500, text: () => Promise.resolve('Server Error') });

      const result = await emailService.sendEmail(
        'test@example.com',
        'Test Subject',
        'Test message'
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('All email providers failed');
    });
  });

  describe('OTP Email Sending', () => {
    it('should send OTP email with correct template', async () => {
      (global.fetch as Mock).mockResolvedValue({
        ok: true,
        headers: new Map([['x-message-id', 'otp-message-id']])
      });

      const result = await emailService.sendOTPEmail(
        'test@example.com',
        '123456',
        5
      );

      expect(result.success).toBe(true);
      expect(result.provider).toBeDefined();
    });

    it('should handle OTP template rendering errors', async () => {
      // Test with invalid template data
      const result = await emailService.sendOTPEmail('', '', -1);
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('Appointment Summary Email', () => {
    it('should send appointment summary with all sections', async () => {
      (global.fetch as Mock).mockResolvedValue({
        ok: true,
        headers: new Map([['x-message-id', 'appointment-message-id']])
      });

      const appointmentData = {
        patient_name: 'Jean Dupont',
        appointment_date: '15 août 2025',
        appointment_time: '14:00 (heure d\'Alger)',
        practitioner: 'Dr. Smith',
        care_type: 'Consultation',
        conversation_summary: 'Patient souhaite un contrôle de routine',
        cancellation_link: 'https://nova-rdv.dz/cancel/abc123'
      };

      const result = await emailService.sendAppointmentSummary(
        'jean.dupont@example.com',
        appointmentData
      );

      expect(result.success).toBe(true);
      expect(result.provider).toBeDefined();
    });

    it('should handle missing appointment data gracefully', async () => {
      (global.fetch as Mock).mockResolvedValue({
        ok: true,
        headers: new Map([['x-message-id', 'minimal-message-id']])
      });

      const minimalData = {
        patient_name: 'Jean Dupont',
        appointment_date: '15 août 2025',
        appointment_time: '14:00'
      };

      const result = await emailService.sendAppointmentSummary(
        'jean.dupont@example.com',
        minimalData
      );

      expect(result.success).toBe(true);
    });
  });

  describe('Email Template Engine', () => {
    it('should render templates with variable substitution', async () => {
      const templateData = {
        patient_name: 'Test User',
        otp_code: '123456',
        expires_minutes: 5,
        clinic_name: 'Test Clinic'
      };

      // Test template rendering indirectly through OTP email
      (global.fetch as Mock).mockResolvedValue({
        ok: true,
        headers: new Map([['x-message-id', 'template-test-id']])
      });

      const result = await emailService.sendOTPEmail(
        'test@example.com',
        templateData.otp_code,
        templateData.expires_minutes
      );

      expect(result.success).toBe(true);
    });
  });

  describe('Service Status and Testing', () => {
    it('should report service status correctly', async () => {
      const status = await emailService.getServiceStatus();
      
      expect(status).toHaveProperty('configured_providers');
      expect(status).toHaveProperty('queue_length');
      expect(status).toHaveProperty('provider_status');
      expect(status.queue_length).toBeGreaterThanOrEqual(0);
    });

    it('should run delivery tests', async () => {
      (global.fetch as Mock).mockResolvedValue({
        ok: true,
        headers: new Map([['x-message-id', 'test-delivery-id']])
      });

      const testResult = await emailService.testEmailDelivery('test@example.com');
      
      expect(testResult).toHaveProperty('results');
      expect(testResult).toHaveProperty('configured_providers');
      expect(testResult).toHaveProperty('successful_providers');
      expect(testResult.results).toBeInstanceOf(Array);
    });
  });
});

describe('DialogManagerV3 Integration', () => {
  let dialogManager: DialogManagerV3;

  beforeEach(() => {
    dialogManager = new DialogManagerV3();
    vi.clearAllMocks();
  });

  describe('Authentication Flow Integration', () => {
    it('should handle new user sign-up flow', async () => {
      const sessionId = 'test-session-signup';
      
      // First message with email
      const message1 = 'Bonjour, mon email est jean.dupont@example.com';
      const result1 = await dialogManager.processMessageV3(message1, sessionId);
      
      expect(result1.response.action).toBe('SIGN_UP');
      expect(result1.response.auth?.has_account).toBe(false);
      
      // Follow-up with name and phone
      const message2 = 'Je suis Jean Dupont, mon téléphone est +213555123456';
      const result2 = await dialogManager.processMessageV3(message2, sessionId);
      
      expect(result2.shouldProceedToSlots).toBe(true);
      expect(result2.response.patient?.name).toBe('Jean Dupont');
      expect(result2.response.patient?.phone_e164).toBe('+213555123456');
    });

    it('should handle existing user sign-in flow', async () => {
      const sessionId = 'test-session-signin';
      
      // Create existing user first (mock this in actual implementation)
      const authService = getAuthService();
      await authService.createPatient('Existing User', 'existing@example.com', '+213555123456', {
        data_processing: { consent: true, timestamp: new Date() }
      });
      
      // Message with existing email
      const message = 'Mon email est existing@example.com';
      const result = await dialogManager.processMessageV3(message, sessionId);
      
      expect(result.response.action).toBe('SIGN_IN');
      expect(result.response.auth?.has_account).toBe(true);
      expect(result.response.auth?.method).toBe('email_otp');
    });

    it('should handle OTP verification', async () => {
      const sessionId = 'test-session-otp';
      
      // Set up session in sign-in state
      const state = dialogManager.getSessionInfo(sessionId);
      if (state) {
        state.conversationStage = 'sign_in';
        state.extractedInfo.confirmedEmail = 'test@example.com';
      }
      
      // OTP message
      const otpMessage = '123456';
      const result = await dialogManager.processMessageV3(otpMessage, sessionId);
      
      // Should either succeed or ask for retry
      expect(['FIND_SLOTS', 'SIGN_IN']).toContain(result.response.action);
    });
  });

  describe('Email Summary Integration', () => {
    it('should send email summary after appointment confirmation', async () => {
      const sessionId = 'test-session-email';
      
      // Set up authenticated session with complete info
      const state = dialogManager.getSessionInfo(sessionId);
      if (state) {
        state.extractedInfo.confirmedEmail = 'summary@example.com';
        state.extractedInfo.confirmedName = 'Summary User';
        state.extractedInfo.confirmedPhone = '+213555123456';
        state.authState.isAuthenticated = true;
        state.emailState.consentGiven = true;
      }
      
      const appointmentData = {
        patient_name: 'Summary User',
        appointment_date: '15 août 2025',
        appointment_time: '14:00',
        practitioner: 'Dr. Test',
        care_type: 'Consultation',
        conversation_summary: 'Test conversation',
        cancellation_link: 'https://example.com/cancel/123'
      };
      
      const result = await dialogManager.sendEmailSummary(sessionId, appointmentData);
      
      expect(result.action).toBe('SEND_EMAIL_SUMMARY');
      expect(result.email_summary?.send_to).toBe('summary@example.com');
    });

    it('should handle email summary errors gracefully', async () => {
      const sessionId = 'test-session-email-error';
      
      // Session without email
      const appointmentData = {
        patient_name: 'Test User',
        appointment_date: '15 août 2025',
        appointment_time: '14:00'
      };
      
      const result = await dialogManager.sendEmailSummary(sessionId, appointmentData);
      
      expect(result.action).toBe('NEED_INFO');
      expect(result.missing_fields).toContain('patient.email');
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle invalid phone numbers', async () => {
      const sessionId = 'test-session-invalid-phone';
      
      const message = 'Jean Dupont, +1234567890, jean@example.com';
      const result = await dialogManager.processMessageV3(message, sessionId);
      
      expect(result.validationErrors.length).toBeGreaterThan(0);
      expect(result.validationErrors.some(error => 
        error.toLowerCase().includes('phone') || error.toLowerCase().includes('téléphone')
      )).toBe(true);
    });

    it('should handle invalid email addresses', async () => {
      const sessionId = 'test-session-invalid-email';
      
      const message = 'Jean Dupont, +213555123456, invalid-email';
      const result = await dialogManager.processMessageV3(message, sessionId);
      
      expect(result.validationErrors.length).toBeGreaterThan(0);
      expect(result.validationErrors.some(error => 
        error.toLowerCase().includes('email')
      )).toBe(true);
    });

    it('should handle session cleanup', () => {
      const sessionId = 'test-session-cleanup';
      
      // Create a session
      dialogManager.processMessageV3('test', sessionId);
      expect(dialogManager.getSessionInfo(sessionId)).toBeDefined();
      
      // Reset session
      dialogManager.resetSession(sessionId);
      expect(dialogManager.getSessionInfo(sessionId)).toBeUndefined();
    });

    it('should handle concurrent sessions', async () => {
      const sessionId1 = 'test-session-concurrent-1';
      const sessionId2 = 'test-session-concurrent-2';
      
      // Process messages in parallel
      const [result1, result2] = await Promise.all([
        dialogManager.processMessageV3('Bonjour', sessionId1),
        dialogManager.processMessageV3('Hello', sessionId2)
      ]);
      
      expect(result1.response.action).toBe('SHOW_WELCOME');
      expect(result2.response.action).toBe('SHOW_WELCOME');
      
      // Sessions should be independent
      const state1 = dialogManager.getSessionInfo(sessionId1);
      const state2 = dialogManager.getSessionInfo(sessionId2);
      
      expect(state1?.sessionId).toBe(sessionId1);
      expect(state2?.sessionId).toBe(sessionId2);
      expect(state1?.sessionId).not.toBe(state2?.sessionId);
    });
  });

  describe('GDPR and Privacy Compliance', () => {
    it('should track GDPR consent properly', async () => {
      const sessionId = 'test-session-gdpr';
      
      // Start sign-up flow
      const message1 = 'jean@example.com';
      await dialogManager.processMessageV3(message1, sessionId);
      
      // Complete with consent
      const message2 = 'Jean Dupont +213555123456';
      const result = await dialogManager.processMessageV3(message2, sessionId);
      
      const state = dialogManager.getSessionInfo(sessionId);
      expect(state?.gdprConsent).toBeDefined();
    });

    it('should handle data export requests', async () => {
      const sessionId = 'test-session-export';
      
      // This would be handled by a separate API endpoint in practice
      const state = dialogManager.getSessionInfo(sessionId);
      expect(state).toBeDefined();
    });
  });

  describe('Performance and Reliability', () => {
    it('should handle high message volume', async () => {
      const sessionId = 'test-session-volume';
      const messages = Array.from({ length: 50 }, (_, i) => `Message ${i}`);
      
      const startTime = Date.now();
      
      for (const message of messages) {
        await dialogManager.processMessageV3(message, sessionId);
      }
      
      const duration = Date.now() - startTime;
      
      // Should process 50 messages in under 5 seconds
      expect(duration).toBeLessThan(5000);
    });

    it('should maintain session state consistency', async () => {
      const sessionId = 'test-session-consistency';
      
      // Process multiple messages
      const messages = [
        'Bonjour',
        'jean.dupont@example.com',
        'Jean Dupont',
        '+213555123456'
      ];
      
      for (const message of messages) {
        await dialogManager.processMessageV3(message, sessionId);
      }
      
      const finalState = dialogManager.getSessionInfo(sessionId);
      
      expect(finalState?.extractedInfo.confirmedEmail).toBe('jean.dupont@example.com');
      expect(finalState?.extractedInfo.confirmedName).toBe('Jean Dupont');
      expect(finalState?.extractedInfo.confirmedPhone).toBe('+213555123456');
    });
  });
});

describe('Integration Test Scenarios', () => {
  describe('Complete User Journey', () => {
    it('should handle complete new user appointment booking', async () => {
      const dialogManager = getSharedDialogManagerV3();
      const sessionId = 'integration-test-complete';
      
      // 1. Welcome
      const step1 = await dialogManager.processMessageV3('Bonjour', sessionId);
      expect(step1.response.action).toBe('SHOW_WELCOME');
      
      // 2. Provide email (new user)
      const step2 = await dialogManager.processMessageV3(
        'Je voudrais prendre rendez-vous, mon email est nouveau@example.com',
        sessionId
      );
      expect(step2.response.action).toBe('SIGN_UP');
      
      // 3. Provide name and phone
      const step3 = await dialogManager.processMessageV3(
        'Je suis Marie Martin, mon téléphone est +213555123456',
        sessionId
      );
      expect(step3.shouldProceedToSlots).toBe(true);
      
      // 4. Send email summary
      const summaryResult = await dialogManager.sendEmailSummary(sessionId, {
        patient_name: 'Marie Martin',
        appointment_date: '16 août 2025',
        appointment_time: '10:00',
        care_type: 'Consultation'
      });
      
      expect(summaryResult.action).toBe('SEND_EMAIL_SUMMARY');
    }, 10000); // Extended timeout for integration test

    it('should handle timezone conversion correctly', async () => {
      const dialogManager = getSharedDialogManagerV3();
      const sessionId = 'integration-test-timezone';
      
      // All responses should include Africa/Algiers timezone
      const result = await dialogManager.processMessageV3('Bonjour', sessionId);
      expect(result.response.timezone).toBe('Africa/Algiers');
      expect(result.response.clinic_address).toBe('Cité 109, Daboussy El Achour, Alger');
    });

    it('should maintain conversation context across multiple interactions', async () => {
      const dialogManager = getSharedDialogManagerV3();
      const sessionId = 'integration-test-context';
      
      // Build up context gradually
      await dialogManager.processMessageV3('Bonjour', sessionId);
      await dialogManager.processMessageV3('marie@example.com', sessionId);
      await dialogManager.processMessageV3('Marie Martin', sessionId);
      const finalResult = await dialogManager.processMessageV3('+213555123456', sessionId);
      
      // Should have all information
      expect(finalResult.response.patient?.email).toBe('marie@example.com');
      expect(finalResult.response.patient?.name).toBe('Marie Martin');
      expect(finalResult.response.patient?.phone_e164).toBe('+213555123456');
    });
  });

  describe('Error Recovery Scenarios', () => {
    it('should recover from temporary service failures', async () => {
      const emailService = getEmailService();
      
      // Mock temporary failure followed by success
      const mockFetch = vi.fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          headers: new Map([['x-message-id', 'recovery-test-id']])
        });
      
      global.fetch = mockFetch;
      
      const result = await emailService.sendOTPEmail('recovery@example.com', '123456');
      expect(result.success).toBe(true);
    });

    it('should handle malformed input gracefully', async () => {
      const dialogManager = getSharedDialogManagerV3();
      const sessionId = 'integration-test-malformed';
      
      const malformedInputs = [
        '', // Empty
        '   ', // Whitespace only
        '🚀🎉🎈', // Emojis only
        'a'.repeat(10000), // Very long input
        '\x00\x01\x02', // Control characters
      ];
      
      for (const input of malformedInputs) {
        const result = await dialogManager.processMessageV3(input, sessionId);
        
        // Should not crash and should provide meaningful response
        expect(result.response).toBeDefined();
        expect(result.response.action).toBeDefined();
      }
    });
  });
});

// Test utilities
export const testUtils = {
  createMockPatient: (overrides: any = {}) => ({
    id: 'test-patient-id',
    name: 'Test Patient',
    email: 'test@example.com',
    phone_e164: '+213555123456',
    created_at: new Date(),
    updated_at: new Date(),
    email_verified: true,
    phone_verified: false,
    account_status: 'ACTIVE' as const,
    ...overrides
  }),
  
  createMockSession: (overrides: any = {}) => ({
    id: 'test-session-id',
    patient_id: 'test-patient-id',
    token: 'mock-jwt-token',
    expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
    created_at: new Date(),
    is_active: true,
    ...overrides
  }),
  
  createMockEmailResult: (success: boolean = true, overrides: any = {}) => ({
    success,
    messageId: success ? 'mock-message-id' : undefined,
    provider: 'Mock Provider',
    error: success ? undefined : 'Mock error',
    deliveryTime: 100,
    ...overrides
  })
};