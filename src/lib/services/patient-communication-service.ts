import { Patient } from '@/lib/models/patient';
import { CabinetAccessControl, UserContext } from './cabinet-access-control';

export interface CommunicationMessage {
  id: string;
  patientId: string;
  cabinetId: string;
  type: 'email' | 'sms' | 'phone' | 'in_person' | 'system';
  direction: 'inbound' | 'outbound';
  subject?: string;
  content: string;
  status: 'sent' | 'delivered' | 'read' | 'failed' | 'pending';
  sentBy?: string; // User ID who sent the message
  sentAt: Date;
  readAt?: Date;
  metadata?: {
    appointmentId?: string;
    reminderType?: string;
    templateId?: string;
    attachments?: string[];
  };
  createdAt: Date;
}

export interface CommunicationTemplate {
  id: string;
  name: string;
  type: 'appointment_reminder' | 'appointment_confirmation' | 'follow_up' | 'marketing' | 'custom';
  channel: 'email' | 'sms' | 'both';
  subject?: string;
  content: string;
  variables: string[]; // Available template variables like {patientName}, {appointmentDate}
  isActive: boolean;
  cabinetId?: string; // null for global templates
  createdAt: Date;
  updatedAt: Date;
}

export interface SendMessageRequest {
  patientId: string;
  type: 'email' | 'sms';
  subject?: string;
  content: string;
  templateId?: string;
  appointmentId?: string;
  scheduledFor?: Date; // For scheduled messages
}

export interface CommunicationHistory {
  messages: CommunicationMessage[];
  total: number;
  unreadCount: number;
}

export interface CommunicationServiceResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export class PatientCommunicationService {
  private static instance: PatientCommunicationService;
  private messages: Map<string, CommunicationMessage> = new Map();
  private templates: Map<string, CommunicationTemplate> = new Map();
  private accessControl: CabinetAccessControl;

  private constructor() {
    this.accessControl = CabinetAccessControl.getInstance();
    this.initializeMockData();
  }

  static getInstance(): PatientCommunicationService {
    if (!PatientCommunicationService.instance) {
      PatientCommunicationService.instance = new PatientCommunicationService();
    }
    return PatientCommunicationService.instance;
  }

  private initializeMockData(): void {
    // Mock communication templates
    const mockTemplates: CommunicationTemplate[] = [
      {
        id: 'template-1',
        name: 'Rappel de rendez-vous - 24h',
        type: 'appointment_reminder',
        channel: 'both',
        subject: 'Rappel: Rendez-vous demain chez {cabinetName}',
        content: 'Bonjour {patientName},\n\nNous vous rappelons votre rendez-vous prévu demain {appointmentDate} à {appointmentTime} chez {cabinetName}.\n\nSi vous ne pouvez pas vous présenter, merci de nous prévenir au {cabinetPhone}.\n\nÀ bientôt !',
        variables: ['patientName', 'appointmentDate', 'appointmentTime', 'cabinetName', 'cabinetPhone'],
        isActive: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01')
      },
      {
        id: 'template-2',
        name: 'Confirmation de rendez-vous',
        type: 'appointment_confirmation',
        channel: 'email',
        subject: 'Confirmation de votre rendez-vous',
        content: 'Bonjour {patientName},\n\nVotre rendez-vous a été confirmé pour le {appointmentDate} à {appointmentTime}.\n\nAdresse: {cabinetAddress}\nTéléphone: {cabinetPhone}\n\nNous vous attendons !',
        variables: ['patientName', 'appointmentDate', 'appointmentTime', 'cabinetAddress', 'cabinetPhone'],
        isActive: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01')
      },
      {
        id: 'template-3',
        name: 'Suivi post-consultation',
        type: 'follow_up',
        channel: 'email',
        subject: 'Suivi de votre consultation',
        content: 'Bonjour {patientName},\n\nNous espérons que votre consultation s\'est bien déroulée.\n\nN\'hésitez pas à nous contacter si vous avez des questions ou des préoccupations.\n\nPrenez soin de vous !',
        variables: ['patientName'],
        isActive: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01')
      }
    ];

    mockTemplates.forEach(template => {
      this.templates.set(template.id, template);
    });

    // Mock communication messages
    const mockMessages: CommunicationMessage[] = [
      {
        id: 'msg-1',
        patientId: 'patient-1',
        cabinetId: 'cabinet-1',
        type: 'email',
        direction: 'outbound',
        subject: 'Rappel: Rendez-vous demain',
        content: 'Bonjour Marie, nous vous rappelons votre rendez-vous prévu demain...',
        status: 'delivered',
        sentBy: 'user-1',
        sentAt: new Date('2024-07-18T10:00:00'),
        readAt: new Date('2024-07-18T10:30:00'),
        metadata: {
          appointmentId: 'apt-1',
          reminderType: '24h',
          templateId: 'template-1'
        },
        createdAt: new Date('2024-07-18T10:00:00')
      },
      {
        id: 'msg-2',
        patientId: 'patient-1',
        cabinetId: 'cabinet-1',
        type: 'sms',
        direction: 'outbound',
        content: 'RDV demain 14h30 chez Dr. Martin. Confirmez par SMS.',
        status: 'delivered',
        sentBy: 'system',
        sentAt: new Date('2024-07-18T09:00:00'),
        metadata: {
          appointmentId: 'apt-1',
          reminderType: '24h'
        },
        createdAt: new Date('2024-07-18T09:00:00')
      },
      {
        id: 'msg-3',
        patientId: 'patient-2',
        cabinetId: 'cabinet-1',
        type: 'email',
        direction: 'inbound',
        subject: 'Question sur mon traitement',
        content: 'Bonjour, j\'ai une question concernant le traitement prescrit...',
        status: 'read',
        sentAt: new Date('2024-07-17T15:30:00'),
        readAt: new Date('2024-07-17T16:00:00'),
        createdAt: new Date('2024-07-17T15:30:00')
      }
    ];

    mockMessages.forEach(message => {
      this.messages.set(message.id, message);
    });
  }

  // Template Management
  async getTemplates(cabinetId?: string): Promise<CommunicationServiceResult<CommunicationTemplate[]>> {
    try {
      let templates = Array.from(this.templates.values());
      
      // Filter by cabinet (include global templates)
      if (cabinetId) {
        templates = templates.filter(t => !t.cabinetId || t.cabinetId === cabinetId);
      }
      
      // Filter active templates
      templates = templates.filter(t => t.isActive);
      
      // Sort by name
      templates.sort((a, b) => a.name.localeCompare(b.name));

      return { success: true, data: templates };
    } catch (error) {
      return { success: false, error: 'Failed to fetch templates' };
    }
  }

  async createTemplate(template: Omit<CommunicationTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<CommunicationServiceResult<CommunicationTemplate>> {
    try {
      const newTemplate: CommunicationTemplate = {
        ...template,
        id: `template-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      this.templates.set(newTemplate.id, newTemplate);
      return { success: true, data: newTemplate };
    } catch (error) {
      return { success: false, error: 'Failed to create template' };
    }
  }

  // Message Management
  async getCommunicationHistory(patientId: string): Promise<CommunicationServiceResult<CommunicationHistory>> {
    try {
      const messages = Array.from(this.messages.values())
        .filter(m => m.patientId === patientId)
        .sort((a, b) => b.sentAt.getTime() - a.sentAt.getTime());

      const unreadCount = messages.filter(m => 
        m.direction === 'inbound' && !m.readAt
      ).length;

      return {
        success: true,
        data: {
          messages,
          total: messages.length,
          unreadCount
        }
      };
    } catch (error) {
      return { success: false, error: 'Failed to fetch communication history' };
    }
  }

  async sendMessage(request: SendMessageRequest): Promise<CommunicationServiceResult<CommunicationMessage>> {
    try {
      const message: CommunicationMessage = {
        id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        patientId: request.patientId,
        cabinetId: 'cabinet-1', // This would be determined from context
        type: request.type,
        direction: 'outbound',
        subject: request.subject,
        content: request.content,
        status: 'pending',
        sentBy: 'current-user', // This would come from user context
        sentAt: request.scheduledFor || new Date(),
        metadata: {
          appointmentId: request.appointmentId,
          templateId: request.templateId
        },
        createdAt: new Date()
      };

      // Simulate sending process
      setTimeout(() => {
        message.status = 'sent';
        setTimeout(() => {
          message.status = 'delivered';
        }, 1000);
      }, 500);

      this.messages.set(message.id, message);
      return { success: true, data: message };
    } catch (error) {
      return { success: false, error: 'Failed to send message' };
    }
  }

  async markMessageAsRead(messageId: string): Promise<CommunicationServiceResult<boolean>> {
    try {
      const message = this.messages.get(messageId);
      if (!message) {
        return { success: false, error: 'Message not found' };
      }

      if (message.direction === 'inbound' && !message.readAt) {
        message.readAt = new Date();
        message.status = 'read';
        this.messages.set(messageId, message);
      }

      return { success: true, data: true };
    } catch (error) {
      return { success: false, error: 'Failed to mark message as read' };
    }
  }

  // Template variable replacement
  private replaceTemplateVariables(content: string, variables: Record<string, string>): string {
    let result = content;
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{${key}}`, 'g');
      result = result.replace(regex, value);
    });
    return result;
  }

  async sendTemplatedMessage(
    patientId: string,
    templateId: string,
    variables: Record<string, string>,
    appointmentId?: string
  ): Promise<CommunicationServiceResult<CommunicationMessage[]>> {
    try {
      const template = this.templates.get(templateId);
      if (!template) {
        return { success: false, error: 'Template not found' };
      }

      const messages: CommunicationMessage[] = [];
      const channels = template.channel === 'both' ? ['email', 'sms'] : [template.channel];

      for (const channel of channels) {
        const content = this.replaceTemplateVariables(template.content, variables);
        const subject = template.subject ? this.replaceTemplateVariables(template.subject, variables) : undefined;

        const result = await this.sendMessage({
          patientId,
          type: channel as 'email' | 'sms',
          subject,
          content,
          templateId,
          appointmentId
        });

        if (result.success && result.data) {
          messages.push(result.data);
        }
      }

      return { success: true, data: messages };
    } catch (error) {
      return { success: false, error: 'Failed to send templated message' };
    }
  }

  // Secure methods with access control
  async getCommunicationHistorySecure(
    userContext: UserContext,
    patientId: string
  ): Promise<CommunicationServiceResult<CommunicationHistory>> {
    try {
      // This would include patient cabinet validation
      // For now, we'll use the standard method
      return await this.getCommunicationHistory(patientId);
    } catch (error) {
      return { success: false, error: 'Access control error' };
    }
  }
}
