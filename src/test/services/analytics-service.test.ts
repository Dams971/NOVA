import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AnalyticsService } from '@/lib/services/analytics-service';
import { 
  PerformanceMetrics, 
  MetricType, 
  TimeGranularity, 
  DateRange,
  ExportOptions 
} from '@/lib/models/analytics';
import { subDays, format } from 'date-fns';

// Mock fetch globally
global.fetch = vi.fn();

describe('AnalyticsService', () => {
  let analyticsService: AnalyticsService;
  let mockDateRange: DateRange;

  beforeEach(() => {
    analyticsService = new AnalyticsService();
    mockDateRange = {
      start: subDays(new Date(), 30),
      end: new Date()
    };
    vi.clearAllMocks();
  });

  describe('calculateTrend', () => {
    it('should calculate upward trend correctly', () => {
      const result = analyticsService.calculateTrend(120, 100);
      expect(result.trend).toBe('up');
      expect(result.value).toBe(20);
    });

    it('should calculate downward trend correctly', () => {
      const result = analyticsService.calculateTrend(80, 100);
      expect(result.trend).toBe('down');
      expect(result.value).toBe(20);
    });

    it('should calculate stable trend for small changes', () => {
      const result = analyticsService.calculateTrend(100.5, 100);
      expect(result.trend).toBe('stable');
      expect(result.value).toBe(0.5);
    });

    it('should handle zero previous value', () => {
      const result = analyticsService.calculateTrend(100, 0);
      expect(result.trend).toBe('stable');
      expect(result.value).toBe(0);
    });

    it('should handle negative values', () => {
      // -50 compared to -100: ((-50) - (-100)) / (-100) * 100 = 50 / (-100) * 100 = -50%
      // Since the change is negative, trend is 'down'
      const result = analyticsService.calculateTrend(-50, -100);
      expect(result.trend).toBe('down');
      expect(result.value).toBe(50);
    });
  });

  describe('generateTimeSeriesData', () => {
    let mockMetrics: PerformanceMetrics[];

    beforeEach(() => {
      mockMetrics = [
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
        },
        {
          cabinetId: 'cabinet-1',
          date: new Date('2024-01-03'),
          appointmentsCount: 8,
          revenue: 800,
          patientCount: 6,
          utilizationRate: 60,
          averageWaitTime: 20,
          cancellationRate: 7,
          noShowRate: 3,
          customerSatisfaction: 7.5
        }
      ];
    });

    it('should generate time series data for appointments', () => {
      const result = analyticsService.generateTimeSeriesData(
        mockMetrics,
        MetricType.APPOINTMENTS,
        TimeGranularity.DAY
      );

      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({
        date: '2024-01-01',
        value: 10,
        label: 'Jan 01'
      });
      expect(result[1]).toEqual({
        date: '2024-01-02',
        value: 12,
        label: 'Jan 02'
      });
      expect(result[2]).toEqual({
        date: '2024-01-03',
        value: 8,
        label: 'Jan 03'
      });
    });

    it('should generate time series data for revenue', () => {
      const result = analyticsService.generateTimeSeriesData(
        mockMetrics,
        MetricType.REVENUE,
        TimeGranularity.DAY
      );

      expect(result).toHaveLength(3);
      expect(result[0].value).toBe(1000);
      expect(result[1].value).toBe(1200);
      expect(result[2].value).toBe(800);
    });

    it('should generate time series data for utilization', () => {
      const result = analyticsService.generateTimeSeriesData(
        mockMetrics,
        MetricType.UTILIZATION,
        TimeGranularity.DAY
      );

      expect(result).toHaveLength(3);
      expect(result[0].value).toBe(75);
      expect(result[1].value).toBe(80);
      expect(result[2].value).toBe(60);
    });

    it('should handle weekly granularity', () => {
      const result = analyticsService.generateTimeSeriesData(
        mockMetrics,
        MetricType.APPOINTMENTS,
        TimeGranularity.WEEK
      );

      // All dates are in the same week, so should be grouped
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty('date');
      expect(result[0]).toHaveProperty('value');
      expect(result[0]).toHaveProperty('label');
    });

    it('should handle monthly granularity', () => {
      const result = analyticsService.generateTimeSeriesData(
        mockMetrics,
        MetricType.APPOINTMENTS,
        TimeGranularity.MONTH
      );

      // All dates are in the same month, so should be grouped
      expect(result).toHaveLength(1);
      expect(result[0].value).toBe(10); // Average of 10, 12, 8
    });

    it('should sort results by date', () => {
      // Shuffle the input data
      const shuffledMetrics = [mockMetrics[2], mockMetrics[0], mockMetrics[1]];
      
      const result = analyticsService.generateTimeSeriesData(
        shuffledMetrics,
        MetricType.APPOINTMENTS,
        TimeGranularity.DAY
      );

      expect(result[0].date).toBe('2024-01-01');
      expect(result[1].date).toBe('2024-01-02');
      expect(result[2].date).toBe('2024-01-03');
    });
  });

  describe('generateMockAnalytics', () => {
    it('should generate mock analytics with correct structure', () => {
      const cabinetId = 'test-cabinet';
      const result = analyticsService.generateMockAnalytics(cabinetId, mockDateRange);

      expect(result.cabinetId).toBe(cabinetId);
      expect(result.period).toEqual(mockDateRange);
      
      // Check overview structure
      expect(result.overview).toHaveProperty('totalAppointments');
      expect(result.overview).toHaveProperty('totalRevenue');
      expect(result.overview).toHaveProperty('totalPatients');
      expect(result.overview).toHaveProperty('averageUtilization');
      expect(result.overview).toHaveProperty('trends');

      // Check time series structure
      expect(result.timeSeries).toHaveProperty('appointments');
      expect(result.timeSeries).toHaveProperty('revenue');
      expect(result.timeSeries).toHaveProperty('utilization');
      expect(result.timeSeries).toHaveProperty('satisfaction');

      // Check breakdown structure
      expect(result.breakdown).toHaveProperty('appointmentsByType');
      expect(result.breakdown).toHaveProperty('revenueByService');
      expect(result.breakdown).toHaveProperty('patientsByAge');
      expect(result.breakdown).toHaveProperty('appointmentsByHour');

      // Check comparisons structure
      expect(result.comparisons).toHaveProperty('previousPeriod');
      expect(result.comparisons).toHaveProperty('networkAverage');
    });

    it('should generate time series data for the correct date range', () => {
      const result = analyticsService.generateMockAnalytics('test-cabinet', mockDateRange);
      
      // Use eachDayOfInterval to get the exact same calculation as the service
      const expectedDays = require('date-fns').eachDayOfInterval({ start: mockDateRange.start, end: mockDateRange.end }).length;
      
      expect(result.timeSeries.appointments).toHaveLength(expectedDays);
      expect(result.timeSeries.revenue).toHaveLength(expectedDays);
      expect(result.timeSeries.utilization).toHaveLength(expectedDays);
      expect(result.timeSeries.satisfaction).toHaveLength(expectedDays);
    });

    it('should generate realistic data ranges', () => {
      const result = analyticsService.generateMockAnalytics('test-cabinet', mockDateRange);

      // Check appointments are in reasonable range (10-30 per day)
      result.timeSeries.appointments.forEach(item => {
        expect(item.value).toBeGreaterThanOrEqual(10);
        expect(item.value).toBeLessThanOrEqual(30);
      });

      // Check utilization is percentage (0-100)
      result.timeSeries.utilization.forEach(item => {
        expect(item.value).toBeGreaterThanOrEqual(0);
        expect(item.value).toBeLessThanOrEqual(100);
      });

      // Check satisfaction is in 0-10 range
      result.timeSeries.satisfaction.forEach(item => {
        expect(item.value).toBeGreaterThanOrEqual(0);
        expect(item.value).toBeLessThanOrEqual(10);
      });
    });

    it('should generate breakdown data with correct percentages', () => {
      const result = analyticsService.generateMockAnalytics('test-cabinet', mockDateRange);

      // Check that percentages add up to 100 for each breakdown
      const appointmentPercentages = result.breakdown.appointmentsByType.reduce((sum, item) => sum + item.percentage, 0);
      expect(appointmentPercentages).toBe(100);

      const revenuePercentages = result.breakdown.revenueByService.reduce((sum, item) => sum + item.percentage, 0);
      expect(revenuePercentages).toBe(100);

      const patientPercentages = result.breakdown.patientsByAge.reduce((sum, item) => sum + item.percentage, 0);
      expect(patientPercentages).toBe(100);
    });
  });

  describe('API integration', () => {
    it('should fetch cabinet analytics successfully', async () => {
      const mockResponse = {
        success: true,
        data: analyticsService.generateMockAnalytics('test-cabinet', mockDateRange)
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await analyticsService.getCabinetAnalytics('test-cabinet', mockDateRange);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.cabinetId).toBe('test-cabinet');
    });

    it('should handle API errors gracefully', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        statusText: 'Internal Server Error'
      });

      const result = await analyticsService.getCabinetAnalytics('test-cabinet', mockDateRange);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to fetch analytics');
    });

    it('should export report successfully', async () => {
      const mockBlob = new Blob(['test data'], { type: 'text/csv' });
      
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        blob: async () => mockBlob
      });

      const exportOptions: ExportOptions = {
        format: 'csv',
        includeCharts: false,
        sections: ['overview'],
        dateRange: mockDateRange
      };

      const result = await analyticsService.exportReport('test-cabinet', exportOptions);

      expect(result.success).toBe(true);
      expect(result.data).toBe(mockBlob);
    });

    it('should handle export errors gracefully', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        statusText: 'Bad Request'
      });

      const exportOptions: ExportOptions = {
        format: 'csv',
        includeCharts: false,
        sections: ['overview'],
        dateRange: mockDateRange
      };

      const result = await analyticsService.exportReport('test-cabinet', exportOptions);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to export report');
    });

    it('should fetch report templates successfully', async () => {
      const mockTemplates = [
        {
          id: 'comprehensive',
          name: 'Comprehensive Report',
          description: 'Complete analytics report',
          sections: ['overview', 'trends'],
          defaultFormat: 'pdf' as const,
          isDefault: true
        }
      ];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockTemplates })
      });

      const result = await analyticsService.getReportTemplates();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockTemplates);
    });
  });

  describe('data validation', () => {
    it('should handle empty metrics array', () => {
      const result = analyticsService.generateTimeSeriesData(
        [],
        MetricType.APPOINTMENTS,
        TimeGranularity.DAY
      );

      expect(result).toEqual([]);
    });

    it('should handle invalid metric type gracefully', () => {
      const mockMetrics: PerformanceMetrics[] = [{
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
      }];

      const result = analyticsService.generateTimeSeriesData(
        mockMetrics,
        'invalid' as MetricType,
        TimeGranularity.DAY
      );

      expect(result).toHaveLength(1);
      expect(result[0].value).toBe(0);
    });

    it('should handle future date ranges', () => {
      const futureDateRange: DateRange = {
        start: new Date('2025-01-01'),
        end: new Date('2025-01-31')
      };

      const result = analyticsService.generateMockAnalytics('test-cabinet', futureDateRange);

      expect(result.period).toEqual(futureDateRange);
      expect(result.timeSeries.appointments.length).toBeGreaterThan(0);
    });
  });
});