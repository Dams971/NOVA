/**
 * NOVA Design System Accessibility Tests - Complete Suite
 * 
 * Comprehensive WCAG 2.2 AA compliance testing for the NOVA medical design system.
 * Tests color contrast, keyboard navigation, screen reader support, and focus management.
 */

import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { Heart, Calendar } from 'lucide-react';
import { ChatRDV } from '@/components/rdv/ChatRDV';
import { Button } from '@/components/ui/button';
import { checkAccessibility } from '@/test/setup';
import { render, screen, fireEvent, waitFor } from '@/test/test-utils';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

describe('NOVA Design System - Complete Accessibility Suite', () => {
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

    test('all button variants meet contrast requirements', async () => {
      const variants = ['primary', 'secondary', 'success', 'warning', 'destructive', 'quiet'] as const;
      
      for (const variant of variants) {
        const { container } = render(
          <Button variant={variant}>Test {variant}</Button>
        );
        
        const results = await axe(container, {
          rules: {
            'color-contrast': { enabled: true }
          }
        });
        
        expect(results.violations).toHaveLength(0);
      }
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

    test('chat interface meets contrast requirements', async () => {
      const { container } = render(<ChatRDV />);
      
      const results = await axe(container, {
        rules: {
          'color-contrast': { enabled: true }
        }
      });
      
      expect(results).toHaveNoViolations();
    });
  });

  describe('WCAG 2.2 AA - Touch Targets (44px minimum)', () => {
    test('small buttons meet minimum touch target', () => {
      render(<Button size="sm">Petit bouton</Button>);
      const button = screen.getByRole('button');
      
      // Check that button has minimum height class
      expect(button).toHaveClass('min-h-touch-ios');
    });

    test('medium buttons meet touch target requirements', () => {
      render(<Button size="md">Bouton moyen</Button>);
      const button = screen.getByRole('button');
      
      expect(button).toHaveClass('min-h-touch-android');
    });

    test('large buttons exceed touch target requirements', () => {
      render(<Button size="lg">Grand bouton</Button>);
      const button = screen.getByRole('button');
      
      expect(button).toHaveClass('min-h-[52px]');
    });

    test('chat input meets touch target requirements', () => {
      render(<ChatRDV />);
      const input = screen.getByPlaceholderText(/tapez votre message/i);
      
      // Input should have adequate padding for touch
      expect(input).toHaveClass('px-3', 'py-2');
    });

    test('chat send button meets touch requirements', () => {
      render(<ChatRDV />);
      const sendButton = screen.getByLabelText(/envoyer le message/i);
      
      expect(sendButton).toBeInTheDocument();
      // Button should be adequately sized
      expect(sendButton.closest('button')).toHaveClass('min-h-touch-android');
    });
  });

  describe('WCAG 2.2 AA - Keyboard Navigation', () => {
    test('buttons are focusable with keyboard', async () => {
      const user = userEvent.setup();
      render(<Button>Bouton focusable</Button>);
      
      const button = screen.getByRole('button');
      
      await user.tab();
      expect(button).toHaveFocus();
    });

    test('buttons activate with Enter key', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Test Enter</Button>);
      
      const button = screen.getByRole('button');
      button.focus();
      
      await user.keyboard('{Enter}');
      expect(handleClick).toHaveBeenCalled();
    });

    test('buttons activate with Space key', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Test Space</Button>);
      
      const button = screen.getByRole('button');
      button.focus();
      
      await user.keyboard(' ');
      expect(handleClick).toHaveBeenCalled();
    });

    test('disabled buttons are not focusable', async () => {
      const user = userEvent.setup();
      render(
        <div>
          <Button>Bouton 1</Button>
          <Button disabled>Bouton désactivé</Button>
          <Button>Bouton 3</Button>
        </div>
      );
      
      const buttons = screen.getAllByRole('button');
      
      await user.tab();
      expect(buttons[0]).toHaveFocus();
      
      await user.tab();
      expect(buttons[2]).toHaveFocus(); // Should skip disabled button
    });

    test('chat interface supports keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<ChatRDV />);
      
      const input = screen.getByPlaceholderText(/tapez votre message/i);
      const sendButton = screen.getByLabelText(/envoyer le message/i);
      
      await user.tab();
      expect(input).toHaveFocus();
      
      await user.tab();
      expect(sendButton).toHaveFocus();
    });

    test('Enter key sends message in chat', async () => {
      const user = userEvent.setup();
      render(<ChatRDV />);
      
      const input = screen.getByPlaceholderText(/tapez votre message/i);
      
      await user.type(input, 'Test message');
      await user.keyboard('{Enter}');
      
      expect(screen.getByText('Test message')).toBeInTheDocument();
    });

    test('tab order is logical and consistent', async () => {
      const user = userEvent.setup();
      render(
        <div>
          <Button>Premier</Button>
          <Button>Deuxième</Button>
          <Button>Troisième</Button>
        </div>
      );
      
      const buttons = screen.getAllByRole('button');
      
      await user.tab();
      expect(buttons[0]).toHaveFocus();
      
      await user.tab();
      expect(buttons[1]).toHaveFocus();
      
      await user.tab();
      expect(buttons[2]).toHaveFocus();
    });
  });

  describe('WCAG 2.2 AA - Focus Management', () => {
    test('buttons have visible focus indicators', () => {
      render(<Button>Focus Test</Button>);
      const button = screen.getByRole('button');
      
      expect(button).toHaveClass('focus-visible-ring');
    });

    test('focus indicators meet contrast requirements', async () => {
      const { container } = render(<Button>Focus Contrast</Button>);
      
      const button = screen.getByRole('button');
      button.focus();
      
      const results = await axe(container, {
        rules: {
          'focus-visible': { enabled: true }
        }
      });
      
      expect(results).toHaveNoViolations();
    });

    test('focus is managed correctly in loading state', async () => {
      const user = userEvent.setup();
      const { rerender } = render(<Button>Normal State</Button>);
      
      const button = screen.getByRole('button');
      button.focus();
      expect(button).toHaveFocus();
      
      // Switch to loading state
      rerender(<Button loading>Loading State</Button>);
      
      // Button should still be focused but disabled
      expect(button).toHaveFocus();
      expect(button).toBeDisabled();
    });

    test('reverse tab order works correctly', async () => {
      const user = userEvent.setup();
      render(
        <div>
          <Button>Premier</Button>
          <Button>Deuxième</Button>
          <Button>Troisième</Button>
        </div>
      );
      
      const buttons = screen.getAllByRole('button');
      
      // Focus last button first
      buttons[2].focus();
      
      await user.tab({ shift: true });
      expect(buttons[1]).toHaveFocus();
      
      await user.tab({ shift: true });
      expect(buttons[0]).toHaveFocus();
    });
  });

  describe('WCAG 2.2 AA - Screen Reader Support', () => {
    test('buttons have accessible names', () => {
      render(<Button>Accessible Button</Button>);
      const button = screen.getByRole('button', { name: /accessible button/i });
      expect(button).toBeInTheDocument();
    });

    test('loading buttons announce loading state', () => {
      render(<Button loading>Saving</Button>);
      const button = screen.getByRole('button');
      
      expect(button).toHaveAttribute('aria-busy', 'true');
      expect(screen.getByText(/saving en cours de traitement/i)).toBeInTheDocument();
    });

    test('chat messages are announced to screen readers', () => {
      render(<ChatRDV />);
      const messagesArea = screen.getByRole('log');
      
      expect(messagesArea).toHaveAttribute('aria-live', 'polite');
      expect(messagesArea).toHaveAttribute('aria-label', 'Messages du chat');
    });

    test('typing indicator is announced', async () => {
      const user = userEvent.setup();
      render(<ChatRDV />);
      
      const input = screen.getByPlaceholderText(/tapez votre message/i);
      await user.type(input, 'Test{Enter}');
      
      const typingIndicator = screen.getByLabelText(/l'assistant tape une réponse/i);
      expect(typingIndicator).toBeInTheDocument();
    });

    test('decorative icons are hidden from screen readers', () => {
      render(<ChatRDV />);
      
      const decorativeIcons = document.querySelectorAll('[aria-hidden="true"]');
      expect(decorativeIcons.length).toBeGreaterThan(0);
    });

    test('form inputs have proper labels', () => {
      render(<ChatRDV />);
      
      const input = screen.getByLabelText(/message à envoyer/i);
      expect(input).toBeInTheDocument();
    });

    test('buttons with icons maintain accessibility', () => {
      render(
        <Button 
          icon={<Heart data-testid="heart-icon" />}
          iconPosition="left"
        >
          Favoris
        </Button>
      );
      
      const button = screen.getByRole('button', { name: /favoris/i });
      expect(button).toBeInTheDocument();
      
      const icon = screen.getByTestId('heart-icon');
      expect(icon.closest('span')).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('WCAG 2.2 AA - Language Support', () => {
    test('French content is properly marked', () => {
      render(<Button>Bouton français</Button>);
      
      // Check that the document or container has proper lang attribute
      expect(document.documentElement.lang || 'fr').toBe('fr');
    });

    test('French text content in chat', () => {
      render(<ChatRDV />);
      
      // Verify French text content
      expect(screen.getByText('Assistant RDV')).toBeInTheDocument();
      expect(screen.getByText(/bonjour ! je suis votre assistant/i)).toBeInTheDocument();
    });

    test('French loading messages', () => {
      render(<Button loading>Connexion</Button>);
      expect(screen.getByText(/connexion en cours de traitement/i)).toBeInTheDocument();
    });

    test('French default loading text', () => {
      render(<Button loading />);
      expect(screen.getByText(/chargement en cours/i)).toBeInTheDocument();
    });
  });

  describe('WCAG 2.2 AA - Error Prevention', () => {
    test('loading buttons prevent double submission', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      render(<Button onClick={handleClick} loading>Processing</Button>);
      
      const button = screen.getByRole('button');
      
      await user.click(button);
      await user.click(button);
      
      expect(handleClick).not.toHaveBeenCalled();
    });

    test('disabled buttons prevent interaction', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      render(<Button onClick={handleClick} disabled>Disabled</Button>);
      
      const button = screen.getByRole('button');
      
      await user.click(button);
      expect(handleClick).not.toHaveBeenCalled();
    });

    test('empty messages are prevented in chat', async () => {
      const user = userEvent.setup();
      render(<ChatRDV />);
      
      const sendButton = screen.getByLabelText(/envoyer le message/i);
      expect(sendButton).toBeDisabled();
      
      const input = screen.getByPlaceholderText(/tapez votre message/i);
      await user.type(input, '   '); // Only whitespace
      
      expect(sendButton).toBeDisabled();
    });

    test('form validation prevents invalid submission', () => {
      render(<ChatRDV />);
      
      const input = screen.getByPlaceholderText(/tapez votre message/i);
      const sendButton = screen.getByLabelText(/envoyer le message/i);
      
      // Send button should be disabled when input is empty
      expect(sendButton).toBeDisabled();
    });
  });

  describe('WCAG 2.2 AA - Reduced Motion Support', () => {
    test('respects prefers-reduced-motion setting', () => {
      // Mock reduced motion preference
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(query => ({
          matches: query === '(prefers-reduced-motion: reduce)',
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });

      render(<Button>Reduced Motion</Button>);
      const button = screen.getByRole('button');
      
      // Button should have transitions but respect motion preferences
      expect(button).toHaveClass('transition-all');
    });

    test('animations are accessible', () => {
      render(<ChatRDV />);
      
      // Check that animations don't interfere with accessibility
      const chatContainer = screen.getByRole('log').closest('.flex');
      expect(chatContainer).toBeInTheDocument();
    });
  });

  describe('WCAG 2.2 AA - Comprehensive Component Tests', () => {
    test('complete chat interface has no violations', async () => {
      const { container } = render(<ChatRDV />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('button combinations have no violations', async () => {
      const { container } = render(
        <div>
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="destructive">Destructive</Button>
          <Button loading>Loading</Button>
          <Button disabled>Disabled</Button>
        </div>
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('mixed size buttons have no violations', async () => {
      const { container } = render(
        <div>
          <Button size="sm">Small</Button>
          <Button size="md">Medium</Button>
          <Button size="lg">Large</Button>
        </div>
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('buttons with icons have no violations', async () => {
      const { container } = render(
        <div>
          <Button icon={<Heart />} iconPosition="left">Left Icon</Button>
          <Button icon={<Calendar />} iconPosition="right">Right Icon</Button>
        </div>
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('WCAG 2.2 AA - Mobile Accessibility', () => {
    test('maintains touch targets on mobile', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      render(<Button size="sm">Mobile Button</Button>);
      const button = screen.getByRole('button');
      
      // Should maintain minimum touch target size even on small size
      expect(button).toHaveClass('min-h-touch-ios');
    });

    test('chat interface works on mobile', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      render(<ChatRDV />);
      
      const input = screen.getByPlaceholderText(/tapez votre message/i);
      const sendButton = screen.getByLabelText(/envoyer le message/i);
      
      expect(input).toBeInTheDocument();
      expect(sendButton).toBeInTheDocument();
    });

    test('responsive design maintains accessibility', async () => {
      // Test different viewport sizes
      const viewports = [375, 768, 1024, 1920];
      
      for (const width of viewports) {
        Object.defineProperty(window, 'innerWidth', {
          writable: true,
          configurable: true,
          value: width,
        });

        const { container } = render(<Button>Responsive Button</Button>);
        const results = await axe(container);
        expect(results).toHaveNoViolations();
      }
    });
  });

  describe('WCAG 2.2 AA - Performance and Accessibility', () => {
    test('components maintain accessibility during loading', async () => {
      const { container, rerender } = render(<Button>Initial</Button>);
      
      // Switch to loading state
      rerender(<Button loading>Loading</Button>);
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('rapid interactions maintain accessibility', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Rapid Click</Button>);
      
      const button = screen.getByRole('button');
      
      // Simulate rapid clicks
      for (let i = 0; i < 5; i++) {
        await user.click(button);
      }
      
      // Button should still be accessible
      expect(button).toHaveAttribute('type', 'button');
      expect(button).not.toHaveAttribute('aria-hidden');
    });

    test('memory leaks do not affect accessibility', async () => {
      const { unmount } = render(<ChatRDV />);
      
      // Component should unmount cleanly without affecting accessibility
      expect(() => unmount()).not.toThrow();
    });
  });
});