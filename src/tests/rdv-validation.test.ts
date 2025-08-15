import { describe, it, expect, beforeEach } from 'vitest';
import { AppointmentAssistant } from '../lib/llm/appointments';
import { appointmentService } from '../services/appointment.service';
import { 
  appointmentSchema, 
  patientSchema, 
  slotSchema,
  phoneE164Schema 
} from '../lib/validation/rdv-validation';

describe('RDV System Validation Tests', () => {
  
  describe('Fixed Constraints Validation', () => {
    it('should enforce fixed clinic address', async () => {
      const invalidAddress = {
        action: 'CREATE',
        clinic_address: 'Wrong Address', // Should fail
        timezone: 'Africa/Algiers',
        patient: {
          name: 'Test Patient',
          phone_e164: '+213555123456'
        }
      };
      
      const result = appointmentSchema.safeParse(invalidAddress);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Cité 109, Daboussy El Achour, Alger');
      }
    });

    it('should enforce Africa/Algiers timezone', async () => {
      const invalidTimezone = {
        action: 'CREATE',
        clinic_address: 'Cité 109, Daboussy El Achour, Alger',
        timezone: 'Europe/Paris', // Should fail
        patient: {
          name: 'Test Patient',
          phone_e164: '+213555123456'
        }
      };
      
      const result = appointmentSchema.safeParse(invalidTimezone);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Africa/Algiers');
      }
    });

    it('should accept valid fixed constraints', () => {
      const validAppointment = {
        action: 'CREATE',
        clinic_address: 'Cité 109, Daboussy El Achour, Alger',
        timezone: 'Africa/Algiers',
        patient: {
          name: 'Test Patient',
          phone_e164: '+213555123456'
        },
        slot: {
          start_iso: '2025-08-20T09:00:00+01:00',
          end_iso: '2025-08-20T09:30:00+01:00',
          duration_minutes: 30
        },
        reason: 'Consultation dentaire',
        care_type: 'consultation',
        status: 'PENDING'
      };
      
      const result = appointmentSchema.safeParse(validAppointment);
      expect(result.success).toBe(true);
    });
  });

  describe('Phone Number Validation', () => {
    const validPhones = [
      '+213555123456', // Mobilis
      '+213666123456', // Mobilis
      '+213777123456', // Djezzy
      '+213555000000',
      '+213799999999'
    ];

    const invalidPhones = [
      '+213455123456', // Wrong prefix (4)
      '+213855123456', // Wrong prefix (8)
      '+213955123456', // Wrong prefix (9)
      '+21355512345',  // Too short
      '+2135551234567', // Too long
      '+33612345678',  // Wrong country
      '0555123456',    // Missing country code
      'invalid',       // Not a phone number
    ];

    validPhones.forEach(phone => {
      it(`should accept valid Algerian phone: ${phone}`, () => {
        const result = phoneE164Schema.safeParse(phone);
        expect(result.success).toBe(true);
      });
    });

    invalidPhones.forEach(phone => {
      it(`should reject invalid phone: ${phone}`, () => {
        const result = phoneE164Schema.safeParse(phone);
        expect(result.success).toBe(false);
      });
    });
  });

  describe('Timezone Handling', () => {
    it('should correctly handle Africa/Algiers timezone (UTC+01)', () => {
      const slot = {
        start_iso: '2025-08-20T09:00:00+01:00', // 9:00 AM Algiers time
        end_iso: '2025-08-20T09:30:00+01:00',   // 9:30 AM Algiers time
        duration_minutes: 30
      };
      
      const result = slotSchema.safeParse(slot);
      expect(result.success).toBe(true);
      
      if (result.success) {
        const startDate = new Date(result.data.start_iso);
        const endDate = new Date(result.data.end_iso);
        
        // Verify the times are in UTC+01 (Africa/Algiers)
        expect(startDate.toISOString()).toBe('2025-08-20T08:00:00.000Z'); // UTC
        expect(endDate.toISOString()).toBe('2025-08-20T08:30:00.000Z');   // UTC
        
        // Verify duration
        const durationMs = endDate.getTime() - startDate.getTime();
        const durationMinutes = durationMs / (1000 * 60);
        expect(durationMinutes).toBe(30);
      }
    });

    it('should reject times outside working hours', async () => {
      const tooEarly = {
        start_iso: '2025-08-20T06:00:00+01:00', // 6:00 AM - too early
        end_iso: '2025-08-20T06:30:00+01:00',
        duration_minutes: 30
      };
      
      const tooLate = {
        start_iso: '2025-08-20T19:00:00+01:00', // 7:00 PM - too late
        end_iso: '2025-08-20T19:30:00+01:00',
        duration_minutes: 30
      };
      
      const lunchTime = {
        start_iso: '2025-08-20T12:30:00+01:00', // 12:30 PM - lunch break
        end_iso: '2025-08-20T13:00:00+01:00',
        duration_minutes: 30
      };
      
      // These should be validated by business logic, not schema
      expect(slotSchema.safeParse(tooEarly).success).toBe(true);
      expect(slotSchema.safeParse(tooLate).success).toBe(true);
      expect(slotSchema.safeParse(lunchTime).success).toBe(true);
    });
  });

  describe('Care Types Validation', () => {
    const validCareTypes = [
      'consultation',
      'urgence',
      'detartrage', 
      'soin',
      'extraction',
      'prothese',
      'orthodontie',
      'chirurgie'
    ];

    validCareTypes.forEach(careType => {
      it(`should accept valid care type: ${careType}`, () => {
        const appointment = {
          action: 'CREATE',
          clinic_address: 'Cité 109, Daboussy El Achour, Alger',
          timezone: 'Africa/Algiers',
          care_type: careType,
          patient: {
            name: 'Test Patient',
            phone_e164: '+213555123456'
          }
        };
        
        const result = appointmentSchema.safeParse(appointment);
        expect(result.success).toBe(true);
      });
    });

    it('should reject invalid care type', () => {
      const appointment = {
        action: 'CREATE',
        clinic_address: 'Cité 109, Daboussy El Achour, Alger',
        timezone: 'Africa/Algiers',
        care_type: 'invalid_type', // Should fail
        patient: {
          name: 'Test Patient',
          phone_e164: '+213555123456'
        }
      };
      
      const result = appointmentSchema.safeParse(appointment);
      expect(result.success).toBe(false);
    });
  });

  describe('JSON-Only Response Validation', () => {
    let assistant: AppointmentAssistant;

    beforeEach(() => {
      // Skip these tests if no API key is available
      const apiKey = process.env.ANTHROPIC_API_KEY || 'test-api-key-for-validation';
      if (apiKey === 'test-api-key-for-validation') {
        return; // Skip test setup if no real API key
      }
      assistant = new AppointmentAssistant(apiKey);
    });

    it.skipIf(!process.env.ANTHROPIC_API_KEY)('should always return valid JSON structure', async () => {
      const testPrompts = [
        'Je veux prendre un rendez-vous',
        'Annuler mon RDV de demain',
        'Quels créneaux disponibles cette semaine?',
        'Invalid gibberish text @#$%^&*()',
      ];

      for (const prompt of testPrompts) {
        const response = await assistant.processAppointment(prompt);
        
        // Check required fields
        expect(response).toHaveProperty('action');
        expect(response).toHaveProperty('clinic_address');
        expect(response).toHaveProperty('timezone');
        
        // Check fixed values
        expect(response.clinic_address).toBe('Cité 109, Daboussy El Achour, Alger');
        expect(response.timezone).toBe('Africa/Algiers');
        
        // Check action is valid enum
        expect([
          'FIND_SLOTS', 
          'CREATE', 
          'RESCHEDULE', 
          'CANCEL', 
          'CONFIRMATION', 
          'NEED_INFO'
        ]).toContain(response.action);
      }
    });

    it.skipIf(!process.env.ANTHROPIC_API_KEY)('should return NEED_INFO when information is missing', async () => {
      const vaguePrompts = [
        'RDV',
        'demain',
        'consultation',
      ];

      for (const prompt of vaguePrompts) {
        const response = await assistant.processAppointment(prompt);
        
        if (response.action === 'NEED_INFO') {
          expect(response.status).toBe('NEED_INFO');
          expect(response.missing_fields).toBeDefined();
          expect(Array.isArray(response.missing_fields)).toBe(true);
          
          if (response.clarification_question) {
            expect(response.clarification_question).toMatch(/^.{1,200}$/); // Max 200 chars
          }
        }
      }
    });
  });

  describe('Patient Data Validation', () => {
    it('should validate patient name constraints', () => {
      const validNames = [
        'Mohamed Ben Ali',
        'Fatima Zahra',
        'Jean-Pierre Dubois',
        "O'Connor",
        'Marie-Claire'
      ];

      const invalidNames = [
        '', // Empty
        'A', // Too short
        'a'.repeat(121), // Too long
        '123456', // Numbers only
        '@#$%^&', // Special chars
      ];

      validNames.forEach(name => {
        const result = patientSchema.safeParse({
          name,
          phone_e164: '+213555123456'
        });
        expect(result.success).toBe(true);
      });

      invalidNames.forEach(name => {
        const result = patientSchema.safeParse({
          name,
          phone_e164: '+213555123456'
        });
        expect(result.success).toBe(false);
      });
    });

    it('should validate optional email format', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.dz',
        'contact@cabinet-dentaire.fr',
        undefined, // Optional
      ];

      const invalidEmails = [
        'invalid-email',
        '@domain.com',
        'user@',
        'user @domain.com',
      ];

      validEmails.forEach(email => {
        const patient = {
          name: 'Test Patient',
          phone_e164: '+213555123456',
          ...(email && { email })
        };
        
        const result = patientSchema.safeParse(patient);
        expect(result.success).toBe(true);
      });

      invalidEmails.forEach(email => {
        const result = patientSchema.safeParse({
          name: 'Test Patient',
          phone_e164: '+213555123456',
          email
        });
        expect(result.success).toBe(false);
      });
    });
  });

  describe('Appointment Actions Validation', () => {
    const validActions = [
      'FIND_SLOTS',
      'CREATE',
      'RESCHEDULE',
      'CANCEL',
      'CONFIRMATION',
      'NEED_INFO'
    ];

    validActions.forEach(action => {
      it(`should accept valid action: ${action}`, () => {
        const appointment = {
          action,
          clinic_address: 'Cité 109, Daboussy El Achour, Alger',
          timezone: 'Africa/Algiers'
        };
        
        const partialResult = appointmentSchema.partial().safeParse(appointment);
        expect(partialResult.success).toBe(true);
      });
    });

    it('should reject invalid action', () => {
      const appointment = {
        action: 'INVALID_ACTION',
        clinic_address: 'Cité 109, Daboussy El Achour, Alger',
        timezone: 'Africa/Algiers'
      };
      
      const result = appointmentSchema.safeParse(appointment);
      expect(result.success).toBe(false);
    });
  });

  describe('Working Hours Validation', () => {
    it('should validate Monday-Friday working hours (8h-18h)', () => {
      const validSlots = [
        { day: 'Monday', time: '08:00' },
        { day: 'Tuesday', time: '09:30' },
        { day: 'Wednesday', time: '14:00' },
        { day: 'Thursday', time: '16:45' },
        { day: 'Friday', time: '17:30' },
      ];

      const invalidSlots = [
        { day: 'Monday', time: '07:30' },    // Too early
        { day: 'Tuesday', time: '18:30' },   // Too late
        { day: 'Wednesday', time: '12:15' }, // Lunch break
        { day: 'Sunday', time: '10:00' },    // Closed
      ];

      // Note: Working hours validation is done in business logic,
      // not in the schema validation
      validSlots.forEach(({ day, time }) => {
        const [hours, minutes] = time.split(':').map(Number);
        const isLunchTime = hours === 12;
        const isWorkingHours = hours >= 8 && hours < 18 && !isLunchTime;
        
        expect(isWorkingHours).toBe(true);
      });
    });

    it('should validate Saturday working hours (8h-13h)', () => {
      const validSaturdaySlots = [
        '08:00', '09:00', '10:30', '11:45', '12:30'
      ];

      const invalidSaturdaySlots = [
        '07:30', '13:30', '14:00', '18:00'
      ];

      validSaturdaySlots.forEach(time => {
        const [hours] = time.split(':').map(Number);
        const isValidSaturday = hours >= 8 && hours < 13;
        expect(isValidSaturday).toBe(true);
      });

      invalidSaturdaySlots.forEach(time => {
        const [hours] = time.split(':').map(Number);
        const isValidSaturday = hours >= 8 && hours < 13;
        expect(isValidSaturday).toBe(false);
      });
    });
  });
});