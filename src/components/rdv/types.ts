/**
 * Types for RDV components
 */

export interface Message {
  id: string;
  type: 'user' | 'bot' | 'system';
  content: string;
  timestamp: Date;
  suggestions?: string[];
  quickActions?: QuickAction[];
  aiResponse?: Record<string, unknown>;
  appointmentData?: Record<string, unknown>;
}

export interface QuickAction {
  id: string;
  label: string;
  type: 'location' | 'distance' | 'care_type' | 'urgency' | 'confirmation' | 'slot_selection';
  value: string | number | boolean;
  icon?: React.ReactNode;
  careType?: string;
}

export interface AppointmentFormData {
  patient: {
    firstName: string;
    lastName: string;
    phoneE164: string;
    email?: string;
    gdprConsent: boolean;
  };
  appointment: {
    careType: string;
    date: string;
    time: string;
    reason?: string;
  };
}

export interface CareType {
  id: string;
  label: string;
  icon: string;
  color: string;
  duration: number;
  price: number;
}

export const careTypes: CareType[] = [
  { id: 'consultation', label: 'Consultation générale', icon: '🩺', color: 'blue', duration: 30, price: 3000 },
  { id: 'urgence', label: 'Urgence dentaire', icon: '🚨', color: 'red', duration: 20, price: 4000 },
  { id: 'detartrage', label: 'Détartrage', icon: '✨', color: 'purple', duration: 45, price: 5000 },
  { id: 'soin', label: 'Soin de carie', icon: '🦷', color: 'green', duration: 60, price: 8000 },
  { id: 'extraction', label: 'Extraction', icon: '🔧', color: 'orange', duration: 30, price: 6000 },
  { id: 'prothese', label: 'Prothèse', icon: '🦷', color: 'pink', duration: 90, price: 25000 },
  { id: 'orthodontie', label: 'Orthodontie', icon: '⚙️', color: 'cyan', duration: 45, price: 15000 },
  { id: 'chirurgie', label: 'Chirurgie orale', icon: '🔪', color: 'red', duration: 120, price: 50000 }
];