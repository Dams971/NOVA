import { env } from '@/config/env';
import { z } from 'zod';

/**
 * NOVA NLP Service - French-first medical appointment NLU
 * Implements intent recognition and slot extraction for dental appointments
 */

// Intent patterns for French medical appointments
const INTENT_PATTERNS = {
  greeting: [
    /^(bonjour|bonsoir|salut|hello|hi)/i,
    /^(je vous|j'aimerais|je voudrais).*(dire bonjour|saluer)/i,
  ],
  
  check_availability: [
    /\b(disponibilit[ée]s?|cr[eé]neaux?|horaires?)\b/i,
    /\b(quand|quel jour|quelle heure).*\b(libre|disponible)\b/i,
    /\b(voir|consulter|v[eé]rifier).*\b(disponibilit[ée]s?|planning)\b/i,
    /\b(avez[- ]vous|y[- ]a[- ]t[- ]il).*\b(place|cr[eé]neau|rendez[- ]vous)\b/i,
  ],
  
  book_appointment: [
    /\b(prendre|r[eé]server|fixer|planifier).*\b(rendez[- ]vous|rdv|consultation)\b/i,
    /\b(je (veux|voudrais|souhaite)).*\b(rendez[- ]vous|rdv)\b/i,
    /\b(r[eé]servation|r[eé]server)\b/i,
    /\b(nouveau|un) (rendez[- ]vous|rdv)\b/i,
  ],
  
  reschedule_appointment: [
    /\b(reporter|d[eé]placer|changer|modifier).*\b(rendez[- ]vous|rdv)\b/i,
    /\b(autre (date|heure|jour|cr[eé]neau))\b/i,
    /\b(reprogrammer|red[eé]finir)\b/i,
  ],
  
  cancel_appointment: [
    /\b(annuler|supprimer).*\b(rendez[- ]vous|rdv)\b/i,
    /\b(ne (peux|peut) (plus|pas)).*\b(venir|me d[eé]placer)\b/i,
    /\b(emp[eê]chement|contretemps)\b/i,
  ],
  
  list_practitioners: [
    /\b(dentistes?|praticiens?|docteurs?|m[eé]decins?)\b/i,
    /\b(qui.*\b(consulte|travaille|disponible))\b/i,
    /\b([eé]quipe|personnel|staff)\b/i,
    /\b(sp[eé]cialit[eé]s?)\b/i,
  ],
  
  clinic_info: [
    /\b(adresse|o[uù]|localisation|plan|acc[eè]s)\b/i,
    /\b(horaires?|heures? d'ouverture|ouvert)\b/i,
    /\b(t[eé]l[eé]phone|contact|coordonn[eé]es)\b/i,
    /\b(informations? (sur le )?cabinet)\b/i,
  ],
  
  emergency: [
    /\b(urgence|urgent|mal|douleur)\b/i,
    /\b(tr[eè]s mal|souffre|insupportable)\b/i,
    /\b(tout de suite|imm[eé]diatement|maintenant)\b/i,
    /\b(SOS|aide)\b/i,
  ],
  
  help: [
    /\b(aide|aidez[- ]moi|comment|que faire)\b/i,
    /\b(ne sais pas|ne comprends pas)\b/i,
    /\b(probl[eè]me|difficult[eé])\b/i,
  ],
  
  goodbye: [
    /\b(au revoir|[aà] bient[oô]t|merci|bye)\b/i,
    /\b(c'est tout|fini|termin[eé])\b/i,
    /\b(bonne (journ[eé]e|soir[eé]e))\b/i,
  ]
};

// Entity extraction patterns
const ENTITY_PATTERNS = {
  date: [
    // French date formats
    /\b(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})\b/g, // DD/MM/YYYY
    /\b(aujourd'hui|demain|apr[eè]s[- ]demain)\b/gi,
    /\b(lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche)\b/gi,
    /\b(janvier|f[eé]vrier|mars|avril|mai|juin|juillet|ao[uû]t|septembre|octobre|novembre|d[eé]cembre)\b/gi,
    /\b(dans \d+ jours?|la semaine prochaine|le mois prochain)\b/gi,
  ],
  
  time: [
    /\b(\d{1,2})[h:](\d{2})?\b/g, // 14h30, 14:30
    /\b(\d{1,2}) heures?\b/gi, // 14 heures
    /\b(matin|midi|apr[eè]s[- ]midi|soir|soir[eé]e)\b/gi,
    /\b(vers \d{1,2}h?\d{0,2})\b/gi,
  ],
  
  email: [
    /\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/g,
  ],
  
  phone: [
    /\b(\+33|0)[1-9](\d{8}|\s?\d{2}\s?\d{2}\s?\d{2}\s?\d{2})\b/g,
  ],
  
  service_type: [
    /\b(consultation|examen|contr[oô]le)\b/gi,
    /\b(d[eé]tartrage|nettoyage|hygi[eè]ne)\b/gi,
    /\b(plombage|carie|soin)\b/gi,
    /\b(couronne|proth[eè]se)\b/gi,
    /\b(extraction|arracher|enlever)\b/gi,
    /\b(blanchiment|esth[eé]tique)\b/gi,
    /\b(orthodontie|bagues|appareil)\b/gi,
    /\b(implant|chirurgie)\b/gi,
  ],
  
  practitioner: [
    /\b(docteur|dr\.?|dentiste) ([A-Z][a-z]+)\b/gi,
    /\b(avec|chez) (le )?(docteur|dr\.?) ([A-Z][a-z]+)\b/gi,
  ],
  
  urgency: [
    /\b(urgent|urgence|tr[eè]s important)\b/gi,
    /\b(routine|normal|habituel)\b/gi,
    /\b(quand (vous )?pouvez|pas press[eé])\b/gi,
  ]
};

// Medical terminology dictionary
const MEDICAL_TERMS = {
  // Services mapping
  services: {
    'consultation': ['consultation', 'examen', 'contrôle', 'visite', 'rdv simple'],
    'détartrage': ['détartrage', 'nettoyage', 'hygiène', 'polissage'],
    'plombage': ['plombage', 'carie', 'soin', 'composite', 'amalgame'],
    'couronne': ['couronne', 'prothèse', 'cap'],
    'extraction': ['extraction', 'arracher', 'enlever', 'dent de sagesse'],
    'blanchiment': ['blanchiment', 'esthétique', 'éclaircissement'],
    'orthodontie': ['orthodontie', 'bagues', 'appareil', 'alignement'],
    'implant': ['implant', 'chirurgie', 'pose'],
    'urgence': ['urgence', 'douleur', 'mal', 'abcès'],
  },
  
  // Time expressions
  timeExpressions: {
    'morning': ['matin', 'matinée', 'avant midi'],
    'afternoon': ['après-midi', 'après midi', 'tantôt'],
    'evening': ['soir', 'soirée', 'fin de journée'],
  },
  
  // Urgency levels
  urgencyLevels: {
    'emergency': ['urgence', 'urgent', 'tout de suite', 'maintenant', 'immédiatement'],
    'urgent': ['important', 'rapidement', 'dès que possible', 'assez vite'],
    'routine': ['routine', 'normal', 'quand vous pouvez', 'pas pressé'],
  }
};

export interface EntityMatch {
  type: string;
  value: string;
  confidence: number;
  start: number;
  end: number;
  normalized?: string;
}

export interface NLUResult {
  intent: string;
  confidence: number;
  slots: Record<string, any>;
  entities: EntityMatch[];
  rawText: string;
}

export class NLPService {
  private static instance: NLPService;
  
  private constructor() {}
  
  public static getInstance(): NLPService {
    if (!NLPService.instance) {
      NLPService.instance = new NLPService();
    }
    return NLPService.instance;
  }

  /**
   * Extract intent and entities from user message
   */
  async extractIntentEntities(
    message: string,
    context?: {
      tenant?: any;
      user?: any;
      previousContext?: any;
    }
  ): Promise<NLUResult> {
    const normalizedMessage = this.normalizeText(message);
    
    // Extract entities first
    const entities = this.extractEntities(normalizedMessage);
    
    // Recognize intent
    const intentResult = this.recognizeIntent(normalizedMessage, entities);
    
    // Convert entities to slots
    const slots = this.entitiesToSlots(entities, context);
    
    // Apply context and improve confidence
    const finalResult = this.applyContext(
      {
        intent: intentResult.intent,
        confidence: intentResult.confidence,
        slots,
        entities,
        rawText: message
      },
      context
    );
    
    return finalResult;
  }

  /**
   * Normalize text for better processing
   */
  private normalizeText(text: string): string {
    return text
      .toLowerCase()
      .trim()
      // Remove extra spaces
      .replace(/\s+/g, ' ')
      // Normalize French accents for matching
      .replace(/[àáâäæ]/g, 'a')
      .replace(/[èéêë]/g, 'e')
      .replace(/[ìíîï]/g, 'i')
      .replace(/[òóôöœ]/g, 'o')
      .replace(/[ùúûü]/g, 'u')
      .replace(/[ç]/g, 'c')
      // Remove punctuation for pattern matching
      .replace(/[.,;!?'"]/g, ' ')
      .trim();
  }

  /**
   * Recognize intent from message
   */
  private recognizeIntent(
    message: string,
    entities: EntityMatch[]
  ): { intent: string; confidence: number } {
    let bestMatch = { intent: 'fallback', confidence: 0.0 };

    for (const [intent, patterns] of Object.entries(INTENT_PATTERNS)) {
      let maxConfidence = 0;
      
      for (const pattern of patterns) {
        if (pattern.test(message)) {
          // Base confidence from pattern match
          let confidence = 0.6;
          
          // Boost confidence based on entity presence
          if (intent === 'book_appointment' || intent === 'check_availability') {
            if (entities.some(e => e.type === 'date')) confidence += 0.2;
            if (entities.some(e => e.type === 'service_type')) confidence += 0.15;
            if (entities.some(e => e.type === 'time')) confidence += 0.1;
          }
          
          if (intent === 'reschedule_appointment' || intent === 'cancel_appointment') {
            if (entities.some(e => e.type === 'email' || e.type === 'phone')) confidence += 0.2;
          }
          
          if (intent === 'emergency') {
            // Emergency patterns get high confidence
            confidence = Math.min(0.95, confidence + 0.3);
          }
          
          maxConfidence = Math.max(maxConfidence, confidence);
        }
      }
      
      if (maxConfidence > bestMatch.confidence) {
        bestMatch = { intent, confidence: maxConfidence };
      }
    }

    return bestMatch;
  }

  /**
   * Extract entities from text
   */
  private extractEntities(text: string): EntityMatch[] {
    const entities: EntityMatch[] = [];

    for (const [entityType, patterns] of Object.entries(ENTITY_PATTERNS)) {
      for (const pattern of patterns) {
        let match;
        while ((match = pattern.exec(text)) !== null) {
          const value = match[0];
          const entity: EntityMatch = {
            type: entityType,
            value,
            confidence: 0.8,
            start: match.index,
            end: match.index + value.length,
            normalized: this.normalizeEntity(entityType, value)
          };
          
          entities.push(entity);
        }
      }
    }

    // Remove overlapping entities (keep highest confidence)
    return this.removeOverlappingEntities(entities);
  }

  /**
   * Normalize extracted entity values
   */
  private normalizeEntity(type: string, value: string): string {
    switch (type) {
      case 'date':
        return this.normalizeDateEntity(value);
      case 'time':
        return this.normalizeTimeEntity(value);
      case 'service_type':
        return this.normalizeServiceType(value);
      case 'email':
        return value.toLowerCase();
      case 'phone':
        return this.normalizePhoneNumber(value);
      default:
        return value;
    }
  }

  /**
   * Normalize date expressions
   */
  private normalizeDateEntity(value: string): string {
    const today = new Date();
    const lowerValue = value.toLowerCase();

    // Handle relative dates
    if (lowerValue === 'aujourd\'hui') {
      return today.toISOString().split('T')[0];
    }
    
    if (lowerValue === 'demain') {
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      return tomorrow.toISOString().split('T')[0];
    }
    
    if (lowerValue === 'après-demain' || lowerValue === 'apres-demain') {
      const dayAfterTomorrow = new Date(today);
      dayAfterTomorrow.setDate(today.getDate() + 2);
      return dayAfterTomorrow.toISOString().split('T')[0];
    }

    // Handle weekdays
    const weekdays = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
    const weekdayIndex = weekdays.findIndex(day => lowerValue.includes(day));
    
    if (weekdayIndex !== -1) {
      const targetDay = new Date(today);
      const daysUntil = (weekdayIndex - today.getDay() + 7) % 7;
      if (daysUntil === 0 && today.getHours() > 17) {
        // If it's the same day but after business hours, assume next week
        targetDay.setDate(today.getDate() + 7);
      } else {
        targetDay.setDate(today.getDate() + daysUntil);
      }
      return targetDay.toISOString().split('T')[0];
    }

    // Handle DD/MM/YYYY format
    const dateMatch = value.match(/(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})/);
    if (dateMatch) {
      const [, day, month, year] = dateMatch;
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }

    return value;
  }

  /**
   * Normalize time expressions
   */
  private normalizeTimeEntity(value: string): string {
    const lowerValue = value.toLowerCase();

    // Handle time periods
    if (lowerValue.includes('matin')) return 'morning';
    if (lowerValue.includes('après-midi') || lowerValue.includes('tantôt')) return 'afternoon';
    if (lowerValue.includes('soir')) return 'evening';

    // Handle specific times
    const timeMatch = value.match(/(\d{1,2})[h:]?(\d{2})?/);
    if (timeMatch) {
      const [, hours, minutes = '00'] = timeMatch;
      return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
    }

    return value;
  }

  /**
   * Normalize service types
   */
  private normalizeServiceType(value: string): string {
    const lowerValue = value.toLowerCase();
    
    for (const [service, terms] of Object.entries(MEDICAL_TERMS.services)) {
      if (terms.some(term => lowerValue.includes(term))) {
        return service;
      }
    }
    
    return value;
  }

  /**
   * Normalize phone numbers
   */
  private normalizePhoneNumber(value: string): string {
    // Convert to standard French format
    return value
      .replace(/\s+/g, '')
      .replace(/^(\+33|0033)/, '+33')
      .replace(/^0/, '+33');
  }

  /**
   * Convert entities to structured slots
   */
  private entitiesToSlots(entities: EntityMatch[], context?: any): Record<string, any> {
    const slots: Record<string, any> = {};

    for (const entity of entities) {
      switch (entity.type) {
        case 'date':
          slots.date = entity.normalized || entity.value;
          break;
        case 'time':
          if (entity.normalized && ['morning', 'afternoon', 'evening'].includes(entity.normalized)) {
            slots.timeWindow = entity.normalized;
          } else {
            slots.time = entity.normalized || entity.value;
          }
          break;
        case 'email':
          slots.patientEmail = entity.normalized || entity.value;
          break;
        case 'phone':
          slots.patientPhone = entity.normalized || entity.value;
          break;
        case 'service_type':
          slots.serviceType = entity.normalized || entity.value;
          break;
        case 'practitioner':
          slots.practitionerName = entity.value;
          break;
      }
    }

    // Add context-based slots
    if (context?.tenant?.id) {
      slots.cabinetId = context.tenant.id;
    }
    
    if (context?.user?.userId) {
      slots.userId = context.user.userId;
    }

    return slots;
  }

  /**
   * Apply contextual information to improve results
   */
  private applyContext(
    result: NLUResult,
    context?: any
  ): NLUResult {
    // Boost confidence based on conversation history
    if (context?.previousContext?.currentIntent) {
      const previousIntent = context.previousContext.currentIntent;
      
      // If user is in middle of booking flow, boost related intents
      if (previousIntent === 'check_availability' && result.intent === 'book_appointment') {
        result.confidence = Math.min(0.95, result.confidence + 0.2);
      }
      
      if (previousIntent === 'book_appointment' && result.rawText.toLowerCase().includes('oui')) {
        result.intent = 'book_appointment';
        result.confidence = 0.9;
      }
    }

    // Adjust confidence for emergency detection
    if (result.intent === 'emergency') {
      const emergencyKeywords = ['mal', 'douleur', 'urgence', 'tout de suite', 'maintenant'];
      const keywordCount = emergencyKeywords.filter(keyword => 
        result.rawText.toLowerCase().includes(keyword)
      ).length;
      
      result.confidence = Math.min(0.98, 0.7 + (keywordCount * 0.1));
    }

    return result;
  }

  /**
   * Remove overlapping entities
   */
  private removeOverlappingEntities(entities: EntityMatch[]): EntityMatch[] {
    const sorted = entities.sort((a, b) => a.start - b.start);
    const filtered: EntityMatch[] = [];

    for (const entity of sorted) {
      const overlapping = filtered.find(f => 
        (entity.start >= f.start && entity.start < f.end) ||
        (entity.end > f.start && entity.end <= f.end)
      );

      if (!overlapping || entity.confidence > overlapping.confidence) {
        if (overlapping) {
          const index = filtered.indexOf(overlapping);
          filtered.splice(index, 1);
        }
        filtered.push(entity);
      }
    }

    return filtered;
  }

  /**
   * Health check for NLP service
   */
  async healthCheck(): Promise<boolean> {
    try {
      // Test basic functionality
      const testResult = await this.extractIntentEntities("Bonjour, je voudrais prendre rendez-vous demain matin");
      return testResult.intent === 'book_appointment' && testResult.confidence > 0.5;
    } catch (error) {
      console.error('NLP service health check failed:', error);
      return false;
    }
  }
}

export default NLPService;