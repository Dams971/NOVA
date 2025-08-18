import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AppointmentForm from '@/components/manager/AppointmentForm';
import { AppointmentStatus, ServiceType } from '@/lib/models/appointment';
import { AppointmentService } from '@/lib/services/appointment-service';

// Mock the appointment service
vi.mock('@/lib/services/appointment-service');

const mockAppointmentService = {
  createAppointment: vi.fn(),
  updateAppointment: vi.fn(),
  getInstance: vi.fn()
};

vi.mocked(AppointmentService.getInstance).mockReturnValue(mockAppointmentService as any);

describe('AppointmentForm', () => {
  const mockProps = {
    cabinetId: 'cabinet-1',
    onSave: vi.fn(),
    onCancel: vi.fn()
  };

  const mockAppointment = {
    id: 'apt-1',
    cabinetId: 'cabinet-1',
    patientId: 'patient-1',
    practitionerId: 'practitioner-1',
    serviceType: ServiceType.CONSULTATION,
    title: 'Consultation - Marie Dubois',
    description: 'Consultation de routine',
    scheduledAt: new Date('2024-01-15T10:00:00'),
    duration: 30,
    status: AppointmentStatus.SCHEDULED,
    notes: 'Patient anxieux',
    price: 50,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render form for creating new appointment', () => {
    render(<AppointmentForm {...mockProps} />);

    expect(screen.getByText('Nouveau rendez-vous')).toBeInTheDocument();
    expect(screen.getByLabelText(/Patient/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Type de service/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Titre/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Date et heure/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Durée/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Créer' })).toBeInTheDocument();
  });

  it('should render form for editing existing appointment', () => {
    render(<AppointmentForm {...mockProps} appointment={mockAppointment} />);

    expect(screen.getByText('Modifier le rendez-vous')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Consultation - Marie Dubois')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Consultation de routine')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Patient anxieux')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Mettre à jour' })).toBeInTheDocument();
  });

  it('should show status field when editing appointment', () => {
    render(<AppointmentForm {...mockProps} appointment={mockAppointment} />);

    expect(screen.getByLabelText(/Statut/)).toBeInTheDocument();
  });

  it('should not show status field when creating new appointment', () => {
    render(<AppointmentForm {...mockProps} />);

    expect(screen.queryByLabelText(/Statut/)).not.toBeInTheDocument();
  });

  it('should update title when patient and service type change', async () => {
    render(<AppointmentForm {...mockProps} />);

    const patientSelect = screen.getByLabelText(/Patient/);
    const serviceSelect = screen.getByLabelText(/Type de service/);
    const titleInput = screen.getByLabelText(/Titre/);

    fireEvent.change(patientSelect, { target: { value: 'patient-1' } });
    fireEvent.change(serviceSelect, { target: { value: ServiceType.CLEANING } });

    await waitFor(() => {
      expect(titleInput).toHaveValue('Nettoyage - Marie Dubois');
    });
  });

  it('should update duration and price when service type changes', async () => {
    render(<AppointmentForm {...mockProps} />);

    const serviceSelect = screen.getByLabelText(/Type de service/);
    const durationInput = screen.getByLabelText(/Durée/);
    const priceInput = screen.getByLabelText(/Prix/);

    fireEvent.change(serviceSelect, { target: { value: ServiceType.CLEANING } });

    await waitFor(() => {
      expect(durationInput).toHaveValue(45); // Cleaning duration
      expect(priceInput).toHaveValue(80); // Cleaning price
    });
  });

  it('should validate required fields', async () => {
    render(<AppointmentForm {...mockProps} />);

    const submitButton = screen.getByRole('button', { name: 'Créer' });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Veuillez sélectionner un patient')).toBeInTheDocument();
      expect(screen.getByText('Le titre est requis')).toBeInTheDocument();
      expect(screen.getByText('La date et l\'heure sont requises')).toBeInTheDocument();
    });
  });

  it('should create new appointment on form submission', async () => {
    const mockCreatedAppointment = { ...mockAppointment, id: 'new-apt-1' };
    mockAppointmentService.createAppointment.mockResolvedValue({
      success: true,
      data: mockCreatedAppointment
    });

    render(<AppointmentForm {...mockProps} />);

    // Fill form
    fireEvent.change(screen.getByLabelText(/Patient/), { target: { value: 'patient-1' } });
    fireEvent.change(screen.getByLabelText(/Type de service/), { target: { value: ServiceType.CONSULTATION } });
    fireEvent.change(screen.getByLabelText(/Titre/), { target: { value: 'Test Consultation' } });
    fireEvent.change(screen.getByLabelText(/Date et heure/), { target: { value: '2024-01-15T10:00' } });

    // Submit form
    fireEvent.click(screen.getByRole('button', { name: 'Créer' }));

    await waitFor(() => {
      expect(mockAppointmentService.createAppointment).toHaveBeenCalledWith({
        cabinetId: 'cabinet-1',
        patientId: 'patient-1',
        serviceType: ServiceType.CONSULTATION,
        title: 'Test Consultation',
        scheduledAt: new Date('2024-01-15T10:00'),
        duration: 30,
        price: 50
      });
      expect(mockProps.onSave).toHaveBeenCalledWith(mockCreatedAppointment);
    });
  });

  it('should update existing appointment on form submission', async () => {
    const mockUpdatedAppointment = { ...mockAppointment, title: 'Updated Title' };
    mockAppointmentService.updateAppointment.mockResolvedValue({
      success: true,
      data: mockUpdatedAppointment
    });

    render(<AppointmentForm {...mockProps} appointment={mockAppointment} />);

    // Update title
    const titleInput = screen.getByLabelText(/Titre/);
    fireEvent.change(titleInput, { target: { value: 'Updated Title' } });

    // Submit form
    fireEvent.click(screen.getByRole('button', { name: 'Mettre à jour' }));

    await waitFor(() => {
      expect(mockAppointmentService.updateAppointment).toHaveBeenCalledWith(
        mockAppointment.id,
        expect.objectContaining({
          title: 'Updated Title'
        })
      );
      expect(mockProps.onSave).toHaveBeenCalledWith(mockUpdatedAppointment);
    });
  });

  it('should handle service errors', async () => {
    mockAppointmentService.createAppointment.mockResolvedValue({
      success: false,
      error: 'Service error'
    });

    render(<AppointmentForm {...mockProps} />);

    // Fill and submit form
    fireEvent.change(screen.getByLabelText(/Patient/), { target: { value: 'patient-1' } });
    fireEvent.change(screen.getByLabelText(/Titre/), { target: { value: 'Test' } });
    fireEvent.change(screen.getByLabelText(/Date et heure/), { target: { value: '2024-01-15T10:00' } });
    fireEvent.click(screen.getByRole('button', { name: 'Créer' }));

    await waitFor(() => {
      expect(screen.getByText('Service error')).toBeInTheDocument();
    });
  });

  it('should call onCancel when cancel button is clicked', () => {
    render(<AppointmentForm {...mockProps} />);

    fireEvent.click(screen.getByRole('button', { name: 'Annuler' }));
    expect(mockProps.onCancel).toHaveBeenCalled();
  });

  it('should call onCancel when close button is clicked', () => {
    render(<AppointmentForm {...mockProps} />);

    fireEvent.click(screen.getByRole('button', { name: /close/i }));
    expect(mockProps.onCancel).toHaveBeenCalled();
  });

  it('should initialize form with initial date and time', () => {
    const initialDate = new Date('2024-01-15');
    const initialTime = '14:30';

    render(
      <AppointmentForm 
        {...mockProps} 
        initialDate={initialDate}
        initialTime={initialTime}
      />
    );

    const dateTimeInput = screen.getByLabelText(/Date et heure/);
    expect(dateTimeInput).toHaveValue('2024-01-15T14:30');
  });

  describe('Enhanced Patient Selection', () => {
    it('should show patient search input', () => {
      render(<AppointmentForm {...mockProps} />);

      const searchInput = screen.getByPlaceholderText(/Rechercher un patient/);
      expect(searchInput).toBeInTheDocument();
    });

    it('should filter patients based on search term', async () => {
      render(<AppointmentForm {...mockProps} />);

      const searchInput = screen.getByPlaceholderText(/Rechercher un patient/);
      fireEvent.change(searchInput, { target: { value: 'Marie' } });

      await waitFor(() => {
        expect(screen.getByText('Marie Dubois')).toBeInTheDocument();
      });
    });

    it('should select patient from dropdown', async () => {
      render(<AppointmentForm {...mockProps} />);

      const searchInput = screen.getByPlaceholderText(/Rechercher un patient/);
      fireEvent.focus(searchInput);

      await waitFor(() => {
        const patientOption = screen.getByText('Marie Dubois');
        fireEvent.click(patientOption);
      });

      expect(searchInput).toHaveValue('Marie Dubois');
    });

    it('should show create new patient option when no results', async () => {
      render(<AppointmentForm {...mockProps} />);

      const searchInput = screen.getByPlaceholderText(/Rechercher un patient/);
      fireEvent.change(searchInput, { target: { value: 'NonExistentPatient' } });

      await waitFor(() => {
        expect(screen.getByText(/Créer un nouveau patient/)).toBeInTheDocument();
      });
    });
  });

  describe('Recurring Appointments', () => {
    it('should show recurring options for new appointments', () => {
      render(<AppointmentForm {...mockProps} />);

      expect(screen.getByText(/Rendez-vous récurrents/)).toBeInTheDocument();
      expect(screen.getByText(/Configurer/)).toBeInTheDocument();
    });

    it('should not show recurring options for existing appointments', () => {
      render(<AppointmentForm {...mockProps} appointment={mockAppointment} />);

      expect(screen.queryByText(/Rendez-vous récurrents/)).not.toBeInTheDocument();
    });

    it('should enable recurring configuration when checkbox is checked', async () => {
      render(<AppointmentForm {...mockProps} />);

      // Click configure button first
      fireEvent.click(screen.getByText(/Configurer/));

      const recurringCheckbox = screen.getByLabelText(/Créer une série de rendez-vous récurrents/);
      fireEvent.click(recurringCheckbox);

      await waitFor(() => {
        expect(screen.getByLabelText(/Fréquence/)).toBeInTheDocument();
        expect(screen.getByLabelText(/Intervalle/)).toBeInTheDocument();
      });
    });

    it('should create multiple appointments when recurring is enabled', async () => {
      const mockCreatedAppointments = [
        { ...mockAppointment, id: 'apt-1', title: 'Test Consultation (1/3)' },
        { ...mockAppointment, id: 'apt-2', title: 'Test Consultation (2/3)' },
        { ...mockAppointment, id: 'apt-3', title: 'Test Consultation (3/3)' }
      ];

      mockAppointmentService.createAppointment
        .mockResolvedValueOnce({ success: true, data: mockCreatedAppointments[0] })
        .mockResolvedValueOnce({ success: true, data: mockCreatedAppointments[1] })
        .mockResolvedValueOnce({ success: true, data: mockCreatedAppointments[2] });

      render(<AppointmentForm {...mockProps} />);

      // Fill form
      fireEvent.change(screen.getByLabelText(/Titre/), { target: { value: 'Test Consultation' } });
      fireEvent.change(screen.getByLabelText(/Date et heure/), { target: { value: '2024-01-15T10:00' } });

      // Enable recurring
      fireEvent.click(screen.getByText(/Configurer/));
      fireEvent.click(screen.getByLabelText(/Créer une série de rendez-vous récurrents/));

      await waitFor(() => {
        const occurrencesInput = screen.getByLabelText(/Nombre d'occurrences/);
        fireEvent.change(occurrencesInput, { target: { value: '3' } });
      });

      // Submit form
      fireEvent.click(screen.getByText(/Créer le rendez-vous/));

      await waitFor(() => {
        expect(mockAppointmentService.createAppointment).toHaveBeenCalledTimes(3);
        expect(mockProps.onSave).toHaveBeenCalledWith(mockCreatedAppointments[2]);
      });
    });

    it('should handle recurring appointment creation errors gracefully', async () => {
      mockAppointmentService.createAppointment
        .mockResolvedValueOnce({ success: true, data: mockAppointment })
        .mockResolvedValueOnce({ success: false, error: 'Creation failed' });

      render(<AppointmentForm {...mockProps} />);

      // Fill form and enable recurring
      fireEvent.change(screen.getByLabelText(/Titre/), { target: { value: 'Test Consultation' } });
      fireEvent.change(screen.getByLabelText(/Date et heure/), { target: { value: '2024-01-15T10:00' } });

      fireEvent.click(screen.getByText(/Configurer/));
      fireEvent.click(screen.getByLabelText(/Créer une série de rendez-vous récurrents/));

      await waitFor(() => {
        const occurrencesInput = screen.getByLabelText(/Nombre d'occurrences/);
        fireEvent.change(occurrencesInput, { target: { value: '2' } });
      });

      fireEvent.click(screen.getByText(/Créer le rendez-vous/));

      await waitFor(() => {
        expect(mockAppointmentService.createAppointment).toHaveBeenCalledTimes(2);
        expect(mockProps.onSave).toHaveBeenCalledWith(mockAppointment); // Should still save the successful one
      });
    });
  });
});