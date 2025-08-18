'use client';

import { X } from 'lucide-react';
import React, { 
  createContext, 
  useContext, 
  useEffect, 
  useRef, 
  useCallback,
  forwardRef,
  ReactNode
} from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';
import FocusTrap from './FocusTrap';

interface DialogContextValue {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  id: string;
}

const DialogContext = createContext<DialogContextValue | null>(null);

function useDialogContext() {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error('Dialog components must be used within a Dialog provider');
  }
  return context;
}

// ==================== DIALOG ROOT ====================

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
  id?: string;
}

/**
 * Dialog Root Component
 * 
 * Provides context and manages the dialog state. All other dialog components
 * must be wrapped within this provider.
 */
function Dialog({ open, onOpenChange, children, id = 'dialog' }: DialogProps) {
  return (
    <DialogContext.Provider value={{ open, onOpenChange, id }}>
      {children}
    </DialogContext.Provider>
  );
}

// ==================== DIALOG TRIGGER ====================

interface DialogTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
  children: ReactNode;
}

/**
 * Dialog Trigger Component
 * 
 * Button that opens the dialog when clicked. Handles proper ARIA attributes
 * and keyboard navigation.
 */
const DialogTrigger = forwardRef<HTMLButtonElement, DialogTriggerProps>(
  ({ asChild = false, children, onClick, ...props }, ref) => {
    const { onOpenChange, id } = useDialogContext();

    const handleClick = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
      onClick?.(event);
      onOpenChange(true);
    }, [onClick, onOpenChange]);

    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children as React.ReactElement<any>, {
        ...props,
        onClick: handleClick,
        'aria-haspopup': 'dialog',
        'aria-controls': id,
        ref
      });
    }

    return (
      <button
        ref={ref}
        onClick={handleClick}
        aria-haspopup="dialog"
        aria-controls={id}
        {...props}
      >
        {children}
      </button>
    );
  }
);

DialogTrigger.displayName = 'DialogTrigger';

// ==================== DIALOG PORTAL ====================

interface DialogPortalProps {
  children: ReactNode;
  container?: HTMLElement;
}

/**
 * Dialog Portal Component
 * 
 * Renders dialog content in a portal to ensure proper stacking context
 * and accessibility.
 */
function DialogPortal({ children, container }: DialogPortalProps) {
  const [mounted, setMounted] = React.useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!mounted) return null;

  return createPortal(
    children, 
    container || document.body
  );
}

// ==================== DIALOG OVERLAY ====================

interface DialogOverlayProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
}

/**
 * Dialog Overlay Component
 * 
 * Semi-transparent backdrop that covers the entire screen behind the dialog.
 * Clicking it closes the dialog (unless disabled).
 */
const DialogOverlay = forwardRef<HTMLDivElement, DialogOverlayProps>(
  ({ className, children, onClick, ...props }, ref) => {
    const { onOpenChange } = useDialogContext();

    const handleClick = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
      // Only close if clicking the overlay itself, not its children
      if (event.target === event.currentTarget) {
        onClick?.(event);
        onOpenChange(false);
      }
    }, [onClick, onOpenChange]);

    return (
      <div
        ref={ref}
        className={cn(
          'fixed inset-0 z-modal',
          'bg-black/50 backdrop-blur-sm',
          'animate-fade-in',
          'data-[state=open]:animate-fade-in',
          'data-[state=closed]:animate-fade-out',
          className
        )}
        onClick={handleClick}
        {...props}
      >
        {children}
      </div>
    );
  }
);

DialogOverlay.displayName = 'DialogOverlay';

// ==================== DIALOG CONTENT ====================

interface DialogContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  showCloseButton?: boolean;
  closeOnEscape?: boolean;
  closeOnOutsideClick?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

/**
 * Dialog Content Component
 * 
 * The main dialog container with proper focus management, keyboard navigation,
 * and accessibility features.
 * 
 * Features:
 * - Focus trap to keep keyboard navigation within dialog
 * - Escape key handling
 * - Proper ARIA attributes
 * - Return focus to trigger on close
 * - Body scroll lock when open
 */
const DialogContent = forwardRef<HTMLDivElement, DialogContentProps>(
  ({ 
    className, 
    children, 
    showCloseButton = true,
    closeOnEscape = true,
    closeOnOutsideClick: _closeOnOutsideClick = true,
    size = 'md',
    onKeyDown,
    ...props 
  }, ref) => {
    const { open, onOpenChange, id } = useDialogContext();
    const contentRef = useRef<HTMLDivElement>(null);

    // Size variants
    const sizeStyles = {
      sm: 'max-w-sm',
      md: 'max-w-md',
      lg: 'max-w-lg',
      xl: 'max-w-xl',
      full: 'max-w-[95vw] max-h-[95vh]'
    };

    // Handle escape key
    const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLDivElement>) => {
      onKeyDown?.(event);
      
      if (closeOnEscape && event.key === 'Escape') {
        event.preventDefault();
        onOpenChange(false);
      }
    }, [onKeyDown, closeOnEscape, onOpenChange]);

    // Lock body scroll when dialog is open
    useEffect(() => {
      if (open) {
        const originalStyle = window.getComputedStyle(document.body).overflow;
        document.body.style.overflow = 'hidden';
        
        return () => {
          document.body.style.overflow = originalStyle;
        };
      }
    }, [open]);

    // Focus management
    useEffect(() => {
      if (open && contentRef.current) {
        // Focus the dialog content
        const focusableElement = contentRef.current.querySelector(
          'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        ) as HTMLElement;
        
        if (focusableElement) {
          focusableElement.focus();
        } else {
          contentRef.current.focus();
        }
      }
    }, [open]);

    if (!open) return null;

    return (
      <DialogPortal>
        <DialogOverlay>
          <div className="fixed inset-0 flex items-center justify-center p-4 z-modal">
            <FocusTrap active={open}>
              <div
                ref={(node) => {
                  contentRef.current = node;
                  if (ref) {
                    if (typeof ref === 'function') ref(node);
                    else ref.current = node;
                  }
                }}
                id={id}
                role="dialog"
                aria-modal="true"
                aria-labelledby={`${id}-title`}
                aria-describedby={`${id}-description`}
                tabIndex={-1}
                className={cn(
                  'relative w-full bg-background border border-border rounded-xl shadow-2xl',
                  'animate-slide-up',
                  'focus:outline-none',
                  sizeStyles[size],
                  className
                )}
                onKeyDown={handleKeyDown}
                {...props}
              >
                {/* Close button */}
                {showCloseButton && (
                  <button
                    className="
                      absolute right-4 top-4 p-2
                      text-muted-foreground hover:text-foreground
                      focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2
                      rounded-md transition-colors duration-base
                      touch-target
                    "
                    onClick={() => onOpenChange(false)}
                    aria-label="Fermer la boîte de dialogue"
                  >
                    <X size={20} aria-hidden="true" />
                  </button>
                )}

                {children}
              </div>
            </FocusTrap>
          </div>
        </DialogOverlay>
      </DialogPortal>
    );
  }
);

DialogContent.displayName = 'DialogContent';

// ==================== DIALOG HEADER ====================

interface DialogHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

/**
 * Dialog Header Component
 * 
 * Container for dialog title and optional description.
 */
const DialogHeader = forwardRef<HTMLDivElement, DialogHeaderProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'px-6 py-4 border-b border-border',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

DialogHeader.displayName = 'DialogHeader';

// ==================== DIALOG TITLE ====================

interface DialogTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  children: ReactNode;
  level?: 1 | 2 | 3 | 4 | 5 | 6;
}

/**
 * Dialog Title Component
 * 
 * Accessible heading for the dialog. Automatically gets the correct ID
 * for aria-labelledby.
 */
const DialogTitle = forwardRef<HTMLHeadingElement, DialogTitleProps>(
  ({ className, children, level = 2, ...props }, ref) => {
    const { id } = useDialogContext();
    
    const headingProps = {
      ref,
      id: `${id}-title`,
      className: cn(
        'text-xl font-semibold text-foreground',
        className
      ),
      ...props,
      children
    };

    switch (level) {
      case 1:
        return <h1 {...headingProps} />;
      case 3:
        return <h3 {...headingProps} />;
      case 4:
        return <h4 {...headingProps} />;
      case 5:
        return <h5 {...headingProps} />;
      case 6:
        return <h6 {...headingProps} />;
      case 2:
      default:
        return <h2 {...headingProps} />;
    }
  }
);

DialogTitle.displayName = 'DialogTitle';

// ==================== DIALOG DESCRIPTION ====================

interface DialogDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {
  children: ReactNode;
}

/**
 * Dialog Description Component
 * 
 * Optional description text for the dialog. Automatically gets the correct ID
 * for aria-describedby.
 */
const DialogDescription = forwardRef<HTMLParagraphElement, DialogDescriptionProps>(
  ({ className, children, ...props }, ref) => {
    const { id } = useDialogContext();

    return (
      <p
        ref={ref}
        id={`${id}-description`}
        className={cn(
          'text-muted-foreground mt-2',
          className
        )}
        {...props}
      >
        {children}
      </p>
    );
  }
);

DialogDescription.displayName = 'DialogDescription';

// ==================== DIALOG BODY ====================

interface DialogBodyProps extends React.HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

/**
 * Dialog Body Component
 * 
 * Main content area of the dialog.
 */
const DialogBody = forwardRef<HTMLDivElement, DialogBodyProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'px-6 py-4',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

DialogBody.displayName = 'DialogBody';

// ==================== DIALOG FOOTER ====================

interface DialogFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

/**
 * Dialog Footer Component
 * 
 * Container for dialog actions (buttons, etc.).
 */
const DialogFooter = forwardRef<HTMLDivElement, DialogFooterProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'px-6 py-4 border-t border-border',
          'flex items-center justify-end gap-3',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

DialogFooter.displayName = 'DialogFooter';

// ==================== DIALOG CLOSE ====================

interface DialogCloseProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
  children: ReactNode;
}

/**
 * Dialog Close Component
 * 
 * Button that closes the dialog when clicked.
 */
const DialogClose = forwardRef<HTMLButtonElement, DialogCloseProps>(
  ({ asChild = false, children, onClick, ...props }, ref) => {
    const { onOpenChange } = useDialogContext();

    const handleClick = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
      onClick?.(event);
      onOpenChange(false);
    }, [onClick, onOpenChange]);

    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children as React.ReactElement<any>, {
        ...props,
        onClick: handleClick,
        ref
      });
    }

    return (
      <button
        ref={ref}
        onClick={handleClick}
        {...props}
      >
        {children}
      </button>
    );
  }
);

DialogClose.displayName = 'DialogClose';

// ==================== EXPORTS ====================

export {
  Dialog,
  DialogTrigger,
  DialogPortal,
  DialogOverlay,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogFooter,
  DialogClose,
  type DialogProps,
  type DialogTriggerProps,
  type DialogContentProps,
  type DialogHeaderProps,
  type DialogTitleProps,
  type DialogDescriptionProps,
  type DialogBodyProps,
  type DialogFooterProps,
  type DialogCloseProps
};