import Anthropic from "@anthropic-ai/sdk";

// Configuration stricte pour l'assistant RDV NOVA
export const APPT_SYSTEM = `
Tu es l'assistant RDV de NOVA. Respecte STRICTEMENT:
- Réponds UNIQUEMENT via un appel d'outil produisant du JSON valide.
- Adresse: "Cité 109, Daboussy El Achour, Alger"
- Timezone: "Africa/Algiers" (UTC+01, sans DST)
- Si info manquante -> status=NEED_INFO (+missing_fields); ne jamais inventer.
- Zéro texte libre, pas de raisonnement affiché, pas de conseils médicaux.
- Langue: Français uniquement.
`;

// Schéma JSON strict pour les RDV
const tools = [
  {
    name: "rdv_json",
    description: "Produire un JSON strict pour gérer les rendez-vous sans texte libre.",
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
              description: "Téléphone au format E.164 algérien"
            },
            email: {
              type: "string",
              format: "email",
              description: "Email du patient (optionnel)"
            },
            patient_id: {
              type: "string",
              description: "ID patient existant (si déjà enregistré)"
            }
          },
          required: ["name", "phone_e164"]
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
            },
            duration_minutes: {
              type: "number",
              minimum: 15,
              maximum: 180,
              description: "Durée en minutes"
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
          items: { type: "string" },
          description: "Champs manquants si status=NEED_INFO"
        },
        clarification_question: {
          type: "string",
          maxLength: 200,
          description: "Question de clarification unique si ambiguïté"
        },
        available_slots: {
          type: "array",
          items: {
            type: "object",
            properties: {
              start_iso: { type: "string", format: "date-time" },
              end_iso: { type: "string", format: "date-time" },
              available: { type: "boolean" }
            }
          },
          description: "Créneaux disponibles (pour FIND_SLOTS)"
        }
      },
      required: ["action", "clinic_address", "timezone"]
    }
  }
];

// Interface TypeScript pour le retour
export interface AppointmentResponse {
  action: "FIND_SLOTS" | "CREATE" | "RESCHEDULE" | "CANCEL" | "CONFIRMATION" | "NEED_INFO";
  clinic_address: "Cité 109, Daboussy El Achour, Alger";
  timezone: "Africa/Algiers";
  patient?: {
    name: string;
    phone_e164: string;
    email?: string;
    patient_id?: string;
  };
  slot?: {
    start_iso: string;
    end_iso: string;
    duration_minutes?: number;
  };
  reason?: string;
  care_type?: "consultation" | "urgence" | "detartrage" | "soin" | "extraction" | "prothese" | "orthodontie" | "chirurgie";
  appointment_id?: string;
  status?: "CONFIRMED" | "PENDING" | "CANCELLED" | "NEED_INFO";
  missing_fields?: string[];
  clarification_question?: string;
  available_slots?: Array<{
    start_iso: string;
    end_iso: string;
    available: boolean;
  }>;
}

// Classe principale pour gérer les RDV
export class AppointmentAssistant {
  private anthropic: Anthropic;
  
  constructor(apiKey?: string) {
    const key = apiKey || process.env.ANTHROPIC_API_KEY;
    if (!key) {
      throw new Error("ANTHROPIC_API_KEY manquante dans les variables d'environnement");
    }
    this.anthropic = new Anthropic({ apiKey: key });
  }

  /**
   * Traite une demande de RDV et retourne un JSON strict
   */
  async processAppointment(userPrompt: string): Promise<AppointmentResponse> {
    try {
      const msg = await this.anthropic.messages.create({
        model: "claude-3-7-sonnet-20250219",
        system: APPT_SYSTEM,
        temperature: 0.1,
        max_tokens: 1024,
        tools,
        // Forcer JSON-only via tool
        tool_choice: { type: "tool", name: "rdv_json" },
        // Désactiver le "extended thinking" par défaut
        // @ts-ignore - Type pas encore à jour dans le SDK
        thinking: { type: "disabled" },
        messages: [{ 
          role: "user", 
          content: [{ 
            type: "text", 
            text: userPrompt 
          }] 
        }]
      });

      // Extraire le JSON depuis le bloc tool_use
      const toolUse = msg.content.find((c: any) => c.type === "tool_use" && c.name === "rdv_json");
      
      if (!toolUse || !toolUse.input) {
        throw new Error("Réponse sans JSON tool_use valide");
      }
      
      // Valider que l'adresse et le fuseau sont corrects
      const response = toolUse.input as AppointmentResponse;
      
      if (response.clinic_address !== "Cité 109, Daboussy El Achour, Alger") {
        throw new Error("Adresse du cabinet incorrecte");
      }
      
      if (response.timezone !== "Africa/Algiers") {
        throw new Error("Fuseau horaire incorrect");
      }
      
      return response;
      
    } catch (_error) {
      console.error("Erreur dans processAppointment:", error);
      
      // Retourner une erreur structurée
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
   * Trouve des créneaux disponibles
   */
  async findAvailableSlots(
    date: string, 
    careType?: string
  ): Promise<AppointmentResponse> {
    const prompt = `Trouve les créneaux disponibles pour le ${date}${careType ? ` pour un ${careType}` : ''}`;
    return this.processAppointment(prompt);
  }

  /**
   * Crée un nouveau RDV
   */
  async createAppointment(
    patientName: string,
    phoneE164: string,
    slot: { start_iso: string; end_iso: string },
    reason?: string,
    careType?: string
  ): Promise<AppointmentResponse> {
    const prompt = `
      Créer un RDV pour:
      - Patient: ${patientName}
      - Téléphone: ${phoneE164}
      - Créneau: ${slot.start_iso} à ${slot.end_iso}
      ${reason ? `- Motif: ${reason}` : ''}
      ${careType ? `- Type de soin: ${careType}` : ''}
    `;
    return this.processAppointment(prompt);
  }

  /**
   * Annule un RDV existant
   */
  async cancelAppointment(
    appointmentId: string,
    patientPhone: string
  ): Promise<AppointmentResponse> {
    const prompt = `
      Annuler le RDV:
      - ID: ${appointmentId}
      - Téléphone patient: ${patientPhone}
    `;
    return this.processAppointment(prompt);
  }

  /**
   * Reprogramme un RDV
   */
  async rescheduleAppointment(
    appointmentId: string,
    newSlot: { start_iso: string; end_iso: string },
    patientPhone: string
  ): Promise<AppointmentResponse> {
    const prompt = `
      Reprogrammer le RDV:
      - ID: ${appointmentId}
      - Nouveau créneau: ${newSlot.start_iso} à ${newSlot.end_iso}
      - Téléphone patient: ${patientPhone}
    `;
    return this.processAppointment(prompt);
  }
}

// Export de la fonction helper pour usage direct
export async function assistAppointment(userPrompt: string): Promise<AppointmentResponse> {
  const assistant = new AppointmentAssistant();
  return assistant.processAppointment(userPrompt);
}