'use client';

import React from 'react';
import { CabinetKPIs, ManagerDashboardLayout, DashboardWidget } from '@/lib/models/performance';
import KPIWidget from './widgets/KPIWidget';
import ChartWidget from './widgets/ChartWidget';
import AlertWidget from './widgets/AlertWidget';

interface CabinetPerformanceDashboardProps {
  kpis: CabinetKPIs;
  layout: ManagerDashboardLayout;
  onLayoutChange: (layout: ManagerDashboardLayout) => void;
}

export default function CabinetPerformanceDashboard({
  kpis,
  layout,
  onLayoutChange
}: CabinetPerformanceDashboardProps) {
  
  const renderWidget = (widget: DashboardWidget) => {
    if (!widget.isVisible) return null;

    const baseClasses = "bg-white rounded-lg shadow-sm border border-gray-200 p-6";
    const gridClasses = `col-span-${widget.position.width} row-span-${widget.position.height}`;

    switch (widget.type) {
      case 'kpi':
        return (
          <div key={widget.id} className={`${baseClasses} ${gridClasses}`}>
            <KPIWidget
              widget={widget}
              kpis={kpis}
            />
          </div>
        );
      
      case 'chart':
        return (
          <div key={widget.id} className={`${baseClasses} ${gridClasses}`}>
            <ChartWidget
              widget={widget}
              kpis={kpis}
            />
          </div>
        );
      
      case 'alert':
        return (
          <div key={widget.id} className={`${baseClasses} ${gridClasses}`}>
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
    <div className="space-y-6">
      {/* Quick Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Rendez-vous</p>
              <p className="text-2xl font-semibold text-gray-900">{kpis.totalAppointments}</p>
              {kpis.trends.appointments !== 0 && (
                <p className={`text-sm ${kpis.trends.appointments > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {kpis.trends.appointments > 0 ? '+' : ''}{kpis.trends.appointments.toFixed(1)}%
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Chiffre d'affaires</p>
              <p className="text-2xl font-semibold text-gray-900">{kpis.totalRevenue.toLocaleString('fr-FR')}€</p>
              {kpis.trends.revenue !== 0 && (
                <p className={`text-sm ${kpis.trends.revenue > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {kpis.trends.revenue > 0 ? '+' : ''}{kpis.trends.revenue.toFixed(1)}%
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Patients</p>
              <p className="text-2xl font-semibold text-gray-900">{kpis.totalPatients}</p>
              <p className="text-sm text-gray-500">{kpis.newPatients} nouveaux</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                kpis.noShowRate > 15 ? 'bg-red-100' : kpis.noShowRate > 10 ? 'bg-yellow-100' : 'bg-green-100'
              }`}>
                <svg className={`w-4 h-4 ${
                  kpis.noShowRate > 15 ? 'text-red-600' : kpis.noShowRate > 10 ? 'text-yellow-600' : 'text-green-600'
                }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Taux de no-show</p>
              <p className="text-2xl font-semibold text-gray-900">{kpis.noShowRate.toFixed(1)}%</p>
              {kpis.trends.noShowRate !== 0 && (
                <p className={`text-sm ${kpis.trends.noShowRate < 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {kpis.trends.noShowRate > 0 ? '+' : ''}{kpis.trends.noShowRate.toFixed(1)}%
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Taux de performance</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Taux de complétion</span>
                <span className="font-medium">{kpis.completionRate.toFixed(1)}%</span>
              </div>
              <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-600 h-2 rounded-full" 
                  style={{ width: `${kpis.completionRate}%` }}
                ></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Taux d'occupation</span>
                <span className="font-medium">{kpis.appointmentUtilization}%</span>
              </div>
              <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${
                    kpis.appointmentUtilization > 80 ? 'bg-green-600' : 
                    kpis.appointmentUtilization > 60 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${kpis.appointmentUtilization}%` }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Taux d'annulation</span>
                <span className="font-medium">{kpis.cancellationRate.toFixed(1)}%</span>
              </div>
              <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-orange-500 h-2 rounded-full" 
                  style={{ width: `${kpis.cancellationRate}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Métriques opérationnelles</h3>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-gray-600">Temps d'attente moyen</span>
              <span className="font-medium">{kpis.averageWaitTime} min</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">Valeur moyenne par RDV</span>
              <span className="font-medium">{kpis.averageAppointmentValue.toFixed(0)}€</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">Patients récurrents</span>
              <span className="font-medium">{kpis.returningPatients}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">Nouveaux patients</span>
              <span className="font-medium">{kpis.newPatients}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Custom Widgets Grid */}
      <div className="grid grid-cols-12 gap-6 auto-rows-min">
        {layout.widgets.map(renderWidget)}
      </div>
    </div>
  );
}