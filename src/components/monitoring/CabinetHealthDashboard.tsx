'use client';

import React, { useState, useEffect } from 'react';
import { CabinetHealthStatus, CabinetHealthAlert } from '@/lib/services/cabinet-health-service';

interface CabinetHealthDashboardProps {
  refreshInterval?: number;
}

interface HealthSummary {
  totalCabinets: number;
  healthyCabinets: number;
  degradedCabinets: number;
  unhealthyCabinets: number;
  activeAlerts: number;
}

export default function CabinetHealthDashboard({ 
  refreshInterval = 30000 
}: CabinetHealthDashboardProps) {
  const [healthStatuses, setHealthStatuses] = useState<CabinetHealthStatus[]>([]);
  const [summary, setSummary] = useState<HealthSummary | null>(null);
  const [alerts, setAlerts] = useState<CabinetHealthAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchHealthData = async () => {
    try {
      const response = await fetch('/api/cabinets/health');
      if (!response.ok) {
        throw new Error('Failed to fetch health data');
      }
      
      const data = await response.json();
      setHealthStatuses(data.data);
      setSummary(data.summary);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const fetchAlerts = async () => {
    try {
      const response = await fetch('/api/cabinets/alerts');
      if (!response.ok) {
        throw new Error('Failed to fetch alerts');
      }
      
      const data = await response.json();
      setAlerts(data.data);
    } catch (_err) {
      console.error('Failed to fetch alerts:', err);
    }
  };

  const acknowledgeAlert = async (alertId: string) => {
    try {
      const response = await fetch(`/api/cabinets/alerts/${alertId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'acknowledge' })
      });
      
      if (response.ok) {
        await fetchAlerts();
      }
    } catch (_err) {
      console.error('Failed to acknowledge alert:', err);
    }
  };

  const resolveAlert = async (alertId: string) => {
    try {
      const response = await fetch(`/api/cabinets/alerts/${alertId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'resolve' })
      });
      
      if (response.ok) {
        await fetchAlerts();
      }
    } catch (_err) {
      console.error('Failed to resolve alert:', err);
    }
  };

  const refreshCabinetHealth = async (cabinetId: string) => {
    try {
      const response = await fetch(`/api/cabinets/${cabinetId}/health`, {
        method: 'POST'
      });
      
      if (response.ok) {
        await fetchHealthData();
      }
    } catch (_err) {
      console.error('Failed to refresh cabinet health:', err);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchHealthData(), fetchAlerts()]);
      setLoading(false);
    };

    loadData();

    // Set up refresh interval
    const interval = setInterval(() => {
      fetchHealthData();
      fetchAlerts();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [refreshInterval]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-100';
      case 'degraded': return 'text-yellow-600 bg-yellow-100';
      case 'unhealthy': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'info': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error</h3>
            <div className="mt-2 text-sm text-red-700">{error}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Cabinet Health Monitoring</h1>
        <div className="text-sm text-gray-500">
          Last updated: {lastUpdated?.toLocaleTimeString()}
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="text-2xl font-bold text-gray-900">{summary.totalCabinets}</div>
            <div className="text-sm text-gray-600">Total Cabinets</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="text-2xl font-bold text-green-600">{summary.healthyCabinets}</div>
            <div className="text-sm text-gray-600">Healthy</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="text-2xl font-bold text-yellow-600">{summary.degradedCabinets}</div>
            <div className="text-sm text-gray-600">Degraded</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="text-2xl font-bold text-red-600">{summary.unhealthyCabinets}</div>
            <div className="text-sm text-gray-600">Unhealthy</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="text-2xl font-bold text-orange-600">{summary.activeAlerts}</div>
            <div className="text-sm text-gray-600">Active Alerts</div>
          </div>
        </div>
      )}

      {/* Active Alerts */}
      {alerts.length > 0 && (
        <div className="bg-white rounded-lg shadow border">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Active Alerts</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {alerts.map((alert) => (
              <div key={alert.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getSeverityColor(alert.severity)}`}>
                      {alert.severity.toUpperCase()}
                    </span>
                    <div>
                      <div className="text-sm font-medium text-gray-900">{alert.message}</div>
                      <div className="text-xs text-gray-500">
                        {alert.timestamp.toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    {!alert.acknowledged && (
                      <button
                        onClick={() => acknowledgeAlert(alert.id)}
                        className="px-3 py-1 text-xs font-medium text-blue-600 bg-blue-100 rounded hover:bg-blue-200"
                      >
                        Acknowledge
                      </button>
                    )}
                    <button
                      onClick={() => resolveAlert(alert.id)}
                      className="px-3 py-1 text-xs font-medium text-green-600 bg-green-100 rounded hover:bg-green-200"
                    >
                      Resolve
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cabinet Health Status */}
      <div className="bg-white rounded-lg shadow border">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Cabinet Health Status</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {healthStatuses.map((cabinet) => (
            <div key={cabinet.cabinetId} className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(cabinet.status)}`}>
                    {cabinet.status.toUpperCase()}
                  </span>
                  <div>
                    <div className="text-sm font-medium text-gray-900">{cabinet.cabinetName}</div>
                    <div className="text-xs text-gray-500">
                      Last checked: {cabinet.lastChecked.toLocaleString()}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <div className="text-sm text-gray-900">Uptime: {cabinet.uptime.toFixed(1)}%</div>
                    <div className="text-xs text-gray-500">Response: {cabinet.responseTime}ms</div>
                  </div>
                  <button
                    onClick={() => refreshCabinetHealth(cabinet.cabinetId)}
                    className="px-3 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded hover:bg-gray-200"
                  >
                    Refresh
                  </button>
                </div>
              </div>
              
              {cabinet.issues.length > 0 && (
                <div className="mt-3 pl-4">
                  <div className="text-xs font-medium text-gray-700 mb-1">Issues:</div>
                  <ul className="text-xs text-red-600 space-y-1">
                    {cabinet.issues.map((issue, index) => (
                      <li key={index}>• {issue}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {cabinet.checks.length > 0 && (
                <div className="mt-3 pl-4">
                  <div className="text-xs font-medium text-gray-700 mb-2">Health Checks:</div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {cabinet.checks.map((check) => (
                      <div key={check.name} className="flex items-center space-x-2">
                        <span className={`w-2 h-2 rounded-full ${
                          check.status === 'healthy' ? 'bg-green-500' :
                          check.status === 'degraded' ? 'bg-yellow-500' : 'bg-red-500'
                        }`}></span>
                        <span className="text-xs text-gray-600 capitalize">{check.name}</span>
                        <span className="text-xs text-gray-500">({check.responseTime}ms)</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}