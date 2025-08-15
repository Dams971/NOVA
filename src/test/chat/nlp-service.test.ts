import { describe, it, expect, beforeEach } from 'vitest';
import NLPService from '@/lib/ai/nlp-service';

/**
 * NOVA NLP Service Tests
 * Tests for French medical appointment NLU
 */

describe('NLPService', () => {
  let nlpService: NLPService;

  beforeEach(() => {
    nlpService = NLPService.getInstance();
  });

  describe('Intent Recognition', () => {
    it('should recognize greeting intent', async () => {
      const testMessages = [
        'Bonjour',
        'Bonsoir',
        'Salut',
        'Hello',
        'Je vous dis bonjour'
      ];

      for (const message of testMessages) {
        const result = await nlpService.extractIntentEntities(message);
        expect(result.intent).toBe('greeting');
        expect(result.confidence).toBeGreaterThan(0.5);
      }
    });

    it('should recognize appointment booking intent', async () => {
      const testMessages = [
        'Je voudrais prendre rendez-vous',
        'Je souhaite réserver une consultation',
        'Prendre un rdv',
        'Fixer un rendez-vous',
        'Je veux un nouveau rendez-vous'
      ];

      for (const message of testMessages) {
        const result = await nlpService.extractIntentEntities(message);
        expect(result.intent).toBe('book_appointment');
        expect(result.confidence).toBeGreaterThan(0.5);
      }
    });

    it('should recognize availability checking intent', async () => {
      const testMessages = [
        'Avez-vous des disponibilités ?',
        'Quels sont vos créneaux libres ?',
        'Voir les disponibilités demain',
        'Vérifier le planning',
        'Y a-t-il des places libres ?'
      ];

      for (const message of testMessages) {
        const result = await nlpService.extractIntentEntities(message);
        expect(result.intent).toBe('check_availability');
        expect(result.confidence).toBeGreaterThan(0.5);
      }
    });

    it('should recognize appointment cancellation intent', async () => {
      const testMessages = [
        'Je voudrais annuler mon rendez-vous',
        'Supprimer mon rdv',
        'Je ne peux plus venir',
        'Annulation rendez-vous',
        'Empêchement pour demain'
      ];

      for (const message of testMessages) {
        const result = await nlpService.extractIntentEntities(message);
        expect(result.intent).toBe('cancel_appointment');
        expect(result.confidence).toBeGreaterThan(0.5);
      }
    });

    it('should recognize emergency intent', async () => {
      const testMessages = [
        'C\'est urgent !',
        'J\'ai très mal aux dents',
        'Urgence dentaire',
        'Douleur insupportable',
        'SOS dentiste'
      ];

      for (const message of testMessages) {
        const result = await nlpService.extractIntentEntities(message);
        expect(result.intent).toBe('emergency');
        expect(result.confidence).toBeGreaterThan(0.7); // Higher threshold for emergencies
      }
    });

    it('should recognize help intent', async () => {
      const testMessages = [
        'Aidez-moi',
        'Comment faire ?',
        'Je ne comprends pas',
        'Problème avec mon rendez-vous',
        'Que faire ?'
      ];

      for (const message of testMessages) {
        const result = await nlpService.extractIntentEntities(message);
        expect(result.intent).toBe('help');
        expect(result.confidence).toBeGreaterThan(0.5);
      }
    });

    it('should recognize goodbye intent', async () => {
      const testMessages = [
        'Au revoir',
        'Merci et à bientôt',
        'C\'est tout',
        'Bonne journée',
        'Bye'
      ];

      for (const message of testMessages) {
        const result = await nlpService.extractIntentEntities(message);
        expect(result.intent).toBe('goodbye');
        expect(result.confidence).toBeGreaterThan(0.5);
      }
    });
  });

  describe('Entity Extraction', () => {
    it('should extract dates correctly', async () => {
      const testCases = [
        { message: 'Je veux un rendez-vous demain', expectedEntities: ['demain'] },
        { message: 'Rendez-vous le 15/12/2024', expectedEntities: ['15/12/2024'] },
        { message: 'Disponible lundi prochain', expectedEntities: ['lundi'] },
        { message: 'Consultation aujourd\'hui', expectedEntities: ['aujourd\'hui'] }
      ];

      for (const testCase of testCases) {
        const result = await nlpService.extractIntentEntities(testCase.message);
        const dateEntities = result.entities.filter(e => e.type === 'date');
        expect(dateEntities.length).toBeGreaterThan(0);
        
        const extractedValues = dateEntities.map(e => e.value);
        testCase.expectedEntities.forEach(expected => {
          expect(extractedValues.some(value => value.includes(expected))).toBe(true);
        });
      }
    });

    it('should extract times correctly', async () => {
      const testCases = [
        { message: 'Rendez-vous à 14h30', expectedTimes: ['14h30'] },
        { message: 'Vers 10 heures', expectedTimes: ['10'] },
        { message: 'Dans la matinée', expectedTimes: ['matin'] },
        { message: 'L\'après-midi', expectedTimes: ['après-midi'] }
      ];

      for (const testCase of testCases) {
        const result = await nlpService.extractIntentEntities(testCase.message);
        const timeEntities = result.entities.filter(e => e.type === 'time');
        expect(timeEntities.length).toBeGreaterThan(0);
        
        const extractedValues = timeEntities.map(e => e.value);
        testCase.expectedTimes.forEach(expected => {
          expect(extractedValues.some(value => value.toLowerCase().includes(expected.toLowerCase()))).toBe(true);
        });
      }
    });

    it('should extract email addresses correctly', async () => {
      const message = 'Mon email est patient@example.com';
      const result = await nlpService.extractIntentEntities(message);
      
      const emailEntities = result.entities.filter(e => e.type === 'email');
      expect(emailEntities.length).toBe(1);
      expect(emailEntities[0].value).toBe('patient@example.com');
    });

    it('should extract phone numbers correctly', async () => {
      const testCases = [
        'Mon numéro est 0123456789',
        'Appelez-moi au +33 1 23 45 67 89',
        'Téléphone : 01 23 45 67 89'
      ];

      for (const message of testCases) {
        const result = await nlpService.extractIntentEntities(message);
        const phoneEntities = result.entities.filter(e => e.type === 'phone');
        expect(phoneEntities.length).toBeGreaterThan(0);
      }
    });

    it('should extract service types correctly', async () => {
      const testCases = [
        { message: 'Consultation dentaire', expectedService: 'consultation' },
        { message: 'Détartrage complet', expectedService: 'détartrage' },
        { message: 'Soin d\'une carie', expectedService: 'plombage' },
        { message: 'Couronne céramique', expectedService: 'couronne' },
        { message: 'Extraction dent de sagesse', expectedService: 'extraction' }
      ];

      for (const testCase of testCases) {
        const result = await nlpService.extractIntentEntities(testCase.message);
        const serviceEntities = result.entities.filter(e => e.type === 'service_type');
        expect(serviceEntities.length).toBeGreaterThan(0);
        
        const extractedValues = serviceEntities.map(e => e.value);
        expect(extractedValues.some(value => 
          value.toLowerCase().includes(testCase.expectedService)
        )).toBe(true);
      }
    });
  });

  describe('Slot Filling', () => {
    it('should convert entities to structured slots', async () => {
      const message = 'Je voudrais prendre rendez-vous demain à 14h30 pour un détartrage';
      const context = {
        tenant: { id: 'cabinet-1' },
        user: { userId: 'user-1' }
      };

      const result = await nlpService.extractIntentEntities(message, context);
      
      expect(result.intent).toBe('book_appointment');
      expect(result.slots).toHaveProperty('date');
      expect(result.slots).toHaveProperty('time');
      expect(result.slots).toHaveProperty('serviceType');
      expect(result.slots).toHaveProperty('cabinetId', 'cabinet-1');
      expect(result.slots).toHaveProperty('userId', 'user-1');
    });

    it('should handle time windows correctly', async () => {
      const testCases = [
        { message: 'Rendez-vous le matin', expectedWindow: 'morning' },
        { message: 'Dans l\'après-midi', expectedWindow: 'afternoon' },
        { message: 'En soirée', expectedWindow: 'evening' }
      ];

      for (const testCase of testCases) {
        const result = await nlpService.extractIntentEntities(testCase.message);
        expect(result.slots).toHaveProperty('timeWindow', testCase.expectedWindow);
      }
    });
  });

  describe('Context Application', () => {
    it('should boost confidence for related intents in conversation flow', async () => {
      const context = {
        previousContext: {
          currentIntent: 'check_availability'
        }
      };

      const result = await nlpService.extractIntentEntities('Oui, je veux réserver', context);
      
      expect(result.intent).toBe('book_appointment');
      expect(result.confidence).toBeGreaterThan(0.8); // Should be boosted
    });

    it('should handle confirmation in booking flow', async () => {
      const context = {
        previousContext: {
          currentIntent: 'book_appointment'
        }
      };

      const result = await nlpService.extractIntentEntities('Oui', context);
      
      expect(result.intent).toBe('book_appointment');
      expect(result.confidence).toBe(0.9);
    });
  });

  describe('French Language Processing', () => {
    it('should handle French accents and variations', async () => {
      const testCases = [
        'Je voudrais un rendez-vous',
        'Je voudrais un rendez-vous',  // With accent
        'préférez-vous', // Accented characters
        'créneaux disponibles' // Multiple accents
      ];

      for (const message of testCases) {
        const result = await nlpService.extractIntentEntities(message);
        expect(result.confidence).toBeGreaterThan(0.0); // Should process without errors
      }
    });

    it('should normalize French medical terms', async () => {
      const testCases = [
        'nettoyage des dents',
        'plombage composite',
        'couronne dentaire',
        'chirurgie buccale'
      ];

      for (const message of testCases) {
        const result = await nlpService.extractIntentEntities(message);
        const serviceEntities = result.entities.filter(e => e.type === 'service_type');
        
        if (serviceEntities.length > 0) {
          expect(serviceEntities[0]).toHaveProperty('normalized');
          expect(serviceEntities[0].normalized).toBeTruthy();
        }
      }
    });
  });

  describe('Confidence Scoring', () => {
    it('should assign higher confidence to emergency patterns', async () => {
      const emergencyMessage = 'J\'ai très mal aux dents, c\'est urgent !';
      const regularMessage = 'Je voudrais prendre rendez-vous';

      const emergencyResult = await nlpService.extractIntentEntities(emergencyMessage);
      const regularResult = await nlpService.extractIntentEntities(regularMessage);

      expect(emergencyResult.intent).toBe('emergency');
      expect(regularResult.intent).toBe('book_appointment');
      expect(emergencyResult.confidence).toBeGreaterThan(regularResult.confidence);
    });

    it('should boost confidence when entities match intent', async () => {
      const messageWithEntities = 'Je veux prendre rendez-vous demain à 14h pour un détartrage';
      const messageWithoutEntities = 'Je veux prendre rendez-vous';

      const resultWithEntities = await nlpService.extractIntentEntities(messageWithEntities);
      const resultWithoutEntities = await nlpService.extractIntentEntities(messageWithoutEntities);

      expect(resultWithEntities.intent).toBe('book_appointment');
      expect(resultWithoutEntities.intent).toBe('book_appointment');
      expect(resultWithEntities.confidence).toBeGreaterThan(resultWithoutEntities.confidence);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty messages', async () => {
      const result = await nlpService.extractIntentEntities('');
      expect(result.intent).toBe('fallback');
      expect(result.confidence).toBeLessThan(0.5);
    });

    it('should handle very short messages', async () => {
      const result = await nlpService.extractIntentEntities('ok');
      expect(result).toBeDefined();
      expect(typeof result.confidence).toBe('number');
    });

    it('should handle mixed language messages', async () => {
      const result = await nlpService.extractIntentEntities('Hello, je voudrais un appointment');
      expect(result).toBeDefined();
      expect(result.confidence).toBeGreaterThan(0.0);
    });

    it('should handle messages with numbers and special characters', async () => {
      const message = 'RDV 15/12 @ 14:30 !!! urgent ???';
      const result = await nlpService.extractIntentEntities(message);
      
      expect(result).toBeDefined();
      expect(result.entities.length).toBeGreaterThan(0);
    });
  });

  describe('Health Check', () => {
    it('should pass health check with basic functionality', async () => {
      const isHealthy = await nlpService.healthCheck();
      expect(isHealthy).toBe(true);
    });
  });

  describe('Performance', () => {
    it('should process messages within reasonable time', async () => {
      const message = 'Je voudrais prendre un rendez-vous demain matin pour une consultation dentaire urgente';
      const startTime = Date.now();
      
      await nlpService.extractIntentEntities(message);
      
      const endTime = Date.now();
      const processingTime = endTime - startTime;
      
      expect(processingTime).toBeLessThan(1000); // Should process within 1 second
    });

    it('should handle multiple concurrent requests', async () => {
      const messages = [
        'Bonjour',
        'Je veux un rendez-vous',
        'Annuler mon rdv',
        'C\'est urgent',
        'Merci au revoir'
      ];

      const promises = messages.map(message => 
        nlpService.extractIntentEntities(message)
      );

      const results = await Promise.all(promises);
      
      expect(results).toHaveLength(5);
      results.forEach(result => {
        expect(result).toBeDefined();
        expect(typeof result.confidence).toBe('number');
      });
    });
  });
});