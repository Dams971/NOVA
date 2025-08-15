import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import CabinetDetailView from '@/components/admin/CabinetDetailView';
import { Cabinet, CabinetStatus } from '@/lib/models/cabinet';
import { AnalyticsService } from '@/lib/services/analytics-service';

// Mock the AnalyticsService
vi.mock('@/lib/services/analytics-service');

// Mock recharts components
vi.mock('recharts', () => ({
  LineChart: ({ children }: any) => <div data-testid="line-chart">{children}</div>,
  Line: () => <div data-testid="line" />,
  AreaChart: ({ children }: any) => <div data-testid="area-chart">{children}</div>,
  Area: () => <div data-testid="area" />,
  BarChart: ({ children }: any) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => <div data-testid="bar" />,
  PieChart: ({ children }: any) => <div data-testid="pie-chart">{children}</div>,
  Pie: () => <div data-testid="pie" />,
  Cell: () => <div data-testid="cell" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
  ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>
}));

describe('CabinetDetailView', () => {
  let mockCabinet: Cabinet;
  let mockOnBack: ReturnType<typeof vi.fn>;
  let mockAnalyticsService: any;

  beforeEach(() => {
    mockCabinet = {
      id: 'cabinet-1',
      name: 'Test Cabinet',
      slug: 'test-cabinet',
      address: {
        street: '123 Test Street',
        city: 'Test City',
        postalCode: '12345',
        country: 'France'
      },
      phone: '+33123456789',
      email: 'test@cabinet.com',
      timezone: 'Europe/Paris',
      status: CabinetStatus.ACTIVE,
      databaseName: 'nova_cabinet_test',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01')
    };

    mockOnBack = vi.fn();

    // Mock AnalyticsService
    mockAnalyticsService = {
      generateMockAnalytics: vi.fn().mockReturnValue({
        cabinetId: 'cabinet-1',
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
            { date: '2024-01-01', value: 10, label: 'Jan 01' },
            { date: '2024-01-02', value: 12, label: 'Jan 02' }
          ],
          revenue: [
            { date: '2024-01-01', value: 1000, label: 'Jan 01' },
            { date: '2024-01-02', value: 1200, label: 'Jan 02' }
          ],
          utilization: [
            { date: '2024-01-01', value: 75, label: 'Jan 01' },
            { date: '2024-01-02', value: 80, label: 'Jan 02' }
          ],
          satisfaction: [
            { date: '2024-01-01', value: 8.5, label: 'Jan 01' },
            { date: '2024-01-02', value: 9.0, label: 'Jan 02' }
          ]
        },
        breakdown: {
          appointmentsByType: [
            { category: 'Consultation', value: 45, percentage: 45, trend: 'up' as const, trendValue: 5.2 },
            { category: 'Cleaning', value: 30, percentage: 30, trend: 'stable' as const, trendValue: 0.8 }
          ],
          revenueByService: [
            { category: 'Implants', value: 15000, percentage: 40, trend: 'up' as const, trendValue: 8.3 },
            { category: 'Orthodontics', value: 12000, percentage: 32, trend: 'up' as const, trendValue: 3.7 }
          ],
          patientsByAge: [
            { category: '18-30', value: 25, percentage: 25, trend: 'up' as const, trendValue: 3.2 },
            { category: '31-45', value: 35, percentage: 35, trend: 'stable' as const, trendValue: 0.8 }
          ],
          appointmentsByHour: [
            { category: '9:00', value: 8, percentage: 10, trend: 'stable' as const, trendValue: 0.2 },
            { category: '10:00', value: 12, percentage: 15, trend: 'up' as const, trendValue: 2.1 }
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
      }),
      exportReport: vi.fn(),
      getReportTemplates: vi.fn()
    };

    (AnalyticsService as any).mockImplementation(() => mockAnalyticsService);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should render cabinet information correctly', async () => {
    render(<CabinetDetailView cabinet={mockCabinet} onBack={mockOnBack} />);

    await waitFor(() => {
      expect(screen.getByText('Test Cabinet')).toBeInTheDocument();
      expect(screen.getByText('Test City • Performance Analytics')).toBeInTheDocument();
    });
  });

  it('should call onBack when back button is clicked', async () => {
    render(<CabinetDetailView cabinet={mockCabinet} onBack={mockOnBack} />);

    await waitFor(() => {
      const backButton = screen.getByText('Back to Overview');
      fireEvent.click(backButton);
      expect(mockOnBack).toHaveBeenCalledTimes(1);
    });
  });

  it('should display loading state initially', () => {
    render(<CabinetDetailView cabinet={mockCabinet} onBack={mockOnBack} />);
    
    expect(screen.getByRole('status', { hidden: true })).toBeInTheDocument();
  });

  it('should display KPI cards with correct values', async () => {
    render(<CabinetDetailView cabinet={mockCabinet} onBack={mockOnBack} />);

    await waitFor(() => {
      expect(screen.getByText('150')).toBeInTheDocument(); // Total Appointments
      expect(screen.getByText('€15,000.00')).toBeInTheDocument(); // Total Revenue
      expect(screen.getByText('120')).toBeInTheDocument(); // Total Patients
      expect(screen.getByText('75.0%')).toBeInTheDocument(); // Average Utilization
    });
  });

  it('should display trend indicators correctly', async () => {
    render(<CabinetDetailView cabinet={mockCabinet} onBack={mockOnBack} />);

    await waitFor(() => {
      // Check for trend percentages
      expect(screen.getByText('5.2%')).toBeInTheDocument(); // Appointments trend
      expect(screen.getByText('8.3%')).toBeInTheDocument(); // Revenue trend
      expect(screen.getByText('3.1%')).toBeInTheDocument(); // Patients trend
      expect(screen.getByText('2.1%')).toBeInTheDocument(); // Utilization trend
    });
  });

  it('should switch between tabs correctly', async () => {
    render(<CabinetDetailView cabinet={mockCabinet} onBack={mockOnBack} />);

    await waitFor(() => {
      // Initially on overview tab
      expect(screen.getByText('Total Appointments')).toBeInTheDocument();

      // Click on trends tab
      const trendsTab = screen.getByText('Trends');
      fireEvent.click(trendsTab);

      // Should show trends content
      expect(screen.getByText('Metric:')).toBeInTheDocument();
      expect(screen.getByText('Granularity:')).toBeInTheDocument();
    });
  });

  it('should switch to breakdown tab and display charts', async () => {
    render(<CabinetDetailView cabinet={mockCabinet} onBack={mockOnBack} />);

    await waitFor(() => {
      const breakdownTab = screen.getByText('Breakdown');
      fireEvent.click(breakdownTab);

      // Should show breakdown charts
      expect(screen.getByText('Appointments by Type')).toBeInTheDocument();
      expect(screen.getByText('Revenue by Service')).toBeInTheDocument();
      expect(screen.getByText('Appointments by Hour')).toBeInTheDocument();
      expect(screen.getByText('Patients by Age Group')).toBeInTheDocument();
    });
  });

  it('should switch to comparison tab and display comparisons', async () => {
    render(<CabinetDetailView cabinet={mockCabinet} onBack={mockOnBack} />);

    await waitFor(() => {
      const comparisonTab = screen.getByText('Comparison');
      fireEvent.click(comparisonTab);

      // Should show comparison content
      expect(screen.getByText('vs Previous Period')).toBeInTheDocument();
      expect(screen.getByText('vs Network Average')).toBeInTheDocument();
    });
  });

  it('should change date range preset', async () => {
    render(<CabinetDetailView cabinet={mockCabinet} onBack={mockOnBack} />);

    await waitFor(() => {
      const dateRangeSelect = screen.getByDisplayValue('Last 30 days');
      fireEvent.change(dateRangeSelect, { target: { value: '7d' } });

      expect(dateRangeSelect).toHaveValue('7d');
    });
  });

  it('should show custom date range inputs when custom is selected', async () => {
    render(<CabinetDetailView cabinet={mockCabinet} onBack={mockOnBack} />);

    await waitFor(() => {
      const dateRangeSelect = screen.getByDisplayValue('Last 30 days');
      fireEvent.change(dateRangeSelect, { target: { value: 'custom' } });

      expect(screen.getByLabelText('Start Date')).toBeInTheDocument();
      expect(screen.getByLabelText('End Date')).toBeInTheDocument();
    });
  });

  it('should change metric selection in trends tab', async () => {
    render(<CabinetDetailView cabinet={mockCabinet} onBack={mockOnBack} />);

    await waitFor(() => {
      const trendsTab = screen.getByText('Trends');
      fireEvent.click(trendsTab);

      const metricSelect = screen.getByDisplayValue('Appointments');
      fireEvent.change(metricSelect, { target: { value: 'revenue' } });

      expect(metricSelect).toHaveValue('revenue');
    });
  });

  it('should change granularity selection in trends tab', async () => {
    render(<CabinetDetailView cabinet={mockCabinet} onBack={mockOnBack} />);

    await waitFor(() => {
      const trendsTab = screen.getByText('Trends');
      fireEvent.click(trendsTab);

      const granularitySelect = screen.getByDisplayValue('Daily');
      fireEvent.change(granularitySelect, { target: { value: 'week' } });

      expect(granularitySelect).toHaveValue('week');
    });
  });

  it('should handle refresh button click', async () => {
    render(<CabinetDetailView cabinet={mockCabinet} onBack={mockOnBack} />);

    await waitFor(() => {
      const refreshButton = screen.getByText('Refresh');
      fireEvent.click(refreshButton);

      // Should call generateMockAnalytics again
      expect(mockAnalyticsService.generateMockAnalytics).toHaveBeenCalledTimes(2);
    });
  });

  it('should format currency correctly', async () => {
    render(<CabinetDetailView cabinet={mockCabinet} onBack={mockOnBack} />);

    await waitFor(() => {
      // Check French currency formatting
      expect(screen.getByText('€15,000.00')).toBeInTheDocument();
    });
  });

  it('should format percentages correctly', async () => {
    render(<CabinetDetailView cabinet={mockCabinet} onBack={mockOnBack} />);

    await waitFor(() => {
      expect(screen.getByText('75.0%')).toBeInTheDocument();
    });
  });

  it('should display charts in overview tab', async () => {
    render(<CabinetDetailView cabinet={mockCabinet} onBack={mockOnBack} />);

    await waitFor(() => {
      expect(screen.getByText('Appointments Trend')).toBeInTheDocument();
      expect(screen.getByText('Revenue Trend')).toBeInTheDocument();
      expect(screen.getAllByTestId('responsive-container')).toHaveLength(2);
    });
  });

  it('should display breakdown data with trends', async () => {
    render(<CabinetDetailView cabinet={mockCabinet} onBack={mockOnBack} />);

    await waitFor(() => {
      const breakdownTab = screen.getByText('Breakdown');
      fireEvent.click(breakdownTab);

      // Check age group breakdown
      expect(screen.getByText('18-30')).toBeInTheDocument();
      expect(screen.getByText('31-45')).toBeInTheDocument();
      expect(screen.getByText('25%')).toBeInTheDocument();
      expect(screen.getByText('35%')).toBeInTheDocument();
    });
  });

  it('should handle error state', async () => {
    // Mock analytics service to throw error
    mockAnalyticsService.generateMockAnalytics.mockImplementation(() => {
      throw new Error('Test error');
    });

    render(<CabinetDetailView cabinet={mockCabinet} onBack={mockOnBack} />);

    await waitFor(() => {
      expect(screen.getByText('Error')).toBeInTheDocument();
      expect(screen.getByText('Test error')).toBeInTheDocument();
      expect(screen.getByText('Retry')).toBeInTheDocument();
    });
  });

  it('should retry on error', async () => {
    // Mock analytics service to throw error first, then succeed
    mockAnalyticsService.generateMockAnalytics
      .mockImplementationOnce(() => {
        throw new Error('Test error');
      })
      .mockImplementationOnce(() => mockAnalyticsService.generateMockAnalytics());

    render(<CabinetDetailView cabinet={mockCabinet} onBack={mockOnBack} />);

    await waitFor(() => {
      const retryButton = screen.getByText('Retry');
      fireEvent.click(retryButton);

      expect(mockAnalyticsService.generateMockAnalytics).toHaveBeenCalledTimes(2);
    });
  });

  it('should display comparison data correctly', async () => {
    render(<CabinetDetailView cabinet={mockCabinet} onBack={mockOnBack} />);

    await waitFor(() => {
      const comparisonTab = screen.getByText('Comparison');
      fireEvent.click(comparisonTab);

      // Check previous period comparison
      expect(screen.getByText('Appointments')).toBeInTheDocument();
      expect(screen.getByText('Revenue')).toBeInTheDocument();
      expect(screen.getByText('Patients')).toBeInTheDocument();
      expect(screen.getByText('Utilization')).toBeInTheDocument();

      // Check trend values
      expect(screen.getByText('+5.2%')).toBeInTheDocument();
      expect(screen.getByText('+8.3%')).toBeInTheDocument();
    });
  });
});