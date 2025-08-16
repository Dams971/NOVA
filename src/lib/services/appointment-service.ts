import {
  Appointment,
  CreateAppointmentRequest,
  UpdateAppointmentRequest,
  AppointmentFilters,
  AppointmentStatus,
  createAppointment
} from '@/lib/models/appointment';
import { Patient } from '@/lib/models/patient';
import { CabinetAccessControl, UserContext } from './cabinet-access-control';

export interface AppointmentServiceResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  status: AppointmentStatus;
  patientName: string;
  serviceType: string;
  practitionerId?: string;
  backgroundColor: string;
  borderColor: string;
}

export interface TimeSlot {
  start: Date;
  end: Date;
  isAvailable: boolean;
  appointmentId?: string;
}

export class AppointmentService {
  private static instance: AppointmentService;
  private appointments: Map<string, Appointment> = new Map();
  private patients: Map<string, Patient> = new Map();
  private accessControl: CabinetAccessControl;

  private constructor() {
    this.accessControl = CabinetAccessControl.getInstance();
    this.initializeMockData();
  }

  public static getInstance(): AppointmentService {
    if (!AppointmentService.instance) {
      AppointmentService.instance = new AppointmentService();
    }
    return AppointmentService.instance;
  }

  private initializeMockData(): void {
    // Mock patients data
    const mockPatients: Patient[] = [
      {
        id: 'patient-1',
        cabinetId: 'cabinet-1',
        firstName: 'Marie',
        lastName: 'Dubois',
        email: 'marie.dubois@email.com',
        phone: '+33123456789',
        dateOfBirth: new Date('1985-03-15'),
        medicalHistory: [],
        preferences: {
          preferredLanguage: 'fr',
          communicationMethod: 'email',
          reminderEnabled: true,
          reminderHours: [24, 2]
        },
        isActive: true,
        totalVisits: 5,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'patient-2',
        cabinetId: 'cabinet-1',
        firstName: 'Jean',
        lastName: 'Martin',
        email: 'jean.martin@email.com',
        phone: '+33123456790',
        dateOfBirth: new Date('1978-07-22'),
        medicalHistory: [],
        preferences: {
          preferredLanguage: 'fr',
          communicationMethod: 'sms',
          reminderEnabled: true,
          reminderHours: [24]
        },
        isActive: true,
        totalVisits: 12,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    mockPatients.forEach(patient => {
      this.patients.set(patient.id, patient);
    });

    // Mock appointments data
    const now = new Date();
    const mockAppointments: Appointment[] = [
      {
        id: 'apt-1',
        cabinetId: 'cabinet-1',
        patientId: 'patient-1',
        practitionerId: 'practitioner-1',
        serviceType: 'consultation',
        title: 'Consultation - Marie Dubois',
        scheduledAt: new Date(now.getTime() + 24 * 60 * 60 * 1000), // Tomorrow
        duration: 30,
        status: AppointmentStatus.SCHEDULED,
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'apt-2',
        cabinetId: 'cabinet-1',
        patientId: 'patient-2',
        practitionerId: 'practitioner-1',
        serviceType: 'cleaning',
        title: 'Nettoyage - Jean Martin',
        scheduledAt: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000), // Day after tomorrow
        duration: 45,
        status: AppointmentStatus.CONFIRMED,
        createdAt: now,
        updatedAt: now
      }
    ];

    mockAppointments.forEach(appointment => {
      this.appointments.set(appointment.id, appointment);
    });
  }

  async getAppointments(filters: AppointmentFilters): Promise<AppointmentServiceResult<Appointment[]>> {
    try {
      let appointments = Array.from(this.appointments.values());

      // Apply filters
      if (filters.cabinetId) {
        appointments = appointments.filter(apt => apt.cabinetId === filters.cabinetId);
      }
      if (filters.patientId) {
        appointments = appointments.filter(apt => apt.patientId === filters.patientId);
      }
      if (filters.practitionerId) {
        appointments = appointments.filter(apt => apt.practitionerId === filters.practitionerId);
      }
      if (filters.status) {
        appointments = appointments.filter(apt => apt.status === filters.status);
      }
      if (filters.serviceType) {
        appointments = appointments.filter(apt => apt.serviceType === filters.serviceType);
      }
      if (filters.dateFrom) {
        appointments = appointments.filter(apt => apt.scheduledAt >= filters.dateFrom!);
      }
      if (filters.dateTo) {
        appointments = appointments.filter(apt => apt.scheduledAt <= filters.dateTo!);
      }

      // Sort by scheduled date
      appointments.sort((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime());

      // Apply pagination
      if (filters.offset) {
        appointments = appointments.slice(filters.offset);
      }
      if (filters.limit) {
        appointments = appointments.slice(0, filters.limit);
      }

      return { success: true, data: appointments };
    } catch (_error) {
      return { success: false, error: 'Failed to fetch appointments' };
    }
  }

  // Secure version with user context validation
  async getAppointmentsSecure(
    userContext: UserContext,
    filters: AppointmentFilters
  ): Promise<AppointmentServiceResult<Appointment[]>> {
    try {
      // Validate read permission
      const cabinetId = filters.cabinetId || (userContext.assignedCabinets.length === 1 ? userContext.assignedCabinets[0] : '');
      if (cabinetId) {
        const validation = this.accessControl.validateAppointmentOperation(userContext, cabinetId, 'read');
        if (!validation.allowed) {
          this.accessControl.logAccess(userContext, 'appointments', 'read', cabinetId, false);
          return { success: false, error: validation.reason || 'Access denied' };
        }
      }

      // Sanitize filters to ensure cabinet isolation
      const sanitizedFilters = this.accessControl.sanitizeAppointmentFilters(userContext, filters);

      // Log access
      this.accessControl.logAccess(userContext, 'appointments', 'read', sanitizedFilters.cabinetId);

      // Get appointments with sanitized filters
      const result = await this.getAppointments(sanitizedFilters);

      if (result.success && result.data) {
        // Additional filtering for non-admin users
        const filteredAppointments = this.accessControl.filterAppointmentsByCabinet(userContext, result.data);
        return { success: true, data: filteredAppointments };
      }

      return result;
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Access control error' };
    }
  }

  async getAppointmentById(id: string): Promise<AppointmentServiceResult<Appointment>> {
    try {
      const appointment = this.appointments.get(id);
      if (!appointment) {
        return { success: false, error: 'Appointment not found' };
      }
      return { success: true, data: appointment };
    } catch (_error) {
      return { success: false, error: 'Failed to fetch appointment' };
    }
  }

  async createAppointment(data: CreateAppointmentRequest): Promise<AppointmentServiceResult<Appointment>> {
    try {
      // Validate patient exists
      const patient = this.patients.get(data.patientId);
      if (!patient) {
        return { success: false, error: 'Patient not found' };
      }

      // Check for conflicts only if practitioner is specified
      if (data.practitionerId) {
        const conflictCheck = await this.checkTimeSlotAvailability(
          data.cabinetId,
          data.scheduledAt,
          data.duration || 30,
          data.practitionerId
        );

        if (!conflictCheck.success || !conflictCheck.data) {
          return { success: false, error: 'Time slot not available' };
        }
      }

      const appointment = createAppointment(data);
      this.appointments.set(appointment.id, appointment);

      return { success: true, data: appointment };
    } catch (_error) {
      return { success: false, error: 'Failed to create appointment' };
    }
  }

  // Secure version with user context validation
  async createAppointmentSecure(
    userContext: UserContext,
    data: CreateAppointmentRequest
  ): Promise<AppointmentServiceResult<Appointment>> {
    try {
      // Validate create permission for the cabinet
      const validation = this.accessControl.validateAppointmentOperation(userContext, data.cabinetId, 'create');
      if (!validation.allowed) {
        this.accessControl.logAccess(userContext, 'appointments', 'create', data.cabinetId, false);
        return { success: false, error: validation.reason || 'Access denied' };
      }

      // Validate patient access (ensure patient belongs to accessible cabinet)
      const patient = this.patients.get(data.patientId);
      if (!patient) {
        return { success: false, error: 'Patient not found' };
      }

      const patientAccess = this.accessControl.validatePatientAccess(userContext, patient.cabinetId);
      if (!patientAccess.allowed) {
        this.accessControl.logAccess(userContext, 'patients', 'access', patient.cabinetId, false);
        return { success: false, error: 'Access denied to patient data' };
      }

      // Ensure appointment cabinet matches patient cabinet
      if (data.cabinetId !== patient.cabinetId) {
        return { success: false, error: 'Appointment cabinet must match patient cabinet' };
      }

      // Log access
      this.accessControl.logAccess(userContext, 'appointments', 'create', data.cabinetId);

      // Create appointment using the standard method
      return await this.createAppointment(data);
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Access control error' };
    }
  }

  async updateAppointment(id: string, data: UpdateAppointmentRequest): Promise<AppointmentServiceResult<Appointment>> {
    try {
      const appointment = this.appointments.get(id);
      if (!appointment) {
        return { success: false, error: 'Appointment not found' };
      }

      // If updating time, check availability
      if (data.scheduledAt || data.duration) {
        const newScheduledAt = data.scheduledAt || appointment.scheduledAt;
        const newDuration = data.duration || appointment.duration;

        const conflictCheck = await this.checkTimeSlotAvailability(
          appointment.cabinetId,
          newScheduledAt,
          newDuration,
          data.practitionerId || appointment.practitionerId,
          id // Exclude current appointment from conflict check
        );

        if (!conflictCheck.success || !conflictCheck.data) {
          return { success: false, error: 'Time slot not available' };
        }
      }

      const updatedAppointment: Appointment = {
        ...appointment,
        ...data,
        updatedAt: new Date()
      };

      this.appointments.set(id, updatedAppointment);

      return { success: true, data: updatedAppointment };
    } catch (_error) {
      return { success: false, error: 'Failed to update appointment' };
    }
  }

  // Secure version with user context validation
  async updateAppointmentSecure(
    userContext: UserContext,
    id: string,
    data: UpdateAppointmentRequest
  ): Promise<AppointmentServiceResult<Appointment>> {
    try {
      // Get the appointment first to check cabinet access
      const appointment = this.appointments.get(id);
      if (!appointment) {
        return { success: false, error: 'Appointment not found' };
      }

      // Validate update permission for the appointment's cabinet
      const validation = this.accessControl.validateAppointmentOperation(userContext, appointment.cabinetId, 'update');
      if (!validation.allowed) {
        this.accessControl.logAccess(userContext, 'appointments', 'update', appointment.cabinetId, false);
        return { success: false, error: validation.reason || 'Access denied' };
      }

      // If updating patient, validate access to new patient
      if (data.patientId && data.patientId !== appointment.patientId) {
        const patient = this.patients.get(data.patientId);
        if (!patient) {
          return { success: false, error: 'Patient not found' };
        }

        const patientAccess = this.accessControl.validatePatientAccess(userContext, patient.cabinetId);
        if (!patientAccess.allowed) {
          this.accessControl.logAccess(userContext, 'patients', 'access', patient.cabinetId, false);
          return { success: false, error: 'Access denied to patient data' };
        }

        // Ensure new patient belongs to same cabinet
        if (patient.cabinetId !== appointment.cabinetId) {
          return { success: false, error: 'Cannot move appointment to different cabinet' };
        }
      }

      // Log access
      this.accessControl.logAccess(userContext, 'appointments', 'update', appointment.cabinetId);

      // Update appointment using the standard method
      return await this.updateAppointment(id, data);
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Access control error' };
    }
  }

  async deleteAppointment(id: string): Promise<AppointmentServiceResult<boolean>> {
    try {
      const appointment = this.appointments.get(id);
      if (!appointment) {
        return { success: false, error: 'Appointment not found' };
      }

      this.appointments.delete(id);
      return { success: true, data: true };
    } catch (_error) {
      return { success: false, error: 'Failed to delete appointment' };
    }
  }

  // Secure version with user context validation
  async deleteAppointmentSecure(
    userContext: UserContext,
    id: string
  ): Promise<AppointmentServiceResult<boolean>> {
    try {
      // Get the appointment first to check cabinet access
      const appointment = this.appointments.get(id);
      if (!appointment) {
        return { success: false, error: 'Appointment not found' };
      }

      // Validate delete permission for the appointment's cabinet
      const validation = this.accessControl.validateAppointmentOperation(userContext, appointment.cabinetId, 'delete');
      if (!validation.allowed) {
        this.accessControl.logAccess(userContext, 'appointments', 'delete', appointment.cabinetId, false);
        return { success: false, error: validation.reason || 'Access denied' };
      }

      // Log access
      this.accessControl.logAccess(userContext, 'appointments', 'delete', appointment.cabinetId);

      // Delete appointment using the standard method
      return await this.deleteAppointment(id);
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Access control error' };
    }
  }

  async getCalendarEvents(cabinetId: string, startDate: Date, endDate: Date): Promise<AppointmentServiceResult<CalendarEvent[]>> {
    try {
      const appointments = await this.getAppointments({
        cabinetId,
        dateFrom: startDate,
        dateTo: endDate
      });

      if (!appointments.success || !appointments.data) {
        return { success: false, error: 'Failed to fetch appointments' };
      }

      const events: CalendarEvent[] = appointments.data.map(appointment => {
        const patient = this.patients.get(appointment.patientId);
        const patientName = patient ? `${patient.firstName} ${patient.lastName}` : 'Patient inconnu';

        return {
          id: appointment.id,
          title: `${appointment.title}`,
          start: appointment.scheduledAt,
          end: new Date(appointment.scheduledAt.getTime() + appointment.duration * 60 * 1000),
          status: appointment.status,
          patientName,
          serviceType: appointment.serviceType,
          practitionerId: appointment.practitionerId,
          backgroundColor: this.getStatusColor(appointment.status),
          borderColor: this.getStatusColor(appointment.status, true)
        };
      });

      return { success: true, data: events };
    } catch (_error) {
      return { success: false, error: 'Failed to fetch calendar events' };
    }
  }

  // Secure version with user context validation
  async getCalendarEventsSecure(
    userContext: UserContext,
    cabinetId: string,
    startDate: Date,
    endDate: Date
  ): Promise<AppointmentServiceResult<CalendarEvent[]>> {
    try {
      // Validate read permission for the cabinet
      const validation = this.accessControl.validateAppointmentOperation(userContext, cabinetId, 'read');
      if (!validation.allowed) {
        this.accessControl.logAccess(userContext, 'appointments', 'calendar_read', cabinetId, false);
        return { success: false, error: validation.reason || 'Access denied' };
      }

      // Log access
      this.accessControl.logAccess(userContext, 'appointments', 'calendar_read', cabinetId);

      // Get calendar events using the standard method
      return await this.getCalendarEvents(cabinetId, startDate, endDate);
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Access control error' };
    }
  }

  async checkTimeSlotAvailability(
    cabinetId: string, 
    startTime: Date, 
    duration: number, 
    practitionerId?: string,
    excludeAppointmentId?: string
  ): Promise<AppointmentServiceResult<boolean>> {
    try {
      const endTime = new Date(startTime.getTime() + duration * 60 * 1000);
      
      const appointments = await this.getAppointments({
        cabinetId,
        dateFrom: new Date(startTime.getTime() - 24 * 60 * 60 * 1000), // Check day before
        dateTo: new Date(startTime.getTime() + 24 * 60 * 60 * 1000)    // Check day after
      });

      if (!appointments.success || !appointments.data) {
        return { success: false, error: 'Failed to check availability' };
      }

      const conflicts = appointments.data.filter(appointment => {
        // Exclude the appointment being updated
        if (excludeAppointmentId && appointment.id === excludeAppointmentId) {
          return false;
        }

        // Check practitioner conflict if specified
        if (practitionerId && appointment.practitionerId === practitionerId) {
          const appointmentEnd = new Date(appointment.scheduledAt.getTime() + appointment.duration * 60 * 1000);
          
          // Check for time overlap
          return (startTime < appointmentEnd && endTime > appointment.scheduledAt);
        }

        return false;
      });

      return { success: true, data: conflicts.length === 0 };
    } catch (_error) {
      return { success: false, error: 'Failed to check availability' };
    }
  }

  async rescheduleAppointment(id: string, newDateTime: Date): Promise<AppointmentServiceResult<Appointment>> {
    try {
      const appointment = this.appointments.get(id);
      if (!appointment) {
        return { success: false, error: 'Appointment not found' };
      }

      return await this.updateAppointment(id, { scheduledAt: newDateTime });
    } catch (_error) {
      return { success: false, error: 'Failed to reschedule appointment' };
    }
  }

  private getStatusColor(status: AppointmentStatus, border: boolean = false): string {
    const colors = {
      [AppointmentStatus.SCHEDULED]: border ? '#3B82F6' : '#DBEAFE',
      [AppointmentStatus.CONFIRMED]: border ? '#10B981' : '#D1FAE5',
      [AppointmentStatus.IN_PROGRESS]: border ? 'warning-600' : '#FEF3C7',
      [AppointmentStatus.COMPLETED]: border ? '#6B7280' : 'neutral-100',
      [AppointmentStatus.CANCELLED]: border ? '#EF4444' : '#FEE2E2',
      [AppointmentStatus.NO_SHOW]: border ? '#DC2626' : '#FECACA'
    };
    return colors[status];
  }
}