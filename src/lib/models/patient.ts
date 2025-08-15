import { v4 as uuidv4 } from 'uuid';

export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
  OTHER = 'other'
}

export interface PatientPreferences {
  preferredLanguage: string;
  communicationMethod: 'email' | 'sms' | 'phone';
  reminderEnabled: boolean;
  reminderHours: number[];
  notes?: string;
}

export interface MedicalRecord {
  id: string;
  date: Date;
  type: 'consultation' | 'treatment' | 'note' | 'allergy' | 'medication';
  title: string;
  description: string;
  practitionerId?: string;
  attachments?: string[];
  createdAt: Date;
}

export interface Patient {
  id: string;
  cabinetId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: Date;
  gender?: Gender;
  address?: {
    street: string;
    city: string;
    postalCode: string;
    country: string;
  };
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  medicalHistory: MedicalRecord[];
  preferences: PatientPreferences;
  isActive: boolean;
  lastVisit?: Date;
  nextAppointment?: Date;
  totalVisits: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePatientRequest {
  cabinetId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: Date;
  gender?: Gender;
  address?: {
    street: string;
    city: string;
    postalCode: string;
    country: string;
  };
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  preferences?: Partial<PatientPreferences>;
}

export interface UpdatePatientRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  dateOfBirth?: Date;
  gender?: Gender;
  address?: {
    street: string;
    city: string;
    postalCode: string;
    country: string;
  };
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  preferences?: Partial<PatientPreferences>;
  isActive?: boolean;
}

export interface PatientFilters {
  cabinetId?: string;
  search?: string;
  isActive?: boolean;
  ageMin?: number;
  ageMax?: number;
  lastVisitFrom?: Date;
  lastVisitTo?: Date;
  limit?: number;
  offset?: number;
}

export interface PatientSearchResult {
  patients: Patient[];
  total: number;
  hasMore: boolean;
}

// Factory function
export function createPatient(data: CreatePatientRequest): Patient {
  const now = new Date();
  const defaultPreferences: PatientPreferences = {
    preferredLanguage: 'fr',
    communicationMethod: 'email',
    reminderEnabled: true,
    reminderHours: [24, 2]
  };

  return {
    id: uuidv4(),
    cabinetId: data.cabinetId,
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email,
    phone: data.phone,
    dateOfBirth: data.dateOfBirth,
    gender: data.gender,
    address: data.address,
    emergencyContact: data.emergencyContact,
    medicalHistory: [],
    preferences: { ...defaultPreferences, ...data.preferences },
    isActive: true,
    totalVisits: 0,
    createdAt: now,
    updatedAt: now
  };
}