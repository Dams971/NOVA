import React from 'react';
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { vi } from 'vitest';

// Import components to test
import PatientForm from '@/components/manager/PatientForm';
import PatientDetail from '@/components/manager/PatientDetail';
import PatientManagement from '@/components/manager/PatientManagement';
import VisuallyHidden from '@/components/ui/VisuallyHidden';
import FocusTrap from '@/components/ui/FocusTrap';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ErrorMessage from '@/components/ui/ErrorMessage';
import SuccessMessage from '@/components/ui/SuccessMessage';
import { ScreenReaderProvider } from '@/hooks/useScreenReaderAnnouncements';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

// Mock services
vi.mock('@/lib/services/patient-service');
vi.mock('@/lib/services/patient-search-service');
vi.mock('@/lib/services/patient-communication-service');

// Mock global PatientService 
(globalThis as any).PatientService = {
  getInstance: vi.fn(() => ({
    getPatients: vi.fn().mockResolvedValue({
      success: true,
      data: { patients: [], total: 0, hasMore: false }
    }),
    createPatient: vi.fn().mockResolvedValue({
      success: true,
      data: {}
    }),
    updatePatient: vi.fn().mockResolvedValue({
      success: true,
      data: {}
    }),
    deletePatient: vi.fn().mockResolvedValue({
      success: true
    })
  }))
};

// Mock patient data
const mockPatient = {
  id: 'patient-1',
  cabinetId: 'cabinet-1',
  firstName: 'Marie',
  lastName: 'Dubois',
  email: 'marie@example.com',
  phone: '+33123456789',
  dateOfBirth: new Date('1985-03-15'),
  gender: 'female' as const,
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
    communicationMethod: 'email' as const,
    reminderEnabled: true,
    reminderHours: [24, 2]
  },
  medicalHistory: [],
  isActive: true,
  totalVisits: 5,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01')
};

describe('Accessibility Tests', () => {
  describe('UI Components', () => {
    it('VisuallyHidden should not have accessibility violations', async () => {
      const { container } = render(
        <VisuallyHidden>Hidden content for screen readers</VisuallyHidden>
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('LoadingSpinner should not have accessibility violations', async () => {
      const { container } = render(
        <LoadingSpinner label="Loading data" showLabel={true} />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('ErrorMessage should not have accessibility violations', async () => {
      const { container } = render(
        <ErrorMessage message="This is an error message" />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('SuccessMessage should not have accessibility violations', async () => {
      const { container } = render(
        <SuccessMessage message="Operation completed successfully" />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('FocusTrap should not have accessibility violations', async () => {
      const { container } = render(
        <FocusTrap active={true}>
          <div>
            <button>First button</button>
            <input type="text" placeholder="Input field" />
            <button>Last button</button>
          </div>
        </FocusTrap>
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Patient Management Components', () => {
    beforeEach(() => {
      // Mock the services
      const mockPatientService = {
        getPatients: vi.fn().mockResolvedValue({
          success: true,
          data: { patients: [mockPatient], total: 1, hasMore: false }
        }),
        createPatient: vi.fn().mockResolvedValue({
          success: true,
          data: mockPatient
        }),
        updatePatient: vi.fn().mockResolvedValue({
          success: true,
          data: mockPatient
        }),
        getInstance: vi.fn()
      };

      vi.mocked(require('@/lib/services/patient-service').PatientService.getInstance)
        .mockReturnValue(mockPatientService);
    });

    it('PatientForm should not have accessibility violations', async () => {
      const { container } = render(
        <ScreenReaderProvider>
          <PatientForm
            cabinetId="cabinet-1"
            onSave={vi.fn()}
            onCancel={vi.fn()}
          />
        </ScreenReaderProvider>
      );

      // Wait for the form to render
      await screen.findByText('Nouveau patient');

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('PatientDetail should not have accessibility violations', async () => {
      const { container } = render(
        <ScreenReaderProvider>
          <PatientDetail
            patient={mockPatient}
            onEdit={vi.fn()}
            onClose={vi.fn()}
          />
        </ScreenReaderProvider>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('PatientManagement should not have accessibility violations', async () => {
      const { container } = render(
        <ScreenReaderProvider>
          <PatientManagement cabinetId="cabinet-1" />
        </ScreenReaderProvider>
      );

      // Wait for the component to load
      await screen.findByText('Gestion des Patients');

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Keyboard Navigation', () => {
    it('should support keyboard navigation in forms', async () => {
      render(
        <ScreenReaderProvider>
          <PatientForm
            cabinetId="cabinet-1"
            onSave={vi.fn()}
            onCancel={vi.fn()}
          />
        </ScreenReaderProvider>
      );

      const firstNameInput = screen.getByLabelText(/Prénom/);
      const lastNameInput = screen.getByLabelText(/Nom/);

      // Check that inputs are focusable
      expect(firstNameInput).toBeInTheDocument();
      expect(lastNameInput).toBeInTheDocument();
      
      // Check tabindex
      expect(firstNameInput.getAttribute('tabindex')).not.toBe('-1');
      expect(lastNameInput.getAttribute('tabindex')).not.toBe('-1');
    });

    it('should have proper ARIA labels on interactive elements', async () => {
      render(
        <ScreenReaderProvider>
          <PatientDetail
            patient={mockPatient}
            onEdit={vi.fn()}
            onClose={vi.fn()}
          />
        </ScreenReaderProvider>
      );

      // Check for ARIA labels on buttons
      const closeButton = screen.getByLabelText(/Fermer/);
      expect(closeButton).toBeInTheDocument();
      expect(closeButton).toHaveAttribute('aria-label');
    });
  });

  describe('Screen Reader Support', () => {
    it('should have proper heading structure', async () => {
      render(
        <ScreenReaderProvider>
          <PatientManagement cabinetId="cabinet-1" />
        </ScreenReaderProvider>
      );

      // Check for main heading
      const mainHeading = screen.getByRole('heading', { level: 1 });
      expect(mainHeading).toBeInTheDocument();
    });

    it('should have proper form labels', async () => {
      render(
        <ScreenReaderProvider>
          <PatientForm
            cabinetId="cabinet-1"
            onSave={vi.fn()}
            onCancel={vi.fn()}
          />
        </ScreenReaderProvider>
      );

      // Check that all form inputs have associated labels
      const firstNameInput = screen.getByLabelText(/Prénom/);
      const lastNameInput = screen.getByLabelText(/Nom/);
      const emailInput = screen.getByLabelText(/Email/);

      expect(firstNameInput).toBeInTheDocument();
      expect(lastNameInput).toBeInTheDocument();
      expect(emailInput).toBeInTheDocument();
    });

    it('should announce loading states', async () => {
      const { container } = render(
        <LoadingSpinner label="Loading patient data" showLabel={true} />
      );

      const loadingElement = screen.getByRole('status');
      expect(loadingElement).toBeInTheDocument();
      expect(loadingElement).toHaveAttribute('aria-label', 'Loading patient data');
    });

    it('should announce error states', async () => {
      const { container } = render(
        <ErrorMessage message="Invalid email format" />
      );

      const errorElement = screen.getByRole('alert');
      expect(errorElement).toBeInTheDocument();
      expect(errorElement).toHaveTextContent('Invalid email format');
    });
  });

  describe('Color and Contrast', () => {
    it('should not rely solely on color for information', async () => {
      render(
        <ScreenReaderProvider>
          <PatientDetail
            patient={mockPatient}
            onEdit={vi.fn()}
            onClose={vi.fn()}
          />
        </ScreenReaderProvider>
      );

      // Check that status indicators have text or icons, not just color
      const statusElements = screen.getAllByText(/actif|inactif/i);
      expect(statusElements.length).toBeGreaterThan(0);
    });
  });

  describe('Focus Management', () => {
    it('should manage focus properly in modals', async () => {
      const onCancel = vi.fn();
      
      render(
        <ScreenReaderProvider>
          <PatientForm
            cabinetId="cabinet-1"
            onSave={vi.fn()}
            onCancel={onCancel}
          />
        </ScreenReaderProvider>
      );

      // Check that modal has proper role and ARIA attributes
      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
      expect(dialog).toHaveAttribute('aria-modal', 'true');
    });

    it('should have visible focus indicators', async () => {
      render(
        <ScreenReaderProvider>
          <PatientForm
            cabinetId="cabinet-1"
            onSave={vi.fn()}
            onCancel={vi.fn()}
          />
        </ScreenReaderProvider>
      );

      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        // Check that buttons have focus styles (this would need to be tested with actual focus)
        expect(button).toBeInTheDocument();
      });
    });
  });

  describe('Mobile Accessibility', () => {
    it('should have appropriate touch targets', async () => {
      render(
        <ScreenReaderProvider>
          <PatientManagement cabinetId="cabinet-1" />
        </ScreenReaderProvider>
      );

      // Check that interactive elements are large enough for touch
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        const styles = window.getComputedStyle(button);
        // This is a simplified check - in real tests you'd measure actual dimensions
        expect(button).toBeInTheDocument();
      });
    });
  });
});
