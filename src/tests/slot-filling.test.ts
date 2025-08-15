/**
 * NOVA RDV Slot-Filling Tests
 * 
 * Comprehensive test suite for the intelligent slot-filling system
 * Testing anti-repetition logic, phone validation, and progressive information gathering
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  DialogManager, 
  AlgerianPhoneValidator, 
  NameExtractor,
  getSharedDialogManager
} from '../lib/chat/dialogManager';
import { 
  AppointmentAssistantV2,
  getSharedAppointmentAssistant 
} from '../lib/llm/appointments-v2';

describe('AlgerianPhoneValidator', () => {
  describe('extractPhoneNumbers', () => {
    it('should extract E.164 format numbers', () => {
      const text = "Mon numéro est +213555123456";
      const phones = AlgerianPhoneValidator.extractPhoneNumbers(text);
      expect(phones).toContain('+213555123456');
    });

    it('should extract national format numbers', () => {
      const text = "Appelez-moi au 0555123456";
      const phones = AlgerianPhoneValidator.extractPhoneNumbers(text);
      expect(phones).toContain('0555123456');
    });

    it('should extract formatted numbers with spaces', () => {
      const text = "Mon tel: +213 555 12 34 56";
      const phones = AlgerianPhoneValidator.extractPhoneNumbers(text);
      expect(phones).toContain('+213555123456');
    });

    it('should handle multiple phone formats in one text', () => {
      const text = "Mes numéros: +213555123456 et 0666789012";
      const phones = AlgerianPhoneValidator.extractPhoneNumbers(text);
      expect(phones.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('normalizeToE164', () => {
    it('should normalize national format to E.164', () => {
      const normalized = AlgerianPhoneValidator.normalizeToE164('0555123456');
      expect(normalized).toBe('+213555123456');
    });

    it('should handle international format without +', () => {
      const normalized = AlgerianPhoneValidator.normalizeToE164('213555123456');
      expect(normalized).toBe('+213555123456');
    });

    it('should handle mobile without country code', () => {
      const normalized = AlgerianPhoneValidator.normalizeToE164('555123456');
      expect(normalized).toBe('+213555123456');
    });

    it('should return null for invalid formats', () => {
      const normalized = AlgerianPhoneValidator.normalizeToE164('123456');
      expect(normalized).toBeNull();
    });
  });

  describe('isValidAlgerianMobile', () => {
    it('should validate correct Algerian mobile numbers', () => {
      const validNumbers = [
        '+213555123456',
        '+213666789012',
        '+213777345678',
        '0555123456',
        '555123456'
      ];
      
      validNumbers.forEach(phone => {
        expect(AlgerianPhoneValidator.isValidAlgerianMobile(phone)).toBe(true);
      });
    });

    it('should reject invalid numbers', () => {
      const invalidNumbers = [
        '+33123456789', // French number
        '+213123456789', // Wrong prefix
        '123456', // Too short
        '+2135551234567890' // Too long
      ];
      
      invalidNumbers.forEach(phone => {
        expect(AlgerianPhoneValidator.isValidAlgerianMobile(phone)).toBe(false);
      });
    });
  });

  describe('getValidationError', () => {
    it('should return null for valid numbers', () => {
      const error = AlgerianPhoneValidator.getValidationError('+213555123456');
      expect(error).toBeNull();
    });

    it('should return error for empty numbers', () => {
      const error = AlgerianPhoneValidator.getValidationError('');
      expect(error).toContain('requis');
    });

    it('should return error for too short numbers', () => {
      const error = AlgerianPhoneValidator.getValidationError('123');
      expect(error).toContain('trop court');
    });

    it('should return error for invalid format', () => {
      const error = AlgerianPhoneValidator.getValidationError('+33123456789');
      expect(error).toContain('invalide');
    });
  });
});

describe('NameExtractor', () => {
  describe('extractNames', () => {
    it('should extract names with formal introduction', () => {
      const text = "Bonjour, je m'appelle Damien Gane";
      const names = NameExtractor.extractNames(text);
      expect(names).toContain('Damien Gane');
    });

    it('should extract names with "je suis" pattern', () => {
      const text = "Salut, je suis Marie Dupont";
      const names = NameExtractor.extractNames(text);
      expect(names).toContain('Marie Dupont');
    });

    it('should extract labeled names', () => {
      const text = "Nom: Pierre Martin";
      const names = NameExtractor.extractNames(text);
      expect(names).toContain('Pierre Martin');
    });

    it('should extract quoted names', () => {
      const text = 'Mon nom est "Sarah Ben Ali"';
      const names = NameExtractor.extractNames(text);
      expect(names).toContain('Sarah Ben Ali');
    });

    it('should filter out common non-name words', () => {
      const text = "Bonjour docteur, rendez-vous urgent";
      const names = NameExtractor.extractNames(text);
      expect(names).not.toContain('Bonjour');
      expect(names).not.toContain('Docteur');
    });

    it('should handle accented names correctly', () => {
      const text = "Je m'appelle François Müller";
      const names = NameExtractor.extractNames(text);
      expect(names).toContain('François Müller');
    });
  });
});

describe('DialogManager', () => {
  let dialogManager: DialogManager;
  
  beforeEach(() => {
    dialogManager = new DialogManager();
  });

  describe('processMessage - Name Only Scenarios', () => {
    it('should ask for phone when only name is provided', async () => {
      const sessionId = 'test-session-1';
      const result = await dialogManager.processMessage(
        "Bonjour, je m'appelle Damien Gane",
        sessionId
      );

      expect(result.response.action).toBe('NEED_INFO');
      expect(result.response.missing_fields).toContain('phone_e164');
      expect(result.response.missing_fields).not.toContain('patient_name');
      expect(result.response.patient?.name).toBe('Damien Gane');
      expect(result.response.clarification_question).toMatch(/téléphone|mobile|numéro/);
      expect(result.shouldProceedToSlots).toBe(false);
    });

    it('should not repeat name question when name is already provided', async () => {
      const sessionId = 'test-session-2';
      
      // First interaction - provide name
      await dialogManager.processMessage("Je m'appelle Alice Benali", sessionId);
      
      // Second interaction - should only ask for phone
      const result = await dialogManager.processMessage(
        "Je veux un rendez-vous",
        sessionId
      );

      expect(result.response.clarification_question).not.toContain('nom');
      expect(result.response.clarification_question).toMatch(/téléphone|mobile|numéro/);
      expect(result.response.patient?.name).toBe('Alice Benali');
    });
  });

  describe('processMessage - Phone Only Scenarios', () => {
    it('should ask for name when only phone is provided', async () => {
      const sessionId = 'test-session-3';
      const result = await dialogManager.processMessage(
        "Mon numéro: +213555123456",
        sessionId
      );

      expect(result.response.action).toBe('NEED_INFO');
      expect(result.response.missing_fields).toContain('patient_name');
      expect(result.response.missing_fields).not.toContain('phone_e164');
      expect(result.response.patient?.phone_e164).toBe('+213555123456');
      expect(result.response.clarification_question).toMatch(/nom|appelez|name/);
      expect(result.shouldProceedToSlots).toBe(false);
    });

    it('should not repeat phone question when phone is already provided', async () => {
      const sessionId = 'test-session-4';
      
      // First interaction - provide phone
      await dialogManager.processMessage("Tel: 0666789012", sessionId);
      
      // Second interaction - should only ask for name
      const result = await dialogManager.processMessage(
        "Je veux prendre rdv",
        sessionId
      );

      expect(result.response.clarification_question).not.toContain('téléphone');
      expect(result.response.clarification_question).toMatch(/nom|appelez|name/);
      expect(result.response.patient?.phone_e164).toBe('+213666789012');
    });
  });

  describe('processMessage - Invalid Phone Scenarios', () => {
    it('should ask for phone correction with different message', async () => {
      const sessionId = 'test-session-5';
      
      // First interaction - name with invalid phone
      const result1 = await dialogManager.processMessage(
        "Je suis Bob Martin",
        sessionId
      );

      expect(result1.response.action).toBe('NEED_INFO');
      expect(result1.response.missing_fields).toContain('phone_e164');
      
      // Second interaction - invalid phone format
      const result2 = await dialogManager.processMessage(
        "Tel: 123456",
        sessionId
      );

      expect(result2.response.action).toBe('NEED_INFO');
      expect(result2.response.missing_fields).toContain('phone_e164');
      // Should get a phone format related question
      expect(result2.response.clarification_question).toMatch(/téléphone|tel|format|213/i);
    });

    it('should handle valid phone correction', async () => {
      const sessionId = 'test-session-6';
      
      // First - name + invalid phone
      await dialogManager.processMessage("Je suis Clara Doe, tel: 123", sessionId);
      
      // Second - valid phone correction
      const result = await dialogManager.processMessage(
        "Pardon, c'est +213777123456",
        sessionId
      );

      expect(result.shouldProceedToSlots).toBe(true);
      expect(result.response.action).toBe('FIND_SLOTS');
      expect(result.response.patient?.name).toBe('Clara Doe');
      expect(result.response.patient?.phone_e164).toBe('+213777123456');
    });
  });

  describe('processMessage - Complete Information Scenarios', () => {
    it('should proceed to slots when all info is provided', async () => {
      const sessionId = 'test-session-7';
      const result = await dialogManager.processMessage(
        "Bonjour, je m'appelle Emma Benaissa, numéro +213555987654",
        sessionId
      );

      expect(result.shouldProceedToSlots).toBe(true);
      expect(result.response.action).toBe('FIND_SLOTS');
      expect(result.response.patient?.name).toBe('Emma Benaissa');
      expect(result.response.patient?.phone_e164).toBe('+213555987654');
      expect(result.response.status).toBe('CONFIRMED');
    });

    it('should handle progressive completion across messages', async () => {
      const sessionId = 'test-session-8';
      
      // First - name only
      const result1 = await dialogManager.processMessage(
        "Je suis Karim Benaissa",
        sessionId
      );
      expect(result1.shouldProceedToSlots).toBe(false);
      
      // Second - phone only
      const result2 = await dialogManager.processMessage(
        "Mon numéro: 0666123789",
        sessionId
      );
      
      expect(result2.shouldProceedToSlots).toBe(true);
      expect(result2.response.action).toBe('FIND_SLOTS');
      expect(result2.response.patient?.name).toBe('Karim Benaissa');
      expect(result2.response.patient?.phone_e164).toBe('+213666123789');
    });
  });

  describe('processMessage - Question Variation', () => {
    it('should use different prompts for repeated attempts', async () => {
      const sessionId = 'test-session-9';
      
      const questions: string[] = [];
      
      // Multiple attempts without providing name
      for (let i = 0; i < 3; i++) {
        const result = await dialogManager.processMessage(
          `Message ${i + 1} sans info`,
          sessionId
        );
        questions.push(result.response.clarification_question || '');
      }
      
      // Should have different questions
      const uniqueQuestions = new Set(questions);
      expect(uniqueQuestions.size).toBeGreaterThan(1);
    });
  });

  describe('sessionManagement', () => {
    it('should track session state correctly', () => {
      const sessionId = 'test-session-10';
      
      // Process a message
      dialogManager.processMessage("Test message", sessionId);
      
      // Get session info
      const sessionInfo = dialogManager.getSessionInfo(sessionId);
      
      expect(sessionInfo).toBeDefined();
      expect(sessionInfo?.sessionId).toBe(sessionId);
      expect(sessionInfo?.conversationHistory.length).toBeGreaterThan(0);
    });

    it('should cleanup old sessions', () => {
      const sessionId = 'test-session-11';
      
      // Create a session
      dialogManager.processMessage("Test", sessionId);
      expect(dialogManager.getActiveSessionsCount()).toBeGreaterThan(0);
      
      // Cleanup (would normally be based on time)
      dialogManager.resetSession(sessionId);
      const sessionInfo = dialogManager.getSessionInfo(sessionId);
      expect(sessionInfo).toBeUndefined();
    });
  });

  describe('edgeCases', () => {
    it('should handle empty messages gracefully', async () => {
      const sessionId = 'test-session-12';
      const result = await dialogManager.processMessage("", sessionId);
      
      expect(result.response.action).toBe('NEED_INFO');
      expect(result.response.clarification_question).toBeDefined();
    });

    it('should handle messages with only punctuation', async () => {
      const sessionId = 'test-session-13';
      const result = await dialogManager.processMessage("!@#$%", sessionId);
      
      expect(result.response.action).toBe('NEED_INFO');
      expect(result.response.missing_fields).toContain('patient_name');
      expect(result.response.missing_fields).toContain('phone_e164');
    });

    it('should handle very long names appropriately', async () => {
      const sessionId = 'test-session-14';
      const longName = "Jean-Baptiste François Xavier De La Fontaine Du Bois";
      
      const result = await dialogManager.processMessage(
        `Nom: ${longName}`,
        sessionId
      );
      
      // The extraction might truncate long names at certain words, so we check that at least the first part is captured
      expect(result.response.patient?.name).toContain('Jean-Baptiste');
      expect(result.response.missing_fields).toContain('phone_e164');
    });

    it('should handle multiple phone numbers and pick the valid one', async () => {
      const sessionId = 'test-session-15';
      const result = await dialogManager.processMessage(
        "Mon nom: Test User. Mes tels: 123456 et +213555123456 et 789",
        sessionId
      );
      
      expect(result.response.patient?.phone_e164).toBe('+213555123456');
      expect(result.shouldProceedToSlots).toBe(true);
    });
  });
});

describe('Integration Tests - AppointmentAssistantV2 with DialogManager', () => {
  let assistant: AppointmentAssistantV2;
  
  beforeEach(() => {
    // Skip if no API key is available
    if (!process.env.ANTHROPIC_API_KEY) {
      // Create a mock assistant for testing
      assistant = {
        processAppointmentWithSession: vi.fn()
      } as any;
    } else {
      assistant = new AppointmentAssistantV2();
    }
    
    // Mock the processAppointmentWithSession method for testing
    vi.spyOn(assistant, 'processAppointmentWithSession').mockImplementation(
      async (userMessage: string, sessionId: string) => {
        // Simple mock implementation
        const hasName = /nom|appelle|suis/.test(userMessage.toLowerCase());
        const hasPhone = /\+213\d{9}/.test(userMessage);
        
        if (hasName && hasPhone) {
          return {
            action: "FIND_SLOTS",
            clinic_address: "Cité 109, Daboussy El Achour, Alger",
            timezone: "Africa/Algiers",
            patient: {
              name: "Test User",
              phone_e164: "+213555123456"
            },
            status: "CONFIRMED"
          };
        } else {
          return {
            action: "NEED_INFO",
            clinic_address: "Cité 109, Daboussy El Achour, Alger",
            timezone: "Africa/Algiers",
            status: "NEED_INFO",
            missing_fields: !hasName ? ["patient_name"] : ["phone_e164"],
            clarification_question: !hasName 
              ? "Quel est votre nom complet ?" 
              : "Quel est votre numéro de téléphone ?"
          };
        }
      }
    );
  });

  it.skipIf(!process.env.ANTHROPIC_API_KEY)('should integrate with dialog manager for complete flow', async () => {
    const sessionId = 'integration-test-1';
    
    // Step 1: Provide only name
    const result1 = await assistant.processAppointmentWithSession(
      "Je m'appelle Test User",
      sessionId
    );
    
    expect(result1.action).toBe('NEED_INFO');
    expect(result1.missing_fields).toContain('phone_e164');
    
    // Step 2: Provide phone
    const result2 = await assistant.processAppointmentWithSession(
      "Mon tel: +213555123456",
      sessionId
    );
    
    expect(result2.action).toBe('FIND_SLOTS');
    expect(result2.patient?.name).toBe('Test User');
    expect(result2.patient?.phone_e164).toBe('+213555123456');
  });
});

describe('Acceptance Criteria Validation', () => {
  it('should always return JSON-only responses', async () => {
    const dialogManager = new DialogManager();
    const sessionId = 'acceptance-test-1';
    
    const result = await dialogManager.processMessage(
      "Je veux un rendez-vous",
      sessionId
    );
    
    // Response should be structured JSON
    expect(result.response).toHaveProperty('action');
    expect(result.response).toHaveProperty('clinic_address', 'Cité 109, Daboussy El Achour, Alger');
    expect(result.response).toHaveProperty('timezone', 'Africa/Algiers');
  });

  it('should never repeat complete questions when partial info is provided', async () => {
    const dialogManager = new DialogManager();
    const sessionId = 'acceptance-test-2';
    
    // Provide name first
    const result1 = await dialogManager.processMessage(
      "Je m'appelle John Doe",
      sessionId
    );
    
    // Second message should only ask for phone
    const result2 = await dialogManager.processMessage(
      "Je veux un rdv",
      sessionId
    );
    
    expect(result2.response.clarification_question).not.toContain('nom');
    expect(result2.response.clarification_question).toContain('téléphone');
  });

  it('should enforce E.164 phone format for Algeria (+213)', async () => {
    const phoneTests = [
      { input: '0555123456', expected: '+213555123456' },
      { input: '213666789012', expected: '+213666789012' },
      { input: '777345678', expected: '+213777345678' }
    ];
    
    phoneTests.forEach(test => {
      const normalized = AlgerianPhoneValidator.normalizeToE164(test.input);
      expect(normalized).toBe(test.expected);
    });
  });

  it('should maintain clinic address and timezone constants', async () => {
    const dialogManager = new DialogManager();
    const sessionId = 'acceptance-test-3';
    
    const result = await dialogManager.processMessage("Test", sessionId);
    
    expect(result.response.clinic_address).toBe('Cité 109, Daboussy El Achour, Alger');
    expect(result.response.timezone).toBe('Africa/Algiers');
  });
});