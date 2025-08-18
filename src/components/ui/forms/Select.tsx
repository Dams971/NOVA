'use client';

import { ChevronDown, Check, AlertCircle, CheckCircle, Info } from 'lucide-react';
import React, { 
  createContext, 
  useContext, 
  useState, 
  useRef, 
  useCallback,
  useEffect,
  forwardRef,
  ReactNode
} from 'react';
import { cn } from '@/lib/utils';

interface SelectContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  value: string | undefined;
  onValueChange: (value: string) => void;
  disabled: boolean;
  placeholder: string;
  id: string;
  size: 'sm' | 'md' | 'lg';
  variant: 'default' | 'error' | 'success' | 'warning';
}

const SelectContext = createContext<SelectContextValue | null>(null);

function useSelectContext() {
  const context = useContext(SelectContext);
  if (!context) {
    throw new Error('Select components must be used within a Select provider');
  }
  return context;
}

// ==================== SELECT ROOT ====================

interface SelectProps {
  value?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  children: ReactNode;
  id?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'error' | 'success' | 'warning';
}

/**
 * Select Root Component
 * 
 * Provides context and manages the select state. All other select components
 * must be wrapped within this provider.
 */
function Select({ 
  value, 
  onValueChange = () => {}, 
  disabled = false, 
  placeholder = 'Sélectionner...', 
  children,
  id = 'select',
  size = 'md',
  variant = 'default'
}: SelectProps) {
  const [open, setOpen] = useState(false);

  return (
    <SelectContext.Provider value={{ 
      open, 
      setOpen, 
      value, 
      onValueChange, 
      disabled, 
      placeholder,
      id,
      size,
      variant
    }}>
      {children}
    </SelectContext.Provider>
  );
}

// ==================== SELECT GROUP ====================

interface SelectGroupProps {
  children: ReactNode;
  label?: string;
  error?: string;
  success?: string;
  warning?: string;
  helperText?: string;
  required?: boolean;
  fullWidth?: boolean;
  className?: string;
}

/**
 * Select Group Component
 * 
 * Wrapper component that provides proper labeling, error handling,
 * and accessibility features for the select.
 */
const SelectGroup = forwardRef<HTMLDivElement, SelectGroupProps>(({
  children,
  label,
  error,
  success,
  warning,
  helperText,
  required = false,
  fullWidth = false,
  className
}, ref) => {
  const { id } = useSelectContext();
  
  // Generate IDs for associated elements
  const helperTextId = `${id}-helper`;
  const errorId = `${id}-error`;
  const successId = `${id}-success`;
  const warningId = `${id}-warning`;
  
  // Get message text and styling
  const getMessage = () => {
    if (error) return { text: error, id: errorId, className: 'text-error' };
    if (success) return { text: success, id: successId, className: 'text-success' };
    if (warning) return { text: warning, id: warningId, className: 'text-warning' };
    if (helperText) return { text: helperText, id: helperTextId, className: 'text-muted-foreground' };
    return null;
  };

  const message = getMessage();

  return (
    <div 
      ref={ref}
      className={cn(fullWidth && 'w-full', className)}
    >
      {/* Label */}
      {label && (
        <label 
          htmlFor={id}
          className="block text-sm font-medium text-foreground mb-2"
        >
          {label}
          {required && (
            <span className="text-error ml-1" aria-label="requis">
              *
            </span>
          )}
        </label>
      )}

      {/* Select component */}
      <div className="relative">
        {children}
      </div>

      {/* Helper/Error/Success/Warning message */}
      {message && (
        <p 
          id={message.id}
          className={cn('mt-2 text-sm', message.className)}
          role={error ? 'alert' : undefined}
          aria-live={error ? 'polite' : undefined}
        >
          {message.text}
        </p>
      )}
    </div>
  );
});

SelectGroup.displayName = 'SelectGroup';

// ==================== SELECT TRIGGER ====================

interface SelectTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: ReactNode;
  placeholder?: string;
}

/**
 * Select Trigger Component
 * 
 * Button that opens the select dropdown when clicked. Handles proper ARIA attributes
 * and keyboard navigation.
 */
const SelectTrigger = forwardRef<HTMLButtonElement, SelectTriggerProps>(({
  className,
  children,
  placeholder: triggerPlaceholder,
  ...props
}, ref) => {
  const { 
    open, 
    setOpen, 
    value, 
    disabled, 
    placeholder: contextPlaceholder, 
    id,
    size,
    variant
  } = useSelectContext();

  const actualPlaceholder = triggerPlaceholder || contextPlaceholder;

  // Base styles using design tokens
  const baseStyles = `
    flex w-full items-center justify-between
    border transition-all duration-base
    focus:outline-none focus:ring-2 focus:ring-offset-1
    disabled:opacity-60 disabled:cursor-not-allowed
    font-body text-left
  `;

  // Variant styles
  const variantStyles = {
    default: `
      border-border bg-input text-foreground
      focus:border-ring focus:ring-ring/20
      hover:border-border-strong
    `,
    error: `
      border-error bg-input text-foreground
      focus:border-error focus:ring-error/20
      hover:border-error-600
    `,
    success: `
      border-success bg-input text-foreground
      focus:border-success focus:ring-success/20
      hover:border-success-600
    `,
    warning: `
      border-warning bg-input text-foreground
      focus:border-warning focus:ring-warning/20
      hover:border-warning-600
    `
  };

  // Size styles
  const sizeStyles = {
    sm: 'min-h-touch-ios px-3 py-2 text-sm rounded-md',
    md: 'min-h-touch-android px-4 py-2.5 text-base rounded-lg',
    lg: 'min-h-[52px] px-6 py-3 text-lg rounded-xl'
  };

  // Icon sizes
  const iconSizes = {
    sm: 16,
    md: 20,
    lg: 24
  };

  const handleClick = useCallback(() => {
    if (!disabled) {
      setOpen(!open);
    }
  }, [disabled, open, setOpen]);

  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (disabled) return;

    switch (event.key) {
      case 'Enter':
      case ' ':
      case 'ArrowDown':
      case 'ArrowUp':
        event.preventDefault();
        setOpen(true);
        break;
      case 'Escape':
        if (open) {
          event.preventDefault();
          setOpen(false);
        }
        break;
    }
  }, [disabled, open, setOpen]);

  // Status icon
  const StatusIcon = () => {
    const iconSize = iconSizes[size];
    
    if (variant === 'error') {
      return <AlertCircle size={iconSize} className="text-error flex-shrink-0" aria-hidden="true" />;
    }
    if (variant === 'success') {
      return <CheckCircle size={iconSize} className="text-success flex-shrink-0" aria-hidden="true" />;
    }
    if (variant === 'warning') {
      return <Info size={iconSize} className="text-warning flex-shrink-0" aria-hidden="true" />;
    }
    return null;
  };

  return (
    <button
      ref={ref}
      id={id}
      type="button"
      role="combobox"
      aria-controls={`${id}-content`}
      aria-expanded={open}
      aria-haspopup="listbox"
      disabled={disabled}
      className={cn(
        baseStyles,
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      {...props}
    >
      <span className={cn(
        'block truncate',
        !value && 'text-muted-foreground'
      )}>
        {children || value || actualPlaceholder}
      </span>
      
      <div className="flex items-center gap-2">
        <StatusIcon />
        <ChevronDown 
          size={iconSizes[size]}
          className={cn(
            'transition-transform duration-base text-muted-foreground',
            open && 'rotate-180'
          )}
          aria-hidden="true"
        />
      </div>
    </button>
  );
});

SelectTrigger.displayName = 'SelectTrigger';

// ==================== SELECT CONTENT ====================

interface SelectContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  position?: 'top' | 'bottom' | 'auto';
  sideOffset?: number;
}

/**
 * Select Content Component
 * 
 * Dropdown content container with proper positioning and keyboard navigation.
 */
const SelectContent = forwardRef<HTMLDivElement, SelectContentProps>(({
  className,
  children,
  position: _position = 'auto',
  sideOffset = 4,
  ...props
}, ref) => {
  const { open, setOpen, id } = useSelectContext();
  const contentRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (contentRef.current && !contentRef.current.contains(event.target as Node)) {
        const trigger = document.getElementById(id);
        if (trigger && !trigger.contains(event.target as Node)) {
          setOpen(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open, setOpen, id]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    switch (event.key) {
      case 'Escape':
        event.preventDefault();
        setOpen(false);
        // Return focus to trigger
        document.getElementById(id)?.focus();
        break;
      case 'Tab':
        event.preventDefault();
        setOpen(false);
        break;
    }
  }, [setOpen, id]);

  if (!open) return null;

  return (
    <div
      ref={(node) => {
        contentRef.current = node;
        if (ref) {
          if (typeof ref === 'function') ref(node);
          else ref.current = node;
        }
      }}
      id={`${id}-content`}
      role="listbox"
      className={cn(
        'absolute z-dropdown w-full',
        'bg-background border border-border rounded-lg shadow-lg',
        'animate-slide-down',
        'max-h-[300px] overflow-auto',
        `top-full mt-${sideOffset}`,
        className
      )}
      onKeyDown={handleKeyDown}
      {...props}
    >
      {children}
    </div>
  );
});

SelectContent.displayName = 'SelectContent';

// ==================== SELECT ITEM ====================

interface SelectItemProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
  children: ReactNode;
  disabled?: boolean;
}

/**
 * Select Item Component
 * 
 * Individual option in the select dropdown with proper keyboard navigation
 * and selection handling.
 */
const SelectItem = forwardRef<HTMLDivElement, SelectItemProps>(({
  className,
  value: itemValue,
  children,
  disabled = false,
  onClick,
  ...props
}, ref) => {
  const { value, onValueChange, setOpen, size } = useSelectContext();
  const isSelected = value === itemValue;

  // Size styles
  const sizeStyles = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2.5 text-base',
    lg: 'px-6 py-3 text-lg'
  };

  // Icon sizes
  const iconSizes = {
    sm: 16,
    md: 20,
    lg: 24
  };

  const handleClick = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    if (disabled) return;
    
    onClick?.(event);
    onValueChange(itemValue);
    setOpen(false);
    
    // Return focus to trigger
    setTimeout(() => {
      const trigger = document.querySelector('[role="combobox"]') as HTMLElement;
      trigger?.focus();
    }, 0);
  }, [disabled, onClick, onValueChange, itemValue, setOpen]);

  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (disabled) return;

    switch (event.key) {
      case 'Enter':
      case ' ':
        event.preventDefault();
        onValueChange(itemValue);
        setOpen(false);
        break;
    }
  }, [disabled, onValueChange, itemValue, setOpen]);

  return (
    <div
      ref={ref}
      role="option"
      aria-selected={isSelected}
      tabIndex={disabled ? -1 : 0}
      className={cn(
        'relative flex cursor-pointer items-center justify-between',
        'transition-colors duration-base',
        'focus:outline-none focus:bg-muted',
        sizeStyles[size],
        disabled 
          ? 'cursor-not-allowed opacity-50' 
          : 'hover:bg-muted active:bg-muted/80',
        isSelected && 'bg-primary/10 text-primary',
        className
      )}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      {...props}
    >
      <span className="truncate">{children}</span>
      {isSelected && (
        <Check 
          size={iconSizes[size]} 
          className="flex-shrink-0 text-primary" 
          aria-hidden="true" 
        />
      )}
    </div>
  );
});

SelectItem.displayName = 'SelectItem';

// ==================== SELECT SEPARATOR ====================

type SelectSeparatorProps = React.HTMLAttributes<HTMLDivElement>;

/**
 * Select Separator Component
 * 
 * Visual separator between groups of select items.
 */
const SelectSeparator = forwardRef<HTMLDivElement, SelectSeparatorProps>(({
  className,
  ...props
}, ref) => {
  return (
    <div
      ref={ref}
      role="separator"
      className={cn(
        'h-px bg-border my-1',
        className
      )}
      {...props}
    />
  );
});

SelectSeparator.displayName = 'SelectSeparator';

// ==================== SELECT LABEL ====================

interface SelectLabelProps extends React.HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

/**
 * Select Label Component
 * 
 * Label for groups of select items.
 */
const SelectLabel = forwardRef<HTMLDivElement, SelectLabelProps>(({
  className,
  children,
  ...props
}, ref) => {
  const { size } = useSelectContext();

  // Size styles
  const sizeStyles = {
    sm: 'px-3 py-2 text-xs',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base'
  };

  return (
    <div
      ref={ref}
      className={cn(
        'font-medium text-muted-foreground',
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
});

SelectLabel.displayName = 'SelectLabel';

// ==================== EXPORTS ====================

export {
  Select,
  SelectGroup,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectLabel,
  type SelectProps,
  type SelectGroupProps,
  type SelectTriggerProps,
  type SelectContentProps,
  type SelectItemProps,
  type SelectSeparatorProps,
  type SelectLabelProps
};