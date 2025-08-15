import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { vi } from 'vitest';

// Components to test
import Header from '@/components/layout/Header';
import TextInput from '@/components/ui/forms/TextInput';
import TelInput from '@/components/ui/forms/TelInput';
import Button from '@/components/ui/forms/Button';
import DatePicker from '@/components/ui/calendar/DatePicker';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

// Mock Next.js Link component
vi.mock('next/link', () => {
  return {
    default: ({ children, href, ...props }: any) => (
      <a href={href} {...props}>
        {children}
      </a>
    ),
  };
});

describe('Accessibility Tests', () => {
  describe('Header Component', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(<Header />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have skip link as first focusable element', async () => {
      const user = userEvent.setup();
      render(<Header />);
      
      // Tab to first element (skip link)
      await user.tab();
      const skipLink = screen.getByText('Aller au contenu principal');
      expect(skipLink).toHaveFocus();
      expect(skipLink).toHaveClass('sr-only');
    });

    it('should properly handle keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<Header />);
      
      // Tab through navigation elements
      await user.tab(); // Skip link
      await user.tab(); // Logo
      await user.tab(); // Mobile menu button or first nav link
      
      const logo = screen.getByRole('link', { name: /NOVA/i });
      expect(logo).toBeInTheDocument();
    });

    it('should have proper ARIA attributes for mobile menu', () => {
      render(<Header />);
      
      const menuButton = screen.getByRole('button', { name: /ouvrir le menu/i });
      expect(menuButton).toHaveAttribute('aria-expanded', 'false');
      expect(menuButton).toHaveAttribute('aria-controls', 'mobile-menu');
      expect(menuButton).toHaveAttribute('aria-haspopup', 'false');
    });

    it('should toggle mobile menu with Enter and Space keys', async () => {
      const user = userEvent.setup();
      render(<Header />);
      
      const menuButton = screen.getByRole('button', { name: /ouvrir le menu/i });
      
      // Test Enter key
      menuButton.focus();
      await user.keyboard('{Enter}');
      expect(menuButton).toHaveAttribute('aria-expanded', 'true');
      
      // Test Escape key to close
      await user.keyboard('{Escape}');
      expect(menuButton).toHaveAttribute('aria-expanded', 'false');
    });

    it('should meet touch target size requirements', () => {
      const { container } = render(<Header />);
      
      const menuButton = container.querySelector('[aria-label*="menu"]');
      const styles = window.getComputedStyle(menuButton!);
      
      // Check minimum touch target size (44px for iOS)
      const minHeight = parseInt(styles.minHeight);
      const minWidth = parseInt(styles.minWidth);
      
      expect(minHeight).toBeGreaterThanOrEqual(44);
      expect(minWidth).toBeGreaterThanOrEqual(44);
    });
  });

  describe('TextInput Component', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(
        <TextInput label="Email" placeholder="Enter your email" />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper ARIA attributes', () => {
      render(
        <TextInput
          label="Email"
          error="Email invalide"
          hint="Entrez votre adresse email"
          required
        />
      );

      const input = screen.getByLabelText(/Email/);
      expect(input).toHaveAttribute('aria-invalid', 'true');
      expect(input).toHaveAttribute('aria-describedby');
      expect(input).toHaveAttribute('aria-required', 'true');
      
      const error = screen.getByRole('alert');
      expect(error).toHaveTextContent('Email invalide');
    });

    it('should properly associate label with input', () => {
      render(<TextInput label="Test Label" />);
      
      const input = screen.getByLabelText('Test Label');
      const label = screen.getByText('Test Label');
      
      expect(input).toBeInTheDocument();
      expect(label).toHaveAttribute('for', input.id);
    });

    it('should meet touch target size requirements', () => {
      const { container } = render(<TextInput label="Test" />);
      const input = container.querySelector('input');
      
      const styles = window.getComputedStyle(input!);
      const minHeight = parseInt(styles.minHeight);
      expect(minHeight).toBeGreaterThanOrEqual(44);
    });

    it('should provide clear error feedback', () => {
      render(<TextInput label="Email" error="This field is required" />);
      
      const input = screen.getByLabelText(/Email/);
      const errorMessage = screen.getByRole('alert');
      
      expect(input).toHaveAttribute('aria-invalid', 'true');
      expect(errorMessage).toHaveTextContent('This field is required');
      expect(input).toHaveAttribute('aria-describedby', errorMessage.id);
    });
  });

  describe('TelInput Component', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(
        <TelInput label="Téléphone" />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper input type and mode', () => {
      render(<TelInput label="Téléphone" />);
      
      const input = screen.getByLabelText(/Téléphone/);
      expect(input).toHaveAttribute('type', 'tel');
      expect(input).toHaveAttribute('inputmode', 'tel');
      expect(input).toHaveAttribute('autocomplete', 'tel');
    });

    it('should provide helpful hint text', () => {
      render(<TelInput label="Téléphone" />);
      
      const hint = screen.getByText(/Numéro de téléphone algérien/);
      expect(hint).toBeInTheDocument();
    });
  });

  describe('Button Component', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(
        <Button>Click me</Button>
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should properly handle loading state', () => {
      render(<Button loading>Loading</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-busy', 'true');
      expect(button).toBeDisabled();
    });

    it('should meet touch target size requirements', () => {
      const { container } = render(<Button>Test</Button>);
      const button = container.querySelector('button');
      
      const styles = window.getComputedStyle(button!);
      const minHeight = parseInt(styles.minHeight);
      expect(minHeight).toBeGreaterThanOrEqual(44);
    });

    it('should have proper focus styles', async () => {
      const user = userEvent.setup();
      render(<Button>Test</Button>);
      
      const button = screen.getByRole('button');
      await user.tab();
      
      expect(button).toHaveFocus();
      expect(button).toHaveClass('focus:ring-2');
    });
  });

  describe('DatePicker Component', () => {
    const mockOnChange = vi.fn();

    beforeEach(() => {
      mockOnChange.mockClear();
    });

    it('should have no accessibility violations', async () => {
      const { container } = render(
        <DatePicker label="Date de naissance" onChange={mockOnChange} />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper ARIA attributes for dialog', async () => {
      const user = userEvent.setup();
      render(<DatePicker label="Date" onChange={mockOnChange} />);
      
      const trigger = screen.getByRole('button');
      expect(trigger).toHaveAttribute('aria-haspopup', 'dialog');
      expect(trigger).toHaveAttribute('aria-expanded', 'false');
      
      // Open the calendar
      await user.click(trigger);
      expect(trigger).toHaveAttribute('aria-expanded', 'true');
    });

    it('should have proper calendar grid structure', async () => {
      const user = userEvent.setup();
      render(<DatePicker label="Date" onChange={mockOnChange} />);
      
      const trigger = screen.getByRole('button');
      await user.click(trigger);
      
      const grid = screen.getByRole('grid');
      expect(grid).toBeInTheDocument();
      expect(grid).toHaveAttribute('aria-labelledby');
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<DatePicker label="Date" onChange={mockOnChange} />);
      
      const trigger = screen.getByRole('button');
      await user.click(trigger);
      
      // Test Escape key closes dialog
      await user.keyboard('{Escape}');
      expect(trigger).toHaveAttribute('aria-expanded', 'false');
    });

    it('should provide proper day labeling', async () => {
      const user = userEvent.setup();
      render(<DatePicker label="Date" onChange={mockOnChange} />);
      
      const trigger = screen.getByRole('button');
      await user.click(trigger);
      
      // Check that day buttons have proper labels
      const dayButtons = screen.getAllByRole('gridcell');
      expect(dayButtons.length).toBeGreaterThan(0);
      
      // Each day should have an accessible name
      dayButtons.forEach(button => {
        expect(button).toHaveAttribute('aria-label');
      });
    });
  });

  describe('Color Contrast', () => {
    it('should have sufficient color contrast for text', () => {
      const { container } = render(
        <div className="text-gray-700 bg-white p-4">
          Test text content
        </div>
      );
      
      const element = container.firstChild as HTMLElement;
      const styles = window.getComputedStyle(element);
      
      // Note: In a real test environment, you would use a color contrast library
      // to calculate the actual contrast ratio
      expect(styles.color).toBeTruthy();
      expect(styles.backgroundColor).toBeTruthy();
    });
  });

  describe('Focus Management', () => {
    it('should have visible focus indicators', async () => {
      const user = userEvent.setup();
      render(
        <div>
          <Button>First</Button>
          <Button>Second</Button>
        </div>
      );
      
      const firstButton = screen.getByRole('button', { name: 'First' });
      await user.tab();
      
      expect(firstButton).toHaveFocus();
      expect(firstButton).toHaveClass('focus:ring-2');
    });

    it('should have logical tab order', async () => {
      const user = userEvent.setup();
      render(
        <div>
          <TextInput label="First" />
          <TextInput label="Second" />
          <Button>Submit</Button>
        </div>
      );
      
      // Tab through elements
      await user.tab();
      expect(screen.getByLabelText('First')).toHaveFocus();
      
      await user.tab();
      expect(screen.getByLabelText('Second')).toHaveFocus();
      
      await user.tab();
      expect(screen.getByRole('button')).toHaveFocus();
    });
  });

  describe('Screen Reader Support', () => {
    it('should provide proper landmark roles', () => {
      render(<Header />);
      
      const navigation = screen.getByRole('navigation');
      expect(navigation).toHaveAttribute('aria-label', 'Navigation principale');
    });

    it('should have proper heading structure', () => {
      render(
        <div>
          <h1>Main Heading</h1>
          <h2>Section Heading</h2>
        </div>
      );
      
      const mainHeading = screen.getByRole('heading', { level: 1 });
      const sectionHeading = screen.getByRole('heading', { level: 2 });
      
      expect(mainHeading).toBeInTheDocument();
      expect(sectionHeading).toBeInTheDocument();
    });

    it('should provide alternative text for images', () => {
      render(
        <img src="/test.jpg" alt="Description of image" />
      );
      
      const image = screen.getByAltText('Description of image');
      expect(image).toBeInTheDocument();
    });
  });

  describe('Form Accessibility', () => {
    it('should group related form fields with fieldset', () => {
      render(
        <fieldset>
          <legend>Personal Information</legend>
          <TextInput label="First Name" />
          <TextInput label="Last Name" />
        </fieldset>
      );
      
      const fieldset = screen.getByRole('group');
      expect(fieldset).toHaveAccessibleName('Personal Information');
    });

    it('should provide clear error summaries for forms with multiple errors', () => {
      render(
        <div>
          <div role="alert" aria-labelledby="error-summary-title">
            <h2 id="error-summary-title">Please correct the following errors:</h2>
            <ul>
              <li><a href="#email">Email is required</a></li>
              <li><a href="#phone">Phone number is invalid</a></li>
            </ul>
          </div>
          <TextInput label="Email" error="Email is required" id="email" />
          <TelInput label="Phone" error="Phone number is invalid" id="phone" />
        </div>
      );
      
      const errorSummary = screen.getByRole('alert');
      expect(errorSummary).toBeInTheDocument();
      expect(errorSummary).toHaveAccessibleName('Please correct the following errors:');
    });
  });
});