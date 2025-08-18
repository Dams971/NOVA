'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Cabinet } from '@/lib/models/cabinet';
import { CabinetKPIs, PerformanceAlert, ManagerDashboardLayout } from '@/lib/models/performance';
import { PerformanceService } from '@/lib/services/performance-service';
import { cn } from '@/lib/utils';
import AppointmentManagement from './AppointmentManagement';
import CabinetPerformanceDashboard from './CabinetPerformanceDashboard';
import PatientManagement from './PatientManagement';
import WidgetCustomizer from './WidgetCustomizer';

// Import utility functions

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
  }, [cabinet.id, selectedTimeRange, loadDashboardData, setupRealtimeUpdates, handleRealtimeUpdate, performanceService]);

  const loadDashboardData = useCallback(async () => {
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
  }, [cabinet.id, selectedTimeRange, performanceService, getDefaultDashboardLayout, userId]);

  const handleRealtimeUpdate = useCallback((update: { type: string; [key: string]: unknown }) => {
    console.warn('Real-time update received:', update);
    // In real implementation, update the relevant state based on update type
    if (update.type === 'kpi') {
      loadDashboardData(); // Refresh KPIs
    }
  }, [loadDashboardData]);

  const setupRealtimeUpdates = useCallback(() => {
    performanceService.subscribeToUpdates(cabinet.id, handleRealtimeUpdate);
    
    // Simulate periodic updates (in real implementation, this would be WebSocket or SSE)
    const interval = setInterval(() => {
      performanceService.simulateRealtimeUpdate(cabinet.id);
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [cabinet.id, performanceService, handleRealtimeUpdate]);

  const _handleAlertAcknowledge = async (alertId: string) => {
    const result = await performanceService.acknowledgeAlert(alertId, userId);
    if (result.success) {
      setAlerts(prev => prev.filter(alert => alert.id !== alertId));
    }
  };

  const handleLayoutUpdate = (newLayout: ManagerDashboardLayout) => {
    setDashboardLayout(newLayout);
    // In real implementation, save to backend
    console.warn('Dashboard layout updated:', newLayout);
  };

  const getDefaultDashboardLayout = useCallback((userId: string, cabinetId: string): ManagerDashboardLayout => {
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
  }, [selectedTimeRange]);

  if (loading) {
    return (
      <div className="min-h-screen bg-medical-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-medical-blue-200 border-t-medical-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-medical-gray-600 text-lg">Chargement du tableau de bord...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-medical-gray-50">
      {/* Skip Link pour accessibilité */}
      <a 
        href="#main-content" 
        className="skip-to-content"
      >
        Aller au contenu principal
      </a>

      {/* Header with medical design */}
      <header className="bg-white border-b border-medical-gray-200 shadow-medical-subtle">
        <div className="max-w-[1440px] mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-medical-blue-600 rounded-medical-small flex items-center justify-center">
                  <span className="text-white font-bold text-lg">🏥</span>
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-medical-gray-900">{cabinet.name}</h1>
                  <p className="text-medical-gray-600">Tableau de bord gestionnaire</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Time Range Selector with medical design */}
              {activeTab === 'dashboard' && (
                <div className="flex items-center gap-2">
                  <label htmlFor="time-range" className="text-sm font-medium text-medical-gray-700">
                    Période:
                  </label>
                  <select
                    id="time-range"
                    value={selectedTimeRange}
                    onChange={(e) => setSelectedTimeRange(e.target.value as 'day' | 'week' | 'month' | 'quarter')}
                    className={cn(
                      "px-3 py-2 border border-medical-gray-300 rounded-medical-small",
                      "bg-white text-medical-gray-900",
                      "focus:outline-none focus:ring-2 focus:ring-medical-blue-600 focus:border-medical-blue-600",
                      "transition-colors"
                    )}
                    aria-label="Sélectionner la période d'analyse"
                  >
                    <option value="day">Aujourd&apos;hui</option>
                    <option value="week">7 derniers jours</option>
                    <option value="month">30 derniers jours</option>
                    <option value="quarter">3 derniers mois</option>
                  </select>
                </div>
              )}
              
              {/* Customize Button with medical design */}
              {activeTab === 'dashboard' && (
                <button
                  onClick={() => setShowCustomizer(true)}
                  className="gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  ⚙️ Personnaliser
                </button>
              )}

              {/* Urgence Button */}
              <button
                onClick={() => window.location.href = 'tel:+213555000000'}
                className="px-6 py-3 text-lg font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
              >
                🚨 Urgence
              </button>
            </div>
          </div>
        </div>
      </header>

      <main id="main-content" className="max-w-[1440px] mx-auto px-6 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-medical-gray-900">
                {activeTab === 'dashboard' && 'Vue d\'ensemble'}
                {activeTab === 'appointments' && 'Gestion des rendez-vous'}
                {activeTab === 'patients' && 'Gestion des patients'}
              </h2>
              <p className="text-medical-gray-600 mt-1">
                {activeTab === 'dashboard' && 'Indicateurs de performance et métriques clés'}
                {activeTab === 'appointments' && 'Planification et suivi des consultations'}
                {activeTab === 'patients' && 'Base de données patients et historiques'}
              </p>
            </div>
          </div>

          {/* Navigation Tabs with medical design */}
          <div className="mt-6 border-b border-medical-gray-200">
            <nav 
              className="-mb-px flex space-x-8" 
              role="tablist"
              aria-label="Sections du tableau de bord"
            >
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'dashboard'}
                aria-controls="dashboard-panel"
                onClick={() => setActiveTab('dashboard')}
                className={cn(
                  "py-3 px-1 border-b-2 font-medium text-sm transition-all touch-target-medical",
                  "focus:outline-none focus:ring-2 focus:ring-medical-blue-600 focus:ring-offset-2",
                  activeTab === 'dashboard'
                    ? 'border-medical-blue-600 text-medical-blue-700'
                    : 'border-transparent text-medical-gray-500 hover:text-medical-gray-700 hover:border-medical-gray-300'
                )}
              >
                📊 Tableau de bord
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'appointments'}
                aria-controls="appointments-panel"
                onClick={() => setActiveTab('appointments')}
                className={cn(
                  "py-3 px-1 border-b-2 font-medium text-sm transition-all touch-target-medical",
                  "focus:outline-none focus:ring-2 focus:ring-medical-blue-600 focus:ring-offset-2",
                  activeTab === 'appointments'
                    ? 'border-medical-blue-600 text-medical-blue-700'
                    : 'border-transparent text-medical-gray-500 hover:text-medical-gray-700 hover:border-medical-gray-300'
                )}
              >
                📅 Rendez-vous
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'patients'}
                aria-controls="patients-panel"
                onClick={() => setActiveTab('patients')}
                className={cn(
                  "py-3 px-1 border-b-2 font-medium text-sm transition-all touch-target-medical",
                  "focus:outline-none focus:ring-2 focus:ring-medical-blue-600 focus:ring-offset-2",
                  activeTab === 'patients'
                    ? 'border-medical-blue-600 text-medical-blue-700'
                    : 'border-transparent text-medical-gray-500 hover:text-medical-gray-700 hover:border-medical-gray-300'
                )}
              >
                🏥 Patients
              </button>
            </nav>
          </div>
        </div>

        {/* Tab Content with enhanced accessibility */}
        <div className="tab-content">
          {activeTab === 'dashboard' && (
            <div 
              id="dashboard-panel"
              role="tabpanel"
              aria-labelledby="dashboard-tab"
              className="space-y-8"
            >
              {/* Alerts Panel with medical design */}
              {alerts.length > 0 && (
                <section aria-labelledby="alerts-title">
                  <h3 id="alerts-title" className="sr-only">Alertes actives</h3>
                  <div className="p-4 mb-4 text-red-700 bg-red-100 border border-red-200 rounded-lg">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-semibold">{`${alerts.length} alerte(s) nécessitent votre attention`}</p>
                        <p className="text-sm">Cliquez pour voir les détails</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => console.warn('Show alerts')}
                          className="px-3 py-1 text-sm font-medium text-white bg-red-600 rounded hover:bg-red-700"
                        >
                          Voir les alertes
                        </button>
                        <button
                          onClick={() => setAlerts([])}
                          className="px-3 py-1 text-sm font-medium text-red-600 bg-white border border-red-600 rounded hover:bg-red-50"
                        >
                          Fermer
                        </button>
                      </div>
                    </div>
                  </div>
                </section>
              )}

              {/* Performance Dashboard */}
              {kpis && dashboardLayout && (
                <section aria-labelledby="performance-title">
                  <h3 id="performance-title" className="sr-only">Indicateurs de performance</h3>
                  <CabinetPerformanceDashboard
                    kpis={kpis}
                    layout={dashboardLayout}
                    onLayoutChange={handleLayoutUpdate}
                  />
                </section>
              )}

              {/* Quick Stats Grid - Enhanced version */}
              <section aria-labelledby="quick-stats-title" className="mb-8">
                <h3 id="quick-stats-title" className="text-lg font-semibold text-medical-gray-900 mb-4">
                  Statistiques rapides
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* Appointments Today */}
                  <div className="medical-card p-6 text-center">
                    <div className="w-12 h-12 bg-medical-blue-100 rounded-medical-round flex items-center justify-center mx-auto mb-3">
                      <span className="text-medical-blue-600 text-2xl">📅</span>
                    </div>
                    <div className="text-2xl font-bold text-medical-gray-900 mb-1">
                      {kpis?.totalAppointments || 0}
                    </div>
                    <div className="text-sm text-medical-gray-600">RDV aujourd'hui</div>
                    <div className="mt-2 text-xs text-medical-green-600 font-medium">
                      +12% vs hier
                    </div>
                  </div>

                  {/* Revenue */}
                  <div className="medical-card p-6 text-center">
                    <div className="w-12 h-12 bg-medical-green-100 rounded-medical-round flex items-center justify-center mx-auto mb-3">
                      <span className="text-medical-green-600 text-2xl">💰</span>
                    </div>
                    <div className="text-2xl font-bold text-medical-gray-900 mb-1">
                      {new Intl.NumberFormat('fr-DZ', { 
                        style: 'currency', 
                        currency: 'DZD' 
                      }).format(kpis?.totalRevenue || 0)}
                    </div>
                    <div className="text-sm text-medical-gray-600">Chiffre d&apos;affaires</div>
                    <div className="mt-2 text-xs text-medical-green-600 font-medium">
                      +8% ce mois
                    </div>
                  </div>

                  {/* Patients */}
                  <div className="medical-card p-6 text-center">
                    <div className="w-12 h-12 bg-medical-yellow-100 rounded-medical-round flex items-center justify-center mx-auto mb-3">
                      <span className="text-medical-yellow-600 text-2xl">👥</span>
                    </div>
                    <div className="text-2xl font-bold text-medical-gray-900 mb-1">
                      {kpis?.totalPatients || 0}
                    </div>
                    <div className="text-sm text-medical-gray-600">Patients actifs</div>
                    <div className="mt-2 text-xs text-medical-blue-600 font-medium">
                      +15 nouveaux
                    </div>
                  </div>

                  {/* No-show Rate */}
                  <div className="medical-card p-6 text-center">
                    <div className="w-12 h-12 bg-medical-red-100 rounded-medical-round flex items-center justify-center mx-auto mb-3">
                      <span className="text-medical-red-600 text-2xl">⚠️</span>
                    </div>
                    <div className="text-2xl font-bold text-medical-gray-900 mb-1">
                      {((kpis?.noShowRate || 0) * 100).toFixed(1)}%
                    </div>
                    <div className="text-sm text-medical-gray-600">Taux d&apos;absentéisme</div>
                    <div className="mt-2 text-xs text-medical-red-600 font-medium">
                      -2% vs semaine
                    </div>
                  </div>
                </div>
              </section>
            </div>
          )}

          {activeTab === 'appointments' && (
            <div 
              id="appointments-panel"
              role="tabpanel"
              aria-labelledby="appointments-tab"
            >
              <AppointmentManagement cabinetId={cabinet.id} />
            </div>
          )}

          {activeTab === 'patients' && (
            <div 
              id="patients-panel"
              role="tabpanel"
              aria-labelledby="patients-tab"
            >
              <PatientManagement cabinetId={cabinet.id} />
            </div>
          )}
        </div>

        {/* Widget Customizer Modal */}
        {showCustomizer && dashboardLayout && (
          <WidgetCustomizer
            layout={dashboardLayout}
            onSave={handleLayoutUpdate}
            onClose={() => setShowCustomizer(false)}
          />
        )}
      </main>
      
      {/* Footer with medical info */}
      <footer className="bg-white border-t border-medical-gray-200 mt-12">
        <div className="max-w-[1440px] mx-auto px-6 py-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-medical-gray-600">
            <div className="flex items-center gap-4">
              <span>📍 Cité 109, Daboussy El Achour, Alger</span>
              <span>⏰ Zone horaire: Africa/Algiers</span>
            </div>
            
            <div className="flex items-center gap-4">
              <a 
                href="tel:+213555000000" 
                className="text-medical-blue-600 hover:underline"
              >
                📞 +213 555 000 000
              </a>
              <span>✉️ contact@nova-rdv.dz</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}