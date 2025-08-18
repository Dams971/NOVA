import { describe, it, expect, beforeEach } from 'vitest';
import { AppointmentStatus, ServiceType } from '@/lib/models/appointment';
import { AppointmentService } from '@/lib/services/appointment-service';

describe('AppointmentService', () => {
  let appointmentService: AppointmentService;

  beforeEach(() => {
    appointmentService = AppointmentService.getInstance();
  });

  describe('getAppointments', () => {
    it('should return appointments for a cabinet', async () => {
      const result = await appointmentService.getAppointments({
        cabinetId: 'cabinet-1'
      });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
    });

    it('should filter appointments by status', async () => {
      const result = await appointmentService.getAppointments({
        cabinetId: 'cabinet-1',
        status: AppointmentStatus.SCHEDULED
      });

      expect(result.success).toBe(true);
      if (result.data) {
        result.data.forEach(appointment => {
          expect(appointment.status).toBe(AppointmentStatus.SCHEDULED);
        });
      }
    });

    it('should filter appointments by date range', async () => {
      const now = new Date();
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      
      const result = await appointmentService.getAppointments({
        cabinetId: 'cabinet-1',
        dateFrom: now,
        dateTo: tomorrow
      });

      expect(result.success).toBe(true);
      if (result.data) {
        result.data.forEach(appointment => {
          expect(appointment.scheduledAt.getTime()).toBeGreaterThanOrEqual(now.getTime());
          expect(appointment.scheduledAt.getTime()).toBeLessThanOrEqual(tomorrow.getTime());
        });
      }
    });
  });

  describe('createAppointment', () => {
    it('should create a new appointment', async () => {
      const appointmentData = {
        cabinetId: 'cabinet-1',
        patientId: 'patient-1',
        serviceType: ServiceType.CONSULTATION,
        title: 'Test Consultation',
        scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        duration: 30
      };

      const result = await appointmentService.createAppointment(appointmentData);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      if (result.data) {
        expect(result.data.cabinetId).toBe(appointmentData.cabinetId);
        expect(result.data.patientId).toBe(appointmentData.patientId);
        expect(result.data.serviceType).toBe(appointmentData.serviceType);
        expect(result.data.title).toBe(appointmentData.title);
        expect(result.data.duration).toBe(appointmentData.duration);
        expect(result.data.status).toBe(AppointmentStatus.SCHEDULED);
      }
    });

    it('should fail to create appointment with non-existent patient', async () => {
      const appointmentData = {
        cabinetId: 'cabinet-1',
        patientId: 'non-existent-patient',
        serviceType: ServiceType.CONSULTATION,
        title: 'Test Consultation',
        scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        duration: 30
      };

      const result = await appointmentService.createAppointment(appointmentData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Patient not found');
    });
  });

  describe('updateAppointment', () => {
    it('should update an existing appointment', async () => {
      // First create an appointment
      const appointmentData = {
        cabinetId: 'cabinet-1',
        patientId: 'patient-1',
        serviceType: ServiceType.CONSULTATION,
        title: 'Test Consultation',
        scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        duration: 30
      };

      const createResult = await appointmentService.createAppointment(appointmentData);
      expect(createResult.success).toBe(true);
      
      if (createResult.data) {
        const updateResult = await appointmentService.updateAppointment(createResult.data.id, {
          status: AppointmentStatus.CONFIRMED,
          notes: 'Updated notes'
        });

        expect(updateResult.success).toBe(true);
        expect(updateResult.data?.status).toBe(AppointmentStatus.CONFIRMED);
        expect(updateResult.data?.notes).toBe('Updated notes');
      }
    });

    it('should fail to update non-existent appointment', async () => {
      const result = await appointmentService.updateAppointment('non-existent-id', {
        status: AppointmentStatus.CONFIRMED
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Appointment not found');
    });
  });

  describe('deleteAppointment', () => {
    it('should delete an existing appointment', async () => {
      // First create an appointment
      const appointmentData = {
        cabinetId: 'cabinet-1',
        patientId: 'patient-1',
        serviceType: ServiceType.CONSULTATION,
        title: 'Test Consultation',
        scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        duration: 30
      };

      const createResult = await appointmentService.createAppointment(appointmentData);
      expect(createResult.success).toBe(true);
      
      if (createResult.data) {
        const deleteResult = await appointmentService.deleteAppointment(createResult.data.id);
        expect(deleteResult.success).toBe(true);

        // Verify appointment is deleted
        const getResult = await appointmentService.getAppointmentById(createResult.data.id);
        expect(getResult.success).toBe(false);
        expect(getResult.error).toBe('Appointment not found');
      }
    });
  });

  describe('checkTimeSlotAvailability', () => {
    it('should return true for available time slot', async () => {
      const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // Next week
      
      const result = await appointmentService.checkTimeSlotAvailability(
        'cabinet-1',
        futureDate,
        30,
        'practitioner-1'
      );

      expect(result.success).toBe(true);
      expect(result.data).toBe(true);
    });

    it('should return false for conflicting time slot', async () => {
      // First create an appointment
      const appointmentData = {
        cabinetId: 'cabinet-1',
        patientId: 'patient-1',
        practitionerId: 'practitioner-1',
        serviceType: ServiceType.CONSULTATION,
        title: 'Test Consultation',
        scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        duration: 30
      };

      const createResult = await appointmentService.createAppointment(appointmentData);
      expect(createResult.success).toBe(true);

      if (createResult.data) {
        // Try to book the same time slot
        const result = await appointmentService.checkTimeSlotAvailability(
          'cabinet-1',
          createResult.data.scheduledAt,
          30,
          'practitioner-1'
        );

        expect(result.success).toBe(true);
        expect(result.data).toBe(false);
      }
    });
  });

  describe('getCalendarEvents', () => {
    it('should return calendar events for a date range', async () => {
      const startDate = new Date();
      const endDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      const result = await appointmentService.getCalendarEvents('cabinet-1', startDate, endDate);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
      
      if (result.data) {
        result.data.forEach(event => {
          expect(event.id).toBeDefined();
          expect(event.title).toBeDefined();
          expect(event.start).toBeInstanceOf(Date);
          expect(event.end).toBeInstanceOf(Date);
          expect(event.patientName).toBeDefined();
          expect(event.backgroundColor).toBeDefined();
          expect(event.borderColor).toBeDefined();
        });
      }
    });
  });

  describe('rescheduleAppointment', () => {
    it('should reschedule an appointment to a new date', async () => {
      // First create an appointment
      const appointmentData = {
        cabinetId: 'cabinet-1',
        patientId: 'patient-1',
        serviceType: ServiceType.CONSULTATION,
        title: 'Test Consultation',
        scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        duration: 30
      };

      const createResult = await appointmentService.createAppointment(appointmentData);
      expect(createResult.success).toBe(true);
      
      if (createResult.data) {
        const newDateTime = new Date(Date.now() + 48 * 60 * 60 * 1000); // Day after tomorrow
        const rescheduleResult = await appointmentService.rescheduleAppointment(
          createResult.data.id,
          newDateTime
        );

        expect(rescheduleResult.success).toBe(true);
        expect(rescheduleResult.data?.scheduledAt.getTime()).toBe(newDateTime.getTime());
      }
    });
  });
});