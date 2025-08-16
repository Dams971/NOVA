'use client';

import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Visual variant of the card */
  variant?: 'default' | 'outlined' | 'elevated' | 'ghost';
  /** Size variant affecting padding */
  size?: 'sm' | 'md' | 'lg';
  /** Whether the card is interactive (clickable) */
  interactive?: boolean;
}

export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Size variant affecting padding */
  size?: 'sm' | 'md' | 'lg';
}

export interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Size variant affecting padding */
  size?: 'sm' | 'md' | 'lg';
}

export interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  /** HTML heading level */
  level?: 1 | 2 | 3 | 4 | 5 | 6;
}

/**
 * NOVA Card Component
 * 
 * A flexible card component for displaying content in a structured way.
 */
const Card = forwardRef<HTMLDivElement, CardProps>(({
  className,
  variant = 'default',
  size = 'md',
  interactive = false,
  children,
  ...props
}, ref) => {
  // Base card styles
  const baseStyles = `
    bg-background border rounded-lg transition-all duration-base
    overflow-hidden
  `;

  // Variant styles
  const variantStyles = {
    default: 'border-border shadow-sm',
    outlined: 'border-border-strong shadow-none',
    elevated: 'border-border shadow-lg hover:shadow-xl',
    ghost: 'border-transparent shadow-none bg-transparent'
  };

  // Size styles
  const sizeStyles = {
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6'
  };

  // Interactive styles
  const interactiveStyles = interactive ? `
    cursor-pointer hover:bg-muted/50 hover:border-border-strong
    focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1
    active:scale-[0.98]
  ` : '';

  return (
    <div
      ref={ref}
      className={cn(
        baseStyles,
        variantStyles[variant],
        !interactive && sizeStyles[size],
        interactiveStyles,
        className
      )}
      tabIndex={interactive ? 0 : undefined}
      role={interactive ? 'button' : undefined}
      {...props}
    >
      {children}
    </div>
  );
});

/**
 * Card Header Component
 */
const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(({
  className,
  size = 'md',
  children,
  ...props
}, ref) => {
  const sizeStyles = {
    sm: 'p-3 pb-0',
    md: 'p-4 pb-0',
    lg: 'p-6 pb-0'
  };

  return (
    <div
      ref={ref}
      className={cn(sizeStyles[size], className)}
      {...props}
    >
      {children}
    </div>
  );
});

/**
 * Card Content Component
 */
const CardContent = forwardRef<HTMLDivElement, CardContentProps>(({
  className,
  size = 'md',
  children,
  ...props
}, ref) => {
  const sizeStyles = {
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6'
  };

  return (
    <div
      ref={ref}
      className={cn(sizeStyles[size], className)}
      {...props}
    >
      {children}
    </div>
  );
});

/**
 * Card Title Component
 */
const CardTitle = forwardRef<HTMLHeadingElement, CardTitleProps>(({
  className,
  level = 3,
  children,
  ...props
}, ref) => {
  const Component = `h${level}` as const;
  
  const sizeStyles = {
    1: 'text-2xl font-bold',
    2: 'text-xl font-bold',
    3: 'text-lg font-semibold',
    4: 'text-base font-semibold',
    5: 'text-sm font-semibold',
    6: 'text-xs font-semibold'
  };

  return (
    <Component
      ref={ref}
      className={cn(
        'text-foreground leading-tight tracking-tight',
        sizeStyles[level],
        className
      )}
      {...props}
    >
      {children}
    </Component>
  );
});

Card.displayName = 'Card';
CardHeader.displayName = 'CardHeader';
CardContent.displayName = 'CardContent';
CardTitle.displayName = 'CardTitle';

export { Card, CardHeader, CardContent, CardTitle };