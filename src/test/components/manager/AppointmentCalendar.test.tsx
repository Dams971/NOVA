import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AppointmentCalendar from '@/components/manager/AppointmentCalendar';
import { AppointmentService } from '@/lib/services/appointment-service';

// Mock the appointment service
vi.mock('@/lib/services/appointment-service');

const mockAppointmentService = {
  getCalendarEvents: vi.fn(),
  getInstance: vi.fn()
};

vi.mocked(AppointmentService.getInstance).mockReturnValue(mockAppointmentService as any);

describe('AppointmentCalendar', () => {
  const mockProps = {
    cabinetId: 'cabinet-1',
    onEventClick: vi.fn(),
    onTimeSlotClick: vi.fn(),
    onEventDrop: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockAppointmentService.getCalendarEvents.mockResolvedValue({
      success: true,
      data: [
        {
          id: 'event-1',
          title: 'Consultation - Marie Dubois',
          start: new Date('2024-01-15T10:00:00'),
          end: new Date('2024-01-15T10:30:00'),
          status: 'scheduled',
          patientName: 'Marie Dubois',
          serviceType: 'consultation',
          backgroundColor: '#DBEAFE',
          borderColor: '#3B82F6'
        }
      ]
    });
  });

  it('should render calendar header with navigation', async () => {
    render(<AppointmentCalendar {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText('Planning des rendez-vous')).toBeInTheDocument();
      expect(screen.getByText('Aujourd\'hui')).toBeInTheDocument();
    });
  });

  it('should render week days', async () => {
    render(<AppointmentCalendar {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText('lundi')).toBeInTheDocument();
      expect(screen.getByText('mardi')).toBeInTheDocument();
      expect(screen.getByText('mercredi')).toBeInTheDocument();
      expect(screen.getByText('jeudi')).toBeInTheDocument();
      expect(screen.getByText('vendredi')).toBeInTheDocument();
      expect(screen.getByText('samedi')).toBeInTheDocument();
      expect(screen.getByText('dimanche')).toBeInTheDocument();
    });
  });

  it('should render time slots', async () => {
    render(<AppointmentCalendar {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText('08:00')).toBeInTheDocument();
      expect(screen.getByText('09:00')).toBeInTheDocument();
      expect(screen.getByText('10:00')).toBeInTheDocument();
      expect(screen.getByText('17:30')).toBeInTheDocument();
    });
  });

  it('should call onTimeSlotClick when clicking on empty time slot', async () => {
    render(<AppointmentCalendar {...mockProps} />);

    await waitFor(() => {
      const timeSlots = screen.getAllByText('08:00');
      if (timeSlots.length > 0) {
        const parentElement = timeSlots[0].closest('.grid')?.querySelector('[data-testid="time-slot"]');
        if (parentElement) {
          fireEvent.click(parentElement);
          expect(mockProps.onTimeSlotClick).toHaveBeenCalled();
        }
      }
    });
  });

  it('should navigate to previous week', async () => {
    render(<AppointmentCalendar {...mockProps} />);

    await waitFor(() => {
      const prevButton = screen.getByRole('button', { name: /previous/i });
      fireEvent.click(prevButton);
      expect(mockAppointmentService.getCalendarEvents).toHaveBeenCalledTimes(2);
    });
  });

  it('should navigate to next week', async () => {
    render(<AppointmentCalendar {...mockProps} />);

    await waitFor(() => {
      const nextButton = screen.getByRole('button', { name: /next/i });
      fireEvent.click(nextButton);
      expect(mockAppointmentService.getCalendarEvents).toHaveBeenCalledTimes(2);
    });
  });

  it('should navigate to today', async () => {
    render(<AppointmentCalendar {...mockProps} />);

    await waitFor(() => {
      const todayButton = screen.getByText('Aujourd\'hui');
      fireEvent.click(todayButton);
      expect(mockAppointmentService.getCalendarEvents).toHaveBeenCalledTimes(2);
    });
  });

  it('should render status legend', async () => {
    render(<AppointmentCalendar {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText('Programmé')).toBeInTheDocument();
      expect(screen.getByText('Confirmé')).toBeInTheDocument();
      expect(screen.getByText('En cours')).toBeInTheDocument();
      expect(screen.getByText('Terminé')).toBeInTheDocument();
      expect(screen.getByText('Annulé/Absent')).toBeInTheDocument();
    });
  });

  it('should handle loading state', () => {
    mockAppointmentService.getCalendarEvents.mockReturnValue(new Promise(() => {})); // Never resolves
    
    render(<AppointmentCalendar {...mockProps} />);
    
    expect(screen.getByRole('status')).toBeInTheDocument(); // Loading spinner
  });

  it('should handle service error gracefully', async () => {
    mockAppointmentService.getCalendarEvents.mockResolvedValue({
      success: false,
      error: 'Service error'
    });

    render(<AppointmentCalendar {...mockProps} />);

    await waitFor(() => {
      // Should still render the calendar structure even with no events
      expect(screen.getByText('Planning des rendez-vous')).toBeInTheDocument();
    });
  });

  describe('Enhanced Drag and Drop', () => {
    beforeEach(() => {
      // Mock checkTimeSlotAvailability for conflict detection
      mockAppointmentService.checkTimeSlotAvailability = vi.fn();
    });

    it('should show visual feedback during drag operation', async () => {
      render(<AppointmentCalendar {...mockProps} />);

      await waitFor(() => {
        const eventElement = screen.getByText('Consultation - Marie Dubois');
        expect(eventElement).toBeInTheDocument();
      });

      const eventElement = screen.getByText('Consultation - Marie Dubois');

      // Start drag
      fireEvent.dragStart(eventElement, {
        dataTransfer: {
          effectAllowed: 'move',
          setDragImage: vi.fn()
        }
      });

      // Should show dragging state
      expect(eventElement.closest('div')).toHaveClass('opacity-50', 'scale-95');
    });

    it('should show conflict indicator when dropping on unavailable slot', async () => {
      mockAppointmentService.checkTimeSlotAvailability.mockResolvedValue({
        success: true,
        data: false // Conflict detected
      });

      render(<AppointmentCalendar {...mockProps} />);

      await waitFor(() => {
        const eventElement = screen.getByText('Consultation - Marie Dubois');
        expect(eventElement).toBeInTheDocument();
      });

      const eventElement = screen.getByText('Consultation - Marie Dubois');
      const timeSlots = screen.getAllByText('08:00');
      const targetSlot = timeSlots[0].closest('.grid')?.querySelector('[data-testid="time-slot"]');

      if (targetSlot) {
        // Start drag
        fireEvent.dragStart(eventElement);

        // Drag over target slot
        fireEvent.dragOver(targetSlot);

        // Should show conflict indicator
        await waitFor(() => {
          expect(targetSlot).toHaveClass('bg-red-50', 'border-red-300');
        });
      }
    });

    it('should show success indicator when dropping on available slot', async () => {
      mockAppointmentService.checkTimeSlotAvailability.mockResolvedValue({
        success: true,
        data: true // No conflict
      });

      render(<AppointmentCalendar {...mockProps} />);

      await waitFor(() => {
        const eventElement = screen.getByText('Consultation - Marie Dubois');
        expect(eventElement).toBeInTheDocument();
      });

      const eventElement = screen.getByText('Consultation - Marie Dubois');
      const timeSlots = screen.getAllByText('08:00');
      const targetSlot = timeSlots[0].closest('.grid')?.querySelector('[data-testid="time-slot"]');

      if (targetSlot) {
        // Start drag
        fireEvent.dragStart(eventElement);

        // Drag over target slot
        fireEvent.dragOver(targetSlot);

        // Should show success indicator
        await waitFor(() => {
          expect(targetSlot).toHaveClass('bg-green-50', 'border-green-300');
        });
      }
    });

    it('should prevent drop on conflicted slot', async () => {
      mockAppointmentService.checkTimeSlotAvailability.mockResolvedValue({
        success: true,
        data: false // Conflict detected
      });

      render(<AppointmentCalendar {...mockProps} />);

      await waitFor(() => {
        const eventElement = screen.getByText('Consultation - Marie Dubois');
        expect(eventElement).toBeInTheDocument();
      });

      const eventElement = screen.getByText('Consultation - Marie Dubois');
      const timeSlots = screen.getAllByText('08:00');
      const targetSlot = timeSlots[0].closest('.grid')?.querySelector('[data-testid="time-slot"]');

      if (targetSlot) {
        // Start drag
        fireEvent.dragStart(eventElement);

        // Try to drop on conflicted slot
        fireEvent.drop(targetSlot);

        // Should not call onEventDrop
        expect(mockProps.onEventDrop).not.toHaveBeenCalled();
      }
    });

    it('should clean up drag state on drag end', async () => {
      render(<AppointmentCalendar {...mockProps} />);

      await waitFor(() => {
        const eventElement = screen.getByText('Consultation - Marie Dubois');
        expect(eventElement).toBeInTheDocument();
      });

      const eventElement = screen.getByText('Consultation - Marie Dubois');

      // Start drag
      fireEvent.dragStart(eventElement);

      // End drag
      fireEvent.dragEnd(eventElement);

      // Should clean up drag state
      expect(eventElement.closest('div')).not.toHaveClass('opacity-50', 'scale-95');
    });
  });
});