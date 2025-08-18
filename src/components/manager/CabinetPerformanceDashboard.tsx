'use client';

import React from 'react';
import { CabinetKPIs, ManagerDashboardLayout, DashboardWidget } from '@/lib/models/performance';
import { cn } from '@/lib/utils';
import AlertWidget from './widgets/AlertWidget';
import ChartWidget from './widgets/ChartWidget';
import KPIWidget from './widgets/KPIWidget';

interface CabinetPerformanceDashboardProps {
  kpis: CabinetKPIs;
  layout: ManagerDashboardLayout;
  onLayoutChange: (layout: ManagerDashboardLayout) => void;
}

export default function CabinetPerformanceDashboard({
  kpis,
  layout,
  onLayoutChange: _onLayoutChange
}: CabinetPerformanceDashboardProps) {
  
  const renderWidget = (widget: DashboardWidget) => {
    if (!widget.isVisible) return null;

    const baseClasses = "medical-card p-6";
    const gridClasses = `col-span-${widget.position.width} row-span-${widget.position.height}`;

    switch (widget.type) {
      case 'kpi':
        return (
          <div key={widget.id} className={cn(baseClasses, gridClasses)}>
            <KPIWidget
              widget={widget}
              kpis={kpis}
            />
          </div>
        );
      
      case 'chart':
        return (
          <div key={widget.id} className={cn(baseClasses, gridClasses)}>
            <ChartWidget
              widget={widget}
              kpis={kpis}
            />
          </div>
        );
      
      case 'alert':
        return (
          <div key={widget.id} className={cn(baseClasses, gridClasses)}>
            <AlertWidget
              widget={widget}
            />
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="space-y-8">
      {/* Enhanced KPI Cards with Medical Design */}
      <section aria-labelledby="kpi-overview">
        <h3 id="kpi-overview" className="text-lg font-semibold text-medical-gray-900 mb-6">
          Vue d'ensemble des performances
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Rendez-vous Card */}
          <div className="medical-card p-6 text-center">
            <div className="w-14 h-14 bg-medical-blue-100 rounded-medical-round flex items-center justify-center mx-auto mb-4">
              <span className="text-medical-blue-600 text-2xl">📅</span>
            </div>
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-medical-gray-600">Rendez-vous</h4>
              <p className="text-3xl font-bold text-medical-gray-900">{kpis.totalAppointments}</p>
              {kpis.trends.appointments !== 0 && (
                <div className={cn(
                  "inline-flex items-center gap-1 px-2 py-1 rounded-medical-small text-xs font-medium",
                  kpis.trends.appointments > 0 
                    ? 'bg-medical-green-100 text-medical-green-700' 
                    : 'bg-medical-red-100 text-medical-red-700'
                )}>
                  <span>{kpis.trends.appointments > 0 ? '↗️' : '↘️'}</span>
                  {kpis.trends.appointments > 0 ? '+' : ''}{kpis.trends.appointments.toFixed(1)}%
                </div>
              )}
            </div>
          </div>

          {/* Revenue Card */}
          <div className="medical-card p-6 text-center">
            <div className="w-14 h-14 bg-medical-green-100 rounded-medical-round flex items-center justify-center mx-auto mb-4">
              <span className="text-medical-green-600 text-2xl">💰</span>
            </div>
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-medical-gray-600">Chiffre d&apos;affaires</h4>
              <p className="text-3xl font-bold text-medical-gray-900">
                {new Intl.NumberFormat('fr-DZ', { 
                  style: 'currency', 
                  currency: 'DZD',
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0
                }).format(kpis.totalRevenue)}
              </p>
              {kpis.trends.revenue !== 0 && (
                <div className={cn(
                  "inline-flex items-center gap-1 px-2 py-1 rounded-medical-small text-xs font-medium",
                  kpis.trends.revenue > 0 
                    ? 'bg-medical-green-100 text-medical-green-700' 
                    : 'bg-medical-red-100 text-medical-red-700'
                )}>
                  <span>{kpis.trends.revenue > 0 ? '↗️' : '↘️'}</span>
                  {kpis.trends.revenue > 0 ? '+' : ''}{kpis.trends.revenue.toFixed(1)}%
                </div>
              )}
            </div>
          </div>

          {/* Patients Card */}
          <div className="medical-card p-6 text-center">
            <div className="w-14 h-14 bg-medical-yellow-100 rounded-medical-round flex items-center justify-center mx-auto mb-4">
              <span className="text-medical-yellow-600 text-2xl">👥</span>
            </div>
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-medical-gray-600">Patients actifs</h4>
              <p className="text-3xl font-bold text-medical-gray-900">{kpis.totalPatients}</p>
              <div className="text-xs text-medical-gray-500">
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-medical-blue-100 text-medical-blue-700 rounded-medical-small font-medium">
                  +{kpis.newPatients} nouveaux
                </span>
              </div>
            </div>
          </div>

          {/* No-show Rate Card */}
          <div className="medical-card p-6 text-center">
            <div className={cn(
              "w-14 h-14 rounded-medical-round flex items-center justify-center mx-auto mb-4",
              kpis.noShowRate > 15 ? 'bg-medical-red-100' : 
              kpis.noShowRate > 10 ? 'bg-medical-yellow-100' : 'bg-medical-green-100'
            )}>
              <span className={cn(
                "text-2xl",
                kpis.noShowRate > 15 ? 'text-medical-red-600' : 
                kpis.noShowRate > 10 ? 'text-medical-yellow-600' : 'text-medical-green-600'
              )}>
                {kpis.noShowRate > 15 ? '🚨' : kpis.noShowRate > 10 ? '⚠️' : '✅'}
              </span>
            </div>
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-medical-gray-600">Taux d&apos;absentéisme</h4>
              <p className="text-3xl font-bold text-medical-gray-900">{kpis.noShowRate.toFixed(1)}%</p>
              {kpis.trends.noShowRate !== 0 && (
                <div className={cn(
                  "inline-flex items-center gap-1 px-2 py-1 rounded-medical-small text-xs font-medium",
                  kpis.trends.noShowRate < 0 
                    ? 'bg-medical-green-100 text-medical-green-700' 
                    : 'bg-medical-red-100 text-medical-red-700'
                )}>
                  <span>{kpis.trends.noShowRate < 0 ? '↘️' : '↗️'}</span>
                  {kpis.trends.noShowRate > 0 ? '+' : ''}{kpis.trends.noShowRate.toFixed(1)}%
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Performance Metrics with Medical Design */}
      <section aria-labelledby="performance-metrics">
        <h3 id="performance-metrics" className="text-lg font-semibold text-medical-gray-900 mb-6">
          Métriques détaillées
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Performance Rates */}
          <div className="medical-card p-6">
            <h4 className="text-lg font-medium text-medical-gray-900 mb-6 flex items-center gap-2">
              📊 Taux de performance
            </h4>
            <div className="space-y-6">
              {/* Completion Rate */}
              <div>
                <div className="flex justify-between items-center text-sm mb-2">
                  <span className="text-medical-gray-600 font-medium">Taux de complétion</span>
                  <span className="font-bold text-medical-gray-900">{kpis.completionRate.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-medical-gray-200 rounded-medical-small h-3">
                  <div 
                    className="bg-medical-green-600 h-3 rounded-medical-small transition-all duration-500" 
                    style={{ width: `${kpis.completionRate}%` }}
                  />
                </div>
                <div className="text-xs text-medical-gray-500 mt-1">
                  {kpis.completionRate > 90 ? 'Excellent' : kpis.completionRate > 80 ? 'Bon' : 'À améliorer'}
                </div>
              </div>
              
              {/* Utilization Rate */}
              <div>
                <div className="flex justify-between items-center text-sm mb-2">
                  <span className="text-medical-gray-600 font-medium">Taux d&apos;occupation</span>
                  <span className="font-bold text-medical-gray-900">{kpis.appointmentUtilization}%</span>
                </div>
                <div className="w-full bg-medical-gray-200 rounded-medical-small h-3">
                  <div 
                    className={cn(
                      "h-3 rounded-medical-small transition-all duration-500",
                      kpis.appointmentUtilization > 80 ? 'bg-medical-green-600' : 
                      kpis.appointmentUtilization > 60 ? 'bg-medical-yellow-500' : 'bg-medical-red-500'
                    )}
                    style={{ width: `${kpis.appointmentUtilization}%` }}
                  />
                </div>
                <div className="text-xs text-medical-gray-500 mt-1">
                  {kpis.appointmentUtilization > 80 ? 'Optimale' : 
                   kpis.appointmentUtilization > 60 ? 'Correcte' : 'Faible'}
                </div>
              </div>

              {/* Cancellation Rate */}
              <div>
                <div className="flex justify-between items-center text-sm mb-2">
                  <span className="text-medical-gray-600 font-medium">Taux d&apos;annulation</span>
                  <span className="font-bold text-medical-gray-900">{kpis.cancellationRate.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-medical-gray-200 rounded-medical-small h-3">
                  <div 
                    className="bg-medical-yellow-500 h-3 rounded-medical-small transition-all duration-500" 
                    style={{ width: `${kpis.cancellationRate}%` }}
                  />
                </div>
                <div className="text-xs text-medical-gray-500 mt-1">
                  {kpis.cancellationRate < 5 ? 'Faible' : kpis.cancellationRate < 10 ? 'Normal' : 'Élevé'}
                </div>
              </div>
            </div>
          </div>

          {/* Operational Metrics */}
          <div className="medical-card p-6">
            <h4 className="text-lg font-medium text-medical-gray-900 mb-6 flex items-center gap-2">
              ⚙️ Métriques opérationnelles
            </h4>
            <div className="space-y-4">
              {/* Wait Time */}
              <div className="flex items-center justify-between p-3 bg-medical-blue-50 rounded-medical-small">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-medical-blue-600 rounded-medical-small flex items-center justify-center">
                    <span className="text-white text-sm">⏱️</span>
                  </div>
                  <span className="text-medical-gray-700 font-medium">Temps d&apos;attente moyen</span>
                </div>
                <span className="font-bold text-medical-blue-700">{kpis.averageWaitTime} min</span>
              </div>
              
              {/* Average Value */}
              <div className="flex items-center justify-between p-3 bg-medical-green-50 rounded-medical-small">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-medical-green-600 rounded-medical-small flex items-center justify-center">
                    <span className="text-white text-sm">💰</span>
                  </div>
                  <span className="text-medical-gray-700 font-medium">Valeur moyenne par RDV</span>
                </div>
                <span className="font-bold text-medical-green-700">
                  {new Intl.NumberFormat('fr-DZ', { 
                    style: 'currency', 
                    currency: 'DZD',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0
                  }).format(kpis.averageAppointmentValue)}
                </span>
              </div>
              
              {/* Returning Patients */}
              <div className="flex items-center justify-between p-3 bg-medical-yellow-50 rounded-medical-small">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-medical-yellow-600 rounded-medical-small flex items-center justify-center">
                    <span className="text-white text-sm">🔄</span>
                  </div>
                  <span className="text-medical-gray-700 font-medium">Patients récurrents</span>
                </div>
                <span className="font-bold text-medical-yellow-700">{kpis.returningPatients}</span>
              </div>
              
              {/* New Patients */}
              <div className="flex items-center justify-between p-3 bg-medical-gray-100 rounded-medical-small">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-medical-gray-600 rounded-medical-small flex items-center justify-center">
                    <span className="text-white text-sm">✨</span>
                  </div>
                  <span className="text-medical-gray-700 font-medium">Nouveaux patients</span>
                </div>
                <span className="font-bold text-medical-gray-700">{kpis.newPatients}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Custom Widgets Grid with Medical Design */}
      <section aria-labelledby="custom-widgets">
        <h3 id="custom-widgets" className="text-lg font-semibold text-medical-gray-900 mb-6">
          Widgets personnalisés
        </h3>
        <div className="grid grid-cols-12 gap-6 auto-rows-min">
          {layout.widgets.map(renderWidget)}
        </div>
        
        {/* Empty State */}
        {layout.widgets.filter(w => w.isVisible).length === 0 && (
          <div className="medical-card p-12 text-center">
            <div className="w-16 h-16 bg-medical-gray-100 rounded-medical-round flex items-center justify-center mx-auto mb-4">
              <span className="text-medical-gray-400 text-2xl">📊</span>
            </div>
            <h4 className="text-lg font-medium text-medical-gray-900 mb-2">
              Aucun widget configuré
            </h4>
            <p className="text-medical-gray-600 mb-4 max-w-sm mx-auto">
              Personnalisez votre tableau de bord en ajoutant des widgets pour suivre vos métriques importantes.
            </p>
            <button
              onClick={() => console.warn('Open widget customizer')}
              className="px-4 py-2 bg-medical-blue-600 text-white rounded-medical-medium hover:bg-medical-blue-700 focus:outline-none focus:ring-2 focus:ring-medical-blue-500 focus:ring-offset-2 transition-colors"
            >
              ⚙️ Ajouter des widgets
            </button>
          </div>
        )}
      </section>
    </div>
  );
}