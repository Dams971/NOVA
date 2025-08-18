'use client';

import { AlertCircle } from 'lucide-react';
import React from 'react';

interface ErrorMessageProps {
  id?: string;
  message: string;
  className?: string;
  showIcon?: boolean;
  role?: 'alert' | 'status';
  'aria-live'?: 'polite' | 'assertive';
}

/**
 * ErrorMessage component displays error messages in an accessible way.
 * It includes proper ARIA attributes and visual indicators for errors.
 */
export function ErrorMessage({
  id,
  message,
  className = '',
  showIcon = true,
  role = 'alert',
  'aria-live': ariaLive = 'assertive',
  ...props
}: ErrorMessageProps & React.HTMLAttributes<HTMLDivElement>) {
  if (!message) return null;

  const divProps: React.HTMLAttributes<HTMLDivElement> = {
    id,
    role,
    'aria-live': ariaLive,
    className: `flex items-center text-sm text-red-600 mt-1 ${className}`,
    ...props
  };

  return (
    <div {...divProps}>
      {showIcon && (
        <AlertCircle className="h-4 w-4 mr-1 flex-shrink-0" aria-hidden="true" />
      )}
      <span>{message}</span>
    </div>
  );
}


// Component for field-specific errors
interface FieldErrorProps {
  fieldName: string;
  error?: string;
  className?: string;
}

export function FieldError({ fieldName, error, className = '' }: FieldErrorProps) {
  if (!error) return null;

  const errorId = `${fieldName}-error`;

  return (
    <ErrorMessage
      id={errorId}
      message={error}
      className={className}
      aria-describedby={errorId}
    />
  );
}

// Component for form-level errors
interface FormErrorProps {
  errors: Record<string, string>;
  className?: string;
  title?: string;
}

export function FormError({ errors, className = '', title = 'Erreurs de validation' }: FormErrorProps) {
  const errorEntries = Object.entries(errors).filter(([, error]) => error);
  
  if (errorEntries.length === 0) return null;

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={`bg-red-50 border border-red-200 rounded-md p-4 ${className}`}
    >
      <div className="flex">
        <AlertCircle className="h-5 w-5 text-red-400 mr-2 flex-shrink-0 mt-0.5" aria-hidden="true" />
        <div className="flex-1">
          <h3 className="text-sm font-medium text-red-800 mb-2">
            {title}
          </h3>
          <ul className="text-sm text-red-700 space-y-1">
            {errorEntries.map(([field, error]) => (
              <li key={field}>
                <strong className="capitalize">{field}:</strong> {error}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}