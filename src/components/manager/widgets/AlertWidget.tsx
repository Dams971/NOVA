'use client';

import React from 'react';
import { DashboardWidget } from '@/lib/models/performance';

interface AlertWidgetProps {
  widget: DashboardWidget;
}

export default function AlertWidget({ widget }: AlertWidgetProps) {
  // Mock alert data - in real implementation, this would come from props or context
  const mockAlerts = [
    {
      id: '1',
      type: 'warning' as const,
      title: 'Taux de no-show élevé',
      message: 'Le taux de no-show a augmenté de 5% cette semaine',
      time: '2 heures'
    },
    {
      id: '2',
      type: 'info' as const,
      title: 'Nouveau patient',
      message: '3 nouveaux patients enregistrés aujourd\'hui',
      time: '30 minutes'
    },
    {
      id: '3',
      type: 'critical' as const,
      title: 'Faible taux d\'occupation',
      message: 'Seulement 45% des créneaux sont occupés cette semaine',
      time: '1 heure'
    }
  ];

  const getAlertIcon = (type: 'warning' | 'info' | 'critical') => {
    switch (type) {
      case 'critical':
        return (
          <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        );
      case 'warning':
        return (
          <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        );
      case 'info':
        return (
          <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  const getAlertBadgeColor = (type: 'warning' | 'info' | 'critical') => {
    switch (type) {
      case 'critical':
        return 'bg-red-100 text-red-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      case 'info':
        return 'bg-blue-100 text-blue-800';
    }
  };

  const filteredAlerts = widget.config.alertTypes 
    ? mockAlerts.filter(alert => widget.config.alertTypes!.includes(alert.type))
    : mockAlerts;

  return (
    <div className="h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-900">{widget.title}</h3>
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          {filteredAlerts.length}
        </span>
      </div>
      
      <div className="space-y-3 max-h-64 overflow-y-auto">
        {filteredAlerts.length === 0 ? (
          <div className="text-center py-8">
            <svg className="w-12 h-12 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-gray-500">Aucune alerte active</p>
          </div>
        ) : (
          filteredAlerts.map((alert) => (
            <div key={alert.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
              <div className="flex-shrink-0 mt-0.5">
                {getAlertIcon(alert.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {alert.title}
                  </p>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getAlertBadgeColor(alert.type)}`}>
                    {alert.type === 'critical' ? 'Critique' : 
                     alert.type === 'warning' ? 'Attention' : 'Info'}
                  </span>
                </div>
                <p className="text-xs text-gray-600 mb-1">
                  {alert.message}
                </p>
                <p className="text-xs text-gray-500">
                  Il y a {alert.time}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
      
      {filteredAlerts.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <button className="w-full text-sm text-blue-600 hover:text-blue-800 font-medium">
            Voir toutes les alertes
          </button>
        </div>
      )}
    </div>
  );
}