'use client';

import React from 'react';
import { AlertCircle, CheckCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FormFieldProps {
  label: string;
  error?: string;
  success?: string;
  hint?: string;
  required?: boolean;
  children: React.ReactElement;
  className?: string;
  helpText?: string;
}

export default function FormField({
  label,
  error,
  success,
  hint,
  required,
  children,
  className,
  helpText
}: FormFieldProps) {
  const fieldId = children.props.id || `field-${Math.random().toString(36).substr(2, 9)}`;
  const errorId = error ? `${fieldId}-error` : undefined;
  const hintId = hint ? `${fieldId}-hint` : undefined;
  const helpId = helpText ? `${fieldId}-help` : undefined;
  const describedBy = [errorId, hintId, helpId].filter(Boolean).join(' ');
  
  return (
    <div className={cn('space-y-2', className)}>
      {/* Label with required indicator */}
      <label 
        htmlFor={fieldId}
        className="block text-sm font-medium text-gray-700"
      >
        {label}
        {required && (
          <span 
            className="text-red-600 ml-1" 
            aria-label="requis"
            title="Ce champ est obligatoire"
          >
            *
          </span>
        )}
      </label>
      
      {/* Hint text */}
      {hint && (
        <p id={hintId} className="text-sm text-gray-600 flex items-start gap-2">
          <Info className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-500" aria-hidden="true" />
          <span>{hint}</span>
        </p>
      )}
      
      {/* Form control with enhanced props */}
      {React.cloneElement(children, {
        id: fieldId,
        'aria-invalid': !!error,
        'aria-describedby': describedBy || undefined,
        'aria-required': required,
        className: cn(
          children.props.className,
          'touch-target',
          error && 'field-error',
          success && 'border-green-500 focus:ring-green-500'
        )
      })}
      
      {/* Error message */}
      {error && (
        <div 
          id={errorId}
          role="alert"
          className="error-message text-sm text-red-600 flex items-start gap-2 font-medium"
        >
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}
      
      {/* Success message */}
      {success && (
        <p className="text-sm text-green-600 flex items-start gap-2 font-medium">
          <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" aria-hidden="true" />
          <span>{success}</span>
        </p>
      )}
      
      {/* Help text */}
      {helpText && (
        <p id={helpId} className="text-xs text-gray-500">
          {helpText}
        </p>
      )}
    </div>
  );
}