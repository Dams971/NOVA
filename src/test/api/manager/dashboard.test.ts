import { NextRequest } from 'next/server';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GET, POST } from '@/app/api/manager/dashboard/[cabinetId]/route';
import { PerformanceService } from '@/lib/services/performance-service';

// Mock the PerformanceService
vi.mock('@/lib/services/performance-service');

describe('/api/manager/dashboard/[cabinetId]', () => {
  const mockPerformanceService = {
    getCabinetKPIs: vi.fn(),
    getActiveAlerts: vi.fn(),
    acknowledgeAlert: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(PerformanceService.getInstance).mockReturnValue(mockPerformanceService as any);
  });

  describe('GET', () => {
    it('should return dashboard data successfully', async () => {
      const mockKPIs = {
        cabinetId: 'test-cabinet-1',
        period: { start: new Date(), end: new Date() },
        totalAppointments: 50,
        completedAppointments: 40,
        cancelledAppointments: 5,
        noShowAppointments: 5,
        completionRate: 80,
        noShowRate: 10,
        cancellationRate: 10,
        totalRevenue: 3000,
        averageAppointmentValue: 75,
        totalPatients: 35,
        newPatients: 8,
        returningPatients: 27,
        averageWaitTime: 15,
        appointmentUtilization: 75,
        trends: {
          appointments: 5,
          revenue: 10,
          patients: 2,
          noShowRate: -2
        },
        updatedAt: new Date()
      };

      const mockAlerts = [
        {
          id: 'alert-1',
          cabinetId: 'test-cabinet-1',
          type: 'warning' as const,
          category: 'appointments' as const,
          title: 'Test Alert',
          message: 'Test message',
          isActive: true,
          createdAt: new Date()
        }
      ];

      mockPerformanceService.getCabinetKPIs.mockResolvedValue({
        success: true,
        data: mockKPIs
      });

      mockPerformanceService.getActiveAlerts.mockResolvedValue({
        success: true,
        data: mockAlerts
      });

      const request = new NextRequest('http://localhost:3000/api/manager/dashboard/test-cabinet-1?timeRange=week');
      const params = { cabinetId: 'test-cabinet-1' };

      const response = await GET(request, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.kpis.cabinetId).toBe(mockKPIs.cabinetId);
      expect(data.data.kpis.totalAppointments).toBe(mockKPIs.totalAppointments);
      expect(data.data.alerts).toHaveLength(mockAlerts.length);
    });

    it('should handle different time ranges', async () => {
      mockPerformanceService.getCabinetKPIs.mockResolvedValue({
        success: true,
        data: {}
      });

      mockPerformanceService.getActiveAlerts.mockResolvedValue({
        success: true,
        data: []
      });

      const testCases = ['day', 'week', 'month', 'quarter'];

      for (const timeRange of testCases) {
        const request = new NextRequest(`http://localhost:3000/api/manager/dashboard/test-cabinet-1?timeRange=${timeRange}`);
        const params = { cabinetId: 'test-cabinet-1' };

        const response = await GET(request, { params });
        
        expect(response.status).toBe(200);
        expect(mockPerformanceService.getCabinetKPIs).toHaveBeenCalledWith(
          'test-cabinet-1',
          expect.any(Date),
          expect.any(Date)
        );
      }
    });

    it('should handle KPI service errors', async () => {
      mockPerformanceService.getCabinetKPIs.mockResolvedValue({
        success: false,
        error: 'Database connection failed'
      });

      const request = new NextRequest('http://localhost:3000/api/manager/dashboard/test-cabinet-1');
      const params = { cabinetId: 'test-cabinet-1' };

      const response = await GET(request, { params });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Database connection failed');
    });

    it('should handle alerts service errors', async () => {
      mockPerformanceService.getCabinetKPIs.mockResolvedValue({
        success: true,
        data: {}
      });

      mockPerformanceService.getActiveAlerts.mockResolvedValue({
        success: false,
        error: 'Failed to fetch alerts'
      });

      const request = new NextRequest('http://localhost:3000/api/manager/dashboard/test-cabinet-1');
      const params = { cabinetId: 'test-cabinet-1' };

      const response = await GET(request, { params });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to fetch alerts');
    });

    it('should use default time range when not specified', async () => {
      mockPerformanceService.getCabinetKPIs.mockResolvedValue({
        success: true,
        data: {}
      });

      mockPerformanceService.getActiveAlerts.mockResolvedValue({
        success: true,
        data: []
      });

      const request = new NextRequest('http://localhost:3000/api/manager/dashboard/test-cabinet-1');
      const params = { cabinetId: 'test-cabinet-1' };

      await GET(request, { params });

      expect(mockPerformanceService.getCabinetKPIs).toHaveBeenCalledWith(
        'test-cabinet-1',
        expect.any(Date),
        expect.any(Date)
      );
    });
  });

  describe('POST', () => {
    it('should acknowledge alert successfully', async () => {
      mockPerformanceService.acknowledgeAlert.mockResolvedValue({
        success: true,
        data: true
      });

      const requestBody = {
        action: 'acknowledge_alert',
        alertId: 'alert-1',
        userId: 'user-1'
      };

      const request = new NextRequest('http://localhost:3000/api/manager/dashboard/test-cabinet-1', {
        method: 'POST',
        body: JSON.stringify(requestBody)
      });
      const params = { cabinetId: 'test-cabinet-1' };

      const response = await POST(request, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toBe(true);
      expect(mockPerformanceService.acknowledgeAlert).toHaveBeenCalledWith('alert-1', 'user-1');
    });

    it('should handle acknowledge alert errors', async () => {
      mockPerformanceService.acknowledgeAlert.mockResolvedValue({
        success: false,
        error: 'Alert not found'
      });

      const requestBody = {
        action: 'acknowledge_alert',
        alertId: 'invalid-alert',
        userId: 'user-1'
      };

      const request = new NextRequest('http://localhost:3000/api/manager/dashboard/test-cabinet-1', {
        method: 'POST',
        body: JSON.stringify(requestBody)
      });
      const params = { cabinetId: 'test-cabinet-1' };

      const response = await POST(request, { params });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Alert not found');
    });

    it('should return error for invalid action', async () => {
      const requestBody = {
        action: 'invalid_action'
      };

      const request = new NextRequest('http://localhost:3000/api/manager/dashboard/test-cabinet-1', {
        method: 'POST',
        body: JSON.stringify(requestBody)
      });
      const params = { cabinetId: 'test-cabinet-1' };

      const response = await POST(request, { params });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid action');
    });

    it('should handle missing required fields for acknowledge_alert', async () => {
      const requestBody = {
        action: 'acknowledge_alert'
        // Missing alertId and userId
      };

      const request = new NextRequest('http://localhost:3000/api/manager/dashboard/test-cabinet-1', {
        method: 'POST',
        body: JSON.stringify(requestBody)
      });
      const params = { cabinetId: 'test-cabinet-1' };

      const response = await POST(request, { params });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid action');
    });
  });

  describe('Data Isolation', () => {
    it('should only access data for the specified cabinet ID', async () => {
      mockPerformanceService.getCabinetKPIs.mockResolvedValue({
        success: true,
        data: { cabinetId: 'test-cabinet-1' }
      });

      mockPerformanceService.getActiveAlerts.mockResolvedValue({
        success: true,
        data: []
      });

      const request = new NextRequest('http://localhost:3000/api/manager/dashboard/test-cabinet-1');
      const params = { cabinetId: 'test-cabinet-1' };

      await GET(request, { params });

      expect(mockPerformanceService.getCabinetKPIs).toHaveBeenCalledWith(
        'test-cabinet-1',
        expect.any(Date),
        expect.any(Date)
      );
      expect(mockPerformanceService.getActiveAlerts).toHaveBeenCalledWith('test-cabinet-1');
    });

    it('should not allow access to other cabinet data', async () => {
      // This test ensures that the API only uses the cabinetId from the URL params
      // and doesn't allow manipulation through request body or query params
      
      mockPerformanceService.getCabinetKPIs.mockResolvedValue({
        success: true,
        data: { cabinetId: 'cabinet-1' }
      });

      mockPerformanceService.getActiveAlerts.mockResolvedValue({
        success: true,
        data: []
      });

      const request = new NextRequest('http://localhost:3000/api/manager/dashboard/cabinet-1?cabinetId=cabinet-2');
      const params = { cabinetId: 'cabinet-1' };

      await GET(request, { params });

      // Should use the cabinetId from params, not from query string
      expect(mockPerformanceService.getCabinetKPIs).toHaveBeenCalledWith(
        'cabinet-1',
        expect.any(Date),
        expect.any(Date)
      );
      expect(mockPerformanceService.getActiveAlerts).toHaveBeenCalledWith('cabinet-1');
    });
  });
});