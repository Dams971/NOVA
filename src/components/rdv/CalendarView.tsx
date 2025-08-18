import { ChevronLeft, ChevronRight, Calendar, Clock } from 'lucide-react';
import { useState } from 'react';
import { ButtonMedical } from '@/components/ui/nova';
import { cn } from '@/lib/utils';

interface TimeSlot {
  id: string;
  time: string;
  available: boolean;
  type: 'morning' | 'afternoon';
}

const timeSlots: TimeSlot[] = [
  { id: '1', time: '09:00', available: true, type: 'morning' },
  { id: '2', time: '09:30', available: true, type: 'morning' },
  { id: '3', time: '10:00', available: false, type: 'morning' },
  { id: '4', time: '10:30', available: true, type: 'morning' },
  { id: '5', time: '11:00', available: true, type: 'morning' },
  { id: '6', time: '11:30', available: false, type: 'morning' },
  { id: '7', time: '14:00', available: true, type: 'afternoon' },
  { id: '8', time: '14:30', available: true, type: 'afternoon' },
  { id: '9', time: '15:00', available: true, type: 'afternoon' },
  { id: '10', time: '15:30', available: false, type: 'afternoon' },
  { id: '11', time: '16:00', available: true, type: 'afternoon' },
  { id: '12', time: '16:30', available: true, type: 'afternoon' },
];

export function CalendarView() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const goToPreviousDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 1);
    setSelectedDate(newDate);
    setSelectedSlot(null);
  };

  const goToNextDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 1);
    setSelectedDate(newDate);
    setSelectedSlot(null);
  };

  const morningSlots = timeSlots.filter(slot => slot.type === 'morning');
  const afternoonSlots = timeSlots.filter(slot => slot.type === 'afternoon');

  return (
    <div className="space-y-6">
      {/* Header avec navigation de date */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-neutral-900 flex items-center gap-2">
          <Calendar className="w-6 h-6 text-primary-600" aria-hidden="true" />
          Sélection du créneau
        </h2>
      </div>

      {/* Navigation date */}
      <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-medical-small">
        <ButtonMedical
          variant="ghost"
          size="sm"
          onClick={goToPreviousDay}
          leftIcon={<ChevronLeft className="w-4 h-4" />}
          aria-label="Jour précédent"
        >
          Précédent
        </ButtonMedical>
        
        <div className="text-center">
          <h3 className="font-semibold text-neutral-900 capitalize">
            {formatDate(selectedDate)}
          </h3>
          <p className="text-sm text-neutral-600">
            {timeSlots.filter(s => s.available).length} créneaux disponibles
          </p>
        </div>

        <ButtonMedical
          variant="ghost"
          size="sm"
          onClick={goToNextDay}
          rightIcon={<ChevronRight className="w-4 h-4" />}
          aria-label="Jour suivant"
        >
          Suivant
        </ButtonMedical>
      </div>

      {/* Créneaux du matin */}
      <div>
        <h3 className="text-lg font-medium text-neutral-900 mb-3 flex items-center gap-2">
          <Clock className="w-5 h-5 text-warning-600" aria-hidden="true" />
          Matin (9h00 - 12h00)
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {morningSlots.map((slot) => (
            <button
              key={slot.id}
              onClick={() => slot.available && setSelectedSlot(slot.id)}
              disabled={!slot.available}
              className={cn(
                "p-3 rounded-medical-small border transition-all duration-200 text-center",
                "focus:outline-none focus:ring-2 focus:ring-primary-600 focus:ring-offset-1",
                slot.available
                  ? selectedSlot === slot.id
                    ? "bg-primary-600 text-white border-primary-600 shadow-medical-info"
                    : "bg-white border-neutral-200 hover:border-primary-300 hover:bg-primary-50"
                  : "bg-neutral-100 border-neutral-200 text-neutral-400 cursor-not-allowed"
              )}
              aria-pressed={selectedSlot === slot.id}
              aria-label={`Créneau ${slot.time} ${slot.available ? 'disponible' : 'indisponible'}`}
            >
              <div className="font-medium">{slot.time}</div>
              {!slot.available && (
                <div className="text-xs mt-1">Occupé</div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Créneaux de l'après-midi */}
      <div>
        <h3 className="text-lg font-medium text-neutral-900 mb-3 flex items-center gap-2">
          <Clock className="w-5 h-5 text-secondary-600" aria-hidden="true" />
          Après-midi (14h00 - 17h00)
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {afternoonSlots.map((slot) => (
            <button
              key={slot.id}
              onClick={() => slot.available && setSelectedSlot(slot.id)}
              disabled={!slot.available}
              className={cn(
                "p-3 rounded-medical-small border transition-all duration-200 text-center",
                "focus:outline-none focus:ring-2 focus:ring-primary-600 focus:ring-offset-1",
                slot.available
                  ? selectedSlot === slot.id
                    ? "bg-primary-600 text-white border-primary-600 shadow-medical-info"
                    : "bg-white border-neutral-200 hover:border-primary-300 hover:bg-primary-50"
                  : "bg-neutral-100 border-neutral-200 text-neutral-400 cursor-not-allowed"
              )}
              aria-pressed={selectedSlot === slot.id}
              aria-label={`Créneau ${slot.time} ${slot.available ? 'disponible' : 'indisponible'}`}
            >
              <div className="font-medium">{slot.time}</div>
              {!slot.available && (
                <div className="text-xs mt-1">Occupé</div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Résumé de sélection */}
      {selectedSlot && (
        <div className="p-4 bg-success-50 border border-success-200 rounded-medical-small">
          <h4 className="font-medium text-success-900 mb-2">Créneau sélectionné</h4>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-success-800">
                <span className="font-medium">Date :</span> {formatDate(selectedDate)}
              </p>
              <p className="text-success-800">
                <span className="font-medium">Heure :</span> {timeSlots.find(s => s.id === selectedSlot)?.time}
              </p>
            </div>
            <div className="text-2xl" role="img" aria-label="Confirmation">✓</div>
          </div>
        </div>
      )}
    </div>
  );
}