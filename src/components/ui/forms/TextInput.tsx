import { AlertCircle } from 'lucide-react';
import React, { forwardRef } from 'react';

interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
}

const TextInput = forwardRef<HTMLInputElement, TextInputProps>(
  ({ label, error, hint, id, required, className, ...props }, ref) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
    const errorId = error ? `${inputId}-error` : undefined;
    const hintId = hint ? `${inputId}-hint` : undefined;
    
    return (
      <div className="space-y-2">
        <label 
          htmlFor={inputId}
          className="block text-sm font-medium text-gray-700"
        >
          {label}
          {required && (
            <span 
              className="text-red-600 ml-1" 
              aria-label="requis"
              role="img"
            >
              *
            </span>
          )}
        </label>
        
        {hint && (
          <p id={hintId} className="text-sm text-gray-500">
            {hint}
          </p>
        )}
        
        <input
          ref={ref}
          id={inputId}
          aria-invalid={!!error}
          aria-required={required}
          aria-describedby={[errorId, hintId].filter(Boolean).join(' ')}
          className={`
            block w-full px-3 py-2 border rounded-md shadow-sm text-gray-900
            placeholder:text-gray-400
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:border-blue-500
            disabled:bg-gray-50 disabled:text-gray-500 disabled:border-gray-200 disabled:cursor-not-allowed
            transition-colors duration-200
            ${error 
              ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
              : 'border-gray-300 hover:border-gray-400'
            }
            min-h-touch-ios sm:min-h-touch-android
            ${className || ''}
          `}
          {...props}
        />
        
        {error && (
          <div 
            id={errorId} 
            role="alert" 
            className="flex items-start space-x-2 text-red-600"
          >
            <AlertCircle 
              className="w-4 h-4 mt-0.5 flex-shrink-0" 
              aria-hidden="true" 
            />
            <span className="text-sm font-medium">{error}</span>
          </div>
        )}
      </div>
    );
  }
);

TextInput.displayName = 'TextInput';
export default TextInput;