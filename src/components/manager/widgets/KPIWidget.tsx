'use client';

import React from 'react';
import { DashboardWidget, CabinetKPIs } from '@/lib/models/performance';

interface KPIWidgetProps {
  widget: DashboardWidget;
  kpis: CabinetKPIs;
}

export default function KPIWidget({ widget, kpis }: KPIWidgetProps) {
  const getKPIValue = (metric: keyof CabinetKPIs): { value: string | number; trend?: number } => {
    switch (metric) {
      case 'totalAppointments':
        return { value: kpis.totalAppointments, trend: kpis.trends.appointments };
      case 'totalRevenue':
        return { value: `${kpis.totalRevenue.toLocaleString('fr-FR')}€`, trend: kpis.trends.revenue };
      case 'totalPatients':
        return { value: kpis.totalPatients, trend: kpis.trends.patients };
      case 'noShowRate':
        return { value: `${kpis.noShowRate.toFixed(1)}%`, trend: kpis.trends.noShowRate };
      case 'completionRate':
        return { value: `${kpis.completionRate.toFixed(1)}%` };
      case 'cancellationRate':
        return { value: `${kpis.cancellationRate.toFixed(1)}%` };
      case 'averageAppointmentValue':
        return { value: `${kpis.averageAppointmentValue.toFixed(0)}€` };
      case 'appointmentUtilization':
        return { value: `${kpis.appointmentUtilization}%` };
      case 'averageWaitTime':
        return { value: `${kpis.averageWaitTime} min` };
      case 'newPatients':
        return { value: kpis.newPatients };
      case 'returningPatients':
        return { value: kpis.returningPatients };
      case 'completedAppointments':
        return { value: kpis.completedAppointments };
      case 'cancelledAppointments':
        return { value: kpis.cancelledAppointments };
      case 'noShowAppointments':
        return { value: kpis.noShowAppointments };
      default:
        return { value: 'N/A' };
    }
  };

  const getKPIIcon = (metric: keyof CabinetKPIs) => {
    switch (metric) {
      case 'totalAppointments':
      case 'completedAppointments':
      case 'cancelledAppointments':
      case 'noShowAppointments':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        );
      case 'totalRevenue':
      case 'averageAppointmentValue':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
          </svg>
        );
      case 'totalPatients':
      case 'newPatients':
      case 'returningPatients':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        );
      case 'noShowRate':
      case 'completionRate':
      case 'cancellationRate':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        );
      case 'appointmentUtilization':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        );
      case 'averageWaitTime':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        );
    }
  };

  const getIconColor = (metric: keyof CabinetKPIs, value: any) => {
    switch (metric) {
      case 'totalRevenue':
      case 'totalAppointments':
      case 'completedAppointments':
      case 'totalPatients':
        return 'text-green-600 bg-green-100';
      case 'noShowRate':
        const rate = parseFloat(value);
        if (rate > 15) return 'text-red-600 bg-red-100';
        if (rate > 10) return 'text-yellow-600 bg-yellow-100';
        return 'text-green-600 bg-green-100';
      case 'appointmentUtilization':
        const utilization = parseFloat(value);
        if (utilization > 80) return 'text-green-600 bg-green-100';
        if (utilization > 60) return 'text-yellow-600 bg-yellow-100';
        return 'text-red-600 bg-red-100';
      case 'cancelledAppointments':
      case 'noShowAppointments':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-blue-600 bg-blue-100';
    }
  };

  if (!widget.config.metric) {
    return (
      <div className="text-center text-gray-500">
        <p>Configuration du widget manquante</p>
      </div>
    );
  }

  const { value, trend } = getKPIValue(widget.config.metric);
  const iconColorClass = getIconColor(widget.config.metric, value);

  return (
    <div className="h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-900">{widget.title}</h3>
        <div className={`p-2 rounded-full ${iconColorClass}`}>
          {getKPIIcon(widget.config.metric)}
        </div>
      </div>
      
      <div className="space-y-2">
        <div className="text-2xl font-bold text-gray-900">
          {value}
        </div>
        
        {widget.config.showTrend && trend !== undefined && trend !== 0 && (
          <div className="flex items-center space-x-1">
            <svg
              className={`w-4 h-4 ${trend > 0 ? 'text-green-500 rotate-0' : 'text-red-500 rotate-180'}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17l9.2-9.2M17 17V7H7" />
            </svg>
            <span className={`text-sm font-medium ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {Math.abs(trend).toFixed(1)}%
            </span>
            <span className="text-sm text-gray-500">
              vs période précédente
            </span>
          </div>
        )}
      </div>
    </div>
  );
}