import { format, subDays, subWeeks, subMonths, startOfDay, endOfDay, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval } from 'date-fns';
import { 
  CabinetAnalytics, 
  PerformanceMetrics, 
  AnalyticsQuery, 
  DateRange, 
  TimeSeriesData, 
  DrillDownData,
  MetricType,
  TimeGranularity,
  ExportOptions,
  ReportTemplate,
  BenchmarkData,
  AnomalyDetection
} from '../models/analytics';

export interface AnalyticsServiceResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export class AnalyticsService {
  private baseUrl: string;

  constructor(baseUrl: string = '/api') {
    this.baseUrl = baseUrl;
  }

  async getCabinetAnalytics(
    cabinetId: string, 
    dateRange: DateRange,
    granularity: TimeGranularity = TimeGranularity.DAY
  ): Promise<AnalyticsServiceResult<CabinetAnalytics>> {
    try {
      const query = new URLSearchParams({
        cabinetId,
        startDate: dateRange.start.toISOString(),
        endDate: dateRange.end.toISOString(),
        granularity
      });

      const response = await fetch(`${this.baseUrl}/analytics/cabinet?${query}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch analytics: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        success: true,
        data: data.data
      };
    } catch (_error) {
      console.error('Error fetching cabinet analytics:', _error);
      return {
        success: false,
        error: _error instanceof Error ? _error.message : 'Unknown error occurred'
      };
    }
  }

  async getPerformanceMetrics(
    cabinetId: string,
    dateRange: DateRange
  ): Promise<AnalyticsServiceResult<PerformanceMetrics[]>> {
    try {
      const query = new URLSearchParams({
        cabinetId,
        startDate: dateRange.start.toISOString(),
        endDate: dateRange.end.toISOString()
      });

      const response = await fetch(`${this.baseUrl}/analytics/metrics?${query}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch performance metrics: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        success: true,
        data: data.data
      };
    } catch (_error) {
      console.error('Error fetching performance metrics:', _error);
      return {
        success: false,
        error: _error instanceof Error ? _error.message : 'Unknown error occurred'
      };
    }
  }

  async exportReport(
    cabinetId: string,
    options: ExportOptions
  ): Promise<AnalyticsServiceResult<Blob>> {
    try {
      const response = await fetch(`${this.baseUrl}/analytics/export`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          cabinetId,
          ...options,
          dateRange: {
            start: options.dateRange.start.toISOString(),
            end: options.dateRange.end.toISOString()
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to export report: ${response.statusText}`);
      }

      const blob = await response.blob();
      return {
        success: true,
        data: blob
      };
    } catch (_error) {
      console.error('Error exporting report:', _error);
      return {
        success: false,
        error: _error instanceof Error ? _error.message : 'Unknown error occurred'
      };
    }
  }

  async getReportTemplates(): Promise<AnalyticsServiceResult<ReportTemplate[]>> {
    try {
      const response = await fetch(`${this.baseUrl}/analytics/templates`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch report templates: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        success: true,
        data: data.data
      };
    } catch (_error) {
      console.error('Error fetching report templates:', _error);
      return {
        success: false,
        error: _error instanceof Error ? _error.message : 'Unknown error occurred'
      };
    }
  }

  // Utility methods for data processing
  calculateTrend(current: number, previous: number): { trend: 'up' | 'down' | 'stable'; value: number } {
    if (previous === 0) {
      return { trend: 'stable', value: 0 };
    }

    const change = ((current - previous) / previous) * 100;
    
    if (Math.abs(change) < 1) {
      return { trend: 'stable', value: Math.abs(change) };
    }
    
    return {
      trend: change > 0 ? 'up' : 'down',
      value: Math.abs(change)
    };
  }

  generateTimeSeriesData(
    data: PerformanceMetrics[],
    metric: MetricType,
    granularity: TimeGranularity
  ): TimeSeriesData[] {
    const groupedData = new Map<string, number[]>();

    data.forEach(item => {
      let key: string;
      
      switch (granularity) {
        case TimeGranularity.HOUR:
          key = format(item.date, 'yyyy-MM-dd HH:00');
          break;
        case TimeGranularity.DAY:
          key = format(item.date, 'yyyy-MM-dd');
          break;
        case TimeGranularity.WEEK:
          key = format(item.date, 'yyyy-\'W\'ww');
          break;
        case TimeGranularity.MONTH:
          key = format(item.date, 'yyyy-MM');
          break;
        default:
          key = format(item.date, 'yyyy-MM-dd');
      }

      if (!groupedData.has(key)) {
        groupedData.set(key, []);
      }

      let value: number;
      switch (metric) {
        case MetricType.APPOINTMENTS:
          value = item.appointmentsCount;
          break;
        case MetricType.REVENUE:
          value = item.revenue;
          break;
        case MetricType.UTILIZATION:
          value = item.utilizationRate;
          break;
        case MetricType.SATISFACTION:
          value = item.customerSatisfaction;
          break;
        case MetricType.WAIT_TIME:
          value = item.averageWaitTime;
          break;
        case MetricType.CANCELLATION_RATE:
          value = item.cancellationRate;
          break;
        case MetricType.NO_SHOW_RATE:
          value = item.noShowRate;
          break;
        default:
          value = 0;
      }

      groupedData.get(key)!.push(value);
    });

    return Array.from(groupedData.entries()).map(([date, values]) => ({
      date,
      value: values.reduce((sum, val) => sum + val, 0) / values.length,
      label: this.formatDateLabel(date, granularity)
    })).sort((a, b) => a.date.localeCompare(b.date));
  }

  private formatDateLabel(date: string, granularity: TimeGranularity): string {
    try {
      const parsedDate = new Date(date);
      if (isNaN(parsedDate.getTime())) {
        return date;
      }
      
      switch (granularity) {
        case TimeGranularity.HOUR:
          return format(parsedDate, 'HH:mm');
        case TimeGranularity.DAY:
          return format(parsedDate, 'MMM dd');
        case TimeGranularity.WEEK:
          return format(parsedDate, 'MMM dd');
        case TimeGranularity.MONTH:
          return format(parsedDate, 'MMM yyyy');
        default:
          return date;
      }
    } catch (error) {
      return date;
    }
  }

  // Comparative analytics methods
  async getComparativeAnalytics(
    cabinetIds: string[],
    dateRange: DateRange,
    granularity: TimeGranularity = TimeGranularity.DAY
  ): Promise<AnalyticsServiceResult<{ [cabinetId: string]: CabinetAnalytics }>> {
    try {
      const query = new URLSearchParams({
        cabinetIds: cabinetIds.join(','),
        startDate: dateRange.start.toISOString(),
        endDate: dateRange.end.toISOString(),
        granularity
      });

      const response = await fetch(`${this.baseUrl}/analytics/comparative?${query}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch comparative analytics: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        success: true,
        data: data.data
      };
    } catch (_error) {
      console.error('Error fetching comparative analytics:', _error);
      return {
        success: false,
        error: _error instanceof Error ? _error.message : 'Unknown error occurred'
      };
    }
  }

  async getBenchmarkData(
    cabinetIds: string[],
    dateRange: DateRange
  ): Promise<AnalyticsServiceResult<BenchmarkData[]>> {
    try {
      const query = new URLSearchParams({
        cabinetIds: cabinetIds.join(','),
        startDate: dateRange.start.toISOString(),
        endDate: dateRange.end.toISOString()
      });

      const response = await fetch(`${this.baseUrl}/analytics/benchmarks?${query}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch benchmark data: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        success: true,
        data: data.data
      };
    } catch (_error) {
      console.error('Error fetching benchmark data:', _error);
      return {
        success: false,
        error: _error instanceof Error ? _error.message : 'Unknown error occurred'
      };
    }
  }

  async detectAnomalies(
    cabinetIds: string[],
    dateRange: DateRange,
    sensitivity: 'low' | 'medium' | 'high' = 'medium'
  ): Promise<AnalyticsServiceResult<AnomalyDetection[]>> {
    try {
      const query = new URLSearchParams({
        cabinetIds: cabinetIds.join(','),
        startDate: dateRange.start.toISOString(),
        endDate: dateRange.end.toISOString(),
        sensitivity
      });

      const response = await fetch(`${this.baseUrl}/analytics/anomalies?${query}`);
      
      if (!response.ok) {
        throw new Error(`Failed to detect anomalies: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        success: true,
        data: data.data
      };
    } catch (_error) {
      console.error('Error detecting anomalies:', _error);
      return {
        success: false,
        error: _error instanceof Error ? _error.message : 'Unknown error occurred'
      };
    }
  }

  // Statistical analysis utilities
  calculateStatistics(values: number[]): {
    mean: number;
    median: number;
    standardDeviation: number;
    min: number;
    max: number;
    percentiles: { p25: number; p75: number; p90: number; p95: number };
  } {
    const sorted = [...values].sort((a, b) => a - b);
    const n = sorted.length;
    
    const mean = values.reduce((sum, val) => sum + val, 0) / n;
    const median = n % 2 === 0 ? 
      (sorted[n / 2 - 1] + sorted[n / 2]) / 2 : 
      sorted[Math.floor(n / 2)];
    
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / n;
    const standardDeviation = Math.sqrt(variance);
    
    const getPercentile = (p: number) => {
      const index = Math.ceil((p / 100) * n) - 1;
      return sorted[Math.max(0, Math.min(index, n - 1))];
    };

    return {
      mean,
      median,
      standardDeviation,
      min: sorted[0],
      max: sorted[n - 1],
      percentiles: {
        p25: getPercentile(25),
        p75: getPercentile(75),
        p90: getPercentile(90),
        p95: getPercentile(95)
      }
    };
  }

  detectOutliers(values: number[], method: 'iqr' | 'zscore' = 'iqr'): {
    outliers: number[];
    indices: number[];
    threshold: { lower: number; upper: number };
  } {
    if (method === 'iqr') {
      const stats = this.calculateStatistics(values);
      const iqr = stats.percentiles.p75 - stats.percentiles.p25;
      const lowerBound = stats.percentiles.p25 - 1.5 * iqr;
      const upperBound = stats.percentiles.p75 + 1.5 * iqr;
      
      const outliers: number[] = [];
      const indices: number[] = [];
      
      values.forEach((value, index) => {
        if (value < lowerBound || value > upperBound) {
          outliers.push(value);
          indices.push(index);
        }
      });
      
      return {
        outliers,
        indices,
        threshold: { lower: lowerBound, upper: upperBound }
      };
    } else {
      // Z-score method
      const stats = this.calculateStatistics(values);
      const threshold = 2; // 2 standard deviations
      const lowerBound = stats.mean - threshold * stats.standardDeviation;
      const upperBound = stats.mean + threshold * stats.standardDeviation;
      
      const outliers: number[] = [];
      const indices: number[] = [];
      
      values.forEach((value, index) => {
        if (value < lowerBound || value > upperBound) {
          outliers.push(value);
          indices.push(index);
        }
      });
      
      return {
        outliers,
        indices,
        threshold: { lower: lowerBound, upper: upperBound }
      };
    }
  }

  // Mock data generation for development/testing
  generateMockAnalytics(cabinetId: string, dateRange: DateRange): CabinetAnalytics {
    // Generate mock time series data
    const appointments = eachDayOfInterval({ start: dateRange.start, end: dateRange.end }).map(date => ({
      date: format(date, 'yyyy-MM-dd'),
      value: Math.floor(Math.random() * 20) + 10,
      label: format(date, 'MMM dd')
    }));

    const revenue = appointments.map(item => ({
      ...item,
      value: item.value * (Math.random() * 100 + 50)
    }));

    const utilization = appointments.map(item => ({
      ...item,
      value: Math.random() * 40 + 60
    }));

    const satisfaction = appointments.map(item => ({
      ...item,
      value: Math.random() * 2 + 8
    }));

    return {
      cabinetId,
      period: dateRange,
      overview: {
        totalAppointments: appointments.reduce((sum, item) => sum + item.value, 0),
        totalRevenue: revenue.reduce((sum, item) => sum + item.value, 0),
        totalPatients: Math.floor(appointments.reduce((sum, item) => sum + item.value, 0) * 0.8),
        averageUtilization: utilization.reduce((sum, item) => sum + item.value, 0) / utilization.length,
        trends: {
          appointments: Math.random() * 20 - 10,
          revenue: Math.random() * 30 - 15,
          patients: Math.random() * 15 - 7,
          utilization: Math.random() * 10 - 5
        }
      },
      timeSeries: {
        appointments,
        revenue,
        utilization,
        satisfaction
      },
      breakdown: {
        appointmentsByType: [
          { category: 'Consultation', value: 45, percentage: 45, trend: 'up', trendValue: 5.2 },
          { category: 'Cleaning', value: 30, percentage: 30, trend: 'stable', trendValue: 0.8 },
          { category: 'Treatment', value: 20, percentage: 20, trend: 'down', trendValue: -2.1 },
          { category: 'Emergency', value: 5, percentage: 5, trend: 'up', trendValue: 1.5 }
        ],
        revenueByService: [
          { category: 'Implants', value: 15000, percentage: 40, trend: 'up', trendValue: 8.3 },
          { category: 'Orthodontics', value: 12000, percentage: 32, trend: 'up', trendValue: 3.7 },
          { category: 'Cleaning', value: 6000, percentage: 16, trend: 'stable', trendValue: 0.5 },
          { category: 'Fillings', value: 4500, percentage: 12, trend: 'down', trendValue: -1.2 }
        ],
        patientsByAge: [
          { category: '18-30', value: 25, percentage: 25, trend: 'up', trendValue: 3.2 },
          { category: '31-45', value: 35, percentage: 35, trend: 'stable', trendValue: 0.8 },
          { category: '46-60', value: 30, percentage: 30, trend: 'up', trendValue: 2.1 },
          { category: '60+', value: 10, percentage: 10, trend: 'down', trendValue: -1.5 }
        ],
        appointmentsByHour: [
          { category: '9:00', value: 8, percentage: 10, trend: 'stable', trendValue: 0.2 },
          { category: '10:00', value: 12, percentage: 15, trend: 'up', trendValue: 2.1 },
          { category: '11:00', value: 15, percentage: 19, trend: 'up', trendValue: 3.5 },
          { category: '14:00', value: 18, percentage: 22, trend: 'stable', trendValue: 0.8 },
          { category: '15:00', value: 14, percentage: 17, trend: 'down', trendValue: -1.2 },
          { category: '16:00', value: 10, percentage: 12, trend: 'down', trendValue: -2.3 },
          { category: '17:00', value: 4, percentage: 5, trend: 'stable', trendValue: 0.1 }
        ]
      },
      comparisons: {
        previousPeriod: {
          appointments: Math.random() * 20 - 10,
          revenue: Math.random() * 30 - 15,
          patients: Math.random() * 15 - 7,
          utilization: Math.random() * 10 - 5
        },
        networkAverage: {
          appointments: Math.random() * 15 - 7,
          revenue: Math.random() * 25 - 12,
          patients: Math.random() * 12 - 6,
          utilization: Math.random() * 8 - 4
        }
      }
    };
  }
}