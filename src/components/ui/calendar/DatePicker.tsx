'use client';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths,
  startOfWeek,
  endOfWeek,
  addDays,
  subDays,
  isToday,
  getDay
} from 'date-fns';
import React, { fr } from 'date-fns/locale';

interface DatePickerProps {
  label: string;
  value?: Date;
  onChange: (date: Date) => void;
  minDate?: Date;
  maxDate?: Date;
  disabledDates?: Date[];
  error?: string;
  hint?: string;
  required?: boolean;
}

export default function DatePicker({ 
  label, 
  value, 
  onChange, 
  minDate, 
  maxDate, 
  disabledDates = [],
  error,
  hint,
  required
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(value || new Date());
  const [focusedDate, setFocusedDate] = useState<Date | null>(value || null);
  
  const dialogRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  // Generate calendar days including padding days for complete weeks
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 }); // Start week on Monday
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  // Check if a date is disabled
  const isDateDisabled = useCallback((date: Date) => {
    if (minDate && date < minDate) return true;
    if (maxDate && date > maxDate) return true;
    return disabledDates.some(d => isSameDay(d, date));
  }, [minDate, maxDate, disabledDates]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!focusedDate) return;

      switch (e.key) {
        case 'Escape':
          setIsOpen(false);
          triggerRef.current?.focus();
          break;
        
        case 'Enter':
        case ' ':
          if (!isDateDisabled(focusedDate) && isSameMonth(focusedDate, currentMonth)) {
            onChange(focusedDate);
            setIsOpen(false);
            triggerRef.current?.focus();
          }
          e.preventDefault();
          break;
        
        case 'ArrowLeft':
          setFocusedDate(subDays(focusedDate, 1));
          e.preventDefault();
          break;
        
        case 'ArrowRight':
          setFocusedDate(addDays(focusedDate, 1));
          e.preventDefault();
          break;
        
        case 'ArrowUp':
          setFocusedDate(subDays(focusedDate, 7));
          e.preventDefault();
          break;
        
        case 'ArrowDown':
          setFocusedDate(addDays(focusedDate, 7));
          e.preventDefault();
          break;
        
        case 'Home':
          setFocusedDate(startOfWeek(focusedDate, { weekStartsOn: 1 }));
          e.preventDefault();
          break;
        
        case 'End':
          setFocusedDate(endOfWeek(focusedDate, { weekStartsOn: 1 }));
          e.preventDefault();
          break;
        
        case 'PageUp':
          const prevMonth = subMonths(focusedDate, 1);
          setFocusedDate(prevMonth);
          setCurrentMonth(prevMonth);
          e.preventDefault();
          break;
        
        case 'PageDown':
          const nextMonth = addMonths(focusedDate, 1);
          setFocusedDate(nextMonth);
          setCurrentMonth(nextMonth);
          e.preventDefault();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, focusedDate, currentMonth, isDateDisabled, onChange]);

  // Focus management
  useEffect(() => {
    if (isOpen && gridRef.current) {
      // Focus the grid container for keyboard navigation
      gridRef.current.focus();
    }
  }, [isOpen]);

  // Auto-navigate to month containing focused date
  useEffect(() => {
    if (focusedDate && !isSameMonth(focusedDate, currentMonth)) {
      setCurrentMonth(focusedDate);
    }
  }, [focusedDate, currentMonth]);

  const handleDateClick = (date: Date) => {
    if (!isDateDisabled(date) && isSameMonth(date, currentMonth)) {
      onChange(date);
      setIsOpen(false);
      triggerRef.current?.focus();
    }
  };

  const getDayAriaLabel = (date: Date) => {
    const dayLabel = format(date, 'EEEE d MMMM yyyy', { locale: fr });
    const status = [];
    
    if (isToday(date)) status.push('aujourd\'hui');
    if (value && isSameDay(date, value)) status.push('sélectionné');
    if (isDateDisabled(date)) status.push('indisponible');
    if (!isSameMonth(date, currentMonth)) status.push('mois différent');
    
    return `${dayLabel}${status.length ? `, ${status.join(', ')}` : ''}`;
  };

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
        {required && (
          <span className="text-red-600 ml-1" aria-label="requis" role="img">*</span>
        )}
      </label>
      
      {hint && (
        <p className="text-sm text-gray-500 mb-2">
          {hint}
        </p>
      )}
      
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-label={value ? `Date sélectionnée: ${format(value, 'dd MMMM yyyy', { locale: fr })}` : 'Sélectionner une date'}
        className={`
          flex items-center justify-between w-full px-3 py-2 border rounded-md 
          bg-white transition-colors duration-200
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
          min-h-touch-ios sm:min-h-touch-android
          ${error 
            ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
            : 'border-gray-300 hover:border-gray-400 focus:border-blue-500'
          }
        `}
      >
        <span className="flex items-center">
          <Calendar className="w-4 h-4 mr-2 text-gray-400" aria-hidden="true" />
          <span className={value ? 'text-gray-900' : 'text-gray-500'}>
            {value ? format(value, 'dd/MM/yyyy') : 'Sélectionner une date'}
          </span>
        </span>
      </button>

      {error && (
        <div className="flex items-start space-x-2 text-red-600 mt-2">
          <span className="text-sm font-medium">{error}</span>
        </div>
      )}

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          
          {/* Calendar dialog */}
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label="Calendrier de sélection de date"
            className="absolute top-full mt-2 z-50 bg-white rounded-lg shadow-lg border border-gray-200 p-4 min-w-[280px]"
          >
            {/* Month navigation */}
            <div className="flex items-center justify-between mb-4">
              <button
                type="button"
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                aria-label="Mois précédent"
                className="p-2 hover:bg-gray-100 rounded-md 
                          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                          min-h-touch-ios min-w-touch-ios sm:min-h-touch-android sm:min-w-touch-android"
              >
                <ChevronLeft className="w-5 h-5" aria-hidden="true" />
              </button>
              
              <h2 
                className="text-lg font-semibold text-gray-900"
                id="month-year-label"
              >
                {format(currentMonth, 'MMMM yyyy', { locale: fr })}
              </h2>
              
              <button
                type="button"
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                aria-label="Mois suivant"
                className="p-2 hover:bg-gray-100 rounded-md 
                          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                          min-h-touch-ios min-w-touch-ios sm:min-h-touch-android sm:min-w-touch-android"
              >
                <ChevronRight className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            {/* Calendar grid */}
            <div
              ref={gridRef}
              role="grid"
              aria-labelledby="month-year-label"
              tabIndex={0}
              className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
            >
              {/* Weekday headers */}
              <div role="row" className="grid grid-cols-7 mb-2">
                {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(day => (
                  <div key={day} role="columnheader" className="text-center text-xs font-medium text-gray-500 py-2">
                    <abbr title={day}>{day.charAt(0)}</abbr>
                  </div>
                ))}
              </div>
              
              {/* Calendar days */}
              <div className="grid grid-cols-7 gap-1">
                {days.map((day, index) => {
                  const isCurrentMonth = isSameMonth(day, currentMonth);
                  const isSelected = value && isSameDay(day, value);
                  const isDisabled = isDateDisabled(day);
                  const isFocused = focusedDate && isSameDay(day, focusedDate);
                  const isDayToday = isToday(day);
                  
                  return (
                    <button
                      key={day.toISOString()}
                      role="gridcell"
                      type="button"
                      tabIndex={isFocused ? 0 : -1}
                      aria-label={getDayAriaLabel(day)}
                      aria-selected={isSelected}
                      disabled={isDisabled || !isCurrentMonth}
                      onClick={() => handleDateClick(day)}
                      className={`
                        w-10 h-10 text-sm rounded-md transition-colors duration-200
                        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                        ${isCurrentMonth 
                          ? 'text-gray-900' 
                          : 'text-gray-300 cursor-default'
                        }
                        ${isSelected 
                          ? 'bg-blue-600 text-white font-semibold' 
                          : isDisabled 
                            ? 'text-gray-300 cursor-not-allowed'
                            : 'hover:bg-gray-100'
                        }
                        ${isDayToday && !isSelected 
                          ? 'font-semibold bg-blue-50 text-blue-600' 
                          : ''
                        }
                        ${isFocused && !isSelected 
                          ? 'ring-2 ring-blue-500 ring-offset-2' 
                          : ''
                        }
                      `}
                    >
                      {format(day, 'd')}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}