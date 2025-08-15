import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import PatientManagement from '@/components/manager/PatientManagement';
import { PatientService } from '@/lib/services/patient-service';

// Mock the patient service
vi.mock('@/lib/services/patient-service');

const mockPatientService = {
  getPatients: vi.fn(),
  deletePatient: vi.fn(),
  getInstance: vi.fn()
};

vi.mocked(PatientService.getInstance).mockReturnValue(mockPatientService as any);

// Mock child components
vi.mock('@/components/manager/PatientList', () => ({
  default: ({ patients, onPatientSelect, onPatientEdit, onPatientDelete }: any) => (
    <div data-testid="patient-list">
      {patients.map((patient: any) => (
        <div key={patient.id} data-testid={`patient-${patient.id}`}>
          <span>{patient.firstName} {patient.lastName}</span>
          <button onClick={() => onPatientSelect(patient)}>Select</button>
          <button onClick={() => onPatientEdit(patient)}>Edit</button>
          <button onClick={() => onPatientDelete(patient.id)}>Delete</button>
        </div>
      ))}
    </div>
  )
}));

vi.mock('@/components/manager/PatientDetail', () => ({
  default: ({ patient, onEdit, onClose }: any) => (
    <div data-testid="patient-detail">
      <h2>{patient.firstName} {patient.lastName}</h2>
      <button onClick={onEdit}>Edit Patient</button>
      <button onClick={onClose}>Close</button>
    </div>
  )
}));

vi.mock('@/components/manager/PatientForm', () => ({
  default: ({ patient, onSave, onCancel }: any) => (
    <div data-testid="patient-form">
      <h2>{patient ? 'Edit Patient' : 'New Patient'}</h2>
      <button onClick={() => onSave({ id: 'new-patient', firstName: 'New', lastName: 'Patient' })}>
        Save
      </button>
      <button onClick={onCancel}>Cancel</button>
    </div>
  )
}));

vi.mock('@/components/manager/PatientFiltersPanel', () => ({
  default: ({ onFiltersChange, onClose }: any) => (
    <div data-testid="filters-panel">
      <button onClick={() => onFiltersChange({ isActive: false })}>Apply Filters</button>
      <button onClick={onClose}>Close Filters</button>
    </div>
  )
}));

describe('PatientManagement', () => {
  const mockPatients = [
    {
      id: 'patient-1',
      firstName: 'Marie',
      lastName: 'Dubois',
      email: 'marie@example.com',
      phone: '+33123456789',
      isActive: true,
      totalVisits: 5,
      createdAt: new Date('2024-01-01')
    },
    {
      id: 'patient-2',
      firstName: 'Pierre',
      lastName: 'Martin',
      email: 'pierre@example.com',
      phone: '+33987654321',
      isActive: true,
      totalVisits: 3,
      createdAt: new Date('2024-01-15')
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockPatientService.getPatients.mockResolvedValue({
      success: true,
      data: {
        patients: mockPatients,
        total: 2,
        hasMore: false
      }
    });
  });

  it('should render patient management interface', async () => {
    render(<PatientManagement cabinetId="cabinet-1" />);

    expect(screen.getByText('Gestion des Patients')).toBeInTheDocument();
    expect(screen.getByText('Nouveau Patient')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Rechercher par nom, email, téléphone...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId('patient-list')).toBeInTheDocument();
    });
  });

  it('should load and display patients on mount', async () => {
    render(<PatientManagement cabinetId="cabinet-1" />);

    await waitFor(() => {
      expect(mockPatientService.getPatients).toHaveBeenCalledWith({
        cabinetId: 'cabinet-1',
        search: '',
        isActive: true,
        limit: 20,
        offset: 0
      });
    });

    await waitFor(() => {
      expect(screen.getByTestId('patient-patient-1')).toBeInTheDocument();
      expect(screen.getByTestId('patient-patient-2')).toBeInTheDocument();
    });
  });

  it('should display patient statistics', async () => {
    render(<PatientManagement cabinetId="cabinet-1" />);

    await waitFor(() => {
      expect(screen.getByText('2')).toBeInTheDocument(); // Total
      expect(screen.getByText('Total')).toBeInTheDocument();
      expect(screen.getByText('Actifs')).toBeInTheDocument();
    });
  });

  it('should handle search input', async () => {
    render(<PatientManagement cabinetId="cabinet-1" />);

    const searchInput = screen.getByPlaceholderText('Rechercher par nom, email, téléphone...');
    fireEvent.change(searchInput, { target: { value: 'Marie' } });

    await waitFor(() => {
      expect(mockPatientService.getPatients).toHaveBeenCalledWith({
        cabinetId: 'cabinet-1',
        search: 'Marie',
        isActive: true,
        limit: 20,
        offset: 0
      });
    });
  });

  it('should toggle filters panel', async () => {
    render(<PatientManagement cabinetId="cabinet-1" />);

    const filtersButton = screen.getByText('Filtres');
    fireEvent.click(filtersButton);

    await waitFor(() => {
      expect(screen.getByTestId('filters-panel')).toBeInTheDocument();
    });

    const closeFiltersButton = screen.getByText('Close Filters');
    fireEvent.click(closeFiltersButton);

    await waitFor(() => {
      expect(screen.queryByTestId('filters-panel')).not.toBeInTheDocument();
    });
  });

  it('should apply filters from filters panel', async () => {
    render(<PatientManagement cabinetId="cabinet-1" />);

    // Open filters
    fireEvent.click(screen.getByText('Filtres'));

    await waitFor(() => {
      expect(screen.getByTestId('filters-panel')).toBeInTheDocument();
    });

    // Apply filters
    fireEvent.click(screen.getByText('Apply Filters'));

    await waitFor(() => {
      expect(mockPatientService.getPatients).toHaveBeenCalledWith({
        cabinetId: 'cabinet-1',
        search: '',
        isActive: false,
        limit: 20,
        offset: 0
      });
    });
  });

  it('should open new patient form', async () => {
    render(<PatientManagement cabinetId="cabinet-1" />);

    fireEvent.click(screen.getByText('Nouveau Patient'));

    await waitFor(() => {
      expect(screen.getByTestId('patient-form')).toBeInTheDocument();
      expect(screen.getByText('New Patient')).toBeInTheDocument();
    });
  });

  it('should handle patient selection', async () => {
    render(<PatientManagement cabinetId="cabinet-1" />);

    await waitFor(() => {
      expect(screen.getByTestId('patient-patient-1')).toBeInTheDocument();
    });

    const selectButton = screen.getAllByText('Select')[0];
    fireEvent.click(selectButton);

    await waitFor(() => {
      expect(screen.getByTestId('patient-detail')).toBeInTheDocument();
      expect(screen.getByText('Marie Dubois')).toBeInTheDocument();
    });
  });

  it('should handle patient editing', async () => {
    render(<PatientManagement cabinetId="cabinet-1" />);

    await waitFor(() => {
      expect(screen.getByTestId('patient-patient-1')).toBeInTheDocument();
    });

    const editButton = screen.getAllByText('Edit')[0];
    fireEvent.click(editButton);

    await waitFor(() => {
      expect(screen.getByTestId('patient-form')).toBeInTheDocument();
      expect(screen.getByText('Edit Patient')).toBeInTheDocument();
    });
  });

  it('should handle patient deletion', async () => {
    mockPatientService.deletePatient.mockResolvedValue({
      success: true,
      data: true
    });

    render(<PatientManagement cabinetId="cabinet-1" />);

    await waitFor(() => {
      expect(screen.getByTestId('patient-patient-1')).toBeInTheDocument();
    });

    const deleteButton = screen.getAllByText('Delete')[0];
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(mockPatientService.deletePatient).toHaveBeenCalledWith('patient-1');
    });
  });

  it('should handle patient form save', async () => {
    render(<PatientManagement cabinetId="cabinet-1" />);

    // Open new patient form
    fireEvent.click(screen.getByText('Nouveau Patient'));

    await waitFor(() => {
      expect(screen.getByTestId('patient-form')).toBeInTheDocument();
    });

    // Save patient
    fireEvent.click(screen.getByText('Save'));

    await waitFor(() => {
      expect(screen.queryByTestId('patient-form')).not.toBeInTheDocument();
      // Should refresh the patient list
      expect(mockPatientService.getPatients).toHaveBeenCalledTimes(2);
    });
  });

  it('should handle patient form cancel', async () => {
    render(<PatientManagement cabinetId="cabinet-1" />);

    // Open new patient form
    fireEvent.click(screen.getByText('Nouveau Patient'));

    await waitFor(() => {
      expect(screen.getByTestId('patient-form')).toBeInTheDocument();
    });

    // Cancel form
    fireEvent.click(screen.getByText('Cancel'));

    await waitFor(() => {
      expect(screen.queryByTestId('patient-form')).not.toBeInTheDocument();
    });
  });

  it('should handle patient detail close', async () => {
    render(<PatientManagement cabinetId="cabinet-1" />);

    await waitFor(() => {
      expect(screen.getByTestId('patient-patient-1')).toBeInTheDocument();
    });

    // Select patient to open detail
    const selectButton = screen.getAllByText('Select')[0];
    fireEvent.click(selectButton);

    await waitFor(() => {
      expect(screen.getByTestId('patient-detail')).toBeInTheDocument();
    });

    // Close detail
    fireEvent.click(screen.getByText('Close'));

    await waitFor(() => {
      expect(screen.queryByTestId('patient-detail')).not.toBeInTheDocument();
    });
  });

  it('should handle service errors gracefully', async () => {
    mockPatientService.getPatients.mockResolvedValue({
      success: false,
      error: 'Service error'
    });

    render(<PatientManagement cabinetId="cabinet-1" />);

    await waitFor(() => {
      expect(screen.getByText('Service error')).toBeInTheDocument();
    });
  });

  it('should handle export button click', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    
    render(<PatientManagement cabinetId="cabinet-1" />);

    fireEvent.click(screen.getByText('Exporter'));

    expect(consoleSpy).toHaveBeenCalledWith('Exporting patients...');
    
    consoleSpy.mockRestore();
  });

  it('should update statistics when patients change', async () => {
    const { rerender } = render(<PatientManagement cabinetId="cabinet-1" />);

    await waitFor(() => {
      expect(screen.getByText('2')).toBeInTheDocument(); // Total count
    });

    // Mock updated patient data
    mockPatientService.getPatients.mockResolvedValue({
      success: true,
      data: {
        patients: [mockPatients[0]], // Only one patient now
        total: 1,
        hasMore: false
      }
    });

    // Trigger a search to reload data
    const searchInput = screen.getByPlaceholderText('Rechercher par nom, email, téléphone...');
    fireEvent.change(searchInput, { target: { value: 'test' } });

    await waitFor(() => {
      expect(screen.getByText('1')).toBeInTheDocument(); // Updated total count
    });
  });
});
