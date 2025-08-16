'use client';

import React, { createContext, useContext, useRef, useCallback, useEffect } from 'react';

type AnnouncementPriority = 'polite' | 'assertive';

interface AnnouncementOptions {
  /** Priority level for screen reader announcements */
  priority?: AnnouncementPriority;
  /** Delay before announcement in milliseconds */
  delay?: number;
  /** Whether to clear previous announcements */
  clearPrevious?: boolean;
  /** Whether to announce only if content has changed */
  onlyIfChanged?: boolean;
}

interface AnnouncerContextValue {
  announce: (message: string, options?: AnnouncementOptions) => void;
  announceRoute: (routeName: string) => void;
  announceError: (error: string) => void;
  announceSuccess: (success: string) => void;
  announceLoading: (isLoading: boolean, action?: string) => void;
}

const AnnouncerContext = createContext<AnnouncerContextValue | null>(null);

/**
 * Hook to access the announcer context
 */
export function useAnnouncer() {
  const context = useContext(AnnouncerContext);
  if (!context) {
    throw new Error('useAnnouncer must be used within an AnnouncerProvider');
  }
  return context;
}

/**
 * NOVA Announcer Provider
 * 
 * Provides screen reader announcement functionality throughout the application.
 * Creates live regions for different types of announcements with proper priority levels.
 * 
 * Features:
 * - Multiple live regions for different announcement types
 * - Automatic deduplication of messages
 * - Configurable delays and priorities
 * - French medical terminology support
 * - Route change announcements
 * - Loading state announcements
 */
export function AnnouncerProvider({ children }: { children: React.ReactNode }) {
  const politeRef = useRef<HTMLDivElement>(null);
  const assertiveRef = useRef<HTMLDivElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);
  const routeRef = useRef<HTMLDivElement>(null);
  
  const lastAnnouncements = useRef<Map<AnnouncementPriority, string>>(new Map());
  const timeouts = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Clear timeout when component unmounts
  useEffect(() => {
    return () => {
      timeouts.current.forEach(timeout => clearTimeout(timeout));
      timeouts.current.clear();
    };
  }, []);

  const announce = useCallback((message: string, options: AnnouncementOptions = {}) => {
    const {
      priority = 'polite',
      delay = 0,
      clearPrevious = false,
      onlyIfChanged = true
    } = options;

    // Skip if message hasn't changed and onlyIfChanged is true
    if (onlyIfChanged && lastAnnouncements.current.get(priority) === message) {
      return;
    }

    const targetRef = priority === 'assertive' ? assertiveRef : politeRef;
    if (!targetRef.current) return;

    const makeAnnouncement = () => {
      if (!targetRef.current) return;

      if (clearPrevious) {
        targetRef.current.textContent = '';
        // Force screen reader to notice the change
        setTimeout(() => {
          if (targetRef.current) {
            targetRef.current.textContent = message;
            lastAnnouncements.current.set(priority, message);
          }
        }, 10);
      } else {
        targetRef.current.textContent = message;
        lastAnnouncements.current.set(priority, message);
      }
    };

    if (delay > 0) {
      const timeoutId = setTimeout(makeAnnouncement, delay);
      timeouts.current.set(`${priority}-${Date.now()}`, timeoutId);
    } else {
      makeAnnouncement();
    }
  }, []);

  const announceRoute = useCallback((routeName: string) => {
    if (!routeRef.current) return;
    
    const message = `Navigation vers ${routeName}`;
    routeRef.current.textContent = message;
    
    // Clear after announcement
    setTimeout(() => {
      if (routeRef.current) {
        routeRef.current.textContent = '';
      }
    }, 1000);
  }, []);

  const announceError = useCallback((error: string) => {
    announce(`Erreur : ${error}`, { 
      priority: 'assertive', 
      clearPrevious: true 
    });
  }, [announce]);

  const announceSuccess = useCallback((success: string) => {
    announce(`Succès : ${success}`, { 
      priority: 'polite', 
      clearPrevious: true 
    });
  }, [announce]);

  const announceLoading = useCallback((isLoading: boolean, action?: string) => {
    if (!statusRef.current) return;

    if (isLoading) {
      const message = action 
        ? `${action} en cours...` 
        : 'Chargement en cours...';
      statusRef.current.textContent = message;
    } else {
      // Clear loading message after a delay to ensure it was heard
      setTimeout(() => {
        if (statusRef.current) {
          statusRef.current.textContent = '';
        }
      }, 500);
    }
  }, []);

  const contextValue: AnnouncerContextValue = {
    announce,
    announceRoute,
    announceError,
    announceSuccess,
    announceLoading
  };

  return (
    <AnnouncerContext.Provider value={contextValue}>
      {children}
      
      {/* Live regions for screen reader announcements */}
      <div style={{ position: 'absolute', left: '-10000px', width: '1px', height: '1px', overflow: 'hidden' }}>
        {/* Polite announcements */}
        <div
          ref={politeRef}
          aria-live="polite"
          aria-atomic="true"
          role="status"
          aria-label="Notifications"
        />
        
        {/* Assertive announcements (errors, urgent notifications) */}
        <div
          ref={assertiveRef}
          aria-live="assertive"
          aria-atomic="true"
          role="alert"
          aria-label="Alertes importantes"
        />
        
        {/* Loading status */}
        <div
          ref={statusRef}
          aria-live="polite"
          aria-atomic="true"
          role="status"
          aria-label="État du chargement"
        />
        
        {/* Route changes */}
        <div
          ref={routeRef}
          aria-live="polite"
          aria-atomic="true"
          role="status"
          aria-label="Navigation"
        />
      </div>
    </AnnouncerContext.Provider>
  );
}

/**
 * Individual Announcer Component
 * 
 * A component that can be placed anywhere to make announcements.
 * Useful for component-level announcements.
 */
interface AnnouncerProps {
  /** Message to announce */
  message?: string;
  /** Announcement priority */
  priority?: AnnouncementPriority;
  /** Whether the announcer is active */
  active?: boolean;
  /** Custom aria-label for the live region */
  label?: string;
}

export function Announcer({ 
  message = '', 
  priority = 'polite', 
  active = true,
  label 
}: AnnouncerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const lastMessage = useRef<string>('');

  useEffect(() => {
    if (!active || !ref.current || message === lastMessage.current) return;

    ref.current.textContent = message;
    lastMessage.current = message;

    // Clear message after announcement
    if (message) {
      const timeout = setTimeout(() => {
        if (ref.current && ref.current.textContent === message) {
          ref.current.textContent = '';
        }
      }, 1000);

      return () => clearTimeout(timeout);
    }
  }, [message, active]);

  return (
    <div
      ref={ref}
      aria-live={priority}
      aria-atomic="true"
      role={priority === 'assertive' ? 'alert' : 'status'}
      aria-label={label}
      style={{ 
        position: 'absolute', 
        left: '-10000px', 
        width: '1px', 
        height: '1px', 
        overflow: 'hidden' 
      }}
    />
  );
}

/**
 * Hook for component-level announcements
 * 
 * Creates a local announcer for a specific component.
 * Useful when you need fine-grained control over announcements.
 */
export function useLocalAnnouncer(priority: AnnouncementPriority = 'polite') {
  const ref = useRef<HTMLDivElement>(null);
  const lastMessage = useRef<string>('');

  const announce = useCallback((message: string, delay = 0) => {
    if (!ref.current || message === lastMessage.current) return;

    const makeAnnouncement = () => {
      if (ref.current) {
        ref.current.textContent = message;
        lastMessage.current = message;

        // Clear after a delay
        setTimeout(() => {
          if (ref.current && ref.current.textContent === message) {
            ref.current.textContent = '';
          }
        }, 1000);
      }
    };

    if (delay > 0) {
      setTimeout(makeAnnouncement, delay);
    } else {
      makeAnnouncement();
    }
  }, []);

  const AnnouncerComponent = useCallback(() => (
    <div
      ref={ref}
      aria-live={priority}
      aria-atomic="true"
      role={priority === 'assertive' ? 'alert' : 'status'}
      style={{ 
        position: 'absolute', 
        left: '-10000px', 
        width: '1px', 
        height: '1px', 
        overflow: 'hidden' 
      }}
    />
  ), [priority]);

  return { announce, Announcer: AnnouncerComponent };
}

/**
 * French Medical Announcements Helper
 * 
 * Pre-configured announcements for common medical interface scenarios.
 */
export function useMedicalAnnouncements() {
  const { announce, announceError, announceSuccess, announceLoading } = useAnnouncer();

  return {
    // Appointment related
    appointmentConfirmed: () => announceSuccess('Rendez-vous confirmé avec succès'),
    appointmentCancelled: () => announceSuccess('Rendez-vous annulé'),
    appointmentModified: () => announceSuccess('Rendez-vous modifié'),
    appointmentError: (details?: string) => announceError(
      details ? `Erreur lors de la prise de rendez-vous : ${details}` : 'Erreur lors de la prise de rendez-vous'
    ),

    // Form related
    formSaved: () => announceSuccess('Informations enregistrées'),
    formError: (field?: string) => announceError(
      field ? `Erreur dans le champ ${field}` : 'Veuillez corriger les erreurs dans le formulaire'
    ),
    requiredField: (fieldName: string) => announceError(`Le champ ${fieldName} est obligatoire`),

    // Navigation
    pageLoaded: (pageName: string) => announce(`Page ${pageName} chargée`),
    sectionEntered: (sectionName: string) => announce(`Section ${sectionName}`),

    // Medical specific
    emergencyAlert: () => announceError('Alerte urgence médicale - Contactez immédiatement votre praticien'),
    prescriptionReady: () => announceSuccess('Ordonnance prête à télécharger'),
    reminderSet: () => announceSuccess('Rappel programmé'),

    // Loading states
    loadingAppointments: (isLoading: boolean) => announceLoading(isLoading, 'Chargement des rendez-vous'),
    loadingPatientData: (isLoading: boolean) => announceLoading(isLoading, 'Chargement du dossier patient'),
    savingData: (isLoading: boolean) => announceLoading(isLoading, 'Enregistrement'),

    // Generic announcements
    announce: (message: string, options?: AnnouncementOptions) => announce(message, options)
  };
}