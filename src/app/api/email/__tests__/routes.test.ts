import { describe, it, expect, vi } from 'vitest';
import { POST as appointmentPost } from '../appointment-confirmation/route';
import { POST as otpPost } from '../otp/route';
import { GET as verifyGet } from '../../debug/email/verify/route';
import { NextRequest } from 'next/server';

// Mock the email service
vi.mock('@/server/email/ionos-email.service', () => ({
  getEmailService: vi.fn(() => ({
    sendAppointmentConfirmation: vi.fn().mockResolvedValue(true),
    sendOtpEmail: vi.fn().mockResolvedValue(true),
    verifyConnection: vi.fn().mockResolvedValue({ success: true }),
  })),
}));

describe('Email API Routes', () => {
  describe('Appointment Confirmation Route', () => {
    it('should send appointment confirmation successfully', async () => {
      const request = new NextRequest('http://localhost:3000/api/email/appointment-confirmation', {
        method: 'POST',
        body: JSON.stringify({
          data: {
            patient_name: 'Test Patient',
            patient_email: 'test@example.com',
            patient_phone: '+213555123456',
            appointment_date: '2025-01-15T14:00:00Z',
            appointment_time: '14:00',
            appointment_id: 'APT-123',
            clinic_address: 'Cité 109, Daboussy El Achour, Alger',
          },
          userId: 'user-123',
        }),
      });
      
      const response = await appointmentPost(request);
      const json = await response.json();
      
      expect(response.status).toBe(200);
      expect(json.ok).toBe(true);
    });

    it('should validate appointment email data', async () => {
      const request = new NextRequest('http://localhost:3000/api/email/appointment-confirmation', {
        method: 'POST',
        body: JSON.stringify({
          data: {
            patient_name: 'Test Patient',
            patient_email: 'invalid-email', // Invalid email
            patient_phone: '+213555123456',
            appointment_date: '2025-01-15T14:00:00Z',
            appointment_time: '14:00',
            appointment_id: 'APT-123',
          },
          userId: 'user-123',
        }),
      });
      
      const response = await appointmentPost(request);
      const json = await response.json();
      
      expect(response.status).toBe(400);
      expect(json.ok).toBe(false);
      expect(json.details).toBeDefined();
    });

    it('should require userId field', async () => {
      const request = new NextRequest('http://localhost:3000/api/email/appointment-confirmation', {
        method: 'POST',
        body: JSON.stringify({
          data: {
            patient_name: 'Test Patient',
            patient_email: 'test@example.com',
            patient_phone: '+213555123456',
            appointment_date: '2025-01-15T14:00:00Z',
            appointment_time: '14:00',
            appointment_id: 'APT-123',
          },
          // Missing userId
        }),
      });
      
      const response = await appointmentPost(request);
      const json = await response.json();
      
      expect(response.status).toBe(400);
      expect(json.ok).toBe(false);
    });
  });

  describe('OTP Email Route', () => {
    it('should send OTP email successfully', async () => {
      const request = new NextRequest('http://localhost:3000/api/email/otp', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          otp: '123456',
        }),
      });
      
      const response = await otpPost(request);
      const json = await response.json();
      
      expect(response.status).toBe(200);
      expect(json.ok).toBe(true);
    });

    it('should validate OTP email data', async () => {
      const request = new NextRequest('http://localhost:3000/api/email/otp', {
        method: 'POST',
        body: JSON.stringify({
          email: 'invalid-email',
          otp: '123', // Too short
        }),
      });
      
      const response = await otpPost(request);
      const json = await response.json();
      
      expect(response.status).toBe(400);
      expect(json.ok).toBe(false);
      expect(json.details).toBeDefined();
    });

    it('should require 6-digit OTP', async () => {
      const request = new NextRequest('http://localhost:3000/api/email/otp', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          otp: '12345', // Only 5 digits
        }),
      });
      
      const response = await otpPost(request);
      const json = await response.json();
      
      expect(response.status).toBe(400);
      expect(json.ok).toBe(false);
    });
  });

  describe('Email Verification Route (Debug)', () => {
    it('should verify email connection in development', async () => {
      process.env.NODE_ENV = 'development';
      
      const request = new NextRequest('http://localhost:3000/api/debug/email/verify');
      
      const response = await verifyGet(request);
      const json = await response.json();
      
      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
    });

    it('should block verification in production', async () => {
      process.env.NODE_ENV = 'production';
      
      const request = new NextRequest('http://localhost:3000/api/debug/email/verify');
      
      const response = await verifyGet(request);
      const json = await response.json();
      
      expect(response.status).toBe(403);
      expect(json.error).toContain('development mode');
    });
  });

  describe('Error Handling', () => {
    it('should handle service errors gracefully', async () => {
      // Reset and mock service to return false (indicating failure)
      vi.resetModules();
      vi.doMock('@/server/email/ionos-email.service', () => ({
        getEmailService: vi.fn(() => ({
          sendAppointmentConfirmation: vi.fn().mockResolvedValue(false), // Service fails
        })),
      }));

      // Re-import the route handler with the new mock
      const { POST: newAppointmentPost } = await import('../appointment-confirmation/route');

      const request = new NextRequest('http://localhost:3000/api/email/appointment-confirmation', {
        method: 'POST',
        body: JSON.stringify({
          data: {
            patient_name: 'Test Patient',
            patient_email: 'test@example.com',
            patient_phone: '+213555123456',
            appointment_date: '2025-01-15T14:00:00Z',
            appointment_time: '14:00',
            appointment_id: 'APT-123',
          },
          userId: 'user-123',
        }),
      });
      
      const response = await newAppointmentPost(request);
      const json = await response.json();
      
      expect(response.status).toBe(200);
      expect(json.ok).toBe(false); // Service returned false
    });

    it('should handle invalid JSON', async () => {
      const request = new NextRequest('http://localhost:3000/api/email/otp', {
        method: 'POST',
        body: 'invalid json',
      });
      
      const response = await otpPost(request);
      
      expect(response.status).toBe(500);
    });
  });
});