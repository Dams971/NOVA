'use client';

import React, { forwardRef, useId } from 'react';
import { AlertCircle, CheckCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** Textarea visual variant */
  variant?: 'default' | 'error' | 'success' | 'warning';
  /** Size variant affecting padding and text size */
  size?: 'sm' | 'md' | 'lg';
  /** Label text for the textarea */
  label?: string;
  /** Helper text shown below the textarea */
  helperText?: string;
  /** Error message - also sets variant to error */
  error?: string;
  /** Success message - also sets variant to success */
  success?: string;
  /** Warning message - also sets variant to warning */
  warning?: string;
  /** Whether the textarea is required */
  required?: boolean;
  /** Full width styling */
  fullWidth?: boolean;
  /** Additional wrapper class name */
  wrapperClassName?: string;
  /** Resize behavior */
  resize?: 'none' | 'vertical' | 'horizontal' | 'both';
}

/**
 * NOVA Textarea Component
 * 
 * A comprehensive textarea component with accessibility features, validation states,
 * and proper labeling for medical form interfaces.
 */
const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(({
  className,
  wrapperClassName,
  variant = 'default',
  size = 'md',
  label,
  helperText,
  error,
  success,
  warning,
  required = false,
  fullWidth = false,
  disabled,
  id: providedId,
  resize = 'vertical',
  'aria-describedby': ariaDescribedBy,
  ...props
}, ref) => {
  const generatedId = useId();
  const id = providedId || generatedId;
  
  // Determine actual variant based on messages
  const actualVariant = error ? 'error' : success ? 'success' : warning ? 'warning' : variant;
  
  // Generate IDs for associated elements
  const helperTextId = `${id}-helper`;
  const errorId = `${id}-error`;
  const successId = `${id}-success`;
  const warningId = `${id}-warning`;
  
  // Build aria-describedby
  const describedByIds = [
    ariaDescribedBy,
    helperText && helperTextId,
    error && errorId,
    success && successId,
    warning && warningId
  ].filter(Boolean).join(' ');

  // Base textarea styles using design tokens
  const baseTextareaStyles = `
    w-full border transition-all duration-base
    focus:outline-none focus:ring-2 focus:ring-offset-1
    disabled:opacity-60 disabled:cursor-not-allowed
    placeholder:text-muted-foreground
    font-body
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
    sm: 'min-h-[80px] px-3 py-2 text-sm rounded-md',
    md: 'min-h-[100px] px-4 py-2.5 text-base rounded-lg',
    lg: 'min-h-[120px] px-6 py-3 text-lg rounded-xl'
  };

  // Resize styles
  const resizeStyles = {
    none: 'resize-none',
    vertical: 'resize-y',
    horizontal: 'resize-x',
    both: 'resize'
  };

  // Status icons
  const StatusIcon = () => {
    const iconSize = 20;
    
    if (error) {
      return <AlertCircle size={iconSize} className="text-error flex-shrink-0" aria-hidden="true" />;
    }
    if (success) {
      return <CheckCircle size={iconSize} className="text-success flex-shrink-0" aria-hidden="true" />;
    }
    if (warning) {
      return <Info size={iconSize} className="text-warning flex-shrink-0" aria-hidden="true" />;
    }
    return null;
  };

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
    <div className={cn(fullWidth && 'w-full', wrapperClassName)}>
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

      {/* Textarea container */}
      <div className="relative">
        {/* Textarea field */}
        <textarea
          ref={ref}
          id={id}
          className={cn(
            baseTextareaStyles,
            variantStyles[actualVariant],
            sizeStyles[size],
            resizeStyles[resize],
            actualVariant !== 'default' && 'pr-10',
            className
          )}
          disabled={disabled}
          required={required}
          aria-invalid={actualVariant === 'error'}
          aria-describedby={describedByIds || undefined}
          {...props}
        />

        {/* Status icon */}
        {actualVariant !== 'default' && (
          <div className="absolute right-3 top-3">
            <StatusIcon />
          </div>
        )}
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

Textarea.displayName = 'Textarea';

export { Textarea };