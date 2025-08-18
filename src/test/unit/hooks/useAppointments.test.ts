/**
 * useAppointments Hook Unit Tests
 * 
 * Comprehensive tests for the appointments management hook including:
 * - CRUD operations (fetch, create, update, cancel, confirm)
 * - WebSocket integration for real-time updates
 * - Auto-refresh functionality
 * - Error handling and loading states
 * - AI assistant integration
 * - Available slots fetching
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
  useAppointments, 
  useAvailableSlots, 
  useAppointmentAI, 
  useCreateAppointment,
  type Appointment,
  type Patient,
  type TimeSlot,
  type AIResponse
} from '@/hooks/useAppointments';
import { renderHook, act, waitFor } from '@/test/test-utils';

// Mock useWebSocket hook
const mockWebSocketHook = {
  isConnected: true,
  lastMessage: null,
  connect: vi.fn(),
  disconnect: vi.fn(),
  sendMessage: vi.fn(),
};

vi.mock('@/hooks/useWebSocket', () => ({
  useWebSocket: vi.fn(() => mockWebSocketHook),
}));

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Sample test data
const mockAppointment: Appointment = {
  id: 'apt-123',
  patientId: 'patient-456',
  careType: 'consultation',
  scheduledAt: '2024-01-15T14:30:00Z',
  title: 'Consultation générale',
  status: 'scheduled',
  patientName: 'Jean Dupont',
  practitionerName: 'Dr. Smith',
  createdAt: '2024-01-10T10:00:00Z',
  updatedAt: '2024-01-10T10:00:00Z',
};

const mockPatient: Patient = {
  id: 'patient-456',
  firstName: 'Jean',
  lastName: 'Dupont',
  phoneE164: '+213555123456',
  email: 'jean.dupont@example.com',
  gdprConsent: {
    dataProcessing: { consent: true, date: '2024-01-01' },
  },
};

const mockTimeSlot: TimeSlot = {
  startTime: '2024-01-15T14:30:00Z',
  endTime: '2024-01-15T15:00:00Z',
  duration: 30,
  available: true,
  practitionerId: 'practitioner-789',
};

const mockAIResponse: AIResponse = {
  action: 'NEED_INFO',
  clinic_address: 'Cité 109, Daboussy El Achour, Alger',
  timezone: 'Africa/Algiers',
  patient: {
    name: 'Jean Dupont',
    phone_e164: '+213555123456',
  },
  missing_fields: ['date'],
  clarification_question: 'Pour quelle date souhaitez-vous prendre rendez-vous ?',
};

describe('useAppointments Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockWebSocketHook.lastMessage = null;
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('Basic State Management', () => {
    it('should initialize with empty state', () => {
      const { result } = renderHook(() => useAppointments());

      expect(result.current.appointments).toEqual([]);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.lastFetch).toBeNull();
    });
  });

  describe('fetchAppointments', () => {
    it('should fetch appointments successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: [mockAppointment],
        }),
      });

      const { result } = renderHook(() => useAppointments());

      await act(async () => {
        await result.current.fetchAppointments();
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/rdv'),
        expect.objectContaining({
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        })
      );
      expect(result.current.appointments).toEqual([mockAppointment]);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.lastFetch).toBeInstanceOf(Date);
    });

    it('should handle search parameters correctly', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, data: [] }),
      });

      const { result } = renderHook(() => useAppointments());

      await act(async () => {
        await result.current.fetchAppointments({
          patientId: 'patient-123',
          careType: 'consultation',
          status: ['scheduled', 'confirmed'],
          dateFrom: '2024-01-01',
          dateTo: '2024-01-31',
        });
      });

      const callUrl = mockFetch.mock.calls[0][0];
      expect(callUrl).toContain('patientId=patient-123');
      expect(callUrl).toContain('careType=consultation');
      expect(callUrl).toContain('status=scheduled%2Cconfirmed');
      expect(callUrl).toContain('dateFrom=2024-01-01');
      expect(callUrl).toContain('dateTo=2024-01-31');
    });

    it('should handle API errors', async () => {
      const errorMessage = 'Erreur serveur';
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: errorMessage }),
      });

      const { result } = renderHook(() => useAppointments());

      await act(async () => {
        await result.current.fetchAppointments();
      });

      expect(result.current.appointments).toEqual([]);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(errorMessage);
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useAppointments());

      await act(async () => {
        await result.current.fetchAppointments();
      });

      expect(result.current.error).toBe('Network error');
      expect(result.current.loading).toBe(false);
    });

    it('should set loading state correctly', async () => {
      let resolvePromise: (value: any) => void;
      const fetchPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      mockFetch.mockReturnValueOnce(fetchPromise);

      const { result } = renderHook(() => useAppointments());

      // Start fetch
      act(() => {
        result.current.fetchAppointments();
      });

      // Loading should be true
      expect(result.current.loading).toBe(true);

      // Resolve the promise
      await act(async () => {
        resolvePromise!({
          ok: true,
          json: () => Promise.resolve({ success: true, data: [] }),
        });
        await fetchPromise;
      });

      // Loading should be false
      expect(result.current.loading).toBe(false);
    });
  });

  describe('getAppointment', () => {
    it('should fetch single appointment successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: mockAppointment,
        }),
      });

      const { result } = renderHook(() => useAppointments());

      let appointment: Appointment | null = null;
      await act(async () => {
        appointment = await result.current.getAppointment('apt-123');
      });

      expect(mockFetch).toHaveBeenCalledWith('/api/rdv?id=apt-123');
      expect(appointment).toEqual(mockAppointment);
    });

    it('should handle single appointment errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      const { result } = renderHook(() => useAppointments());

      let appointment: Appointment | null = null;
      await act(async () => {
        appointment = await result.current.getAppointment('nonexistent');
      });

      expect(appointment).toBeNull();
      expect(result.current.error).toContain('Erreur HTTP 404');
    });
  });

  describe('updateAppointment', () => {
    it('should update appointment successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      const { result } = renderHook(() => useAppointments());

      // Set initial appointments
      await act(async () => {
        result.current.appointments.push(mockAppointment);
      });

      const updates = { title: 'Consultation urgente' };
      let success = false;

      await act(async () => {
        success = await result.current.updateAppointment('apt-123', updates);
      });

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/rdv',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'update',
            appointmentId: 'apt-123',
            updates,
          }),
        })
      );
      expect(success).toBe(true);
    });

    it('should handle update errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ error: 'Invalid data' }),
      });

      const { result } = renderHook(() => useAppointments());

      let success = false;
      await act(async () => {
        success = await result.current.updateAppointment('apt-123', {});
      });

      expect(success).toBe(false);
      expect(result.current.error).toBe('Invalid data');
    });
  });

  describe('cancelAppointment', () => {
    it('should cancel appointment successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      const { result } = renderHook(() => useAppointments());

      let success = false;
      await act(async () => {
        success = await result.current.cancelAppointment('apt-123', 'Patient request');
      });

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/rdv',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            action: 'cancel',
            appointmentId: 'apt-123',
            reason: 'Patient request',
          }),
        })
      );
      expect(success).toBe(true);
    });
  });

  describe('confirmAppointment', () => {
    it('should confirm appointment successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      const { result } = renderHook(() => useAppointments());

      let success = false;
      await act(async () => {
        success = await result.current.confirmAppointment('apt-123');
      });

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/rdv',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            action: 'confirm',
            appointmentId: 'apt-123',
            confirmedBy: 'patient',
          }),
        })
      );
      expect(success).toBe(true);
    });
  });

  describe('Auto-refresh', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should auto-refresh when enabled', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true, data: [] }),
      });

      renderHook(() => 
        useAppointments({ autoRefresh: true, refreshInterval: 1000 })
      );

      // Initial fetch
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Advance timer
      await act(async () => {
        vi.advanceTimersByTime(1000);
      });

      // Should fetch again
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should not auto-refresh when disabled', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true, data: [] }),
      });

      renderHook(() => 
        useAppointments({ autoRefresh: false })
      );

      // No initial fetch
      expect(mockFetch).not.toHaveBeenCalled();

      // Advance timer
      await act(async () => {
        vi.advanceTimersByTime(60000);
      });

      // Still no fetch
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should cleanup auto-refresh on unmount', async () => {
      const { unmount } = renderHook(() => 
        useAppointments({ autoRefresh: true, refreshInterval: 1000 })
      );

      unmount();

      // Timer should be cleaned up
      await act(async () => {
        vi.advanceTimersByTime(5000);
      });

      // No additional fetches after unmount
      expect(mockFetch).toHaveBeenCalledTimes(0);
    });
  });

  describe('WebSocket Integration', () => {
    it('should refetch on WebSocket appointment updates', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true, data: [] }),
      });

      const { result } = renderHook(() => useAppointments());

      // Simulate WebSocket message
      await act(async () => {
        mockWebSocketHook.lastMessage = JSON.stringify({
          type: 'appointment_updated',
          data: { appointmentId: 'apt-123' },
        });
      });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled();
      });
    });

    it('should ignore malformed WebSocket messages', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      renderHook(() => useAppointments());

      // Simulate malformed WebSocket message
      await act(async () => {
        mockWebSocketHook.lastMessage = 'invalid json';
      });

      // Should not crash and not fetch
      expect(mockFetch).not.toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });
  });
});

describe('useAvailableSlots Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with empty slots', () => {
    const { result } = renderHook(() => useAvailableSlots());

    expect(result.current.slots).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should fetch slots successfully', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        slots: [mockTimeSlot],
      }),
    });

    const { result } = renderHook(() => useAvailableSlots());

    await act(async () => {
      await result.current.fetchSlots('2024-01-15', 'consultation', 'practitioner-789');
    });

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/rdv',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          action: 'slots',
          date: '2024-01-15',
          careType: 'consultation',
          practitionerId: 'practitioner-789',
        }),
      })
    );
    expect(result.current.slots).toEqual([mockTimeSlot]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should handle slots fetch errors', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: () => Promise.resolve({ error: 'Invalid date' }),
    });

    const { result } = renderHook(() => useAvailableSlots());

    await act(async () => {
      await result.current.fetchSlots('invalid-date');
    });

    expect(result.current.slots).toEqual([]);
    expect(result.current.error).toBe('Invalid date');
  });
});

describe('useAppointmentAI Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with empty state', () => {
    const { result } = renderHook(() => useAppointmentAI('session-123'));

    expect(result.current.response).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.conversationHistory).toEqual([]);
  });

  it('should process AI message successfully', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        aiResponse: mockAIResponse,
      }),
    });

    const { result } = renderHook(() => useAppointmentAI('session-123'));

    let response: AIResponse | null = null;
    await act(async () => {
      response = await result.current.processMessage(
        'Je voudrais prendre un rendez-vous',
        { name: 'Jean Dupont', phone: '+213555123456' }
      );
    });

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/rdv',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          'X-Session-ID': 'session-123',
        }),
        body: JSON.stringify({
          action: 'ai',
          message: 'Je voudrais prendre un rendez-vous',
          sessionId: 'session-123',
          patientContext: { name: 'Jean Dupont', phone: '+213555123456' },
        }),
      })
    );
    
    expect(response).toEqual(mockAIResponse);
    expect(result.current.response).toEqual(mockAIResponse);
    expect(result.current.conversationHistory).toHaveLength(1);
    expect(result.current.loading).toBe(false);
  });

  it('should handle AI processing errors', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ error: 'AI service unavailable' }),
    });

    const { result } = renderHook(() => useAppointmentAI('session-123'));

    let response: AIResponse | null = null;
    await act(async () => {
      response = await result.current.processMessage('Test message');
    });

    expect(response).toBeNull();
    expect(result.current.error).toBe('AI service unavailable');
    expect(result.current.loading).toBe(false);
  });

  it('should clear conversation history', () => {
    const { result } = renderHook(() => useAppointmentAI('session-123'));

    // Simulate some state
    act(() => {
      result.current.processMessage('Test');
    });

    act(() => {
      result.current.clearConversation();
    });

    expect(result.current.response).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.conversationHistory).toEqual([]);
  });
});

describe('useCreateAppointment Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with empty state', () => {
    const { result } = renderHook(() => useCreateAppointment());

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.lastCreated).toBeNull();
  });

  it('should create appointment successfully', async () => {
    const createResponse = {
      success: true,
      appointmentId: 'apt-new-123',
      patientId: 'patient-456',
      patientCreated: false,
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(createResponse),
    });

    const { result } = renderHook(() => useCreateAppointment());

    const appointmentData = {
      careType: 'consultation' as const,
      scheduledAt: '2024-01-15T14:30:00Z',
      title: 'Consultation générale',
    };

    let createdAppointment: any = null;
    await act(async () => {
      createdAppointment = await result.current.createAppointment(mockPatient, appointmentData);
    });

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/rdv',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          action: 'create',
          patient: mockPatient,
          appointment: appointmentData,
        }),
      })
    );

    expect(createdAppointment).toEqual({
      appointmentId: 'apt-new-123',
      patientId: 'patient-456',
      patientCreated: false,
    });
    expect(result.current.lastCreated).toEqual(createdAppointment);
    expect(result.current.loading).toBe(false);
  });

  it('should handle creation errors', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: () => Promise.resolve({ error: 'Invalid appointment data' }),
    });

    const { result } = renderHook(() => useCreateAppointment());

    let createdAppointment: any = null;
    await act(async () => {
      createdAppointment = await result.current.createAppointment(mockPatient, {
        careType: 'consultation',
        scheduledAt: 'invalid-date',
        title: 'Test',
      });
    });

    expect(createdAppointment).toBeNull();
    expect(result.current.error).toBe('Invalid appointment data');
    expect(result.current.loading).toBe(false);
  });

  it('should handle network errors during creation', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network failed'));

    const { result } = renderHook(() => useCreateAppointment());

    let createdAppointment: any = null;
    await act(async () => {
      createdAppointment = await result.current.createAppointment(mockPatient, {
        careType: 'consultation',
        scheduledAt: '2024-01-15T14:30:00Z',
        title: 'Test',
      });
    });

    expect(createdAppointment).toBeNull();
    expect(result.current.error).toBe('Network failed');
    expect(result.current.loading).toBe(false);
  });
});

describe('French Language Support', () => {
  it('should handle French error messages', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: () => Promise.resolve({ error: 'Données invalides' }),
    });

    const { result } = renderHook(() => useAppointments());

    await act(async () => {
      await result.current.fetchAppointments();
    });

    expect(result.current.error).toBe('Données invalides');
  });

  it('should use French default error messages', async () => {
    mockFetch.mockRejectedValueOnce(new Error());

    const { result } = renderHook(() => useAppointments());

    await act(async () => {
      await result.current.fetchAppointments();
    });

    expect(result.current.error).toContain('Erreur lors du chargement des rendez-vous');
  });
});

describe('Edge Cases and Error Handling', () => {
  it('should handle empty API responses', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });

    const { result } = renderHook(() => useAppointments());

    await act(async () => {
      await result.current.fetchAppointments();
    });

    expect(result.current.appointments).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it('should handle malformed JSON responses', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: () => Promise.reject(new Error('Invalid JSON')),
    });

    const { result } = renderHook(() => useAppointments());

    await act(async () => {
      await result.current.fetchAppointments();
    });

    expect(result.current.error).toContain('Erreur HTTP 500');
  });

  it('should handle concurrent API calls', async () => {
    let resolveFirst: (value: any) => void;
    let resolveSecond: (value: any) => void;

    const firstPromise = new Promise((resolve) => {
      resolveFirst = resolve;
    });
    const secondPromise = new Promise((resolve) => {
      resolveSecond = resolve;
    });

    mockFetch
      .mockReturnValueOnce(firstPromise)
      .mockReturnValueOnce(secondPromise);

    const { result } = renderHook(() => useAppointments());

    // Start two concurrent fetches
    const fetch1Promise = act(() => result.current.fetchAppointments());
    const fetch2Promise = act(() => result.current.fetchAppointments());

    // Resolve second fetch first
    await act(async () => {
      resolveSecond!({
        ok: true,
        json: () => Promise.resolve({ success: true, data: [{ id: 'second' }] }),
      });
    });

    // Resolve first fetch second
    await act(async () => {
      resolveFirst!({
        ok: true,
        json: () => Promise.resolve({ success: true, data: [{ id: 'first' }] }),
      });
    });

    await Promise.all([fetch1Promise, fetch2Promise]);

    // Should have the data from the last resolved fetch
    expect(result.current.appointments).toEqual([{ id: 'first' }]);
  });
});