/**
 * NOVA RDV Welcome Screen Component
 * 
 * Features:
 * - Welcome UI with action buttons
 * - Mobile-responsive design
 * - Accessibility features (WCAG 2.1 AA compliant)
 * - Visual branding consistent with NOVA
 * - Loading states and error handling
 */

'use client';

import React, { useState, useEffect } from 'react';
import { CalendarPlus, AlertTriangle, Calendar, Info, Phone, Mail, Clock } from 'lucide-react';

interface WelcomeAction {
  type: 'button' | 'calendar' | 'text' | 'link' | 'info_card' | 'contact_card';
  label: string;
  action: string;
  data?: any;
  style?: 'primary' | 'secondary' | 'urgent' | 'info' | 'warning';
  accessibility?: {
    aria_label?: string;
    role?: string;
  };
}

interface WelcomeScreenProps {
  /** Array of UI elements to render */
  ui_elements?: WelcomeAction[];
  /** Welcome message to display */
  message?: string;
  /** Clinic information */
  clinic_address?: string;
  timezone?: string;
  /** Loading state */
  isLoading?: boolean;
  /** Error state */
  error?: string;
  /** Callback when action is selected */
  onAction?: (action: string, data?: any) => void;
  /** Custom CSS classes */
  className?: string;
}

const defaultActions: WelcomeAction[] = [
  {
    type: 'button',
    label: 'Prendre RDV',
    action: 'start_booking',
    style: 'primary',
    accessibility: {
      aria_label: 'Démarrer la prise de rendez-vous',
      role: 'button'
    }
  },
  {
    type: 'button',
    label: 'Urgence',
    action: 'emergency',
    style: 'urgent',
    accessibility: {
      aria_label: 'Accès urgence médicale',
      role: 'button'
    }
  },
  {
    type: 'button',
    label: 'Voir calendrier',
    action: 'view_calendar',
    style: 'secondary',
    accessibility: {
      aria_label: 'Consulter le calendrier des disponibilités',
      role: 'button'
    }
  },
  {
    type: 'button',
    label: 'Informations',
    action: 'clinic_info',
    style: 'info',
    accessibility: {
      aria_label: 'Informations sur le cabinet',
      role: 'button'
    }
  }
];

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  ui_elements = defaultActions,
  message = "Bienvenue chez NOVA RDV ! Comment puis-je vous aider aujourd'hui ?",
  clinic_address = "Cité 109, Daboussy El Achour, Alger",
  timezone = "Africa/Algiers",
  isLoading = false,
  error,
  onAction,
  className = ""
}) => {
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState<string>('');

  // Update current time in clinic timezone
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const timeString = now.toLocaleTimeString('fr-DZ', {
        timeZone: timezone,
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
      setCurrentTime(timeString);
    };

    updateTime();
    const interval = setInterval(updateTime, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [timezone]);

  const handleActionClick = (action: WelcomeAction) => {
    if (isLoading) return;
    
    setSelectedAction(action.action);
    onAction?.(action.action, action.data);
  };

  const getActionIcon = (actionType: string) => {
    const iconMap = {
      start_booking: CalendarPlus,
      emergency: AlertTriangle,
      view_calendar: Calendar,
      clinic_info: Info
    };
    return iconMap[actionType as keyof typeof iconMap] || Info;
  };

  const getButtonStyles = (style?: string, isSelected?: boolean) => {
    const baseStyles = "flex items-center justify-center gap-3 px-6 py-4 rounded-lg font-medium text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed hover:transform hover:scale-105 active:scale-95";
    
    if (isSelected) {
      return `${baseStyles} bg-blue-100 text-blue-800 ring-2 ring-blue-500`;
    }
    
    const styleMap = {
      primary: `${baseStyles} bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 shadow-lg`,
      urgent: `${baseStyles} bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 shadow-lg animate-pulse`,
      secondary: `${baseStyles} bg-gray-100 text-gray-700 hover:bg-gray-200 focus:ring-gray-500 border-2 border-gray-300`,
      info: `${baseStyles} bg-green-100 text-green-700 hover:bg-green-200 focus:ring-green-500 border-2 border-green-300`,
      warning: `${baseStyles} bg-yellow-100 text-yellow-700 hover:bg-yellow-200 focus:ring-yellow-500 border-2 border-yellow-300`
    };
    
    return styleMap[style as keyof typeof styleMap] || styleMap.secondary;
  };

  if (error) {
    return (
      <div className={`max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg ${className}`} role="alert">
        <div className="flex items-center gap-3 text-red-600 mb-4">
          <AlertTriangle className="text-xl" />
          <h2 className="text-lg font-semibold">Erreur</h2>
        </div>
        <p className="text-gray-700 mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4 ${className}`}>
      <div className="max-w-md w-full bg-white rounded-xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 text-center">
          <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl font-bold">N</span>
          </div>
          <h1 className="text-2xl font-bold mb-2">NOVA RDV</h1>
          <p className="text-blue-100 text-sm leading-relaxed" role="banner">
            {message}
          </p>
        </div>

        {/* Clinic Information */}
        <div className="bg-gray-50 p-4">
          <div className="flex items-start gap-3 text-sm text-gray-600">
            <Info className="text-blue-500 mt-0.5 flex-shrink-0" size={16} />
            <div>
              <p className="font-medium text-gray-700">Cabinet dentaire</p>
              <p>{clinic_address}</p>
              <div className="flex items-center gap-2 mt-2">
                <Clock className="text-gray-400" size={14} />
                <span>Heure locale: {currentTime}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-6 space-y-3">
          <h2 className="sr-only">Actions disponibles</h2>
          {ui_elements.map((action, index) => {
            const IconComponent = getActionIcon(action.action);
            const isSelected = selectedAction === action.action;
            
            return (
              <button
                key={`${action.action}-${index}`}
                onClick={() => handleActionClick(action)}
                disabled={isLoading}
                className={getButtonStyles(action.style, isSelected)}
                aria-label={action.accessibility?.aria_label || action.label}
                role={action.accessibility?.role || 'button'}
              >
                <IconComponent className="text-lg flex-shrink-0" size={20} />
                <span className="flex-1 text-left">{action.label}</span>
                {isLoading && selectedAction === action.action && (
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin flex-shrink-0" />
                )}
              </button>
            );
          })}
        </div>

        {/* Contact Information */}
        <div className="border-t p-6 bg-gray-50">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Contact direct</h3>
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Phone className="text-gray-400" size={14} />
              <a 
                href="tel:+213555000000" 
                className="hover:text-blue-600 transition-colors"
                aria-label="Appeler le cabinet"
              >
                +213 555 000 000
              </a>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="text-gray-400" size={14} />
              <a 
                href="mailto:contact@nova-rdv.dz" 
                className="hover:text-blue-600 transition-colors"
                aria-label="Envoyer un email au cabinet"
              >
                contact@nova-rdv.dz
              </a>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="text-gray-400" size={14} />
              <span>08:00 - 18:00, Dimanche à Jeudi</span>
            </div>
          </div>
        </div>

        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-lg">
            <div className="flex items-center gap-3 text-gray-600">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <span>Chargement...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Contact Card Component for handoff scenarios
export const ContactCard: React.FC<{
  phone?: string;
  email?: string;
  hours?: string;
  message?: string;
  className?: string;
}> = ({ 
  phone = "+213555000000", 
  email = "contact@nova-rdv.dz", 
  hours = "08:00-18:00, Dim-Jeu",
  message = "Veuillez contacter le cabinet directement:",
  className = ""
}) => {
  return (
    <div className={`bg-blue-50 border border-blue-200 rounded-lg p-4 ${className}`} role="complementary">
      <div className="flex items-start gap-3">
        <Info className="text-blue-500 mt-1 flex-shrink-0" size={16} />
        <div className="flex-1">
          <h3 className="font-medium text-blue-800 mb-2">Contact Cabinet</h3>
          <p className="text-blue-700 text-sm mb-3">{message}</p>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Phone className="text-blue-400 text-sm" size={14} />
              <a 
                href={`tel:${phone}`}
                className="text-blue-700 hover:text-blue-800 transition-colors text-sm font-medium"
                aria-label="Appeler le cabinet"
              >
                {phone}
              </a>
            </div>
            
            <div className="flex items-center gap-2">
              <Mail className="text-blue-400 text-sm" size={14} />
              <a 
                href={`mailto:${email}`}
                className="text-blue-700 hover:text-blue-800 transition-colors text-sm"
                aria-label="Envoyer un email au cabinet"
              >
                {email}
              </a>
            </div>
            
            <div className="flex items-center gap-2">
              <Clock className="text-blue-400 text-sm" size={14} />
              <span className="text-blue-700 text-sm">{hours}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Loading Spinner Component
export const LoadingSpinner: React.FC<{ 
  message?: string; 
  className?: string;
}> = ({ 
  message = "Chargement...", 
  className = "" 
}) => {
  return (
    <div className={`flex items-center justify-center gap-3 text-gray-600 ${className}`} role="status" aria-live="polite">
      <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      <span>{message}</span>
    </div>
  );
};

export default WelcomeScreen;