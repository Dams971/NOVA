import { v4 as uuidv4 } from 'uuid';

export enum AppointmentStatus {
  SCHEDULED = 'scheduled',
  CONFIRMED = 'confirmed',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  NO_SHOW = 'no_show'
}

export enum ServiceType {
  CONSULTATION = 'consultation',
  CLEANING = 'cleaning',
  FILLING = 'filling',
  ROOT_CANAL = 'root_canal',
  EXTRACTION = 'extraction',
  CROWN = 'crown',
  IMPLANT = 'implant',
  ORTHODONTICS = 'orthodontics',
  EMERGENCY = 'emergency'
}

export interface Appointment {
  id: string;
  cabinetId: string;
  patientId: string;
  practitionerId?: string;
  serviceType: ServiceType;
  title: string;
  description?: string;
  scheduledAt: Date;
  duration: number; // in minutes
  status: AppointmentStatus;
  notes?: string;
  price?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateAppointmentRequest {
  cabinetId: string;
  patientId: string;
  practitionerId?: string;
  serviceType: ServiceType;
  title: string;
  description?: string;
  scheduledAt: Date;
  duration?: number;
  notes?: string;
  price?: number;
}

export interface UpdateAppointmentRequest {
  patientId?: string;
  practitionerId?: string;
  serviceType?: ServiceType;
  title?: string;
  description?: string;
  scheduledAt?: Date;
  duration?: number;
  status?: AppointmentStatus;
  notes?: string;
  price?: number;
}

export interface AppointmentFilters {
  cabinetId?: string;
  patientId?: string;
  practitionerId?: string;
  status?: AppointmentStatus;
  serviceType?: ServiceType;
  dateFrom?: Date;
  dateTo?: Date;
  limit?: number;
  offset?: number;
}

// Factory function
export function createAppointment(data: CreateAppointmentRequest): Appointment {
  const now = new Date();
  
  return {
    id: uuidv4(),
    cabinetId: data.cabinetId,
    patientId: data.patientId,
    practitionerId: data.practitionerId,
    serviceType: data.serviceType,
    title: data.title,
    description: data.description,
    scheduledAt: data.scheduledAt,
    duration: data.duration || 30,
    status: AppointmentStatus.SCHEDULED,
    notes: data.notes,
    price: data.price,
    createdAt: now,
    updatedAt: now
  };
}