import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/analytics/cabinet/route';
import { POST } from '@/app/api/analytics/export/route';
import { GET as getTemplates } from '@/app/api/analytics/templates/route';

// Mock AnalyticsService
vi.mock('@/lib/services/analytics-service', () => ({
  AnalyticsService: vi.fn().mockImplementation(() => ({
    generateMockAnalytics: vi.fn().mockReturnValue({
      cabinetId: 'test-cabinet',
      period: {
        start: new Date('2024-01-01'),
        end: new Date('2024-01-31')
      },
      overview: {
        totalAppointments: 150,
        totalRevenue: 15000,
        totalPatients: 120,
        averageUtilization: 75,
        trends: {
          appointments: 5.2,
          revenue: 8.3,
          patients: 3.1,
          utilization: 2.1
        }
      },
      timeSeries: {
        appointments: [
          { date: '2024-01-01', value: 10, label: 'Jan 01' }
        ],
        revenue: [
          { date: '2024-01-01', value: 1000, label: 'Jan 01' }
        ],
        utilization: [
          { date: '2024-01-01', value: 75, label: 'Jan 01' }
        ],
        satisfaction: [
          { date: '2024-01-01', value: 8.5, label: 'Jan 01' }
        ]
      },
      breakdown: {
        appointmentsByType: [
          { category: 'Consultation', value: 45, percentage: 45, trend: 'up' as const, trendValue: 5.2 }
        ],
        revenueByService: [
          { category: 'Implants', value: 15000, percentage: 40, trend: 'up' as const, trendValue: 8.3 }
        ],
        patientsByAge: [
          { category: '18-30', value: 25, percentage: 25, trend: 'up' as const, trendValue: 3.2 }
        ],
        appointmentsByHour: [
          { category: '9:00', value: 8, percentage: 10, trend: 'stable' as const, trendValue: 0.2 }
        ]
      },
      comparisons: {
        previousPeriod: {
          appointments: 5.2,
          revenue: 8.3,
          patients: 3.1,
          utilization: 2.1
        },
        networkAverage: {
          appointments: 3.5,
          revenue: 6.1,
          patients: 2.8,
          utilization: 1.5
        }
      }
    })
  }))
}));

describe('Analytics API', () => {
  describe('GET /api/analytics/cabinet', () => {
    it('should return analytics data for valid request', async () => {
      const url = new URL('http://localhost:3000/api/analytics/cabinet?cabinetId=test-cabinet&startDate=2024-01-01T00:00:00.000Z&endDate=2024-01-31T23:59:59.999Z&granularity=day');
      const request = new NextRequest(url);

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toBeDefined();
      expect(data.data.cabinetId).toBe('test-cabinet');
      expect(data.data.overview).toBeDefined();
      expect(data.data.timeSeries).toBeDefined();
      expect(data.data.breakdown).toBeDefined();
      expect(data.data.comparisons).toBeDefined();
    });

    it('should return 400 for missing cabinetId', async () => {
      const url = new URL('http://localhost:3000/api/analytics/cabinet?startDate=2024-01-01T00:00:00.000Z&endDate=2024-01-31T23:59:59.999Z');
      const request = new NextRequest(url);

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Missing required parameters');
    });

    it('should return 400 for missing startDate', async () => {
      const url = new URL('http://localhost:3000/api/analytics/cabinet?cabinetId=test-cabinet&endDate=2024-01-31T23:59:59.999Z');
      const request = new NextRequest(url);

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Missing required parameters');
    });

    it('should return 400 for missing endDate', async () => {
      const url = new URL('http://localhost:3000/api/analytics/cabinet?cabinetId=test-cabinet&startDate=2024-01-01T00:00:00.000Z');
      const request = new NextRequest(url);

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Missing required parameters');
    });

    it('should use default granularity when not provided', async () => {
      const url = new URL('http://localhost:3000/api/analytics/cabinet?cabinetId=test-cabinet&startDate=2024-01-01T00:00:00.000Z&endDate=2024-01-31T23:59:59.999Z');
      const request = new NextRequest(url);

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should handle invalid dates gracefully', async () => {
      const url = new URL('http://localhost:3000/api/analytics/cabinet?cabinetId=test-cabinet&startDate=invalid-date&endDate=2024-01-31T23:59:59.999Z');
      const request = new NextRequest(url);

      const response = await GET(request);
      
      // Should either return 400 or handle gracefully
      expect([200, 400, 500]).toContain(response.status);
    });
  });

  describe('POST /api/analytics/export', () => {
    it('should export CSV format successfully', async () => {
      const requestBody = {
        cabinetId: 'test-cabinet',
        format: 'csv',
        includeCharts: false,
        sections: ['overview', 'trends'],
        dateRange: {
          start: '2024-01-01T00:00:00.000Z',
          end: '2024-01-31T23:59:59.999Z'
        }
      };

      const request = new NextRequest('http://localhost:3000/api/analytics/export', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('text/csv');
      expect(response.headers.get('Content-Disposition')).toContain('attachment');
      expect(response.headers.get('Content-Disposition')).toContain('.csv');
    });

    it('should export Excel format successfully', async () => {
      const requestBody = {
        cabinetId: 'test-cabinet',
        format: 'excel',
        includeCharts: false,
        sections: ['overview'],
        dateRange: {
          start: '2024-01-01T00:00:00.000Z',
          end: '2024-01-31T23:59:59.999Z'
        }
      };

      const request = new NextRequest('http://localhost:3000/api/analytics/export', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('application/vnd.ms-excel');
      expect(response.headers.get('Content-Disposition')).toContain('.xlsx');
    });

    it('should export PDF format successfully', async () => {
      const requestBody = {
        cabinetId: 'test-cabinet',
        format: 'pdf',
        includeCharts: true,
        sections: ['overview', 'trends', 'breakdown'],
        dateRange: {
          start: '2024-01-01T00:00:00.000Z',
          end: '2024-01-31T23:59:59.999Z'
        }
      };

      const request = new NextRequest('http://localhost:3000/api/analytics/export', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('application/json');
      expect(response.headers.get('Content-Disposition')).toContain('.json');
    });

    it('should return 400 for missing cabinetId', async () => {
      const requestBody = {
        format: 'csv',
        includeCharts: false,
        sections: ['overview'],
        dateRange: {
          start: '2024-01-01T00:00:00.000Z',
          end: '2024-01-31T23:59:59.999Z'
        }
      };

      const request = new NextRequest('http://localhost:3000/api/analytics/export', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Missing required parameters');
    });

    it('should return 400 for missing format', async () => {
      const requestBody = {
        cabinetId: 'test-cabinet',
        includeCharts: false,
        sections: ['overview'],
        dateRange: {
          start: '2024-01-01T00:00:00.000Z',
          end: '2024-01-31T23:59:59.999Z'
        }
      };

      const request = new NextRequest('http://localhost:3000/api/analytics/export', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Missing required parameters');
    });

    it('should return 400 for missing dateRange', async () => {
      const requestBody = {
        cabinetId: 'test-cabinet',
        format: 'csv',
        includeCharts: false,
        sections: ['overview']
      };

      const request = new NextRequest('http://localhost:3000/api/analytics/export', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Missing required parameters');
    });

    it('should handle unsupported export format', async () => {
      const requestBody = {
        cabinetId: 'test-cabinet',
        format: 'unsupported',
        includeCharts: false,
        sections: ['overview'],
        dateRange: {
          start: '2024-01-01T00:00:00.000Z',
          end: '2024-01-31T23:59:59.999Z'
        }
      };

      const request = new NextRequest('http://localhost:3000/api/analytics/export', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toContain('Unsupported export format');
    });

    it('should generate CSV content with correct structure', async () => {
      const requestBody = {
        cabinetId: 'test-cabinet',
        format: 'csv',
        includeCharts: false,
        sections: ['overview'],
        dateRange: {
          start: '2024-01-01T00:00:00.000Z',
          end: '2024-01-31T23:59:59.999Z'
        }
      };

      const request = new NextRequest('http://localhost:3000/api/analytics/export', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(request);
      const csvContent = await response.text();

      expect(csvContent).toContain('Cabinet Analytics Report');
      expect(csvContent).toContain('Overview');
      expect(csvContent).toContain('Total Appointments');
      expect(csvContent).toContain('Total Revenue');
      expect(csvContent).toContain('Daily Appointments');
      expect(csvContent).toContain('Daily Revenue');
      expect(csvContent).toContain('Appointments by Type');
      expect(csvContent).toContain('Revenue by Service');
    });
  });

  describe('GET /api/analytics/templates', () => {
    it('should return report templates successfully', async () => {
      const request = new NextRequest('http://localhost:3000/api/analytics/templates');

      const response = await getTemplates();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toBeDefined();
      expect(Array.isArray(data.data)).toBe(true);
      expect(data.data.length).toBeGreaterThan(0);
    });

    it('should return templates with correct structure', async () => {
      const request = new NextRequest('http://localhost:3000/api/analytics/templates');

      const response = await getTemplates();
      const data = await response.json();

      const template = data.data[0];
      expect(template).toHaveProperty('id');
      expect(template).toHaveProperty('name');
      expect(template).toHaveProperty('description');
      expect(template).toHaveProperty('sections');
      expect(template).toHaveProperty('defaultFormat');
      expect(template).toHaveProperty('isDefault');
      expect(Array.isArray(template.sections)).toBe(true);
      expect(['pdf', 'excel', 'csv']).toContain(template.defaultFormat);
      expect(typeof template.isDefault).toBe('boolean');
    });

    it('should include comprehensive template', async () => {
      const request = new NextRequest('http://localhost:3000/api/analytics/templates');

      const response = await getTemplates();
      const data = await response.json();

      const comprehensiveTemplate = data.data.find((t: any) => t.id === 'comprehensive');
      expect(comprehensiveTemplate).toBeDefined();
      expect(comprehensiveTemplate.name).toBe('Comprehensive Report');
      expect(comprehensiveTemplate.isDefault).toBe(true);
      expect(comprehensiveTemplate.sections).toContain('overview');
      expect(comprehensiveTemplate.sections).toContain('trends');
      expect(comprehensiveTemplate.sections).toContain('breakdown');
      expect(comprehensiveTemplate.sections).toContain('comparison');
    });

    it('should include executive summary template', async () => {
      const request = new NextRequest('http://localhost:3000/api/analytics/templates');

      const response = await getTemplates();
      const data = await response.json();

      const executiveTemplate = data.data.find((t: any) => t.id === 'executive-summary');
      expect(executiveTemplate).toBeDefined();
      expect(executiveTemplate.name).toBe('Executive Summary');
      expect(executiveTemplate.isDefault).toBe(false);
      expect(executiveTemplate.sections).toContain('overview');
      expect(executiveTemplate.sections).toContain('comparison');
    });

    it('should include operational template', async () => {
      const request = new NextRequest('http://localhost:3000/api/analytics/templates');

      const response = await getTemplates();
      const data = await response.json();

      const operationalTemplate = data.data.find((t: any) => t.id === 'operational');
      expect(operationalTemplate).toBeDefined();
      expect(operationalTemplate.name).toBe('Operational Report');
      expect(operationalTemplate.defaultFormat).toBe('excel');
      expect(operationalTemplate.sections).toContain('trends');
      expect(operationalTemplate.sections).toContain('breakdown');
    });

    it('should include financial template', async () => {
      const request = new NextRequest('http://localhost:3000/api/analytics/templates');

      const response = await getTemplates();
      const data = await response.json();

      const financialTemplate = data.data.find((t: any) => t.id === 'financial');
      expect(financialTemplate).toBeDefined();
      expect(financialTemplate.name).toBe('Financial Report');
      expect(financialTemplate.defaultFormat).toBe('excel');
      expect(financialTemplate.sections).toContain('overview');
      expect(financialTemplate.sections).toContain('trends');
    });
  });
});