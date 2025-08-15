'use client';

import React, { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'quiet' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
  loadingText?: string;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(({
  className,
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  fullWidth = false,
  loadingText,
  disabled,
  children,
  ...props
}, ref) => {
  const baseStyles = `
    inline-flex items-center justify-center
    font-medium rounded-md
    transition-all duration-200
    focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-offset-2
    disabled:opacity-60 disabled:cursor-not-allowed
    touch-target
  `;
  
  const variants = {
    primary: `
      bg-blue-600 text-white
      hover:bg-blue-700 active:bg-blue-800
      focus-visible:ring-blue-600
      disabled:hover:bg-blue-600
    `,
    secondary: `
      bg-white text-gray-900 border border-gray-300
      hover:bg-gray-50 active:bg-gray-100
      focus-visible:ring-gray-500
      disabled:hover:bg-white
    `,
    quiet: `
      bg-transparent text-gray-700
      hover:bg-gray-100 active:bg-gray-200
      focus-visible:ring-gray-500
      disabled:hover:bg-transparent
    `,
    destructive: `
      bg-red-600 text-white
      hover:bg-red-700 active:bg-red-800
      focus-visible:ring-red-600
      disabled:hover:bg-red-600
    `
  };
  
  const sizes = {
    sm: 'min-h-[36px] px-3 py-1.5 text-sm gap-1.5',
    md: 'min-h-[44px] px-4 py-2.5 text-base gap-2',
    lg: 'min-h-[52px] px-6 py-3 text-lg gap-2.5'
  };
  
  // Screen reader text for loading state
  const getLoadingText = () => {
    if (loadingText) return loadingText;
    if (typeof children === 'string') return `${children} en cours...`;
    return 'Chargement en cours...';
  };
  
  return (
    <button
      ref={ref}
      className={cn(
        baseStyles,
        variants[variant],
        sizes[size],
        fullWidth && 'w-full',
        className
      )}
      disabled={disabled || loading}
      aria-busy={loading}
      {...props}
    >
      {loading ? (
        <>
          <Loader2 className="animate-spin" size={size === 'sm' ? 16 : size === 'lg' ? 24 : 20} />
          <span className="sr-only">{getLoadingText()}</span>
          {loadingText && <span aria-hidden="true">{loadingText}</span>}
        </>
      ) : (
        <>
          {icon && (
            <span className="flex-shrink-0" aria-hidden="true">
              {icon}
            </span>
          )}
          {children && <span>{children}</span>}
        </>
      )}
    </button>
  );
});

Button.displayName = 'Button';

export default Button;