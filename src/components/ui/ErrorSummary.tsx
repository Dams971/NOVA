'use client';

import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface ErrorItem {
  field: string;
  message: string;
  fieldId?: string;
}

interface ErrorSummaryProps {
  errors: ErrorItem[];
  title?: string;
  className?: string;
}

export default function ErrorSummary({ 
  errors, 
  title = "Il y a des problèmes à corriger",
  className = ""
}: ErrorSummaryProps) {
  if (errors.length === 0) return null;
  
  const handleErrorClick = (fieldId?: string) => {
    if (!fieldId) return;
    
    const field = document.getElementById(fieldId);
    if (field) {
      field.focus();
      
      // Scroll with offset for sticky headers
      const elementPosition = field.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - 80;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };
  
  return (
    <div 
      role="alert"
      aria-labelledby="error-summary-title"
      className={`error-summary border-l-4 border-red-600 bg-red-50 p-4 mb-6 rounded-r-md ${className}`}
    >
      <div className="flex items-start gap-3">
        <AlertTriangle 
          className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" 
          aria-hidden="true"
        />
        <div className="flex-1">
          <h2 
            id="error-summary-title" 
            className="text-lg font-semibold text-red-900 mb-3"
          >
            {title}
          </h2>
          
          <ul className="space-y-2">
            {errors.map((error, index) => (
              <li key={index}>
                {error.fieldId ? (
                  <button
                    type="button"
                    onClick={() => handleErrorClick(error.fieldId)}
                    className="text-red-700 underline hover:text-red-800 text-left focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 rounded-sm"
                  >
                    <span className="font-medium">{error.field}:</span> {error.message}
                  </button>
                ) : (
                  <span className="text-red-700">
                    <span className="font-medium">{error.field}:</span> {error.message}
                  </span>
                )}
              </li>
            ))}
          </ul>
          
          {errors.length > 1 && (
            <p className="mt-3 text-sm text-red-800">
              Corrigez ces {errors.length} erreurs pour continuer.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}