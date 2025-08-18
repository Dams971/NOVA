import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MetricType, TimeGranularity } from '@/lib/models/analytics';
import { AnalyticsService } from '@/lib/services/analytics-service';

// Mock fetch globally
global.fetch = vi.fn();

describe('AnalyticsService - Comparative Analytics', () => {
  let analyticsService: AnalyticsService;
  const mockFetch = global.fetch as any;

  beforeEach(() => {
    analyticsService = new AnalyticsService();
    vi.clearAllMocks();
  });

  describe('getComparativeAnalytics', () => {
    it('should fetch comparative analytics for multiple cabinets', async () => {
      const mockResponse = {
        data: {
          'cabinet-1': {
            cabinetId: 'cabinet-1',
            overview: { totalAppointments: 100, totalRevenue: 50000 }
          },
          'cabinet-2': {
            cabinetId: 'cabinet-2',
            overview: { totalAppointments: 80, totalRevenue: 40000 }
          }
        }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await analyticsService.getComparativeAnalytics(
        ['cabinet-1', 'cabinet-2'],
        { start: new Date('2024-01-01'), end: new Date('2024-01-31') },
        TimeGranularity.DAY
      );

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockResponse.data);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/analytics/comparative')
      );
    });

    it('should handle fetch errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: 'Internal Server Error'
      });

      const result = await analyticsService.getComparativeAnalytics(
        ['cabinet-1'],
        { start: new Date('2024-01-01'), end: new Date('2024-01-31') }
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to fetch comparative analytics');
    });
  });

  describe('getBenchmarkData', () => {
    it('should fetch benchmark data for cabinets', async () => {
      const mockBenchmarks = [
        {
          metric: 'Total Appointments',
          networkAverage: 75,
          topPerformer: 100,
          bottomPerformer: 50,
          cabinetValues: { 'cabinet-1': 100, 'cabinet-2': 50 }
        }
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockBenchmarks })
      });

      const result = await analyticsService.getBenchmarkData(
        ['cabinet-1', 'cabinet-2'],
        { start: new Date('2024-01-01'), end: new Date('2024-01-31') }
      );

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockBenchmarks);
    });
  });

  describe('detectAnomalies', () => {
    it('should detect anomalies in cabinet data', async () => {
      const mockAnomalies = [
        {
          cabinetId: 'cabinet-1',
          cabinetName: 'Cabinet Test',
          metric: 'Revenue',
          value: 10000,
          expectedRange: { min: 20000, max: 60000 },
          severity: 'high' as const,
          description: 'Revenue significantly below expected range',
          detectedAt: new Date(),
          confidence: 0.95
        }
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockAnomalies })
      });

      const result = await analyticsService.detectAnomalies(
        ['cabinet-1'],
        { start: new Date('2024-01-01'), end: new Date('2024-01-31') },
        'medium'
      );

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockAnomalies);
    });
  });

  describe('calculateStatistics', () => {
    it('should calculate basic statistics correctly', () => {
      const values = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
      const stats = analyticsService.calculateStatistics(values);

      expect(stats.mean).toBe(55);
      expect(stats.median).toBe(55);
      expect(stats.min).toBe(10);
      expect(stats.max).toBe(100);
      expect(stats.standardDeviation).toBeCloseTo(28.72, 1);
    });

    it('should handle single value', () => {
      const values = [42];
      const stats = analyticsService.calculateStatistics(values);

      expect(stats.mean).toBe(42);
      expect(stats.median).toBe(42);
      expect(stats.min).toBe(42);
      expect(stats.max).toBe(42);
      expect(stats.standardDeviation).toBe(0);
    });

    it('should calculate percentiles correctly', () => {
      const values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const stats = analyticsService.calculateStatistics(values);

      expect(stats.percentiles.p25).toBe(3);
      expect(stats.percentiles.p75).toBe(8);
      expect(stats.percentiles.p90).toBe(9);
      expect(stats.percentiles.p95).toBe(10);
    });
  });

  describe('detectOutliers', () => {
    it('should detect outliers using IQR method', () => {
      const values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 100]; // 100 is an outlier
      const result = analyticsService.detectOutliers(values, 'iqr');

      expect(result.outliers).toContain(100);
      expect(result.indices).toContain(9);
      expect(result.threshold.upper).toBeGreaterThan(10);
    });

    it('should detect outliers using Z-score method', () => {
      const values = [10, 12, 11, 13, 12, 11, 14, 13, 12, 50]; // 50 is an outlier
      const result = analyticsService.detectOutliers(values, 'zscore');

      expect(result.outliers).toContain(50);
      expect(result.indices).toContain(9);
    });

    it('should handle no outliers', () => {
      const values = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19];
      const result = analyticsService.detectOutliers(values, 'iqr');

      expect(result.outliers).toHaveLength(0);
      expect(result.indices).toHaveLength(0);
    });

    it('should handle empty array', () => {
      const values: number[] = [];
      const result = analyticsService.detectOutliers(values, 'iqr');

      expect(result.outliers).toHaveLength(0);
      expect(result.indices).toHaveLength(0);
    });
  });

  describe('calculateTrend', () => {
    it('should calculate positive trend correctly', () => {
      const result = analyticsService.calculateTrend(120, 100);
      
      expect(result.trend).toBe('up');
      expect(result.value).toBe(20);
    });

    it('should calculate negative trend correctly', () => {
      const result = analyticsService.calculateTrend(80, 100);
      
      expect(result.trend).toBe('down');
      expect(result.value).toBe(20);
    });

    it('should handle stable trend', () => {
      const result = analyticsService.calculateTrend(100, 100.5);
      
      expect(result.trend).toBe('stable');
      expect(result.value).toBeLessThan(1);
    });

    it('should handle zero previous value', () => {
      const result = analyticsService.calculateTrend(100, 0);
      
      expect(result.trend).toBe('stable');
      expect(result.value).toBe(0);
    });
  });

  describe('generateTimeSeriesData', () => {
    it('should generate time series data correctly', () => {
      const mockMetrics = [
        {
          cabinetId: 'cabinet-1',
          date: new Date('2024-01-01'),
          appointmentsCount: 10,
          revenue: 1000,
          patientCount: 8,
          utilizationRate: 75,
          averageWaitTime: 15,
          cancellationRate: 5,
          noShowRate: 2,
          customerSatisfaction: 8.5
        },
        {
          cabinetId: 'cabinet-1',
          date: new Date('2024-01-02'),
          appointmentsCount: 12,
          revenue: 1200,
          patientCount: 10,
          utilizationRate: 80,
          averageWaitTime: 12,
          cancellationRate: 3,
          noShowRate: 1,
          customerSatisfaction: 9.0
        }
      ];

      const result = analyticsService.generateTimeSeriesData(
        mockMetrics,
        MetricType.APPOINTMENTS,
        TimeGranularity.DAY
      );

      expect(result).toHaveLength(2);
      expect(result[0].value).toBe(10);
      expect(result[1].value).toBe(12);
      expect(result[0].date).toBe('2024-01-01');
      expect(result[1].date).toBe('2024-01-02');
    });

    it('should handle different metrics', () => {
      const mockMetrics = [
        {
          cabinetId: 'cabinet-1',
          date: new Date('2024-01-01'),
          appointmentsCount: 10,
          revenue: 1000,
          patientCount: 8,
          utilizationRate: 75,
          averageWaitTime: 15,
          cancellationRate: 5,
          noShowRate: 2,
          customerSatisfaction: 8.5
        }
      ];

      const revenueResult = analyticsService.generateTimeSeriesData(
        mockMetrics,
        MetricType.REVENUE,
        TimeGranularity.DAY
      );

      const utilizationResult = analyticsService.generateTimeSeriesData(
        mockMetrics,
        MetricType.UTILIZATION,
        TimeGranularity.DAY
      );

      expect(revenueResult[0].value).toBe(1000);
      expect(utilizationResult[0].value).toBe(75);
    });

    it('should group data by different granularities', () => {
      const mockMetrics = Array.from({ length: 7 }, (_, i) => ({
        cabinetId: 'cabinet-1',
        date: new Date(`2024-01-${String(i + 1).padStart(2, '0')}`),
        appointmentsCount: 10 + i,
        revenue: 1000 + i * 100,
        patientCount: 8,
        utilizationRate: 75,
        averageWaitTime: 15,
        cancellationRate: 5,
        noShowRate: 2,
        customerSatisfaction: 8.5
      }));

      const dailyResult = analyticsService.generateTimeSeriesData(
        mockMetrics,
        MetricType.APPOINTMENTS,
        TimeGranularity.DAY
      );

      const weeklyResult = analyticsService.generateTimeSeriesData(
        mockMetrics,
        MetricType.APPOINTMENTS,
        TimeGranularity.WEEK
      );

      expect(dailyResult).toHaveLength(7);
      expect(weeklyResult.length).toBeLessThanOrEqual(2); // Should group by week
    });
  });

  describe('generateMockAnalytics', () => {
    it('should generate mock analytics data', () => {
      const dateRange = {
        start: new Date('2024-01-01'),
        end: new Date('2024-01-31')
      };

      const result = analyticsService.generateMockAnalytics('cabinet-1', dateRange);

      expect(result.cabinetId).toBe('cabinet-1');
      expect(result.period).toEqual(dateRange);
      expect(result.overview.totalAppointments).toBeGreaterThan(0);
      expect(result.overview.totalRevenue).toBeGreaterThan(0);
      expect(result.timeSeries.appointments).toHaveLength(31); // 31 days in January
      expect(result.breakdown.appointmentsByType).toHaveLength(4);
    });

    it('should generate different data for different cabinets', () => {
      const dateRange = {
        start: new Date('2024-01-01'),
        end: new Date('2024-01-31')
      };

      const result1 = analyticsService.generateMockAnalytics('cabinet-1', dateRange);
      const result2 = analyticsService.generateMockAnalytics('cabinet-2', dateRange);

      // Results should be different due to randomization
      expect(result1.cabinetId).not.toBe(result2.cabinetId);
      // Values might be different due to randomization, but structure should be the same
      expect(result1.overview).toHaveProperty('totalAppointments');
      expect(result2.overview).toHaveProperty('totalAppointments');
    });
  });
});