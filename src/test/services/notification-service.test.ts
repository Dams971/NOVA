import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AppointmentStatus } from '@/lib/models/appointment';
import { AppointmentService } from '@/lib/services/appointment-service';
import { NotificationService } from '@/lib/services/notification-service';

// Mock the appointment service
vi.mock('@/lib/services/appointment-service');

const mockAppointmentService = {
  getAppointments: vi.fn(),
  updateAppointment: vi.fn(),
  getAppointmentById: vi.fn(),
  checkTimeSlotAvailability: vi.fn(),
  getInstance: vi.fn()
};

vi.mocked(AppointmentService.getInstance).mockReturnValue(mockAppointmentService as any);

describe('NotificationService', () => {
  let notificationService: NotificationService;
  let mockAppointment: any;

  beforeEach(() => {
    vi.clearAllMocks();
    notificationService = NotificationService.getInstance();
    
    mockAppointment = {
      id: 'apt-1',
      cabinetId: 'cabinet-1',
      patientId: 'patient-1',
      practitionerId: 'practitioner-1',
      serviceType: 'consultation',
      title: 'Test Appointment',
      scheduledAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
      duration: 30,
      status: AppointmentStatus.SCHEDULED,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  });

  describe('createAppointmentNotification', () => {
    it('should create appointment notification with correct properties', () => {
      const notification = notificationService.createAppointmentNotification(
        mockAppointment,
        'success',
        'Test Title',
        'Test Message',
        'high'
      );

      expect(notification).toMatchObject({
        type: 'success',
        category: 'appointment',
        title: 'Test Title',
        message: 'Test Message',
        priority: 'high',
        appointmentId: 'apt-1',
        isRead: false,
        autoRemove: true
      });
      expect(notification.id).toBeDefined();
      expect(notification.timestamp).toBeInstanceOf(Date);
    });

    it('should set autoRemove to true for success notifications', () => {
      const notification = notificationService.createAppointmentNotification(
        mockAppointment,
        'success',
        'Success',
        'Success message'
      );

      expect(notification.autoRemove).toBe(true);
    });

    it('should set autoRemove to false for error notifications', () => {
      const notification = notificationService.createAppointmentNotification(
        mockAppointment,
        'error',
        'Error',
        'Error message'
      );

      expect(notification.autoRemove).toBe(false);
    });
  });

  describe('createReminderNotification', () => {
    it('should create reminder notification with actions', () => {
      const notification = notificationService.createReminderNotification(mockAppointment, 30);

      expect(notification).toMatchObject({
        type: 'info',
        category: 'reminder',
        title: 'Rappel de rendez-vous',
        message: 'Rendez-vous dans 30 minutes',
        priority: 'high'
      });
      expect(notification.actions).toHaveLength(2);
      expect(notification.actions![0].label).toBe('Confirmer');
      expect(notification.actions![1].label).toBe('Reporter');
    });
  });

  describe('createStatusChangeNotification', () => {
    it('should create status change notification', () => {
      const notification = notificationService.createStatusChangeNotification(
        mockAppointment,
        AppointmentStatus.SCHEDULED,
        AppointmentStatus.CONFIRMED
      );

      expect(notification).toMatchObject({
        type: 'info',
        category: 'appointment',
        title: 'Statut du rendez-vous modifié',
        priority: 'medium'
      });
      expect(notification.message).toContain('programmé');
      expect(notification.message).toContain('confirmé');
    });
  });

  describe('createConflictNotification', () => {
    it('should create conflict notification with actions', () => {
      const notification = notificationService.createConflictNotification(
        mockAppointment,
        'Time slot conflict detected'
      );

      expect(notification).toMatchObject({
        type: 'warning',
        category: 'conflict',
        title: 'Conflit détecté',
        message: 'Time slot conflict detected',
        priority: 'urgent',
        autoRemove: false
      });
      expect(notification.actions).toHaveLength(2);
      expect(notification.actions![0].label).toBe('Résoudre');
      expect(notification.actions![1].label).toBe('Ignorer');
    });
  });

  describe('processStatusTransitions', () => {
    beforeEach(() => {
      mockAppointmentService.getAppointments.mockResolvedValue({
        success: true,
        data: [
          {
            ...mockAppointment,
            status: AppointmentStatus.SCHEDULED,
            scheduledAt: new Date(Date.now() - 30 * 60 * 1000) // 30 minutes ago
          }
        ]
      });
      mockAppointmentService.updateAppointment.mockResolvedValue({
        success: true,
        data: { ...mockAppointment, status: AppointmentStatus.NO_SHOW }
      });
    });

    it('should process automatic status transitions', async () => {
      const result = await notificationService.processStatusTransitions('cabinet-1');

      expect(result.success).toBe(true);
      expect(result.data).toBeGreaterThan(0);
      expect(mockAppointmentService.updateAppointment).toHaveBeenCalled();
    });

    it('should handle service errors gracefully', async () => {
      mockAppointmentService.getAppointments.mockResolvedValue({
        success: false,
        error: 'Service error'
      });

      const result = await notificationService.processStatusTransitions('cabinet-1');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to fetch appointments');
    });
  });

  describe('processReminders', () => {
    beforeEach(() => {
      mockAppointmentService.getAppointments.mockResolvedValue({
        success: true,
        data: [
          {
            ...mockAppointment,
            scheduledAt: new Date(Date.now() + 30 * 60 * 1000) // 30 minutes from now
          }
        ]
      });
    });

    it('should create reminders for upcoming appointments', async () => {
      const result = await notificationService.processReminders('cabinet-1');

      expect(result.success).toBe(true);
      expect(result.data).toBeGreaterThan(0);
    });

    it('should not create duplicate reminders', async () => {
      // Process reminders twice
      await notificationService.processReminders('cabinet-1');
      const result = await notificationService.processReminders('cabinet-1');

      // Second call should not create new reminders
      expect(result.data).toBe(0);
    });

    it('should skip processing when reminders are disabled', async () => {
      // Access private property for testing
      (notificationService as any).reminderConfig.enabled = false;

      const result = await notificationService.processReminders('cabinet-1');

      expect(result.success).toBe(true);
      expect(result.data).toBe(0);
    });
  });

  describe('notification management', () => {
    it('should retrieve all notifications sorted by timestamp', () => {
      // Create multiple notifications
      notificationService.createAppointmentNotification(mockAppointment, 'info', 'First', 'First message');
      
      // Wait a bit to ensure different timestamps
      setTimeout(() => {
        notificationService.createAppointmentNotification(mockAppointment, 'success', 'Second', 'Second message');
      }, 10);

      const notifications = notificationService.getAllNotifications();
      expect(notifications.length).toBeGreaterThanOrEqual(2);
      
      // Should be sorted by timestamp (newest first)
      for (let i = 1; i < notifications.length; i++) {
        expect(notifications[i-1].timestamp.getTime()).toBeGreaterThanOrEqual(
          notifications[i].timestamp.getTime()
        );
      }
    });

    it('should filter notifications by category', () => {
      notificationService.createAppointmentNotification(mockAppointment, 'info', 'Appointment', 'Message');
      notificationService.createReminderNotification(mockAppointment, 30);

      const appointmentNotifications = notificationService.getNotificationsByCategory('appointment');
      const reminderNotifications = notificationService.getNotificationsByCategory('reminder');

      expect(appointmentNotifications.length).toBeGreaterThan(0);
      expect(reminderNotifications.length).toBeGreaterThan(0);
      
      appointmentNotifications.forEach(n => expect(n.category).toBe('appointment'));
      reminderNotifications.forEach(n => expect(n.category).toBe('reminder'));
    });

    it('should mark notifications as read', () => {
      const notification = notificationService.createAppointmentNotification(
        mockAppointment, 'info', 'Test', 'Test message'
      );

      expect(notification.isRead).toBe(false);

      const result = notificationService.markAsRead(notification.id);
      expect(result).toBe(true);

      const updatedNotifications = notificationService.getAllNotifications();
      const updatedNotification = updatedNotifications.find(n => n.id === notification.id);
      expect(updatedNotification?.isRead).toBe(true);
    });

    it('should dismiss notifications', () => {
      const notification = notificationService.createAppointmentNotification(
        mockAppointment, 'info', 'Test', 'Test message'
      );

      const result = notificationService.dismissNotification(notification.id);
      expect(result).toBe(true);

      const notifications = notificationService.getAllNotifications();
      expect(notifications.find(n => n.id === notification.id)).toBeUndefined();
    });

    it('should clear all notifications', () => {
      notificationService.createAppointmentNotification(mockAppointment, 'info', 'Test1', 'Message1');
      notificationService.createAppointmentNotification(mockAppointment, 'info', 'Test2', 'Message2');

      expect(notificationService.getAllNotifications().length).toBeGreaterThan(0);

      notificationService.clearAllNotifications();
      expect(notificationService.getAllNotifications().length).toBe(0);
    });
  });
});
