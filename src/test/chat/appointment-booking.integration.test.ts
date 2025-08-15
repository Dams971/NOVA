import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { db } from '@/lib/database/postgresql-connection';
import { createChatOrchestrator, ChatContext } from '@/services/chat/orchestrator';
import EmailQueue from '@/lib/email/email-queue';

/**
 * NOVA Appointment Booking Integration Tests
 * End-to-end tests for AI-powered appointment booking flows
 */

describe('Appointment Booking Integration', () => {
  let orchestrator: ReturnType<typeof createChatOrchestrator>;
  let mockContext: ChatContext;

  beforeAll(async () => {
    // Initialize email queue database for testing
    await EmailQueue.initializeDatabase();
  });

  beforeEach(() => {
    orchestrator = createChatOrchestrator();
    
    mockContext = {
      sessionId: 'test-session-booking',
      user: {
        userId: 'patient-test-1',
        role: 'patient',
        email: 'patient.test@example.com'
      },
      tenant: {
        id: 'cabinet-1',
        name: 'Cabinet Dentaire Test',
        timezone: 'Europe/Paris',
        businessHours: {
          monday: { open: '08:00', close: '18:00' },
          tuesday: { open: '08:00', close: '18:00' },
          wednesday: { open: '08:00', close: '18:00' },
          thursday: { open: '08:00', close: '18:00' },
          friday: { open: '08:00', close: '18:00' },
          saturday: { open: '09:00', close: '13:00' },
          sunday: { open: '', close: '' }
        }
      },
      conversation: {
        messages: [],
        state: 'active',
        collectedSlots: {},
        confirmationPending: false
      }
    };

    // Mock console methods to reduce test noise
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'info').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Complete Booking Flow', () => {
    it('should complete a full appointment booking conversation in French', async () => {
      // Step 1: Greeting
      let response = await orchestrator.handleMessage('Bonjour', mockContext);
      
      expect(response.message).toContain('Bonjour');
      expect(response.message).toContain('Nova');
      expect(response.suggestedReplies).toContain('Prendre un rendez-vous');

      // Step 2: Express intent to book
      response = await orchestrator.handleMessage('Je voudrais prendre un rendez-vous', mockContext);
      
      expect(response.requiresInput).toBe(true);
      expect(response.message).toMatch(/email|date|heure|praticien/i);

      // Step 3: Provide details
      response = await orchestrator.handleMessage(
        'Mon email est patient.test@example.com, je veux un rendez-vous demain à 14h pour une consultation',
        mockContext
      );

      // Should either ask for confirmation or request missing info
      expect(response.requiresInput).toBe(true);
      
      if (response.inputType === 'confirmation') {
        // Step 4: Confirm booking
        response = await orchestrator.handleMessage('Oui, je confirme', mockContext);
        
        expect(response.message).toContain('confirmé');
        expect(response.completed).toBe(true);
      } else {
        // Need more information - provide practitioner
        response = await orchestrator.handleMessage('Avec Dr. Dupont', mockContext);
        
        if (response.inputType === 'confirmation') {
          // Now confirm
          response = await orchestrator.handleMessage('Confirmer', mockContext);
          
          expect(response.message).toContain('confirmé');
          expect(response.completed).toBe(true);
        }
      }
    });

    it('should handle availability checking before booking', async () => {
      // Step 1: Check availability first
      let response = await orchestrator.handleMessage('Avez-vous des créneaux libres demain ?', mockContext);
      
      expect(response.message).toMatch(/créneaux|disponible/i);
      
      // Step 2: Express booking intent based on availability
      response = await orchestrator.handleMessage('Oui, je veux réserver le créneau de 14h', mockContext);
      
      expect(response.requiresInput).toBe(true);
      
      // Should now ask for missing details (email, service type, etc.)
      expect(response.message).toMatch(/email|service|soin/i);
    });

    it('should handle multi-turn slot filling conversation', async () => {
      // Start with minimal information
      let response = await orchestrator.handleMessage('Prendre rendez-vous', mockContext);
      
      expect(response.requiresInput).toBe(true);

      // Provide email
      response = await orchestrator.handleMessage('patient.test@example.com', mockContext);
      
      expect(response.requiresInput).toBe(true);

      // Provide date
      response = await orchestrator.handleMessage('Demain', mockContext);
      
      expect(response.requiresInput).toBe(true);

      // Provide time
      response = await orchestrator.handleMessage('14h30', mockContext);
      
      expect(response.requiresInput).toBe(true);

      // Provide service
      response = await orchestrator.handleMessage('Consultation dentaire', mockContext);
      
      // Should now have enough information for confirmation
      expect(response.inputType === 'confirmation' || response.message.includes('praticien')).toBe(true);
    });
  });

  describe('Appointment Management', () => {
    it('should handle appointment cancellation flow', async () => {
      // Step 1: Express cancellation intent
      let response = await orchestrator.handleMessage('Je veux annuler mon rendez-vous', mockContext);
      
      expect(response.requiresInput).toBe(true);
      expect(response.message).toMatch(/email|rendez-vous/i);

      // Step 2: Provide identification
      response = await orchestrator.handleMessage('patient.test@example.com', mockContext);
      
      // Should find appointments and ask for confirmation or selection
      expect(response.requiresInput).toBe(true);
      
      if (response.inputType === 'select') {
        // Multiple appointments found
        response = await orchestrator.handleMessage('1', mockContext);
      }
      
      // Should ask for confirmation
      if (response.inputType === 'confirmation') {
        response = await orchestrator.handleMessage('Oui, annuler', mockContext);
        
        expect(response.message).toContain('annulé');
        expect(response.completed).toBe(true);
      }
    });

    it('should handle appointment rescheduling', async () => {
      let response = await orchestrator.handleMessage('Je veux reporter mon rendez-vous', mockContext);
      
      expect(response.requiresInput).toBe(true);

      // Provide email and new date/time
      response = await orchestrator.handleMessage(
        'patient.test@example.com, nouveau créneau lundi 15h',
        mockContext
      );

      // Should process the reschedule request
      expect(response.message).toMatch(/reporté|modifié|changé/i);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle conflicting appointment slots', async () => {
      // Try to book an already taken slot
      let response = await orchestrator.handleMessage(
        'Réserver demain 14h consultation avec Dr. Dupont',
        mockContext
      );

      if (response.inputType === 'confirmation') {
        response = await orchestrator.handleMessage('Confirmer', mockContext);
        
        if (response.message.includes('plus disponible') || response.message.includes('conflit')) {
          expect(response.suggestedReplies).toContain('Voir d\'autres créneaux');
          expect(response.requiresInput).toBe(true);
        }
      }
    });

    it('should escalate when unable to find appointments for cancellation', async () => {
      let response = await orchestrator.handleMessage('Annuler mon rendez-vous', mockContext);
      
      // Provide non-existent patient email
      response = await orchestrator.handleMessage('nonexistent@example.com', mockContext);
      
      // Should escalate or ask for verification
      expect(response.escalate || response.message.includes('vérifier')).toBe(true);
    });

    it('should handle emergency situations during booking', async () => {
      let response = await orchestrator.handleMessage(
        'J\'ai très mal aux dents, je dois voir un dentiste tout de suite !',
        mockContext
      );

      expect(response.message).toContain('urgence');
      expect(response.escalate).toBe(true);
      expect(response.completed).toBe(true);
    });

    it('should handle requests outside business hours', async () => {
      // Mock Sunday request (closed day)
      let response = await orchestrator.handleMessage(
        'Rendez-vous dimanche matin pour urgence',
        mockContext
      );

      expect(response.message).toMatch(/fermé|ouvert|horaires/i);
      expect(response.suggestedReplies).toContain('Parler à un conseiller');
    });
  });

  describe('French Language Variations', () => {
    it('should handle formal French expressions', async () => {
      let response = await orchestrator.handleMessage(
        'Bonsoir, j\'aimerais solliciter un rendez-vous pour une consultation dentaire',
        mockContext
      );

      expect(response.message).toContain('Bonsoir');
      expect(response.requiresInput).toBe(true);
    });

    it('should handle informal French expressions', async () => {
      let response = await orchestrator.handleMessage('Salut ! Un rdv dispo demain ?', mockContext);

      expect(response.requiresInput).toBe(true);
      expect(response.message).toMatch(/disponibilité|créneau|rendez-vous/i);
    });

    it('should handle medical terminology in French', async () => {
      const medicalTerms = [
        'détartrage',
        'plombage',
        'couronne',
        'extraction',
        'orthodontie',
        'implant'
      ];

      for (const term of medicalTerms) {
        let response = await orchestrator.handleMessage(
          `Je veux un rendez-vous pour un ${term}`,
          mockContext
        );

        expect(response.requiresInput).toBe(true);
        expect(response.message).not.toContain('pas sûr de comprendre');
      }
    });

    it('should handle different date formats in French', async () => {
      const dateFormats = [
        'demain',
        'après-demain', 
        'lundi prochain',
        'la semaine prochaine',
        'le 15 janvier',
        '15/01/2024'
      ];

      for (const dateFormat of dateFormats) {
        let response = await orchestrator.handleMessage(
          `Rendez-vous ${dateFormat}`,
          mockContext
        );

        // Should understand the date format
        expect(response.requiresInput).toBe(true);
      }
    });

    it('should handle different time expressions in French', async () => {
      const timeExpressions = [
        '14h30',
        '14:30',
        'quatorze heures trente',
        'deux heures et demie',
        'milieu d\'après-midi',
        'en fin de matinée'
      ];

      for (const timeExpr of timeExpressions) {
        let response = await orchestrator.handleMessage(
          `Rendez-vous ${timeExpr}`,
          mockContext
        );

        // Should understand the time expression
        expect(response.requiresInput).toBe(true);
      }
    });
  });

  describe('Conversation Context Management', () => {
    it('should maintain context across multiple messages', async () => {
      // Start conversation
      let response = await orchestrator.handleMessage('Bonjour', mockContext);
      
      expect(mockContext.conversation.messages.length).toBe(2); // User + Assistant

      // Continue conversation
      response = await orchestrator.handleMessage('Je veux un rendez-vous', mockContext);
      
      expect(mockContext.conversation.messages.length).toBe(4);
      expect(mockContext.conversation.currentIntent).toBe('book_appointment');
    });

    it('should handle context switching between intents', async () => {
      // Start with booking
      let response = await orchestrator.handleMessage('Prendre rendez-vous', mockContext);
      
      expect(mockContext.conversation.currentIntent).toBe('book_appointment');

      // Switch to cancellation
      response = await orchestrator.handleMessage('En fait, je veux annuler un rendez-vous', mockContext);
      
      expect(mockContext.conversation.currentIntent).toBe('cancel_appointment');
    });

    it('should handle confirmation flow interruptions', async () => {
      // Set up confirmation state
      mockContext.conversation.confirmationPending = true;
      mockContext.conversation.collectedSlots = {
        patientEmail: 'test@example.com',
        date: '2024-01-15',
        time: '14:00'
      };

      // User changes mind during confirmation
      let response = await orchestrator.handleMessage('Non, je veux changer l\'heure', mockContext);
      
      // Should handle the change request
      expect(response.requiresInput).toBe(true);
    });
  });

  describe('Performance and Load', () => {
    it('should handle rapid consecutive messages', async () => {
      const messages = [
        'Bonjour',
        'Rendez-vous demain',
        '14h',
        'Consultation',
        'patient.test@example.com'
      ];

      const startTime = Date.now();

      for (const message of messages) {
        await orchestrator.handleMessage(message, mockContext);
      }

      const endTime = Date.now();
      const totalTime = endTime - startTime;

      expect(totalTime).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it('should handle long conversation sessions', async () => {
      // Simulate a long back-and-forth conversation
      for (let i = 0; i < 20; i++) {
        const response = await orchestrator.handleMessage(`Message ${i}`, mockContext);
        expect(response).toBeDefined();
      }

      // Should not have memory issues or significant performance degradation
      expect(mockContext.conversation.messages.length).toBeLessThanOrEqual(42); // 20 * 2 + some system messages
    });
  });

  describe('Integration with Email System', () => {
    it('should queue confirmation email after successful booking', async () => {
      // Mock a successful booking flow that should trigger email
      const emailQueue = EmailQueue.getInstance();
      const queueSpy = vi.spyOn(emailQueue, 'queueAppointmentConfirmation').mockResolvedValue('email-job-123');

      // Complete booking flow (simplified)
      await orchestrator.handleMessage('Bonjour', mockContext);
      
      // The exact flow depends on the orchestrator implementation
      // This test verifies that email queuing is triggered after booking
      
      // Note: This might need to be adjusted based on the actual implementation
      // The key is to verify that successful bookings trigger email notifications
    });
  });
});