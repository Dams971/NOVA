import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CabinetKPIs } from '@/lib/models/performance';
import { PerformanceService } from '@/lib/services/performance-service';

describe('PerformanceService', () => {
  let performanceService: PerformanceService;
  const mockCabinetId = 'test-cabinet-1';

  beforeEach(() => {
    // Reset the singleton instance for each test
    (PerformanceService as any).instance = undefined;
    performanceService = PerformanceService.getInstance();
  });

  describe('getCabinetKPIs', () => {
    it('should return KPIs for a cabinet', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-07');

      const result = await performanceService.getCabinetKPIs(mockCabinetId, startDate, endDate);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      
      if (result.data) {
        expect(result.data.cabinetId).toBe(mockCabinetId);
        expect(result.data.period.start).toEqual(startDate);
        expect(result.data.period.end).toEqual(endDate);
        expect(typeof result.data.totalAppointments).toBe('number');
        expect(typeof result.data.totalRevenue).toBe('number');
        expect(typeof result.data.noShowRate).toBe('number');
        expect(typeof result.data.completionRate).toBe('number');
        expect(result.data.trends).toBeDefined();
      }
    });

    it('should calculate completion rate correctly', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-07');

      const result = await performanceService.getCabinetKPIs(mockCabinetId, startDate, endDate);

      expect(result.success).toBe(true);
      if (result.data) {
        expect(result.data.completionRate).toBeGreaterThanOrEqual(0);
        expect(result.data.completionRate).toBeLessThanOrEqual(100);
      }
    });

    it('should calculate no-show rate correctly', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-07');

      const result = await performanceService.getCabinetKPIs(mockCabinetId, startDate, endDate);

      expect(result.success).toBe(true);
      if (result.data) {
        expect(result.data.noShowRate).toBeGreaterThanOrEqual(0);
        expect(result.data.noShowRate).toBeLessThanOrEqual(100);
      }
    });
  });

  describe('getActiveAlerts', () => {
    it('should return active alerts for a cabinet', async () => {
      const result = await performanceService.getActiveAlerts(mockCabinetId);

      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
      
      if (result.data && result.data.length > 0) {
        const alert = result.data[0];
        expect(alert.cabinetId).toBe(mockCabinetId);
        expect(alert.isActive).toBe(true);
        expect(['warning', 'critical', 'info']).toContain(alert.type);
        expect(['appointments', 'revenue', 'patients', 'operations']).toContain(alert.category);
      }
    });

    it('should generate high no-show rate alert when threshold exceeded', async () => {
      // Mock high no-show rate scenario
      vi.spyOn(performanceService, 'getCabinetKPIs').mockResolvedValue({
        success: true,
        data: {
          cabinetId: mockCabinetId,
          period: { start: new Date(), end: new Date() },
          totalAppointments: 100,
          completedAppointments: 70,
          cancelledAppointments: 10,
          noShowAppointments: 20,
          completionRate: 70,
          noShowRate: 20, // Above 15% threshold
          cancellationRate: 10,
          totalRevenue: 5000,
          averageAppointmentValue: 71.4,
          totalPatients: 45,
          newPatients: 8,
          returningPatients: 37,
          averageWaitTime: 15,
          appointmentUtilization: 75,
          trends: {
            appointments: 5,
            revenue: 10,
            patients: 2,
            noShowRate: 3
          },
          updatedAt: new Date()
        } as CabinetKPIs
      });

      const result = await performanceService.getActiveAlerts(mockCabinetId);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      
      if (result.data) {
        const noShowAlert = result.data.find(alert => 
          alert.category === 'appointments' && alert.title.includes('no-show')
        );
        expect(noShowAlert).toBeDefined();
        if (noShowAlert) {
          expect(noShowAlert.type).toBe('warning');
          expect(noShowAlert.threshold).toBe(15);
          expect(noShowAlert.currentValue).toBe(20);
        }
      }
    });
  });

  describe('acknowledgeAlert', () => {
    it('should acknowledge an alert successfully', async () => {
      const alertId = 'test-alert-1';
      const userId = 'test-user-1';

      const result = await performanceService.acknowledgeAlert(alertId, userId);

      expect(result.success).toBe(true);
      expect(result.data).toBe(true);
    });
  });

  describe('real-time updates', () => {
    it('should allow subscribing to updates', () => {
      const callback = vi.fn();
      
      performanceService.subscribeToUpdates(mockCabinetId, callback);
      
      // Simulate an update
      performanceService.simulateRealtimeUpdate(mockCabinetId);
      
      expect(callback).toHaveBeenCalled();
      
      // Cleanup
      performanceService.unsubscribeFromUpdates(mockCabinetId, callback);
    });

    it('should allow unsubscribing from updates', () => {
      const callback = vi.fn();
      
      performanceService.subscribeToUpdates(mockCabinetId, callback);
      performanceService.unsubscribeFromUpdates(mockCabinetId, callback);
      
      // Simulate an update after unsubscribing
      performanceService.simulateRealtimeUpdate(mockCabinetId);
      
      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('data isolation', () => {
    it('should only return data for the specified cabinet', async () => {
      const cabinet1 = 'cabinet-1';
      const cabinet2 = 'cabinet-2';

      const result1 = await performanceService.getCabinetKPIs(
        cabinet1, 
        new Date('2024-01-01'), 
        new Date('2024-01-07')
      );
      
      const result2 = await performanceService.getCabinetKPIs(
        cabinet2, 
        new Date('2024-01-01'), 
        new Date('2024-01-07')
      );

      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
      
      if (result1.data && result2.data) {
        expect(result1.data.cabinetId).toBe(cabinet1);
        expect(result2.data.cabinetId).toBe(cabinet2);
        expect(result1.data.cabinetId).not.toBe(result2.data.cabinetId);
      }
    });

    it('should only return alerts for the specified cabinet', async () => {
      const cabinet1 = 'cabinet-1';
      const cabinet2 = 'cabinet-2';

      const alerts1 = await performanceService.getActiveAlerts(cabinet1);
      const alerts2 = await performanceService.getActiveAlerts(cabinet2);

      expect(alerts1.success).toBe(true);
      expect(alerts2.success).toBe(true);

      if (alerts1.data && alerts2.data) {
        alerts1.data.forEach(alert => {
          expect(alert.cabinetId).toBe(cabinet1);
        });
        
        alerts2.data.forEach(alert => {
          expect(alert.cabinetId).toBe(cabinet2);
        });
      }
    });
  });
});