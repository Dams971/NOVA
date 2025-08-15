'use client';

import React, { useState, useEffect } from 'react';
import { Cabinet } from '@/lib/models/cabinet';
import { CabinetKPIs, PerformanceAlert, DashboardWidget, ManagerDashboardLayout } from '@/lib/models/performance';
import { PerformanceService } from '@/lib/services/performance-service';
import CabinetPerformanceDashboard from './CabinetPerformanceDashboard';
import AlertsPanel from './AlertsPanel';
import WidgetCustomizer from './WidgetCustomizer';
import AppointmentManagement from './AppointmentManagement';
import PatientManagement from './PatientManagement';

interface ManagerDashboardProps {
  cabinet: Cabinet;
  userId: string;
}

export default function ManagerDashboard({ cabinet, userId }: ManagerDashboardProps) {
  const [kpis, setKpis] = useState<CabinetKPIs | null>(null);
  const [alerts, setAlerts] = useState<PerformanceAlert[]>([]);
  const [dashboardLayout, setDashboardLayout] = useState<ManagerDashboardLayout | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCustomizer, setShowCustomizer] = useState(false);
  const [selectedTimeRange, setSelectedTimeRange] = useState<'day' | 'week' | 'month' | 'quarter'>('week');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'appointments' | 'patients'>('dashboard');

  const performanceService = PerformanceService.getInstance();

  useEffect(() => {
    loadDashboardData();
    setupRealtimeUpdates();

    return () => {
      // Cleanup real-time subscriptions
      performanceService.unsubscribeFromUpdates(cabinet.id, handleRealtimeUpdate);
    };
  }, [cabinet.id, selectedTimeRange]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Calculate date range based on selected time range
      const endDate = new Date();
      const startDate = new Date();
      
      switch (selectedTimeRange) {
        case 'day':
          startDate.setDate(endDate.getDate() - 1);
          break;
        case 'week':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(endDate.getMonth() - 1);
          break;
        case 'quarter':
          startDate.setMonth(endDate.getMonth() - 3);
          break;
      }

      // Load KPIs
      const kpisResult = await performanceService.getCabinetKPIs(cabinet.id, startDate, endDate);
      if (kpisResult.success && kpisResult.data) {
        setKpis(kpisResult.data);
      }

      // Load alerts
      const alertsResult = await performanceService.getActiveAlerts(cabinet.id);
      if (alertsResult.success && alertsResult.data) {
        setAlerts(alertsResult.data);
      }

      // Load dashboard layout (simulated for now)
      setDashboardLayout(getDefaultDashboardLayout(userId, cabinet.id));

    } catch (_error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeUpdates = () => {
    performanceService.subscribeToUpdates(cabinet.id, handleRealtimeUpdate);
    
    // Simulate periodic updates (in real implementation, this would be WebSocket or SSE)
    const interval = setInterval(() => {
      performanceService.simulateRealtimeUpdate(cabinet.id);
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  };

  const handleRealtimeUpdate = (update: any) => {
    console.log('Real-time update received:', update);
    // In real implementation, update the relevant state based on update type
    if (update.type === 'kpi') {
      loadDashboardData(); // Refresh KPIs
    }
  };

  const handleAlertAcknowledge = async (alertId: string) => {
    const result = await performanceService.acknowledgeAlert(alertId, userId);
    if (result.success) {
      setAlerts(prev => prev.filter(alert => alert.id !== alertId));
    }
  };

  const handleLayoutUpdate = (newLayout: ManagerDashboardLayout) => {
    setDashboardLayout(newLayout);
    // In real implementation, save to backend
    console.log('Dashboard layout updated:', newLayout);
  };

  const getDefaultDashboardLayout = (userId: string, cabinetId: string): ManagerDashboardLayout => {
    return {
      userId,
      cabinetId,
      widgets: [
        {
          id: 'appointments-kpi',
          type: 'kpi',
          title: 'Rendez-vous',
          position: { x: 0, y: 0, width: 3, height: 2 },
          config: { metric: 'totalAppointments', showTrend: true },
          isVisible: true
        },
        {
          id: 'revenue-kpi',
          type: 'kpi',
          title: 'Chiffre d\'affaires',
          position: { x: 3, y: 0, width: 3, height: 2 },
          config: { metric: 'totalRevenue', showTrend: true },
          isVisible: true
        },
        {
          id: 'patients-kpi',
          type: 'kpi',
          title: 'Patients',
          position: { x: 6, y: 0, width: 3, height: 2 },
          config: { metric: 'totalPatients', showTrend: true },
          isVisible: true
        },
        {
          id: 'noshow-rate-kpi',
          type: 'kpi',
          title: 'Taux de no-show',
          position: { x: 9, y: 0, width: 3, height: 2 },
          config: { metric: 'noShowRate', showTrend: true },
          isVisible: true
        },
        {
          id: 'appointments-chart',
          type: 'chart',
          title: 'Évolution des rendez-vous',
          position: { x: 0, y: 2, width: 6, height: 4 },
          config: { chartType: 'line', timeRange: selectedTimeRange },
          isVisible: true
        },
        {
          id: 'revenue-chart',
          type: 'chart',
          title: 'Évolution du chiffre d\'affaires',
          position: { x: 6, y: 2, width: 6, height: 4 },
          config: { chartType: 'area', timeRange: selectedTimeRange },
          isVisible: true
        }
      ],
      updatedAt: new Date()
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{cabinet.name}</h1>
              <p className="text-gray-600">Tableau de bord manager</p>
            </div>
            <div className="flex space-x-4">
              {/* Time Range Selector - only show for dashboard tab */}
              {activeTab === 'dashboard' && (
                <select
                  value={selectedTimeRange}
                  onChange={(e) => setSelectedTimeRange(e.target.value as any)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-label="Sélectionner la période"
                >
                  <option value="day">Aujourd'hui</option>
                  <option value="week">7 derniers jours</option>
                  <option value="month">30 derniers jours</option>
                  <option value="quarter">3 derniers mois</option>
                </select>
              )}
              
              {/* Customize Button - only show for dashboard tab */}
              {activeTab === 'dashboard' && (
                <button
                  type="button"
                  onClick={() => setShowCustomizer(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Personnaliser
                </button>
              )}
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="mt-6 border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                type="button"
                onClick={() => setActiveTab('dashboard')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'dashboard'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Tableau de bord
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('appointments')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'appointments'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Rendez-vous
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('patients')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'patients'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Patients
              </button>
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'dashboard' && (
          <>
            {/* Alerts Panel */}
            {alerts.length > 0 && (
              <div className="mb-8">
                <AlertsPanel
                  alerts={alerts}
                  onAcknowledge={handleAlertAcknowledge}
                />
              </div>
            )}

            {/* Performance Dashboard */}
            {kpis && dashboardLayout && (
              <CabinetPerformanceDashboard
                kpis={kpis}
                layout={dashboardLayout}
                onLayoutChange={handleLayoutUpdate}
              />
            )}
          </>
        )}

        {activeTab === 'appointments' && (
          <AppointmentManagement cabinetId={cabinet.id} />
        )}

        {activeTab === 'patients' && (
          <PatientManagement cabinetId={cabinet.id} />
        )}

        {/* Widget Customizer Modal */}
        {showCustomizer && dashboardLayout && (
          <WidgetCustomizer
            layout={dashboardLayout}
            onSave={handleLayoutUpdate}
            onClose={() => setShowCustomizer(false)}
          />
        )}
      </div>
    </div>
  );
}