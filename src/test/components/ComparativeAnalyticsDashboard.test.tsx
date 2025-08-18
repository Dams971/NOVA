import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import ComparativeAnalyticsDashboard from '@/components/admin/ComparativeAnalyticsDashboard';
import { Cabinet, CabinetStatus } from '@/lib/models/cabinet';
import { AnalyticsService } from '@/lib/services/analytics-service';

// Mock the analytics service
vi.mock('@/lib/services/analytics-service');

const mockCabinets: Cabinet[] = [
  {
    id: 'cabinet-1',
    name: 'Cabinet Paris Centre',
    slug: 'paris-centre',
    address: {
      street: '123 Rue de Rivoli',
      city: 'Paris',
      postalCode: '75001',
      country: 'France'
    },
    phone: '+33 1 23 45 67 89',
    email: 'paris@example.com',
    timezone: 'Europe/Paris',
    status: CabinetStatus.ACTIVE,
    databaseName: 'nova_cabinet_paris_centre',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: 'cabinet-2',
    name: 'Cabinet Lyon',
    slug: 'lyon',
    address: {
      street: '456 Rue de la République',
      city: 'Lyon',
      postalCode: '69002',
      country: 'France'
    },
    phone: '+33 4 78 90 12 34',
    email: 'lyon@example.com',
    timezone: 'Europe/Paris',
    status: CabinetStatus.ACTIVE,
    databaseName: 'nova_cabinet_lyon',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: 'cabinet-3',
    name: 'Cabinet Marseille',
    slug: 'marseille',
    address: {
      street: '789 La Canebière',
      city: 'Marseille',
      postalCode: '13001',
      country: 'France'
    },
    phone: '+33 4 91 23 45 67',
    email: 'marseille@example.com',
    timezone: 'Europe/Paris',
    status: CabinetStatus.ACTIVE,
    databaseName: 'nova_cabinet_marseille',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  }
];

const mockAnalyticsService = {
  generateMockAnalytics: vi.fn(),
  calculateStatistics: vi.fn(),
  detectOutliers: vi.fn()
};

describe('ComparativeAnalyticsDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock the analytics service constructor
    (AnalyticsService as any).mockImplementation(() => mockAnalyticsService);
    
    // Setup default mock analytics data as a function that takes cabinetId
    mockAnalyticsService.generateMockAnalytics.mockImplementation((cabinetId: string) => ({
      cabinetId,
      period: {
        start: new Date('2024-01-01'),
        end: new Date('2024-01-31')
      },
      overview: {
        totalAppointments: Math.floor(Math.random() * 100) + 50,
        totalRevenue: Math.floor(Math.random() * 50000) + 25000,
        totalPatients: Math.floor(Math.random() * 80) + 40,
        averageUtilization: Math.floor(Math.random() * 40) + 60,
        trends: {
          appointments: Math.random() * 20 - 10,
          revenue: Math.random() * 30 - 15,
          patients: Math.random() * 15 - 7,
          utilization: Math.random() * 10 - 5
        }
      },
      timeSeries: {
        appointments: Array.from({ length: 30 }, (_, i) => ({
          date: `2024-01-${String(i + 1).padStart(2, '0')}`,
          value: Math.floor(Math.random() * 20) + 10,
          label: `Jan ${i + 1}`
        })),
        revenue: Array.from({ length: 30 }, (_, i) => ({
          date: `2024-01-${String(i + 1).padStart(2, '0')}`,
          value: Math.floor(Math.random() * 2000) + 1000,
          label: `Jan ${i + 1}`
        })),
        utilization: Array.from({ length: 30 }, (_, i) => ({
          date: `2024-01-${String(i + 1).padStart(2, '0')}`,
          value: Math.random() * 40 + 60,
          label: `Jan ${i + 1}`
        })),
        satisfaction: Array.from({ length: 30 }, (_, i) => ({
          date: `2024-01-${String(i + 1).padStart(2, '0')}`,
          value: Math.random() * 2 + 8,
          label: `Jan ${i + 1}`
        }))
      },
      breakdown: {
        appointmentsByType: [
          { category: 'Consultation', value: 45, percentage: 45, trend: 'up' as const, trendValue: 5.2 },
          { category: 'Cleaning', value: 30, percentage: 30, trend: 'stable' as const, trendValue: 0.8 },
          { category: 'Treatment', value: 20, percentage: 20, trend: 'down' as const, trendValue: -2.1 },
          { category: 'Emergency', value: 5, percentage: 5, trend: 'up' as const, trendValue: 1.5 }
        ],
        revenueByService: [
          { category: 'Implants', value: 15000, percentage: 40, trend: 'up' as const, trendValue: 8.3 },
          { category: 'Orthodontics', value: 12000, percentage: 32, trend: 'up' as const, trendValue: 3.7 },
          { category: 'Cleaning', value: 6000, percentage: 16, trend: 'stable' as const, trendValue: 0.5 },
          { category: 'Fillings', value: 4500, percentage: 12, trend: 'down' as const, trendValue: -1.2 }
        ],
        patientsByAge: [
          { category: '18-30', value: 25, percentage: 25, trend: 'up' as const, trendValue: 3.2 },
          { category: '31-45', value: 35, percentage: 35, trend: 'stable' as const, trendValue: 0.8 },
          { category: '46-60', value: 30, percentage: 30, trend: 'up' as const, trendValue: 2.1 },
          { category: '60+', value: 10, percentage: 10, trend: 'down' as const, trendValue: -1.5 }
        ],
        appointmentsByHour: [
          { category: '9:00', value: 8, percentage: 10, trend: 'stable' as const, trendValue: 0.2 },
          { category: '10:00', value: 12, percentage: 15, trend: 'up' as const, trendValue: 2.1 },
          { category: '11:00', value: 15, percentage: 19, trend: 'up' as const, trendValue: 3.5 },
          { category: '14:00', value: 18, percentage: 22, trend: 'stable' as const, trendValue: 0.8 },
          { category: '15:00', value: 14, percentage: 17, trend: 'down' as const, trendValue: -1.2 },
          { category: '16:00', value: 10, percentage: 12, trend: 'down' as const, trendValue: -2.3 },
          { category: '17:00', value: 4, percentage: 5, trend: 'stable' as const, trendValue: 0.1 }
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
    }));
  });

  it('renders the comparative analytics dashboard', async () => {
    render(<ComparativeAnalyticsDashboard cabinets={mockCabinets} />);
    
    expect(screen.getByText('Comparative Analytics')).toBeInTheDocument();
    expect(screen.getByText('Compare performance across your cabinet network')).toBeInTheDocument();
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('Network Total')).toBeInTheDocument();
    });
  });

  it('displays cabinet selection controls', async () => {
    render(<ComparativeAnalyticsDashboard cabinets={mockCabinets} />);
    
    await waitFor(() => {
      expect(screen.getByText('Cabinet Selection')).toBeInTheDocument();
      expect(screen.getByText('Show All')).toBeInTheDocument();
      expect(screen.getByText('Hide All')).toBeInTheDocument();
    });

    // Check that all cabinets are listed
    mockCabinets.forEach(cabinet => {
      expect(screen.getByText(cabinet.name)).toBeInTheDocument();
    });
  });

  it('allows toggling cabinet visibility', async () => {
    render(<ComparativeAnalyticsDashboard cabinets={mockCabinets} />);
    
    await waitFor(() => {
      expect(screen.getByText('Cabinet Paris Centre')).toBeInTheDocument();
    });

    // Click on a cabinet to toggle visibility
    const cabinetElement = screen.getByText('Cabinet Paris Centre').closest('div');
    expect(cabinetElement).toBeInTheDocument();
    
    if (cabinetElement) {
      fireEvent.click(cabinetElement);
    }

    // The cabinet should still be visible (just toggled selection state)
    expect(screen.getByText('Cabinet Paris Centre')).toBeInTheDocument();
  });

  it('switches between different views', async () => {
    render(<ComparativeAnalyticsDashboard cabinets={mockCabinets} />);
    
    await waitFor(() => {
      expect(screen.getByText('Overview')).toBeInTheDocument();
    });

    // Test switching to trends view
    fireEvent.click(screen.getByText('Trends'));
    await waitFor(() => {
      expect(screen.getByText('Performance Trends')).toBeInTheDocument();
    });

    // Test switching to benchmarks view
    fireEvent.click(screen.getByText('Benchmarks'));
    await waitFor(() => {
      expect(screen.getByText('Total Appointments Benchmarks')).toBeInTheDocument();
    });

    // Test switching to anomalies view
    fireEvent.click(screen.getByText('Anomalies'));
    await waitFor(() => {
      expect(screen.getByText('Detected Anomalies')).toBeInTheDocument();
    });
  });

  it('displays network summary statistics', async () => {
    render(<ComparativeAnalyticsDashboard cabinets={mockCabinets} />);
    
    await waitFor(() => {
      expect(screen.getByText('Network Total')).toBeInTheDocument();
      expect(screen.getByText('Network Revenue')).toBeInTheDocument();
      expect(screen.getByText('Avg Utilization')).toBeInTheDocument();
      expect(screen.getByText('Active Cabinets')).toBeInTheDocument();
    });
  });

  it('allows changing date range', async () => {
    render(<ComparativeAnalyticsDashboard cabinets={mockCabinets} />);
    
    await waitFor(() => {
      const dateSelect = screen.getByDisplayValue('Last 30 days');
      expect(dateSelect).toBeInTheDocument();
    });

    // Change date range
    const dateSelect = screen.getByDisplayValue('Last 30 days');
    fireEvent.change(dateSelect, { target: { value: '7d' } });
    
    expect(dateSelect).toHaveValue('7d');
  });

  it('handles refresh functionality', async () => {
    render(<ComparativeAnalyticsDashboard cabinets={mockCabinets} />);
    
    await waitFor(() => {
      const refreshButton = screen.getByText('Refresh');
      expect(refreshButton).toBeInTheDocument();
    });

    // Click refresh button
    const refreshButton = screen.getByText('Refresh');
    fireEvent.click(refreshButton);

    // Should call the analytics service again
    await waitFor(() => {
      expect(mockAnalyticsService.generateMockAnalytics).toHaveBeenCalled();
    });
  });

  it('displays benchmark data correctly', async () => {
    render(<ComparativeAnalyticsDashboard cabinets={mockCabinets} />);
    
    // Switch to benchmarks view
    await waitFor(() => {
      fireEvent.click(screen.getByText('Benchmarks'));
    });

    await waitFor(() => {
      expect(screen.getByText('Top Performer')).toBeInTheDocument();
      expect(screen.getByText('Network Average')).toBeInTheDocument();
      expect(screen.getByText('Needs Improvement')).toBeInTheDocument();
    });
  });

  it('detects and displays anomalies', async () => {
    // Mock analytics with anomalous data
    mockAnalyticsService.generateMockAnalytics.mockImplementation((cabinetId: string) => ({
      cabinetId,
      period: {
        start: new Date('2024-01-01'),
        end: new Date('2024-01-31')
      },
      overview: {
        totalAppointments: 50,
        totalRevenue: 25000,
        totalPatients: 40,
        averageUtilization: cabinetId === 'cabinet-1' ? 25 : 75, // Anomalously low for cabinet-1
        trends: {
          appointments: cabinetId === 'cabinet-2' ? -35 : 5, // Anomalously negative for cabinet-2
          revenue: 10,
          patients: 5,
          utilization: 2
        }
      },
      timeSeries: {
        appointments: [],
        revenue: [],
        utilization: [],
        satisfaction: []
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
    }));

    render(<ComparativeAnalyticsDashboard cabinets={mockCabinets} />);
    
    // Switch to anomalies view
    await waitFor(() => {
      fireEvent.click(screen.getByText('Anomalies'));
    });

    await waitFor(() => {
      expect(screen.getByText('Detected Anomalies')).toBeInTheDocument();
      // Should detect utilization and trend anomalies
      expect(screen.getByText(/Utilization rate is below optimal range/)).toBeInTheDocument();
      expect(screen.getByText(/Significant decline in appointments/)).toBeInTheDocument();
    });
  });

  it('handles cabinet selection callback', async () => {
    const onCabinetSelect = vi.fn();
    render(
      <ComparativeAnalyticsDashboard 
        cabinets={mockCabinets} 
        onCabinetSelect={onCabinetSelect}
      />
    );
    
    // This would be tested when anomaly "View Details" buttons are clicked
    // The actual implementation would need the anomaly detection to work first
    await waitFor(() => {
      expect(screen.getByText('Comparative Analytics')).toBeInTheDocument();
    });
  });

  it('handles empty cabinet list', () => {
    render(<ComparativeAnalyticsDashboard cabinets={[]} />);
    
    expect(screen.getByText('Comparative Analytics')).toBeInTheDocument();
    expect(screen.getByText('Compare performance across your cabinet network')).toBeInTheDocument();
  });

  it('displays loading state', () => {
    render(<ComparativeAnalyticsDashboard cabinets={mockCabinets} />);
    
    // Should show loading spinner initially
    expect(screen.getByText('Comparative Analytics')).toBeInTheDocument();
    // The loading spinner has a specific class, let's check for that
    const loadingSpinner = document.querySelector('.animate-spin');
    expect(loadingSpinner).toBeInTheDocument();
  });
});