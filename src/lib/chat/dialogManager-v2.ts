/**
 * NOVA RDV Dialog Manager v2 - Enhanced session state management
 * 
 * Features:
 * - Welcome state tracking with UI elements
 * - Advanced out-of-scope detection and human handoff logic
 * - Enhanced phone validation with libphonenumber-js
 * - Improved deduplication and anti-repetition
 * - Comprehensive session context management
 */

import { parsePhoneNumber, isValidPhoneNumber, CountryCode } from 'libphonenumber-js';
import { AppointmentResponseV3, SessionStateV3, OutOfScopeDetector, PhoneValidatorV3 } from '../llm/appointments-v3';

// Enhanced name extraction patterns
export class NameExtractorV2 {
  private static readonly NAME_PATTERNS = {
    // Improved formal patterns with better boundary detection
    formal: /(?:je\s+(?:m'appelle|suis)|mon\s+nom\s+(?:est|c'est)|je\s+m'appel+e?)\s+([A-Za-zÀ-ÿ\s\-]{2,50})(?:\s+(?:et|de|du|des|le|la|les|mon|ma|mes|votre|pour|avec|numéro|téléphone|tel|rdv|rendez-vous|appointment)|[.,!?]|$)/gi,
    // Enhanced labeled patterns
    labeled: /(?:nom|name)\s*[:=]\s*([A-Za-zÀ-ÿ\s\-]{2,50})(?:\s|[.,!?]|$)/gi,
    // Names in quotes or parentheses
    quoted: /["'()]([A-Za-zÀ-ÿ\s\-]{2,50})["')]/g,
    // Standalone capitalized names (more restrictive)
    standalone: /\b([A-ZÀ-Ÿ][a-zà-ÿ]+(?:\s+[A-ZÀ-Ÿ][a-zà-ÿ]+){0,3})\b/g
  };

  // Extended exclusion list
  private static readonly EXCLUDED_WORDS = new Set([
    'bonjour', 'bonsoir', 'salut', 'merci', 'rendez-vous', 'rdv', 'consultation',
    'docteur', 'cabinet', 'clinique', 'urgence', 'téléphone', 'numéro', 'numero',
    'aujourd', 'demain', 'après', 'avant', 'heure', 'heures', 'minute', 'minutes',
    'algeria', 'algérie', 'alger', 'nova', 'assistant', 'chatbot', 'aide',
    'prendre', 'voir', 'calendrier', 'informations', 'contact', 'email'
  ]);

  static extractNames(text: string): string[] {
    const found: string[] = [];
    
    Object.values(this.NAME_PATTERNS).forEach(pattern => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const name = match[1]?.trim();
        if (name && this.isValidName(name)) {
          found.push(this.normalizeName(name));
        }
      }
    });

    return [...new Set(found)];
  }

  private static isValidName(name: string): boolean {
    const normalized = name.toLowerCase().trim();
    
    if (normalized.length < 2 || normalized.length > 50) return false;
    if (this.EXCLUDED_WORDS.has(normalized)) return false;
    if (!/[a-zA-ZÀ-ÿ]/.test(normalized)) return false;
    if (/\d/.test(normalized)) return false;
    
    // Must have at least one vowel and consonant for realistic names
    const hasVowel = /[aeiouàáâãäåæèéêëìíîïòóôõöøùúûüý]/i.test(normalized);
    const hasConsonant = /[bcdfghjklmnpqrstvwxyz]/i.test(normalized);
    
    return hasVowel && hasConsonant;
  }

  private static normalizeName(name: string): string {
    return name
      .trim()
      .split(/\s+/)
      .map(word => {
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
export interface DialogStateV2 extends SessionStateV3 {
  extractedInfo: {
    potentialNames: string[];
    potentialPhones: string[];
    confirmedName?: string;
    confirmedPhone?: string;
    lastExtractedName?: string;
    lastExtractedPhone?: string;
  };
  conversationHistory: Array<{
    role: 'user' | 'bot';
    message: string;
    timestamp: Date;
    extractedData?: any;
    outOfScopeDetection?: any;
  }>;
  promptVariations: {
    namePrompts: string[];
    phonePrompts: string[];
    combinedPrompts: string[];
    usedPrompts: Set<string>;
  };
  handoffState: {
    isHandoffPending: boolean;
    handoffReason?: string;
    handoffCategory?: string;
    handoffAttempts: number;
  };
  welcomeState: {
    hasShownWelcome: boolean;
    selectedAction?: string;
    welcomeTimestamp?: Date;
  };
}

// Enhanced prompt templates with more variations
const PROMPT_TEMPLATES_V2 = {
  nameOnly: [
    "Pour prendre rendez-vous, j'ai besoin de votre nom complet s'il vous plaît.",
    "Quel est votre nom complet pour le rendez-vous ?",
    "Pouvez-vous me donner votre nom complet ?",
    "Comment vous appelez-vous ?",
    "Sous quel nom dois-je enregistrer le rendez-vous ?",
    "Il me faut votre nom complet pour continuer.",
    "Votre nom et prénom s'il vous plaît ?",
    "Merci de me communiquer votre nom complet."
  ],
  phoneOnly: [
    "Il me faut également votre numéro de téléphone au format +213XXXXXXXXX.",
    "Quel est votre numéro de téléphone mobile (format +213...) ?",
    "Pouvez-vous me communiquer votre numéro de téléphone ?",
    "J'ai besoin de votre numéro mobile algérien (+213...).",
    "Votre numéro de téléphone pour confirmer le RDV ?",
    "Merci de me donner votre numéro de mobile (+213...).",
    "Il me faut un numéro de téléphone pour vous joindre.",
    "Quel numéro puis-je utiliser pour vous contacter ?"
  ],
  phoneRetry: [
    "Ce numéro ne semble pas valide. Utilisez le format +213XXXXXXXXX s'il vous plaît.",
    "Format de téléphone incorrect. Exemple: +213555123456",
    "Vérifiez votre numéro mobile algérien (+213...).",
    "Le format attendu est +213 suivi de 9 chiffres.",
    "Numéro invalide. Réessayez avec +213XXXXXXXXX.",
    "Ce format n'est pas reconnu. Utilisez +213[567]XXXXXXXX.",
    "Numéro non valide. Format correct: +213 5XX XXX XXX.",
    "Merci de corriger le format: +213 puis votre numéro mobile."
  ],
  combined: [
    "Pour prendre rendez-vous, j'ai besoin de votre nom complet et numéro de téléphone (+213...).",
    "Pouvez-vous me donner votre nom et votre numéro mobile algérien ?",
    "Il me faut vos informations: nom complet et téléphone au format +213XXXXXXXXX.",
    "Nom et numéro de téléphone s'il vous plaît pour le rendez-vous.",
    "Merci de me communiquer votre nom et numéro mobile (+213...).",
    "Il me faut votre identité complète: nom et téléphone.",
    "Pour continuer, j'ai besoin de votre nom et numéro de contact.",
    "Vos coordonnées s'il vous plaît: nom complet et mobile algérien."
  ]
};

/**
 * Enhanced Dialog Manager V2 with comprehensive features
 */
export class DialogManagerV2 {
  private dialogStates: Map<string, DialogStateV2> = new Map();
  private readonly maxSessionAge = 30 * 60 * 1000; // 30 minutes
  private readonly maxHandoffAttempts = 3;

  /**
   * Get or create enhanced dialog state for session
   */
  private getDialogState(sessionId: string): DialogStateV2 {
    let state = this.dialogStates.get(sessionId);
    
    if (!state) {
      state = {
        sessionId,
        conversationStage: "welcome",
        attemptCounts: { name: 0, phone: 0, total: 0 },
        collectedFields: new Set(),
        outOfScopeAttempts: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        extractedInfo: {
          potentialNames: [],
          potentialPhones: []
        },
        conversationHistory: [],
        promptVariations: {
          namePrompts: [...PROMPT_TEMPLATES_V2.nameOnly],
          phonePrompts: [...PROMPT_TEMPLATES_V2.phoneOnly],
          combinedPrompts: [...PROMPT_TEMPLATES_V2.combined],
          usedPrompts: new Set()
        },
        handoffState: {
          isHandoffPending: false,
          handoffAttempts: 0
        },
        welcomeState: {
          hasShownWelcome: false
        }
      };
      
      this.dialogStates.set(sessionId, state);
    }
    
    return state;
  }

  /**
   * Enhanced information extraction with improved accuracy
   */
  private extractInformation(message: string, state: DialogStateV2): {
    name?: string;
    phone?: string;
    hasNewInfo: boolean;
    validationErrors: string[];
  } {
    const result: any = { hasNewInfo: false, validationErrors: [] };
    
    // Extract names with enhanced patterns
    const names = NameExtractorV2.extractNames(message);
    if (names.length > 0) {
      // Filter out previously extracted names to avoid repetition
      const newNames = names.filter(name => 
        name !== state.extractedInfo.lastExtractedName &&
        !state.extractedInfo.potentialNames.includes(name)
      );
      
      if (newNames.length > 0) {
        state.extractedInfo.potentialNames.push(...newNames);
        const bestName = newNames.reduce((a, b) => a.length > b.length ? a : b);
        
        if (!state.extractedInfo.confirmedName || bestName.length > state.extractedInfo.confirmedName.length) {
          state.extractedInfo.confirmedName = bestName;
          state.extractedInfo.lastExtractedName = bestName;
          result.name = bestName;
          result.hasNewInfo = true;
        }
      }
    }
    
    // Extract phones with enhanced validation
    const phones = PhoneValidatorV3.extractPhoneNumbers(message);
    if (phones.length > 0) {
      for (const phone of phones) {
        const validation = PhoneValidatorV3.validateAlgerianPhone(phone);
        
        if (validation.isValid && validation.normalized) {
          // Check if this is a new phone number
          if (validation.normalized !== state.extractedInfo.lastExtractedPhone &&
              validation.normalized !== state.extractedInfo.confirmedPhone) {
            
            state.extractedInfo.potentialPhones.push(phone);
            state.extractedInfo.confirmedPhone = validation.normalized;
            state.extractedInfo.lastExtractedPhone = validation.normalized;
            result.phone = validation.normalized;
            result.hasNewInfo = true;
            break;
          }
        } else if (validation.error) {
          result.validationErrors.push(validation.error);
        }
      }
    }
    
    return result;
  }

  /**
   * Advanced out-of-scope detection with context awareness
   */
  private detectOutOfScope(message: string, state: DialogStateV2): {
    shouldHandoff: boolean;
    category?: string;
    reason?: string;
    confidence: number;
  } {
    const detection = OutOfScopeDetector.detectOutOfScope(message);
    
    if (detection.isOutOfScope) {
      // Consider context - repeated attempts might indicate frustration
      if (state.outOfScopeAttempts >= 2) {
        return {
          shouldHandoff: true,
          category: "OUT_OF_SCOPE",
          reason: "Multiple out-of-scope attempts detected",
          confidence: Math.min(detection.confidence + 0.2, 1.0)
        };
      }
      
      // High confidence or sensitive categories should handoff immediately
      if (detection.confidence >= 0.8 || 
          ['SENSITIVE_HEALTH', 'JAILBREAK_OR_SECURITY'].includes(detection.category!)) {
        return {
          shouldHandoff: true,
          category: detection.category,
          reason: `High confidence ${detection.category} detection`,
          confidence: detection.confidence
        };
      }
    }
    
    return {
      shouldHandoff: false,
      confidence: detection.confidence
    };
  }

  /**
   * Generate unique clarification question with enhanced variation
   */
  private generateUniqueQuestion(
    missingFields: string[],
    state: DialogStateV2,
    validationErrors?: string[]
  ): string {
    const hasName = state.extractedInfo.confirmedName;
    const hasPhone = state.extractedInfo.confirmedPhone;
    
    // Handle phone validation errors first
    if (validationErrors && validationErrors.length > 0 && missingFields.includes('patient.phone_e164')) {
      const retryPrompts = PROMPT_TEMPLATES_V2.phoneRetry.filter(
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
      const combinedPrompts = state.promptVariations.combinedPrompts.filter(
        prompt => !state.promptVariations.usedPrompts.has(prompt)
      );
      
      if (combinedPrompts.length > 0) {
        const selected = combinedPrompts[Math.floor(Math.random() * combinedPrompts.length)];
        state.promptVariations.usedPrompts.add(selected);
        return selected;
      }
    }
    
    // Fallback if all variations used
    if (state.promptVariations.usedPrompts.size >= 15) {
      // Reset used prompts to start over with variations
      state.promptVariations.usedPrompts.clear();
      return "Pouvez-vous me donner les informations nécessaires pour le rendez-vous ?";
    }
    
    return "Il me faut encore quelques informations pour continuer.";
  }

  /**
   * Generate welcome UI elements
   */
  private generateWelcomeElements(): any[] {
    return [
      {
        type: 'button',
        label: 'Prendre RDV',
        action: 'start_booking',
        style: 'primary',
        accessibility: {
          aria_label: 'Démarrer la prise de rendez-vous',
          role: 'button'
        }
      },
      {
        type: 'button',
        label: 'Urgence',
        action: 'emergency',
        style: 'urgent',
        accessibility: {
          aria_label: 'Accès urgence médicale',
          role: 'button'
        }
      },
      {
        type: 'button',
        label: 'Voir calendrier',
        action: 'view_calendar',
        style: 'secondary',
        accessibility: {
          aria_label: 'Consulter le calendrier des disponibilités',
          role: 'button'
        }
      },
      {
        type: 'button',
        label: 'Informations',
        action: 'clinic_info',
        style: 'info',
        accessibility: {
          aria_label: 'Informations sur le cabinet',
          role: 'button'
        }
      }
    ];
  }

  /**
   * Enhanced message processing with comprehensive features
   */
  async processMessageV2(
    message: string,
    sessionId: string
  ): Promise<{
    response: AppointmentResponseV3;
    shouldProceedToSlots: boolean;
    validationErrors: string[];
    shouldHandoff: boolean;
  }> {
    const state = this.getDialogState(sessionId);
    
    // Update conversation history
    state.conversationHistory.push({
      role: 'user',
      message,
      timestamp: new Date()
    });

    // Check for welcome state
    if (!state.welcomeState.hasShownWelcome && state.attemptCounts.total === 0) {
      state.welcomeState.hasShownWelcome = true;
      state.welcomeState.welcomeTimestamp = new Date();
      state.conversationStage = "welcome";
      state.attemptCounts.total = 1;
      state.updatedAt = new Date();

      const welcomeResponse: AppointmentResponseV3 = {
        action: "SHOW_WELCOME",
        clinic_address: "Cité 109, Daboussy El Achour, Alger",
        timezone: "Africa/Algiers",
        message: "Bienvenue chez NOVA RDV ! Comment puis-je vous aider aujourd'hui ?",
        ui_elements: this.generateWelcomeElements(),
        session_context: {
          attempt_count: 1,
          conversation_stage: "welcome",
          collected_info: {
            has_name: false,
            has_phone: false,
            name_attempt_count: 0,
            phone_attempt_count: 0
          }
        }
      };

      return {
        response: welcomeResponse,
        shouldProceedToSlots: false,
        validationErrors: [],
        shouldHandoff: false
      };
    }

    // Check for out-of-scope detection
    const outOfScopeCheck = this.detectOutOfScope(message, state);
    if (outOfScopeCheck.shouldHandoff) {
      state.handoffState.isHandoffPending = true;
      state.handoffState.handoffReason = outOfScopeCheck.reason;
      state.handoffState.handoffCategory = outOfScopeCheck.category;
      state.handoffState.handoffAttempts++;
      state.outOfScopeAttempts++;

      const handoffResponse: AppointmentResponseV3 = {
        action: "ROUTE_TO_HUMAN",
        clinic_address: "Cité 109, Daboussy El Achour, Alger",
        timezone: "Africa/Algiers",
        disposition: {
          category: outOfScopeCheck.category as any,
          reason: outOfScopeCheck.reason!,
          confidence: outOfScopeCheck.confidence
        },
        clinic_contact: {
          phone_e164: process.env.CLINIC_PHONE_E164 || "+213555000000",
          email: process.env.CLINIC_EMAIL || "contact@nova-rdv.dz",
          contact_available: true,
          business_hours: "08:00-18:00, Dimanche à Jeudi"
        },
        message: this.generateHandoffMessage(outOfScopeCheck.category!),
        ui_elements: [{
          type: "contact_card",
          label: "Contacter le cabinet",
          data: {
            phone: process.env.CLINIC_PHONE_E164 || "+213555000000",
            email: process.env.CLINIC_EMAIL || "contact@nova-rdv.dz",
            hours: "08:00-18:00, Dim-Jeu"
          },
          style: "info"
        }]
      };

      return {
        response: handoffResponse,
        shouldProceedToSlots: false,
        validationErrors: [],
        shouldHandoff: true
      };
    }
    
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
    const validationErrors: string[] = extracted.validationErrors || [];
    const missingFields: string[] = [];
    
    // Check name
    if (!state.extractedInfo.confirmedName) {
      missingFields.push('patient.name');
    }
    
    // Check phone
    if (!state.extractedInfo.confirmedPhone) {
      missingFields.push('patient.phone_e164');
    }
    
    // Determine response
    let response: AppointmentResponseV3;
    let shouldProceedToSlots = false;
    
    if (missingFields.length === 0 && validationErrors.length === 0) {
      // All info collected and valid - proceed to slot selection
      shouldProceedToSlots = true;
      state.conversationStage = "slot_selection";
      
      response = {
        action: "FIND_SLOTS",
        clinic_address: "Cité 109, Daboussy El Achour, Alger",
        timezone: "Africa/Algiers",
        patient: {
          name: state.extractedInfo.confirmedName!,
          phone_e164: state.extractedInfo.confirmedPhone!
        },
        message: `Parfait ${state.extractedInfo.confirmedName} ! Voici les créneaux disponibles :`,
        session_context: {
          attempt_count: state.attemptCounts.total,
          conversation_stage: "slot_selection",
          collected_info: {
            has_name: true,
            has_phone: true,
            name_attempt_count: state.attemptCounts.name,
            phone_attempt_count: state.attemptCounts.phone
          }
        }
      };
    } else {
      // Need more info
      state.conversationStage = "info_collection";
      
      const clarificationQuestion = this.generateUniqueQuestion(
        missingFields,
        state,
        validationErrors
      );
      
      response = {
        action: "NEED_INFO",
        clinic_address: "Cité 109, Daboussy El Achour, Alger",
        timezone: "Africa/Algiers",
        missing_fields: missingFields,
        message: clarificationQuestion,
        session_context: {
          attempt_count: state.attemptCounts.total,
          last_bot_message: clarificationQuestion,
          conversation_stage: "info_collection",
          collected_info: {
            has_name: Boolean(state.extractedInfo.confirmedName),
            has_phone: Boolean(state.extractedInfo.confirmedPhone),
            name_attempt_count: state.attemptCounts.name,
            phone_attempt_count: state.attemptCounts.phone
          }
        },
        // Always include partial patient info when available
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
      validationErrors,
      shouldHandoff: false
    };
  }

  /**
   * Generate appropriate handoff message
   */
  private generateHandoffMessage(category: string): string {
    const messages = {
      SENSITIVE_HEALTH: "Pour des questions médicales spécialisées, je vous recommande de contacter directement le cabinet. Nos professionnels pourront vous conseiller de manière appropriée.",
      PERSONAL_DATA: "Pour des questions concernant vos données personnelles ou la confidentialité, veuillez contacter directement le cabinet.",
      PRICING_UNCERTAIN: "Pour des informations détaillées sur les tarifs et remboursements, nos conseillers pourront vous renseigner précisément.",
      POLICY_OR_LEGAL: "Pour des questions réglementaires ou légales, veuillez vous adresser directement au cabinet.",
      JAILBREAK_OR_SECURITY: "Je ne peux pas traiter cette demande. Veuillez contacter le cabinet pour toute assistance.",
      OUT_OF_SCOPE: "Cette demande dépasse mes capacités. Nos conseillers humains pourront mieux vous aider."
    };

    return messages[category as keyof typeof messages] || "Veuillez contacter directement le cabinet pour cette demande.";
  }

  /**
   * Get session information for debugging
   */
  getSessionInfo(sessionId: string): DialogStateV2 | undefined {
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

  /**
   * Get conversation history for a session
   */
  getConversationHistory(sessionId: string): any[] {
    const state = this.dialogStates.get(sessionId);
    return state?.conversationHistory || [];
  }
}

// Export singleton instance
let sharedDialogManagerV2: DialogManagerV2 | null = null;

export function getSharedDialogManagerV2(): DialogManagerV2 {
  if (!sharedDialogManagerV2) {
    sharedDialogManagerV2 = new DialogManagerV2();
  }
  return sharedDialogManagerV2;
}