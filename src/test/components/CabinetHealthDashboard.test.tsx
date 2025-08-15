import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CabinetHealthDashboard from '../../components/monitoring/CabinetHealthDashboard';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('CabinetHealthDashboard', () => {
  const mockHealthData = {
    success: true,
    data: [
      {
        cabinetId: 'cabinet-1',
        cabinetName: 'Test Cabinet 1',
        status: 'healthy',
        lastChecked: new Date('2024-01-01T10:00:00Z'),
        checks: [
          {
            name: 'database',
            status: 'healthy',
            message: 'Database connection successful',
            responseTime: 50,
            timestamp: Date.now()
          },
          {
            name: 'api',
            status: 'healthy',
            message: 'API endpoints responding',
            responseTime: 30,
            timestamp: Date.now()
          }
        ],
        uptime: 99.9,
        responseTime: 100,
        issues: []
      },
      {
        cabinetId: 'cabinet-2',
        cabinetName: 'Test Cabinet 2',
        status: 'degraded',
        lastChecked: new Date('2024-01-01T10:00:00Z'),
        checks: [
          {
            name: 'database',
            status: 'healthy',
            message: 'Database connection successful',
            responseTime: 50,
            timestamp: Date.now()
          },
          {
            name: 'configuration',
            status: 'degraded',
            message: 'Missing configurations: workingHours',
            responseTime: 20,
            timestamp: Date.now()
          }
        ],
        uptime: 95.0,
        responseTime: 150,
        issues: ['Configuration: Missing configurations: workingHours']
      }
    ],
    summary: {
      totalCabinets: 2,
      healthyCabinets: 1,
      degradedCabinets: 1,
      unhealthyCabinets: 0,
      activeAlerts: 1
    }
  };

  const mockAlertsData = {
    success: true,
    data: [
      {
        id: 'alert-1',
        cabinetId: 'cabinet-2',
        severity: 'warning',
        message: 'Cabinet Test Cabinet 2 is degraded: Configuration: Missing configurations: workingHours',
        timestamp: new Date('2024-01-01T10:00:00Z'),
        acknowledged: false
      }
    ],
    count: 1
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock successful API responses
    mockFetch.mockImplementation((url: string) => {
      if (url.includes('/api/cabinets/health')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockHealthData)
        });
      }
      if (url.includes('/api/cabinets/alerts')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockAlertsData)
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true })
      });
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should render loading state initially', () => {
    render(<CabinetHealthDashboard />);
    
    // Check for loading spinner
    expect(screen.getByText(/loading/i) || screen.getByRole('progressbar') || document.querySelector('.animate-spin')).toBeTruthy();
  });

  it('should render dashboard with health data', async () => {
    render(<CabinetHealthDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('Cabinet Health Monitoring')).toBeInTheDocument();
    });

    // Check summary cards
    expect(screen.getByText('2')).toBeInTheDocument(); // Total cabinets
    expect(screen.getByText('1')).toBeInTheDocument(); // Healthy cabinets
    expect(screen.getByText('1')).toBeInTheDocument(); // Degraded cabinets
    expect(screen.getByText('0')).toBeInTheDocument(); // Unhealthy cabinets

    // Check cabinet names
    expect(screen.getByText('Test Cabinet 1')).toBeInTheDocument();
    expect(screen.getByText('Test Cabinet 2')).toBeInTheDocument();

    // Check status badges
    expect(screen.getByText('HEALTHY')).toBeInTheDocument();
    expect(screen.getByText('DEGRADED')).toBeInTheDocument();
  });

  it('should display active alerts', async () => {
    render(<CabinetHealthDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('Active Alerts')).toBeInTheDocument();
    });

    expect(screen.getByText('WARNING')).toBeInTheDocument();
    expect(screen.getByText(/Cabinet Test Cabinet 2 is degraded/)).toBeInTheDocument();
    expect(screen.getByText('Acknowledge')).toBeInTheDocument();
    expect(screen.getByText('Resolve')).toBeInTheDocument();
  });

  it('should show cabinet health details', async () => {
    render(<CabinetHealthDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Cabinet 2')).toBeInTheDocument();
    });

    // Check uptime and response time
    expect(screen.getByText('Uptime: 95.0%')).toBeInTheDocument();
    expect(screen.getByText('Response: 150ms')).toBeInTheDocument();

    // Check issues
    expect(screen.getByText('Issues:')).toBeInTheDocument();
    expect(screen.getByText('• Configuration: Missing configurations: workingHours')).toBeInTheDocument();

    // Check health checks
    expect(screen.getByText('Health Checks:')).toBeInTheDocument();
    expect(screen.getByText('Database')).toBeInTheDocument();
    expect(screen.getByText('Configuration')).toBeInTheDocument();
  });

  it('should handle refresh cabinet health', async () => {
    render(<CabinetHealthDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Cabinet 1')).toBeInTheDocument();
    });

    const refreshButtons = screen.getAllByText('Refresh');
    fireEvent.click(refreshButtons[0]);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/cabinets/cabinet-1/health', {
        method: 'POST'
      });
    });
  });

  it('should handle acknowledge alert', async () => {
    render(<CabinetHealthDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('Acknowledge')).toBeInTheDocument();
    });

    const acknowledgeButton = screen.getByText('Acknowledge');
    fireEvent.click(acknowledgeButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/cabinets/alerts/alert-1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'acknowledge' })
      });
    });
  });

  it('should handle resolve alert', async () => {
    render(<CabinetHealthDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('Resolve')).toBeInTheDocument();
    });

    const resolveButton = screen.getByText('Resolve');
    fireEvent.click(resolveButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/cabinets/alerts/alert-1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'resolve' })
      });
    });
  });

  it('should handle API errors gracefully', async () => {
    mockFetch.mockRejectedValue(new Error('API Error'));
    
    render(<CabinetHealthDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('Error')).toBeInTheDocument();
      expect(screen.getByText('API Error')).toBeInTheDocument();
    });
  });

  it('should refresh data at specified interval', async () => {
    const shortInterval = 1000; // 1 second for testing
    render(<CabinetHealthDashboard refreshInterval={shortInterval} />);
    
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(2); // Initial load: health + alerts
    });

    // Wait for refresh interval
    await new Promise(resolve => setTimeout(resolve, shortInterval + 100));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(4); // After refresh: health + alerts again
    });
  });

  it('should display last updated timestamp', async () => {
    render(<CabinetHealthDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText(/Last updated:/)).toBeInTheDocument();
    });
  });

  it('should handle empty health data', async () => {
    mockFetch.mockImplementation((url: string) => {
      if (url.includes('/api/cabinets/health')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            data: [],
            summary: {
              totalCabinets: 0,
              healthyCabinets: 0,
              degradedCabinets: 0,
              unhealthyCabinets: 0,
              activeAlerts: 0
            }
          })
        });
      }
      if (url.includes('/api/cabinets/alerts')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, data: [], count: 0 })
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true })
      });
    });

    render(<CabinetHealthDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('Cabinet Health Monitoring')).toBeInTheDocument();
    });

    // Should show zero counts
    expect(screen.getByText('0')).toBeInTheDocument();
    
    // Should not show alerts section
    expect(screen.queryByText('Active Alerts')).not.toBeInTheDocument();
  });
});