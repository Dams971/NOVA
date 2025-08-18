/**
 * Appointment type definitions for NOVA RDV platform
 */

export type AppointmentStatus = 
  | 'scheduled'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'no_show'
  | 'rescheduled';

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  patientEmail?: string;
  patientPhone?: string;
  cabinetId: string;
  practitionerId?: string;
  dateTime: string;
  duration: number; // in minutes
  type?: string;
  status: AppointmentStatus;
  notes?: string;
  reminderSent?: boolean;
  createdAt: string;
  updatedAt: string;
  cancelledAt?: string;
  cancelReason?: string;
  metadata?: Record<string, unknown>;
}

export interface AppointmentHistory {
  id: string;
  appointmentId: string;
  action: 'created' | 'updated' | 'cancelled' | 'confirmed' | 'completed' | 'rescheduled';
  performedBy: string;
  performedAt: string;
  changes?: Record<string, unknown>;
  notes?: string;
}

export interface AppointmentReminder {
  id: string;
  appointmentId: string;
  type: 'email' | 'sms' | 'push';
  scheduledFor: string;
  sentAt?: string;
  status: 'pending' | 'sent' | 'failed';
  error?: string;
}

export interface AppointmentFilter {
  cabinetId?: string;
  patientId?: string;
  practitionerId?: string;
  status?: AppointmentStatus[];
  dateFrom?: string;
  dateTo?: string;
  type?: string[];
}

export interface AppointmentStatistics {
  total: number;
  scheduled: number;
  confirmed: number;
  completed: number;
  cancelled: number;
  noShow: number;
  averageDuration: number;
  utilizationRate: number;
}