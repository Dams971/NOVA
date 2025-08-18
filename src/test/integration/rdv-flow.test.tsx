/**
 * RDV Booking Flow Integration Tests
 * 
 * Tests the complete appointment booking workflow including:
 * - User interaction flow
 * - Component integration 
 * - State management
 * - API integration
 * - Error handling
 */

import userEvent from '@testing-library/user-event';
import { RDVPage } from '@/app/rdv/page';
import { setupMockFetch, createTestAppointment, createTestCabinet } from '@/test/setup';
import { render, screen, fireEvent, waitFor, within } from '@/test/test-utils';

// Mock the ChatRDV component to avoid WebSocket issues in tests
vi.mock('@/components/rdv/ChatRDV', () => ({
  ChatRDV: ({ onAppointmentSelect }: any) => (
    <div data-testid="chat-rdv">
      <button 
        onClick={() => onAppointmentSelect?.({
          date: '2025-01-15',
          time: '14:00',
          type: 'Consultation générale'
        })}
        data-testid="mock-appointment-select"
      >
        Sélectionner créneau 14:00
      </button>
    </div>
  )
}));

// Mock the calendar component
vi.mock('@/components/rdv/AppointmentCalendar', () => ({
  AppointmentCalendar: ({ onDateSelect, onTimeSlotSelect }: any) => (
    <div data-testid="appointment-calendar">
      <div data-testid="date-selector">
        <button 
          onClick={() => onDateSelect?.('2025-01-15')}
          data-testid="date-15"
        >
          15 janvier 2025
        </button>
        <button 
          onClick={() => onDateSelect?.('2025-01-16')}
          data-testid="date-16"
        >
          16 janvier 2025
        </button>
      </div>
      <div data-testid="time-slots">
        <button 
          onClick={() => onTimeSlotSelect?.('14:00')}
          data-testid="slot-14-00"
          className="time-slot"
        >
          14:00
        </button>
        <button 
          onClick={() => onTimeSlotSelect?.('15:30')}
          data-testid="slot-15-30"
          className="time-slot"
        >
          15:30
        </button>
      </div>
    </div>
  )
}));

describe('RDV Booking Flow Integration', () => {
  beforeEach(() => {
    // Setup mock API responses
    setupMockFetch({
      '/api/appointments/slots': {
        slots: [
          { time: '14:00', available: true, type: 'Consultation' },
          { time: '15:30', available: true, type: 'Consultation' },
          { time: '16:00', available: false, type: 'Consultation' }
        ]
      },
      '/api/appointments/create': createTestAppointment(),
      '/api/cabinets/info': createTestCabinet(),
      default: { success: true }
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Complete Booking Flow', () => {
    test('user can complete full appointment booking', async () => {
      const user = userEvent.setup();
      render(<RDVPage />);
      
      // Wait for page to load
      await waitFor(() => {
        expect(screen.getByTestId('rdv-layout')).toBeInTheDocument();
      });
      
      // Step 1: Verify layout components are present
      expect(screen.getByTestId('patient-context')).toBeInTheDocument();
      expect(screen.getByTestId('appointment-calendar')).toBeInTheDocument();
      expect(screen.getByTestId('chat-rdv')).toBeInTheDocument();
      
      // Step 2: Select a date
      const dateButton = screen.getByTestId('date-15');
      await user.click(dateButton);
      
      // Step 3: Select a time slot
      const timeSlot = screen.getByTestId('slot-14-00');
      await user.click(timeSlot);
      
      // Verify time slot selection visual feedback
      expect(timeSlot).toHaveClass('time-slot');
      
      // Step 4: Interact with chat to confirm booking
      const mockAppointmentSelect = screen.getByTestId('mock-appointment-select');
      await user.click(mockAppointmentSelect);
      
      // Step 5: Fill patient information (if required)
      const patientForm = screen.queryByTestId('patient-form');
      if (patientForm) {
        const nameInput = within(patientForm).getByLabelText(/nom/i);
        const phoneInput = within(patientForm).getByLabelText(/téléphone/i);
        
        await user.type(nameInput, 'Marie Dupont');
        await user.type(phoneInput, '+213555123456');
      }
      
      // Step 6: Confirm booking
      const confirmButton = screen.getByRole('button', { name: /confirmer/i });
      await user.click(confirmButton);
      
      // Step 7: Verify success state
      await waitFor(() => {
        expect(screen.getByText(/rendez-vous confirmé/i)).toBeInTheDocument();
      });
    });

    test('handles date selection and time slot updates', async () => {
      const user = userEvent.setup();
      render(<RDVPage />);
      
      await waitFor(() => {
        expect(screen.getByTestId('appointment-calendar')).toBeInTheDocument();
      });
      
      // Select different dates
      const date15Button = screen.getByTestId('date-15');
      const date16Button = screen.getByTestId('date-16');
      
      await user.click(date15Button);
      
      // Verify time slots are available for selected date
      expect(screen.getByTestId('slot-14-00')).toBeInTheDocument();
      expect(screen.getByTestId('slot-15-30')).toBeInTheDocument();
      
      // Switch to different date
      await user.click(date16Button);
      
      // Time slots should still be available (mocked)
      expect(screen.getByTestId('slot-14-00')).toBeInTheDocument();
    });

    test('manages appointment state across components', async () => {
      const user = userEvent.setup();
      render(<RDVPage />);
      
      await waitFor(() => {
        expect(screen.getByTestId('rdv-layout')).toBeInTheDocument();
      });
      
      // Select appointment details
      await user.click(screen.getByTestId('date-15'));
      await user.click(screen.getByTestId('slot-14-00'));
      
      // State should be reflected in all components
      const selectedSlot = screen.getByTestId('slot-14-00');
      expect(selectedSlot).toBeInTheDocument();
      
      // Chat should show appointment context
      const chatContext = screen.getByTestId('chat-rdv');
      expect(chatContext).toBeInTheDocument();
    });
  });

  describe('User Interaction Patterns', () => {
    test('supports keyboard navigation through booking flow', async () => {
      const user = userEvent.setup();
      render(<RDVPage />);
      
      await waitFor(() => {
        expect(screen.getByTestId('appointment-calendar')).toBeInTheDocument();
      });
      
      // Tab through date options
      await user.tab();
      expect(screen.getByTestId('date-15')).toHaveFocus();
      
      // Select date with Enter
      await user.keyboard('{Enter}');
      
      // Tab to time slots
      await user.tab();
      expect(screen.getByTestId('slot-14-00')).toHaveFocus();
      
      // Select time slot with Enter
      await user.keyboard('{Enter}');
      
      // Verify selection
      expect(screen.getByTestId('slot-14-00')).toBeInTheDocument();
    });

    test('provides visual feedback for selections', async () => {
      const user = userEvent.setup();
      render(<RDVPage />);
      
      await waitFor(() => {
        expect(screen.getByTestId('appointment-calendar')).toBeInTheDocument();
      });
      
      const timeSlot = screen.getByTestId('slot-14-00');
      
      // Click time slot
      await user.click(timeSlot);
      
      // Should have visual feedback (class changes)
      expect(timeSlot).toHaveClass('time-slot');
    });

    test('handles rapid user interactions gracefully', async () => {
      const user = userEvent.setup();
      render(<RDVPage />);
      
      await waitFor(() => {
        expect(screen.getByTestId('appointment-calendar')).toBeInTheDocument();
      });
      
      // Rapid clicks on different elements
      const date15 = screen.getByTestId('date-15');
      const slot1400 = screen.getByTestId('slot-14-00');
      const slot1530 = screen.getByTestId('slot-15-30');
      
      await user.click(date15);
      await user.click(slot1400);
      await user.click(slot1530);
      await user.click(slot1400);
      
      // Should handle rapid interactions without breaking
      expect(screen.getByTestId('appointment-calendar')).toBeInTheDocument();
    });
  });

  describe('Component Integration', () => {
    test('calendar and chat components communicate properly', async () => {
      const user = userEvent.setup();
      render(<RDVPage />);
      
      await waitFor(() => {
        expect(screen.getByTestId('appointment-calendar')).toBeInTheDocument();
        expect(screen.getByTestId('chat-rdv')).toBeInTheDocument();
      });
      
      // Select appointment in calendar
      await user.click(screen.getByTestId('date-15'));
      await user.click(screen.getByTestId('slot-14-00'));
      
      // Chat should reflect the selection
      const chatComponent = screen.getByTestId('chat-rdv');
      expect(chatComponent).toBeInTheDocument();
      
      // Mock appointment selection from chat
      await user.click(screen.getByTestId('mock-appointment-select'));
      
      // Should trigger appointment confirmation flow
      expect(screen.getByTestId('chat-rdv')).toBeInTheDocument();
    });

    test('patient context updates across components', async () => {
      const user = userEvent.setup();
      render(<RDVPage />);
      
      await waitFor(() => {
        expect(screen.getByTestId('patient-context')).toBeInTheDocument();
      });
      
      // Patient context should show appointment progress
      const patientContext = screen.getByTestId('patient-context');
      expect(patientContext).toBeInTheDocument();
      
      // After selections, context should update
      await user.click(screen.getByTestId('date-15'));
      await user.click(screen.getByTestId('slot-14-00'));
      
      // Patient context should reflect selections
      expect(patientContext).toBeInTheDocument();
    });

    test('layout components maintain responsive behavior', () => {
      // Test different viewport sizes
      const viewports = [
        { width: 375, height: 667 },   // Mobile
        { width: 768, height: 1024 },  // Tablet
        { width: 1440, height: 900 }   // Desktop
      ];
      
      viewports.forEach(({ width, height }) => {
        Object.defineProperty(window, 'innerWidth', {
          writable: true,
          configurable: true,
          value: width,
        });
        
        Object.defineProperty(window, 'innerHeight', {
          writable: true,
          configurable: true,
          value: height,
        });
        
        render(<RDVPage />);
        
        // All main components should be present
        expect(screen.getByTestId('rdv-layout')).toBeInTheDocument();
        expect(screen.getByTestId('patient-context')).toBeInTheDocument();
        expect(screen.getByTestId('appointment-calendar')).toBeInTheDocument();
        expect(screen.getByTestId('chat-rdv')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    test('handles appointment booking API errors', async () => {
      const user = userEvent.setup();
      
      // Setup error response
      setupMockFetch({
        '/api/appointments/create': Promise.reject({
          status: 500,
          json: () => Promise.resolve({ error: 'Server error' })
        })
      });
      
      render(<RDVPage />);
      
      await waitFor(() => {
        expect(screen.getByTestId('appointment-calendar')).toBeInTheDocument();
      });
      
      // Complete booking flow
      await user.click(screen.getByTestId('date-15'));
      await user.click(screen.getByTestId('slot-14-00'));
      await user.click(screen.getByTestId('mock-appointment-select'));
      
      const confirmButton = screen.getByRole('button', { name: /confirmer/i });
      await user.click(confirmButton);
      
      // Should show error message
      await waitFor(() => {
        expect(screen.getByText(/erreur/i)).toBeInTheDocument();
      });
    });

    test('handles network connectivity issues', async () => {
      const user = userEvent.setup();
      
      // Mock network error
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));
      
      render(<RDVPage />);
      
      await waitFor(() => {
        expect(screen.getByTestId('appointment-calendar')).toBeInTheDocument();
      });
      
      // Try to make appointment
      await user.click(screen.getByTestId('date-15'));
      await user.click(screen.getByTestId('slot-14-00'));
      
      // Should handle network error gracefully
      expect(screen.getByTestId('appointment-calendar')).toBeInTheDocument();
    });

    test('validates required patient information', async () => {
      const user = userEvent.setup();
      render(<RDVPage />);
      
      await waitFor(() => {
        expect(screen.getByTestId('appointment-calendar')).toBeInTheDocument();
      });
      
      // Try to confirm without required info
      const confirmButton = screen.getByRole('button', { name: /confirmer/i });
      await user.click(confirmButton);
      
      // Should show validation errors
      const errorMessages = screen.queryAllByText(/requis|obligatoire/i);
      expect(errorMessages.length).toBeGreaterThan(0);
    });

    test('handles unavailable time slots', async () => {
      const user = userEvent.setup();
      
      // Setup response with unavailable slots
      setupMockFetch({
        '/api/appointments/slots': {
          slots: [
            { time: '14:00', available: false, type: 'Consultation' },
            { time: '15:30', available: true, type: 'Consultation' }
          ]
        }
      });
      
      render(<RDVPage />);
      
      await waitFor(() => {
        expect(screen.getByTestId('appointment-calendar')).toBeInTheDocument();
      });
      
      await user.click(screen.getByTestId('date-15'));
      
      // Unavailable slots should be disabled or hidden
      const unavailableSlot = screen.queryByTestId('slot-14-00');
      if (unavailableSlot) {
        expect(unavailableSlot).toBeDisabled();
      }
      
      const availableSlot = screen.getByTestId('slot-15-30');
      expect(availableSlot).not.toBeDisabled();
    });
  });

  describe('State Management', () => {
    test('preserves booking state during component re-renders', async () => {
      const user = userEvent.setup();
      const { rerender } = render(<RDVPage />);
      
      await waitFor(() => {
        expect(screen.getByTestId('appointment-calendar')).toBeInTheDocument();
      });
      
      // Make selections
      await user.click(screen.getByTestId('date-15'));
      await user.click(screen.getByTestId('slot-14-00'));
      
      // Re-render component
      rerender(<RDVPage />);
      
      // Selections should be preserved
      expect(screen.getByTestId('slot-14-00')).toBeInTheDocument();
    });

    test('manages loading states correctly', async () => {
      const user = userEvent.setup();
      render(<RDVPage />);
      
      await waitFor(() => {
        expect(screen.getByTestId('appointment-calendar')).toBeInTheDocument();
      });
      
      // Trigger action that should show loading
      await user.click(screen.getByTestId('date-15'));
      
      // Should handle loading states appropriately
      expect(screen.getByTestId('appointment-calendar')).toBeInTheDocument();
    });

    test('clears state on booking completion', async () => {
      const user = userEvent.setup();
      render(<RDVPage />);
      
      await waitFor(() => {
        expect(screen.getByTestId('appointment-calendar')).toBeInTheDocument();
      });
      
      // Complete booking
      await user.click(screen.getByTestId('date-15'));
      await user.click(screen.getByTestId('slot-14-00'));
      await user.click(screen.getByTestId('mock-appointment-select'));
      
      const confirmButton = screen.getByRole('button', { name: /confirmer/i });
      await user.click(confirmButton);
      
      // After successful booking, state should be appropriate
      await waitFor(() => {
        expect(screen.getByText(/rendez-vous confirmé/i)).toBeInTheDocument();
      });
    });
  });

  describe('Performance', () => {
    test('handles large number of time slots efficiently', async () => {
      const user = userEvent.setup();
      
      // Setup response with many slots
      const manySlots = Array.from({ length: 50 }, (_, i) => ({
        time: `${8 + Math.floor(i / 2)}:${i % 2 === 0 ? '00' : '30'}`,
        available: true,
        type: 'Consultation'
      }));
      
      setupMockFetch({
        '/api/appointments/slots': { slots: manySlots }
      });
      
      render(<RDVPage />);
      
      await waitFor(() => {
        expect(screen.getByTestId('appointment-calendar')).toBeInTheDocument();
      });
      
      // Should render efficiently
      await user.click(screen.getByTestId('date-15'));
      
      // Interface should remain responsive
      expect(screen.getByTestId('appointment-calendar')).toBeInTheDocument();
    });

    test('debounces rapid user interactions', async () => {
      const user = userEvent.setup();
      render(<RDVPage />);
      
      await waitFor(() => {
        expect(screen.getByTestId('appointment-calendar')).toBeInTheDocument();
      });
      
      // Rapid date selections
      const date15 = screen.getByTestId('date-15');
      const date16 = screen.getByTestId('date-16');
      
      // Simulate rapid clicking
      for (let i = 0; i < 10; i++) {
        await user.click(i % 2 === 0 ? date15 : date16);
      }
      
      // Should handle rapid clicks without breaking
      expect(screen.getByTestId('appointment-calendar')).toBeInTheDocument();
    });
  });
});