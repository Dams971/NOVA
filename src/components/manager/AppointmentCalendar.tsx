'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, addWeeks, subWeeks, startOfDay, addMinutes } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, AlertTriangle } from 'lucide-react';
import { AppointmentService, CalendarEvent } from '@/lib/services/appointment-service';
import { AppointmentStatus } from '@/lib/models/appointment';

interface AppointmentCalendarProps {
  cabinetId: string;
  onEventClick: (event: CalendarEvent) => void;
  onTimeSlotClick: (date: Date, time: string) => void;
  onEventDrop: (eventId: string, newDateTime: Date) => void;
}

interface TimeSlot {
  time: string;
  hour: number;
  minute: number;
}

// Helper function to get CSS classes for event colors based on status
const getEventColorClass = (status: AppointmentStatus): string => {
  switch (status) {
    case 'scheduled':
      return 'bg-blue-100 border-l-blue-500 text-blue-900';
    case 'confirmed':
      return 'bg-green-100 border-l-green-500 text-green-900';
    case 'completed':
      return 'bg-gray-100 border-l-gray-500 text-gray-900';
    case 'cancelled':
      return 'bg-red-100 border-l-red-500 text-red-900';
    case 'no-show':
      return 'bg-orange-100 border-l-orange-500 text-orange-900';
    default:
      return 'bg-blue-100 border-l-blue-500 text-blue-900';
  }
};

export default function AppointmentCalendar({ 
  cabinetId, 
  onEventClick, 
  onTimeSlotClick, 
  onEventDrop 
}: AppointmentCalendarProps) {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [draggedEvent, setDraggedEvent] = useState<CalendarEvent | null>(null);
  const [dragOverSlot, setDragOverSlot] = useState<{ date: Date; time: string } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragPreview, setDragPreview] = useState<{ x: number; y: number } | null>(null);
  const [conflictSlots, setConflictSlots] = useState<Set<string>>(new Set());

  const appointmentService = AppointmentService.getInstance();

  // Time slots from 8:00 to 18:00 with 30-minute intervals
  const timeSlots: TimeSlot[] = [];
  for (let hour = 8; hour < 18; hour++) {
    timeSlots.push({ time: `${hour.toString().padStart(2, '0')}:00`, hour, minute: 0 });
    timeSlots.push({ time: `${hour.toString().padStart(2, '0')}:30`, hour, minute: 30 });
  }

  const weekDays = eachDayOfInterval({
    start: startOfWeek(currentWeek, { weekStartsOn: 1 }), // Monday
    end: endOfWeek(currentWeek, { weekStartsOn: 1 })
  });

  const loadEvents = useCallback(async () => {
    setLoading(true);
    try {
      const startDate = startOfWeek(currentWeek, { weekStartsOn: 1 });
      const endDate = endOfWeek(currentWeek, { weekStartsOn: 1 });
      
      const result = await appointmentService.getCalendarEvents(cabinetId, startDate, endDate);
      if (result.success && result.data) {
        setEvents(result.data);
      }
    } catch (_error) {
      console.error('Error loading calendar events:', error);
    } finally {
      setLoading(false);
    }
  }, [cabinetId, currentWeek, appointmentService]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const handlePreviousWeek = () => {
    setCurrentWeek(prev => subWeeks(prev, 1));
  };

  const handleNextWeek = () => {
    setCurrentWeek(prev => addWeeks(prev, 1));
  };

  const handleToday = () => {
    setCurrentWeek(new Date());
  };

  const getEventsForTimeSlot = (date: Date, timeSlot: TimeSlot): CalendarEvent[] => {
    return events.filter(event => {
      const eventDate = startOfDay(event.start);
      const slotDate = startOfDay(date);
      const eventHour = event.start.getHours();
      const eventMinute = event.start.getMinutes();
      
      return isSameDay(eventDate, slotDate) && 
             eventHour === timeSlot.hour && 
             eventMinute === timeSlot.minute;
    });
  };

  const checkSlotConflicts = useCallback(async (date: Date, timeSlot: TimeSlot, eventId: string) => {
    if (!draggedEvent) return false;

    const newDateTime = new Date(date);
    newDateTime.setHours(timeSlot.hour, timeSlot.minute, 0, 0);

    try {
      const result = await appointmentService.checkTimeSlotAvailability(
        cabinetId,
        newDateTime,
        draggedEvent.end.getTime() - draggedEvent.start.getTime(),
        draggedEvent.practitionerId,
        eventId
      );
      return !result.success || !result.data;
    } catch (error) {
      return true; // Assume conflict on error
    }
  }, [appointmentService, cabinetId, draggedEvent]);

  const handleDragStart = (event: React.DragEvent, calendarEvent: CalendarEvent) => {
    setDraggedEvent(calendarEvent);
    setIsDragging(true);
    event.dataTransfer.effectAllowed = 'move';

    // Set drag image to be more transparent
    const dragImage = event.currentTarget.cloneNode(true) as HTMLElement;
    dragImage.style.opacity = '0.5';
    event.dataTransfer.setDragImage(dragImage, 0, 0);
  };

  const handleDragOver = async (event: React.DragEvent, date: Date, timeSlot: TimeSlot) => {
    event.preventDefault();

    if (!draggedEvent) return;

    // Check for conflicts
    const hasConflict = await checkSlotConflicts(date, timeSlot, draggedEvent.id);
    const slotKey = `${date.toISOString()}-${timeSlot.time}`;

    if (hasConflict) {
      event.dataTransfer.dropEffect = 'none';
      setConflictSlots(prev => new Set(prev).add(slotKey));
    } else {
      event.dataTransfer.dropEffect = 'move';
      setConflictSlots(prev => {
        const newSet = new Set(prev);
        newSet.delete(slotKey);
        return newSet;
      });
    }

    setDragOverSlot({ date, time: timeSlot.time });
  };

  const handleDragLeave = (event: React.DragEvent) => {
    // Only clear if we're actually leaving the drop zone
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX;
    const y = event.clientY;

    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setDragOverSlot(null);
    }
  };

  const handleDrop = async (event: React.DragEvent, date: Date, timeSlot: TimeSlot) => {
    event.preventDefault();
    setDragOverSlot(null);
    setIsDragging(false);
    setConflictSlots(new Set());

    if (!draggedEvent) return;

    const newDateTime = new Date(date);
    newDateTime.setHours(timeSlot.hour, timeSlot.minute, 0, 0);

    // Final conflict check before dropping
    const hasConflict = await checkSlotConflicts(date, timeSlot, draggedEvent.id);
    if (hasConflict) {
      // Show error feedback - this will be handled by the parent component
      console.warn('Cannot drop appointment due to conflict');
      setDraggedEvent(null);
      return;
    }

    try {
      await onEventDrop(draggedEvent.id, newDateTime);
      await loadEvents(); // Refresh events
    } catch (_error) {
      console.error('Error dropping event:', error);
    }

    setDraggedEvent(null);
  };

  const handleDragEnd = () => {
    setDraggedEvent(null);
    setDragOverSlot(null);
    setIsDragging(false);
    setConflictSlots(new Set());
  };

  const getStatusBadge = (status: AppointmentStatus) => {
    const statusConfig = {
      [AppointmentStatus.SCHEDULED]: { label: 'Programmé', color: 'bg-blue-100 text-blue-800' },
      [AppointmentStatus.CONFIRMED]: { label: 'Confirmé', color: 'bg-green-100 text-green-800' },
      [AppointmentStatus.IN_PROGRESS]: { label: 'En cours', color: 'bg-yellow-100 text-yellow-800' },
      [AppointmentStatus.COMPLETED]: { label: 'Terminé', color: 'bg-gray-100 text-gray-800' },
      [AppointmentStatus.CANCELLED]: { label: 'Annulé', color: 'bg-red-100 text-red-800' },
      [AppointmentStatus.NO_SHOW]: { label: 'Absent', color: 'bg-red-100 text-red-800' }
    };

    const config = statusConfig[status];
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Calendar Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center space-x-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <CalendarIcon className="h-5 w-5 mr-2" />
            Planning des rendez-vous
          </h2>
          <button
            type="button"
            onClick={handleToday}
            className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Aujourd'hui
          </button>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handlePreviousWeek}
              className="p-2 hover:bg-gray-100 rounded-md"
              title="Semaine précédente"
              aria-label="Naviguer vers la semaine précédente"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm font-medium min-w-[200px] text-center">
              {format(startOfWeek(currentWeek, { weekStartsOn: 1 }), 'dd MMM', { locale: fr })} - {' '}
              {format(endOfWeek(currentWeek, { weekStartsOn: 1 }), 'dd MMM yyyy', { locale: fr })}
            </span>
            <button
              type="button"
              onClick={handleNextWeek}
              className="p-2 hover:bg-gray-100 rounded-md"
              title="Semaine suivante"
              aria-label="Naviguer vers la semaine suivante"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="overflow-x-auto">
        <div className="min-w-[800px]">
          {/* Days Header */}
          <div className="grid grid-cols-8 border-b">
            <div className="p-3 text-sm font-medium text-gray-500 border-r">Heure</div>
            {weekDays.map((day) => (
              <div key={day.toISOString()} className="p-3 text-center border-r last:border-r-0">
                <div className="text-sm font-medium text-gray-900">
                  {format(day, 'EEEE', { locale: fr })}
                </div>
                <div className="text-lg font-semibold text-gray-700">
                  {format(day, 'dd', { locale: fr })}
                </div>
              </div>
            ))}
          </div>

          {/* Time Slots */}
          <div className="divide-y">
            {timeSlots.map((timeSlot) => (
              <div key={timeSlot.time} className="grid grid-cols-8 min-h-[60px]">
                {/* Time Column */}
                <div className="p-3 text-sm text-gray-500 border-r flex items-center">
                  {timeSlot.time}
                </div>
                
                {/* Day Columns */}
                {weekDays.map((day) => {
                  const slotEvents = getEventsForTimeSlot(day, timeSlot);
                  const slotKey = `${day.toISOString()}-${timeSlot.time}`;
                  const isDragOver = dragOverSlot &&
                    isSameDay(dragOverSlot.date, day) &&
                    dragOverSlot.time === timeSlot.time;
                  const hasConflict = conflictSlots.has(slotKey);
                  const isBeingDragged = isDragging && slotEvents.some(event => event.id === draggedEvent?.id);

                  let slotClassName = 'border-r last:border-r-0 p-1 min-h-[60px] relative cursor-pointer transition-all duration-200';

                  if (isBeingDragged) {
                    slotClassName += ' opacity-50 scale-95';
                  } else if (isDragOver && hasConflict) {
                    slotClassName += ' bg-red-50 border-red-300 border-2';
                  } else if (isDragOver) {
                    slotClassName += ' bg-green-50 border-green-300 border-2';
                  } else if (isDragging && slotEvents.length === 0) {
                    slotClassName += ' hover:bg-blue-25 hover:border-blue-200';
                  } else {
                    slotClassName += ' hover:bg-gray-50';
                  }

                  return (
                    <div
                      key={slotKey}
                      className={slotClassName}
                      onClick={() => !isDragging && onTimeSlotClick(day, timeSlot.time)}
                      onDragOver={(e) => handleDragOver(e, day, timeSlot)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, day, timeSlot)}
                    >
                      {slotEvents.length === 0 && !isDragOver && (
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                          <Plus className="h-4 w-4 text-gray-400" />
                        </div>
                      )}

                      {isDragOver && hasConflict && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="bg-red-100 border border-red-300 rounded-full p-1">
                            <AlertTriangle className="h-4 w-4 text-red-600" />
                          </div>
                        </div>
                      )}

                      {isDragOver && !hasConflict && slotEvents.length === 0 && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="bg-green-100 border border-green-300 rounded-full p-1">
                            <Plus className="h-4 w-4 text-green-600" />
                          </div>
                        </div>
                      )}
                      
                      {slotEvents.map((event) => {
                        const isCurrentlyDragged = draggedEvent?.id === event.id;

                        return (
                          <div
                            key={event.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, event)}
                            onDragEnd={handleDragEnd}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!isDragging) {
                                onEventClick(event);
                              }
                            }}
                            className={`mb-1 p-2 rounded text-xs cursor-move hover:shadow-md transition-all duration-200 border-l-4 ${
                              isCurrentlyDragged ? 'opacity-50 scale-95 shadow-lg' : ''
                            } ${getEventColorClass(event.status)}`}
                          >
                            <div className="font-medium truncate">{event.patientName}</div>
                            <div className="text-gray-600 truncate">{event.serviceType}</div>
                            <div className="mt-1">
                              {getStatusBadge(event.status)}
                            </div>
                            {isCurrentlyDragged && (
                              <div className="absolute inset-0 bg-blue-200 opacity-20 rounded pointer-events-none"></div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="p-4 border-t bg-gray-50">
        <div className="flex flex-wrap gap-4 text-xs">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-blue-200 border-l-2 border-blue-600 mr-2"></div>
            <span>Programmé</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-200 border-l-2 border-green-600 mr-2"></div>
            <span>Confirmé</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-yellow-200 border-l-2 border-yellow-600 mr-2"></div>
            <span>En cours</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-gray-200 border-l-2 border-gray-600 mr-2"></div>
            <span>Terminé</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-red-200 border-l-2 border-red-600 mr-2"></div>
            <span>Annulé/Absent</span>
          </div>
        </div>
      </div>
    </div>
  );
}