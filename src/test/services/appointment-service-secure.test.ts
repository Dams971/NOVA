import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AppointmentService } from '@/lib/services/appointment-service';
import { CabinetAccessControl, UserContext } from '@/lib/services/cabinet-access-control';
import { AppointmentStatus, ServiceType } from '@/lib/models/appointment';

// Mock the access control service
vi.mock('@/lib/services/cabinet-access-control');

const mockAccessControl = {
  validateAppointmentOperation: vi.fn(),
  sanitizeAppointmentFilters: vi.fn(),
  filterAppointmentsByCabinet: vi.fn(),
  validatePatientAccess: vi.fn(),
  logAccess: vi.fn(),
  getInstance: vi.fn()
};

vi.mocked(CabinetAccessControl.getInstance).mockReturnValue(mockAccessControl as any);

describe('AppointmentService - Secure Methods', () => {
  let appointmentService: AppointmentService;
  let adminUser: UserContext;
  let managerUser: UserContext;
  let unauthorizedUser: UserContext;

  beforeEach(() => {
    vi.clearAllMocks();
    appointmentService = AppointmentService.getInstance();

    adminUser = {
      userId: 'admin-1',
      role: 'admin',
      assignedCabinets: ['cabinet-1', 'cabinet-2'],
      permissions: ['*']
    };

    managerUser = {
      userId: 'manager-1',
      role: 'manager',
      assignedCabinets: ['cabinet-1'],
      permissions: []
    };

    unauthorizedUser = {
      userId: 'user-1',
      role: 'assistant',
      assignedCabinets: ['cabinet-2'],
      permissions: []
    };
  });

  describe('getAppointmentsSecure', () => {
    it('should allow authorized user to fetch appointments', async () => {
      mockAccessControl.validateAppointmentOperation.mockReturnValue({ allowed: true });
      mockAccessControl.sanitizeAppointmentFilters.mockReturnValue({ cabinetId: 'cabinet-1' });
      mockAccessControl.filterAppointmentsByCabinet.mockReturnValue([]);

      const result = await appointmentService.getAppointmentsSecure(managerUser, { cabinetId: 'cabinet-1' });

      expect(result.success).toBe(true);
      expect(mockAccessControl.validateAppointmentOperation).toHaveBeenCalledWith(
        managerUser, 'cabinet-1', 'read'
      );
      expect(mockAccessControl.logAccess).toHaveBeenCalledWith(
        managerUser, 'appointments', 'read', 'cabinet-1'
      );
    });

    it('should deny unauthorized user access', async () => {
      mockAccessControl.validateAppointmentOperation.mockReturnValue({ 
        allowed: false, 
        reason: 'Access denied' 
      });

      const result = await appointmentService.getAppointmentsSecure(
        unauthorizedUser, 
        { cabinetId: 'cabinet-1' }
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Access denied');
      expect(mockAccessControl.logAccess).toHaveBeenCalledWith(
        unauthorizedUser, 'appointments', 'read', 'cabinet-1', false
      );
    });

    it('should sanitize filters for non-admin users', async () => {
      mockAccessControl.validateAppointmentOperation.mockReturnValue({ allowed: true });
      mockAccessControl.sanitizeAppointmentFilters.mockReturnValue({ 
        cabinetId: 'cabinet-1',
        patientId: 'patient-1' 
      });
      mockAccessControl.filterAppointmentsByCabinet.mockReturnValue([]);

      await appointmentService.getAppointmentsSecure(managerUser, { patientId: 'patient-1' });

      expect(mockAccessControl.sanitizeAppointmentFilters).toHaveBeenCalledWith(
        managerUser, 
        { patientId: 'patient-1' }
      );
    });
  });

  describe('createAppointmentSecure', () => {
    const mockCreateData = {
      cabinetId: 'cabinet-1',
      patientId: 'patient-1',
      serviceType: ServiceType.CONSULTATION,
      title: 'Test Appointment',
      scheduledAt: new Date(),
      duration: 30
    };

    beforeEach(() => {
      // Mock patient data
      (appointmentService as any).patients.set('patient-1', {
        id: 'patient-1',
        cabinetId: 'cabinet-1',
        firstName: 'John',
        lastName: 'Doe'
      });
    });

    it('should allow authorized user to create appointment', async () => {
      mockAccessControl.validateAppointmentOperation.mockReturnValue({ allowed: true });
      mockAccessControl.validatePatientAccess.mockReturnValue({ allowed: true });

      const result = await appointmentService.createAppointmentSecure(managerUser, mockCreateData);

      expect(result.success).toBe(true);
      expect(mockAccessControl.validateAppointmentOperation).toHaveBeenCalledWith(
        managerUser, 'cabinet-1', 'create'
      );
      expect(mockAccessControl.logAccess).toHaveBeenCalledWith(
        managerUser, 'appointments', 'create', 'cabinet-1'
      );
    });

    it('should deny unauthorized cabinet access', async () => {
      mockAccessControl.validateAppointmentOperation.mockReturnValue({ 
        allowed: false, 
        reason: 'Cabinet access denied' 
      });

      const result = await appointmentService.createAppointmentSecure(unauthorizedUser, mockCreateData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Cabinet access denied');
    });

    it('should validate patient access', async () => {
      mockAccessControl.validateAppointmentOperation.mockReturnValue({ allowed: true });
      mockAccessControl.validatePatientAccess.mockReturnValue({ 
        allowed: false, 
        reason: 'Patient access denied' 
      });

      const result = await appointmentService.createAppointmentSecure(managerUser, mockCreateData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Access denied to patient data');
    });

    it('should enforce cabinet-patient consistency', async () => {
      mockAccessControl.validateAppointmentOperation.mockReturnValue({ allowed: true });
      mockAccessControl.validatePatientAccess.mockReturnValue({ allowed: true });

      // Patient belongs to different cabinet
      (appointmentService as any).patients.set('patient-1', {
        id: 'patient-1',
        cabinetId: 'cabinet-2',
        firstName: 'John',
        lastName: 'Doe'
      });

      const result = await appointmentService.createAppointmentSecure(managerUser, mockCreateData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Appointment cabinet must match patient cabinet');
    });
  });

  describe('updateAppointmentSecure', () => {
    const mockUpdateData = {
      title: 'Updated Appointment',
      status: AppointmentStatus.CONFIRMED
    };

    beforeEach(() => {
      // Mock existing appointment
      (appointmentService as any).appointments.set('apt-1', {
        id: 'apt-1',
        cabinetId: 'cabinet-1',
        patientId: 'patient-1',
        title: 'Original Appointment',
        status: AppointmentStatus.SCHEDULED,
        scheduledAt: new Date(),
        duration: 30,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    });

    it('should allow authorized user to update appointment', async () => {
      mockAccessControl.validateAppointmentOperation.mockReturnValue({ allowed: true });

      const result = await appointmentService.updateAppointmentSecure(
        managerUser, 
        'apt-1', 
        mockUpdateData
      );

      expect(result.success).toBe(true);
      expect(mockAccessControl.validateAppointmentOperation).toHaveBeenCalledWith(
        managerUser, 'cabinet-1', 'update'
      );
    });

    it('should deny update for non-existent appointment', async () => {
      const result = await appointmentService.updateAppointmentSecure(
        managerUser, 
        'non-existent', 
        mockUpdateData
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Appointment not found');
    });

    it('should validate patient access when changing patient', async () => {
      mockAccessControl.validateAppointmentOperation.mockReturnValue({ allowed: true });
      mockAccessControl.validatePatientAccess.mockReturnValue({ allowed: true });

      // Mock new patient
      (appointmentService as any).patients.set('patient-2', {
        id: 'patient-2',
        cabinetId: 'cabinet-1',
        firstName: 'Jane',
        lastName: 'Doe'
      });

      const result = await appointmentService.updateAppointmentSecure(
        managerUser, 
        'apt-1', 
        { ...mockUpdateData, patientId: 'patient-2' }
      );

      expect(result.success).toBe(true);
      expect(mockAccessControl.validatePatientAccess).toHaveBeenCalledWith(
        managerUser, 'cabinet-1'
      );
    });
  });

  describe('deleteAppointmentSecure', () => {
    beforeEach(() => {
      // Mock existing appointment
      (appointmentService as any).appointments.set('apt-1', {
        id: 'apt-1',
        cabinetId: 'cabinet-1',
        patientId: 'patient-1',
        title: 'Test Appointment',
        scheduledAt: new Date(),
        duration: 30,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    });

    it('should allow authorized user to delete appointment', async () => {
      mockAccessControl.validateAppointmentOperation.mockReturnValue({ allowed: true });

      const result = await appointmentService.deleteAppointmentSecure(managerUser, 'apt-1');

      expect(result.success).toBe(true);
      expect(mockAccessControl.validateAppointmentOperation).toHaveBeenCalledWith(
        managerUser, 'cabinet-1', 'delete'
      );
      expect(mockAccessControl.logAccess).toHaveBeenCalledWith(
        managerUser, 'appointments', 'delete', 'cabinet-1'
      );
    });

    it('should deny unauthorized delete operation', async () => {
      mockAccessControl.validateAppointmentOperation.mockReturnValue({ 
        allowed: false, 
        reason: 'Delete permission denied' 
      });

      const result = await appointmentService.deleteAppointmentSecure(unauthorizedUser, 'apt-1');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Delete permission denied');
    });
  });

  describe('getCalendarEventsSecure', () => {
    it('should allow authorized user to fetch calendar events', async () => {
      mockAccessControl.validateAppointmentOperation.mockReturnValue({ allowed: true });

      const startDate = new Date();
      const endDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      const result = await appointmentService.getCalendarEventsSecure(
        managerUser, 
        'cabinet-1', 
        startDate, 
        endDate
      );

      expect(result.success).toBe(true);
      expect(mockAccessControl.validateAppointmentOperation).toHaveBeenCalledWith(
        managerUser, 'cabinet-1', 'read'
      );
      expect(mockAccessControl.logAccess).toHaveBeenCalledWith(
        managerUser, 'appointments', 'calendar_read', 'cabinet-1'
      );
    });

    it('should deny unauthorized calendar access', async () => {
      mockAccessControl.validateAppointmentOperation.mockReturnValue({ 
        allowed: false, 
        reason: 'Calendar access denied' 
      });

      const result = await appointmentService.getCalendarEventsSecure(
        unauthorizedUser, 
        'cabinet-1', 
        new Date(), 
        new Date()
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Calendar access denied');
    });
  });
});
