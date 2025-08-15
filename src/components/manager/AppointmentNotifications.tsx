'use client';

import React from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { X, CheckCircle, XCircle, AlertCircle, Info, Calendar, Clock, User, Bell } from 'lucide-react';

export interface NotificationMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  category: 'appointment' | 'system' | 'reminder' | 'status_change' | 'conflict';
  title: string;
  message: string;
  timestamp: Date;
  appointmentId?: string;
  patientName?: string;
  isRead?: boolean;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  autoRemove?: boolean;
  actions?: NotificationAction[];
}

export interface NotificationAction {
  id: string;
  label: string;
  type: 'primary' | 'secondary' | 'danger';
  onClick: () => void;
}

interface AppointmentNotificationsProps {
  notifications: NotificationMessage[];
  onClose: () => void;
  onRemove: (notificationId: string) => void;
  onMarkAsRead?: (notificationId: string) => void;
  onActionClick?: (notificationId: string, actionId: string) => void;
}

export default function AppointmentNotifications({
  notifications,
  onClose,
  onRemove,
  onMarkAsRead,
  onActionClick
}: AppointmentNotificationsProps) {
  const getCategoryIcon = (category: NotificationMessage['category']) => {
    switch (category) {
      case 'appointment':
        return <Calendar className="h-4 w-4" />;
      case 'reminder':
        return <Bell className="h-4 w-4" />;
      case 'status_change':
        return <Clock className="h-4 w-4" />;
      case 'conflict':
        return <AlertCircle className="h-4 w-4" />;
      case 'system':
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  const getNotificationIcon = (type: NotificationMessage['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case 'info':
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const getPriorityBadge = (priority: NotificationMessage['priority']) => {
    const priorityConfig = {
      low: { label: 'Faible', color: 'bg-gray-100 text-gray-600' },
      medium: { label: 'Moyen', color: 'bg-blue-100 text-blue-600' },
      high: { label: 'Élevé', color: 'bg-orange-100 text-orange-600' },
      urgent: { label: 'Urgent', color: 'bg-red-100 text-red-600' }
    };

    const config = priorityConfig[priority];
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const getNotificationBgColor = (type: NotificationMessage['type']) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'info':
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  return (
    <div className="absolute right-0 top-12 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h3 className="text-sm font-medium text-gray-900">
          Notifications ({notifications.length})
        </h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600"
          title="Fermer"
          aria-label="Fermer le panneau de notifications"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Notifications List */}
      <div className="max-h-80 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            <Info className="h-8 w-8 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">Aucune notification</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 border-l-4 ${getNotificationBgColor(notification.type)} ${
                  notification.isRead === false ? 'bg-opacity-100' : 'bg-opacity-50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <div className="flex-shrink-0 mt-0.5">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className={`text-sm font-medium ${
                          notification.isRead === false ? 'text-gray-900' : 'text-gray-700'
                        }`}>
                          {notification.title}
                        </h4>
                        <div className="flex items-center space-x-2">
                          <div className="flex items-center text-gray-400">
                            {getCategoryIcon(notification.category)}
                          </div>
                          {getPriorityBadge(notification.priority)}
                        </div>
                      </div>

                      <p className="text-sm text-gray-600 mt-1">
                        {notification.message}
                      </p>

                      {notification.patientName && (
                        <p className="text-xs text-gray-500 mt-1">
                          Patient: {notification.patientName}
                        </p>
                      )}

                      <div className="flex items-center justify-between mt-2">
                        <p className="text-xs text-gray-400">
                          {format(notification.timestamp, 'HH:mm', { locale: fr })}
                        </p>

                        {notification.actions && notification.actions.length > 0 && (
                          <div className="flex space-x-2">
                            {notification.actions.map((action) => (
                              <button
                                key={action.id}
                                type="button"
                                onClick={() => onActionClick?.(notification.id, action.id)}
                                className={`px-2 py-1 text-xs rounded ${
                                  action.type === 'primary'
                                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                                    : action.type === 'danger'
                                    ? 'bg-red-600 text-white hover:bg-red-700'
                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }`}
                              >
                                {action.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {notification.isRead === false && onMarkAsRead && (
                        <button
                          type="button"
                          onClick={() => onMarkAsRead(notification.id)}
                          className="text-xs text-blue-600 hover:text-blue-800 mt-1"
                        >
                          Marquer comme lu
                        </button>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onRemove(notification.id)}
                    className="flex-shrink-0 ml-2 text-gray-400 hover:text-gray-600"
                    title="Supprimer la notification"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="p-3 border-t border-gray-200 bg-gray-50">
          <button
            type="button"
            onClick={() => {
              notifications.forEach(notification => onRemove(notification.id));
            }}
            className="text-xs text-gray-600 hover:text-gray-800 w-full text-center"
          >
            Effacer toutes les notifications
          </button>
        </div>
      )}
    </div>
  );
}