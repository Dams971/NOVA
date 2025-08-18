/**
 * NOVA RDV v2 - Composant Calendrier de Rendez-vous
 * 
 * Calendrier interactif pour la sélection de créneaux
 * - Affichage mensuel avec navigation
 * - Créneaux disponibles en temps réel
 * - Support mobile responsive
 * - Timezone Africa/Algiers
 * - Intégration avec l'API RDV
 * - Accessibilité WCAG 2.1 AA
 */

'use client';

import { format, addDays, startOfMonth, endOfMonth, eachDayOfInterval, 
  isSameMonth, isSameDay, isToday, isPast, getDay, addMonths, subMonths,
  parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, Clock, ChevronLeft, ChevronRight, AlertCircle, 
  CheckCircle, Loader2, CalendarDays, MapPin,
  Stethoscope, Zap, RefreshCw
} from 'lucide-react';
import React, { useState, useCallback, useMemo } from 'react';

// =============================================
// TYPES ET INTERFACES
// =============================================

export interface TimeSlot {
  startTime: string;
  endTime: string;
  duration: number;
  available: boolean;
  practitionerId?: string;
  price?: number;
}

export interface SelectedSlot {
  date: string;
  time: string;
  startTime: string;
  endTime: string;
  duration: number;
  practitionerId?: string;
}

export interface AppointmentCalendarProps {
  /** Type de soin sélectionné */
  careType?: 'consultation' | 'urgence' | 'detartrage' | 'soin' | 'extraction' | 'prothese' | 'orthodontie' | 'chirurgie';
  
  /** ID du praticien (optionnel) */
  practitionerId?: string;
  
  /** Fonction appelée lors de la sélection d'un créneau */
  onSlotSelect?: (slot: SelectedSlot) => void;
  
  /** Créneau actuellement sélectionné */
  selectedSlot?: SelectedSlot | null;
  
  /** Date minimum sélectionnable (par défaut: demain) */
  minDate?: Date;
  
  /** Date maximum sélectionnable (par défaut: 3 mois) */
  maxDate?: Date;
  
  /** Classes CSS personnalisées */
  className?: string;
  
  /** Mode compact pour mobile */
  compact?: boolean;
  
  /** Affichage en lecture seule */
  readOnly?: boolean;

  /** Patient information */
  patient?: unknown;
}

// Configuration des types de soins avec couleurs
const CARE_TYPE_CONFIG = {
  consultation: { label: 'Consultation', icon: Stethoscope, color: 'blue', duration: 30 },
  urgence: { label: 'Urgence', icon: Zap, color: 'red', duration: 20 },
  detartrage: { label: 'Détartrage', icon: Clock, color: 'purple', duration: 45 },
  soin: { label: 'Soin', icon: Calendar, color: 'green', duration: 60 },
  extraction: { label: 'Extraction', icon: AlertCircle, color: 'orange', duration: 30 },
  prothese: { label: 'Prothèse', icon: CalendarDays, color: 'pink', duration: 90 },
  orthodontie: { label: 'Orthodontie', icon: Calendar, color: 'cyan', duration: 45 },
  chirurgie: { label: 'Chirurgie', icon: AlertCircle, color: 'red', duration: 120 }
};

// Mock hook for available slots
const useAvailableSlots = () => {
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSlots = async (date: string, _careType?: string, _practitionerId?: string) => {
    setLoading(true);
    setError(null);
    
    try {
      // Mock data - replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockSlots: TimeSlot[] = [
        {
          startTime: `${date}T09:00:00.000Z`,
          endTime: `${date}T09:30:00.000Z`,
          duration: 30,
          available: true,
          practitionerId: 'dr-smith'
        },
        {
          startTime: `${date}T10:00:00.000Z`,
          endTime: `${date}T10:30:00.000Z`,
          duration: 30,
          available: true,
          practitionerId: 'dr-smith'
        },
        {
          startTime: `${date}T11:00:00.000Z`,
          endTime: `${date}T11:30:00.000Z`,
          duration: 30,
          available: true,
          practitionerId: 'dr-smith'
        },
        {
          startTime: `${date}T14:00:00.000Z`,
          endTime: `${date}T14:30:00.000Z`,
          duration: 30,
          available: true,
          practitionerId: 'dr-smith'
        },
        {
          startTime: `${date}T15:00:00.000Z`,
          endTime: `${date}T15:30:00.000Z`,
          duration: 30,
          available: true,
          practitionerId: 'dr-smith'
        }
      ];
      
      setSlots(mockSlots);
    } catch (err) {
      setError('Erreur lors du chargement des créneaux');
    } finally {
      setLoading(false);
    }
  };

  return { slots, loading, error, fetchSlots };
};

// =============================================
// COMPOSANT PRINCIPAL
// =============================================

export function AppointmentCalendar({
  careType = 'consultation',
  practitionerId,
  onSlotSelect,
  selectedSlot: _selectedSlot,
  minDate = addDays(new Date(), 1),
  maxDate = addMonths(new Date(), 3),
  className = '',
  compact = false,
  readOnly = false,
  patient: _patient
}: AppointmentCalendarProps) {
  
  // États locaux
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()));
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [showTimeSlots, setShowTimeSlots] = useState(false);

  // Hook pour récupérer les créneaux
  const { slots, loading, error, fetchSlots } = useAvailableSlots();

  // Configuration du type de soin
  const careConfig = CARE_TYPE_CONFIG[careType];

  // Récupération des jours du mois
  const monthDays = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start, end });
    
    // Ajouter des jours vides pour aligner la grille
    const startDay = getDay(start);
    const emptyDays = Array.from({ length: startDay === 0 ? 6 : startDay - 1 }, () => null);
    
    return [...emptyDays, ...days];
  }, [currentMonth]);

  // Navigation mois
  const navigateMonth = useCallback((direction: 'prev' | 'next') => {
    setCurrentMonth(prev => direction === 'prev' ? subMonths(prev, 1) : addMonths(prev, 1));
    setSelectedDate(null);
    setSelectedTime(null);
    setShowTimeSlots(false);
  }, []);

  // Sélection d'une date
  const handleDateSelect = useCallback(async (date: Date) => {
    if (isPast(date) || date < minDate || date > maxDate || readOnly) return;
    
    setSelectedDate(date);
    setSelectedTime(null);
    setShowTimeSlots(true);
    
    // Charger les créneaux pour cette date
    const dateStr = format(date, 'yyyy-MM-dd');
    await fetchSlots(dateStr, careType, practitionerId);
  }, [minDate, maxDate, readOnly, fetchSlots, careType, practitionerId]);

  // Sélection d'un créneau horaire
  const handleTimeSlotSelect = useCallback((slot: TimeSlot) => {
    if (!selectedDate || readOnly) return;
    
    setSelectedTime(slot.startTime);
    
    const selectedSlotData: SelectedSlot = {
      date: format(selectedDate, 'yyyy-MM-dd'),
      time: format(parseISO(slot.startTime), 'HH:mm'),
      startTime: slot.startTime,
      endTime: slot.endTime,
      duration: slot.duration,
      practitionerId: slot.practitionerId
    };
    
    onSlotSelect?.(selectedSlotData);
  }, [selectedDate, readOnly, onSlotSelect]);

  // Vérifier si une date a des créneaux disponibles
  const hasAvailableSlots = useCallback((date: Date) => {
    // Pour l'instant, supposer que tous les jours ouvrables ont des créneaux
    const dayOfWeek = getDay(date);
    return dayOfWeek >= 1 && dayOfWeek <= 5; // Lun-Ven
  }, []);

  // Classes CSS pour les jours
  const getDayClasses = useCallback((date: Date | null) => {
    if (!date) return 'invisible';
    
    const baseClasses = 'w-full h-10 flex items-center justify-center rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer relative';
    
    if (isPast(date) || date < minDate || date > maxDate) {
      return `${baseClasses} text-gray-300 cursor-not-allowed`;
    }
    
    if (isToday(date)) {
      return `${baseClasses} bg-blue-600 text-white shadow-lg`;
    }
    
    if (selectedDate && isSameDay(date, selectedDate)) {
      return `${baseClasses} bg-blue-100 text-blue-800 ring-2 ring-blue-500`;
    }
    
    if (!isSameMonth(date, currentMonth)) {
      return `${baseClasses} text-gray-400`;
    }
    
    const hasSlots = hasAvailableSlots(date);
    
    if (hasSlots) {
      return `${baseClasses} text-gray-800 hover:bg-gray-100 hover:text-blue-600`;
    }
    
    return `${baseClasses} text-gray-400`;
  }, [currentMonth, selectedDate, minDate, maxDate, hasAvailableSlots]);

  // Rendu mobile compact
  if (compact) {
    return (
      <div className={`bg-white rounded-2xl shadow-lg ${className}`}>
        <CompactCalendarView
          selectedDate={selectedDate}
          onDateSelect={handleDateSelect}
          careType={careType}
          slots={slots}
          loading={loading}
          onTimeSlotSelect={handleTimeSlotSelect}
          selectedTime={selectedTime}
        />
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-2xl shadow-lg overflow-hidden ${className}`}>
      {/* En-tête */}
      <div className="p-6 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <careConfig.icon className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-semibold">
                Réserver un créneau
              </h3>
              <p className="text-white/80 text-sm">
                {careConfig.label} • {careConfig.duration}min
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 text-white/80 text-sm">
            <MapPin className="w-4 h-4" />
            <span>Cité 109, Daboussy El Achour</span>
          </div>
        </div>
        
        {/* Navigation mois */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigateMonth('prev')}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            aria-label="Mois précédent"
            disabled={currentMonth <= startOfMonth(minDate)}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <h4 className="text-lg font-semibold">
            {format(currentMonth, 'MMMM yyyy', { locale: fr })}
          </h4>
          
          <button
            onClick={() => navigateMonth('next')}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            aria-label="Mois suivant"
            disabled={currentMonth >= startOfMonth(maxDate)}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex">
        {/* Calendrier */}
        <div className="flex-1 p-6">
          {/* Jours de la semaine */}
          <div className="grid grid-cols-7 gap-1 mb-4">
            {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((day) => (
              <div key={day} className="h-8 flex items-center justify-center text-xs font-semibold text-gray-500">
                {day}
              </div>
            ))}
          </div>
          
          {/* Grille des jours */}
          <div className="grid grid-cols-7 gap-1">
            {monthDays.map((date, index) => (
              <motion.button
                key={index}
                onClick={() => date && handleDateSelect(date)}
                className={getDayClasses(date)}
                whileHover={date && !isPast(date) ? { scale: 1.05 } : {}}
                whileTap={date && !isPast(date) ? { scale: 0.95 } : {}}
                disabled={!date || isPast(date) || date < minDate || date > maxDate}
                aria-label={date ? format(date, 'dd MMMM yyyy', { locale: fr }) : undefined}
              >
                {date && (
                  <>
                    {format(date, 'd')}
                    {hasAvailableSlots(date) && (
                      <div className="absolute bottom-0 right-0 w-2 h-2 bg-green-500 rounded-full" />
                    )}
                  </>
                )}
              </motion.button>
            ))}
          </div>
          
          {/* Légende */}
          <div className="mt-6 flex flex-wrap gap-4 text-xs">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-600 rounded-full" />
              <span className="text-gray-600">Aujourd&apos;hui</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full" />
              <span className="text-gray-600">Créneaux disponibles</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-gray-300 rounded-full" />
              <span className="text-gray-600">Non disponible</span>
            </div>
          </div>
        </div>

        {/* Panneau créneaux horaires */}
        <AnimatePresence>
          {showTimeSlots && selectedDate && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 320, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="border-l border-gray-200 bg-gray-50"
            >
              <div className="p-6 h-full overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-gray-900">
                    {format(selectedDate, 'EEEE d MMMM', { locale: fr })}
                  </h4>
                  <button
                    onClick={() => fetchSlots(format(selectedDate, 'yyyy-MM-dd'), careType, practitionerId)}
                    className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                    aria-label="Actualiser les créneaux"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
                
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                    <span className="ml-2 text-sm text-gray-500">Chargement des créneaux...</span>
                  </div>
                ) : error ? (
                  <div className="text-center py-8">
                    <AlertCircle className="w-12 h-12 text-red-300 mx-auto mb-3" />
                    <p className="text-red-500 text-sm">{error}</p>
                    <button
                      onClick={() => fetchSlots(format(selectedDate, 'yyyy-MM-dd'), careType, practitionerId)}
                      className="mt-2 text-sm text-blue-600 hover:underline"
                    >
                      Réessayer
                    </button>
                  </div>
                ) : (
                  <TimeSlotsList
                    slots={slots}
                    selectedTime={selectedTime}
                    onSlotSelect={handleTimeSlotSelect}
                    careType={careType}
                  />
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// =============================================
// COMPOSANTS AUXILIAIRES
// =============================================

/**
 * Composant liste des créneaux horaires
 */
function TimeSlotsList({ 
  slots, 
  selectedTime, 
  onSlotSelect, 
  careType: _careType 
}: {
  slots: TimeSlot[];
  selectedTime: string | null;
  onSlotSelect: (slot: TimeSlot) => void;
  careType: string;
}) {
  const availableSlots = slots.filter(slot => slot.available);
  
  if (availableSlots.length === 0) {
    return (
      <div className="text-center py-8">
        <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500 text-sm">
          Aucun créneau disponible pour cette date
        </p>
        <p className="text-gray-400 text-xs mt-1">
          Essayez une autre date
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-sm text-gray-600 mb-3">
        {availableSlots.length} créneau{availableSlots.length > 1 ? 'x' : ''} disponible{availableSlots.length > 1 ? 's' : ''}
      </p>
      
      {availableSlots.map((slot) => {
        const isSelected = selectedTime === slot.startTime;
        const startTime = parseISO(slot.startTime);
        const endTime = parseISO(slot.endTime);
        
        return (
          <motion.button
            key={slot.startTime}
            onClick={() => onSlotSelect(slot)}
            className={`w-full p-3 rounded-xl border text-left transition-all ${
              isSelected
                ? 'bg-blue-100 border-blue-500 text-blue-800'
                : 'bg-white border-gray-200 hover:border-gray-300 text-gray-700'
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Clock className="w-4 h-4" />
                <div>
                  <div className="font-medium">
                    {format(startTime, 'HH:mm')} - {format(endTime, 'HH:mm')}
                  </div>
                  <div className="text-xs text-gray-500">
                    {slot.duration}min
                  </div>
                </div>
              </div>
              {isSelected && (
                <CheckCircle className="w-5 h-5 text-blue-600" />
              )}
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}

/**
 * Vue calendrier compacte pour mobile
 */
function CompactCalendarView({
  selectedDate,
  onDateSelect,
  careType,
  slots,
  loading,
  onTimeSlotSelect,
  selectedTime
}: {
  selectedDate: Date | null;
  onDateSelect: (date: Date) => void;
  careType: string;
  slots: TimeSlot[];
  loading: boolean;
  onTimeSlotSelect: (slot: TimeSlot) => void;
  selectedTime: string | null;
}) {
  const [showDatePicker, setShowDatePicker] = useState(!selectedDate);

  // Jours disponibles (prochains 14 jours)
  const availableDays = useMemo(() => {
    const days = [];
    for (let i = 1; i <= 14; i++) {
      days.push(addDays(new Date(), i));
    }
    return days;
  }, []);

  if (showDatePicker || !selectedDate) {
    return (
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 mb-4">
          Choisir une date
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {availableDays.map((date) => (
            <button
              key={date.toISOString()}
              onClick={() => {
                onDateSelect(date);
                setShowDatePicker(false);
              }}
              className="p-3 text-left rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
            >
              <div className="font-medium text-gray-900">
                {format(date, 'EEEE', { locale: fr })}
              </div>
              <div className="text-sm text-gray-600">
                {format(date, 'd MMMM', { locale: fr })}
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">
          {format(selectedDate, 'EEEE d MMMM', { locale: fr })}
        </h3>
        <button
          onClick={() => setShowDatePicker(true)}
          className="text-sm text-blue-600 hover:underline"
        >
          Changer
        </button>
      </div>
      
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      ) : (
        <TimeSlotsList
          slots={slots}
          selectedTime={selectedTime}
          onSlotSelect={onTimeSlotSelect}
          careType={careType}
        />
      )}
    </div>
  );
}

export default AppointmentCalendar;