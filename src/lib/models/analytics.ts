export interface PerformanceMetrics {
  cabinetId: string;
  date: Date;
  appointmentsCount: number;
  revenue: number;
  patientCount: number;
  utilizationRate: number;
  averageWaitTime: number;
  cancellationRate: number;
  noShowRate: number;
  customerSatisfaction: number;
}

export interface TimeSeriesData {
  date: string;
  value: number;
  label?: string;
}

export interface DrillDownData {
  category: string;
  value: number;
  percentage: number;
  trend: 'up' | 'down' | 'stable';
  trendValue: number;
}

export interface CabinetAnalytics {
  cabinetId: string;
  period: DateRange;
  overview: {
    totalAppointments: number;
    totalRevenue: number;
    totalPatients: number;
    averageUtilization: number;
    trends: {
      appointments: number;
      revenue: number;
      patients: number;
      utilization: number;
    };
  };
  timeSeries: {
    appointments: TimeSeriesData[];
    revenue: TimeSeriesData[];
    utilization: TimeSeriesData[];
    satisfaction: TimeSeriesData[];
  };
  breakdown: {
    appointmentsByType: DrillDownData[];
    revenueByService: DrillDownData[];
    patientsByAge: DrillDownData[];
    appointmentsByHour: DrillDownData[];
  };
  comparisons: {
    previousPeriod: {
      appointments: number;
      revenue: number;
      patients: number;
      utilization: number;
    };
    networkAverage: {
      appointments: number;
      revenue: number;
      patients: number;
      utilization: number;
    };
  };
}

export interface DateRange {
  start: Date;
  end: Date;
}

export interface ExportOptions {
  format: 'pdf' | 'excel' | 'csv';
  includeCharts: boolean;
  sections: string[];
  dateRange: DateRange;
}

export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  sections: string[];
  defaultFormat: 'pdf' | 'excel' | 'csv';
  isDefault: boolean;
}

export enum MetricType {
  APPOINTMENTS = 'appointments',
  REVENUE = 'revenue',
  UTILIZATION = 'utilization',
  SATISFACTION = 'satisfaction',
  WAIT_TIME = 'wait_time',
  CANCELLATION_RATE = 'cancellation_rate',
  NO_SHOW_RATE = 'no_show_rate'
}

export enum TimeGranularity {
  HOUR = 'hour',
  DAY = 'day',
  WEEK = 'week',
  MONTH = 'month',
  QUARTER = 'quarter',
  YEAR = 'year'
}

export interface AnalyticsQuery {
  cabinetId: string;
  metrics: MetricType[];
  dateRange: DateRange;
  granularity: TimeGranularity;
  compareWith?: {
    previousPeriod?: boolean;
    networkAverage?: boolean;
    specificCabinets?: string[];
  };
}

export interface BenchmarkData {
  metric: string;
  networkAverage: number;
  topPerformer: number;
  bottomPerformer: number;
  cabinetValues: { [cabinetId: string]: number };
}

export interface AnomalyDetection {
  cabinetId: string;
  cabinetName: string;
  metric: string;
  value: number;
  expectedRange: { min: number; max: number };
  severity: 'low' | 'medium' | 'high';
  description: string;
  detectedAt: Date;
  confidence: number;
}

export interface ComparativeAnalytics {
  cabinets: { [cabinetId: string]: CabinetAnalytics };
  benchmarks: BenchmarkData[];
  anomalies: AnomalyDetection[];
  correlations: {
    metric1: MetricType;
    metric2: MetricType;
    coefficient: number;
    significance: number;
  }[];
  insights: {
    topPerformers: { cabinetId: string; metric: string; value: number }[];
    underPerformers: { cabinetId: string; metric: string; value: number }[];
    trends: { metric: string; direction: 'up' | 'down' | 'stable'; strength: number }[];
  };
}