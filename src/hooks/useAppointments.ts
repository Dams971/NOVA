/**
 * NOVA RDV v2 - React Hooks pour Appointments
 * 
 * Hooks personnalisés pour la gestion des rendez-vous côté client
 * - Intégration avec l'API RDV
 * - Gestion des états de chargement
 * - Cache et optimisations
 * - WebSocket pour temps réel
 * - Gestion d'erreurs robuste
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useWebSocket } from './useWebSocket';

// Simple client-side logger
const logger = {
  error: (_message: string, _error?: unknown) => {
    // Log errors silently in production
  },
  warn: (_message: string, _data?: unknown) => {
    // Log warnings silently in production
  },
  info: (_message: string, _data?: unknown) => {
    // Log info silently in production
  },
  debug: (_message: string, _data?: unknown) => {
    // Log debug silently in production
  }
};

// =============================================
// TYPES ET INTERFACES
// =============================================

export interface Patient {
  id?: string;
  firstName: string;
  lastName: string;
  phoneE164: string;
  email?: string;
  dateOfBirth?: string;
  gender?: 'M' | 'F' | 'Other';
  communicationMethod?: 'sms' | 'email' | 'phone' | 'whatsapp' | 'none';
  reminderEnabled?: boolean;
  gdprConsent: {
    dataProcessing: { consent: boolean; date?: string };
    marketing?: { consent: boolean; date?: string };
  };
}

export interface Appointment {
  id?: string;
  patientId?: string;
  practitionerId?: string;
  careType: 'consultation' | 'urgence' | 'detartrage' | 'soin' | 'extraction' | 'prothese' | 'orthodontie' | 'chirurgie';
  scheduledAt: string;
  durationMinutes?: number;
  title: string;
  description?: string;
  reason?: string;
  price?: number;
  status?: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  isUrgent?: boolean;
  urgencyLevel?: number;
  notes?: string;
  patientName?: string;
  practitionerName?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface TimeSlot {
  startTime: string;
  endTime: string;
  duration: number;
  available: boolean;
  practitionerId?: string;
}

export interface AIResponse {
  action: string;
  clinic_address: string;
  timezone: string;
  patient?: {
    name: string;
    phone_e164: string;
    email?: string;
  };
  slot?: {
    start_iso: string;
    end_iso: string;
    duration_minutes?: number;
  };
  care_type?: string;
  reason?: string;
  status?: string;
  missing_fields?: string[];
  clarification_question?: string;
  available_slots?: Array<{
    start_iso: string;
    end_iso: string;
    available: boolean;
  }>;
}

export interface UseAppointmentsOptions {
  patientId?: string;
  practitionerId?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

// =============================================
// HOOK PRINCIPAL - useAppointments
// =============================================

export function useAppointments(options: UseAppointmentsOptions = {}) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetch, setLastFetch] = useState<Date | null>(null);
  
  const { autoRefresh = false, refreshInterval = 30000 } = options;
  const refreshTimer = useRef<NodeJS.Timeout>();

  // WebSocket pour mises à jour temps réel
  const { lastMessage } = useWebSocket({ autoConnect: true });

  /**
   * Récupère la liste des rendez-vous
   */
  const fetchAppointments = useCallback(async (searchOptions?: {
    patientId?: string;
    practitionerId?: string;
    careType?: string;
    status?: string[];
    dateFrom?: string;
    dateTo?: string;
    limit?: number;
    offset?: number;
  }) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      
      Object.entries({ ...options, ...searchOptions }).forEach(([key, value]) => {
        if (value !== undefined) {
          if (Array.isArray(value)) {
            params.set(key, value.join(','));
          } else {
            params.set(key, value.toString());
          }
        }
      });

      const response = await fetch(`/api/rdv?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Erreur HTTP ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setAppointments(data.data || []);
        setLastFetch(new Date());
      } else {
        throw new Error(data.error || 'Erreur inconnue');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du chargement des rendez-vous';
      setError(errorMessage);
      logger.error('Erreur fetchAppointments:', err);
    } finally {
      setLoading(false);
    }
  }, [options]);

  /**
   * Récupère un rendez-vous spécifique par ID
   */
  const getAppointment = useCallback(async (appointmentId: string): Promise<Appointment | null> => {
    try {
      const response = await fetch(`/api/rdv?id=${appointmentId}`);
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP ${response.status}`);
      }

      const data = await response.json();
      return data.success ? data.data : null;
    } catch (err) {
      logger.error('Erreur getAppointment:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement du rendez-vous');
      return null;
    }
  }, []);

  /**
   * Met à jour un rendez-vous
   */
  const updateAppointment = useCallback(async (appointmentId: string, updates: Partial<Appointment>) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/rdv', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'update',
          appointmentId,
          updates
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Erreur HTTP ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        // Mettre à jour localement
        setAppointments(prev => prev.map(apt => 
          apt.id === appointmentId ? { ...apt, ...updates } : apt
        ));
        return true;
      } else {
        throw new Error(data.error || 'Erreur de mise à jour');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la mise à jour';
      setError(errorMessage);
      logger.error('Erreur updateAppointment:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Annule un rendez-vous
   */
  const cancelAppointment = useCallback(async (appointmentId: string, reason?: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/rdv', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'cancel',
          appointmentId,
          reason
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Erreur HTTP ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        // Mettre à jour localement
        setAppointments(prev => prev.map(apt => 
          apt.id === appointmentId ? { ...apt, status: 'cancelled' as const } : apt
        ));
        return true;
      } else {
        throw new Error(data.error || 'Erreur d\'annulation');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de l\'annulation';
      setError(errorMessage);
      logger.error('Erreur cancelAppointment:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Confirme un rendez-vous
   */
  const confirmAppointment = useCallback(async (appointmentId: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/rdv', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'confirm',
          appointmentId,
          confirmedBy: 'patient'
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Erreur HTTP ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        // Mettre à jour localement
        setAppointments(prev => prev.map(apt => 
          apt.id === appointmentId ? { ...apt, status: 'confirmed' as const } : apt
        ));
        return true;
      } else {
        throw new Error(data.error || 'Erreur de confirmation');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la confirmation';
      setError(errorMessage);
      logger.error('Erreur confirmAppointment:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-refresh
  useEffect(() => {
    if (autoRefresh) {
      refreshTimer.current = setInterval(() => {
        fetchAppointments();
      }, refreshInterval);

      return () => {
        if (refreshTimer.current) {
          clearInterval(refreshTimer.current);
        }
      };
    }
  }, [autoRefresh, refreshInterval, fetchAppointments]);

  // WebSocket updates
  useEffect(() => {
    if (lastMessage) {
      try {
        const message = JSON.parse(lastMessage);
        if (message.type === 'appointment_updated' || message.type === 'appointment_created') {
          fetchAppointments();
        }
      } catch (err) {
        // Ignore les messages WebSocket malformés
      }
    }
  }, [lastMessage, fetchAppointments]);

  return {
    appointments,
    loading,
    error,
    lastFetch,
    fetchAppointments,
    getAppointment,
    updateAppointment,
    cancelAppointment,
    confirmAppointment,
    refresh: fetchAppointments
  };
}

// =============================================
// HOOK POUR CRÉNEAUX DISPONIBLES
// =============================================

export function useAvailableSlots() {
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSlots = useCallback(async (
    date: string,
    careType: string = 'consultation',
    practitionerId?: string
  ) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/rdv', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'slots',
          date,
          careType,
          practitionerId
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Erreur HTTP ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setSlots(data.slots || []);
      } else {
        throw new Error(data.error || 'Erreur récupération créneaux');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du chargement des créneaux';
      setError(errorMessage);
      logger.error('Erreur fetchSlots:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    slots,
    loading,
    error,
    fetchSlots
  };
}

// =============================================
// HOOK POUR ASSISTANT IA
// =============================================

export function useAppointmentAI(sessionId?: string) {
  const [response, setResponse] = useState<AIResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversationHistory, setConversationHistory] = useState<Array<{
    message: string;
    response: AIResponse;
    timestamp: Date;
  }>>([]);

  const processMessage = useCallback(async (
    message: string,
    patientContext?: {
      phone?: string;
      name?: string;
      patientId?: string;
    }
  ) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/rdv', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(sessionId && { 'X-Session-ID': sessionId })
        },
        body: JSON.stringify({
          action: 'ai',
          message,
          sessionId,
          patientContext
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Erreur HTTP ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success && data.aiResponse) {
        setResponse(data.aiResponse);
        setConversationHistory(prev => [...prev, {
          message,
          response: data.aiResponse,
          timestamp: new Date()
        }]);
        return data.aiResponse;
      } else {
        throw new Error(data.error || 'Erreur traitement IA');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du traitement du message';
      setError(errorMessage);
      logger.error('Erreur processMessage:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  const clearConversation = useCallback(() => {
    setResponse(null);
    setError(null);
    setConversationHistory([]);
  }, []);

  return {
    response,
    loading,
    error,
    conversationHistory,
    processMessage,
    clearConversation
  };
}

// =============================================
// HOOK POUR CRÉATION DE RENDEZ-VOUS
// =============================================

export function useCreateAppointment() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastCreated, setLastCreated] = useState<{
    appointmentId: string;
    patientId: string;
    patientCreated: boolean;
  } | null>(null);

  const createAppointment = useCallback(async (patient: Patient, appointment: Omit<Appointment, 'patientId'>) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/rdv', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'create',
          patient,
          appointment
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Erreur HTTP ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        const result = {
          appointmentId: data.appointmentId,
          patientId: data.patientId,
          patientCreated: data.patientCreated
        };
        setLastCreated(result);
        return result;
      } else {
        throw new Error(data.error || 'Erreur création rendez-vous');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la création du rendez-vous';
      setError(errorMessage);
      logger.error('Erreur createAppointment:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    createAppointment,
    loading,
    error,
    lastCreated
  };
}