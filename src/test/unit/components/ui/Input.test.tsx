/**
 * Input Component Unit Tests
 * 
 * Comprehensive tests for the NOVA Input component including:
 * - All variants and sizes
 * - Accessibility compliance
 * - Validation states
 * - Password toggle functionality
 * - French language support
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, userEvent, checkAccessibility } from '@/test/test-utils';
import Input from '@/components/ui/forms/Input';
import { UserIcon, SearchIcon } from 'lucide-react';

describe('Input Component', () => {
  describe('Basic Rendering', () => {
    it('should render with default props', () => {
      render(<Input />);
      
      const input = screen.getByRole('textbox');
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute('type', 'text');
    });

    it('should render with custom type', () => {
      render(<Input type="email" />);
      
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('type', 'email');
    });

    it('should render with placeholder', () => {
      render(<Input placeholder="Entrez votre nom" />);
      
      const input = screen.getByPlaceholderText('Entrez votre nom');
      expect(input).toBeInTheDocument();
    });

    it('should forward ref correctly', () => {
      const ref = vi.fn();
      render(<Input ref={ref} />);
      
      expect(ref).toHaveBeenCalledWith(expect.any(HTMLInputElement));
    });
  });

  describe('Label and Required', () => {
    it('should render with label', () => {
      render(<Input label="Nom complet" />);
      
      const label = screen.getByText('Nom complet');
      const input = screen.getByRole('textbox');
      
      expect(label).toBeInTheDocument();
      expect(label).toHaveAttribute('for', input.id);
    });

    it('should show required indicator when required', () => {
      render(<Input label="Email" required />);
      
      const requiredIndicator = screen.getByText('*');
      expect(requiredIndicator).toBeInTheDocument();
      expect(requiredIndicator).toHaveAttribute('aria-label', 'requis');
      
      const input = screen.getByRole('textbox');
      expect(input).toBeRequired();
    });

    it('should not show required indicator when not required', () => {
      render(<Input label="Nom optionnel" />);
      
      expect(screen.queryByText('*')).not.toBeInTheDocument();
    });
  });

  describe('Variants', () => {
    const variants = ['default', 'error', 'success', 'warning'] as const;

    variants.forEach(variant => {
      it(`should render ${variant} variant correctly`, () => {
        render(<Input variant={variant} />);
        
        const input = screen.getByRole('textbox');
        expect(input).toBeInTheDocument();
        
        if (variant === 'error') {
          expect(input).toHaveAttribute('aria-invalid', 'true');
        } else {
          expect(input).toHaveAttribute('aria-invalid', 'false');
        }
      });
    });
  });

  describe('Sizes', () => {
    const sizes = ['sm', 'md', 'lg'] as const;

    sizes.forEach(size => {
      it(`should render ${size} size correctly`, () => {
        render(<Input size={size} />);
        
        const input = screen.getByRole('textbox');
        expect(input).toBeInTheDocument();
        
        // Check minimum touch target sizes
        const computedStyle = window.getComputedStyle(input);
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

  describe('Validation States and Messages', () => {
    it('should show error message and set error variant', () => {
      render(<Input error="Ce champ est requis" />);
      
      const input = screen.getByRole('textbox');
      const errorMessage = screen.getByRole('alert');
      
      expect(input).toHaveAttribute('aria-invalid', 'true');
      expect(errorMessage).toHaveTextContent('Ce champ est requis');
      expect(input).toHaveAttribute('aria-describedby', expect.stringContaining('error'));
    });

    it('should show success message and set success variant', () => {
      render(<Input success="Email valide" />);
      
      const input = screen.getByRole('textbox');
      const successMessage = screen.getByText('Email valide');
      
      expect(input).toHaveAttribute('aria-invalid', 'false');
      expect(successMessage).toBeInTheDocument();
      expect(input).toHaveAttribute('aria-describedby', expect.stringContaining('success'));
    });

    it('should show warning message and set warning variant', () => {
      render(<Input warning="Mot de passe faible" />);
      
      const input = screen.getByRole('textbox');
      const warningMessage = screen.getByText('Mot de passe faible');
      
      expect(input).toHaveAttribute('aria-invalid', 'false');
      expect(warningMessage).toBeInTheDocument();
      expect(input).toHaveAttribute('aria-describedby', expect.stringContaining('warning'));
    });

    it('should show helper text', () => {
      render(<Input helperText="Format: nom@example.com" />);
      
      const input = screen.getByRole('textbox');
      const helperText = screen.getByText('Format: nom@example.com');
      
      expect(helperText).toBeInTheDocument();
      expect(input).toHaveAttribute('aria-describedby', expect.stringContaining('helper'));
    });

    it('should prioritize error over success and warning', () => {
      render(
        <Input 
          error="Erreur critique"
          success="Succès"
          warning="Attention"
        />
      );
      
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-invalid', 'true');
      expect(screen.getByRole('alert')).toHaveTextContent('Erreur critique');
      expect(screen.queryByText('Succès')).not.toBeInTheDocument();
      expect(screen.queryByText('Attention')).not.toBeInTheDocument();
    });

    it('should prioritize success over warning', () => {
      render(
        <Input 
          success="Validation réussie"
          warning="Attention mineure"
        />
      );
      
      expect(screen.getByText('Validation réussie')).toBeInTheDocument();
      expect(screen.queryByText('Attention mineure')).not.toBeInTheDocument();
    });
  });

  describe('Icons', () => {
    it('should render left icon', () => {
      render(<Input leftIcon={<UserIcon data-testid="user-icon" />} />);
      
      const icon = screen.getByTestId('user-icon');
      expect(icon).toBeInTheDocument();
      
      const iconContainer = icon.closest('[aria-hidden="true"]');
      expect(iconContainer).toBeInTheDocument();
    });

    it('should render right icon', () => {
      render(<Input rightIcon={<SearchIcon data-testid="search-icon" />} />);
      
      const icon = screen.getByTestId('search-icon');
      expect(icon).toBeInTheDocument();
    });

    it('should render status icons for each variant', () => {
      const { rerender } = render(<Input error="Erreur" />);
      expect(screen.getByRole('img', { hidden: true })).toBeInTheDocument(); // Status icon
      
      rerender(<Input success="Succès" />);
      expect(screen.getByRole('img', { hidden: true })).toBeInTheDocument();
      
      rerender(<Input warning="Attention" />);
      expect(screen.getByRole('img', { hidden: true })).toBeInTheDocument();
    });
  });

  describe('Password Toggle', () => {
    it('should show password toggle button for password inputs', () => {
      render(<Input type="password" showPasswordToggle />);
      
      const toggleButton = screen.getByRole('button', { name: 'Afficher le mot de passe' });
      expect(toggleButton).toBeInTheDocument();
    });

    it('should toggle password visibility', async () => {
      const user = userEvent.setup();
      render(<Input type="password" showPasswordToggle />);
      
      const input = screen.getByRole('textbox', { hidden: true }); // Password input
      const toggleButton = screen.getByRole('button', { name: 'Afficher le mot de passe' });
      
      expect(input).toHaveAttribute('type', 'password');
      
      await user.click(toggleButton);
      
      expect(input).toHaveAttribute('type', 'text');
      expect(screen.getByRole('button', { name: 'Masquer le mot de passe' })).toBeInTheDocument();
      
      await user.click(toggleButton);
      
      expect(input).toHaveAttribute('type', 'password');
    });

    it('should not show password toggle for non-password inputs', () => {
      render(<Input type="text" showPasswordToggle />);
      
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('should not show password toggle when showPasswordToggle is false', () => {
      render(<Input type="password" showPasswordToggle={false} />);
      
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });
  });

  describe('Full Width', () => {
    it('should take full width when specified', () => {
      render(<Input fullWidth />);
      
      const wrapper = screen.getByRole('textbox').closest('div');
      expect(wrapper).toHaveClass('w-full');
    });
  });

  describe('Disabled State', () => {
    it('should be disabled when disabled prop is true', () => {
      render(<Input disabled />);
      
      const input = screen.getByRole('textbox');
      expect(input).toBeDisabled();
    });

    it('should not interact with password toggle when disabled', async () => {
      const user = userEvent.setup();
      render(<Input type="password" showPasswordToggle disabled />);
      
      const toggleButton = screen.getByRole('button', { name: 'Afficher le mot de passe' });
      const input = screen.getByRole('textbox', { hidden: true });
      
      await user.click(toggleButton);
      
      // Password should still be hidden because input is disabled
      expect(input).toHaveAttribute('type', 'password');
    });
  });

  describe('Accessibility', () => {
    it('should be accessible with default props', async () => {
      const { container } = render(<Input />);
      await checkAccessibility(container);
    });

    it('should be accessible with label', async () => {
      const { container } = render(<Input label="Nom d'utilisateur" />);
      await checkAccessibility(container);
    });

    it('should be accessible with error message', async () => {
      const { container } = render(<Input error="Ce champ est requis" />);
      await checkAccessibility(container);
    });

    it('should be accessible with all props', async () => {
      const { container } = render(
        <Input
          label="Mot de passe"
          type="password"
          showPasswordToggle
          required
          helperText="Au moins 8 caractères"
        />
      );
      await checkAccessibility(container);
    });

    it('should have proper ARIA attributes', () => {
      render(
        <Input
          label="Email"
          error="Format invalide"
          helperText="Format requis: nom@exemple.com"
          required
        />
      );
      
      const input = screen.getByRole('textbox');
      
      expect(input).toHaveAttribute('aria-invalid', 'true');
      expect(input).toHaveAttribute('aria-describedby');
      expect(input).toBeRequired();
      
      const errorMessage = screen.getByRole('alert');
      expect(errorMessage).toHaveAttribute('aria-live', 'polite');
    });

    it('should generate unique IDs for multiple inputs', () => {
      render(
        <div>
          <Input label="Prénom" />
          <Input label="Nom" />
        </div>
      );
      
      const inputs = screen.getAllByRole('textbox');
      expect(inputs[0].id).not.toBe(inputs[1].id);
    });
  });

  describe('Keyboard Navigation', () => {
    it('should be focusable with keyboard', async () => {
      const user = userEvent.setup();
      render(<Input />);
      
      const input = screen.getByRole('textbox');
      
      await user.tab();
      expect(input).toHaveFocus();
    });

    it('should allow typing', async () => {
      const user = userEvent.setup();
      render(<Input />);
      
      const input = screen.getByRole('textbox');
      
      await user.type(input, 'Test text');
      expect(input).toHaveValue('Test text');
    });

    it('should handle password toggle with keyboard', async () => {
      const user = userEvent.setup();
      render(<Input type="password" showPasswordToggle />);
      
      const input = screen.getByRole('textbox', { hidden: true });
      const toggleButton = screen.getByRole('button');
      
      await user.tab(); // Focus input
      await user.tab(); // Focus toggle button
      expect(toggleButton).toHaveFocus();
      
      await user.keyboard('{Enter}');
      expect(input).toHaveAttribute('type', 'text');
    });

    it('should not be focusable when disabled', async () => {
      const user = userEvent.setup();
      render(<Input disabled />);
      
      const input = screen.getByRole('textbox');
      
      await user.tab();
      expect(input).not.toHaveFocus();
    });
  });

  describe('French Language Support', () => {
    it('should display French labels correctly', () => {
      render(<Input label="Numéro de téléphone" />);
      
      expect(screen.getByText('Numéro de téléphone')).toBeInTheDocument();
    });

    it('should handle French special characters in values', async () => {
      const user = userEvent.setup();
      render(<Input />);
      
      const input = screen.getByRole('textbox');
      
      await user.type(input, 'François Müller');
      expect(input).toHaveValue('François Müller');
    });

    it('should display French error messages', () => {
      render(<Input error="L'adresse e-mail n'est pas valide" />);
      
      expect(screen.getByText("L'adresse e-mail n'est pas valide")).toBeInTheDocument();
    });

    it('should use French password toggle labels', () => {
      render(<Input type="password" showPasswordToggle />);
      
      expect(screen.getByRole('button', { name: 'Afficher le mot de passe' })).toBeInTheDocument();
    });

    it('should use French required indicator label', () => {
      render(<Input label="Nom" required />);
      
      const requiredIndicator = screen.getByLabelText('requis');
      expect(requiredIndicator).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined value gracefully', () => {
      render(<Input value={undefined} />);
      
      const input = screen.getByRole('textbox');
      expect(input).toBeInTheDocument();
    });

    it('should handle null value gracefully', () => {
      render(<Input value={null as any} />);
      
      const input = screen.getByRole('textbox');
      expect(input).toBeInTheDocument();
    });

    it('should handle empty string value', () => {
      render(<Input value="" />);
      
      const input = screen.getByRole('textbox');
      expect(input).toHaveValue('');
    });

    it('should handle very long values', async () => {
      const user = userEvent.setup();
      const longValue = 'A'.repeat(1000);
      
      render(<Input />);
      
      const input = screen.getByRole('textbox');
      await user.type(input, longValue);
      
      expect(input).toHaveValue(longValue);
    });

    it('should handle special characters in labels and messages', () => {
      render(
        <Input
          label="Montant (€)"
          error="Le montant doit être ≥ 0"
          helperText="Utilisez le format: 123,45 €"
        />
      );
      
      expect(screen.getByText('Montant (€)')).toBeInTheDocument();
      expect(screen.getByText('Le montant doit être ≥ 0')).toBeInTheDocument();
      expect(screen.getByText('Utilisez le format: 123,45 €')).toBeInTheDocument();
    });
  });

  describe('Event Handlers', () => {
    it('should call onChange when value changes', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      
      render(<Input onChange={onChange} />);
      
      const input = screen.getByRole('textbox');
      await user.type(input, 'test');
      
      expect(onChange).toHaveBeenCalled();
    });

    it('should call onFocus when focused', async () => {
      const user = userEvent.setup();
      const onFocus = vi.fn();
      
      render(<Input onFocus={onFocus} />);
      
      const input = screen.getByRole('textbox');
      await user.click(input);
      
      expect(onFocus).toHaveBeenCalledOnce();
    });

    it('should call onBlur when blurred', async () => {
      const user = userEvent.setup();
      const onBlur = vi.fn();
      
      render(<Input onBlur={onBlur} />);
      
      const input = screen.getByRole('textbox');
      await user.click(input);
      await user.tab(); // Move focus away
      
      expect(onBlur).toHaveBeenCalledOnce();
    });
  });
});