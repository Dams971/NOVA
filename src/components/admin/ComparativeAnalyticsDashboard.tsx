'use client';

import { subDays } from 'date-fns';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  AlertTriangle,
  Award,
  Target,
  RefreshCw,
  Eye,
  EyeOff,
  BarChart3,
  Activity,
  Zap
} from 'lucide-react';
import React, { useState, useEffect, useMemo } from 'react';
import { 
  LineChart, 
  Line, 
  
  BarChart, 
  Bar, 
  ScatterChart,
  Scatter,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { CabinetAnalytics, DateRange, MetricType } from '@/lib/models/analytics';
import { Cabinet } from '@/lib/models/cabinet';
import { AnalyticsService } from '@/lib/services/analytics-service';

interface ComparativeAnalyticsDashboardProps {
  cabinets: Cabinet[];
  onCabinetSelect?: (cabinet: Cabinet) => void;
}

interface CabinetComparison {
  cabinet: Cabinet;
  analytics: CabinetAnalytics;
  isVisible: boolean;
  color: string;
}

interface BenchmarkData {
  metric: string;
  networkAverage: number;
  topPerformer: number;
  bottomPerformer: number;
  cabinetValues: { [cabinetId: string]: number };
}

interface AnomalyDetection {
  cabinetId: string;
  cabinetName: string;
  metric: string;
  value: number;
  expectedRange: { min: number; max: number };
  severity: 'low' | 'medium' | 'high';
  description: string;
}

type DateRangePreset = '7d' | '30d' | '90d' | 'custom';
type ComparisonView = 'overview' | 'trends' | 'benchmarks' | 'anomalies';

const CHART_COLORS = [
  '#3B82F6', '#10B981', 'warning-600', '#EF4444', '#8B5CF6', 
  '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6366F1'
];

export default function ComparativeAnalyticsDashboard({ 
  cabinets, 
  onCabinetSelect 
}: ComparativeAnalyticsDashboardProps) {
  const [comparisons, setComparisons] = useState<CabinetComparison[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRangePreset, setDateRangePreset] = useState<DateRangePreset>('30d');
  const [customDateRange, _setCustomDateRange] = useState<DateRange>({
    start: subDays(new Date(), 30),
    end: new Date()
  });
  const [selectedMetric, setSelectedMetric] = useState<MetricType>(MetricType.REVENUE);
  const [activeView, setActiveView] = useState<ComparisonView>('overview');
  const [selectedCabinets, setSelectedCabinets] = useState<string[]>([]);
  const [benchmarkData, setBenchmarkData] = useState<BenchmarkData[]>([]);
  const [anomalies, setAnomalies] = useState<AnomalyDetection[]>([]);

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

    return { start, end };
  }, [dateRangePreset, customDateRange]);

  const fetchComparativeData = async () => {
    setLoading(true);
    setError(null);

    try {
      const comparativeData: CabinetComparison[] = [];
      
      for (let i = 0; i < cabinets.length; i++) {
        const cabinet = cabinets[i];
        const analytics = analyticsService.generateMockAnalytics(cabinet.id, dateRange);
        
        comparativeData.push({
          cabinet,
          analytics,
          isVisible: selectedCabinets.length === 0 || selectedCabinets.includes(cabinet.id),
          color: CHART_COLORS[i % CHART_COLORS.length]
        });
      }

      setComparisons(comparativeData);
      generateBenchmarkData(comparativeData);
      detectAnomalies(comparativeData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load comparative data');
    } finally {
      setLoading(false);
    }
  };

  const generateBenchmarkData = (data: CabinetComparison[]) => {
    const metrics = [
      { key: 'totalAppointments', label: 'Total Appointments' },
      { key: 'totalRevenue', label: 'Total Revenue' },
      { key: 'averageUtilization', label: 'Average Utilization' },
      { key: 'totalPatients', label: 'Total Patients' }
    ];

    const benchmarks: BenchmarkData[] = metrics.map(metric => {
      const values = data.map(item => {
        const value = item.analytics.overview[metric.key as keyof typeof item.analytics.overview] as number;
        return { cabinetId: item.cabinet.id, value };
      });

      const sortedValues = values.map(v => v.value).sort((a, b) => a - b);
      const networkAverage = sortedValues.reduce((sum, val) => sum + val, 0) / sortedValues.length;
      const topPerformer = sortedValues[sortedValues.length - 1];
      const bottomPerformer = sortedValues[0];

      const cabinetValues: { [cabinetId: string]: number } = {};
      values.forEach(({ cabinetId, value }) => {
        cabinetValues[cabinetId] = value;
      });

      return {
        metric: metric.label,
        networkAverage,
        topPerformer,
        bottomPerformer,
        cabinetValues
      };
    });

    setBenchmarkData(benchmarks);
  };

  const detectAnomalies = (data: CabinetComparison[]) => {
    const detectedAnomalies: AnomalyDetection[] = [];

    data.forEach(({ cabinet, analytics }) => {
      // Check for revenue anomalies
      const revenueData = analytics.timeSeries.revenue;
      const avgRevenue = revenueData.reduce((sum, item) => sum + item.value, 0) / revenueData.length;
      const revenueStdDev = Math.sqrt(
        revenueData.reduce((sum, item) => sum + Math.pow(item.value - avgRevenue, 2), 0) / revenueData.length
      );

      revenueData.forEach(item => {
        const deviation = Math.abs(item.value - avgRevenue) / revenueStdDev;
        if (deviation > 2) {
          detectedAnomalies.push({
            cabinetId: cabinet.id,
            cabinetName: cabinet.name,
            metric: 'Revenue',
            value: item.value,
            expectedRange: { 
              min: avgRevenue - 2 * revenueStdDev, 
              max: avgRevenue + 2 * revenueStdDev 
            },
            severity: deviation > 3 ? 'high' : 'medium',
            description: `Revenue on ${item.label} is ${deviation > 3 ? 'significantly' : 'notably'} ${item.value > avgRevenue ? 'above' : 'below'} expected range`
          });
        }
      });

      // Check for utilization anomalies
      if (analytics.overview.averageUtilization < 50) {
        detectedAnomalies.push({
          cabinetId: cabinet.id,
          cabinetName: cabinet.name,
          metric: 'Utilization',
          value: analytics.overview.averageUtilization,
          expectedRange: { min: 70, max: 95 },
          severity: analytics.overview.averageUtilization < 30 ? 'high' : 'medium',
          description: `Utilization rate is below optimal range (${analytics.overview.averageUtilization.toFixed(1)}%)`
        });
      }

      // Check for appointment trend anomalies
      if (analytics.overview.trends.appointments < -20) {
        detectedAnomalies.push({
          cabinetId: cabinet.id,
          cabinetName: cabinet.name,
          metric: 'Appointments Trend',
          value: analytics.overview.trends.appointments,
          expectedRange: { min: -10, max: 20 },
          severity: analytics.overview.trends.appointments < -30 ? 'high' : 'medium',
          description: `Significant decline in appointments (${analytics.overview.trends.appointments.toFixed(1)}%)`
        });
      }
    });

    setAnomalies(detectedAnomalies);
  };

  useEffect(() => {
    fetchComparativeData();
  }, [cabinets, dateRange]);

  useEffect(() => {
    if (selectedCabinets.length === 0) {
      setComparisons(prev => prev.map(comp => ({ ...comp, isVisible: true })));
    } else {
      setComparisons(prev => prev.map(comp => ({
        ...comp,
        isVisible: selectedCabinets.includes(comp.cabinet.id)
      })));
    }
  }, [selectedCabinets]);

  const toggleCabinetVisibility = (cabinetId: string) => {
    setSelectedCabinets(prev => {
      if (prev.includes(cabinetId)) {
        return prev.filter(id => id !== cabinetId);
      } else {
        return [...prev, cabinetId];
      }
    });
  };

  const visibleComparisons = comparisons.filter(comp => comp.isVisible);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const getSeverityColor = (severity: 'low' | 'medium' | 'high') => {
    switch (severity) {
      case 'high':
        return 'text-red-600 bg-red-100';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100';
      default:
        return 'text-blue-600 bg-blue-100';
    }
  };

  const getTrendIcon = (trend: number) => {
    if (Math.abs(trend) < 1) return <Minus className="h-4 w-4 text-gray-500" />;
    return trend > 0 ? 
      <TrendingUp className="h-4 w-4 text-green-500" /> : 
      <TrendingDown className="h-4 w-4 text-red-500" />;
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
            <button
              type="button"
              onClick={fetchComparativeData}
              className="mt-3 text-sm bg-red-100 text-red-800 px-3 py-1 rounded hover:bg-red-200"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Comparative Analytics</h1>
          <p className="text-gray-600">Compare performance across your cabinet network</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <button
            type="button"
            onClick={fetchComparativeData}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </button>
          
          <select
            value={dateRangePreset}
            onChange={(e) => setDateRangePreset(e.target.value as DateRangePreset)}
            className="appearance-none bg-white border border-gray-300 rounded-md px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            title="Select date range"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="custom">Custom range</option>
          </select>
        </div>
      </div>

      {/* Cabinet Selection */}
      <div className="bg-white p-4 rounded-lg shadow border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Cabinet Selection</h3>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setSelectedCabinets([])}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Show All
            </button>
            <button
              type="button"
              onClick={() => setSelectedCabinets(cabinets.map(c => c.id))}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Hide All
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {comparisons.map((comp, _index) => (
            <div
              key={comp.cabinet.id}
              className={`flex items-center space-x-2 p-2 rounded border cursor-pointer transition-colors ${
                comp.isVisible ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'
              }`}
              onClick={() => toggleCabinetVisibility(comp.cabinet.id)}
            >
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: comp.color }}
              />
              <span className="text-sm font-medium text-gray-900 truncate">
                {comp.cabinet.name}
              </span>
              {comp.isVisible ? (
                <Eye className="h-4 w-4 text-blue-500 ml-auto" />
              ) : (
                <EyeOff className="h-4 w-4 text-gray-400 ml-auto" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', name: 'Overview', icon: BarChart3 },
            { id: 'trends', name: 'Trends', icon: TrendingUp },
            { id: 'benchmarks', name: 'Benchmarks', icon: Target },
            { id: 'anomalies', name: 'Anomalies', icon: Zap }
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveView(tab.id as ComparisonView)}
              className={`${
                activeView === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
            >
              <tab.icon className="h-4 w-4" />
              <span>{tab.name}</span>
              {tab.id === 'anomalies' && anomalies.length > 0 && (
                <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                  {anomalies.length}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeView === 'overview' && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-lg shadow border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Network Total</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {visibleComparisons.reduce((sum, comp) => sum + comp.analytics.overview.totalAppointments, 0)}
                  </p>
                  <p className="text-xs text-gray-500">Appointments</p>
                </div>
                <Activity className="h-8 w-8 text-blue-500" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Network Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(visibleComparisons.reduce((sum, comp) => sum + comp.analytics.overview.totalRevenue, 0))}
                  </p>
                  <p className="text-xs text-gray-500">Total</p>
                </div>
                <Award className="h-8 w-8 text-green-500" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg Utilization</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatPercentage(
                      visibleComparisons.reduce((sum, comp) => sum + comp.analytics.overview.averageUtilization, 0) / 
                      visibleComparisons.length
                    )}
                  </p>
                  <p className="text-xs text-gray-500">Network</p>
                </div>
                <Target className="h-8 w-8 text-purple-500" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Cabinets</p>
                  <p className="text-2xl font-bold text-gray-900">{visibleComparisons.length}</p>
                  <p className="text-xs text-gray-500">of {cabinets.length}</p>
                </div>
                <BarChart3 className="h-8 w-8 text-orange-500" />
              </div>
            </div>
          </div>

          {/* Multi-Cabinet Comparison Chart */}
          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Revenue Comparison</h3>
              <select
                value={selectedMetric}
                onChange={(e) => setSelectedMetric(e.target.value as MetricType)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                title="Select metric to compare"
              >
                <option value={MetricType.REVENUE}>Revenue</option>
                <option value={MetricType.APPOINTMENTS}>Appointments</option>
                <option value={MetricType.UTILIZATION}>Utilization</option>
              </select>
            </div>
            
            <ResponsiveContainer width="100%" height={400}>
              <LineChart>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="label"
                  type="category"
                  allowDuplicatedCategory={false}
                />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => {
                    if (selectedMetric === MetricType.REVENUE) {
                      return [formatCurrency(value as number), name];
                    } else if (selectedMetric === MetricType.UTILIZATION) {
                      return [formatPercentage(value as number), name];
                    }
                    return [value, name];
                  }}
                />
                <Legend />
                {visibleComparisons.map((comp) => (
                  <Line
                    key={comp.cabinet.id}
                    type="monotone"
                    dataKey="value"
                    data={(() => {
                      // Map MetricType to available timeSeries keys
                      const metricMap: Record<string, keyof typeof comp.analytics.timeSeries> = {
                        [MetricType.APPOINTMENTS]: 'appointments',
                        [MetricType.REVENUE]: 'revenue',
                        [MetricType.UTILIZATION]: 'utilization',
                        [MetricType.SATISFACTION]: 'satisfaction',
                        // Default fallback for metrics not in timeSeries
                        [MetricType.WAIT_TIME]: 'appointments',
                        [MetricType.CANCELLATION_RATE]: 'appointments',
                        [MetricType.NO_SHOW_RATE]: 'appointments'
                      };
                      const timeSeriesKey = metricMap[selectedMetric] || 'appointments';
                      return comp.analytics.timeSeries[timeSeriesKey];
                    })()}
                    name={comp.cabinet.name}
                    stroke={comp.color}
                    strokeWidth={2}
                    connectNulls={false}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {activeView === 'trends' && (
        <div className="space-y-6">
          {/* Trend Analysis */}
          <div className="bg-white p-6 rounded-lg shadow border">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Performance Trends</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {visibleComparisons.map((comp) => (
                <div key={comp.cabinet.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900 truncate">{comp.cabinet.name}</h4>
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: comp.color }} />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Appointments</span>
                      <div className="flex items-center space-x-1">
                        {getTrendIcon(comp.analytics.overview.trends.appointments)}
                        <span className="text-sm font-medium">
                          {formatPercentage(Math.abs(comp.analytics.overview.trends.appointments))}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Revenue</span>
                      <div className="flex items-center space-x-1">
                        {getTrendIcon(comp.analytics.overview.trends.revenue)}
                        <span className="text-sm font-medium">
                          {formatPercentage(Math.abs(comp.analytics.overview.trends.revenue))}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Utilization</span>
                      <div className="flex items-center space-x-1">
                        {getTrendIcon(comp.analytics.overview.trends.utilization)}
                        <span className="text-sm font-medium">
                          {formatPercentage(Math.abs(comp.analytics.overview.trends.utilization))}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Trend Scatter Plot */}
          <div className="bg-white p-6 rounded-lg shadow border">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Revenue vs Utilization Correlation</h3>
            <ResponsiveContainer width="100%" height={400}>
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  type="number" 
                  dataKey="utilization" 
                  name="Utilization"
                  domain={[0, 100]}
                  tickFormatter={(value) => `${value}%`}
                />
                <YAxis 
                  type="number" 
                  dataKey="revenue" 
                  name="Revenue"
                  tickFormatter={(value) => formatCurrency(value)}
                />
                <Tooltip 
                  formatter={(value, name) => {
                    if (name === 'Revenue') return [formatCurrency(value as number), name];
                    if (name === 'Utilization') return [`${value}%`, name];
                    return [value, name];
                  }}
                  labelFormatter={(label) => `Cabinet: ${label}`}
                />
                <Scatter
                  name="Cabinets"
                  data={visibleComparisons.map(comp => ({
                    utilization: comp.analytics.overview.averageUtilization,
                    revenue: comp.analytics.overview.totalRevenue,
                    name: comp.cabinet.name
                  }))}
                  fill="#3B82F6"
                />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {activeView === 'benchmarks' && (
        <div className="space-y-6">
          {/* Performance Benchmarks */}
          {benchmarkData.map((benchmark) => (
            <div key={benchmark.metric} className="bg-white p-6 rounded-lg shadow border">
              <h3 className="text-lg font-medium text-gray-900 mb-4">{benchmark.metric} Benchmarks</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {benchmark.metric.includes('Revenue') ? 
                      formatCurrency(benchmark.topPerformer) : 
                      benchmark.metric.includes('Utilization') ?
                        formatPercentage(benchmark.topPerformer) :
                        benchmark.topPerformer.toLocaleString()
                    }
                  </div>
                  <div className="text-sm text-green-700">Top Performer</div>
                </div>
                
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {benchmark.metric.includes('Revenue') ? 
                      formatCurrency(benchmark.networkAverage) : 
                      benchmark.metric.includes('Utilization') ?
                        formatPercentage(benchmark.networkAverage) :
                        Math.round(benchmark.networkAverage).toLocaleString()
                    }
                  </div>
                  <div className="text-sm text-blue-700">Network Average</div>
                </div>
                
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">
                    {benchmark.metric.includes('Revenue') ? 
                      formatCurrency(benchmark.bottomPerformer) : 
                      benchmark.metric.includes('Utilization') ?
                        formatPercentage(benchmark.bottomPerformer) :
                        benchmark.bottomPerformer.toLocaleString()
                    }
                  </div>
                  <div className="text-sm text-red-700">Needs Improvement</div>
                </div>
              </div>

              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={visibleComparisons.map(comp => ({
                    name: comp.cabinet.name,
                    value: benchmark.cabinetValues[comp.cabinet.id],
                    color: comp.color
                  }))}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis 
                    tickFormatter={(value) => {
                      if (benchmark.metric.includes('Revenue')) return formatCurrency(value);
                      if (benchmark.metric.includes('Utilization')) return `${value}%`;
                      return value.toLocaleString();
                    }}
                  />
                  <Tooltip 
                    formatter={(value) => {
                      if (benchmark.metric.includes('Revenue')) return [formatCurrency(value as number), benchmark.metric];
                      if (benchmark.metric.includes('Utilization')) return [`${value}%`, benchmark.metric];
                      return [value, benchmark.metric];
                    }}
                  />
                  <ReferenceLine y={benchmark.networkAverage} stroke="#3B82F6" strokeDasharray="5 5" />
                  <Bar dataKey="value" fill="#3B82F6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ))}
        </div>
      )}

      {activeView === 'anomalies' && (
        <div className="space-y-6">
          {/* Anomaly Detection Results */}
          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Detected Anomalies</h3>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">
                  {anomalies.length} anomalies detected
                </span>
              </div>
            </div>

            {anomalies.length === 0 ? (
              <div className="text-center py-8">
                <Zap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No anomalies detected in the selected time period.</p>
                <p className="text-sm text-gray-500 mt-2">All cabinets are performing within expected ranges.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {anomalies.map((anomaly, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="font-medium text-gray-900">{anomaly.cabinetName}</span>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getSeverityColor(anomaly.severity)}`}>
                            {anomaly.severity.toUpperCase()}
                          </span>
                        </div>
                        
                        <div className="text-sm text-gray-600 mb-2">
                          <strong>{anomaly.metric}:</strong> {anomaly.description}
                        </div>
                        
                        <div className="flex items-center space-x-4 text-sm">
                          <span>
                            <strong>Current:</strong> {
                              anomaly.metric.includes('Revenue') ? 
                                formatCurrency(anomaly.value) :
                                anomaly.metric.includes('Utilization') || anomaly.metric.includes('Trend') ?
                                  formatPercentage(anomaly.value) :
                                  anomaly.value.toLocaleString()
                            }
                          </span>
                          <span>
                            <strong>Expected:</strong> {
                              anomaly.metric.includes('Revenue') ? 
                                `${formatCurrency(anomaly.expectedRange.min)} - ${formatCurrency(anomaly.expectedRange.max)}` :
                                anomaly.metric.includes('Utilization') || anomaly.metric.includes('Trend') ?
                                  `${formatPercentage(anomaly.expectedRange.min)} - ${formatPercentage(anomaly.expectedRange.max)}` :
                                  `${anomaly.expectedRange.min.toLocaleString()} - ${anomaly.expectedRange.max.toLocaleString()}`
                            }
                          </span>
                        </div>
                      </div>
                      
                      <button
                        type="button"
                        onClick={() => {
                          const cabinet = cabinets.find(c => c.id === anomaly.cabinetId);
                          if (cabinet && onCabinetSelect) {
                            onCabinetSelect(cabinet);
                          }
                        }}
                        className="ml-4 text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}