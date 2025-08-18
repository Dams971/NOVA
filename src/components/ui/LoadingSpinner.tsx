'use client';

import React from 'react';
import VisuallyHidden from './VisuallyHidden';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'blue' | 'white' | 'gray' | 'green' | 'red';
  className?: string;
  label?: string;
  showLabel?: boolean;
  inline?: boolean;
}

/**
 * LoadingSpinner component displays an accessible loading indicator.
 * It includes proper ARIA attributes and screen reader announcements.
 */
export function LoadingSpinner({
  size = 'md',
  color = 'blue',
  className = '',
  label = 'Chargement en cours',
  showLabel = false,
  inline = false
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-12 w-12'
  };

  const colorClasses = {
    blue: 'text-blue-600',
    white: 'text-white',
    gray: 'text-gray-600',
    green: 'text-green-600',
    red: 'text-red-600'
  };

  const borderColorClasses = {
    blue: 'border-blue-600',
    white: 'border-white',
    gray: 'border-gray-600',
    green: 'border-green-600',
    red: 'border-red-600'
  };

  const containerClasses = inline 
    ? 'inline-flex items-center space-x-2'
    : 'flex flex-col items-center justify-center space-y-2';

  return (
    <div className={`${containerClasses} ${className}`}>
      <div
        className={`animate-spin rounded-full border-2 border-t-transparent ${sizeClasses[size]} ${borderColorClasses[color]}`}
        role="status"
        aria-label={label}
        aria-live="polite"
      >
        <VisuallyHidden>{label}</VisuallyHidden>
      </div>
      
      {showLabel && (
        <span className={`text-sm ${colorClasses[color]}`} aria-hidden="true">
          {label}
        </span>
      )}
    </div>
  );
}


// Loading overlay component
interface LoadingOverlayProps {
  isLoading: boolean;
  label?: string;
  className?: string;
  children?: React.ReactNode;
  blur?: boolean;
}

export function LoadingOverlay({
  isLoading,
  label = 'Chargement en cours',
  className = '',
  children,
  blur = true
}: LoadingOverlayProps) {
  if (!isLoading) return <>{children}</>;

  return (
    <div className={`relative ${className}`}>
      <div className={`${blur ? 'blur-sm' : ''} pointer-events-none`}>
        {children}
      </div>
      
      <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
        <LoadingSpinner
          size="lg"
          label={label}
          showLabel={true}
          className="bg-white rounded-lg shadow-lg p-6"
        />
      </div>
    </div>
  );
}

// Loading button component
interface LoadingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  loadingText?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

export function LoadingButton({
  loading = false,
  loadingText,
  children,
  size = 'md',
  disabled,
  className = '',
  ...props
}: LoadingButtonProps) {
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };

  const spinnerSizes = {
    sm: 'sm' as const,
    md: 'sm' as const,
    lg: 'md' as const
  };

  return (
    <button
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center
        border border-transparent rounded-md font-medium
        focus:outline-none focus:ring-2 focus:ring-offset-2
        disabled:opacity-50 disabled:cursor-not-allowed
        ${sizeClasses[size]}
        ${className}
      `}
      aria-describedby={loading ? 'loading-status' : undefined}
      {...props}
    >
      {loading && (
        <>
          <LoadingSpinner
            size={spinnerSizes[size]}
            color="white"
            className="mr-2"
            label="Chargement"
          />
          <VisuallyHidden id="loading-status">
            {loadingText || 'Opération en cours'}
          </VisuallyHidden>
        </>
      )}
      
      <span className={loading ? 'opacity-75' : ''}>
        {loading && loadingText ? loadingText : children}
      </span>
    </button>
  );
}