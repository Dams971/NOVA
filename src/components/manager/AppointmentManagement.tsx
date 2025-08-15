'use client';

import React, { useState, useCallback } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Calendar, List, Filter, Search, Bell, CheckCircle, XCircle } from 'lucide-react';
import { Appointment, AppointmentStatus } from '@/lib/models/appointment';
import { AppointmentService, CalendarEvent } from '@/lib/services/appointment-service';
import { NotificationService } from '@/lib/services/notification-service';
import AppointmentCalendar from './AppointmentCalendar';
import AppointmentForm from './AppointmentForm';
import AppointmentList from './AppointmentList';
import AppointmentNotifications, { NotificationMessage } from './AppointmentNotifications';

interface AppointmentManagementProps {
  cabinetId: string;
}

type ViewMode = 'calendar' | 'list';

// Remove the local interface since we're importing it from AppointmentNotifications

export default function AppointmentManagement({ cabinetId }: AppointmentManagementProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('calendar');
  const [showForm, setShowForm] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [formInitialDate, setFormInitialDate] = useState<Date | undefined>();
  const [formInitialTime, setFormInitialTime] = useState<string | undefined>();
  const [notifications, setNotifications] = useState<NotificationMessage[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  const appointmentService = AppointmentService.getInstance();
  const notificationService = NotificationService.getInstance();

  const addNotification = useCallback((notification: Omit<NotificationMessage, 'id' | 'timestamp' | 'isRead'>) => {
    const newNotification: NotificationMessage = {
      ...notification,
      id: Date.now().toString(),
      timestamp: new Date(),
      isRead: false,
      category: notification.category || 'system',
      priority: notification.priority || 'medium',
      autoRemove: notification.autoRemove ?? (notification.type === 'success')
    };

    setNotifications(prev => [newNotification, ...prev.slice(0, 9)]); // Keep only 10 most recent

    // Auto-remove notifications if configured
    if (newNotification.autoRemove) {
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== newNotification.id));
      }, 5000);
    }
  }, []);

  const handleEventClick = (event: CalendarEvent) => {
    appointmentService.getAppointmentById(event.id).then(result => {
      if (result.success && result.data) {
        setSelectedAppointment(result.data);
        setShowForm(true);
      }
    });
  };

  const handleTimeSlotClick = (date: Date, time: string) => {
    setSelectedAppointment(null);
    setFormInitialDate(date);
    setFormInitialTime(time);
    setShowForm(true);
  };

  const handleEventDrop = async (eventId: string, newDateTime: Date) => {
    try {
      // First check if the time slot is available
      const appointment = await appointmentService.getAppointmentById(eventId);
      if (!appointment.success || !appointment.data) {
        addNotification({
          type: 'error',
          title: 'Erreur',
          message: 'Rendez-vous introuvable.'
        });
        return;
      }

      const duration = appointment.data.duration;
      const availabilityCheck = await appointmentService.checkTimeSlotAvailability(
        cabinetId,
        newDateTime,
        duration,
        appointment.data.practitionerId,
        eventId
      );

      if (!availabilityCheck.success || !availabilityCheck.data) {
        addNotification({
          type: 'warning',
          category: 'conflict',
          title: 'Conflit détecté',
          message: 'Ce créneau n\'est pas disponible. Veuillez choisir un autre horaire.',
          priority: 'high',
          appointmentId: eventId
        });
        return;
      }

      const result = await appointmentService.rescheduleAppointment(eventId, newDateTime);
      if (result.success) {
        addNotification({
          type: 'success',
          category: 'appointment',
          title: 'Rendez-vous déplacé',
          message: `Le rendez-vous a été reprogrammé pour le ${format(newDateTime, 'dd/MM/yyyy à HH:mm', { locale: fr })}.`,
          priority: 'medium',
          appointmentId: eventId
        });
      } else {
        addNotification({
          type: 'error',
          category: 'appointment',
          title: 'Erreur de reprogrammation',
          message: result.error || 'Impossible de déplacer le rendez-vous.',
          priority: 'high',
          appointmentId: eventId
        });
      }
    } catch (error) {
      addNotification({
        type: 'error',
        category: 'system',
        title: 'Erreur système',
        message: 'Une erreur inattendue s\'est produite lors du déplacement.',
        priority: 'urgent',
        appointmentId: eventId
      });
    }
  };

  const handleAppointmentSave = (appointment: Appointment) => {
    setShowForm(false);
    setSelectedAppointment(null);
    setFormInitialDate(undefined);
    setFormInitialTime(undefined);
    
    addNotification({
      type: 'success',
      title: selectedAppointment ? 'Rendez-vous modifié' : 'Rendez-vous créé',
      message: selectedAppointment 
        ? 'Le rendez-vous a été modifié avec succès.'
        : 'Le nouveau rendez-vous a été créé avec succès.'
    });
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setSelectedAppointment(null);
    setFormInitialDate(undefined);
    setFormInitialTime(undefined);
  };

  const handleAppointmentAction = async (appointmentId: string, action: 'confirm' | 'cancel' | 'complete' | 'no-show') => {
    try {
      let newStatus: AppointmentStatus;
      let actionMessage: string;

      switch (action) {
        case 'confirm':
          newStatus = AppointmentStatus.CONFIRMED;
          actionMessage = 'confirmé';
          break;
        case 'cancel':
          newStatus = AppointmentStatus.CANCELLED;
          actionMessage = 'annulé';
          break;
        case 'complete':
          newStatus = AppointmentStatus.COMPLETED;
          actionMessage = 'marqué comme terminé';
          break;
        case 'no-show':
          newStatus = AppointmentStatus.NO_SHOW;
          actionMessage = 'marqué comme absent';
          break;
        default:
          return;
      }

      const result = await appointmentService.updateAppointment(appointmentId, { status: newStatus });
      if (result.success) {
        addNotification({
          type: 'success',
          title: 'Statut mis à jour',
          message: `Le rendez-vous a été ${actionMessage}.`
        });
      } else {
        addNotification({
          type: 'error',
          title: 'Erreur',
          message: result.error || 'Impossible de mettre à jour le statut.'
        });
      }
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Erreur',
        message: 'Une erreur inattendue s\'est produite.'
      });
    }
  };

  const handleDeleteAppointment = async (appointmentId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce rendez-vous ?')) {
      return;
    }

    try {
      const result = await appointmentService.deleteAppointment(appointmentId);
      if (result.success) {
        addNotification({
          type: 'success',
          title: 'Rendez-vous supprimé',
          message: 'Le rendez-vous a été supprimé avec succès.'
        });
      } else {
        addNotification({
          type: 'error',
          title: 'Erreur',
          message: result.error || 'Impossible de supprimer le rendez-vous.'
        });
      }
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Erreur',
        message: 'Une erreur inattendue s\'est produite.'
      });
    }
  };

  const removeNotification = useCallback((notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  }, []);

  const markNotificationAsRead = useCallback((notificationId: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
    );
  }, []);

  const handleNotificationAction = useCallback((notificationId: string, actionId: string) => {
    const notification = notifications.find(n => n.id === notificationId);
    if (notification?.actions) {
      const action = notification.actions.find(a => a.id === actionId);
      if (action) {
        action.onClick();
        // Remove notification after action is taken
        removeNotification(notificationId);
      }
    }
  }, [notifications, removeNotification]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des rendez-vous</h1>
          <p className="text-gray-600">Planifiez et gérez les rendez-vous de votre cabinet</p>
        </div>
        
        <div className="mt-4 sm:mt-0 flex items-center space-x-3">
          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className={`p-2 rounded-md transition-colors ${
                notifications.length > 0 
                  ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Bell className="h-5 w-5" />
              {notifications.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {notifications.length}
                </span>
              )}
            </button>
            
            {showNotifications && (
              <AppointmentNotifications
                notifications={notifications}
                onClose={() => setShowNotifications(false)}
                onRemove={removeNotification}
                onMarkAsRead={markNotificationAsRead}
                onActionClick={handleNotificationAction}
              />
            )}
          </div>

          {/* View Mode Toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('calendar')}
              className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'calendar'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Calendar className="h-4 w-4 mr-2" />
              Calendrier
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'list'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <List className="h-4 w-4 mr-2" />
              Liste
            </button>
          </div>

          {/* New Appointment Button */}
          <button
            onClick={() => {
              setSelectedAppointment(null);
              setFormInitialDate(undefined);
              setFormInitialTime(undefined);
              setShowForm(true);
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center"
          >
            <Calendar className="h-4 w-4 mr-2" />
            Nouveau rendez-vous
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-lg shadow">
        {viewMode === 'calendar' ? (
          <AppointmentCalendar
            cabinetId={cabinetId}
            onEventClick={handleEventClick}
            onTimeSlotClick={handleTimeSlotClick}
            onEventDrop={handleEventDrop}
          />
        ) : (
          <AppointmentList
            cabinetId={cabinetId}
            onAppointmentClick={handleEventClick}
            onAppointmentAction={handleAppointmentAction}
            onDeleteAppointment={handleDeleteAppointment}
          />
        )}
      </div>

      {/* Appointment Form Modal */}
      {showForm && (
        <AppointmentForm
          appointment={selectedAppointment || undefined}
          cabinetId={cabinetId}
          initialDate={formInitialDate}
          initialTime={formInitialTime}
          onSave={handleAppointmentSave}
          onCancel={handleFormCancel}
        />
      )}
    </div>
  );
}