'use client';

import { Loader2 } from 'lucide-react';
import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual style variant */
  variant?: 'primary' | 'secondary' | 'quiet' | 'destructive' | 'success' | 'warning';
  /** Size variant affecting padding and text size */
  size?: 'sm' | 'md' | 'lg';
  /** Show loading state with spinner */
  loading?: boolean;
  /** Icon element to display */
  icon?: React.ReactNode;
  /** Position of the icon relative to text */
  iconPosition?: 'left' | 'right';
  /** Make button take full width of container */
  fullWidth?: boolean;
  /** Custom loading text for screen readers */
  loadingText?: string;
  /** Button press effect style */
  pressEffect?: 'scale' | 'opacity' | 'none';
}

/**
 * NOVA Button Component
 * 
 * A comprehensive button component with accessibility features, loading states,
 * and multiple variants for different use cases in the medical interface.
 * 
 * Features:
 * - WCAG 2.2 AA compliant contrast ratios
 * - Proper focus management and keyboard navigation
 * - Loading states with screen reader announcements
 * - Touch-friendly sizing (44px minimum)
 * - Reduced motion support
 * - High contrast mode support
 */
const Button = forwardRef<HTMLButtonElement, ButtonProps>(({
  className,
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  loadingText,
  pressEffect = 'scale',
  disabled,
  children,
  type = 'button',
  ...props
}, ref) => {
  // Base styles using design tokens
  const baseStyles = `
    inline-flex items-center justify-center
    font-medium transition-all duration-base
    touch-target focus-visible-ring
    disabled:opacity-60 disabled:cursor-not-allowed
    relative overflow-hidden
  `;
  
  // Variant styles using NOVA design tokens
  const variants = {
    primary: `
      bg-primary text-primary-foreground
      hover:bg-primary-700 active:bg-primary-800
      focus-visible:ring-primary-600
      shadow-sm hover:shadow-primary/20
      disabled:hover:bg-primary
    `,
    secondary: `
      bg-secondary text-secondary-foreground
      hover:bg-secondary-700 active:bg-secondary-800
      focus-visible:ring-secondary-600
      shadow-sm hover:shadow-secondary/20
      disabled:hover:bg-secondary
    `,
    success: `
      bg-success text-success-foreground
      hover:bg-success-700 active:bg-success-800
      focus-visible:ring-success-600
      shadow-sm hover:shadow-success/20
      disabled:hover:bg-success
    `,
    warning: `
      bg-warning text-warning-foreground
      hover:bg-warning-700 active:bg-warning-800
      focus-visible:ring-warning-600
      shadow-sm hover:shadow-warning/20
      disabled:hover:bg-warning
    `,
    destructive: `
      bg-destructive text-destructive-foreground
      hover:bg-error-700 active:bg-error-800
      focus-visible:ring-error-600
      shadow-sm hover:shadow-error/20
      disabled:hover:bg-destructive
    `,
    quiet: `
      bg-transparent text-foreground
      hover:bg-muted active:bg-muted/80
      focus-visible:ring-ring
      disabled:hover:bg-transparent
    `
  };
  
  // Size variants with proper touch targets
  const sizes = {
    sm: 'min-h-touch-ios px-3 py-1.5 text-sm gap-1.5 rounded-md',
    md: 'min-h-touch-android px-4 py-2.5 text-base gap-2 rounded-lg',
    lg: 'min-h-[52px] px-6 py-3 text-lg gap-2.5 rounded-xl'
  };

  // Press effect styles
  const pressEffects = {
    scale: 'active:scale-[0.98] transition-transform',
    opacity: 'active:opacity-80',
    none: ''
  };
  
  // Screen reader text for loading state (French)
  const getLoadingText = () => {
    if (loadingText) return loadingText;
    if (typeof children === 'string') return `${children} en cours de traitement...`;
    return 'Chargement en cours...';
  };

  // Get icon size based on button size
  const getIconSize = () => {
    switch (size) {
      case 'sm': return 16;
      case 'lg': return 24;
      default: return 20;
    }
  };

  // Loading spinner component
  const LoadingSpinner = () => (
    <Loader2 
      className="animate-spin" 
      size={getIconSize()}
      aria-hidden="true"
    />
  );

  // Icon wrapper component
  const IconWrapper = ({ children: iconElement, position }: { children: React.ReactNode; position: 'left' | 'right' }) => (
    <span 
      className={cn(
        "flex-shrink-0",
        position === 'right' && "order-last"
      )} 
      aria-hidden="true"
    >
      {iconElement}
    </span>
  );
  
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        baseStyles,
        variants[variant],
        sizes[size],
        pressEffects[pressEffect],
        fullWidth && 'w-full',
        className
      )}
      disabled={disabled || loading}
      aria-busy={loading}
      aria-describedby={loading ? `${props.id || ''}-loading` : undefined}
      {...props}
    >
      {loading && (
        <>
          <LoadingSpinner />
          <span 
            id={`${props.id || 'button'}-loading`}
            className="sr-only"
          >
            {getLoadingText()}
          </span>
          {loadingText && (
            <span aria-hidden="true" className="ml-2">
              {loadingText}
            </span>
          )}
        </>
      )}
      
      {!loading && (
        <>
          {icon && iconPosition === 'left' && (
            <IconWrapper position="left">{icon}</IconWrapper>
          )}
          
          {children && (
            <span className="truncate">
              {children}
            </span>
          )}
          
          {icon && iconPosition === 'right' && (
            <IconWrapper position="right">{icon}</IconWrapper>
          )}
        </>
      )}
    </button>
  );
});

Button.displayName = 'Button';

export default Button;