/**
 * NOVA RDV v2 - Enhanced Anthropic wrapper with intelligent slot-filling
 * 
 * Prevents question repetition and implements smart session state tracking
 * Features:
 * - Strict JSON-only output via tool_choice
 * - Session state persistence to avoid repetitions
 * - Smart slot-filling logic
 * - Progressive information gathering
 */

import Anthropic from "@anthropic-ai/sdk";

// Enhanced system prompt with anti-repetition logic
export const APPT_SYSTEM_V2 = `
Tu es l'assistant RDV de NOVA avec une mémoire de session. Respecte STRICTEMENT:

RÈGLES DE BASE:
- Réponds UNIQUEMENT via l'outil "rdv_json" produisant du JSON valide
- Adresse: "Cité 109, Daboussy El Achour, Alger" 
- Timezone: "Africa/Algiers" (UTC+01, sans DST)
- Langue: Français uniquement
- ZÉRO texte libre, pas de conseils médicaux

ANTI-RÉPÉTITION:
- Si le nom est déjà fourni, ne jamais redemander le nom
- Si le téléphone est déjà fourni, ne jamais redemander le téléphone
- Poser UNE SEULE question ciblée pour les infos manquantes
- Varier les formulations entre les tentatives (pas la même phrase)

SLOT-FILLING INTELLIGENT:
- Analyser les infos partielles fournies dans le message
- Extraire nom/téléphone même s'ils ne sont pas parfaits
- Si nom présent mais pas de téléphone → demander UNIQUEMENT le téléphone au format +213...
- Si téléphone présent mais pas de nom → demander UNIQUEMENT le nom complet
- Si téléphone invalide → demander correction avec format +213XXXXXXXX

PROGRESSION:
1. Infos manquantes → status=NEED_INFO avec question ciblée
2. Infos complètes → action=FIND_SLOTS ou CREATE selon le contexte
3. Toujours inclure les infos déjà collectées dans patient{}
`;

// Enhanced tool schema with session state support
const toolsV2 = [
  {
    name: "rdv_json",
    description: "Produire un JSON strict pour gérer les rendez-vous avec état de session.",
    input_schema: {
      type: "object",
      properties: {
        action: {
          type: "string",
          enum: ["FIND_SLOTS", "CREATE", "RESCHEDULE", "CANCEL", "CONFIRMATION", "NEED_INFO"],
          description: "Action à effectuer"
        },
        clinic_address: { 
          type: "string", 
          const: "Cité 109, Daboussy El Achour, Alger",
          description: "Adresse fixe du cabinet"
        },
        timezone: { 
          type: "string", 
          const: "Africa/Algiers",
          description: "Fuseau horaire fixe"
        },
        patient: {
          type: "object",
          properties: {
            name: { 
              type: "string", 
              minLength: 1, 
              maxLength: 120,
              description: "Nom complet du patient"
            },
            phone_e164: { 
              type: "string", 
              pattern: "^\\+213[567]\\d{8}$",
              description: "Téléphone au format E.164 algérien (+213XXXXXXXXX)"
            },
            patient_id: {
              type: "string",
              description: "ID patient existant (si déjà enregistré)"
            }
          }
        },
        slot: {
          type: "object",
          properties: {
            start_iso: { 
              type: "string", 
              format: "date-time",
              description: "Début du créneau en ISO 8601"
            },
            end_iso: { 
              type: "string", 
              format: "date-time",
              description: "Fin du créneau en ISO 8601"
            }
          }
        },
        reason: { 
          type: "string", 
          maxLength: 200,
          description: "Motif du rendez-vous"
        },
        care_type: {
          type: "string",
          enum: ["consultation", "urgence", "detartrage", "soin", "extraction", "prothese", "orthodontie", "chirurgie"],
          description: "Type de soin demandé"
        },
        appointment_id: {
          type: "string",
          description: "ID du RDV pour modification/annulation"
        },
        status: {
          type: "string",
          enum: ["CONFIRMED", "PENDING", "CANCELLED", "NEED_INFO"],
          description: "Statut de la demande"
        },
        missing_fields: {
          type: "array",
          items: { 
            type: "string",
            enum: ["patient_name", "phone_e164", "preferred_date", "care_type", "reason"]
          },
          description: "Champs manquants si status=NEED_INFO"
        },
        clarification_question: {
          type: "string",
          maxLength: 300,
          description: "Question de clarification ciblée (max 1 question par réponse)"
        },
        session_context: {
          type: "object",
          properties: {
            attempt_count: {
              type: "number",
              description: "Nombre de tentatives pour cette information"
            },
            last_bot_message: {
              type: "string",
              description: "Dernier message du bot pour éviter répétition"
            },
            collected_info: {
              type: "object",
              properties: {
                has_name: { type: "boolean" },
                has_phone: { type: "boolean" },
                phone_attempt_count: { type: "number" },
                name_attempt_count: { type: "number" }
              }
            }
          }
        }
      },
      required: ["action", "clinic_address", "timezone"]
    }
  }
];

// Enhanced interface with session tracking
export interface AppointmentResponseV2 {
  action: "FIND_SLOTS" | "CREATE" | "RESCHEDULE" | "CANCEL" | "CONFIRMATION" | "NEED_INFO";
  clinic_address: "Cité 109, Daboussy El Achour, Alger";
  timezone: "Africa/Algiers";
  patient?: {
    name?: string;
    phone_e164?: string;
    patient_id?: string;
  };
  slot?: {
    start_iso: string;
    end_iso: string;
  };
  reason?: string;
  care_type?: "consultation" | "urgence" | "detartrage" | "soin" | "extraction" | "prothese" | "orthodontie" | "chirurgie";
  appointment_id?: string;
  status?: "CONFIRMED" | "PENDING" | "CANCELLED" | "NEED_INFO";
  missing_fields?: string[];
  clarification_question?: string;
  session_context?: {
    attempt_count?: number;
    last_bot_message?: string;
    collected_info?: {
      has_name?: boolean;
      has_phone?: boolean;
      phone_attempt_count?: number;
      name_attempt_count?: number;
    };
  };
}

// Session state interface
export interface SessionState {
  sessionId: string;
  patientName?: string;
  phoneE164?: string;
  lastBotMessage?: string;
  attemptCounts: {
    name: number;
    phone: number;
    total: number;
  };
  collectedFields: Set<string>;
  createdAt: Date;
  updatedAt: Date;
}

// Enhanced appointment assistant with session management
export class AppointmentAssistantV2 {
  private anthropic: Anthropic;
  private sessionStore: Map<string, SessionState> = new Map();
  
  constructor(apiKey?: string) {
    const key = apiKey || process.env.ANTHROPIC_API_KEY;
    if (!key) {
      throw new Error("ANTHROPIC_API_KEY manquante dans les variables d'environnement");
    }
    this.anthropic = new Anthropic({ apiKey: key });
  }

  /**
   * Get or create session state
   */
  private getSessionState(sessionId: string): SessionState {
    let session = this.sessionStore.get(sessionId);
    if (!session) {
      session = {
        sessionId,
        attemptCounts: { name: 0, phone: 0, total: 0 },
        collectedFields: new Set(),
        createdAt: new Date(),
        updatedAt: new Date()
      };
      this.sessionStore.set(sessionId, session);
    }
    return session;
  }

  /**
   * Update session state with new information
   */
  private updateSessionState(
    sessionId: string, 
    updates: Partial<SessionState>
  ): SessionState {
    const session = this.getSessionState(sessionId);
    Object.assign(session, updates, { updatedAt: new Date() });
    this.sessionStore.set(sessionId, session);
    return session;
  }

  /**
   * Build context-aware system prompt with session state
   */
  private buildContextualPrompt(
    userMessage: string, 
    sessionState: SessionState
  ): string {
    let contextPrompt = APPT_SYSTEM_V2;
    
    // Add session context
    if (sessionState.patientName || sessionState.phoneE164) {
      contextPrompt += "\n\nINFORMATIONS DÉJÀ COLLECTÉES:";
      if (sessionState.patientName) {
        contextPrompt += `\n- Nom du patient: ${sessionState.patientName}`;
      }
      if (sessionState.phoneE164) {
        contextPrompt += `\n- Téléphone: ${sessionState.phoneE164}`;
      }
    }

    // Add attempt context to prevent repetition
    if (sessionState.lastBotMessage) {
      contextPrompt += `\n\nDERNIER MESSAGE DU BOT: "${sessionState.lastBotMessage}"`;
      contextPrompt += "\n-> NE PAS répéter cette formulation exacte!";
    }

    if (sessionState.attemptCounts.total > 0) {
      contextPrompt += `\n\nTENTATIVES: ${sessionState.attemptCounts.total} (nom: ${sessionState.attemptCounts.name}, tél: ${sessionState.attemptCounts.phone})`;
      contextPrompt += "\n-> Varier la formulation des questions!";
    }

    return contextPrompt;
  }

  /**
   * Process appointment with session-aware intelligence
   */
  async processAppointmentWithSession(
    userMessage: string,
    sessionId: string
  ): Promise<AppointmentResponseV2> {
    try {
      // Get current session state
      const sessionState = this.getSessionState(sessionId);
      
      // Build contextual system prompt
      const systemPrompt = this.buildContextualPrompt(userMessage, sessionState);
      
      // Prepare user message with session context
      let contextualUserMessage = userMessage;
      if (sessionState.patientName || sessionState.phoneE164) {
        contextualUserMessage += "\n\n[CONTEXTE SESSION:";
        if (sessionState.patientName) {
          contextualUserMessage += ` Nom=${sessionState.patientName}`;
        }
        if (sessionState.phoneE164) {
          contextualUserMessage += ` Téléphone=${sessionState.phoneE164}`;
        }
        contextualUserMessage += "]";
      }

      // Call Anthropic with enhanced context
      const msg = await this.anthropic.messages.create({
        model: "claude-3-7-sonnet-20250219",
        system: systemPrompt,
        temperature: 0.2, // Slightly higher for variation in responses
        max_tokens: 1024,
        tools: toolsV2,
        tool_choice: { type: "tool", name: "rdv_json" },
        messages: [{ 
          role: "user", 
          content: contextualUserMessage 
        }]
      });

      // Extract JSON response
      const toolUse = msg.content.find((c: any) => 
        c.type === "tool_use" && c.name === "rdv_json"
      );
      
      if (!toolUse?.input) {
        throw new Error("Réponse sans JSON tool_use valide");
      }
      
      const response = toolUse.input as AppointmentResponseV2;
      
      // Validate required constants
      if (response.clinic_address !== "Cité 109, Daboussy El Achour, Alger") {
        response.clinic_address = "Cité 109, Daboussy El Achour, Alger";
      }
      
      if (response.timezone !== "Africa/Algiers") {
        response.timezone = "Africa/Algiers";
      }

      // Update session state based on response
      const updates: Partial<SessionState> = {
        attemptCounts: {
          ...sessionState.attemptCounts,
          total: sessionState.attemptCounts.total + 1
        }
      };

      // Extract and preserve patient information
      if (response.patient?.name && response.patient.name !== sessionState.patientName) {
        updates.patientName = response.patient.name;
        updates.attemptCounts!.name = sessionState.attemptCounts.name + 1;
        sessionState.collectedFields.add('name');
      }

      if (response.patient?.phone_e164 && response.patient.phone_e164 !== sessionState.phoneE164) {
        updates.phoneE164 = response.patient.phone_e164;
        updates.attemptCounts!.phone = sessionState.attemptCounts.phone + 1;
        sessionState.collectedFields.add('phone');
      }

      if (response.clarification_question) {
        updates.lastBotMessage = response.clarification_question;
      }

      // Update session
      this.updateSessionState(sessionId, updates);

      // Enhance response with session context
      response.session_context = {
        attempt_count: updates.attemptCounts!.total,
        last_bot_message: updates.lastBotMessage,
        collected_info: {
          has_name: Boolean(sessionState.patientName || response.patient?.name),
          has_phone: Boolean(sessionState.phoneE164 || response.patient?.phone_e164),
          phone_attempt_count: updates.attemptCounts!.phone,
          name_attempt_count: updates.attemptCounts!.name
        }
      };

      return response;
      
    } catch (_error) {
      console.error("Erreur dans processAppointmentWithSession:", error);
      
      // Return structured error
      return {
        action: "NEED_INFO",
        clinic_address: "Cité 109, Daboussy El Achour, Alger",
        timezone: "Africa/Algiers",
        status: "NEED_INFO",
        missing_fields: ["error_processing"],
        clarification_question: "Une erreur s'est produite. Pouvez-vous reformuler votre demande?"
      };
    }
  }

  /**
   * Legacy method for backward compatibility
   */
  async processAppointment(userPrompt: string): Promise<AppointmentResponseV2> {
    // Generate a simple session ID for legacy calls
    const sessionId = `legacy_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    return this.processAppointmentWithSession(userPrompt, sessionId);
  }

  /**
   * Clear old sessions (cleanup utility)
   */
  cleanupSessions(maxAgeMinutes: number = 30): number {
    const cutoff = new Date(Date.now() - maxAgeMinutes * 60 * 1000);
    let cleaned = 0;
    
    for (const [sessionId, session] of this.sessionStore.entries()) {
      if (session.updatedAt < cutoff) {
        this.sessionStore.delete(sessionId);
        cleaned++;
      }
    }
    
    return cleaned;
  }

  /**
   * Get session information for debugging
   */
  getSessionInfo(sessionId: string): SessionState | undefined {
    return this.sessionStore.get(sessionId);
  }

  /**
   * Get all active sessions count
   */
  getActiveSessionsCount(): number {
    return this.sessionStore.size;
  }
}

// Enhanced helper function with session support
export async function assistAppointmentV2(
  userPrompt: string, 
  sessionId?: string
): Promise<AppointmentResponseV2> {
  const assistant = new AppointmentAssistantV2();
  
  if (sessionId) {
    return assistant.processAppointmentWithSession(userPrompt, sessionId);
  } else {
    return assistant.processAppointment(userPrompt);
  }
}

// Export singleton instance for shared session state
let sharedAssistant: AppointmentAssistantV2 | null = null;

export function getSharedAppointmentAssistant(): AppointmentAssistantV2 {
  if (!sharedAssistant) {
    sharedAssistant = new AppointmentAssistantV2();
  }
  return sharedAssistant;
}