/**
 * NOVA RDV v2 - Gestion des Erreurs Spécialisées
 * 
 * Classes d'erreurs personnalisées pour le système de rendez-vous
 * - Erreurs métier spécifiques
 * - Codes d'erreur standardisés
 * - Messages utilisateur localisés en français
 * - Intégration logging
 */

import Logger from '@/lib/logging/logger';

const logger = Logger.getInstance();

// =============================================
// CODES D'ERREUR STANDARDISÉS
// =============================================

export const ERROR_CODES = {
  // Erreurs générales
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  SERVER_ERROR: 'SERVER_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  
  // Erreurs patient
  PATIENT_NOT_FOUND: 'PATIENT_NOT_FOUND',
  PATIENT_PHONE_INVALID: 'PATIENT_PHONE_INVALID',
  PATIENT_DUPLICATE: 'PATIENT_DUPLICATE',
  PATIENT_GDPR_MISSING: 'PATIENT_GDPR_MISSING',
  
  // Erreurs rendez-vous
  APPOINTMENT_SLOT_UNAVAILABLE: 'APPOINTMENT_SLOT_UNAVAILABLE',
  APPOINTMENT_NOT_FOUND: 'APPOINTMENT_NOT_FOUND',
  APPOINTMENT_PAST_DATE: 'APPOINTMENT_PAST_DATE',
  APPOINTMENT_OUTSIDE_HOURS: 'APPOINTMENT_OUTSIDE_HOURS',
  APPOINTMENT_TOO_LONG: 'APPOINTMENT_TOO_LONG',
  APPOINTMENT_CONFLICT: 'APPOINTMENT_CONFLICT',
  APPOINTMENT_MAX_ADVANCE: 'APPOINTMENT_MAX_ADVANCE',
  
  // Erreurs praticien
  PRACTITIONER_NOT_FOUND: 'PRACTITIONER_NOT_FOUND',
  PRACTITIONER_UNAVAILABLE: 'PRACTITIONER_UNAVAILABLE',
  PRACTITIONER_NOT_QUALIFIED: 'PRACTITIONER_NOT_QUALIFIED',
  
  // Erreurs IA
  AI_SERVICE_DOWN: 'AI_SERVICE_DOWN',
  AI_QUOTA_EXCEEDED: 'AI_QUOTA_EXCEEDED',
  AI_INVALID_RESPONSE: 'AI_INVALID_RESPONSE',
  AI_TIMEOUT: 'AI_TIMEOUT',
  
  // Erreurs autorisation
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  
  // Erreurs système
  DATABASE_ERROR: 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED'
} as const;

export type ErrorCode = keyof typeof ERROR_CODES;

// =============================================
// MESSAGES UTILISATEUR LOCALISÉS
// =============================================

export const ERROR_MESSAGES: Record<keyof typeof ERROR_CODES, string> = {
  // Erreurs générales
  VALIDATION_ERROR: 'Les informations saisies ne sont pas valides',
  NETWORK_ERROR: 'Problème de connexion réseau. Vérifiez votre connexion Internet',
  SERVER_ERROR: 'Une erreur serveur s\'est produite. Veuillez réessayer',
  TIMEOUT_ERROR: 'La requête a expiré. Veuillez réessayer',
  
  // Erreurs patient
  PATIENT_NOT_FOUND: 'Patient introuvable dans notre système',
  PATIENT_PHONE_INVALID: 'Numéro de téléphone invalide. Format requis: +213[567]XXXXXXXX',
  PATIENT_DUPLICATE: 'Un patient avec ce numéro de téléphone existe déjà',
  PATIENT_GDPR_MISSING: 'Le consentement RGPD est obligatoire pour créer un compte',
  
  // Erreurs rendez-vous
  APPOINTMENT_SLOT_UNAVAILABLE: 'Ce créneau n\'est plus disponible',
  APPOINTMENT_NOT_FOUND: 'Rendez-vous introuvable',
  APPOINTMENT_PAST_DATE: 'Impossible de réserver dans le passé',
  APPOINTMENT_OUTSIDE_HOURS: 'Horaire en dehors des heures d\'ouverture (Lun-Ven 8h-18h, Sam 8h-13h)',
  APPOINTMENT_TOO_LONG: 'Durée du rendez-vous trop longue (maximum 3 heures)',
  APPOINTMENT_CONFLICT: 'Ce créneau entre en conflit avec un autre rendez-vous',
  APPOINTMENT_MAX_ADVANCE: 'Réservation possible jusqu\'à 3 mois à l\'avance maximum',
  
  // Erreurs praticien
  PRACTITIONER_NOT_FOUND: 'Praticien introuvable',
  PRACTITIONER_UNAVAILABLE: 'Le praticien n\'est pas disponible à ce créneau',
  PRACTITIONER_NOT_QUALIFIED: 'Le praticien n\'est pas qualifié pour ce type de soin',
  
  // Erreurs IA
  AI_SERVICE_DOWN: 'L\'assistant IA est temporairement indisponible',
  AI_QUOTA_EXCEEDED: 'Limite d\'utilisation de l\'IA atteinte. Réessayez plus tard',
  AI_INVALID_RESPONSE: 'Réponse de l\'IA incompréhensible. Reformulez votre demande',
  AI_TIMEOUT: 'L\'IA met trop de temps à répondre. Reformulez plus simplement',
  
  // Erreurs autorisation
  UNAUTHORIZED: 'Vous devez être connecté pour accéder à cette fonction',
  FORBIDDEN: 'Vous n\'avez pas les droits pour effectuer cette action',
  SESSION_EXPIRED: 'Votre session a expiré. Veuillez vous reconnecter',
  
  // Erreurs système
  DATABASE_ERROR: 'Erreur de base de données. Nos équipes ont été notifiées',
  EXTERNAL_SERVICE_ERROR: 'Service externe indisponible. Réessayez plus tard',
  RATE_LIMIT_EXCEEDED: 'Trop de requêtes. Veuillez patienter avant de réessayer'
};

// =============================================
// CLASSES D'ERREUR PERSONNALISÉES
// =============================================

/**
 * Classe de base pour toutes les erreurs RDV
 */
export abstract class RDVError extends Error {
  public readonly code: string;
  public readonly userMessage: string;
  public readonly httpStatus: number;
  public readonly context?: Record<string, any>;
  public readonly timestamp: Date;
  public readonly errorId: string;

  constructor(
    code: keyof typeof ERROR_CODES,
    message?: string,
    httpStatus: number = 400,
    context?: Record<string, any>
  ) {
    super(message || ERROR_MESSAGES[code]);
    
    this.name = this.constructor.name;
    this.code = ERROR_CODES[code];
    this.userMessage = ERROR_MESSAGES[code];
    this.httpStatus = httpStatus;
    this.context = context;
    this.timestamp = new Date();
    this.errorId = this.generateErrorId();
    
    // Capturer la stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
    
    // Logger automatiquement l'erreur
    this.logError();
  }

  private generateErrorId(): string {
    return `rdv_${this.code.toLowerCase()}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  }

  private logError(): void {
    logger.error(`${this.constructor.name}: ${this.message}`, {
      errorId: this.errorId,
      code: this.code,
      httpStatus: this.httpStatus,
      context: this.context,
      stack: this.stack
    });
  }

  public toJSON() {
    return {
      error: true,
      errorId: this.errorId,
      code: this.code,
      message: this.userMessage,
      timestamp: this.timestamp.toISOString(),
      context: this.context
    };
  }
}

/**
 * Erreurs de validation des données
 */
export class ValidationError extends RDVError {
  public readonly validationErrors: Array<{
    field: string;
    message: string;
    value?: any;
  }>;

  constructor(
    errors: Array<{ field: string; message: string; value?: any }>,
    context?: Record<string, any>
  ) {
    super('VALIDATION_ERROR', undefined, 400, context);
    this.validationErrors = errors;
  }

  public toJSON() {
    return {
      ...super.toJSON(),
      validationErrors: this.validationErrors
    };
  }
}

/**
 * Erreurs liées aux patients
 */
export class PatientError extends RDVError {
  constructor(
    code: 'PATIENT_NOT_FOUND' | 'PATIENT_PHONE_INVALID' | 'PATIENT_DUPLICATE' | 'PATIENT_GDPR_MISSING',
    context?: Record<string, any>
  ) {
    const statusMap = {
      PATIENT_NOT_FOUND: 404,
      PATIENT_PHONE_INVALID: 400,
      PATIENT_DUPLICATE: 409,
      PATIENT_GDPR_MISSING: 400
    };
    
    super(code, undefined, statusMap[code], context);
  }
}

/**
 * Erreurs liées aux rendez-vous
 */
export class AppointmentError extends RDVError {
  constructor(
    code: 'APPOINTMENT_SLOT_UNAVAILABLE' | 'APPOINTMENT_NOT_FOUND' | 'APPOINTMENT_PAST_DATE' |
          'APPOINTMENT_OUTSIDE_HOURS' | 'APPOINTMENT_TOO_LONG' | 'APPOINTMENT_CONFLICT' |
          'APPOINTMENT_MAX_ADVANCE',
    context?: Record<string, any>
  ) {
    const statusMap = {
      APPOINTMENT_SLOT_UNAVAILABLE: 409,
      APPOINTMENT_NOT_FOUND: 404,
      APPOINTMENT_PAST_DATE: 400,
      APPOINTMENT_OUTSIDE_HOURS: 400,
      APPOINTMENT_TOO_LONG: 400,
      APPOINTMENT_CONFLICT: 409,
      APPOINTMENT_MAX_ADVANCE: 400
    };
    
    super(code, undefined, statusMap[code], context);
  }
}

/**
 * Erreurs liées à l'assistant IA
 */
export class AIError extends RDVError {
  public readonly aiModel?: string;
  public readonly tokensUsed?: number;

  constructor(
    code: 'AI_SERVICE_DOWN' | 'AI_QUOTA_EXCEEDED' | 'AI_INVALID_RESPONSE' | 'AI_TIMEOUT',
    aiModel?: string,
    tokensUsed?: number,
    context?: Record<string, any>
  ) {
    const statusMap = {
      AI_SERVICE_DOWN: 503,
      AI_QUOTA_EXCEEDED: 429,
      AI_INVALID_RESPONSE: 502,
      AI_TIMEOUT: 504
    };
    
    super(code, undefined, statusMap[code], { ...context, aiModel, tokensUsed });
    this.aiModel = aiModel;
    this.tokensUsed = tokensUsed;
  }
}

/**
 * Erreurs d'autorisation
 */
export class AuthError extends RDVError {
  constructor(
    code: 'UNAUTHORIZED' | 'FORBIDDEN' | 'SESSION_EXPIRED',
    context?: Record<string, any>
  ) {
    const statusMap = {
      UNAUTHORIZED: 401,
      FORBIDDEN: 403,
      SESSION_EXPIRED: 401
    };
    
    super(code, undefined, statusMap[code], context);
  }
}

/**
 * Erreurs système/infrastructure
 */
export class SystemError extends RDVError {
  constructor(
    code: 'DATABASE_ERROR' | 'EXTERNAL_SERVICE_ERROR' | 'RATE_LIMIT_EXCEEDED',
    originalError?: Error,
    context?: Record<string, any>
  ) {
    const statusMap = {
      DATABASE_ERROR: 500,
      EXTERNAL_SERVICE_ERROR: 502,
      RATE_LIMIT_EXCEEDED: 429
    };
    
    super(code, originalError?.message, statusMap[code], {
      ...context,
      originalError: originalError?.message,
      originalStack: originalError?.stack
    });
  }
}

// =============================================
// UTILITAIRES DE GESTION D'ERREUR
// =============================================

/**
 * Convertit une erreur générique en RDVError appropriée
 */
export function normalizeError(error: unknown, context?: Record<string, any>): RDVError {
  if (error instanceof RDVError) {
    return error;
  }
  
  if (error instanceof Error) {
    // Analyser le message pour déterminer le type d'erreur
    if (error.message.includes('network') || error.message.includes('fetch')) {
      return new SystemError('EXTERNAL_SERVICE_ERROR', error, context);
    }
    
    if (error.message.includes('timeout')) {
      return new SystemError('EXTERNAL_SERVICE_ERROR', error, { ...context, timeout: true });
    }
    
    if (error.message.includes('database') || error.message.includes('connection')) {
      return new SystemError('DATABASE_ERROR', error, context);
    }
    
    // Erreur générique
    return new SystemError('EXTERNAL_SERVICE_ERROR', error, context);
  }
  
  // Erreur inconnue
  return new SystemError('EXTERNAL_SERVICE_ERROR', new Error('Une erreur inconnue s\'est produite'), {
    ...context,
    originalError: String(error)
  });
}

/**
 * Formatage d'erreur pour les réponses API
 */
export function formatErrorResponse(error: RDVError) {
  return {
    success: false,
    error: {
      id: error.errorId,
      code: error.code,
      message: error.userMessage,
      timestamp: error.timestamp.toISOString(),
      ...(error instanceof ValidationError && {
        validationErrors: error.validationErrors
      })
    }
  };
}

/**
 * Gestionnaire d'erreur pour les composants React
 */
export function handleComponentError(
  error: unknown,
  componentName: string,
  additionalContext?: Record<string, any>
): RDVError {
  const normalizedError = normalizeError(error, {
    component: componentName,
    ...additionalContext
  });
  
  // En développement, re-throw pour React DevTools
  if (process.env.NODE_ENV === 'development') {
    console.error(`Erreur dans ${componentName}:`, normalizedError);
  }
  
  return normalizedError;
}

/**
 * Wrapper pour les fonctions async avec gestion d'erreur
 */
export function withErrorHandling<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  context?: string
) {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args);
    } catch (_error) {
      throw normalizeError(_error, { context, args: args.slice(0, 2) }); // Limiter les args loggés
    }
  };
}

// Export des types pour utilisation externe
export type RDVErrorType = 
  | ValidationError
  | PatientError
  | AppointmentError
  | AIError
  | AuthError
  | SystemError;