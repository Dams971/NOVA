import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import AdminDashboard from '@/components/admin/AdminDashboard';

// Mock fetch globally
global.fetch = vi.fn();

// Mock the analytics service
vi.mock('@/lib/services/analytics-service', () => ({
  AnalyticsService: vi.fn().mockImplementation(() => ({
    generateMockAnalytics: vi.fn().mockReturnValue({
      cabinetId: 'test-cabinet',
      period: { start: new Date(), end: new Date() },
      overview: {
        totalAppointments: 100,
        totalRevenue: 50000,
        totalPatients: 80,
        averageUtilization: 75,
        trends: { appointments: 5, revenue: 10, patients: 3, utilization: 2 }
      },
      timeSeries: {
        appointments: [{ date: '2024-01-01', value: 10, label: 'Jan 1' }],
        revenue: [{ date: '2024-01-01', value: 1000, label: 'Jan 1' }],
        utilization: [{ date: '2024-01-01', value: 75, label: 'Jan 1' }],
        satisfaction: [{ date: '2024-01-01', value: 8.5, label: 'Jan 1' }]
      },
      breakdown: {
        appointmentsByType: [],
        revenueByService: [],
        patientsByAge: [],
        appointmentsByHour: []
      },
      comparisons: {
        previousPeriod: { appointments: 0, revenue: 0, patients: 0, utilization: 0 },
        networkAverage: { appointments: 0, revenue: 0, patients: 0, utilization: 0 }
      }
    })
  }))
}));

describe('Admin Dashboard Integration', () => {
  const mockFetch = global.fetch as any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock successful cabinet fetch
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        data: [
          {
            id: 'cabinet-1',
            name: 'Cabinet Test',
            slug: 'cabinet-test',
            address: { street: '123 Test St', city: 'Test City', postalCode: '12345', country: 'France' },
            phone: '+33 1 23 45 67 89',
            email: 'test@example.com',
            timezone: 'Europe/Paris',
            status: 'active',
            databaseName: 'nova_cabinet_test',
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ]
      })
    });
  });

  it('renders admin dashboard with navigation', async () => {
    render(<AdminDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('Cabinet Overview')).toBeInTheDocument();
      expect(screen.getByText('Comparative Analytics')).toBeInTheDocument();
    });
  });

  it('switches to comparative analytics view', async () => {
    render(<AdminDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('Comparative Analytics')).toBeInTheDocument();
    });

    // Click on comparative analytics tab
    fireEvent.click(screen.getByText('Comparative Analytics'));
    
    await waitFor(() => {
      expect(screen.getByText('Compare performance across your cabinet network')).toBeInTheDocument();
    });
  });

  it('handles cabinet selection from comparative view', async () => {
    render(<AdminDashboard />);
    
    // Switch to comparative analytics
    await waitFor(() => {
      fireEvent.click(screen.getByText('Comparative Analytics'));
    });

    await waitFor(() => {
      expect(screen.getByText('Compare performance across your cabinet network')).toBeInTheDocument();
    });

    // The cabinet selection and detail view would be tested here
    // but requires more complex mocking of the comparative dashboard
  });

  it('handles loading state', () => {
    // Mock delayed response
    mockFetch.mockImplementation(() => new Promise(resolve => {
      setTimeout(() => resolve({
        ok: true,
        json: async () => ({ data: [] })
      }), 100);
    }));

    render(<AdminDashboard />);
    
    // Should show loading spinner
    const loadingSpinner = document.querySelector('.animate-spin');
    expect(loadingSpinner).toBeInTheDocument();
  });

  it('handles fetch error gracefully', async () => {
    // Mock fetch error
    mockFetch.mockRejectedValue(new Error('Network error'));

    render(<AdminDashboard />);
    
    // Should still render the dashboard structure
    await waitFor(() => {
      expect(screen.getByText('Cabinet Overview')).toBeInTheDocument();
    });
  });
});