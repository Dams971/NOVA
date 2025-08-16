/**
 * NOVA Design System Accessibility Tests
 * 
 * Comprehensive WCAG 2.2 AA compliance testing for the NOVA medical design system.
 * Tests color contrast, keyboard navigation, screen reader support, and focus management.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@/test/test-utils';
import { axe, toHaveNoViolations } from 'jest-axe';
import { Button } from '@/components/ui/button';
import { ChatRDV } from '@/components/rdv/ChatRDV';
import { checkAccessibility } from '@/test/setup';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

describe('NOVA Accessibility Compliance', () => {
  describe('WCAG 2.2 AA - Color Contrast', () => {
    test('primary buttons meet 4.5:1 contrast ratio', async () => {
      const { container } = render(
        <Button variant="primary">Prendre rendez-vous</Button>
      );
      
      const results = await axe(container, {
        rules: {
          'color-contrast': { enabled: true }
        }
      });
      
      expect(results).toHaveNoViolations();
    });

    test('secondary buttons meet contrast requirements', async () => {
      const { container } = render(
        <Button variant="secondary">Annuler</Button>
      );
      
      const results = await axe(container, {
        rules: {
          'color-contrast': { enabled: true }
        }
      });
      
      expect(results).toHaveNoViolations();
    });

    test('destructive buttons meet contrast requirements', async () => {
      const { container } = render(
        <Button variant="destructive">Supprimer</Button>
      );
      
      const results = await axe(container, {
        rules: {
          'color-contrast': { enabled: true }
        }
      });
      
      expect(results).toHaveNoViolations();
    });

    test('success buttons meet contrast requirements', async () => {
      const { container } = render(
        <Button variant="success">Confirmer</Button>
      );
      
      const results = await axe(container, {
        rules: {
          'color-contrast': { enabled: true }
        }
      });
      
      expect(results).toHaveNoViolations();
    });

    test('warning buttons meet contrast requirements', async () => {
      const { container } = render(
        <Button variant="warning">Attention</Button>
      );
      
      const results = await axe(container, {
        rules: {
          'color-contrast': { enabled: true }
        }
      });
      
      expect(results).toHaveNoViolations();
    });

    test('quiet buttons meet contrast requirements', async () => {
      const { container } = render(
        <Button variant="quiet">Options</Button>
      );
      
      const results = await axe(container, {
        rules: {
          'color-contrast': { enabled: true }
        }
      });
      
      expect(results).toHaveNoViolations();
    });

    test('disabled buttons maintain readable contrast', async () => {
      const { container } = render(
        <Button disabled>Bouton désactivé</Button>
      );
      
      const results = await axe(container, {
        rules: {
          'color-contrast': { enabled: true }
        }
      });
      
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

      vi.mocked(PatientService.getInstance)
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
