'use client';

import { Eye, EyeOff, AlertCircle, CheckCircle, Info } from 'lucide-react';
import React, { forwardRef, useState, useId } from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  /** Input visual variant */
  variant?: 'default' | 'error' | 'success' | 'warning';
  /** Size variant affecting padding and text size */
  size?: 'sm' | 'md' | 'lg';
  /** Label text for the input */
  label?: string;
  /** Helper text shown below the input */
  helperText?: string;
  /** Error message - also sets variant to error */
  error?: string;
  /** Success message - also sets variant to success */
  success?: string;
  /** Warning message - also sets variant to warning */
  warning?: string;
  /** Icon to show on the left side */
  leftIcon?: React.ReactNode;
  /** Icon to show on the right side */
  rightIcon?: React.ReactNode;
  /** Whether the input is required */
  required?: boolean;
  /** Whether to show password toggle for password inputs */
  showPasswordToggle?: boolean;
  /** Full width styling */
  fullWidth?: boolean;
  /** Additional wrapper class name */
  wrapperClassName?: string;
}

/**
 * NOVA Input Component
 * 
 * A comprehensive input component with accessibility features, validation states,
 * and proper labeling for medical form interfaces.
 * 
 * Features:
 * - WCAG 2.2 AA compliant contrast and focus states
 * - Proper labeling and error messaging
 * - Password visibility toggle
 * - Touch-friendly sizing
 * - Screen reader support
 * - Validation state indicators
 * - French language support
 */
const Input = forwardRef<HTMLInputElement, InputProps>(({
  className,
  wrapperClassName,
  variant = 'default',
  size = 'md',
  type = 'text',
  label,
  helperText,
  error,
  success,
  warning,
  leftIcon,
  rightIcon,
  required = false,
  showPasswordToggle = false,
  fullWidth = false,
  disabled,
  id: providedId,
  'aria-describedby': ariaDescribedBy,
  ...props
}, ref) => {
  const [showPassword, setShowPassword] = useState(false);
  const generatedId = useId();
  const id = providedId || generatedId;
  
  // Determine actual variant based on messages
  const actualVariant = error ? 'error' : success ? 'success' : warning ? 'warning' : variant;
  
  // Determine input type
  const inputType = type === 'password' && showPassword ? 'text' : type;
  
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

  // Base input styles using design tokens
  const baseInputStyles = `
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
    sm: 'min-h-touch-ios px-3 py-2 text-sm rounded-md',
    md: 'min-h-touch-android px-4 py-2.5 text-base rounded-lg',
    lg: 'min-h-[52px] px-6 py-3 text-lg rounded-xl'
  };

  // Icon styles based on size
  const iconSizes = {
    sm: 16,
    md: 20,
    lg: 24
  };

  // Status icons
  const StatusIcon = () => {
    const iconSize = iconSizes[size];
    
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

  // Password toggle button
  const PasswordToggle = () => {
    if (type !== 'password' || !showPasswordToggle) return null;
    
    const IconComponent = showPassword ? EyeOff : Eye;
    
    return (
      <button
        type="button"
        className="
          flex items-center justify-center p-1 
          text-muted-foreground hover:text-foreground
          focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1
          rounded transition-colors duration-base
          touch-target
        "
        onClick={() => setShowPassword(!showPassword)}
        aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
        tabIndex={-1}
      >
        <IconComponent size={iconSizes[size]} aria-hidden="true" />
      </button>
    );
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

      {/* Input container */}
      <div className="relative">
        {/* Left icon */}
        {leftIcon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
            <span className="text-muted-foreground flex items-center" aria-hidden="true">
              {leftIcon}
            </span>
          </div>
        )}

        {/* Input field */}
        <input
          ref={ref}
          type={inputType}
          id={id}
          className={cn(
            baseInputStyles,
            variantStyles[actualVariant],
            sizeStyles[size],
            leftIcon && 'pl-10',
            (rightIcon || showPasswordToggle || actualVariant !== 'default') && 'pr-10',
            className
          )}
          disabled={disabled}
          required={required}
          aria-invalid={actualVariant === 'error'}
          aria-describedby={describedByIds || undefined}
          {...props}
        />

        {/* Right side icons */}
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
          {/* Status icon */}
          <StatusIcon />
          
          {/* Custom right icon */}
          {rightIcon && !showPasswordToggle && (
            <span className="text-muted-foreground flex items-center" aria-hidden="true">
              {rightIcon}
            </span>
          )}
          
          {/* Password toggle */}
          <PasswordToggle />
        </div>
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

Input.displayName = 'Input';

export default Input;