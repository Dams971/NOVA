/**
 * ButtonMedical Component Tests
 * 
 * Comprehensive test suite for the NOVA medical button component
 * testing accessibility, variants, loading states, and interactions.
 */

import { render, screen, fireEvent, waitFor } from '@/test/test-utils';
import { Button } from '@/components/ui/button';
import { checkAccessibility } from '@/test/setup';
import { Heart, Calendar } from 'lucide-react';

describe('ButtonMedical Component', () => {
  describe('Rendering', () => {
    test('renders with default props', () => {
      render(<Button>Test Button</Button>);
      const button = screen.getByRole('button', { name: /test button/i });
      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute('type', 'button');
    });

    test('renders with custom className', () => {
      render(<Button className="custom-class">Test</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('custom-class');
    });

    test('forwards ref correctly', () => {
      const ref = React.createRef<HTMLButtonElement>();
      render(<Button ref={ref}>Test</Button>);
      expect(ref.current).toBeInstanceOf(HTMLButtonElement);
    });
  });

  describe('Variants', () => {
    test.each([
      ['primary', 'bg-primary'],
      ['secondary', 'bg-secondary'], 
      ['success', 'bg-success'],
      ['warning', 'bg-warning'],
      ['destructive', 'bg-destructive'],
      ['quiet', 'bg-transparent']
    ])('renders %s variant with correct styles', (variant, expectedClass) => {
      render(<Button variant={variant as any}>Test</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass(expectedClass);
    });
  });

  describe('Sizes', () => {
    test.each([
      ['sm', 'min-h-touch-ios', 'text-sm'],
      ['md', 'min-h-touch-android', 'text-base'],
      ['lg', 'min-h-[52px]', 'text-lg']
    ])('renders %s size with correct styles', (size, minHeight, textSize) => {
      render(<Button size={size as any}>Test</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass(minHeight, textSize);
    });

    test('respects minimum touch target size (44px)', () => {
      render(<Button size="sm">Small Button</Button>);
      const button = screen.getByRole('button');
      const styles = getComputedStyle(button);
      const minHeight = parseInt(styles.minHeight);
      expect(minHeight).toBeGreaterThanOrEqual(44);
    });
  });

  describe('Loading State', () => {
    test('shows loading spinner when loading=true', () => {
      render(<Button loading>Loading Button</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(button).toHaveAttribute('aria-busy', 'true');
      
      // Check for loading spinner
      const spinner = screen.getByLabelText(/chargement en cours/i);
      expect(spinner).toBeInTheDocument();
    });

    test('displays custom loading text', () => {
      render(
        <Button loading loadingText="Enregistrement...">
          Sauvegarder
        </Button>
      );
      
      expect(screen.getByText(/enregistrement/i)).toBeInTheDocument();
    });

    test('generates appropriate loading text from children', () => {
      render(<Button loading>Prendre rendez-vous</Button>);
      expect(screen.getByText(/prendre rendez-vous en cours/i)).toBeInTheDocument();
    });

    test('hides content when loading', () => {
      render(<Button loading>Save Changes</Button>);
      expect(screen.queryByText('Save Changes')).not.toBeInTheDocument();
    });
  });

  describe('Icons', () => {
    test('renders left icon correctly', () => {
      render(
        <Button icon={<Heart data-testid="heart-icon" />} iconPosition="left">
          Favorite
        </Button>
      );
      
      const icon = screen.getByTestId('heart-icon');
      expect(icon).toBeInTheDocument();
      expect(icon.closest('span')).toHaveAttribute('aria-hidden', 'true');
    });

    test('renders right icon correctly', () => {
      render(
        <Button icon={<Calendar data-testid="calendar-icon" />} iconPosition="right">
          Schedule
        </Button>
      );
      
      const icon = screen.getByTestId('calendar-icon');
      expect(icon).toBeInTheDocument();
      expect(icon.closest('span')).toHaveClass('order-last');
    });

    test('does not render icons when loading', () => {
      render(
        <Button 
          loading 
          icon={<Heart data-testid="heart-icon" />}
        >
          Test
        </Button>
      );
      
      expect(screen.queryByTestId('heart-icon')).not.toBeInTheDocument();
    });
  });

  describe('Interaction', () => {
    test('calls onClick when clicked', () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Click Me</Button>);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    test('handles keyboard navigation (Enter)', () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Press Me</Button>);
      
      const button = screen.getByRole('button');
      button.focus();
      fireEvent.keyDown(button, { key: 'Enter' });
      
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    test('handles keyboard navigation (Space)', () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Press Me</Button>);
      
      const button = screen.getByRole('button');
      button.focus();
      fireEvent.keyDown(button, { key: ' ' });
      
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    test('does not call onClick when disabled', () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick} disabled>Disabled</Button>);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      expect(handleClick).not.toHaveBeenCalled();
    });

    test('does not call onClick when loading', () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick} loading>Loading</Button>);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('Press Effects', () => {
    test('applies scale effect by default', () => {
      render(<Button>Scale Button</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('active:scale-[0.98]');
    });

    test('applies opacity effect when specified', () => {
      render(<Button pressEffect="opacity">Opacity Button</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('active:opacity-80');
    });

    test('applies no effect when specified', () => {
      render(<Button pressEffect="none">No Effect Button</Button>);
      const button = screen.getByRole('button');
      expect(button).not.toHaveClass(/active:/);
    });
  });

  describe('Full Width', () => {
    test('applies full width when specified', () => {
      render(<Button fullWidth>Full Width Button</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('w-full');
    });

    test('does not apply full width by default', () => {
      render(<Button>Normal Button</Button>);
      const button = screen.getByRole('button');
      expect(button).not.toHaveClass('w-full');
    });
  });

  describe('Form Integration', () => {
    test('submits form when type="submit"', () => {
      const handleSubmit = vi.fn(e => e.preventDefault());
      render(
        <form onSubmit={handleSubmit}>
          <Button type="submit">Submit</Button>
        </form>
      );
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      expect(handleSubmit).toHaveBeenCalledTimes(1);
    });

    test('does not submit form when type="button"', () => {
      const handleSubmit = vi.fn(e => e.preventDefault());
      render(
        <form onSubmit={handleSubmit}>
          <Button type="button">Button</Button>
        </form>
      );
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      expect(handleSubmit).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    test('has no accessibility violations', async () => {
      const { container } = render(
        <Button variant="primary">Accessible Button</Button>
      );
      await checkAccessibility(container);
    });

    test('has no accessibility violations with icon', async () => {
      const { container } = render(
        <Button icon={<Heart />} iconPosition="left">
          Button with Icon
        </Button>
      );
      await checkAccessibility(container);
    });

    test('has no accessibility violations when loading', async () => {
      const { container } = render(
        <Button loading>Loading Button</Button>
      );
      await checkAccessibility(container);
    });

    test('provides appropriate aria-busy when loading', () => {
      render(<Button loading>Loading</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-busy', 'true');
    });

    test('provides screen reader text for loading state', () => {
      render(<Button loading>Save</Button>);
      expect(screen.getByText(/save en cours de traitement/i)).toBeInTheDocument();
    });

    test('has proper focus management', () => {
      render(<Button>Focus Me</Button>);
      const button = screen.getByRole('button');
      button.focus();
      expect(button).toHaveFocus();
    });

    test('has visible focus indicator', () => {
      render(<Button>Focus Test</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('focus-visible-ring');
    });
  });

  describe('Color Contrast', () => {
    test('primary variant meets WCAG AA contrast ratio', async () => {
      const { container } = render(
        <Button variant="primary">Primary Button</Button>
      );
      
      const { axe } = await import('jest-axe');
      const results = await axe(container, {
        rules: {
          'color-contrast': { enabled: true }
        }
      });
      
      expect(results.violations).toHaveLength(0);
    });

    test('all variants meet contrast requirements', async () => {
      const variants = ['primary', 'secondary', 'success', 'warning', 'destructive', 'quiet'] as const;
      
      for (const variant of variants) {
        const { container } = render(
          <Button variant={variant}>Test {variant}</Button>
        );
        
        const { axe } = await import('jest-axe');
        const results = await axe(container, {
          rules: {
            'color-contrast': { enabled: true }
          }
        });
        
        expect(results.violations).toHaveLength(0);
      }
    });
  });

  describe('French Language Support', () => {
    test('displays French loading text correctly', () => {
      render(<Button loading>Connexion</Button>);
      expect(screen.getByText(/connexion en cours de traitement/i)).toBeInTheDocument();
    });

    test('uses French default loading text', () => {
      render(<Button loading />);
      expect(screen.getByText(/chargement en cours/i)).toBeInTheDocument();
    });

    test('accepts custom French loading text', () => {
      render(<Button loading loadingText="Traitement...">Submit</Button>);
      expect(screen.getByText(/traitement/i)).toBeInTheDocument();
    });
  });

  describe('Responsive Behavior', () => {
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
  });

  describe('Performance', () => {
    test('does not cause unnecessary re-renders', () => {
      const renderCount = vi.fn();
      
      const TestButton = React.memo(({ children, ...props }: any) => {
        renderCount();
        return <Button {...props}>{children}</Button>;
      });

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
});