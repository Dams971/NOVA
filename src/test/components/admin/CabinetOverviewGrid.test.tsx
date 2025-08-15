import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CabinetOverviewGrid from '@/components/admin/CabinetOverviewGrid';
import { Cabinet, CabinetStatus } from '@/lib/models/cabinet';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock WebSocket
class MockWebSocket {
  onopen: ((event: Event) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  readyState = WebSocket.CONNECTING;

  constructor(public url: string) {
    setTimeout(() => {
      this.readyState = WebSocket.OPEN;
      this.onopen?.(new Event('open'));
    }, 0);
  }

  close() {
    this.readyState = WebSocket.CLOSED;
    this.onclose?.(new CloseEvent('close'));
  }

  send(data: string) {
    // Mock send
  }
}

global.WebSocket = MockWebSocket as any;

const mockCabinets: Cabinet[] = [
  {
    id: '1',
    name: 'Cabinet Dentaire Paris',
    slug: 'cabinet-paris',
    address: {
      street: '123 Rue de la Paix',
      city: 'Paris',
      postalCode: '75001',
      country: 'France'
    },
    phone: '+33123456789',
    email: 'contact@cabinet-paris.fr',
    timezone: 'Europe/Paris',
    status: CabinetStatus.ACTIVE,
    databaseName: 'nova_cabinet_paris',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: '2',
    name: 'Cabinet Dentaire Lyon',
    slug: 'cabinet-lyon',
    address: {
      street: '456 Avenue de la République',
      city: 'Lyon',
      postalCode: '69001',
      country: 'France'
    },
    phone: '+33987654321',
    email: 'contact@cabinet-lyon.fr',
    timezone: 'Europe/Paris',
    status: CabinetStatus.INACTIVE,
    databaseName: 'nova_cabinet_lyon',
    createdAt: new Date('2024-01-02'),
    updatedAt: new Date('2024-01-02')
  }
];

const mockMetrics = [
  {
    cabinetId: '1',
    appointmentsToday: 12,
    appointmentsThisWeek: 45,
    revenue: 2500,
    patientCount: 150,
    utilizationRate: 85,
    healthStatus: 'healthy' as const,
    lastActivity: new Date()
  },
  {
    cabinetId: '2',
    appointmentsToday: 8,
    appointmentsThisWeek: 30,
    revenue: 1800,
    patientCount: 120,
    utilizationRate: 65,
    healthStatus: 'degraded' as const,
    lastActivity: new Date()
  }
];

describe('CabinetOverviewGrid', () => {
  beforeEach(() => {
    mockFetch.mockClear();
    
    // Mock successful API responses
    mockFetch.mockImplementation((url: string) => {
      if (url.includes('/api/admin/cabinets/metrics')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            data: mockMetrics
          })
        });
      }
      
      if (url.includes('/api/admin/cabinets')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            data: mockCabinets
          })
        });
      }
      
      return Promise.reject(new Error('Unknown URL'));
    });
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  it('renders loading state initially', () => {
    render(<CabinetOverviewGrid />);
    // Check for loading spinner
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('renders cabinet data after loading', async () => {
    render(<CabinetOverviewGrid />);
    
    await waitFor(() => {
      expect(screen.getByText('Cabinet Dentaire Paris')).toBeInTheDocument();
      expect(screen.getByText('Cabinet Dentaire Lyon')).toBeInTheDocument();
    });
  });

  it('displays cabinet metrics correctly', async () => {
    render(<CabinetOverviewGrid />);
    
    await waitFor(() => {
      expect(screen.getByText('12')).toBeInTheDocument(); // appointments today for Paris
      expect(screen.getByText('8')).toBeInTheDocument(); // appointments today for Lyon
      // Check for revenue values (may be formatted differently)
      expect(screen.getByText(/2.*500/)).toBeInTheDocument(); // revenue for Paris
      expect(screen.getByText(/1.*800/)).toBeInTheDocument(); // revenue for Lyon
    });
  });

  it('handles search functionality', async () => {
    render(<CabinetOverviewGrid />);
    
    await waitFor(() => {
      expect(screen.getByText('Cabinet Dentaire Paris')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Search cabinets...');
    fireEvent.change(searchInput, { target: { value: 'Paris' } });

    await waitFor(() => {
      expect(screen.getByText('Cabinet Dentaire Paris')).toBeInTheDocument();
      expect(screen.queryByText('Cabinet Dentaire Lyon')).not.toBeInTheDocument();
    });
  });

  it('handles status filtering', async () => {
    render(<CabinetOverviewGrid />);
    
    await waitFor(() => {
      expect(screen.getByText('Cabinet Dentaire Paris')).toBeInTheDocument();
    });

    // Open filters
    const filterButton = screen.getByText('Filters');
    fireEvent.click(filterButton);

    // Select active status filter
    const statusSelect = screen.getByDisplayValue('All Statuses');
    fireEvent.change(statusSelect, { target: { value: 'active' } });

    await waitFor(() => {
      expect(screen.getByText('Cabinet Dentaire Paris')).toBeInTheDocument();
      expect(screen.queryByText('Cabinet Dentaire Lyon')).not.toBeInTheDocument();
    });
  });

  it('handles sorting by name', async () => {
    render(<CabinetOverviewGrid />);
    
    await waitFor(() => {
      expect(screen.getByText('Cabinet Dentaire Paris')).toBeInTheDocument();
    });

    const nameHeader = screen.getByText('Cabinet');
    fireEvent.click(nameHeader);

    // Should still show both cabinets but potentially in different order
    await waitFor(() => {
      expect(screen.getByText('Cabinet Dentaire Paris')).toBeInTheDocument();
      expect(screen.getByText('Cabinet Dentaire Lyon')).toBeInTheDocument();
    });
  });

  it('handles sorting by appointments', async () => {
    render(<CabinetOverviewGrid />);
    
    await waitFor(() => {
      expect(screen.getByText('Cabinet Dentaire Paris')).toBeInTheDocument();
    });

    const appointmentsHeaders = screen.getAllByText("Today's Appointments");
    fireEvent.click(appointmentsHeaders[0]); // Click the table header, not the summary

    // Should still show both cabinets
    await waitFor(() => {
      expect(screen.getByText('Cabinet Dentaire Paris')).toBeInTheDocument();
      expect(screen.getByText('Cabinet Dentaire Lyon')).toBeInTheDocument();
    });
  });

  it('calls onCabinetSelect when view button is clicked', async () => {
    const mockOnCabinetSelect = vi.fn();
    render(<CabinetOverviewGrid onCabinetSelect={mockOnCabinetSelect} />);
    
    await waitFor(() => {
      expect(screen.getByText('Cabinet Dentaire Paris')).toBeInTheDocument();
    });

    const viewButtons = screen.getAllByTitle('View Details');
    fireEvent.click(viewButtons[0]);

    expect(mockOnCabinetSelect).toHaveBeenCalledWith(
      expect.objectContaining({
        name: expect.stringContaining('Cabinet Dentaire')
      })
    );
  });

  it('calls onCabinetSettings when settings button is clicked', async () => {
    const mockOnCabinetSettings = vi.fn();
    render(<CabinetOverviewGrid onCabinetSettings={mockOnCabinetSettings} />);
    
    await waitFor(() => {
      expect(screen.getByText('Cabinet Dentaire Paris')).toBeInTheDocument();
    });

    const settingsButtons = screen.getAllByTitle('Settings');
    fireEvent.click(settingsButtons[0]);

    expect(mockOnCabinetSettings).toHaveBeenCalledWith(
      expect.objectContaining({
        name: expect.stringContaining('Cabinet Dentaire')
      })
    );
  });

  it('displays summary statistics correctly', async () => {
    render(<CabinetOverviewGrid />);
    
    await waitFor(() => {
      expect(screen.getByText('2')).toBeInTheDocument(); // Total cabinets
      expect(screen.getByText('1')).toBeInTheDocument(); // Active cabinets
      expect(screen.getByText('20')).toBeInTheDocument(); // Total appointments today (12 + 8)
      // Check for total revenue with flexible formatting
      expect(screen.getByText(/4.*300/)).toBeInTheDocument(); // Total revenue (2500 + 1800)
    });
  });

  it('handles refresh button click', async () => {
    render(<CabinetOverviewGrid />);
    
    await waitFor(() => {
      expect(screen.getByText('Cabinet Dentaire Paris')).toBeInTheDocument();
    });

    const refreshButton = screen.getByText('Refresh');
    fireEvent.click(refreshButton);

    // Should trigger additional API calls
    expect(mockFetch).toHaveBeenCalledTimes(4); // Initial 2 calls + 2 refresh calls
  });

  it('displays error state when API fails', async () => {
    mockFetch.mockImplementation(() => 
      Promise.resolve({
        ok: false,
        status: 500
      })
    );

    render(<CabinetOverviewGrid />);
    
    await waitFor(() => {
      expect(screen.getByText('Error')).toBeInTheDocument();
    });
  });

  it('displays empty state when no cabinets match filters', async () => {
    render(<CabinetOverviewGrid />);
    
    await waitFor(() => {
      expect(screen.getByText('Cabinet Dentaire Paris')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Search cabinets...');
    fireEvent.change(searchInput, { target: { value: 'NonExistentCabinet' } });

    await waitFor(() => {
      expect(screen.getByText('No cabinets found matching your criteria.')).toBeInTheDocument();
    });
  });

  it('displays health status correctly', async () => {
    render(<CabinetOverviewGrid />);
    
    await waitFor(() => {
      expect(screen.getByText('healthy')).toBeInTheDocument();
      expect(screen.getByText('degraded')).toBeInTheDocument();
    });
  });

  it('displays utilization rate with progress bar', async () => {
    render(<CabinetOverviewGrid />);
    
    await waitFor(() => {
      expect(screen.getByText('85%')).toBeInTheDocument();
      expect(screen.getByText('65%')).toBeInTheDocument();
    });

    // Check that progress bars are rendered
    const progressBars = screen.getAllByRole('progressbar');
    expect(progressBars).toHaveLength(2);
  });
});