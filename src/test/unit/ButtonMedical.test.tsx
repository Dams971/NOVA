/**
 * Tests for Medical Button Component
 * 
 * Comprehensive test suite for the NOVA medical button component
 * ensuring proper functionality, accessibility, and styling.
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Check, X, Loader2, AlertTriangle } from 'lucide-react';
import React from 'react';
import { vi } from 'vitest';
import { Button } from '@/components/ui/button';
import { createTestUser, render as customRender } from '@/test/test-utils';
import '@/test/setup';

describe('Button Component', () => {
  describe('Basic Rendering', () => {
    test('renders with default props', () => {
      render(<Button>Test Button</Button>);
      const button = screen.getByRole('button');
      
      expect(button).toBeInTheDocument();
      expect(button).toHaveTextContent('Test Button');
      expect(button).toHaveClass('btn-primary'); // Assuming primary is default
    });

    test('renders with custom text', () => {
      render(<Button>Prendre Rendez-vous</Button>);
      const button = screen.getByRole('button');
      
      expect(button).toHaveTextContent('Prendre Rendez-vous');
    });

    test('renders with children components', () => {
      render(
        <Button>
          <Check className="w-4 h-4 mr-2" />
          Confirmer
        </Button>
      );
      
      const button = screen.getByRole('button');
      expect(button).toHaveTextContent('Confirmer');
      expect(button.querySelector('svg')).toBeInTheDocument();
    });
  });

  describe('Variants', () => {
    test('renders primary variant correctly', () => {
      render(<Button variant="primary">Primary</Button>);
      const button = screen.getByRole('button');
      
      expect(button).toHaveClass('btn-primary');
    });

    test('renders secondary variant correctly', () => {
      render(<Button variant="secondary">Secondary</Button>);
      const button = screen.getByRole('button');
      
      expect(button).toHaveClass('btn-secondary');
    });

    test('renders destructive variant correctly', () => {
      render(<Button variant="destructive">Supprimer</Button>);
      const button = screen.getByRole('button');
      
      expect(button).toHaveClass('btn-destructive');
    });

    test('renders ghost variant correctly', () => {
      render(<Button variant="ghost">Ghost</Button>);
      const button = screen.getByRole('button');
      
      expect(button).toHaveClass('btn-ghost');
    });

    test('renders link variant correctly', () => {
      render(<Button variant="link">Link</Button>);
      const button = screen.getByRole('button');
      
      expect(button).toHaveClass('btn-link');
    });
  });

  describe('Sizes', () => {
    test('renders small size correctly', () => {
      render(<Button size="sm">Small</Button>);
      const button = screen.getByRole('button');
      
      expect(button).toHaveClass('btn-sm');
    });

    test('renders default size correctly', () => {
      render(<Button size="default">Default</Button>);
      const button = screen.getByRole('button');
      
      expect(button).toHaveClass('btn-default');
    });

    test('renders large size correctly', () => {
      render(<Button size="lg">Large</Button>);
      const button = screen.getByRole('button');
      
      expect(button).toHaveClass('btn-lg');
    });

    test('renders icon size correctly', () => {
      render(<Button size="icon"><Check /></Button>);
      const button = screen.getByRole('button');
      
      expect(button).toHaveClass('btn-icon');
    });
  });

  describe('States', () => {
    test('renders disabled state correctly', () => {
      render(<Button disabled>Disabled</Button>);
      const button = screen.getByRole('button');
      
      expect(button).toBeDisabled();
      expect(button).toHaveAttribute('aria-disabled', 'true');
    });

    test('renders loading state correctly', () => {
      render(<Button loading>Loading</Button>);
      const button = screen.getByRole('button');
      
      expect(button).toBeDisabled();
      expect(button.querySelector('svg')).toBeInTheDocument(); // Loading spinner
    });

    test('shows loading text when loading', () => {
      render(<Button loading loadingText="Chargement...">Submit</Button>);
      const button = screen.getByRole('button');
      
      expect(button).toHaveTextContent('Chargement...');
    });

    test('hides original content when loading', () => {
      render(<Button loading>Original Text</Button>);
      const button = screen.getByRole('button');
      
      expect(button).not.toHaveTextContent('Original Text');
    });
  });

  describe('Events', () => {
    test('handles click events', () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Click Me</Button>);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    test('does not trigger click when disabled', () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick} disabled>Disabled</Button>);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      expect(handleClick).not.toHaveBeenCalled();
    });

    test('does not trigger click when loading', () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick} loading>Loading</Button>);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      expect(handleClick).not.toHaveBeenCalled();
    });

    test('handles keyboard events', () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Keyboard</Button>);
      
      const button = screen.getByRole('button');
      fireEvent.keyDown(button, { key: 'Enter' });
      
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    test('handles space key press', () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Space</Button>);
      
      const button = screen.getByRole('button');
      fireEvent.keyDown(button, { key: ' ' });
      
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('Accessibility', () => {
    test('has proper ARIA attributes', () => {
      render(<Button aria-label="Test button">Button</Button>);
      const button = screen.getByRole('button');
      
      expect(button).toHaveAttribute('aria-label', 'Test button');
    });

    test('supports ARIA described by', () => {
      render(
        <>
          <Button aria-describedby="help-text">Help Button</Button>
          <div id="help-text">This button provides help</div>
        </>
      );
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-describedby', 'help-text');
    });

    test('has proper focus management', () => {
      render(<Button>Focus Me</Button>);
      const button = screen.getByRole('button');
      
      button.focus();
      expect(button).toHaveFocus();
    });

    test('announces loading state to screen readers', () => {
      render(<Button loading aria-label="Submit form">Submit</Button>);
      const button = screen.getByRole('button');
      
      expect(button).toHaveAttribute('aria-disabled', 'true');
    });

    test('supports custom ARIA properties', () => {
      render(
        <Button 
          aria-expanded="false" 
          aria-haspopup="true"
          role="button"
        >
          Menu
        </Button>
      );
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-expanded', 'false');
      expect(button).toHaveAttribute('aria-haspopup', 'true');
    });
  });

  describe('Medical Context', () => {
    test('renders emergency button correctly', () => {
      render(
        <Button variant="destructive" size="lg">
          <AlertTriangle className="w-5 h-5 mr-2" />
          Urgence Médicale
        </Button>
      );
      
      const button = screen.getByRole('button');
      expect(button).toHaveTextContent('Urgence Médicale');
      expect(button).toHaveClass('btn-destructive', 'btn-lg');
    });

    test('renders appointment button correctly', () => {
      render(
        <Button variant="primary">
          <Check className="w-4 h-4 mr-2" />
          Confirmer RDV
        </Button>
      );
      
      const button = screen.getByRole('button');
      expect(button).toHaveTextContent('Confirmer RDV');
    });

    test('handles form submission in medical context', async () => {
      const handleSubmit = vi.fn();
      render(
        <form onSubmit={handleSubmit}>
          <Button type="submit">Envoyer Formulaire</Button>
        </form>
      );
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      expect(handleSubmit).toHaveBeenCalled();
    });
  });

  describe('French Language Support', () => {
    test('renders French text correctly', () => {
      render(<Button>Prendre Rendez-vous</Button>);
      const button = screen.getByRole('button');
      
      expect(button).toHaveTextContent('Prendre Rendez-vous');
    });

    test('handles French accents properly', () => {
      render(<Button>Créer un Dossier Médical</Button>);
      const button = screen.getByRole('button');
      
      expect(button).toHaveTextContent('Créer un Dossier Médical');
    });

    test('supports French loading text', () => {
      render(<Button loading loadingText="Chargement en cours...">Envoyer</Button>);
      const button = screen.getByRole('button');
      
      expect(button).toHaveTextContent('Chargement en cours...');
    });
  });

  describe('Responsive Design', () => {
    test('maintains accessibility on mobile', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375
      });
      
      render(<Button size="sm">Mobile Button</Button>);
      const button = screen.getByRole('button');
      
      // Should maintain minimum touch target size even on small size
      expect(button).toHaveClass('min-h-touch-ios');
    });
  });

  describe('Performance', () => {
    test('does not cause unnecessary re-renders', () => {
      const renderCount = vi.fn();
      
      const TestButton = React.memo(({ children, ...props }: any) => {
        renderCount();
        return <Button {...props}>{children}</Button>;
      });
      TestButton.displayName = 'TestButton';

      const { rerender } = render(<TestButton>Test</TestButton>);
      
      // Same props should not cause re-render
      rerender(<TestButton>Test</TestButton>);
      
      expect(renderCount).toHaveBeenCalledTimes(1);
    });

    test('handles rapid clicks gracefully', async () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Rapid Click</Button>);
      
      const button = screen.getByRole('button');
      
      // Simulate rapid clicks
      for (let i = 0; i < 10; i++) {
        fireEvent.click(button);
      }
      
      await waitFor(() => {
        expect(handleClick).toHaveBeenCalledTimes(10);
      });
    });
  });

  describe('Custom Props', () => {
    test('forwards custom HTML attributes', () => {
      render(<Button data-testid="custom-button" title="Custom Title">Custom</Button>);
      const button = screen.getByRole('button');
      
      expect(button).toHaveAttribute('data-testid', 'custom-button');
      expect(button).toHaveAttribute('title', 'Custom Title');
    });

    test('supports custom CSS classes', () => {
      render(<Button className="custom-class">Custom Class</Button>);
      const button = screen.getByRole('button');
      
      expect(button).toHaveClass('custom-class');
    });

    test('allows custom inline styles', () => {
      render(<Button style={{ backgroundColor: 'red' }}>Styled</Button>);
      const button = screen.getByRole('button');
      
      expect(button).toHaveStyle({ backgroundColor: 'red' });
    });
  });

  describe('Edge Cases', () => {
    test('handles empty children gracefully', () => {
      render(<Button></Button>);
      const button = screen.getByRole('button');
      
      expect(button).toBeInTheDocument();
      expect(button).toHaveTextContent('');
    });

    test('handles null children gracefully', () => {
      render(<Button>{null}</Button>);
      const button = screen.getByRole('button');
      
      expect(button).toBeInTheDocument();
    });

    test('handles undefined props gracefully', () => {
      render(<Button variant={undefined} size={undefined}>Undefined Props</Button>);
      const button = screen.getByRole('button');
      
      expect(button).toBeInTheDocument();
      expect(button).toHaveTextContent('Undefined Props');
    });

    test('works with form validation', () => {
      render(
        <form>
          <Button type="submit" required>Submit Required</Button>
        </form>
      );
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('type', 'submit');
    });
  });
});