import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import ManagerDashboard from '@/components/manager/ManagerDashboard';
import { Cabinet, CabinetStatus } from '@/lib/models/cabinet';
import { PerformanceService } from '@/lib/services/performance-service';

// Mock the PerformanceService
vi.mock('@/lib/services/performance-service');

const mockCabinet: Cabinet = {
  id: 'test-cabinet-1',
  name: 'Cabinet Test',
  slug: 'cabinet-test',
  address: {
    street: '123 Rue Test',
    city: 'Paris',
    postalCode: '75001',
    country: 'France'
  },
  phone: '+33123456789',
  email: 'test@cabinet.fr',
  timezone: 'Europe/Paris',
  status: CabinetStatus.ACTIVE,
  databaseName: 'nova_cabinet_test',
  createdAt: new Date(),
  updatedAt: new Date()
};

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
    title: 'Taux de no-show élevé',
    message: 'Le taux de no-show est de 12%, au-dessus du seuil de 10%',
    threshold: 10,
    currentValue: 12,
    isActive: true,
    createdAt: new Date()
  }
];

describe('ManagerDashboard', () => {
  const mockPerformanceService = {
    getCabinetKPIs: vi.fn(),
    getActiveAlerts: vi.fn(),
    acknowledgeAlert: vi.fn(),
    subscribeToUpdates: vi.fn(),
    unsubscribeFromUpdates: vi.fn(),
    simulateRealtimeUpdate: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock PerformanceService.getInstance()
    vi.mocked(PerformanceService.getInstance).mockReturnValue(mockPerformanceService as any);
    
    // Setup default mock responses
    mockPerformanceService.getCabinetKPIs.mockResolvedValue({
      success: true,
      data: mockKPIs
    });
    
    mockPerformanceService.getActiveAlerts.mockResolvedValue({
      success: true,
      data: mockAlerts
    });
    
    mockPerformanceService.acknowledgeAlert.mockResolvedValue({
      success: true,
      data: true
    });
  });

  it('should render cabinet name and dashboard title', async () => {
    render(<ManagerDashboard cabinet={mockCabinet} userId="test-user" />);
    
    await waitFor(() => {
      expect(screen.getByText('Cabinet Test')).toBeInTheDocument();
      expect(screen.getByText('Tableau de bord manager')).toBeInTheDocument();
    });
  });

  it('should display loading state initially', () => {
    render(<ManagerDashboard cabinet={mockCabinet} userId="test-user" />);
    
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('should load and display KPIs', async () => {
    render(<ManagerDashboard cabinet={mockCabinet} userId="test-user" />);
    
    await waitFor(() => {
      expect(screen.getByText('50')).toBeInTheDocument(); // Total appointments
      expect(screen.getByText('3 000€')).toBeInTheDocument(); // Total revenue
      expect(screen.getByText('35')).toBeInTheDocument(); // Total patients
      expect(screen.getByText('10,0%')).toBeInTheDocument(); // No-show rate
    });
  });

  it('should display alerts when present', async () => {
    render(<ManagerDashboard cabinet={mockCabinet} userId="test-user" />);
    
    await waitFor(() => {
      expect(screen.getByText('Alertes actives (1)')).toBeInTheDocument();
      expect(screen.getByText('Taux de no-show élevé')).toBeInTheDocument();
    });
  });

  it('should handle time range selection', async () => {
    render(<ManagerDashboard cabinet={mockCabinet} userId="test-user" />);
    
    await waitFor(() => {
      const timeRangeSelect = screen.getByDisplayValue('7 derniers jours');
      expect(timeRangeSelect).toBeInTheDocument();
    });
    
    const timeRangeSelect = screen.getByDisplayValue('7 derniers jours');
    fireEvent.change(timeRangeSelect, { target: { value: 'month' } });
    
    await waitFor(() => {
      expect(mockPerformanceService.getCabinetKPIs).toHaveBeenCalledWith(
        mockCabinet.id,
        expect.any(Date),
        expect.any(Date)
      );
    });
  });

  it('should handle alert acknowledgment', async () => {
    render(<ManagerDashboard cabinet={mockCabinet} userId="test-user" />);
    
    await waitFor(() => {
      const acknowledgeButton = screen.getByText('Acquitter');
      expect(acknowledgeButton).toBeInTheDocument();
    });
    
    const acknowledgeButton = screen.getByText('Acquitter');
    fireEvent.click(acknowledgeButton);
    
    await waitFor(() => {
      expect(mockPerformanceService.acknowledgeAlert).toHaveBeenCalledWith('alert-1', 'test-user');
    });
  });

  it('should open customizer when customize button is clicked', async () => {
    render(<ManagerDashboard cabinet={mockCabinet} userId="test-user" />);
    
    await waitFor(() => {
      const customizeButton = screen.getByText('Personnaliser');
      expect(customizeButton).toBeInTheDocument();
    });
    
    const customizeButton = screen.getByText('Personnaliser');
    fireEvent.click(customizeButton);
    
    await waitFor(() => {
      expect(screen.getByText('Personnaliser le tableau de bord')).toBeInTheDocument();
    });
  });

  it('should subscribe to real-time updates on mount', async () => {
    render(<ManagerDashboard cabinet={mockCabinet} userId="test-user" />);
    
    await waitFor(() => {
      expect(mockPerformanceService.subscribeToUpdates).toHaveBeenCalledWith(
        mockCabinet.id,
        expect.any(Function)
      );
    });
  });

  it('should unsubscribe from real-time updates on unmount', async () => {
    const { unmount } = render(<ManagerDashboard cabinet={mockCabinet} userId="test-user" />);
    
    await waitFor(() => {
      expect(mockPerformanceService.subscribeToUpdates).toHaveBeenCalled();
    });
    
    unmount();
    
    expect(mockPerformanceService.unsubscribeFromUpdates).toHaveBeenCalledWith(
      mockCabinet.id,
      expect.any(Function)
    );
  });

  it('should handle API errors gracefully', async () => {
    mockPerformanceService.getCabinetKPIs.mockResolvedValue({
      success: false,
      error: 'API Error'
    });
    
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    render(<ManagerDashboard cabinet={mockCabinet} userId="test-user" />);
    
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Error loading dashboard data:', expect.any(Error));
    });
    
    consoleSpy.mockRestore();
  });

  it('should ensure data isolation by cabinet ID', async () => {
    render(<ManagerDashboard cabinet={mockCabinet} userId="test-user" />);
    
    await waitFor(() => {
      expect(mockPerformanceService.getCabinetKPIs).toHaveBeenCalledWith(
        mockCabinet.id,
        expect.any(Date),
        expect.any(Date)
      );
      
      expect(mockPerformanceService.getActiveAlerts).toHaveBeenCalledWith(mockCabinet.id);
    });
  });

  it('should display performance metrics correctly', async () => {
    render(<ManagerDashboard cabinet={mockCabinet} userId="test-user" />);
    
    await waitFor(() => {
      expect(screen.getByText('Taux de complétion')).toBeInTheDocument();
      expect(screen.getByText('80,0%')).toBeInTheDocument();
      expect(screen.getByText('Taux d\'occupation')).toBeInTheDocument();
      expect(screen.getByText('75%')).toBeInTheDocument();
    });
  });

  it('should show trends with correct indicators', async () => {
    render(<ManagerDashboard cabinet={mockCabinet} userId="test-user" />);
    
    await waitFor(() => {
      // Should show positive trend for appointments (+5%)
      expect(screen.getByText('+5,0%')).toBeInTheDocument();
      // Should show positive trend for revenue (+10%)
      expect(screen.getByText('+10,0%')).toBeInTheDocument();
    });
  });
});