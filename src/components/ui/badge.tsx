'use client';

import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Visual variant of the badge */
  variant?: 'default' | 'secondary' | 'success' | 'warning' | 'error' | 'info' | 'outline';
  /** Size variant affecting padding and text size */
  size?: 'sm' | 'md' | 'lg';
  /** Icon element to display */
  icon?: React.ReactNode;
  /** Position of the icon relative to text */
  iconPosition?: 'left' | 'right';
  /** Whether the badge is dismissible */
  dismissible?: boolean;
  /** Callback for dismiss action */
  onDismiss?: () => void;
}

/**
 * NOVA Badge Component
 * 
 * A flexible badge component for status indicators, labels, and tags.
 */
const Badge = forwardRef<HTMLSpanElement, BadgeProps>(({
  className,
  variant = 'default',
  size = 'md',
  icon,
  iconPosition = 'left',
  dismissible = false,
  onDismiss,
  children,
  ...props
}, ref) => {
  // Base badge styles
  const baseStyles = `
    inline-flex items-center justify-center
    font-medium transition-all duration-base
    rounded-full border
  `;

  // Variant styles using NOVA design tokens
  const variantStyles = {
    default: `
      bg-primary text-primary-foreground border-primary
    `,
    secondary: `
      bg-secondary text-secondary-foreground border-secondary
    `,
    success: `
      bg-success text-success-foreground border-success
    `,
    warning: `
      bg-warning text-warning-foreground border-warning
    `,
    error: `
      bg-error text-error-foreground border-error
    `,
    info: `
      bg-info text-info-foreground border-info
    `,
    outline: `
      bg-transparent text-foreground border-border
      hover:bg-muted
    `
  };

  // Size styles
  const sizeStyles = {
    sm: 'px-2 py-0.5 text-xs gap-1',
    md: 'px-2.5 py-1 text-sm gap-1.5',
    lg: 'px-3 py-1.5 text-base gap-2'
  };

  // Icon size based on badge size
  const _getIconSize = () => {
    switch (size) {
      case 'sm': return 12;
      case 'lg': return 18;
      default: return 14;
    }
  };

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

  // Dismiss button
  const DismissButton = () => {
    if (!dismissible || !onDismiss) return null;

    return (
      <button
        type="button"
        className="
          ml-1 flex-shrink-0 rounded-full
          hover:bg-black/10 focus:bg-black/10
          focus:outline-none transition-colors duration-base
          order-last
        "
        onClick={onDismiss}
        aria-label="Supprimer"
      >
        <svg
          className="w-3 h-3"
          fill="currentColor"
          viewBox="0 0 20 20"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </button>
    );
  };

  return (
    <span
      ref={ref}
      className={cn(
        baseStyles,
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {icon && iconPosition === 'left' && (
        <IconWrapper position="left">{icon}</IconWrapper>
      )}
      
      {children && (
        <span className="truncate">
          {children}
        </span>
      )}
      
      {icon && iconPosition === 'right' && !dismissible && (
        <IconWrapper position="right">{icon}</IconWrapper>
      )}
      
      <DismissButton />
    </span>
  );
});

Badge.displayName = 'Badge';

export { Badge };