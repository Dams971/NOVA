/**
 * NOVA RDV - Microcopy System
 * Multi-persona accessible content system
 * Follows plain language principles and accessibility guidelines
 */

// Error message patterns following GOV.UK design system
export interface ErrorMessage {
  summary: string;      // Brief description for error summaries
  detail: string;       // Detailed explanation for users
  recovery: string;     // How to fix the issue
  ariaLabel?: string;   // Alternative for screen readers
}

// Content structure for forms and UI elements
export interface ContentItem {
  label: string;
  hint?: string;
  placeholder?: string;
  helpText?: string;
  ariaLabel?: string;
  ariaDescription?: string;
}

// Action button content
export interface ActionContent {
  primary: string;      // Main action text
  loading: string;      // Text during loading state
  success: string;      // Text after successful action
  ariaLabel?: string;   // Screen reader description
}

// ================================
// ERROR MESSAGES - GOV.UK PATTERN
// ================================

export const errors = {
  // Required field errors
  required: (field: string): ErrorMessage => ({
    summary: `${field} est requis`,
    detail: `Veuillez entrer ${field.toLowerCase()}`,
    recovery: `Ce champ ne peut pas être vide`,
    ariaLabel: `Erreur: ${field} est obligatoire`
  }),

  // Email validation
  email: {
    invalid: {
      summary: "L'adresse email n'est pas valide",
      detail: "Entrez une adresse email au format nom@exemple.com",
      recovery: "Vérifiez qu'il n'y a pas d'espaces ou de caractères manquants",
      ariaLabel: "Erreur: format d'email incorrect"
    },
    duplicate: {
      summary: "Cette adresse email est déjà utilisée",
      detail: "Un compte existe déjà avec cette adresse",
      recovery: "Connectez-vous ou utilisez une autre adresse email",
      ariaLabel: "Erreur: email déjà enregistré"
    }
  },

  // Phone number validation
  phone: {
    invalid: {
      summary: "Le numéro de téléphone n'est pas valide",
      detail: "Entrez un numéro algérien à 10 chiffres",
      recovery: "Format attendu: 0555123456 ou +213555123456",
      ariaLabel: "Erreur: format de téléphone incorrect"
    },
    required: {
      summary: "Le numéro de téléphone est requis",
      detail: "Nous avons besoin de votre numéro pour confirmer le rendez-vous",
      recovery: "Entrez votre numéro de téléphone mobile",
      ariaLabel: "Erreur: téléphone obligatoire"
    }
  },

  // Date and time validation
  date: {
    past: {
      summary: "La date doit être dans le futur",
      detail: "Choisissez une date à partir de demain",
      recovery: "Les rendez-vous ne peuvent être pris que pour des dates futures",
      ariaLabel: "Erreur: date dans le passé"
    },
    unavailable: {
      summary: "Ce créneau n'est plus disponible",
      detail: "Un autre patient a réservé ce créneau",
      recovery: "Choisissez un autre horaire ou une autre date",
      ariaLabel: "Erreur: créneau indisponible"
    },
    weekend: {
      summary: "Nous sommes fermés ce jour",
      detail: "Le cabinet est ouvert du lundi au samedi",
      recovery: "Choisissez un jour de la semaine",
      ariaLabel: "Erreur: jour de fermeture"
    }
  },

  // Network and system errors
  network: {
    offline: {
      summary: "Pas de connexion internet",
      detail: "Impossible de contacter nos serveurs",
      recovery: "Vérifiez votre connexion et réessayez",
      ariaLabel: "Erreur: problème de connexion"
    },
    timeout: {
      summary: "La requête a pris trop de temps",
      detail: "Le serveur ne répond pas assez rapidement",
      recovery: "Patientez un moment et réessayez",
      ariaLabel: "Erreur: délai d'attente dépassé"
    },
    server: {
      summary: "Problème technique temporaire",
      detail: "Nos serveurs rencontrent une difficulté",
      recovery: "Réessayez dans quelques minutes ou contactez-nous",
      ariaLabel: "Erreur: problème serveur"
    }
  },

  // Validation errors
  validation: {
    tooShort: (field: string, min: number): ErrorMessage => ({
      summary: `${field} trop court`,
      detail: `Entrez au moins ${min} caractères`,
      recovery: `${field} doit contenir ${min} caractères minimum`,
      ariaLabel: `Erreur: ${field} insuffisant`
    }),
    tooLong: (field: string, max: number): ErrorMessage => ({
      summary: `${field} trop long`,
      detail: `Utilisez maximum ${max} caractères`,
      recovery: `Raccourcissez votre ${field.toLowerCase()}`,
      ariaLabel: `Erreur: ${field} trop long`
    }),
    pattern: (field: string, example: string): ErrorMessage => ({
      summary: `Format de ${field} incorrect`,
      detail: `Exemple de format valide: ${example}`,
      recovery: `Respectez le format demandé`,
      ariaLabel: `Erreur: format de ${field} invalide`
    })
  }
};

// ================================
// FORM CONTENT - SIMPLIFIED LABELS
// ================================

export const forms = {
  // Personal information
  patient: {
    firstName: {
      label: "Prénom",
      hint: "Votre prénom principal",
      placeholder: "ex: Marie",
      helpText: "Le prénom qui apparaîtra sur vos documents",
      ariaLabel: "Votre prénom"
    },
    lastName: {
      label: "Nom de famille",
      hint: "Votre nom de famille",
      placeholder: "ex: Dupont",
      helpText: "Le nom qui apparaîtra sur vos documents",
      ariaLabel: "Votre nom de famille"
    },
    email: {
      label: "Adresse email",
      hint: "Pour recevoir la confirmation de rendez-vous",
      placeholder: "marie@exemple.com",
      helpText: "Nous vous enverrons un email de confirmation",
      ariaLabel: "Votre adresse email"
    },
    phone: {
      label: "Numéro de téléphone",
      hint: "Numéro algérien (10 chiffres)",
      placeholder: "0555123456",
      helpText: "Pour vous contacter si besoin",
      ariaLabel: "Votre numéro de téléphone"
    }
  },

  // Appointment details
  appointment: {
    date: {
      label: "Date souhaitée",
      hint: "Choisissez une date disponible",
      placeholder: "JJ/MM/AAAA",
      helpText: "Les créneaux sont de 30 minutes",
      ariaLabel: "Date de votre rendez-vous"
    },
    time: {
      label: "Heure préférée",
      hint: "Créneaux disponibles toutes les 30 minutes",
      placeholder: "Sélectionnez",
      helpText: "Entre 8h00 et 18h00 en semaine",
      ariaLabel: "Heure de votre rendez-vous"
    },
    careType: {
      label: "Type de soin",
      hint: "Sélectionnez le motif de votre visite",
      placeholder: "Choisissez...",
      helpText: "Cela nous aide à prévoir le temps nécessaire",
      ariaLabel: "Type de soin souhaité"
    },
    reason: {
      label: "Motif (optionnel)",
      hint: "Décrivez brièvement votre besoin",
      placeholder: "ex: Douleur dentaire côté droit",
      helpText: "Maximum 200 caractères",
      ariaLabel: "Motif de votre visite"
    },
    urgency: {
      label: "Urgence",
      hint: "Avez-vous besoin d'un rendez-vous urgent ?",
      helpText: "Les urgences sont traitées en priorité",
      ariaLabel: "Niveau d'urgence"
    }
  },

  // Consent and legal
  consent: {
    gdpr: {
      label: "Traitement des données personnelles",
      hint: "Obligatoire pour prendre rendez-vous",
      helpText: "Vos données sont protégées selon le RGPD",
      ariaLabel: "Consentement RGPD requis"
    },
    marketing: {
      label: "Recevoir nos actualités",
      hint: "Optionnel - newsletters et promotions",
      helpText: "Vous pouvez vous désabonner à tout moment",
      ariaLabel: "Consentement marketing optionnel"
    },
    reminders: {
      label: "Rappels de rendez-vous",
      hint: "SMS 24h avant votre rendez-vous",
      helpText: "Recommandé pour ne pas oublier",
      ariaLabel: "Activer les rappels automatiques"
    }
  }
};

// ================================
// ACTION BUTTONS - CLEAR ACTIONS
// ================================

export const actions = {
  // Primary actions
  primary: {
    submit: {
      primary: "Confirmer",
      loading: "Confirmation en cours...",
      success: "Confirmé !",
      ariaLabel: "Confirmer et soumettre le formulaire"
    },
    book: {
      primary: "Réserver le créneau",
      loading: "Réservation en cours...",
      success: "Réservé !",
      ariaLabel: "Réserver ce créneau de rendez-vous"
    },
    save: {
      primary: "Enregistrer",
      loading: "Enregistrement...",
      success: "Enregistré !",
      ariaLabel: "Enregistrer les modifications"
    },
    send: {
      primary: "Envoyer",
      loading: "Envoi en cours...",
      success: "Envoyé !",
      ariaLabel: "Envoyer le message"
    }
  },

  // Secondary actions
  secondary: {
    cancel: {
      primary: "Annuler",
      loading: "Annulation...",
      success: "Annulé",
      ariaLabel: "Annuler cette action"
    },
    back: {
      primary: "Retour",
      loading: "Retour...",
      success: "Retour effectué",
      ariaLabel: "Revenir à l'étape précédente"
    },
    edit: {
      primary: "Modifier",
      loading: "Modification...",
      success: "Modifié",
      ariaLabel: "Modifier ces informations"
    },
    reset: {
      primary: "Réinitialiser",
      loading: "Réinitialisation...",
      success: "Réinitialisé",
      ariaLabel: "Réinitialiser le formulaire"
    }
  },

  // Destructive actions
  destructive: {
    delete: {
      primary: "Supprimer",
      loading: "Suppression...",
      success: "Supprimé",
      ariaLabel: "Supprimer définitivement"
    },
    remove: {
      primary: "Retirer",
      loading: "Suppression...",
      success: "Retiré",
      ariaLabel: "Retirer de la liste"
    },
    disconnect: {
      primary: "Déconnecter",
      loading: "Déconnexion...",
      success: "Déconnecté",
      ariaLabel: "Se déconnecter du compte"
    }
  }
};

// ================================
// STATUS MESSAGES - CLEAR FEEDBACK
// ================================

export const status = {
  // Loading states
  loading: {
    default: "Chargement en cours...",
    appointment: "Recherche de créneaux disponibles...",
    submit: "Envoi de votre demande...",
    save: "Enregistrement de vos informations...",
    delete: "Suppression en cours...",
    ariaLabel: "Opération en cours, veuillez patienter"
  },

  // Success messages
  success: {
    appointment: {
      summary: "Rendez-vous confirmé !",
      detail: "Vous recevrez une confirmation par SMS",
      next: "Vous pouvez fermer cette fenêtre"
    },
    save: {
      summary: "Modifications enregistrées",
      detail: "Vos informations ont été mises à jour",
      next: "Les changements sont effectifs immédiatement"
    },
    send: {
      summary: "Message envoyé",
      detail: "Nous vous répondrons dans les plus brefs délais",
      next: "Vous pouvez fermer cette conversation"
    }
  },

  // Information messages
  info: {
    noResults: {
      summary: "Aucun résultat trouvé",
      detail: "Essayez avec d'autres critères de recherche",
      suggestion: "Modifiez vos filtres ou contactez-nous"
    },
    empty: {
      summary: "Aucun rendez-vous",
      detail: "Vous n'avez pas encore de rendez-vous",
      suggestion: "Prenez votre premier rendez-vous"
    },
    offline: {
      summary: "Mode hors ligne",
      detail: "Fonctionnalités limitées sans internet",
      suggestion: "Reconnectez-vous pour toutes les fonctionnalités"
    }
  },

  // Warning messages
  warning: {
    unsaved: {
      summary: "Modifications non enregistrées",
      detail: "Vos changements seront perdus",
      suggestion: "Enregistrez avant de quitter"
    },
    expiring: {
      summary: "Session bientôt expirée",
      detail: "Votre session expire dans 5 minutes",
      suggestion: "Enregistrez votre travail"
    }
  }
};

// ================================
// HELP CONTENT - CONTEXTUAL ASSISTANCE
// ================================

export const help = {
  // Field-specific help
  fields: {
    password: {
      title: "Critères du mot de passe",
      content: "8 caractères minimum avec lettres et chiffres",
      example: "Exemple: MonMotDePasse123"
    },
    phone: {
      title: "Format du numéro",
      content: "Numéro algérien à 10 chiffres",
      example: "Exemples: 0555123456 ou +213555123456"
    },
    otp: {
      title: "Code de vérification",
      content: "Code à 6 chiffres envoyé par SMS",
      example: "Vérifiez vos messages SMS"
    }
  },

  // Process help
  processes: {
    booking: {
      title: "Comment prendre rendez-vous",
      steps: [
        "Choisissez le type de soin",
        "Sélectionnez date et heure",
        "Remplissez vos informations",
        "Confirmez votre rendez-vous"
      ]
    },
    cancellation: {
      title: "Annulation de rendez-vous",
      content: "Annulation gratuite jusqu'à 24h avant",
      contact: "Pour annuler: appelez-nous ou utilisez votre espace client"
    }
  }
};

// ================================
// PERSONA ADAPTATIONS
// ================================

export const personaAdaptations = {
  // Mobile one-handed use
  mobile: {
    touchTargetSize: 44, // iOS HIG recommendation
    spacing: 24, // Minimum spacing between targets
    bottomSheetActions: true, // Place actions at bottom
    thumbReachZone: true, // Consider thumb reach area
    simplifiedNavigation: true // Reduce navigation complexity
  },

  // Low vision users
  lowVision: {
    minFontSize: 16, // Minimum 16px
    highContrastBorders: true, // Strong border contrast
    focusIndicatorWidth: 4, // Thick focus indicators
    largeClickTargets: true, // Prefer larger targets
    reducedComplexity: true // Simpler layouts
  },

  // Color blindness
  colorBlind: {
    usePatterns: true, // Add patterns to colors
    useIcons: true, // Icons alongside colors
    avoidColorOnly: true, // Never rely on color alone
    highContrast: true, // Prefer high contrast
    textLabels: true // Always provide text alternatives
  },

  // Screen reader users
  screenReader: {
    announceChanges: true, // Use live regions
    descriptiveLabels: true, // Detailed ARIA labels
    landmarkRoles: true, // Proper landmark structure
    skipLinks: true, // Navigation shortcuts
    structuredHeadings: true // Logical heading hierarchy
  },

  // ADHD / Cognitive load reduction
  adhd: {
    shortSentences: true, // Concise text
    clearSteps: true, // Step-by-step processes
    minimalChoices: true, // Reduce decision paralysis
    frequentSaving: true, // Auto-save features
    progressIndicators: true // Show progress clearly
  },

  // Low bandwidth users
  lowBandwidth: {
    lazyLoadImages: true, // Load images on demand
    useSkeletons: true, // Skeleton screens
    limitAnimations: true, // Minimal animations
    compressedAssets: true, // Optimized file sizes
    fallbackFonts: true // System font fallbacks
  }
};

// ================================
// UTILITY FUNCTIONS
// ================================

/**
 * Get error message with persona adaptation
 */
export function getErrorMessage(
  errorKey: string, 
  persona?: keyof typeof personaAdaptations
): ErrorMessage {
  // This would be expanded to adapt messages based on persona
  // For now, return base error message
  const keys = errorKey.split('.');
  let obj: any = errors;
  
  for (const key of keys) {
    obj = obj?.[key];
  }
  
  return obj || {
    summary: "Une erreur s'est produite",
    detail: "Veuillez réessayer",
    recovery: "Contactez-nous si le problème persiste"
  };
}

/**
 * Get content with persona adaptation
 */
export function getContent(
  contentKey: string,
  persona?: keyof typeof personaAdaptations
): ContentItem {
  const keys = contentKey.split('.');
  let obj: any = forms;
  
  for (const key of keys) {
    obj = obj?.[key];
  }
  
  return obj || {
    label: "Champ",
    hint: "Veuillez remplir ce champ"
  };
}

/**
 * Adapt text for cognitive load
 */
export function simplifyText(text: string, persona?: keyof typeof personaAdaptations): string {
  if (persona === 'adhd') {
    // Simplify complex sentences
    return text
      .replace(/(\w+),\s+(\w+)/g, '$1. $2') // Split long sentences
      .replace(/\b(en effet|par conséquent|néanmoins)\b/g, '') // Remove complex connectors
      .trim();
  }
  
  return text;
}

/**
 * Get appropriate loading message
 */
export function getLoadingMessage(action: string): string {
  const loadingMessages: Record<string, string> = {
    submit: status.loading.submit,
    save: status.loading.save,
    delete: status.loading.delete,
    appointment: status.loading.appointment
  };
  
  return loadingMessages[action] || status.loading.default;
}

// Export default for easy importing
export default {
  errors,
  forms,
  actions,
  status,
  help,
  personaAdaptations,
  getErrorMessage,
  getContent,
  simplifyText,
  getLoadingMessage
};