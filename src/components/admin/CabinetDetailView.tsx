'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  
  ResponsiveContainer 
} from 'recharts';
import { 
  
  Download, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Users, 
  DollarSign, 
  
  Activity,
  ArrowLeft,
  RefreshCw,
  BarChart3,
  PieChart as PieChartIcon
} from 'lucide-react';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';

import { Cabinet } from '@/lib/models/cabinet';
import { CabinetAnalytics, DateRange, TimeGranularity, ExportOptions, MetricType } from '@/lib/models/analytics';
import { AnalyticsService } from '@/lib/services/analytics-service';

interface CabinetDetailViewProps {
  cabinet: Cabinet;
  onBack: () => void;
}

type DateRangePreset = '7d' | '30d' | '90d' | 'custom';

const COLORS = ['#3B82F6', '#10B981', 'warning-600', '#EF4444', '#8B5CF6', '#06B6D4'];

export default function CabinetDetailView({ cabinet, onBack }: CabinetDetailViewProps) {
  const [analytics, setAnalytics] = useState<CabinetAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRangePreset, setDateRangePreset] = useState<DateRangePreset>('30d');
  const [customDateRange, setCustomDateRange] = useState<DateRange>({
    start: subDays(new Date(), 30),
    end: new Date()
  });
  const [selectedMetric, setSelectedMetric] = useState<MetricType>(MetricType.APPOINTMENTS);
  const [granularity, setGranularity] = useState<TimeGranularity>(TimeGranularity.DAY);
  const [activeTab, setActiveTab] = useState<'overview' | 'trends' | 'breakdown' | 'comparison'>('overview');
  const [exportLoading, setExportLoading] = useState(false);

  const analyticsService = useMemo(() => new AnalyticsService(), []);

  const dateRange = useMemo(() => {
    if (dateRangePreset === 'custom') {
      return customDateRange;
    }

    const end = new Date();
    let start: Date;

    switch (dateRangePreset) {
      case '7d':
        start = subDays(end, 7);
        break;
      case '30d':
        start = subDays(end, 30);
        break;
      case '90d':
        start = subDays(end, 90);
        break;
      default:
        start = subDays(end, 30);
    }

    return { start: startOfDay(start), end: endOfDay(end) };
  }, [dateRangePreset, customDateRange]);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);

    try {
      // For now, use mock data since the API endpoints aren't implemented yet
      const mockAnalytics = analyticsService.generateMockAnalytics(cabinet.id, dateRange);
      setAnalytics(mockAnalytics);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cabinet.id, dateRange, granularity]);

  const handleExport = async (format: 'pdf' | 'excel' | 'csv') => {
    if (!analytics) return;

    setExportLoading(true);
    try {
      const options: ExportOptions = {
        format,
        includeCharts: format === 'pdf',
        sections: ['overview', 'trends', 'breakdown', 'comparison'],
        dateRange
      };

      const result = await analyticsService.exportReport(cabinet.id, options);
      
      if (result.success && result.data) {
        // Create download link
        const url = window.URL.createObjectURL(result.data);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${cabinet.name}-analytics-${format(new Date(), 'yyyy-MM-dd')}.${format}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } else {
        throw new Error(result.error || 'Export failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setExportLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTrendColor = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      default:
        return 'text-gray-600';
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
            <button
              onClick={fetchAnalytics}
              className="mt-3 text-sm bg-red-100 text-red-800 px-3 py-1 rounded hover:bg-red-200"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return <div>No analytics data available</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="inline-flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Overview
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{cabinet.name}</h1>
            <p className="text-gray-600">{cabinet.address.city} • Performance Analytics</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <button
            onClick={fetchAnalytics}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </button>
          
          <div className="relative">
            <select
              value={dateRangePreset}
              onChange={(e) => setDateRangePreset(e.target.value as DateRangePreset)}
              className="appearance-none bg-white border border-gray-300 rounded-md px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="custom">Custom range</option>
            </select>
          </div>

          <div className="relative">
            <button
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              onClick={() => {}}
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </button>
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-10 hidden group-hover:block">
              <div className="py-1">
                <button
                  onClick={() => handleExport('pdf')}
                  disabled={exportLoading}
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                >
                  Export as PDF
                </button>
                <button
                  onClick={() => handleExport('excel')}
                  disabled={exportLoading}
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                >
                  Export as Excel
                </button>
                <button
                  onClick={() => handleExport('csv')}
                  disabled={exportLoading}
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                >
                  Export as CSV
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Custom Date Range Picker */}
      {dateRangePreset === 'custom' && (
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center space-x-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                value={format(customDateRange.start, 'yyyy-MM-dd')}
                onChange={(e) => setCustomDateRange(prev => ({ ...prev, start: new Date(e.target.value) }))}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                value={format(customDateRange.end, 'yyyy-MM-dd')}
                onChange={(e) => setCustomDateRange(prev => ({ ...prev, end: new Date(e.target.value) }))}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm"
              />
            </div>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', name: 'Overview', icon: BarChart3 },
            { id: 'trends', name: 'Trends', icon: TrendingUp },
            { id: 'breakdown', name: 'Breakdown', icon: PieChartIcon },
            { id: 'comparison', name: 'Comparison', icon: Activity }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
            >
              <tab.icon className="h-4 w-4" />
              <span>{tab.name}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-lg shadow border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Appointments</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.overview.totalAppointments}</p>
                </div>
                <div className="flex items-center space-x-1">
                  {getTrendIcon(analytics.overview.trends.appointments > 0 ? 'up' : analytics.overview.trends.appointments < 0 ? 'down' : 'stable')}
                  <span className={`text-sm font-medium ${getTrendColor(analytics.overview.trends.appointments > 0 ? 'up' : analytics.overview.trends.appointments < 0 ? 'down' : 'stable')}`}>
                    {formatPercentage(Math.abs(analytics.overview.trends.appointments))}
                  </span>
                </div>
              </div>
              <div className="mt-2">
                <Users className="h-8 w-8 text-blue-500" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(analytics.overview.totalRevenue)}</p>
                </div>
                <div className="flex items-center space-x-1">
                  {getTrendIcon(analytics.overview.trends.revenue > 0 ? 'up' : analytics.overview.trends.revenue < 0 ? 'down' : 'stable')}
                  <span className={`text-sm font-medium ${getTrendColor(analytics.overview.trends.revenue > 0 ? 'up' : analytics.overview.trends.revenue < 0 ? 'down' : 'stable')}`}>
                    {formatPercentage(Math.abs(analytics.overview.trends.revenue))}
                  </span>
                </div>
              </div>
              <div className="mt-2">
                <DollarSign className="h-8 w-8 text-green-500" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Patients</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.overview.totalPatients}</p>
                </div>
                <div className="flex items-center space-x-1">
                  {getTrendIcon(analytics.overview.trends.patients > 0 ? 'up' : analytics.overview.trends.patients < 0 ? 'down' : 'stable')}
                  <span className={`text-sm font-medium ${getTrendColor(analytics.overview.trends.patients > 0 ? 'up' : analytics.overview.trends.patients < 0 ? 'down' : 'stable')}`}>
                    {formatPercentage(Math.abs(analytics.overview.trends.patients))}
                  </span>
                </div>
              </div>
              <div className="mt-2">
                <Users className="h-8 w-8 text-purple-500" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg. Utilization</p>
                  <p className="text-2xl font-bold text-gray-900">{formatPercentage(analytics.overview.averageUtilization)}</p>
                </div>
                <div className="flex items-center space-x-1">
                  {getTrendIcon(analytics.overview.trends.utilization > 0 ? 'up' : analytics.overview.trends.utilization < 0 ? 'down' : 'stable')}
                  <span className={`text-sm font-medium ${getTrendColor(analytics.overview.trends.utilization > 0 ? 'up' : analytics.overview.trends.utilization < 0 ? 'down' : 'stable')}`}>
                    {formatPercentage(Math.abs(analytics.overview.trends.utilization))}
                  </span>
                </div>
              </div>
              <div className="mt-2">
                <Activity className="h-8 w-8 text-orange-500" />
              </div>
            </div>
          </div>

          {/* Quick Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg shadow border">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Appointments Trend</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analytics.timeSeries.appointments}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="value" stroke="#3B82F6" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white p-6 rounded-lg shadow border">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Revenue Trend</h3>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={analytics.timeSeries.revenue}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" />
                  <YAxis />
                  <Tooltip formatter={(value) => [formatCurrency(value as number), 'Revenue']} />
                  <Area type="monotone" dataKey="value" stroke="#10B981" fill="#10B981" fillOpacity={0.3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'trends' && (
        <div className="space-y-6">
          {/* Metric Selector */}
          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <label className="text-sm font-medium text-gray-700">Metric:</label>
                <select
                  value={selectedMetric}
                  onChange={(e) => setSelectedMetric(e.target.value as MetricType)}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                >
                  <option value={MetricType.APPOINTMENTS}>Appointments</option>
                  <option value={MetricType.REVENUE}>Revenue</option>
                  <option value={MetricType.UTILIZATION}>Utilization</option>
                  <option value={MetricType.SATISFACTION}>Satisfaction</option>
                </select>
              </div>
              
              <div className="flex items-center space-x-4">
                <label className="text-sm font-medium text-gray-700">Granularity:</label>
                <select
                  value={granularity}
                  onChange={(e) => setGranularity(e.target.value as TimeGranularity)}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                >
                  <option value={TimeGranularity.DAY}>Daily</option>
                  <option value={TimeGranularity.WEEK}>Weekly</option>
                  <option value={TimeGranularity.MONTH}>Monthly</option>
                </select>
              </div>
            </div>
          </div>

          {/* Trend Chart */}
          <div className="bg-white p-6 rounded-lg shadow border">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {selectedMetric.charAt(0).toUpperCase() + selectedMetric.slice(1)} Trend
            </h3>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={analytics.timeSeries[selectedMetric as keyof typeof analytics.timeSeries]}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis />
                <Tooltip 
                  formatter={(value) => {
                    if (selectedMetric === MetricType.REVENUE) {
                      return [formatCurrency(value as number), 'Revenue'];
                    } else if (selectedMetric === MetricType.UTILIZATION) {
                      return [formatPercentage(value as number), 'Utilization'];
                    }
                    return [value, selectedMetric];
                  }}
                />
                <Line type="monotone" dataKey="value" stroke="#3B82F6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {activeTab === 'breakdown' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Appointments by Type */}
            <div className="bg-white p-6 rounded-lg shadow border">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Appointments by Type</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={analytics.breakdown.appointmentsByType}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ category, percentage }) => `${category} (${percentage}%)`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {analytics.breakdown.appointmentsByType.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Revenue by Service */}
            <div className="bg-white p-6 rounded-lg shadow border">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Revenue by Service</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics.breakdown.revenueByService}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" />
                  <YAxis />
                  <Tooltip formatter={(value) => [formatCurrency(value as number), 'Revenue']} />
                  <Bar dataKey="value" fill="#10B981" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Appointments by Hour */}
            <div className="bg-white p-6 rounded-lg shadow border">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Appointments by Hour</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics.breakdown.appointmentsByHour}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="warning-600" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Patients by Age */}
            <div className="bg-white p-6 rounded-lg shadow border">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Patients by Age Group</h3>
              <div className="space-y-3">
                {analytics.breakdown.patientsByAge.map((item, index) => (
                  <div key={item.category} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div 
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="text-sm font-medium text-gray-900">{item.category}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">{item.percentage}%</span>
                      <div className="flex items-center space-x-1">
                        {getTrendIcon(item.trend)}
                        <span className={`text-xs ${getTrendColor(item.trend)}`}>
                          {formatPercentage(item.trendValue)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'comparison' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Previous Period Comparison */}
            <div className="bg-white p-6 rounded-lg shadow border">
              <h3 className="text-lg font-medium text-gray-900 mb-4">vs Previous Period</h3>
              <div className="space-y-4">
                {Object.entries(analytics.comparisons.previousPeriod).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700 capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                    <div className="flex items-center space-x-2">
                      {getTrendIcon(value > 0 ? 'up' : value < 0 ? 'down' : 'stable')}
                      <span className={`text-sm font-medium ${getTrendColor(value > 0 ? 'up' : value < 0 ? 'down' : 'stable')}`}>
                        {value > 0 ? '+' : ''}{formatPercentage(value)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Network Average Comparison */}
            <div className="bg-white p-6 rounded-lg shadow border">
              <h3 className="text-lg font-medium text-gray-900 mb-4">vs Network Average</h3>
              <div className="space-y-4">
                {Object.entries(analytics.comparisons.networkAverage).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700 capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                    <div className="flex items-center space-x-2">
                      {getTrendIcon(value > 0 ? 'up' : value < 0 ? 'down' : 'stable')}
                      <span className={`text-sm font-medium ${getTrendColor(value > 0 ? 'up' : value < 0 ? 'down' : 'stable')}`}>
                        {value > 0 ? '+' : ''}{formatPercentage(value)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}