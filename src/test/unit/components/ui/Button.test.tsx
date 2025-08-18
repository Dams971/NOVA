/**
 * Button Component Unit Tests
 * 
 * Comprehensive tests for the NOVA Button component including:
 * - All variants and sizes
 * - Accessibility compliance
 * - Loading states
 * - Keyboard navigation
 * - French language support
 */

import { CheckIcon, UserIcon } from 'lucide-react';
import { describe, it, expect, vi } from 'vitest';
import Button from '@/components/ui/forms/Button';
import { render, screen, userEvent, checkAccessibility } from '@/test/test-utils';

describe('Button Component', () => {
  describe('Basic Rendering', () => {
    it('should render with default props', () => {
      render(<Button>Cliquer ici</Button>);
      
      const button = screen.getByRole('button', { name: 'Cliquer ici' });
      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute('type', 'button');
    });

    it('should render with custom type', () => {
      render(<Button type="submit">Soumettre</Button>);
      
      const button = screen.getByRole('button', { name: 'Soumettre' });
      expect(button).toHaveAttribute('type', 'submit');
    });

    it('should render with custom className', () => {
      render(<Button className="custom-class">Test</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('custom-class');
    });

    it('should forward ref correctly', () => {
      const ref = vi.fn();
      render(<Button ref={ref}>Test</Button>);
      
      expect(ref).toHaveBeenCalledWith(expect.any(HTMLButtonElement));
    });
  });

  describe('Variants', () => {
    const variants = [
      'primary',
      'secondary', 
      'success',
      'warning',
      'destructive',
      'quiet'
    ] as const;

    variants.forEach(variant => {
      it(`should render ${variant} variant correctly`, () => {
        render(<Button variant={variant}>Test {variant}</Button>);
        
        const button = screen.getByRole('button');
        expect(button).toBeInTheDocument();
        // The exact class checking would depend on your CSS implementation
        expect(button).toHaveClass(); // At least has some classes
      });
    });
  });

  describe('Sizes', () => {
    const sizes = ['sm', 'md', 'lg'] as const;

    sizes.forEach(size => {
      it(`should render ${size} size correctly`, () => {
        render(<Button size={size}>Test {size}</Button>);
        
        const button = screen.getByRole('button');
        expect(button).toBeInTheDocument();
        
        // Check minimum touch target sizes
        const computedStyle = window.getComputedStyle(button);
        const minHeight = parseInt(computedStyle.minHeight);
        
        if (size === 'sm') {
          expect(minHeight).toBeGreaterThanOrEqual(44); // iOS touch target
        } else if (size === 'md') {
          expect(minHeight).toBeGreaterThanOrEqual(48); // Android touch target
        } else if (size === 'lg') {
          expect(minHeight).toBeGreaterThanOrEqual(52);
        }
      });
    });
  });

  describe('Loading State', () => {
    it('should show loading spinner when loading', () => {
      render(<Button loading>Enregistrer</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-busy', 'true');
      expect(button).toBeDisabled();
      
      // Should have loading spinner
      expect(screen.getByRole('img', { hidden: true })).toBeInTheDocument(); // Lucide icons have img role
    });

    it('should show custom loading text', () => {
      render(
        <Button loading loadingText="Sauvegarde en cours...">
          Enregistrer
        </Button>
      );
      
      expect(screen.getByText('Sauvegarde en cours...', { exact: false })).toBeInTheDocument();
    });

    it('should generate French loading text from children', () => {
      render(<Button loading>Enregistrer</Button>);
      
      // Should generate loading text based on button text
      expect(screen.getByText('Enregistrer en cours de traitement...', { exact: false })).toBeInTheDocument();
    });

    it('should use default French loading text for non-string children', () => {
      render(
        <Button loading>
          <span>Complex content</span>
        </Button>
      );
      
      expect(screen.getByText('Chargement en cours...', { exact: false })).toBeInTheDocument();
    });

    it('should hide normal content when loading', () => {
      render(<Button loading>Enregistrer</Button>);
      
      // Normal content should not be visible
      expect(screen.queryByText('Enregistrer')).not.toBeInTheDocument();
    });
  });

  describe('Icons', () => {
    it('should render icon on the left by default', () => {
      render(
        <Button icon={<CheckIcon data-testid="check-icon" />}>
          Confirmer
        </Button>
      );
      
      const icon = screen.getByTestId('check-icon');
      const button = screen.getByRole('button');
      
      expect(icon).toBeInTheDocument();
      expect(button).toContainElement(icon);
    });

    it('should render icon on the right when specified', () => {
      render(
        <Button 
          icon={<UserIcon data-testid="user-icon" />}
          iconPosition="right"
        >
          Profil
        </Button>
      );
      
      const icon = screen.getByTestId('user-icon');
      expect(icon).toBeInTheDocument();
      
      // Check that icon comes after text (simplified check)
      const buttonText = screen.getByText('Profil');
      expect(buttonText).toBeInTheDocument();
    });

    it('should hide icon when loading', () => {
      render(
        <Button 
          loading 
          icon={<CheckIcon data-testid="check-icon" />}
        >
          Confirmer
        </Button>
      );
      
      expect(screen.queryByTestId('check-icon')).not.toBeInTheDocument();
    });

    it('should mark icon as decorative for accessibility', () => {
      render(
        <Button icon={<CheckIcon data-testid="check-icon" />}>
          Confirmer
        </Button>
      );
      
      const iconContainer = screen.getByTestId('check-icon').parentElement;
      expect(iconContainer).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('Full Width', () => {
    it('should take full width when specified', () => {
      render(<Button fullWidth>Bouton pleine largeur</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('w-full');
    });
  });

  describe('Disabled State', () => {
    it('should be disabled when disabled prop is true', () => {
      render(<Button disabled>Bouton désactivé</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('should be disabled when loading', () => {
      render(<Button loading>Chargement</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });
  });

  describe('Press Effects', () => {
    const pressEffects = ['scale', 'opacity', 'none'] as const;

    pressEffects.forEach(effect => {
      it(`should apply ${effect} press effect`, () => {
        render(<Button pressEffect={effect}>Test {effect}</Button>);
        
        const button = screen.getByRole('button');
        expect(button).toBeInTheDocument();
        // Visual effects would be tested in visual regression tests
      });
    });
  });

  describe('Accessibility', () => {
    it('should be accessible with default props', async () => {
      const { container } = render(<Button>Bouton accessible</Button>);
      await checkAccessibility(container);
    });

    it('should be accessible in all variants', async () => {
      const variants = ['primary', 'secondary', 'success', 'warning', 'destructive', 'quiet'] as const;
      
      for (const variant of variants) {
        const { container } = render(<Button variant={variant}>Test {variant}</Button>);
        await checkAccessibility(container);
      }
    });

    it('should be accessible when loading', async () => {
      const { container } = render(<Button loading>Chargement</Button>);
      await checkAccessibility(container);
    });

    it('should be accessible when disabled', async () => {
      const { container } = render(<Button disabled>Désactivé</Button>);
      await checkAccessibility(container);
    });

    it('should have proper ARIA attributes when loading', () => {
      render(<Button loading id="test-button">Enregistrer</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-busy', 'true');
      expect(button).toHaveAttribute('aria-describedby', 'test-button-loading');
    });
  });

  describe('Keyboard Navigation', () => {
    it('should be focusable with keyboard', async () => {
      const user = userEvent.setup();
      render(<Button>Focusable</Button>);
      
      const button = screen.getByRole('button');
      
      await user.tab();
      expect(button).toHaveFocus();
    });

    it('should be activated with Enter key', async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();
      
      render(<Button onClick={onClick}>Appuyer sur Entrée</Button>);
      
      const button = screen.getByRole('button');
      await user.tab();
      await user.keyboard('{Enter}');
      
      expect(onClick).toHaveBeenCalledOnce();
    });

    it('should be activated with Space key', async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();
      
      render(<Button onClick={onClick}>Appuyer sur Espace</Button>);
      
      const button = screen.getByRole('button');
      await user.tab();
      await user.keyboard(' ');
      
      expect(onClick).toHaveBeenCalledOnce();
    });

    it('should not be focusable when disabled', async () => {
      const user = userEvent.setup();
      render(<Button disabled>Non focusable</Button>);
      
      const button = screen.getByRole('button');
      
      await user.tab();
      expect(button).not.toHaveFocus();
    });
  });

  describe('Mouse Interaction', () => {
    it('should call onClick when clicked', async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();
      
      render(<Button onClick={onClick}>Cliquer</Button>);
      
      const button = screen.getByRole('button');
      await user.click(button);
      
      expect(onClick).toHaveBeenCalledOnce();
    });

    it('should not call onClick when disabled', async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();
      
      render(<Button onClick={onClick} disabled>Ne pas cliquer</Button>);
      
      const button = screen.getByRole('button');
      await user.click(button);
      
      expect(onClick).not.toHaveBeenCalled();
    });

    it('should not call onClick when loading', async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();
      
      render(<Button onClick={onClick} loading>Chargement</Button>);
      
      const button = screen.getByRole('button');
      await user.click(button);
      
      expect(onClick).not.toHaveBeenCalled();
    });
  });

  describe('French Language Support', () => {
    it('should display French text correctly', () => {
      render(<Button>Réserver un rendez-vous</Button>);
      
      expect(screen.getByText('Réserver un rendez-vous')).toBeInTheDocument();
    });

    it('should handle French special characters', () => {
      render(<Button>Créer un événement</Button>);
      
      expect(screen.getByText('Créer un événement')).toBeInTheDocument();
    });

    it('should use French loading messages', () => {
      render(<Button loading>Sauvegarder</Button>);
      
      expect(screen.getByText('Sauvegarder en cours de traitement...', { exact: false })).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined children gracefully', () => {
      render(<Button>{undefined}</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      expect(button).toBeEmptyDOMElement();
    });

    it('should handle null children gracefully', () => {
      render(<Button>{null}</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('should handle very long text', () => {
      const longText = 'Ceci est un texte très long qui pourrait déborder du bouton et causer des problèmes de mise en page';
      render(<Button>{longText}</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      expect(screen.getByText(longText)).toBeInTheDocument();
    });

    it('should handle multiple icons gracefully', () => {
      render(
        <Button icon={<><CheckIcon /><UserIcon /></>}>
          Multiple icons
        </Button>
      );
      
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });
  });
});