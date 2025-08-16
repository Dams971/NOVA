import { NotificationMessage, NotificationAction } from '@/components/manager/AppointmentNotifications';
import { Appointment, AppointmentStatus } from '@/lib/models/appointment';
import { AppointmentService } from './appointment-service';

export interface NotificationServiceResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface ReminderConfig {
  enabled: boolean;
  beforeMinutes: number[];
  channels: ('email' | 'sms' | 'push')[];
}

export interface StatusTransitionRule {
  fromStatus: AppointmentStatus;
  toStatus: AppointmentStatus;
  condition: 'time_based' | 'manual' | 'automatic';
  delayMinutes?: number;
  requiresConfirmation?: boolean;
}

export class NotificationService {
  private static instance: NotificationService;
  private notifications: Map<string, NotificationMessage> = new Map();
  private reminderConfig: ReminderConfig = {
    enabled: true,
    beforeMinutes: [60, 30, 15], // 1 hour, 30 minutes, 15 minutes before
    channels: ['push']
  };
  
  private statusTransitionRules: StatusTransitionRule[] = [
    {
      fromStatus: AppointmentStatus.SCHEDULED,
      toStatus: AppointmentStatus.CONFIRMED,
      condition: 'manual',
      requiresConfirmation: false
    },
    {
      fromStatus: AppointmentStatus.CONFIRMED,
      toStatus: AppointmentStatus.IN_PROGRESS,
      condition: 'time_based',
      delayMinutes: 0 // At appointment time
    },
    {
      fromStatus: AppointmentStatus.IN_PROGRESS,
      toStatus: AppointmentStatus.COMPLETED,
      condition: 'manual',
      requiresConfirmation: true
    },
    {
      fromStatus: AppointmentStatus.SCHEDULED,
      toStatus: AppointmentStatus.NO_SHOW,
      condition: 'time_based',
      delayMinutes: 15 // 15 minutes after appointment time
    }
  ];

  private constructor() {}

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  // Create different types of notifications
  createAppointmentNotification(
    appointment: Appointment,
    type: NotificationMessage['type'],
    title: string,
    message: string,
    priority: NotificationMessage['priority'] = 'medium',
    actions?: NotificationAction[]
  ): NotificationMessage {
    const notification: NotificationMessage = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      category: 'appointment',
      title,
      message,
      timestamp: new Date(),
      appointmentId: appointment.id,
      patientName: `Patient ${appointment.patientId}`, // This would be resolved from patient service
      isRead: false,
      priority,
      autoRemove: type === 'success',
      actions
    };

    this.notifications.set(notification.id, notification);
    return notification;
  }

  createReminderNotification(
    appointment: Appointment,
    minutesBefore: number
  ): NotificationMessage {
    const actions: NotificationAction[] = [
      {
        id: 'confirm',
        label: 'Confirmer',
        type: 'primary',
        onClick: () => this.handleAppointmentConfirmation(appointment.id)
      },
      {
        id: 'reschedule',
        label: 'Reporter',
        type: 'secondary',
        onClick: () => this.handleAppointmentReschedule(appointment.id)
      }
    ];

    return this.createAppointmentNotification(
      appointment,
      'info',
      'Rappel de rendez-vous',
      `Rendez-vous dans ${minutesBefore} minutes`,
      'high',
      actions
    );
  }

  createStatusChangeNotification(
    appointment: Appointment,
    oldStatus: AppointmentStatus,
    newStatus: AppointmentStatus
  ): NotificationMessage {
    const statusLabels = {
      [AppointmentStatus.SCHEDULED]: 'programmé',
      [AppointmentStatus.CONFIRMED]: 'confirmé',
      [AppointmentStatus.IN_PROGRESS]: 'en cours',
      [AppointmentStatus.COMPLETED]: 'terminé',
      [AppointmentStatus.CANCELLED]: 'annulé',
      [AppointmentStatus.NO_SHOW]: 'absent'
    };

    return this.createAppointmentNotification(
      appointment,
      'info',
      'Statut du rendez-vous modifié',
      `Le rendez-vous est passé de "${statusLabels[oldStatus]}" à "${statusLabels[newStatus]}"`,
      'medium'
    );
  }

  createConflictNotification(
    appointment: Appointment,
    conflictReason: string
  ): NotificationMessage {
    const actions: NotificationAction[] = [
      {
        id: 'resolve',
        label: 'Résoudre',
        type: 'primary',
        onClick: () => this.handleConflictResolution(appointment.id)
      },
      {
        id: 'ignore',
        label: 'Ignorer',
        type: 'secondary',
        onClick: () => this.dismissNotification(`conflict-${appointment.id}`)
      }
    ];

    const notification: NotificationMessage = {
      id: `conflict-${appointment.id}`,
      type: 'warning',
      category: 'conflict',
      title: 'Conflit détecté',
      message: conflictReason,
      timestamp: new Date(),
      appointmentId: appointment.id,
      patientName: `Patient ${appointment.patientId}`,
      isRead: false,
      priority: 'urgent',
      autoRemove: false,
      actions
    };

    this.notifications.set(notification.id, notification);
    return notification;
  }

  // Automatic status transitions
  async processStatusTransitions(cabinetId: string): Promise<NotificationServiceResult<number>> {
    try {
      const appointmentService = AppointmentService.getInstance();
      const now = new Date();
      let transitionsProcessed = 0;

      // Get all active appointments for the cabinet
      const appointmentsResult = await appointmentService.getAppointments(cabinetId, {
        status: [AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED, AppointmentStatus.IN_PROGRESS]
      });

      if (!appointmentsResult.success || !appointmentsResult.data) {
        return { success: false, error: 'Failed to fetch appointments' };
      }

      for (const appointment of appointmentsResult.data) {
        const applicableRules = this.statusTransitionRules.filter(
          rule => rule.fromStatus === appointment.status && rule.condition === 'time_based'
        );

        for (const rule of applicableRules) {
          const transitionTime = new Date(appointment.scheduledAt.getTime() + (rule.delayMinutes || 0) * 60 * 1000);
          
          if (now >= transitionTime) {
            // Process the transition
            const updateResult = await appointmentService.updateAppointment(appointment.id, {
              status: rule.toStatus
            });

            if (updateResult.success) {
              // Create status change notification
              this.createStatusChangeNotification(appointment, appointment.status, rule.toStatus);
              transitionsProcessed++;
            }
          }
        }
      }

      return { success: true, data: transitionsProcessed };
    } catch (_error) {
      return { success: false, error: 'Failed to process status transitions' };
    }
  }

  // Reminder processing
  async processReminders(cabinetId: string): Promise<NotificationServiceResult<number>> {
    if (!this.reminderConfig.enabled) {
      return { success: true, data: 0 };
    }

    try {
      const appointmentService = AppointmentService.getInstance();
      const now = new Date();
      let remindersCreated = 0;

      // Get upcoming appointments
      const appointmentsResult = await appointmentService.getAppointments(cabinetId, {
        status: [AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED],
        dateFrom: now,
        dateTo: new Date(now.getTime() + 2 * 60 * 60 * 1000) // Next 2 hours
      });

      if (!appointmentsResult.success || !appointmentsResult.data) {
        return { success: false, error: 'Failed to fetch appointments' };
      }

      for (const appointment of appointmentsResult.data) {
        for (const minutesBefore of this.reminderConfig.beforeMinutes) {
          const reminderTime = new Date(appointment.scheduledAt.getTime() - minutesBefore * 60 * 1000);
          
          // Check if it's time for this reminder and we haven't sent it yet
          if (now >= reminderTime && now < appointment.scheduledAt) {
            const reminderId = `reminder-${appointment.id}-${minutesBefore}`;
            
            if (!this.notifications.has(reminderId)) {
              this.createReminderNotification(appointment, minutesBefore);
              remindersCreated++;
            }
          }
        }
      }

      return { success: true, data: remindersCreated };
    } catch (_error) {
      return { success: false, error: 'Failed to process reminders' };
    }
  }

  // Notification management
  getAllNotifications(): NotificationMessage[] {
    return Array.from(this.notifications.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  getNotificationsByCategory(category: NotificationMessage['category']): NotificationMessage[] {
    return this.getAllNotifications().filter(n => n.category === category);
  }

  markAsRead(notificationId: string): boolean {
    const notification = this.notifications.get(notificationId);
    if (notification) {
      notification.isRead = true;
      return true;
    }
    return false;
  }

  dismissNotification(notificationId: string): boolean {
    return this.notifications.delete(notificationId);
  }

  clearAllNotifications(): void {
    this.notifications.clear();
  }

  // Action handlers
  private async handleAppointmentConfirmation(appointmentId: string): Promise<void> {
    const appointmentService = AppointmentService.getInstance();
    await appointmentService.updateAppointment(appointmentId, {
      status: AppointmentStatus.CONFIRMED
    });
  }

  private async handleAppointmentReschedule(appointmentId: string): Promise<void> {
    // This would typically open a reschedule dialog
    console.log('Opening reschedule dialog for appointment:', appointmentId);
  }

  private async handleConflictResolution(appointmentId: string): Promise<void> {
    // This would typically open a conflict resolution dialog
    console.log('Opening conflict resolution for appointment:', appointmentId);
  }
}
