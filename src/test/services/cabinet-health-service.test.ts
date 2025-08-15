import { describe, it, expect, beforeEach, afterEach, vi, Mock } from 'vitest';
import { CabinetHealthService, CabinetHealthStatus } from '../../lib/services/cabinet-health-service';
import { CabinetService } from '../../lib/services/cabinet-service';
import { Cabinet, CabinetStatus } from '../../lib/models/cabinet';
import DatabaseManager from '../../lib/database/connection';

// Mock dependencies
vi.mock('../../lib/services/cabinet-service');
vi.mock('../../lib/database/connection');
vi.mock('../../lib/monitoring/health', () => ({
  default: vi.fn().mockImplementation(() => ({
    getInstance: vi.fn().mockReturnThis()
  }))
}));
vi.mock('../../lib/monitoring/metrics', () => ({
  default: vi.fn().mockImplementation(() => ({
    getInstance: vi.fn().mockReturnThis(),
    recordMetric: vi.fn(),
    recordHealthCheck: vi.fn()
  }))
}));
vi.mock('../../lib/logging/logger', () => ({
  default: vi.fn().mockImplementation(() => ({
    getInstance: vi.fn().mockReturnThis(),
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn()
  }))
}));

describe('CabinetHealthService', () => {
  let healthService: CabinetHealthService;
  let mockCabinetService: Mock;
  let mockDbManager: Mock;
  let mockConnection: any;

  const mockCabinet: Cabinet = {
    id: 'cabinet-1',
    name: 'Test Cabinet',
    slug: 'test-cabinet',
    address: {
      street: '123 Test St',
      city: 'Test City',
      postalCode: '12345',
      country: 'France'
    },
    phone: '+33123456789',
    email: 'test@cabinet.com',
    timezone: 'Europe/Paris',
    status: CabinetStatus.ACTIVE,
    databaseName: 'nova_cabinet_test_cabinet',
    createdAt: new Date(),
    updatedAt: new Date()
  };

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Mock database connection
    mockConnection = {
      ping: vi.fn().mockResolvedValue(true),
      query: vi.fn().mockResolvedValue([{ test: 1 }])
    };

    // Mock DatabaseManager
    mockDbManager = vi.mocked(DatabaseManager.getInstance);
    mockDbManager.mockReturnValue({
      getCabinetConnection: vi.fn().mockResolvedValue(mockConnection)
    } as any);

    // Mock CabinetService
    mockCabinetService = vi.mocked(CabinetService);
    mockCabinetService.prototype.getCabinetById = vi.fn().mockResolvedValue({
      success: true,
      data: mockCabinet
    });
    mockCabinetService.prototype.getActiveCabinets = vi.fn().mockResolvedValue({
      success: true,
      data: [mockCabinet]
    });
    mockCabinetService.prototype.getAllCabinetConfigs = vi.fn().mockResolvedValue({
      success: true,
      data: {
        timezone: 'Europe/Paris',
        workingHours: {},
        bookingRules: {}
      }
    });

    healthService = new CabinetHealthService();
  });

  afterEach(() => {
    healthService.stopMonitoring();
  });

  describe('checkCabinetHealth', () => {
    it('should return healthy status for a working cabinet', async () => {
      const result = await healthService.checkCabinetHealth('cabinet-1');

      expect(result).toMatchObject({
        cabinetId: 'cabinet-1',
        cabinetName: 'Test Cabinet',
        status: 'healthy',
        issues: []
      });
      expect(result.checks).toHaveLength(4); // database, api, configuration, data-integrity
      expect(result.lastChecked).toBeInstanceOf(Date);
      expect(result.responseTime).toBeGreaterThan(0);
    });

    it('should return unhealthy status when database connection fails', async () => {
      mockConnection.ping.mockRejectedValue(new Error('Connection failed'));

      const result = await healthService.checkCabinetHealth('cabinet-1');

      expect(result.status).toBe('unhealthy');
      expect(result.issues).toContain('Database: Database connection failed: Connection failed');
      
      const dbCheck = result.checks.find(check => check.name === 'database');
      expect(dbCheck?.status).toBe('unhealthy');
    });

    it('should return degraded status when configuration is incomplete', async () => {
      mockCabinetService.prototype.getAllCabinetConfigs = vi.fn().mockResolvedValue({
        success: true,
        data: {
          timezone: 'Europe/Paris'
          // Missing workingHours and bookingRules
        }
      });

      const result = await healthService.checkCabinetHealth('cabinet-1');

      expect(result.status).toBe('degraded');
      expect(result.issues).toContain('Configuration: Missing configurations: workingHours, bookingRules');
      
      const configCheck = result.checks.find(check => check.name === 'configuration');
      expect(configCheck?.status).toBe('degraded');
    });

    it('should return unhealthy status when essential tables are missing', async () => {
      mockConnection.query.mockImplementation((query: string) => {
        if (query.includes('SHOW TABLES')) {
          return Promise.resolve([]); // No tables found
        }
        return Promise.resolve([{ test: 1 }]);
      });

      const result = await healthService.checkCabinetHealth('cabinet-1');

      expect(result.status).toBe('unhealthy');
      expect(result.issues).toContain('Data: Missing tables: appointments, patients, practitioners');
      
      const dataCheck = result.checks.find(check => check.name === 'data-integrity');
      expect(dataCheck?.status).toBe('unhealthy');
    });

    it('should handle cabinet not found error', async () => {
      mockCabinetService.prototype.getCabinetById = vi.fn().mockResolvedValue({
        success: false,
        error: 'Cabinet not found'
      });

      const result = await healthService.checkCabinetHealth('nonexistent-cabinet');

      expect(result.status).toBe('unhealthy');
      expect(result.issues).toContain('Health check failed: Cabinet nonexistent-cabinet not found');
    });
  });

  describe('getAllCabinetHealth', () => {
    it('should return health status for all active cabinets', async () => {
      const results = await healthService.getAllCabinetHealth();

      expect(results).toHaveLength(1);
      expect(results[0]).toMatchObject({
        cabinetId: 'cabinet-1',
        cabinetName: 'Test Cabinet',
        status: 'healthy'
      });
    });

    it('should return empty array when no active cabinets', async () => {
      mockCabinetService.prototype.getActiveCabinets = vi.fn().mockResolvedValue({
        success: true,
        data: []
      });

      const results = await healthService.getAllCabinetHealth();

      expect(results).toHaveLength(0);
    });

    it('should handle service error gracefully', async () => {
      mockCabinetService.prototype.getActiveCabinets = vi.fn().mockResolvedValue({
        success: false,
        error: 'Service error'
      });

      const results = await healthService.getAllCabinetHealth();

      expect(results).toHaveLength(0);
    });
  });

  describe('alert management', () => {
    it('should generate critical alert for unhealthy cabinet', async () => {
      mockConnection.ping.mockRejectedValue(new Error('Database down'));

      await healthService.checkCabinetHealth('cabinet-1');

      const alerts = healthService.getActiveAlerts('cabinet-1');
      expect(alerts).toHaveLength(1);
      expect(alerts[0]).toMatchObject({
        cabinetId: 'cabinet-1',
        severity: 'critical',
        acknowledged: false
      });
      expect(alerts[0].message).toContain('unhealthy');
    });

    it('should generate warning alert for degraded cabinet', async () => {
      mockCabinetService.prototype.getAllCabinetConfigs = vi.fn().mockResolvedValue({
        success: true,
        data: { timezone: 'Europe/Paris' } // Incomplete config
      });

      await healthService.checkCabinetHealth('cabinet-1');

      const alerts = healthService.getActiveAlerts('cabinet-1');
      expect(alerts).toHaveLength(1);
      expect(alerts[0]).toMatchObject({
        cabinetId: 'cabinet-1',
        severity: 'warning',
        acknowledged: false
      });
      expect(alerts[0].message).toContain('degraded');
    });

    it('should acknowledge alert', async () => {
      mockConnection.ping.mockRejectedValue(new Error('Database down'));
      await healthService.checkCabinetHealth('cabinet-1');

      const alerts = healthService.getActiveAlerts('cabinet-1');
      const alertId = alerts[0].id;

      const success = await healthService.acknowledgeAlert(alertId);
      expect(success).toBe(true);

      const updatedAlerts = healthService.getActiveAlerts('cabinet-1');
      expect(updatedAlerts).toHaveLength(0); // Should be filtered out as acknowledged
    });

    it('should resolve alert', async () => {
      mockConnection.ping.mockRejectedValue(new Error('Database down'));
      await healthService.checkCabinetHealth('cabinet-1');

      const alerts = healthService.getActiveAlerts('cabinet-1');
      const alertId = alerts[0].id;

      const success = await healthService.resolveAlert(alertId);
      expect(success).toBe(true);

      const updatedAlerts = healthService.getActiveAlerts('cabinet-1');
      expect(updatedAlerts).toHaveLength(0); // Should be filtered out as resolved
    });

    it('should return false for non-existent alert', async () => {
      const success = await healthService.acknowledgeAlert('non-existent-alert');
      expect(success).toBe(false);
    });
  });

  describe('health summary', () => {
    it('should provide accurate health summary', async () => {
      // Add multiple cabinets with different statuses
      const healthyCabinet = { ...mockCabinet, id: 'healthy-cabinet' };
      const degradedCabinet = { ...mockCabinet, id: 'degraded-cabinet' };
      const unhealthyCabinet = { ...mockCabinet, id: 'unhealthy-cabinet' };

      mockCabinetService.prototype.getActiveCabinets = vi.fn().mockResolvedValue({
        success: true,
        data: [healthyCabinet, degradedCabinet, unhealthyCabinet]
      });

      // Mock different responses for different cabinets
      mockCabinetService.prototype.getCabinetById = vi.fn().mockImplementation((id: string) => {
        const cabinet = [healthyCabinet, degradedCabinet, unhealthyCabinet].find(c => c.id === id);
        return Promise.resolve({ success: true, data: cabinet });
      });

      mockCabinetService.prototype.getAllCabinetConfigs = vi.fn().mockImplementation((id: string) => {
        if (id === 'degraded-cabinet') {
          return Promise.resolve({
            success: true,
            data: { timezone: 'Europe/Paris' } // Incomplete
          });
        }
        return Promise.resolve({
          success: true,
          data: {
            timezone: 'Europe/Paris',
            workingHours: {},
            bookingRules: {}
          }
        });
      });

      mockConnection.ping.mockImplementation(() => {
        // Make unhealthy cabinet fail
        const currentCall = mockConnection.ping.mock.calls.length;
        if (currentCall === 3) { // Third call for unhealthy cabinet
          return Promise.reject(new Error('Connection failed'));
        }
        return Promise.resolve(true);
      });

      // Check health for all cabinets
      await Promise.all([
        healthService.checkCabinetHealth('healthy-cabinet'),
        healthService.checkCabinetHealth('degraded-cabinet'),
        healthService.checkCabinetHealth('unhealthy-cabinet')
      ]);

      const summary = healthService.getHealthSummary();

      expect(summary).toMatchObject({
        totalCabinets: 3,
        healthyCabinets: 1,
        degradedCabinets: 1,
        unhealthyCabinets: 1,
        activeAlerts: 2 // One warning + one critical
      });
    });
  });

  describe('caching', () => {
    it('should return cached health status when available', async () => {
      // First call
      const result1 = await healthService.checkCabinetHealth('cabinet-1');
      
      // Second call should return cached result
      const result2 = await healthService.getCachedCabinetHealth('cabinet-1');

      expect(result2).toEqual(result1);
      expect(mockCabinetService.prototype.getCabinetById).toHaveBeenCalledTimes(1);
    });

    it('should refresh stale cache', async () => {
      // Mock Date.now to simulate time passing
      const originalNow = Date.now;
      let mockTime = originalNow();
      vi.spyOn(Date, 'now').mockImplementation(() => mockTime);

      // First call
      await healthService.checkCabinetHealth('cabinet-1');

      // Simulate 6 minutes passing (cache becomes stale after 5 minutes)
      mockTime += 6 * 60 * 1000;

      // Second call should trigger refresh
      await healthService.getCachedCabinetHealth('cabinet-1');

      expect(mockCabinetService.prototype.getCabinetById).toHaveBeenCalledTimes(2);

      // Restore Date.now
      vi.spyOn(Date, 'now').mockImplementation(originalNow);
    });
  });
});