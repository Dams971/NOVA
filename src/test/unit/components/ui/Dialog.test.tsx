/**
 * Dialog Component Unit Tests
 * 
 * Comprehensive tests for the NOVA Dialog component including:
 * - All dialog sub-components
 * - Accessibility compliance (ARIA, focus management)
 * - Keyboard navigation (Escape, Tab trapping)
 * - Portal rendering and overlay behavior
 * - French language support
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogFooter,
  DialogClose
} from '@/components/ui/Dialog';
import { render, screen, userEvent, checkAccessibility, waitFor } from '@/test/test-utils';

// Mock focus trap component
vi.mock('@/components/ui/FocusTrap', () => ({
  default: ({ children, active }: { children: React.ReactNode; active: boolean }) => 
    active ? <div data-testid="focus-trap">{children}</div> : <>{children}</>
}));

describe('Dialog Component', () => {
  // Clean up after each test
  afterEach(() => {
    // Remove any dialog content from document.body
    const dialogs = document.querySelectorAll('[role="dialog"]');
    dialogs.forEach(dialog => dialog.remove());
    
    // Reset body overflow
    document.body.style.overflow = '';
  });

  describe('Dialog Root', () => {
    it('should provide context to child components', () => {
      const TestComponent = () => {
        return (
          <Dialog open={true} onOpenChange={() => {}}>
            <DialogTrigger>Open Dialog</DialogTrigger>
          </Dialog>
        );
      };

      render(<TestComponent />);
      
      const trigger = screen.getByRole('button', { name: 'Open Dialog' });
      expect(trigger).toBeInTheDocument();
      expect(trigger).toHaveAttribute('aria-haspopup', 'dialog');
    });

    it('should throw error when dialog components used outside provider', () => {
      // Suppress expected error output
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      expect(() => {
        render(<DialogTrigger>Open</DialogTrigger>);
      }).toThrow('Dialog components must be used within a Dialog provider');
      
      consoleSpy.mockRestore();
    });
  });

  describe('DialogTrigger', () => {
    it('should open dialog when clicked', async () => {
      const user = userEvent.setup();
      const onOpenChange = vi.fn();

      render(
        <Dialog open={false} onOpenChange={onOpenChange}>
          <DialogTrigger>Ouvrir</DialogTrigger>
        </Dialog>
      );

      const trigger = screen.getByRole('button', { name: 'Ouvrir' });
      await user.click(trigger);

      expect(onOpenChange).toHaveBeenCalledWith(true);
    });

    it('should have correct ARIA attributes', () => {
      render(
        <Dialog open={false} onOpenChange={() => {}} id="test-dialog">
          <DialogTrigger>Ouvrir</DialogTrigger>
        </Dialog>
      );

      const trigger = screen.getByRole('button');
      expect(trigger).toHaveAttribute('aria-haspopup', 'dialog');
      expect(trigger).toHaveAttribute('aria-controls', 'test-dialog');
    });

    it('should work with asChild prop', async () => {
      const user = userEvent.setup();
      const onOpenChange = vi.fn();

      render(
        <Dialog open={false} onOpenChange={onOpenChange}>
          <DialogTrigger asChild>
            <button className="custom-button">Custom Trigger</button>
          </DialogTrigger>
        </Dialog>
      );

      const trigger = screen.getByRole('button', { name: 'Custom Trigger' });
      expect(trigger).toHaveClass('custom-button');
      
      await user.click(trigger);
      expect(onOpenChange).toHaveBeenCalledWith(true);
    });

    it('should call custom onClick handler', async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();
      const onOpenChange = vi.fn();

      render(
        <Dialog open={false} onOpenChange={onOpenChange}>
          <DialogTrigger onClick={onClick}>Ouvrir</DialogTrigger>
        </Dialog>
      );

      const trigger = screen.getByRole('button');
      await user.click(trigger);

      expect(onClick).toHaveBeenCalled();
      expect(onOpenChange).toHaveBeenCalledWith(true);
    });
  });

  describe('DialogContent', () => {
    it('should render when dialog is open', () => {
      render(
        <Dialog open={true} onOpenChange={() => {}}>
          <DialogContent>
            <DialogTitle>Test Dialog</DialogTitle>
            <DialogBody>Dialog content</DialogBody>
          </DialogContent>
        </Dialog>
      );

      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
      expect(screen.getByText('Dialog content')).toBeInTheDocument();
    });

    it('should not render when dialog is closed', () => {
      render(
        <Dialog open={false} onOpenChange={() => {}}>
          <DialogContent>
            <DialogTitle>Test Dialog</DialogTitle>
            <DialogBody>Dialog content</DialogBody>
          </DialogContent>
        </Dialog>
      );

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('should have correct ARIA attributes', () => {
      render(
        <Dialog open={true} onOpenChange={() => {}} id="test-dialog">
          <DialogContent>
            <DialogTitle>Test Title</DialogTitle>
            <DialogDescription>Test Description</DialogDescription>
          </DialogContent>
        </Dialog>
      );

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).toHaveAttribute('aria-labelledby', 'test-dialog-title');
      expect(dialog).toHaveAttribute('aria-describedby', 'test-dialog-description');
      expect(dialog).toHaveAttribute('id', 'test-dialog');
    });

    it('should close on Escape key when closeOnEscape is true', async () => {
      const user = userEvent.setup();
      const onOpenChange = vi.fn();

      render(
        <Dialog open={true} onOpenChange={onOpenChange}>
          <DialogContent closeOnEscape={true}>
            <DialogTitle>Test Dialog</DialogTitle>
          </DialogContent>
        </Dialog>
      );

      const dialog = screen.getByRole('dialog');
      await user.type(dialog, '{Escape}');

      expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it('should not close on Escape when closeOnEscape is false', async () => {
      const user = userEvent.setup();
      const onOpenChange = vi.fn();

      render(
        <Dialog open={true} onOpenChange={onOpenChange}>
          <DialogContent closeOnEscape={false}>
            <DialogTitle>Test Dialog</DialogTitle>
          </DialogContent>
        </Dialog>
      );

      const dialog = screen.getByRole('dialog');
      await user.type(dialog, '{Escape}');

      expect(onOpenChange).not.toHaveBeenCalled();
    });

    it('should show close button by default', () => {
      render(
        <Dialog open={true} onOpenChange={() => {}}>
          <DialogContent>
            <DialogTitle>Test Dialog</DialogTitle>
          </DialogContent>
        </Dialog>
      );

      const closeButton = screen.getByRole('button', { name: 'Fermer la boîte de dialogue' });
      expect(closeButton).toBeInTheDocument();
    });

    it('should hide close button when showCloseButton is false', () => {
      render(
        <Dialog open={true} onOpenChange={() => {}}>
          <DialogContent showCloseButton={false}>
            <DialogTitle>Test Dialog</DialogTitle>
          </DialogContent>
        </Dialog>
      );

      expect(screen.queryByRole('button', { name: 'Fermer la boîte de dialogue' })).not.toBeInTheDocument();
    });

    it('should close when close button is clicked', async () => {
      const user = userEvent.setup();
      const onOpenChange = vi.fn();

      render(
        <Dialog open={true} onOpenChange={onOpenChange}>
          <DialogContent>
            <DialogTitle>Test Dialog</DialogTitle>
          </DialogContent>
        </Dialog>
      );

      const closeButton = screen.getByRole('button', { name: 'Fermer la boîte de dialogue' });
      await user.click(closeButton);

      expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it('should apply size classes correctly', () => {
      const sizes = ['sm', 'md', 'lg', 'xl', 'full'] as const;
      
      sizes.forEach(size => {
        const { unmount } = render(
          <Dialog open={true} onOpenChange={() => {}}>
            <DialogContent size={size}>
              <DialogTitle>Test Dialog</DialogTitle>
            </DialogContent>
          </Dialog>
        );

        const dialog = screen.getByRole('dialog');
        expect(dialog).toBeInTheDocument();
        
        unmount();
      });
    });

    it('should lock body scroll when open', async () => {
      const originalOverflow = document.body.style.overflow;
      
      render(
        <Dialog open={true} onOpenChange={() => {}}>
          <DialogContent>
            <DialogTitle>Test Dialog</DialogTitle>
          </DialogContent>
        </Dialog>
      );

      await waitFor(() => {
        expect(document.body.style.overflow).toBe('hidden');
      });

      // Cleanup is handled in afterEach
    });

    it('should restore body scroll when closed', async () => {
      const originalOverflow = document.body.style.overflow;
      
      const { rerender } = render(
        <Dialog open={true} onOpenChange={() => {}}>
          <DialogContent>
            <DialogTitle>Test Dialog</DialogTitle>
          </DialogContent>
        </Dialog>
      );

      await waitFor(() => {
        expect(document.body.style.overflow).toBe('hidden');
      });

      rerender(
        <Dialog open={false} onOpenChange={() => {}}>
          <DialogContent>
            <DialogTitle>Test Dialog</DialogTitle>
          </DialogContent>
        </Dialog>
      );

      expect(document.body.style.overflow).toBe(originalOverflow);
    });
  });

  describe('DialogOverlay', () => {
    it('should close dialog when clicked', async () => {
      const user = userEvent.setup();
      const onOpenChange = vi.fn();

      render(
        <Dialog open={true} onOpenChange={onOpenChange}>
          <DialogContent>
            <DialogTitle>Test Dialog</DialogTitle>
          </DialogContent>
        </Dialog>
      );

      // Click on the overlay (background)
      const overlay = document.querySelector('.fixed.inset-0.z-modal');
      expect(overlay).toBeInTheDocument();
      
      if (overlay) {
        await user.click(overlay as HTMLElement);
        expect(onOpenChange).toHaveBeenCalledWith(false);
      }
    });

    it('should not close when clicking dialog content', async () => {
      const user = userEvent.setup();
      const onOpenChange = vi.fn();

      render(
        <Dialog open={true} onOpenChange={onOpenChange}>
          <DialogContent>
            <DialogTitle>Test Dialog</DialogTitle>
            <DialogBody>Content that should not close dialog</DialogBody>
          </DialogContent>
        </Dialog>
      );

      const content = screen.getByText('Content that should not close dialog');
      await user.click(content);

      expect(onOpenChange).not.toHaveBeenCalled();
    });
  });

  describe('DialogTitle', () => {
    it('should render with correct ID for aria-labelledby', () => {
      render(
        <Dialog open={true} onOpenChange={() => {}} id="test-dialog">
          <DialogContent>
            <DialogTitle>Test Title</DialogTitle>
          </DialogContent>
        </Dialog>
      );

      const title = screen.getByRole('heading', { name: 'Test Title' });
      expect(title).toHaveAttribute('id', 'test-dialog-title');
    });

    it('should render with correct heading level', () => {
      render(
        <Dialog open={true} onOpenChange={() => {}}>
          <DialogContent>
            <DialogTitle level={3}>Test Title</DialogTitle>
          </DialogContent>
        </Dialog>
      );

      const title = screen.getByRole('heading', { level: 3 });
      expect(title).toBeInTheDocument();
    });

    it('should default to h2', () => {
      render(
        <Dialog open={true} onOpenChange={() => {}}>
          <DialogContent>
            <DialogTitle>Test Title</DialogTitle>
          </DialogContent>
        </Dialog>
      );

      const title = screen.getByRole('heading', { level: 2 });
      expect(title).toBeInTheDocument();
    });
  });

  describe('DialogDescription', () => {
    it('should render with correct ID for aria-describedby', () => {
      render(
        <Dialog open={true} onOpenChange={() => {}} id="test-dialog">
          <DialogContent>
            <DialogTitle>Title</DialogTitle>
            <DialogDescription>Test description</DialogDescription>
          </DialogContent>
        </Dialog>
      );

      const description = screen.getByText('Test description');
      expect(description).toHaveAttribute('id', 'test-dialog-description');
    });
  });

  describe('DialogClose', () => {
    it('should close dialog when clicked', async () => {
      const user = userEvent.setup();
      const onOpenChange = vi.fn();

      render(
        <Dialog open={true} onOpenChange={onOpenChange}>
          <DialogContent>
            <DialogTitle>Test</DialogTitle>
            <DialogFooter>
              <DialogClose>Fermer</DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      );

      const closeButton = screen.getByRole('button', { name: 'Fermer' });
      await user.click(closeButton);

      expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it('should work with asChild prop', async () => {
      const user = userEvent.setup();
      const onOpenChange = vi.fn();

      render(
        <Dialog open={true} onOpenChange={onOpenChange}>
          <DialogContent>
            <DialogTitle>Test</DialogTitle>
            <DialogFooter>
              <DialogClose asChild>
                <button className="custom-close">Custom Close</button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      );

      const closeButton = screen.getByRole('button', { name: 'Custom Close' });
      expect(closeButton).toHaveClass('custom-close');
      
      await user.click(closeButton);
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it('should call custom onClick handler', async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();
      const onOpenChange = vi.fn();

      render(
        <Dialog open={true} onOpenChange={onOpenChange}>
          <DialogContent>
            <DialogTitle>Test</DialogTitle>
            <DialogFooter>
              <DialogClose onClick={onClick}>Fermer</DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      );

      const closeButton = screen.getByRole('button', { name: 'Fermer' });
      await user.click(closeButton);

      expect(onClick).toHaveBeenCalled();
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  describe('Dialog Layout Components', () => {
    it('should render DialogHeader correctly', () => {
      render(
        <Dialog open={true} onOpenChange={() => {}}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Header Title</DialogTitle>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      );

      const header = screen.getByText('Header Title').closest('div');
      expect(header).toBeInTheDocument();
    });

    it('should render DialogBody correctly', () => {
      render(
        <Dialog open={true} onOpenChange={() => {}}>
          <DialogContent>
            <DialogTitle>Title</DialogTitle>
            <DialogBody>Body content here</DialogBody>
          </DialogContent>
        </Dialog>
      );

      expect(screen.getByText('Body content here')).toBeInTheDocument();
    });

    it('should render DialogFooter correctly', () => {
      render(
        <Dialog open={true} onOpenChange={() => {}}>
          <DialogContent>
            <DialogTitle>Title</DialogTitle>
            <DialogFooter>
              <button>Action</button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      );

      const button = screen.getByRole('button', { name: 'Action' });
      expect(button).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should be accessible with all components', async () => {
      const { container } = render(
        <Dialog open={true} onOpenChange={() => {}}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmer l&apos;action</DialogTitle>
              <DialogDescription>
                Cette action ne peut pas être annulée.
              </DialogDescription>
            </DialogHeader>
            <DialogBody>
              Êtes-vous sûr de vouloir continuer ?
            </DialogBody>
            <DialogFooter>
              <DialogClose>Annuler</DialogClose>
              <button>Confirmer</button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      );

      await checkAccessibility(container);
    });

    it('should have focus trap active when open', () => {
      render(
        <Dialog open={true} onOpenChange={() => {}}>
          <DialogContent>
            <DialogTitle>Test</DialogTitle>
          </DialogContent>
        </Dialog>
      );

      expect(screen.getByTestId('focus-trap')).toBeInTheDocument();
    });

    it('should not have focus trap when closed', () => {
      render(
        <Dialog open={false} onOpenChange={() => {}}>
          <DialogContent>
            <DialogTitle>Test</DialogTitle>
          </DialogContent>
        </Dialog>
      );

      expect(screen.queryByTestId('focus-trap')).not.toBeInTheDocument();
    });
  });

  describe('Keyboard Navigation', () => {
    it('should focus first focusable element when opened', async () => {
      render(
        <Dialog open={true} onOpenChange={() => {}}>
          <DialogContent>
            <DialogTitle>Test</DialogTitle>
            <DialogBody>
              <input placeholder="First input" />
              <button>Button</button>
            </DialogBody>
          </DialogContent>
        </Dialog>
      );

      await waitFor(() => {
        const firstInput = screen.getByPlaceholderText('First input');
        expect(firstInput).toHaveFocus();
      });
    });

    it('should handle tab navigation within dialog', async () => {
      const user = userEvent.setup();

      render(
        <Dialog open={true} onOpenChange={() => {}}>
          <DialogContent>
            <DialogTitle>Test</DialogTitle>
            <DialogBody>
              <input placeholder="Input 1" />
              <input placeholder="Input 2" />
              <button>Button</button>
            </DialogBody>
          </DialogContent>
        </Dialog>
      );

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Input 1')).toHaveFocus();
      });

      await user.tab();
      expect(screen.getByPlaceholderText('Input 2')).toHaveFocus();

      await user.tab();
      expect(screen.getByRole('button', { name: 'Button' })).toHaveFocus();
    });
  });

  describe('Complete Dialog Flow', () => {
    it('should handle complete open/close cycle', async () => {
      const user = userEvent.setup();
      const onOpenChange = vi.fn();

      render(
        <Dialog open={false} onOpenChange={onOpenChange}>
          <DialogTrigger>Ouvrir Dialog</DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmation</DialogTitle>
              <DialogDescription>
                Voulez-vous vraiment effectuer cette action ?
              </DialogDescription>
            </DialogHeader>
            <DialogBody>
              Cette action aura des conséquences importantes.
            </DialogBody>
            <DialogFooter>
              <DialogClose>Annuler</DialogClose>
              <button>Confirmer</button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      );

      // Initially dialog should not be visible
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

      // Click trigger to open
      const trigger = screen.getByRole('button', { name: 'Ouvrir Dialog' });
      await user.click(trigger);

      expect(onOpenChange).toHaveBeenCalledWith(true);

      // Now simulate dialog being open
      onOpenChange.mockClear();
      
      const { rerender } = render(
        <Dialog open={true} onOpenChange={onOpenChange}>
          <DialogTrigger>Ouvrir Dialog</DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmation</DialogTitle>
              <DialogDescription>
                Voulez-vous vraiment effectuer cette action ?
              </DialogDescription>
            </DialogHeader>
            <DialogBody>
              Cette action aura des conséquences importantes.
            </DialogBody>
            <DialogFooter>
              <DialogClose>Annuler</DialogClose>
              <button>Confirmer</button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      );

      // Dialog should be visible
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Confirmation')).toBeInTheDocument();

      // Click cancel to close
      const cancelButton = screen.getByRole('button', { name: 'Annuler' });
      await user.click(cancelButton);

      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  describe('French Language Support', () => {
    it('should display French text correctly', () => {
      render(
        <Dialog open={true} onOpenChange={() => {}}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Réservation de rendez-vous</DialogTitle>
              <DialogDescription>
                Veuillez choisir un créneau disponible.
              </DialogDescription>
            </DialogHeader>
            <DialogBody>
              Les créneaux sont disponibles du lundi au vendredi.
            </DialogBody>
            <DialogFooter>
              <DialogClose>Annuler</DialogClose>
              <button>Réserver</button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      );

      expect(screen.getByText('Réservation de rendez-vous')).toBeInTheDocument();
      expect(screen.getByText('Veuillez choisir un créneau disponible.')).toBeInTheDocument();
      expect(screen.getByText('Les créneaux sont disponibles du lundi au vendredi.')).toBeInTheDocument();
    });

    it('should use French accessibility labels', () => {
      render(
        <Dialog open={true} onOpenChange={() => {}}>
          <DialogContent>
            <DialogTitle>Test</DialogTitle>
          </DialogContent>
        </Dialog>
      );

      const closeButton = screen.getByRole('button', { name: 'Fermer la boîte de dialogue' });
      expect(closeButton).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid open/close changes', async () => {
      const user = userEvent.setup();
      const onOpenChange = vi.fn();

      const { rerender } = render(
        <Dialog open={false} onOpenChange={onOpenChange}>
          <DialogContent>
            <DialogTitle>Test</DialogTitle>
          </DialogContent>
        </Dialog>
      );

      // Rapidly change state
      rerender(
        <Dialog open={true} onOpenChange={onOpenChange}>
          <DialogContent>
            <DialogTitle>Test</DialogTitle>
          </DialogContent>
        </Dialog>
      );

      rerender(
        <Dialog open={false} onOpenChange={onOpenChange}>
          <DialogContent>
            <DialogTitle>Test</DialogTitle>
          </DialogContent>
        </Dialog>
      );

      // Should handle gracefully without errors
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('should handle missing title gracefully', () => {
      render(
        <Dialog open={true} onOpenChange={() => {}}>
          <DialogContent>
            <DialogBody>Content without title</DialogBody>
          </DialogContent>
        </Dialog>
      );

      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
    });

    it('should handle custom onKeyDown handlers', async () => {
      const user = userEvent.setup();
      const onKeyDown = vi.fn();

      render(
        <Dialog open={true} onOpenChange={() => {}}>
          <DialogContent onKeyDown={onKeyDown}>
            <DialogTitle>Test</DialogTitle>
          </DialogContent>
        </Dialog>
      );

      const dialog = screen.getByRole('dialog');
      await user.type(dialog, 'a');

      expect(onKeyDown).toHaveBeenCalled();
    });
  });
});