/**
 * Cabinet type definitions for NOVA RDV platform
 */

export interface Cabinet {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  website?: string;
  description?: string;
  specialties?: string[];
  workingHours?: WorkingHours;
  timezone: string;
  managerId?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, unknown>;
}

export interface WorkingHours {
  monday?: DaySchedule;
  tuesday?: DaySchedule;
  wednesday?: DaySchedule;
  thursday?: DaySchedule;
  friday?: DaySchedule;
  saturday?: DaySchedule;
  sunday?: DaySchedule;
}

export interface DaySchedule {
  isOpen: boolean;
  openTime?: string; // HH:mm format
  closeTime?: string; // HH:mm format
  breakStart?: string;
  breakEnd?: string;
}

export interface CabinetHealth {
  cabinetId: string;
  status: 'healthy' | 'warning' | 'critical';
  metrics: {
    appointmentRate: number;
    cancellationRate: number;
    noShowRate: number;
    averageWaitTime: number;
    patientSatisfaction: number;
    revenueHealth: number;
  };
  issues?: HealthIssue[];
  lastCheck: string;
}

export interface HealthIssue {
  type: 'high_cancellation' | 'low_utilization' | 'long_wait_times' | 'low_satisfaction';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  suggestedAction?: string;
}

export interface CabinetSettings {
  cabinetId: string;
  appointmentDuration: number; // default duration in minutes
  bufferTime: number; // buffer between appointments
  maxAdvanceBooking: number; // days in advance
  minAdvanceBooking: number; // minimum hours before appointment
  cancellationPolicy: {
    allowCancellation: boolean;
    minHoursBeforeAppointment: number;
    requireReason: boolean;
  };
  reminderSettings: {
    enabled: boolean;
    hoursBeforeAppointment: number[];
    methods: ('email' | 'sms' | 'push')[];
  };
  notificationSettings: {
    newAppointment: boolean;
    cancellation: boolean;
    noShow: boolean;
    dailyDigest: boolean;
  };
}

export interface CabinetMember {
  id: string;
  cabinetId: string;
  userId: string;
  role: 'owner' | 'manager' | 'practitioner' | 'receptionist';
  specialties?: string[];
  isActive: boolean;
  joinedAt: string;
  permissions?: string[];
}

export interface CabinetStatistics {
  cabinetId: string;
  period: {
    start: string;
    end: string;
  };
  appointments: {
    total: number;
    completed: number;
    cancelled: number;
    noShow: number;
  };
  patients: {
    total: number;
    new: number;
    returning: number;
  };
  revenue: {
    total: number;
    average: number;
    growth: number;
  };
  utilization: {
    rate: number;
    peakHours: string[];
    quietHours: string[];
  };
}