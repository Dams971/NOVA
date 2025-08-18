'use client';

import React, { useState } from 'react';
import { ManagerDashboardLayout, DashboardWidget, CabinetKPIs } from '@/lib/models/performance';

interface WidgetCustomizerProps {
  layout: ManagerDashboardLayout;
  onSave: (layout: ManagerDashboardLayout) => void;
  onClose: () => void;
}

export default function WidgetCustomizer({ layout, onSave, onClose }: WidgetCustomizerProps) {
  const [editedLayout, setEditedLayout] = useState<ManagerDashboardLayout>({
    ...layout,
    widgets: [...layout.widgets]
  });

  const _availableWidgetTypes = [
    { type: 'kpi', label: 'Indicateur KPI', icon: '📊' },
    { type: 'chart', label: 'Graphique', icon: '📈' },
    { type: 'alert', label: 'Alertes', icon: '🚨' },
    { type: 'table', label: 'Tableau', icon: '📋' }
  ];

  const availableKPIMetrics = [
    { key: 'totalAppointments', label: 'Total rendez-vous' },
    { key: 'totalRevenue', label: 'Chiffre d\'affaires' },
    { key: 'totalPatients', label: 'Total patients' },
    { key: 'noShowRate', label: 'Taux de no-show' },
    { key: 'completionRate', label: 'Taux de complétion' },
    { key: 'cancellationRate', label: 'Taux d\'annulation' },
    { key: 'averageAppointmentValue', label: 'Valeur moyenne RDV' },
    { key: 'appointmentUtilization', label: 'Taux d\'occupation' },
    { key: 'averageWaitTime', label: 'Temps d\'attente moyen' },
    { key: 'newPatients', label: 'Nouveaux patients' },
    { key: 'returningPatients', label: 'Patients récurrents' }
  ];

  const chartTypes = [
    { key: 'line', label: 'Ligne' },
    { key: 'bar', label: 'Barres' },
    { key: 'area', label: 'Aires' },
    { key: 'pie', label: 'Camembert' }
  ];

  const timeRanges = [
    { key: 'day', label: 'Jour' },
    { key: 'week', label: 'Semaine' },
    { key: 'month', label: 'Mois' },
    { key: 'quarter', label: 'Trimestre' }
  ];

  const toggleWidgetVisibility = (widgetId: string) => {
    setEditedLayout(prev => ({
      ...prev,
      widgets: prev.widgets.map(widget =>
        widget.id === widgetId
          ? { ...widget, isVisible: !widget.isVisible }
          : widget
      )
    }));
  };

  const updateWidgetConfig = (widgetId: string, config: Partial<DashboardWidget['config']>) => {
    setEditedLayout(prev => ({
      ...prev,
      widgets: prev.widgets.map(widget =>
        widget.id === widgetId
          ? { ...widget, config: { ...widget.config, ...config } }
          : widget
      )
    }));
  };

  const updateWidgetTitle = (widgetId: string, title: string) => {
    setEditedLayout(prev => ({
      ...prev,
      widgets: prev.widgets.map(widget =>
        widget.id === widgetId
          ? { ...widget, title }
          : widget
      )
    }));
  };

  const addNewWidget = () => {
    const newWidget: DashboardWidget = {
      id: `widget-${Date.now()}`,
      type: 'kpi',
      title: 'Nouveau widget',
      position: { x: 0, y: 0, width: 3, height: 2 },
      config: { metric: 'totalAppointments', showTrend: true },
      isVisible: true
    };

    setEditedLayout(prev => ({
      ...prev,
      widgets: [...prev.widgets, newWidget]
    }));
  };

  const removeWidget = (widgetId: string) => {
    setEditedLayout(prev => ({
      ...prev,
      widgets: prev.widgets.filter(widget => widget.id !== widgetId)
    }));
  };

  const handleSave = () => {
    onSave({
      ...editedLayout,
      updatedAt: new Date()
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Personnaliser le tableau de bord
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="space-y-6">
            {/* Add New Widget */}
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Widgets disponibles</h3>
              <button
                onClick={addNewWidget}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Ajouter un widget
              </button>
            </div>

            {/* Widget List */}
            <div className="space-y-4">
              {editedLayout.widgets.map((widget) => (
                <div key={widget.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={widget.isVisible}
                        onChange={() => toggleWidgetVisibility(widget.id)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <input
                        type="text"
                        value={widget.title}
                        onChange={(e) => updateWidgetTitle(widget.id, e.target.value)}
                        className="text-sm font-medium text-gray-900 bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1"
                      />
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {widget.type}
                      </span>
                    </div>
                    <button
                      onClick={() => removeWidget(widget.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>

                  {/* Widget Configuration */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {widget.type === 'kpi' && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Métrique
                          </label>
                          <select
                            value={widget.config.metric || ''}
                            onChange={(e) => updateWidgetConfig(widget.id, { metric: e.target.value as keyof CabinetKPIs })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            {availableKPIMetrics.map((metric) => (
                              <option key={metric.key} value={metric.key}>
                                {metric.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            checked={widget.config.showTrend || false}
                            onChange={(e) => updateWidgetConfig(widget.id, { showTrend: e.target.checked })}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <label className="ml-2 text-sm text-gray-700">
                            Afficher la tendance
                          </label>
                        </div>
                      </>
                    )}

                    {widget.type === 'chart' && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Type de graphique
                          </label>
                          <select
                            value={widget.config.chartType || 'line'}
                            onChange={(e) => updateWidgetConfig(widget.id, { chartType: e.target.value as 'line' | 'bar' | 'pie' | 'area' })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            {chartTypes.map((type) => (
                              <option key={type.key} value={type.key}>
                                {type.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Période
                          </label>
                          <select
                            value={widget.config.timeRange || 'week'}
                            onChange={(e) => updateWidgetConfig(widget.id, { timeRange: e.target.value as 'day' | 'week' | 'month' | 'quarter' | 'year' })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            {timeRanges.map((range) => (
                              <option key={range.key} value={range.key}>
                                {range.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </>
                    )}

                    {widget.type === 'alert' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Types d'alertes
                        </label>
                        <div className="space-y-2">
                          {['critical', 'warning', 'info'].map((type) => (
                            <label key={type} className="flex items-center">
                              <input
                                type="checkbox"
                                checked={widget.config.alertTypes?.includes(type) || false}
                                onChange={(e) => {
                                  const currentTypes = widget.config.alertTypes || [];
                                  const newTypes = e.target.checked
                                    ? [...currentTypes, type]
                                    : currentTypes.filter(t => t !== type);
                                  updateWidgetConfig(widget.id, { alertTypes: newTypes });
                                }}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                              />
                              <span className="ml-2 text-sm text-gray-700 capitalize">
                                {type === 'critical' ? 'Critique' : 
                                 type === 'warning' ? 'Attention' : 'Info'}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end space-x-4 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
          >
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
}