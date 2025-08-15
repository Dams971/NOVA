/**
 * NOVA RDV Dialog Manager - Advanced session state management
 * 
 * Features:
 * - Session state tracking with anti-repetition logic
 * - Smart phone extraction with Algerian number patterns
 * - E.164 normalization for +213 numbers
 * - Progressive slot-filling with unique prompt generation
 * - Comprehensive field validation and extraction
 */

import { AppointmentResponseV2, SessionState } from '../llm/appointments-v2';

// Algerian phone number patterns and validation
export class AlgerianPhoneValidator {
  // Common Algerian mobile prefixes
  private static readonly ALGERIAN_MOBILE_PREFIXES = [
    '05', '06', '07', // Traditional prefixes
    '555', '556', '557', '558', '559', // Djezzy
    '660', '661', '662', '663', '664', '665', '666', '667', '668', '669', // Mobilis
    '770', '771', '772', '773', '774', '775', '776', '777', '778', '779'  // Ooredoo
  ];

  // Regex patterns for extraction
  private static readonly PATTERNS = {
    // E.164 format: +213XXXXXXXXX
    e164: /\+213[567]\d{8}/g,
    // National format: 0XXXXXXXXX
    national: /0[567]\d{8}/g,
    // International without +: 213XXXXXXXXX
    international: /213[567]\d{8}/g,
    // With spaces/dashes: +213 X XX XX XX XX (fixed pattern)
    formatted: /\+213\s*[567]\s*\d{2}\s*\d{2}\s*\d{2}\s*\d{2}/g,
    // Loose pattern for partial numbers
    partial: /(?:\+?213[\s\-]?)?[567]\d{7,8}/g
  };

  /**
   * Extract all potential phone numbers from text
   */
  static extractPhoneNumbers(text: string): string[] {
    const found: string[] = [];
    
    // Try each pattern
    Object.values(this.PATTERNS).forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        found.push(...matches);
      }
    });

    // Remove duplicates and clean up
    return [...new Set(found.map(phone => this.cleanPhoneNumber(phone)).filter(phone => phone.length > 8))];
  }

  /**
   * Clean phone number by removing spaces and dashes
   */
  private static cleanPhoneNumber(phone: string): string {
    return phone.replace(/[\s\-]/g, '');
  }

  /**
   * Normalize to E.164 format (+213XXXXXXXXX)
   */
  static normalizeToE164(phone: string): string | null {
    const cleaned = this.cleanPhoneNumber(phone);
    
    // Already E.164
    if (/^\+213[567]\d{8}$/.test(cleaned)) {
      return cleaned;
    }
    
    // National format: 0XXXXXXXXX → +213XXXXXXXXX
    if (/^0[567]\d{8}$/.test(cleaned)) {
      return '+213' + cleaned.substring(1);
    }
    
    // International without +: 213XXXXXXXXX → +213XXXXXXXXX
    if (/^213[567]\d{8}$/.test(cleaned)) {
      return '+' + cleaned;
    }
    
    // Mobile number without country code: [567]XXXXXXXX → +213[567]XXXXXXXX
    if (/^[567]\d{8}$/.test(cleaned)) {
      return '+213' + cleaned;
    }
    
    return null;
  }

  /**
   * Validate if phone number is valid Algerian mobile
   */
  static isValidAlgerianMobile(phone: string): boolean {
    const e164 = this.normalizeToE164(phone);
    return e164 !== null && /^\+213[567]\d{8}$/.test(e164);
  }

  /**
   * Get validation error message for invalid phone
   */
  static getValidationError(phone: string): string | null {
    if (!phone || phone.trim().length === 0) {
      return "Numéro de téléphone requis";
    }

    const cleaned = this.cleanPhoneNumber(phone);
    
    // Too short
    if (cleaned.length < 9) {
      return "Numéro trop court. Format attendu: +213XXXXXXXXX";
    }
    
    // Too long
    if (cleaned.length > 13) {
      return "Numéro trop long. Format attendu: +213XXXXXXXXX";
    }
    
    // Invalid prefix
    if (!this.isValidAlgerianMobile(phone)) {
      return "Numéro invalide. Utilisez un numéro mobile algérien (ex: +213555123456)";
    }
    
    return null;
  }
}

// Name extraction and validation
export class NameExtractor {
  // Common name patterns
  private static readonly NAME_PATTERNS = {
    // Full names with common prefixes (improved to stop at common words)
    formal: /(?:je\s+(?:m'appelle|suis)|mon\s+nom\s+(?:est|c'est)|je\s+m'appel+e?)\s+([A-Za-zÀ-ÿ\s\-]{2,40})(?:\s+(?:et|de|du|des|le|la|les|mon|ma|mes|votre|pour|avec|numéro|téléphone|tel|rdv|rendez-vous)|$)/gi,
    // Simple "nom: VALUE" patterns
    labeled: /nom\s*[:=]\s*([A-Za-zÀ-ÿ\s\-]{2,40})/gi,
    // Names in quotes
    quoted: /["']([A-Za-zÀ-ÿ\s\-]{2,40})["']/g,
    // Standalone capitalized names (heuristic) - more restrictive
    standalone: /\b([A-ZÀ-Ÿ][a-zà-ÿ]+(?:\s+[A-ZÀ-Ÿ][a-zà-ÿ]+){1,3})\b/g
  };

  // Common non-name words to filter out
  private static readonly EXCLUDED_WORDS = new Set([
    'bonjour', 'bonsoir', 'salut', 'merci', 'rendez-vous', 'rdv', 'consultation',
    'docteur', 'cabinet', 'clinique', 'urgence', 'téléphone', 'numéro',
    'aujourd', 'demain', 'après', 'avant', 'heure', 'heures', 'minute', 'minutes'
  ]);

  /**
   * Extract potential names from text
   */
  static extractNames(text: string): string[] {
    const found: string[] = [];
    
    // Try each pattern
    Object.values(this.NAME_PATTERNS).forEach(pattern => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const name = match[1]?.trim();
        if (name && this.isValidName(name)) {
          found.push(this.normalizeName(name));
        }
      }
    });

    // Remove duplicates
    return [...new Set(found)];
  }

  /**
   * Validate if extracted text looks like a real name
   */
  private static isValidName(name: string): boolean {
    const normalized = name.toLowerCase().trim();
    
    // Too short or too long
    if (normalized.length < 2 || normalized.length > 50) {
      return false;
    }
    
    // Contains excluded words
    if (this.EXCLUDED_WORDS.has(normalized)) {
      return false;
    }
    
    // Must contain at least one letter
    if (!/[a-zA-ZÀ-ÿ]/.test(normalized)) {
      return false;
    }
    
    // No numbers (usually)
    if (/\d/.test(normalized)) {
      return false;
    }
    
    return true;
  }

  /**
   * Normalize name format (Title Case)
   */
  private static normalizeName(name: string): string {
    return name
      .trim()
      .split(/\s+/)
      .map(word => {
        // Handle hyphenated names like Jean-Baptiste
        if (word.includes('-')) {
          return word.split('-')
            .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
            .join('-');
        }
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      })
      .join(' ');
  }
}

// Enhanced dialog state interface
export interface DialogState extends SessionState {
  extractedInfo: {
    potentialNames: string[];
    potentialPhones: string[];
    confirmedName?: string;
    confirmedPhone?: string;
  };
  conversationHistory: Array<{
    role: 'user' | 'bot';
    message: string;
    timestamp: Date;
    extractedData?: any;
  }>;
  promptVariations: {
    namePrompts: string[];
    phonePrompts: string[];
    usedPrompts: Set<string>;
  };
}

// Question variation templates
const PROMPT_TEMPLATES = {
  nameOnly: [
    "Pour prendre rendez-vous, j'ai besoin de votre nom complet s'il vous plaît.",
    "Quel est votre nom complet pour le rendez-vous ?",
    "Pouvez-vous me donner votre nom complet ?",
    "Comment vous appelez-vous ?",
    "Sous quel nom dois-je enregistrer le rendez-vous ?"
  ],
  phoneOnly: [
    "Il me faut également votre numéro de téléphone au format +213XXXXXXXXX.",
    "Quel est votre numéro de téléphone mobile (format +213...) ?",
    "Pouvez-vous me communiquer votre numéro de téléphone ?",
    "J'ai besoin de votre numéro mobile algérien (+213...).",
    "Votre numéro de téléphone pour confirmer le RDV ?"
  ],
  phoneRetry: [
    "Ce numéro ne semble pas valide. Utilisez le format +213XXXXXXXXX s'il vous plaît.",
    "Format de téléphone incorrect. Exemple: +213555123456",
    "Vérifiez votre numéro mobile algérien (+213...).",
    "Le format attendu est +213 suivi de 9 chiffres.",
    "Numéro invalide. Réessayez avec +213XXXXXXXXX."
  ],
  both: [
    "Pour prendre rendez-vous, j'ai besoin de votre nom complet et numéro de téléphone (+213...).",
    "Pouvez-vous me donner votre nom et votre numéro mobile algérien ?",
    "Il me faut vos informations: nom complet et téléphone au format +213XXXXXXXXX.",
    "Nom et numéro de téléphone s'il vous plaît pour le rendez-vous."
  ]
};

/**
 * Advanced Dialog Manager with intelligent slot-filling
 */
export class DialogManager {
  private dialogStates: Map<string, DialogState> = new Map();
  private readonly maxSessionAge = 30 * 60 * 1000; // 30 minutes

  /**
   * Get or create dialog state for session
   */
  private getDialogState(sessionId: string): DialogState {
    let state = this.dialogStates.get(sessionId);
    
    if (!state) {
      state = {
        sessionId,
        attemptCounts: { name: 0, phone: 0, total: 0 },
        collectedFields: new Set(),
        createdAt: new Date(),
        updatedAt: new Date(),
        extractedInfo: {
          potentialNames: [],
          potentialPhones: []
        },
        conversationHistory: [],
        promptVariations: {
          namePrompts: [...PROMPT_TEMPLATES.nameOnly],
          phonePrompts: [...PROMPT_TEMPLATES.phoneOnly],
          usedPrompts: new Set()
        }
      };
      
      this.dialogStates.set(sessionId, state);
    }
    
    return state;
  }

  /**
   * Extract and validate information from user message
   */
  private extractInformation(message: string, state: DialogState): {
    name?: string;
    phone?: string;
    hasNewInfo: boolean;
  } {
    const result: any = { hasNewInfo: false };
    
    // Extract names
    const names = NameExtractor.extractNames(message);
    if (names.length > 0) {
      state.extractedInfo.potentialNames.push(...names);
      // Use the most complete name
      const bestName = names.reduce((a, b) => a.length > b.length ? a : b);
      if (!state.extractedInfo.confirmedName || bestName.length > state.extractedInfo.confirmedName.length) {
        state.extractedInfo.confirmedName = bestName;
        result.name = bestName;
        result.hasNewInfo = true;
      }
    }
    
    // Extract phones
    const phones = AlgerianPhoneValidator.extractPhoneNumbers(message);
    if (phones.length > 0) {
      state.extractedInfo.potentialPhones.push(...phones);
      // Try to normalize the best phone
      for (const phone of phones) {
        const normalized = AlgerianPhoneValidator.normalizeToE164(phone);
        if (normalized && AlgerianPhoneValidator.isValidAlgerianMobile(normalized)) {
          state.extractedInfo.confirmedPhone = normalized;
          result.phone = normalized;
          result.hasNewInfo = true;
          break;
        }
      }
    }
    
    return result;
  }

  /**
   * Generate unique clarification question
   */
  private generateUniqueQuestion(
    missingFields: string[],
    state: DialogState,
    validationError?: string
  ): string {
    const hasName = state.extractedInfo.confirmedName;
    const hasPhone = state.extractedInfo.confirmedPhone;
    
    // Handle phone validation errors
    if (validationError && missingFields.includes('phone_e164')) {
      const retryPrompts = PROMPT_TEMPLATES.phoneRetry.filter(
        prompt => !state.promptVariations.usedPrompts.has(prompt)
      );
      
      if (retryPrompts.length > 0) {
        const selected = retryPrompts[Math.floor(Math.random() * retryPrompts.length)];
        state.promptVariations.usedPrompts.add(selected);
        return selected;
      }
    }
    
    // Missing phone only (have name)
    if (hasName && !hasPhone) {
      const phonePrompts = state.promptVariations.phonePrompts.filter(
        prompt => !state.promptVariations.usedPrompts.has(prompt)
      );
      
      if (phonePrompts.length > 0) {
        const selected = phonePrompts[Math.floor(Math.random() * phonePrompts.length)];
        state.promptVariations.usedPrompts.add(selected);
        return selected;
      }
    }
    
    // Missing name only (have phone)
    if (!hasName && hasPhone) {
      const namePrompts = state.promptVariations.namePrompts.filter(
        prompt => !state.promptVariations.usedPrompts.has(prompt)
      );
      
      if (namePrompts.length > 0) {
        const selected = namePrompts[Math.floor(Math.random() * namePrompts.length)];
        state.promptVariations.usedPrompts.add(selected);
        return selected;
      }
    }
    
    // Missing both
    if (!hasName && !hasPhone) {
      const bothPrompts = PROMPT_TEMPLATES.both.filter(
        prompt => !state.promptVariations.usedPrompts.has(prompt)
      );
      
      if (bothPrompts.length > 0) {
        const selected = bothPrompts[Math.floor(Math.random() * bothPrompts.length)];
        state.promptVariations.usedPrompts.add(selected);
        return selected;
      }
    }
    
    // Fallback if all variations used
    return "Pouvez-vous me donner les informations manquantes pour le rendez-vous ?";
  }

  /**
   * Process user message with intelligent slot-filling
   */
  async processMessage(
    message: string,
    sessionId: string
  ): Promise<{
    response: AppointmentResponseV2;
    shouldProceedToSlots: boolean;
    validationErrors: string[];
  }> {
    const state = this.getDialogState(sessionId);
    
    // Update conversation history
    state.conversationHistory.push({
      role: 'user',
      message,
      timestamp: new Date()
    });
    
    // Extract information from current message
    const extracted = this.extractInformation(message, state);
    
    // Update attempt counts
    if (extracted.hasNewInfo) {
      if (extracted.name) state.attemptCounts.name++;
      if (extracted.phone) state.attemptCounts.phone++;
    }
    state.attemptCounts.total++;
    state.updatedAt = new Date();
    
    // Validate current state
    const validationErrors: string[] = [];
    const missingFields: string[] = [];
    
    // Check name
    if (!state.extractedInfo.confirmedName) {
      missingFields.push('patient_name');
    }
    
    // Check phone
    if (!state.extractedInfo.confirmedPhone) {
      missingFields.push('phone_e164');
    } else {
      // Validate phone format
      const phoneError = AlgerianPhoneValidator.getValidationError(
        state.extractedInfo.confirmedPhone
      );
      if (phoneError) {
        validationErrors.push(phoneError);
        missingFields.push('phone_e164');
        // Clear invalid phone
        state.extractedInfo.confirmedPhone = undefined;
      }
    }
    
    // Check for potential phone extraction from current message
    const potentialPhones = AlgerianPhoneValidator.extractPhoneNumbers(message);
    if (potentialPhones.length > 0 && !state.extractedInfo.confirmedPhone) {
      // Try to validate each potential phone
      for (const phone of potentialPhones) {
        const phoneError = AlgerianPhoneValidator.getValidationError(phone);
        if (phoneError) {
          validationErrors.push(phoneError);
          missingFields.push('phone_e164');
        }
      }
    }
    
    // Determine response
    let response: AppointmentResponseV2;
    let shouldProceedToSlots = false;
    
    if (missingFields.length === 0 && validationErrors.length === 0) {
      // All info collected and valid - proceed to slot selection
      shouldProceedToSlots = true;
      response = {
        action: "FIND_SLOTS",
        clinic_address: "Cité 109, Daboussy El Achour, Alger",
        timezone: "Africa/Algiers",
        patient: {
          name: state.extractedInfo.confirmedName!,
          phone_e164: state.extractedInfo.confirmedPhone!
        },
        status: "CONFIRMED"
      };
    } else {
      // Need more info
      const clarificationQuestion = this.generateUniqueQuestion(
        missingFields,
        state,
        validationErrors[0]
      );
      
      response = {
        action: "NEED_INFO",
        clinic_address: "Cité 109, Daboussy El Achour, Alger",
        timezone: "Africa/Algiers",
        status: "NEED_INFO",
        missing_fields: missingFields,
        clarification_question: clarificationQuestion,
        // Always include patient info when available
        patient: {
          ...(state.extractedInfo.confirmedName && { name: state.extractedInfo.confirmedName }),
          ...(state.extractedInfo.confirmedPhone && { phone_e164: state.extractedInfo.confirmedPhone })
        }
      };
      
      // Update bot message history
      state.conversationHistory.push({
        role: 'bot',
        message: clarificationQuestion,
        timestamp: new Date()
      });
      
      state.lastBotMessage = clarificationQuestion;
    }
    
    return {
      response,
      shouldProceedToSlots,
      validationErrors
    };
  }

  /**
   * Get session information for debugging
   */
  getSessionInfo(sessionId: string): DialogState | undefined {
    return this.dialogStates.get(sessionId);
  }

  /**
   * Cleanup old sessions
   */
  cleanupSessions(): number {
    const cutoff = new Date(Date.now() - this.maxSessionAge);
    let cleaned = 0;
    
    for (const [sessionId, state] of this.dialogStates.entries()) {
      if (state.updatedAt < cutoff) {
        this.dialogStates.delete(sessionId);
        cleaned++;
      }
    }
    
    return cleaned;
  }

  /**
   * Get active sessions count
   */
  getActiveSessionsCount(): number {
    return this.dialogStates.size;
  }

  /**
   * Force reset a session (for testing)
   */
  resetSession(sessionId: string): void {
    this.dialogStates.delete(sessionId);
  }
}

// Export singleton instance
let sharedDialogManager: DialogManager | null = null;

export function getSharedDialogManager(): DialogManager {
  if (!sharedDialogManager) {
    sharedDialogManager = new DialogManager();
  }
  return sharedDialogManager;
}