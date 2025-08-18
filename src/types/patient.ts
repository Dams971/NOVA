/**
 * Patient type definitions for NOVA RDV platform
 */

export interface Patient {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  phoneE164?: string;
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other';
  address?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  nationalId?: string;
  insuranceNumber?: string;
  insuranceProvider?: string;
  medicalHistory?: MedicalHistory;
  allergies?: string[];
  medications?: string[];
  emergencyContact?: EmergencyContact;
  cabinetId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastVisit?: string;
  nextAppointment?: string;
  metadata?: Record<string, unknown>;
}

export interface MedicalHistory {
  conditions?: string[];
  surgeries?: Array<{
    type: string;
    date: string;
    notes?: string;
  }>;
  familyHistory?: string[];
  notes?: string;
  lastUpdated?: string;
}

export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
  phoneE164?: string;
  email?: string;
}

export interface PatientNote {
  id: string;
  patientId: string;
  authorId: string;
  type: 'clinical' | 'administrative' | 'general';
  content: string;
  isPrivate: boolean;
  createdAt: string;
  updatedAt?: string;
  attachments?: string[];
}

export interface PatientDocument {
  id: string;
  patientId: string;
  type: 'prescription' | 'xray' | 'report' | 'insurance' | 'consent' | 'other';
  name: string;
  description?: string;
  fileUrl: string;
  mimeType: string;
  size: number;
  uploadedBy: string;
  uploadedAt: string;
  metadata?: Record<string, unknown>;
}

export interface PatientConsent {
  id: string;
  patientId: string;
  type: 'treatment' | 'data_processing' | 'marketing' | 'research';
  granted: boolean;
  grantedAt?: string;
  revokedAt?: string;
  expiresAt?: string;
  version: string;
  ipAddress?: string;
}

export interface PatientTreatmentPlan {
  id: string;
  patientId: string;
  practitionerId: string;
  name: string;
  description?: string;
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  treatments: Array<{
    type: string;
    description: string;
    status: 'pending' | 'in_progress' | 'completed';
    estimatedSessions: number;
    completedSessions: number;
    notes?: string;
  }>;
  estimatedCost?: number;
  startDate?: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PatientFilter {
  cabinetId?: string;
  search?: string;
  isActive?: boolean;
  hasUpcomingAppointments?: boolean;
  lastVisitBefore?: string;
  lastVisitAfter?: string;
  ageMin?: number;
  ageMax?: number;
  city?: string;
  tags?: string[];
}

export interface PatientStatistics {
  patientId: string;
  totalAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
  noShowCount: number;
  averageVisitDuration: number;
  lastVisit?: string;
  nextAppointment?: string;
  totalSpent?: number;
  outstandingBalance?: number;
}