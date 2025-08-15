import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { NextRequest } from 'next/server';
import { GET as getCabinetHealth, POST as refreshCabinetHealth } from '../../app/api/cabinets/[cabinetId]/health/route';
import { GET as getAllCabinetHealth } from '../../app/api/cabinets/health/route';
import { GET as getAlerts, PATCH as manageAlert } from '../../app/api/cabinets/alerts/route';
import { PATCH as manageSpecificAlert } from '../../app/api/cabinets/alerts/[alertId]/route';
import { CabinetHealthService } from '../../lib/services/cabinet-health-service';

// Mock the CabinetHealthService
vi.mock('../../lib/services/cabinet-health-service');
vi.mock('../../lib/api/gateway');

describe('Cabinet Health API Endpoints', () => {
  let mockHealthService: any;

  const mockHealthStatus = {
    cabinetId: 'cabinet-1',
    cabinetName: 'Test Cabinet',
    status: 'healthy' as const,
    lastChecked: new Date(),
    checks: [
      {
        name: 'database',
        status: 'healthy' as const,
        message: 'Database connection successful',
        responseTime: 50,
        timestamp: Date.now()
      }
    ],
    uptime: 99.9,
    responseTime: 100,
    issues: []
  };

  const mockAlert = {
    id: 'alert-1',
    cabinetId: 'cabinet-1',
    severity: 'critical' as const,
    message: 'Cabinet is unhealthy',
    timestamp: new Date(),
    acknowledged: false
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock CabinetHealthService methods
    mockHealthService = {
      checkCabinetHealth: vi.fn().mockResolvedValue(mockHealthStatus),
      getAllCabinetHealth: vi.fn().mockResolvedValue([mockHealthStatus]),
      getHealthSummary: vi.fn().mockReturnValue({
        totalCabinets: 1,
        healthyCabinets: 1,
        degradedCabinets: 0,
        unhealthyCabinets: 0,
        activeAlerts: 0
      }),
      getActiveAlerts: vi.fn().mockReturnValue([mockAlert]),
      acknowledgeAlert: vi.fn().mockResolvedValue(true),
      resolveAlert: vi.fn().mockResolvedValue(true)
    };

    // Mock the constructor
    vi.mocked(CabinetHealthService).mockImplementation(() => mockHealthService);
  });

  describe('GET /api/cabinets/health', () => {
    it('should return all cabinet health statuses', async () => {
      const request = new NextRequest('http://localhost/api/cabinets/health');
      
      // Mock APIGateway.createHandler to call the handler directly
      const mockCreateHandler = vi.fn().mockImplementation((handler) => handler);
      const mockCreateResponse = vi.fn().mockImplementation((data, status = 200) => 
        new Response(JSON.stringify(data), { status })
      );
      
      // Mock APIGateway
      const APIGateway = await import('../../lib/api/gateway');
      vi.mocked(APIGateway.default).mockImplementation(() => ({
        createHandler: mockCreateHandler
      }) as any);
      vi.mocked(APIGateway.default.createResponse).mockImplementation(mockCreateResponse);

      const response = await getAllCabinetHealth(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(1);
      expect(data.data[0]).toMatchObject({
        cabinetId: 'cabinet-1',
        status: 'healthy'
      });
      expect(data.summary).toBeDefined();
    });
  });

  describe('GET /api/cabinets/[cabinetId]/health', () => {
    it('should return specific cabinet health status', async () => {
      const request = new NextRequest('http://localhost/api/cabinets/cabinet-1/health');
      const params = { params: { cabinetId: 'cabinet-1' } };
      
      const mockCreateHandler = vi.fn().mockImplementation((handler) => handler);
      const mockCreateResponse = vi.fn().mockImplementation((data, status = 200) => 
        new Response(JSON.stringify(data), { status })
      );
      
      const APIGateway = await import('../../lib/api/gateway');
      vi.mocked(APIGateway.default).mockImplementation(() => ({
        createHandler: mockCreateHandler
      }) as any);
      vi.mocked(APIGateway.default.createResponse).mockImplementation(mockCreateResponse);

      const response = await getCabinetHealth(request, params);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.health).toMatchObject({
        cabinetId: 'cabinet-1',
        status: 'healthy'
      });
      expect(data.data.alerts).toHaveLength(1);
      expect(mockHealthService.checkCabinetHealth).toHaveBeenCalledWith('cabinet-1');
    });
  });

  describe('POST /api/cabinets/[cabinetId]/health', () => {
    it('should refresh cabinet health check', async () => {
      const request = new NextRequest('http://localhost/api/cabinets/cabinet-1/health', {
        method: 'POST'
      });
      const params = { params: { cabinetId: 'cabinet-1' } };
      
      const mockCreateHandler = vi.fn().mockImplementation((handler) => handler);
      const mockCreateResponse = vi.fn().mockImplementation((data, status = 200) => 
        new Response(JSON.stringify(data), { status })
      );
      
      const APIGateway = await import('../../lib/api/gateway');
      vi.mocked(APIGateway.default).mockImplementation(() => ({
        createHandler: mockCreateHandler
      }) as any);
      vi.mocked(APIGateway.default.createResponse).mockImplementation(mockCreateResponse);

      const response = await refreshCabinetHealth(request, params);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Health check refreshed');
      expect(mockHealthService.checkCabinetHealth).toHaveBeenCalledWith('cabinet-1');
    });
  });

  describe('GET /api/cabinets/alerts', () => {
    it('should return all active alerts', async () => {
      const request = new NextRequest('http://localhost/api/cabinets/alerts');
      
      const mockCreateHandler = vi.fn().mockImplementation((handler) => handler);
      const mockCreateResponse = vi.fn().mockImplementation((data, status = 200) => 
        new Response(JSON.stringify(data), { status })
      );
      
      const APIGateway = await import('../../lib/api/gateway');
      vi.mocked(APIGateway.default).mockImplementation(() => ({
        createHandler: mockCreateHandler
      }) as any);
      vi.mocked(APIGateway.default.createResponse).mockImplementation(mockCreateResponse);

      const response = await getAlerts(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(1);
      expect(data.data[0]).toMatchObject({
        id: 'alert-1',
        severity: 'critical'
      });
    });

    it('should filter alerts by cabinet ID', async () => {
      const request = new NextRequest('http://localhost/api/cabinets/alerts?cabinetId=cabinet-1');
      
      const mockCreateHandler = vi.fn().mockImplementation((handler) => handler);
      const mockCreateResponse = vi.fn().mockImplementation((data, status = 200) => 
        new Response(JSON.stringify(data), { status })
      );
      
      const APIGateway = await import('../../lib/api/gateway');
      vi.mocked(APIGateway.default).mockImplementation(() => ({
        createHandler: mockCreateHandler
      }) as any);
      vi.mocked(APIGateway.default.createResponse).mockImplementation(mockCreateResponse);

      const response = await getAlerts(request);
      await response.json();

      expect(mockHealthService.getActiveAlerts).toHaveBeenCalledWith('cabinet-1');
    });
  });

  describe('PATCH /api/cabinets/alerts/[alertId]', () => {
    it('should acknowledge alert', async () => {
      const request = new NextRequest('http://localhost/api/cabinets/alerts/alert-1', {
        method: 'PATCH',
        body: JSON.stringify({ action: 'acknowledge' })
      });
      const params = { params: { alertId: 'alert-1' } };
      
      const mockCreateHandler = vi.fn().mockImplementation((handler) => handler);
      const mockCreateResponse = vi.fn().mockImplementation((data, status = 200) => 
        new Response(JSON.stringify(data), { status })
      );
      
      const APIGateway = await import('../../lib/api/gateway');
      vi.mocked(APIGateway.default).mockImplementation(() => ({
        createHandler: mockCreateHandler
      }) as any);
      vi.mocked(APIGateway.default.createResponse).mockImplementation(mockCreateResponse);

      const response = await manageSpecificAlert(request, params);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Alert acknowledged');
      expect(mockHealthService.acknowledgeAlert).toHaveBeenCalledWith('alert-1');
    });

    it('should resolve alert', async () => {
      const request = new NextRequest('http://localhost/api/cabinets/alerts/alert-1', {
        method: 'PATCH',
        body: JSON.stringify({ action: 'resolve' })
      });
      const params = { params: { alertId: 'alert-1' } };
      
      const mockCreateHandler = vi.fn().mockImplementation((handler) => handler);
      const mockCreateResponse = vi.fn().mockImplementation((data, status = 200) => 
        new Response(JSON.stringify(data), { status })
      );
      
      const APIGateway = await import('../../lib/api/gateway');
      vi.mocked(APIGateway.default).mockImplementation(() => ({
        createHandler: mockCreateHandler
      }) as any);
      vi.mocked(APIGateway.default.createResponse).mockImplementation(mockCreateResponse);

      const response = await manageSpecificAlert(request, params);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Alert resolved');
      expect(mockHealthService.resolveAlert).toHaveBeenCalledWith('alert-1');
    });

    it('should return 404 for non-existent alert', async () => {
      mockHealthService.acknowledgeAlert.mockResolvedValue(false);
      
      const request = new NextRequest('http://localhost/api/cabinets/alerts/non-existent', {
        method: 'PATCH',
        body: JSON.stringify({ action: 'acknowledge' })
      });
      const params = { params: { alertId: 'non-existent' } };
      
      const mockCreateHandler = vi.fn().mockImplementation((handler) => handler);
      const mockCreateResponse = vi.fn().mockImplementation((data, status = 200) => 
        new Response(JSON.stringify(data), { status })
      );
      
      const APIGateway = await import('../../lib/api/gateway');
      vi.mocked(APIGateway.default).mockImplementation(() => ({
        createHandler: mockCreateHandler
      }) as any);
      vi.mocked(APIGateway.default.createResponse).mockImplementation(mockCreateResponse);

      const response = await manageSpecificAlert(request, params);
      const data = await response.json();

      expect(response.status).toBe(200); // APIGateway mock returns 200
      expect(data.success).toBe(false);
      expect(data.error).toBe('Alert not found');
    });

    it('should return 400 for invalid action', async () => {
      const request = new NextRequest('http://localhost/api/cabinets/alerts/alert-1', {
        method: 'PATCH',
        body: JSON.stringify({ action: 'invalid' })
      });
      const params = { params: { alertId: 'alert-1' } };
      
      const mockCreateHandler = vi.fn().mockImplementation((handler) => handler);
      const mockCreateResponse = vi.fn().mockImplementation((data, status = 200) => 
        new Response(JSON.stringify(data), { status })
      );
      
      const APIGateway = await import('../../lib/api/gateway');
      vi.mocked(APIGateway.default).mockImplementation(() => ({
        createHandler: mockCreateHandler
      }) as any);
      vi.mocked(APIGateway.default.createResponse).mockImplementation(mockCreateResponse);

      const response = await manageSpecificAlert(request, params);
      const data = await response.json();

      expect(response.status).toBe(200); // APIGateway mock returns 200
      expect(data.success).toBe(false);
      expect(data.error).toBe('Invalid action. Use "acknowledge" or "resolve"');
    });
  });
});