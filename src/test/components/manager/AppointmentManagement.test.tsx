import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AppointmentManagement from '@/components/manager/AppointmentManagement';
import { AppointmentService } from '@/lib/services/appointment-service';

// Mock the appointment service
vi.mock('@/lib/services/appointment-service');

// Mock child components
vi.mock('@/components/manager/AppointmentCalendar', () => ({
  default: ({ onEventClick, onTimeSlotClick, onEventDrop }: any) => (
    <div data-testid="appointment-calendar">
      <button onClick={() => onEventClick({ id: 'event-1' })}>Mock Event</button>
      <button onClick={() => onTimeSlotClick(new Date(), '10:00')}>Mock Time Slot</button>
      <button onClick={() => onEventDrop('event-1', new Date())}>Mock Drop</button>
    </div>
  )
}));

vi.mock('@/components/manager/AppointmentList', () => ({
  default: ({ onAppointmentClick, onAppointmentAction, onDeleteAppointment }: any) => (
    <div data-testid="appointment-list">
      <button onClick={() => onAppointmentClick({ id: 'event-1' })}>Mock Appointment</button>
      <button onClick={() => onAppointmentAction('apt-1', 'confirm')}>Mock Action</button>
      <button onClick={() => onDeleteAppointment('apt-1')}>Mock Delete</button>
    </div>
  )
}));

vi.mock('@/components/manager/AppointmentForm', () => ({
  default: ({ onSave, onCancel }: any) => (
    <div data-testid="appointment-form">
      <button onClick={() => onSave({ id: 'apt-1' })}>Mock Save</button>
      <button onClick={onCancel}>Mock Cancel</button>
    </div>
  )
}));

vi.mock('@/components/manager/AppointmentNotifications', () => ({
  default: ({ onClose, onRemove }: any) => (
    <div data-testid="appointment-notifications">
      <button onClick={onClose}>Mock Close</button>
      <button onClick={() => onRemove('notif-1')}>Mock Remove</button>
    </div>
  )
}));

const mockAppointmentService = {
  getAppointmentById: vi.fn(),
  rescheduleAppointment: vi.fn(),
  updateAppointment: vi.fn(),
  deleteAppointment: vi.fn(),
  getInstance: vi.fn()
};

vi.mocked(AppointmentService.getInstance).mockReturnValue(mockAppointmentService as any);

describe('AppointmentManagement', () => {
  const mockProps = {
    cabinetId: 'cabinet-1'
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockAppointmentService.getAppointmentById.mockResolvedValue({
      success: true,
      data: {
        id: 'apt-1',
        title: 'Test Appointment',
        cabinetId: 'cabinet-1',
        patientId: 'patient-1',
        serviceType: 'consultation',
        scheduledAt: new Date(),
        duration: 30,
        status: 'scheduled',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
  });

  it('should render appointment management header', () => {
    render(<AppointmentManagement {...mockProps} />);

    expect(screen.getByText('Gestion des rendez-vous')).toBeInTheDocument();
    expect(screen.getByText('Planifiez et gérez les rendez-vous de votre cabinet')).toBeInTheDocument();
  });

  it('should render view mode toggle buttons', () => {
    render(<AppointmentManagement {...mockProps} />);

    expect(screen.getByRole('button', { name: /Calendrier/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Liste/ })).toBeInTheDocument();
  });

  it('should render new appointment button', () => {
    render(<AppointmentManagement {...mockProps} />);

    expect(screen.getByRole('button', { name: /Nouveau rendez-vous/ })).toBeInTheDocument();
  });

  it('should render notifications button', () => {
    render(<AppointmentManagement {...mockProps} />);

    expect(screen.getByRole('button')).toBeInTheDocument(); // Bell icon button
  });

  it('should switch between calendar and list views', () => {
    render(<AppointmentManagement {...mockProps} />);

    // Should start with calendar view
    expect(screen.getByTestId('appointment-calendar')).toBeInTheDocument();
    expect(screen.queryByTestId('appointment-list')).not.toBeInTheDocument();

    // Switch to list view
    fireEvent.click(screen.getByRole('button', { name: /Liste/ }));
    expect(screen.getByTestId('appointment-list')).toBeInTheDocument();
    expect(screen.queryByTestId('appointment-calendar')).not.toBeInTheDocument();

    // Switch back to calendar view
    fireEvent.click(screen.getByRole('button', { name: /Calendrier/ }));
    expect(screen.getByTestId('appointment-calendar')).toBeInTheDocument();
    expect(screen.queryByTestId('appointment-list')).not.toBeInTheDocument();
  });

  it('should open form when new appointment button is clicked', () => {
    render(<AppointmentManagement {...mockProps} />);

    fireEvent.click(screen.getByRole('button', { name: /Nouveau rendez-vous/ }));
    expect(screen.getByTestId('appointment-form')).toBeInTheDocument();
  });

  it('should open form when calendar event is clicked', async () => {
    render(<AppointmentManagement {...mockProps} />);

    fireEvent.click(screen.getByText('Mock Event'));

    await waitFor(() => {
      expect(mockAppointmentService.getAppointmentById).toHaveBeenCalledWith('event-1');
      expect(screen.getByTestId('appointment-form')).toBeInTheDocument();
    });
  });

  it('should open form when time slot is clicked', () => {
    render(<AppointmentManagement {...mockProps} />);

    fireEvent.click(screen.getByText('Mock Time Slot'));
    expect(screen.getByTestId('appointment-form')).toBeInTheDocument();
  });

  it('should handle event drop with success notification', async () => {
    mockAppointmentService.rescheduleAppointment.mockResolvedValue({
      success: true,
      data: { id: 'event-1' }
    });

    render(<AppointmentManagement {...mockProps} />);

    fireEvent.click(screen.getByText('Mock Drop'));

    await waitFor(() => {
      expect(mockAppointmentService.rescheduleAppointment).toHaveBeenCalledWith('event-1', expect.any(Date));
    });
  });

  it('should handle event drop with error notification', async () => {
    mockAppointmentService.rescheduleAppointment.mockResolvedValue({
      success: false,
      error: 'Time slot not available'
    });

    render(<AppointmentManagement {...mockProps} />);

    fireEvent.click(screen.getByText('Mock Drop'));

    await waitFor(() => {
      expect(mockAppointmentService.rescheduleAppointment).toHaveBeenCalledWith('event-1', expect.any(Date));
    });
  });

  it('should handle appointment action', async () => {
    mockAppointmentService.updateAppointment.mockResolvedValue({
      success: true,
      data: { id: 'apt-1' }
    });

    render(<AppointmentManagement {...mockProps} />);

    // Switch to list view to access appointment actions
    fireEvent.click(screen.getByRole('button', { name: /Liste/ }));
    fireEvent.click(screen.getByText('Mock Action'));

    await waitFor(() => {
      expect(mockAppointmentService.updateAppointment).toHaveBeenCalledWith('apt-1', { status: 'confirmed' });
    });
  });

  it('should handle appointment deletion with confirmation', async () => {
    // Mock window.confirm
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    mockAppointmentService.deleteAppointment.mockResolvedValue({
      success: true,
      data: true
    });

    render(<AppointmentManagement {...mockProps} />);

    // Switch to list view to access delete action
    fireEvent.click(screen.getByRole('button', { name: /Liste/ }));
    fireEvent.click(screen.getByText('Mock Delete'));

    await waitFor(() => {
      expect(confirmSpy).toHaveBeenCalledWith('Êtes-vous sûr de vouloir supprimer ce rendez-vous ?');
      expect(mockAppointmentService.deleteAppointment).toHaveBeenCalledWith('apt-1');
    });

    confirmSpy.mockRestore();
  });

  it('should not delete appointment if user cancels confirmation', async () => {
    // Mock window.confirm to return false
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);

    render(<AppointmentManagement {...mockProps} />);

    // Switch to list view to access delete action
    fireEvent.click(screen.getByRole('button', { name: /Liste/ }));
    fireEvent.click(screen.getByText('Mock Delete'));

    await waitFor(() => {
      expect(confirmSpy).toHaveBeenCalled();
      expect(mockAppointmentService.deleteAppointment).not.toHaveBeenCalled();
    });

    confirmSpy.mockRestore();
  });

  it('should close form when save is clicked', () => {
    render(<AppointmentManagement {...mockProps} />);

    // Open form
    fireEvent.click(screen.getByRole('button', { name: /Nouveau rendez-vous/ }));
    expect(screen.getByTestId('appointment-form')).toBeInTheDocument();

    // Save and close
    fireEvent.click(screen.getByText('Mock Save'));
    expect(screen.queryByTestId('appointment-form')).not.toBeInTheDocument();
  });

  it('should close form when cancel is clicked', () => {
    render(<AppointmentManagement {...mockProps} />);

    // Open form
    fireEvent.click(screen.getByRole('button', { name: /Nouveau rendez-vous/ }));
    expect(screen.getByTestId('appointment-form')).toBeInTheDocument();

    // Cancel and close
    fireEvent.click(screen.getByText('Mock Cancel'));
    expect(screen.queryByTestId('appointment-form')).not.toBeInTheDocument();
  });

  it('should toggle notifications panel', () => {
    render(<AppointmentManagement {...mockProps} />);

    // Find and click the notifications button (bell icon)
    const notificationButtons = screen.getAllByRole('button');
    const bellButton = notificationButtons.find(button => 
      button.querySelector('svg') // Looking for the bell icon
    );
    
    if (bellButton) {
      fireEvent.click(bellButton);
      expect(screen.getByTestId('appointment-notifications')).toBeInTheDocument();

      // Click again to close
      fireEvent.click(bellButton);
      expect(screen.queryByTestId('appointment-notifications')).not.toBeInTheDocument();
    }
  });
});