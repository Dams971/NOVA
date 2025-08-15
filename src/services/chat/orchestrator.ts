import { z } from 'zod';
import { env } from '@/config/env';
import NLPService from '@/lib/ai/nlp-service';
import AppointmentTools from './tools/appointment-tools';
import PatientTools from './tools/patient-tools';
import CabinetTools from './tools/cabinet-tools';

/**
 * NOVA AI Chatbot Orchestrator
 * Handles appointment booking conversations with security and compliance
 */

// Intent recognition schemas
const IntentSchema = z.enum([
  'greeting',
  'check_availability',
  'book_appointment', 
  'reschedule_appointment',
  'cancel_appointment',
  'list_practitioners',
  'clinic_info',
  'emergency',
  'help',
  'goodbye',
  'fallback'
]);

const SlotsSchema = z.object({
  cabinetId: z.string().optional(),
  patientId: z.string().optional(),
  patientEmail: z.string().email().optional(),
  patientPhone: z.string().optional(),
  practitionerId: z.string().optional(),
  serviceId: z.string().optional(),
  serviceType: z.string().optional(),
  duration: z.number().min(15).max(480).optional(), // 15 minutes to 8 hours
  date: z.string().optional(),
  time: z.string().optional(),
  timeWindow: z.enum(['morning', 'afternoon', 'evening']).optional(),
  timezone: z.string().default('Europe/Paris'),
  urgency: z.enum(['routine', 'urgent', 'emergency']).default('routine'),
  notes: z.string().optional(),
  appointmentId: z.string().optional(), // for reschedule/cancel
  reason: z.string().optional(), // for cancel
}).passthrough();

const NLUResultSchema = z.object({
  intent: IntentSchema,
  confidence: z.number().min(0).max(1),
  slots: SlotsSchema,
  entities: z.array(z.object({
    type: z.string(),
    value: z.string(),
    confidence: z.number()
  })).default([]),
  rawText: z.string()
});

export type Intent = z.infer<typeof IntentSchema>;
export type Slots = z.infer<typeof SlotsSchema>;
export type NLUResult = z.infer<typeof NLUResultSchema>;

export interface ChatContext {
  sessionId: string;
  user: {
    userId: string;
    role: string;
    email?: string;
  };
  tenant: {
    id: string;
    name: string;
    timezone: string;
    businessHours: {
      [key: string]: { open: string; close: string; };
    };
  };
  conversation: {
    messages: Array<{
      role: 'user' | 'assistant' | 'system';
      content: string;
      timestamp: Date;
      metadata?: any;
    }>;
    state: 'active' | 'waiting_for_input' | 'completed' | 'escalated';
    currentIntent?: Intent;
    collectedSlots: Slots;
    confirmationPending?: boolean;
  };
}

export interface ChatResponse {
  message: string;
  suggestedReplies?: string[];
  requiresInput?: boolean;
  inputType?: 'text' | 'date' | 'time' | 'select' | 'confirmation';
  options?: Array<{ value: string; label: string; }>;
  completed?: boolean;
  escalate?: boolean;
  data?: any;
}

/**
 * Main chat orchestrator
 */
export class ChatOrchestrator {
  private readonly CONFIDENCE_THRESHOLD = 0.55;
  private readonly MAX_TURNS_BEFORE_ESCALATION = 10;
  private readonly SLOT_CONFIRMATION_THRESHOLD = 0.7;

  constructor(
    private readonly nlpService: NLPService = NLPService.getInstance(),
    private readonly appointmentTools: AppointmentTools = AppointmentTools.getInstance(),
    private readonly patientTools: PatientTools = PatientTools.getInstance(),
    private readonly cabinetTools: CabinetTools = CabinetTools.getInstance()
  ) {}

  /**
   * Process user message and generate response
   */
  async handleMessage(
    message: string,
    context: ChatContext
  ): Promise<ChatResponse> {
    try {
      // 1. Security: Prompt injection guard
      if (this.detectPromptInjection(message)) {
        await this.logSecurityEvent(context, 'prompt_injection', message);
        return this.createSafeResponse(
          "Je ne peux pas traiter cette demande. Pouvez-vous reformuler votre question concernant vos rendez-vous ?",
          ['Prendre un rendez-vous', 'Voir mes rendez-vous', 'Parler à un conseiller']
        );
      }

      // 2. Extract intent and entities
      const nluResult = await this.nlpService.extractIntentEntities(message, {
        tenant: context.tenant,
        user: context.user,
        previousContext: context.conversation
      });

      // 3. Confidence check
      if (nluResult.confidence < this.CONFIDENCE_THRESHOLD) {
        return await this.handleLowConfidence(message, context, nluResult);
      }

      // 4. Update conversation context
      context.conversation.messages.push({
        role: 'user',
        content: message,
        timestamp: new Date()
      });

      context.conversation.currentIntent = nluResult.intent;

      // 5. Merge new slots with existing ones
      context.conversation.collectedSlots = {
        ...context.conversation.collectedSlots,
        ...nluResult.slots
      };

      // 6. Route to intent handler
      const response = await this.routeIntent(nluResult, context);

      // 7. Add response to conversation history
      context.conversation.messages.push({
        role: 'assistant',
        content: response.message,
        timestamp: new Date(),
        metadata: { intent: nluResult.intent, confidence: nluResult.confidence }
      });

      return response;

    } catch (_error) {
      console.error('Chat orchestration error:', error);
      
      // Log error for monitoring
      await this.logError(context, error);

      return {
        message: "Désolé, je rencontre un problème technique. Un conseiller va vous aider.",
        escalate: true
      };
    }
  }

  /**
   * Route to specific intent handler
   */
  private async routeIntent(nlu: NLUResult, context: ChatContext): Promise<ChatResponse> {
    const { intent, slots } = nlu;

    // Check required slots and permissions for each intent
    const validation = await this.validateIntentAndSlots(intent, slots, context);
    if (!validation.valid) {
      return validation.response;
    }

    switch (intent) {
      case 'greeting':
        return this.handleGreeting(context);

      case 'check_availability':
        return await this.handleCheckAvailability(slots, context);

      case 'book_appointment':
        return await this.handleBookAppointment(slots, context);

      case 'reschedule_appointment':
        return await this.handleRescheduleAppointment(slots, context);

      case 'cancel_appointment':
        return await this.handleCancelAppointment(slots, context);

      case 'list_practitioners':
        return await this.handleListPractitioners(slots, context);

      case 'clinic_info':
        return await this.handleClinicInfo(context);

      case 'emergency':
        return await this.handleEmergency(context);

      case 'help':
        return this.handleHelp(context);

      case 'goodbye':
        return this.handleGoodbye(context);

      default:
        return this.handleFallback(context);
    }
  }

  /**
   * Validate intent requirements and user permissions
   */
  private async validateIntentAndSlots(
    intent: Intent,
    slots: Slots,
    context: ChatContext
  ): Promise<{ valid: boolean; response?: ChatResponse }> {
    // Check user permissions for sensitive operations
    const sensitiveIntents: Intent[] = ['book_appointment', 'cancel_appointment', 'reschedule_appointment'];
    
    if (sensitiveIntents.includes(intent)) {
      // Ensure user has permission for the requested cabinet
      if (slots.cabinetId && !this.userHasCabinetAccess(context.user, slots.cabinetId)) {
        await this.logSecurityEvent(context, 'unauthorized_cabinet_access', slots.cabinetId);
        return {
          valid: false,
          response: {
            message: "Vous n'avez pas accès à ce cabinet. Contactez votre administrateur.",
            escalate: true
          }
        };
      }
    }

    return { valid: true };
  }

  /**
   * Intent handlers
   */
  private handleGreeting(context: ChatContext): ChatResponse {
    const timeOfDay = new Date().getHours();
    let greeting = "Bonjour";
    
    if (timeOfDay >= 18) greeting = "Bonsoir";
    else if (timeOfDay >= 12) greeting = "Bonjour";

    return {
      message: `${greeting} ! Je suis Nova, votre assistant pour la prise de rendez-vous au ${context.tenant.name}. Comment puis-je vous aider aujourd'hui ?`,
      suggestedReplies: [
        'Prendre un rendez-vous',
        'Voir mes disponibilités',
        'Modifier mon rendez-vous',
        'Annuler mon rendez-vous'
      ],
      requiresInput: true,
      inputType: 'text'
    };
  }

  private async handleCheckAvailability(slots: Slots, context: ChatContext): Promise<ChatResponse> {
    // Check required slots
    const missingSlots = this.getMissingSlots(['date', 'serviceType'], slots);
    if (missingSlots.length > 0) {
      return this.askForMissingSlots(missingSlots, context);
    }

    try {
      // Call availability tool
      const availability = await this.appointmentTools.checkAvailability({
        tenantId: context.tenant.id,
        practitionerId: slots.practitionerId,
        serviceType: slots.serviceType!,
        date: slots.date!,
        timeWindow: slots.timeWindow,
        timezone: slots.timezone
      });

      if (availability.slots.length === 0) {
        return {
          message: `Désolé, aucun créneau n'est disponible le ${this.formatDate(slots.date!)}. Voulez-vous voir d'autres dates disponibles ?`,
          suggestedReplies: [
            'Voir d\'autres dates',
            'Changer de praticien',
            'Parler à un conseiller'
          ],
          requiresInput: true,
          inputType: 'select'
        };
      }

      const slotsText = availability.slots
        .slice(0, 5) // Show max 5 slots
        .map(slot => `• ${slot.time} avec ${slot.practitionerName}`)
        .join('\n');

      return {
        message: `Voici les créneaux disponibles le ${this.formatDate(slots.date!)} :\n\n${slotsText}\n\nSouhaitez-vous réserver l'un de ces créneaux ?`,
        data: { availableSlots: availability.slots },
        requiresInput: true,
        inputType: 'select'
      };

    } catch (_error) {
      console.error('Availability check error:', error);
      return {
        message: "Je ne peux pas vérifier les disponibilités actuellement. Un conseiller va vous aider.",
        escalate: true
      };
    }
  }

  private async handleBookAppointment(slots: Slots, context: ChatContext): Promise<ChatResponse> {
    // Required slots for booking
    const requiredSlots = ['patientEmail', 'practitionerId', 'serviceType', 'date', 'time'];
    const missingSlots = this.getMissingSlots(requiredSlots, slots);
    
    if (missingSlots.length > 0) {
      return this.askForMissingSlots(missingSlots, context);
    }

    // If we have all slots but no confirmation yet, ask for confirmation
    if (!context.conversation.confirmationPending) {
      context.conversation.confirmationPending = true;
      
      return {
        message: `Récapitulatif de votre rendez-vous :\n\n• Date : ${this.formatDate(slots.date!)}\n• Heure : ${slots.time}\n• Service : ${slots.serviceType}\n• Email : ${slots.patientEmail}\n\nConfirmez-vous cette réservation ?`,
        requiresInput: true,
        inputType: 'confirmation',
        options: [
          { value: 'yes', label: 'Confirmer' },
          { value: 'no', label: 'Modifier' },
          { value: 'cancel', label: 'Annuler' }
        ]
      };
    }

    // Confirmed - proceed with booking
    try {
      const appointment = await this.appointmentTools.bookAppointment({
        tenantId: context.tenant.id,
        patientEmail: slots.patientEmail!,
        practitionerId: slots.practitionerId!,
        serviceType: slots.serviceType!,
        date: slots.date!,
        time: slots.time!,
        timezone: slots.timezone,
        notes: slots.notes,
        bookedBy: context.user.userId
      });

      // Log successful booking
      await this.logBusinessEvent(context, 'appointment_booked', {
        appointmentId: appointment.id,
        patientEmail: slots.patientEmail,
        practitionerId: slots.practitionerId
      });

      return {
        message: `✅ Parfait ! Votre rendez-vous est confirmé :\n\n📅 ${this.formatDate(slots.date!)} à ${slots.time}\n📍 ${context.tenant.name}\n📧 Un email de confirmation a été envoyé à ${slots.patientEmail}\n\nRendez-vous dans 24h avant pour vous rappeler. À bientôt !`,
        completed: true,
        data: { appointmentId: appointment.id }
      };

    } catch (_error) {
      console.error('Appointment booking error:', error);

      if (error.message?.includes('conflict')) {
        return {
          message: "Ce créneau n'est plus disponible. Voulez-vous choisir un autre horaire ?",
          requiresInput: true,
          suggestedReplies: ['Voir d\'autres créneaux', 'Changer de date', 'Parler à un conseiller']
        };
      }

      return {
        message: "Je ne peux pas finaliser votre réservation. Un conseiller va vous aider immédiatement.",
        escalate: true
      };
    }
  }

  private async handleRescheduleAppointment(slots: Slots, context: ChatContext): Promise<ChatResponse> {
    const requiredSlots = ['appointmentId', 'date', 'time'];
    const missingSlots = this.getMissingSlots(requiredSlots, slots);
    
    if (missingSlots.length > 0) {
      // If missing appointment ID, try to find it by patient email
      if (missingSlots.includes('appointmentId') && slots.patientEmail) {
        const appointments = await this.appointmentTools.findPatientAppointments({
          tenantId: context.tenant.id,
          patientEmail: slots.patientEmail,
          status: ['scheduled', 'confirmed']
        });

        if (appointments.length === 0) {
          return {
            message: "Je ne trouve aucun rendez-vous à votre nom. Voulez-vous vérifier votre email ou parler à un conseiller ?",
            escalate: true
          };
        }

        if (appointments.length === 1) {
          slots.appointmentId = appointments[0].id;
        } else {
          // Multiple appointments - ask user to choose
          const appointmentsList = appointments
            .map((apt, index) => `${index + 1}. ${this.formatDate(apt.date)} à ${apt.time}`)
            .join('\n');

          return {
            message: `J'ai trouvé plusieurs rendez-vous :\n\n${appointmentsList}\n\nLequel souhaitez-vous reporter ?`,
            requiresInput: true,
            inputType: 'select',
            data: { appointments }
          };
        }
      } else {
        return this.askForMissingSlots(missingSlots, context);
      }
    }

    try {
      const result = await this.appointmentTools.rescheduleAppointment({
        tenantId: context.tenant.id,
        appointmentId: slots.appointmentId!,
        newDate: slots.date!,
        newTime: slots.time!,
        timezone: slots.timezone,
        rescheduledBy: context.user.userId
      });

      return {
        message: `✅ Votre rendez-vous a été reporté avec succès !\n\n📅 Nouvelle date : ${this.formatDate(slots.date!)} à ${slots.time}\n📧 Un email de confirmation a été envoyé.`,
        completed: true,
        data: { appointmentId: slots.appointmentId }
      };

    } catch (_error) {
      console.error('Appointment reschedule error:', error);
      return {
        message: "Je ne peux pas reporter votre rendez-vous. Un conseiller va vous aider.",
        escalate: true
      };
    }
  }

  private async handleCancelAppointment(slots: Slots, context: ChatContext): Promise<ChatResponse> {
    const requiredSlots = ['appointmentId'];
    const missingSlots = this.getMissingSlots(requiredSlots, slots);
    
    if (missingSlots.length > 0) {
      return this.askForMissingSlots(['email'], context);
    }

    if (!context.conversation.confirmationPending) {
      context.conversation.confirmationPending = true;
      
      return {
        message: "Êtes-vous sûr(e) de vouloir annuler votre rendez-vous ? Cette action ne peut pas être annulée.",
        requiresInput: true,
        inputType: 'confirmation',
        options: [
          { value: 'yes', label: 'Confirmer l\'annulation' },
          { value: 'no', label: 'Garder le rendez-vous' }
        ]
      };
    }

    try {
      await this.appointmentTools.cancelAppointment({
        tenantId: context.tenant.id,
        appointmentId: slots.appointmentId!,
        reason: slots.reason || 'Annulation par le patient',
        cancelledBy: context.user.userId
      });

      return {
        message: "✅ Votre rendez-vous a été annulé avec succès. Un email de confirmation a été envoyé.\n\nN'hésitez pas à reprendre un nouveau rendez-vous quand vous le souhaitez !",
        completed: true,
        suggestedReplies: ['Prendre un nouveau rendez-vous']
      };

    } catch (_error) {
      console.error('Appointment cancellation error:', error);
      return {
        message: "Je ne peux pas annuler votre rendez-vous. Un conseiller va vous aider.",
        escalate: true
      };
    }
  }

  private async handleListPractitioners(slots: Slots, context: ChatContext): Promise<ChatResponse> {
    try {
      const practitioners = await this.cabinetTools.getPractitioners({
        tenantId: context.tenant.id,
        specialty: slots.serviceType
      });

      if (practitioners.length === 0) {
        return {
          message: "Aucun praticien n'est disponible actuellement.",
          escalate: true
        };
      }

      const practitionersList = practitioners
        .map(p => `• ${p.name} - ${p.specialty}${p.nextAvailability ? ` (prochain créneau: ${p.nextAvailability})` : ''}`)
        .join('\n');

      return {
        message: `Voici nos praticiens disponibles :\n\n${practitionersList}\n\nSouhaitez-vous prendre rendez-vous avec l'un d'entre eux ?`,
        data: { practitioners },
        requiresInput: true,
        suggestedReplies: practitioners.slice(0, 3).map(p => `Rdv avec ${p.name}`)
      };

    } catch (_error) {
      console.error('Practitioners list error:', error);
      return {
        message: "Je ne peux pas afficher la liste des praticiens. Un conseiller va vous aider.",
        escalate: true
      };
    }
  }

  private async handleClinicInfo(context: ChatContext): Promise<ChatResponse> {
    return {
      message: `Informations sur ${context.tenant.name} :\n\n📍 Adresse : [À compléter]\n📞 Téléphone : [À compléter]\n🕒 Horaires : Lun-Ven 8h-18h\n🌐 Site web : [À compléter]\n\nComment puis-je vous aider d'autre ?`,
      suggestedReplies: [
        'Prendre rendez-vous',
        'Voir les praticiens',
        'Parler à un conseiller'
      ]
    };
  }

  private async handleEmergency(context: ChatContext): Promise<ChatResponse> {
    // Log emergency request for immediate attention
    await this.logBusinessEvent(context, 'emergency_request', {
      timestamp: new Date().toISOString(),
      userInfo: context.user
    });

    return {
      message: "🚨 Pour une urgence dentaire :\n\n📞 Appelez immédiatement le [NUMERO_URGENCE]\n🏥 Ou rendez-vous aux urgences de l'hôpital le plus proche\n\nJe transmets votre demande à notre équipe qui vous rappellera dans les plus brefs délais.",
      escalate: true,
      completed: true
    };
  }

  private handleHelp(context: ChatContext): ChatResponse {
    return {
      message: "Je peux vous aider avec :\n\n• Prendre un rendez-vous\n• Modifier ou annuler un rendez-vous\n• Voir les disponibilités\n• Informations sur le cabinet\n• Urgences dentaires\n\nQue souhaitez-vous faire ?",
      suggestedReplies: [
        'Prendre rendez-vous',
        'Modifier rendez-vous', 
        'Voir disponibilités',
        'Parler à un conseiller'
      ]
    };
  }

  private handleGoodbye(context: ChatContext): ChatResponse {
    return {
      message: "Au revoir ! N'hésitez pas à revenir si vous avez besoin d'aide pour vos rendez-vous. Bonne journée ! 😊",
      completed: true
    };
  }

  private handleFallback(context: ChatContext): ChatResponse {
    const fallbackCount = context.conversation.messages.filter(
      m => m.metadata?.intent === 'fallback'
    ).length;

    if (fallbackCount >= 2) {
      return {
        message: "Je ne comprends pas bien votre demande. Un conseiller va vous aider personnellement.",
        escalate: true
      };
    }

    return {
      message: "Je ne suis pas sûr de comprendre. Pouvez-vous reformuler ? Je peux vous aider à prendre, modifier ou annuler un rendez-vous.",
      suggestedReplies: [
        'Prendre rendez-vous',
        'Modifier rendez-vous',
        'Annuler rendez-vous',
        'Parler à un conseiller'
      ]
    };
  }

  /**
   * Handle low confidence scenarios
   */
  private async handleLowConfidence(
    message: string,
    context: ChatContext,
    nluResult: NLUResult
  ): Promise<ChatResponse> {
    // Check if user is asking for human help
    const humanKeywords = ['conseiller', 'humain', 'personne', 'aide', 'problème'];
    if (humanKeywords.some(keyword => message.toLowerCase().includes(keyword))) {
      return {
        message: "Je vous mets en relation avec un conseiller. Veuillez patienter...",
        escalate: true
      };
    }

    // Try to clarify intent with suggestions
    return {
      message: "Je ne suis pas sûr de comprendre votre demande. Voulez-vous :\n\n• Prendre un rendez-vous\n• Modifier un rendez-vous existant\n• Voir les disponibilités\n• Parler à un conseiller ?",
      requiresInput: true,
      inputType: 'select',
      options: [
        { value: 'book', label: 'Prendre rendez-vous' },
        { value: 'modify', label: 'Modifier rendez-vous' },
        { value: 'availability', label: 'Voir disponibilités' },
        { value: 'human', label: 'Parler à un conseiller' }
      ]
    };
  }

  /**
   * Utility methods
   */
  private getMissingSlots(required: string[], slots: Slots): string[] {
    return required.filter(slot => !slots[slot as keyof Slots]);
  }

  private askForMissingSlots(missing: string[], context: ChatContext): ChatResponse {
    const slotPrompts: Record<string, string> = {
      'date': 'Quelle date souhaitez-vous ?',
      'time': 'À quelle heure préférez-vous ?',
      'serviceType': 'Quel type de soin souhaitez-vous ?',
      'patientEmail': 'Quel est votre email ?',
      'practitionerId': 'Avez-vous une préférence de praticien ?',
      'appointmentId': 'Pouvez-vous me donner votre numéro de rendez-vous ou votre email ?'
    };

    const firstMissing = missing[0];
    const prompt = slotPrompts[firstMissing] || `Pouvez-vous préciser ${firstMissing} ?`;

    return {
      message: prompt,
      requiresInput: true,
      inputType: firstMissing === 'date' ? 'date' : firstMissing === 'time' ? 'time' : 'text'
    };
  }

  private detectPromptInjection(message: string): boolean {
    const injectionPatterns = [
      /ignore\s+(previous|above|all)\s+instructions?/i,
      /you\s+are\s+now\s+/i,
      /system\s*:\s*/i,
      /\[SYSTEM\]/i,
      /assistant\s*:\s*/i,
      /\{\{.*\}\}/,
      /<\|.*\|>/,
      /act\s+as\s+/i,
      /pretend\s+you\s+are/i,
      /roleplay\s+as/i
    ];

    return injectionPatterns.some(pattern => pattern.test(message));
  }

  private formatDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  }

  private createSafeResponse(message: string, suggestions?: string[]): ChatResponse {
    return {
      message,
      suggestedReplies: suggestions,
      requiresInput: true,
      inputType: 'text'
    };
  }

  private userHasCabinetAccess(user: ChatContext['user'], cabinetId: string): boolean {
    // Implement based on your RBAC system
    return true; // Placeholder
  }

  private async logSecurityEvent(context: ChatContext, event: string, details?: any): Promise<void> {
    console.warn(`Security event [${event}]:`, {
      sessionId: context.sessionId,
      userId: context.user.userId,
      tenantId: context.tenant.id,
      details,
      timestamp: new Date().toISOString()
    });
  }

  private async logBusinessEvent(context: ChatContext, event: string, details?: any): Promise<void> {
    console.info(`Business event [${event}]:`, {
      sessionId: context.sessionId,
      userId: context.user.userId,
      tenantId: context.tenant.id,
      details,
      timestamp: new Date().toISOString()
    });
  }

  private async logError(context: ChatContext, error: any): Promise<void> {
    console.error('Chat error:', {
      sessionId: context.sessionId,
      userId: context.user.userId,
      tenantId: context.tenant.id,
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Factory function to create a new ChatOrchestrator instance
 */
export function createChatOrchestrator(): ChatOrchestrator {
  return new ChatOrchestrator();
}