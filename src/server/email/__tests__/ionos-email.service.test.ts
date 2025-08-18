import nodemailer from 'nodemailer';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock nodemailer
vi.mock('nodemailer', () => ({
  default: {
    createTransporter: vi.fn(() => ({
      sendMail: vi.fn().mockResolvedValue({ messageId: 'test-id' }),
      verify: vi.fn().mockResolvedValue(true),
    })),
  },
}));

// Mock Supabase
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      insert: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
  })),
}));

// Mock server-only
vi.mock('server-only', () => ({}));

describe('IonosEmailService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Set required env vars
    process.env.SMTP_HOST = 'smtp.test.com';
    process.env.SMTP_USER = 'test@test.com';
    process.env.SMTP_PASSWORD = 'password';
    process.env.SMTP_FROM = 'from@test.com';
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key';
    
    // Mock window to be undefined (server environment)
    Object.defineProperty(global, 'window', {
      value: undefined,
      writable: true,
    });
  });

  it('should create transporter with correct config', async () => {
    const { getEmailService } = await import('../ionos-email.service');
    const service = getEmailService();
    
    expect(nodemailer.createTransporter).toHaveBeenCalledWith(
      expect.objectContaining({
        host: 'smtp.test.com',
        port: 587,
        secure: false,
        auth: {
          user: 'test@test.com',
          pass: 'password',
        },
        tls: {
          minVersion: 'TLSv1.2',
          ciphers: 'HIGH',
        },
        pool: true,
        maxConnections: 3,
      })
    );
  });

  it('should send appointment confirmation email', async () => {
    const { getEmailService } = await import('../ionos-email.service');
    const service = getEmailService();
    
    const result = await service.sendAppointmentConfirmation(
      {
        patient_name: 'Jean Dupont',
        patient_email: 'jean@example.com',
        patient_phone: '+213555123456',
        appointment_date: '2025-01-15T14:00:00Z',
        appointment_time: '14:00',
        care_type: 'Consultation',
        appointment_id: 'APT-123',
        clinic_address: 'Cité 109, Daboussy El Achour, Alger',
      },
      'user-123'
    );
    
    expect(result).toBe(true);
  });

  it('should send OTP email', async () => {
    const { getEmailService } = await import('../ionos-email.service');
    const service = getEmailService();
    
    const result = await service.sendOtpEmail('test@example.com', '123456');
    
    expect(result).toBe(true);
  });

  it('should format dates in Africa/Algiers timezone', async () => {
    const { getEmailService } = await import('../ionos-email.service');
    const service = getEmailService();
    
    // Test via the private method through reflection
    const formatted = service['formatDateTime']('2025-01-15T14:00:00Z');
    expect(formatted).toContain('2025');
    expect(formatted).toContain('15:00'); // UTC+1
  });

  it('should only verify connection in development', async () => {
    process.env.NODE_ENV = 'production';
    const { getEmailService } = await import('../ionos-email.service');
    const service = getEmailService();
    
    const result = await service.verifyConnection();
    expect(result.success).toBe(false);
    expect(result.error).toContain('development');
  });

  it('should verify connection in development', async () => {
    process.env.NODE_ENV = 'development';
    const { getEmailService } = await import('../ionos-email.service');
    const service = getEmailService();
    
    const result = await service.verifyConnection();
    expect(result.success).toBe(true);
  });

  it('should handle email send errors gracefully', async () => {
    // Reset mocks and create new mock
    vi.resetModules();
    vi.clearAllMocks();
    
    // Mock sendMail to throw error
    const mockSendMail = vi.fn().mockRejectedValue(new Error('SMTP Error'));
    vi.mocked(nodemailer.createTransporter).mockImplementation(() => ({
      sendMail: mockSendMail,
      verify: vi.fn(),
    } as any));

    const { getEmailService } = await import('../ionos-email.service');
    const service = getEmailService();
    
    const result = await service.sendAppointmentConfirmation(
      {
        patient_name: 'Jean Dupont',
        patient_email: 'jean@example.com',
        patient_phone: '+213555123456',
        appointment_date: '2025-01-15T14:00:00Z',
        appointment_time: '14:00',
        care_type: 'Consultation',
        appointment_id: 'APT-123',
        clinic_address: 'Cité 109, Daboussy El Achour, Alger',
      },
      'user-123'
    );
    
    expect(result).toBe(false);
  });

  it('should throw error when trying to get service on client', async () => {
    // Mock window to exist (client environment)
    Object.defineProperty(global, 'window', {
      value: {},
      writable: true,
    });

    const { getEmailService } = await import('../ionos-email.service');
    
    expect(() => {
      getEmailService();
    }).toThrow('Email service cannot be used on the client');
    
    // Clean up
    Object.defineProperty(global, 'window', {
      value: undefined,
      writable: true,
    });
  });

  it('should validate required environment variables on instantiation', async () => {
    const originalHost = process.env.SMTP_HOST;
    delete process.env.SMTP_HOST;

    // Reset modules to force re-evaluation
    vi.resetModules();
    
    await expect(async () => {
      await import('../ionos-email.service');
    }).rejects.toThrow();
    
    // Restore env var
    process.env.SMTP_HOST = originalHost;
  });
});