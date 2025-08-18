import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import PatientForm from '@/components/manager/PatientForm';
import { Patient, Gender } from '@/lib/models/patient';
import { PatientService } from '@/lib/services/patient-service';

// Mock the patient service
vi.mock('@/lib/services/patient-service');

const mockPatientService = {
  createPatient: vi.fn(),
  updatePatient: vi.fn(),
  getInstance: vi.fn()
};

vi.mocked(PatientService.getInstance).mockReturnValue(mockPatientService as any);

describe('PatientForm', () => {
  const mockProps = {
    cabinetId: 'cabinet-1',
    onSave: vi.fn(),
    onCancel: vi.fn()
  };

  const mockPatient: Patient = {
    id: 'patient-1',
    cabinetId: 'cabinet-1',
    firstName: 'Marie',
    lastName: 'Dubois',
    email: 'marie@example.com',
    phone: '+33123456789',
    dateOfBirth: new Date('1985-03-15'),
    gender: 'female' as Gender,
    address: {
      street: '123 Rue de la Paix',
      city: 'Paris',
      postalCode: '75001',
      country: 'France'
    },
    emergencyContact: {
      name: 'Jean Dubois',
      phone: '+33123456790',
      relationship: 'Époux'
    },
    preferences: {
      preferredLanguage: 'fr',
      communicationMethod: 'email',
      reminderEnabled: true,
      reminderHours: [24, 2]
    },
    medicalHistory: [],
    isActive: true,
    totalVisits: 5,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render new patient form', () => {
    render(<PatientForm {...mockProps} />);

    expect(screen.getByText('Nouveau patient')).toBeInTheDocument();
    expect(screen.getByLabelText(/Prénom/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Nom/)).toBeInTheDocument();
    expect(screen.getByText('Créer le patient')).toBeInTheDocument();
  });

  it('should render edit patient form with existing data', () => {
    render(<PatientForm {...mockProps} patient={mockPatient} />);

    expect(screen.getByText('Modifier le patient')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Marie')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Dubois')).toBeInTheDocument();
    expect(screen.getByDisplayValue('marie@example.com')).toBeInTheDocument();
    expect(screen.getByText('Mettre à jour')).toBeInTheDocument();
  });

  it('should navigate between tabs', () => {
    render(<PatientForm {...mockProps} />);

    // Should start on basic tab
    expect(screen.getByLabelText(/Prénom/)).toBeInTheDocument();

    // Click on address tab
    fireEvent.click(screen.getByText('Adresse'));
    expect(screen.getByLabelText(/Adresse/)).toBeInTheDocument();

    // Click on emergency contact tab
    fireEvent.click(screen.getByText('Contact d\'urgence'));
    expect(screen.getByLabelText(/Nom du contact d'urgence/)).toBeInTheDocument();

    // Click on preferences tab
    fireEvent.click(screen.getByText('Préférences'));
    expect(screen.getByLabelText(/Langue préférée/)).toBeInTheDocument();
  });

  it('should validate required fields', async () => {
    render(<PatientForm {...mockProps} />);

    // Try to submit without required fields
    fireEvent.click(screen.getByText('Créer le patient'));

    await waitFor(() => {
      expect(screen.getByText('Le prénom est requis')).toBeInTheDocument();
      expect(screen.getByText('Le nom est requis')).toBeInTheDocument();
      expect(screen.getByText('La date de naissance est requise')).toBeInTheDocument();
    });

    expect(mockPatientService.createPatient).not.toHaveBeenCalled();
  });

  it('should validate email format', async () => {
    render(<PatientForm {...mockProps} />);

    // Fill required fields
    fireEvent.change(screen.getByLabelText(/Prénom/), { target: { value: 'Test' } });
    fireEvent.change(screen.getByLabelText(/Nom/), { target: { value: 'Patient' } });
    fireEvent.change(screen.getByLabelText(/Date de naissance/), { target: { value: '1990-01-01' } });
    
    // Enter invalid email
    fireEvent.change(screen.getByLabelText(/Email/), { target: { value: 'invalid-email' } });

    fireEvent.click(screen.getByText('Créer le patient'));

    await waitFor(() => {
      expect(screen.getByText('Format d\'email invalide')).toBeInTheDocument();
    });
  });

  it('should validate phone format', async () => {
    render(<PatientForm {...mockProps} />);

    // Fill required fields
    fireEvent.change(screen.getByLabelText(/Prénom/), { target: { value: 'Test' } });
    fireEvent.change(screen.getByLabelText(/Nom/), { target: { value: 'Patient' } });
    fireEvent.change(screen.getByLabelText(/Date de naissance/), { target: { value: '1990-01-01' } });
    
    // Enter invalid phone
    fireEvent.change(screen.getByLabelText(/Téléphone/), { target: { value: '123' } });

    fireEvent.click(screen.getByText('Créer le patient'));

    await waitFor(() => {
      expect(screen.getByText('Format de téléphone invalide')).toBeInTheDocument();
    });
  });

  it('should validate date of birth', async () => {
    render(<PatientForm {...mockProps} />);

    // Fill required fields
    fireEvent.change(screen.getByLabelText(/Prénom/), { target: { value: 'Test' } });
    fireEvent.change(screen.getByLabelText(/Nom/), { target: { value: 'Patient' } });
    
    // Enter future date
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);
    fireEvent.change(screen.getByLabelText(/Date de naissance/), { 
      target: { value: futureDate.toISOString().split('T')[0] } 
    });

    fireEvent.click(screen.getByText('Créer le patient'));

    await waitFor(() => {
      expect(screen.getByText('La date de naissance ne peut pas être dans le futur')).toBeInTheDocument();
    });
  });

  it('should create new patient successfully', async () => {
    const newPatient = { ...mockPatient, id: 'new-patient' };
    mockPatientService.createPatient.mockResolvedValue({
      success: true,
      data: newPatient
    });

    render(<PatientForm {...mockProps} />);

    // Fill required fields
    fireEvent.change(screen.getByLabelText(/Prénom/), { target: { value: 'Test' } });
    fireEvent.change(screen.getByLabelText(/Nom/), { target: { value: 'Patient' } });
    fireEvent.change(screen.getByLabelText(/Date de naissance/), { target: { value: '1990-01-01' } });
    fireEvent.change(screen.getByLabelText(/Email/), { target: { value: 'test@example.com' } });

    fireEvent.click(screen.getByText('Créer le patient'));

    await waitFor(() => {
      expect(mockPatientService.createPatient).toHaveBeenCalledWith({
        cabinetId: 'cabinet-1',
        firstName: 'Test',
        lastName: 'Patient',
        email: 'test@example.com',
        phone: '',
        dateOfBirth: new Date('1990-01-01'),
        gender: undefined,
        address: undefined,
        emergencyContact: undefined,
        preferences: {
          preferredLanguage: 'fr',
          communicationMethod: 'email',
          reminderEnabled: true,
          reminderHours: [24, 2]
        }
      });
    });

    await waitFor(() => {
      expect(mockProps.onSave).toHaveBeenCalledWith(newPatient);
    });
  });

  it('should update existing patient successfully', async () => {
    const updatedPatient = { ...mockPatient, firstName: 'Updated' };
    mockPatientService.updatePatient.mockResolvedValue({
      success: true,
      data: updatedPatient
    });

    render(<PatientForm {...mockProps} patient={mockPatient} />);

    // Update first name
    fireEvent.change(screen.getByDisplayValue('Marie'), { target: { value: 'Updated' } });

    fireEvent.click(screen.getByText('Mettre à jour'));

    await waitFor(() => {
      expect(mockPatientService.updatePatient).toHaveBeenCalledWith('patient-1', {
        firstName: 'Updated',
        lastName: 'Dubois',
        email: 'marie@example.com',
        phone: '+33123456789',
        dateOfBirth: new Date('1985-03-15'),
        gender: 'female',
        address: {
          street: '123 Rue de la Paix',
          city: 'Paris',
          postalCode: '75001',
          country: 'France'
        },
        emergencyContact: {
          name: 'Jean Dubois',
          phone: '+33123456790',
          relationship: 'Époux'
        },
        preferences: {
          preferredLanguage: 'fr',
          communicationMethod: 'email',
          reminderEnabled: true,
          reminderHours: [24, 2]
        }
      });
    });

    await waitFor(() => {
      expect(mockProps.onSave).toHaveBeenCalledWith(updatedPatient);
    });
  });

  it('should handle service errors', async () => {
    mockPatientService.createPatient.mockResolvedValue({
      success: false,
      error: 'Email already exists'
    });

    render(<PatientForm {...mockProps} />);

    // Fill required fields
    fireEvent.change(screen.getByLabelText(/Prénom/), { target: { value: 'Test' } });
    fireEvent.change(screen.getByLabelText(/Nom/), { target: { value: 'Patient' } });
    fireEvent.change(screen.getByLabelText(/Date de naissance/), { target: { value: '1990-01-01' } });

    fireEvent.click(screen.getByText('Créer le patient'));

    await waitFor(() => {
      expect(screen.getByText('Email already exists')).toBeInTheDocument();
    });

    expect(mockProps.onSave).not.toHaveBeenCalled();
  });

  it('should handle form cancellation', () => {
    render(<PatientForm {...mockProps} />);

    fireEvent.click(screen.getByText('Annuler'));

    expect(mockProps.onCancel).toHaveBeenCalled();
  });

  it('should clear field errors when user starts typing', async () => {
    render(<PatientForm {...mockProps} />);

    // Submit to trigger validation errors
    fireEvent.click(screen.getByText('Créer le patient'));

    await waitFor(() => {
      expect(screen.getByText('Le prénom est requis')).toBeInTheDocument();
    });

    // Start typing in first name field
    fireEvent.change(screen.getByLabelText(/Prénom/), { target: { value: 'T' } });

    await waitFor(() => {
      expect(screen.queryByText('Le prénom est requis')).not.toBeInTheDocument();
    });
  });

  it('should handle address information', () => {
    render(<PatientForm {...mockProps} patient={mockPatient} />);

    // Navigate to address tab
    fireEvent.click(screen.getByText('Adresse'));

    expect(screen.getByDisplayValue('123 Rue de la Paix')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Paris')).toBeInTheDocument();
    expect(screen.getByDisplayValue('75001')).toBeInTheDocument();
    expect(screen.getByDisplayValue('France')).toBeInTheDocument();
  });

  it('should handle emergency contact information', () => {
    render(<PatientForm {...mockProps} patient={mockPatient} />);

    // Navigate to emergency contact tab
    fireEvent.click(screen.getByText('Contact d\'urgence'));

    expect(screen.getByDisplayValue('Jean Dubois')).toBeInTheDocument();
    expect(screen.getByDisplayValue('+33123456790')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Époux')).toBeInTheDocument();
  });

  it('should handle preferences', () => {
    render(<PatientForm {...mockProps} patient={mockPatient} />);

    // Navigate to preferences tab
    fireEvent.click(screen.getByText('Préférences'));

    expect(screen.getByDisplayValue('fr')).toBeInTheDocument();
    expect(screen.getByDisplayValue('email')).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: /Activer les rappels/ })).toBeChecked();
  });

  it('should handle reminder preferences', () => {
    render(<PatientForm {...mockProps} patient={mockPatient} />);

    // Navigate to preferences tab
    fireEvent.click(screen.getByText('Préférences'));

    // Check that reminder checkboxes are properly set
    expect(screen.getByRole('checkbox', { name: /1 jour/ })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: /2 heures/ })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: /1 semaine/ })).not.toBeChecked();
  });

  it('should disable reminders when checkbox is unchecked', () => {
    render(<PatientForm {...mockProps} patient={mockPatient} />);

    // Navigate to preferences tab
    fireEvent.click(screen.getByText('Préférences'));

    // Uncheck reminder enabled
    fireEvent.click(screen.getByRole('checkbox', { name: /Activer les rappels/ }));

    // Reminder hour checkboxes should be hidden
    expect(screen.queryByRole('checkbox', { name: /1 jour/ })).not.toBeInTheDocument();
  });

  it('should show loading state during submission', async () => {
    // Mock a delayed response
    mockPatientService.createPatient.mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({ success: true, data: mockPatient }), 100))
    );

    render(<PatientForm {...mockProps} />);

    // Fill required fields
    fireEvent.change(screen.getByLabelText(/Prénom/), { target: { value: 'Test' } });
    fireEvent.change(screen.getByLabelText(/Nom/), { target: { value: 'Patient' } });
    fireEvent.change(screen.getByLabelText(/Date de naissance/), { target: { value: '1990-01-01' } });

    fireEvent.click(screen.getByText('Créer le patient'));

    // Should show loading state
    expect(screen.getByText('Enregistrement...')).toBeInTheDocument();
    expect(screen.getByText('Enregistrement...')).toBeDisabled();

    await waitFor(() => {
      expect(mockProps.onSave).toHaveBeenCalled();
    });
  });
});
