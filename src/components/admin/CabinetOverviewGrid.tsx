'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Cabinet, CabinetStatus } from '@/lib/models/cabinet';
import { Search, Filter, SortAsc, SortDesc, RefreshCw, Eye, Settings, AlertTriangle } from 'lucide-react';

interface CabinetMetrics {
  cabinetId: string;
  appointmentsToday: number;
  appointmentsThisWeek: number;
  revenue: number;
  patientCount: number;
  utilizationRate: number;
  healthStatus: 'healthy' | 'degraded' | 'unhealthy';
  lastActivity: Date;
}

interface CabinetOverviewGridProps {
  refreshInterval?: number;
  onCabinetSelect?: (cabinet: Cabinet) => void;
  onCabinetSettings?: (cabinet: Cabinet) => void;
  onCabinetDetail?: (cabinet: Cabinet) => void;
}

type SortField = 'name' | 'status' | 'appointmentsToday' | 'revenue' | 'utilizationRate' | 'lastActivity';
type SortDirection = 'asc' | 'desc';

interface FilterOptions {
  status: CabinetStatus | 'all';
  healthStatus: 'healthy' | 'degraded' | 'unhealthy' | 'all';
  search: string;
}

export default function CabinetOverviewGrid({
  refreshInterval = 30000,
  onCabinetSelect,
  onCabinetSettings,
  onCabinetDetail
}: CabinetOverviewGridProps) {
  const [cabinets, setCabinets] = useState<Cabinet[]>([]);
  const [metrics, setMetrics] = useState<CabinetMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  
  // Sorting and filtering state
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [filters, setFilters] = useState<FilterOptions>({
    status: 'all',
    healthStatus: 'all',
    search: ''
  });
  const [showFilters, setShowFilters] = useState(false);

  // WebSocket connection for real-time updates
  const [ws, setWs] = useState<WebSocket | null>(null);

  const fetchCabinets = async () => {
    try {
      const response = await fetch('/api/admin/cabinets');
      if (!response.ok) {
        throw new Error('Failed to fetch cabinets');
      }
      
      const data = await response.json();
      setCabinets(data.data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const fetchMetrics = async () => {
    try {
      const response = await fetch('/api/admin/cabinets/metrics');
      if (!response.ok) {
        throw new Error('Failed to fetch metrics');
      }
      
      const data = await response.json();
      setMetrics(data.data);
      setLastUpdated(new Date());
    } catch (_err) {
      console.error('Failed to fetch metrics:', err);
    }
  };

  const setupWebSocket = () => {
    if (typeof window === 'undefined') return;
    
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/api/admin/cabinets/ws`;
    
    const websocket = new WebSocket(wsUrl);
    
    websocket.onopen = () => {
      console.log('WebSocket connected');
    };
    
    websocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'cabinet_update') {
        setCabinets(prev => prev.map(cabinet => 
          cabinet.id === data.cabinet.id ? data.cabinet : cabinet
        ));
      } else if (data.type === 'metrics_update') {
        setMetrics(prev => prev.map(metric => 
          metric.cabinetId === data.metrics.cabinetId ? data.metrics : metric
        ));
        setLastUpdated(new Date());
      }
    };
    
    websocket.onclose = () => {
      console.log('WebSocket disconnected');
      // Attempt to reconnect after 5 seconds
      setTimeout(setupWebSocket, 5000);
    };
    
    websocket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
    
    setWs(websocket);
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchCabinets(), fetchMetrics()]);
      setLoading(false);
    };

    loadData();
    setupWebSocket();

    // Fallback polling in case WebSocket fails
    const interval = setInterval(() => {
      fetchMetrics();
    }, refreshInterval);

    return () => {
      clearInterval(interval);
      if (ws) {
        ws.close();
      }
    };
  }, [refreshInterval]);

  // Combine cabinets with their metrics
  const cabinetData = useMemo(() => {
    return cabinets.map(cabinet => {
      const cabinetMetrics = metrics.find(m => m.cabinetId === cabinet.id);
      return {
        ...cabinet,
        metrics: cabinetMetrics || {
          cabinetId: cabinet.id,
          appointmentsToday: 0,
          appointmentsThisWeek: 0,
          revenue: 0,
          patientCount: 0,
          utilizationRate: 0,
          healthStatus: 'healthy' as const,
          lastActivity: new Date()
        }
      };
    });
  }, [cabinets, metrics]);

  // Filter and sort data
  const filteredAndSortedData = useMemo(() => {
    let filtered = cabinetData;

    // Apply filters
    if (filters.status !== 'all') {
      filtered = filtered.filter(cabinet => cabinet.status === filters.status);
    }
    
    if (filters.healthStatus !== 'all') {
      filtered = filtered.filter(cabinet => cabinet.metrics.healthStatus === filters.healthStatus);
    }
    
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(cabinet => 
        cabinet.name.toLowerCase().includes(searchLower) ||
        cabinet.address.city.toLowerCase().includes(searchLower) ||
        cabinet.email.toLowerCase().includes(searchLower)
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortField) {
        case 'name':
          aValue = a.name;
          bValue = b.name;
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        case 'appointmentsToday':
          aValue = a.metrics.appointmentsToday;
          bValue = b.metrics.appointmentsToday;
          break;
        case 'revenue':
          aValue = a.metrics.revenue;
          bValue = b.metrics.revenue;
          break;
        case 'utilizationRate':
          aValue = a.metrics.utilizationRate;
          bValue = b.metrics.utilizationRate;
          break;
        case 'lastActivity':
          aValue = a.metrics.lastActivity;
          bValue = b.metrics.lastActivity;
          break;
        default:
          aValue = a.name;
          bValue = b.name;
      }

      if (typeof aValue === 'string') {
        const comparison = aValue.localeCompare(bValue);
        return sortDirection === 'asc' ? comparison : -comparison;
      } else if (aValue instanceof Date) {
        const comparison = aValue.getTime() - bValue.getTime();
        return sortDirection === 'asc' ? comparison : -comparison;
      } else {
        const comparison = aValue - bValue;
        return sortDirection === 'asc' ? comparison : -comparison;
      }
    });

    return filtered;
  }, [cabinetData, filters, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleRefresh = async () => {
    await Promise.all([fetchCabinets(), fetchMetrics()]);
  };

  const getStatusColor = (status: CabinetStatus) => {
    switch (status) {
      case CabinetStatus.ACTIVE:
        return 'text-green-600 bg-green-100';
      case CabinetStatus.INACTIVE:
        return 'text-red-600 bg-red-100';
      case CabinetStatus.DEPLOYING:
        return 'text-blue-600 bg-blue-100';
      case CabinetStatus.MAINTENANCE:
        return 'text-yellow-600 bg-yellow-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getHealthStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-green-600';
      case 'degraded':
        return 'text-yellow-600';
      case 'unhealthy':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
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
          <AlertTriangle className="h-5 w-5 text-red-400" />
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
        <h1 className="text-2xl font-bold text-gray-900">Cabinet Overview</h1>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-500">
            Last updated: {lastUpdated?.toLocaleTimeString()}
          </div>
          <button
            type="button"
            onClick={handleRefresh}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-lg shadow border">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search cabinets..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Filter Toggle */}
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </button>
        </div>

        {/* Filter Options */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value as any }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Statuses</option>
                  <option value={CabinetStatus.ACTIVE}>Active</option>
                  <option value={CabinetStatus.INACTIVE}>Inactive</option>
                  <option value={CabinetStatus.DEPLOYING}>Deploying</option>
                  <option value={CabinetStatus.MAINTENANCE}>Maintenance</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Health Status
                </label>
                <select
                  value={filters.healthStatus}
                  onChange={(e) => setFilters(prev => ({ ...prev, healthStatus: e.target.value as any }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Health Statuses</option>
                  <option value="healthy">Healthy</option>
                  <option value="degraded">Degraded</option>
                  <option value="unhealthy">Unhealthy</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Cabinet Grid */}
      <div className="bg-white rounded-lg shadow border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Cabinet</span>
                    {sortField === 'name' && (
                      sortDirection === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />
                    )}
                  </div>
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('status')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Status</span>
                    {sortField === 'status' && (
                      sortDirection === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />
                    )}
                  </div>
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('appointmentsToday')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Today's Appointments</span>
                    {sortField === 'appointmentsToday' && (
                      sortDirection === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />
                    )}
                  </div>
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('revenue')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Revenue</span>
                    {sortField === 'revenue' && (
                      sortDirection === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />
                    )}
                  </div>
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('utilizationRate')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Utilization</span>
                    {sortField === 'utilizationRate' && (
                      sortDirection === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />
                    )}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Health
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAndSortedData.map((cabinet) => (
                <tr key={cabinet.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{cabinet.name}</div>
                      <div className="text-sm text-gray-500">{cabinet.address.city}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(cabinet.status)}`}>
                      {cabinet.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {cabinet.metrics.appointmentsToday}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(cabinet.metrics.revenue)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-16 bg-gray-200 rounded-full h-2 mr-2" role="progressbar" aria-valuenow={cabinet.metrics.utilizationRate} aria-valuemin={0} aria-valuemax={100}>
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${cabinet.metrics.utilizationRate}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-900">{cabinet.metrics.utilizationRate}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-sm font-medium ${getHealthStatusColor(cabinet.metrics.healthStatus)}`}>
                      {cabinet.metrics.healthStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <button
                        type="button"
                        onClick={() => onCabinetDetail?.(cabinet)}
                        className="text-blue-600 hover:text-blue-900"
                        title="View Analytics"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onCabinetSettings?.(cabinet)}
                        className="text-gray-600 hover:text-gray-900"
                        title="Settings"
                      >
                        <Settings className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredAndSortedData.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500">No cabinets found matching your criteria.</div>
          </div>
        )}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="text-2xl font-bold text-gray-900">{filteredAndSortedData.length}</div>
          <div className="text-sm text-gray-600">Total Cabinets</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="text-2xl font-bold text-green-600">
            {filteredAndSortedData.filter(c => c.status === CabinetStatus.ACTIVE).length}
          </div>
          <div className="text-sm text-gray-600">Active</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="text-2xl font-bold text-blue-600">
            {filteredAndSortedData.reduce((sum, c) => sum + c.metrics.appointmentsToday, 0)}
          </div>
          <div className="text-sm text-gray-600">Today's Appointments</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="text-2xl font-bold text-purple-600">
            {formatCurrency(filteredAndSortedData.reduce((sum, c) => sum + c.metrics.revenue, 0))}
          </div>
          <div className="text-sm text-gray-600">Total Revenue</div>
        </div>
      </div>
    </div>
  );
}