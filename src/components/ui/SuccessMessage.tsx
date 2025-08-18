'use client';

import { CheckCircle, X } from 'lucide-react';
import React from 'react';

interface SuccessMessageProps {
  id?: string;
  message: string;
  className?: string;
  showIcon?: boolean;
  dismissible?: boolean;
  onDismiss?: () => void;
  role?: 'alert' | 'status';
  'aria-live'?: 'polite' | 'assertive';
  autoHide?: boolean;
  autoHideDelay?: number;
}

/**
 * SuccessMessage component displays success messages in an accessible way.
 * It includes proper ARIA attributes and visual indicators for success states.
 */
export default function SuccessMessage({
  id,
  message,
  className = '',
  showIcon = true,
  dismissible = false,
  onDismiss,
  role = 'status',
  'aria-live': ariaLive = 'polite',
  autoHide = false,
  autoHideDelay = 5000,
  ...props
}: SuccessMessageProps & React.HTMLAttributes<HTMLDivElement>) {
  const [isVisible, setIsVisible] = React.useState(true);

  React.useEffect(() => {
    if (autoHide && autoHideDelay > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        if (onDismiss) {
          onDismiss();
        }
      }, autoHideDelay);

      return () => clearTimeout(timer);
    }
  }, [autoHide, autoHideDelay, onDismiss]);

  const handleDismiss = () => {
    setIsVisible(false);
    if (onDismiss) {
      onDismiss();
    }
  };

  if (!message || !isVisible) return null;

  const divProps: React.HTMLAttributes<HTMLDivElement> = {
    id,
    role,
    'aria-live': ariaLive,
    className: `flex items-center justify-between bg-green-50 border border-green-200 rounded-md p-4 ${className}`,
    ...props
  };

  return (
    <div {...divProps}>
      <div className="flex items-center">
        {showIcon && (
          <CheckCircle className="h-5 w-5 text-green-400 mr-2 flex-shrink-0" aria-hidden="true" />
        )}
        <span className="text-sm text-green-800">{message}</span>
      </div>
      
      {dismissible && (
        <button
          type="button"
          onClick={handleDismiss}
          className="ml-4 text-green-400 hover:text-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 rounded-md p-1"
          aria-label="Fermer le message de succès"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

// Toast-style success message
interface SuccessToastProps extends Omit<SuccessMessageProps, 'className'> {
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
}

export function SuccessToast({ 
  position = 'top-right', 
  autoHide = true,
  dismissible = true,
  ...props 
}: SuccessToastProps) {
  const positionClasses = {
    'top-right': 'fixed top-4 right-4 z-50',
    'top-left': 'fixed top-4 left-4 z-50',
    'bottom-right': 'fixed bottom-4 right-4 z-50',
    'bottom-left': 'fixed bottom-4 left-4 z-50',
    'top-center': 'fixed top-4 left-1/2 transform -translate-x-1/2 z-50',
    'bottom-center': 'fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50'
  };

  return (
    <SuccessMessage
      className={`${positionClasses[position]} max-w-md shadow-lg`}
      autoHide={autoHide}
      dismissible={dismissible}
      {...props}
    />
  );
}
