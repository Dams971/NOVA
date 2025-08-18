'use client';

import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { useEffect } from 'react';
import Button from '@/components/ui/forms/Button';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log the error to monitoring service
    console.error('RDV page error:', error);
  }, [error]);

  return (
    <div className="min-h-dvh flex items-center justify-center p-4 bg-gray-50">
      <div className="text-center space-y-6 max-w-md">
        {/* Error icon */}
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-100">
          <AlertTriangle className="w-10 h-10 text-red-600" aria-hidden="true" />
        </div>
        
        {/* Error content */}
        <div className="space-y-3">
          <h1 className="text-2xl font-bold text-gray-900">
            Une erreur s&apos;est produite
          </h1>
          <p className="text-gray-600 leading-relaxed">
            Nous rencontrons un problème technique lors du chargement de la page de prise de rendez-vous. 
            Veuillez réessayer dans quelques instants.
          </p>
          
          {/* Error details for development */}
          {process.env.NODE_ENV === 'development' && (
            <details className="text-left mt-4 p-4 bg-gray-100 rounded-md">
              <summary className="cursor-pointer text-sm font-medium text-gray-700 mb-2">
                Détails de l&apos;erreur (développement)
              </summary>
              <pre className="text-xs text-gray-600 whitespace-pre-wrap break-words">
                {error.message}
                {error.digest && `\nDigest: ${error.digest}`}
              </pre>
            </details>
          )}
        </div>
        
        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            onClick={reset}
            variant="primary"
            className="inline-flex items-center"
          >
            <RefreshCw className="w-4 h-4 mr-2" aria-hidden="true" />
            Réessayer
          </Button>
          
          <Button
            variant="secondary"
            onClick={() => window.location.href = '/'}
            className="inline-flex items-center"
          >
            <Home className="w-4 h-4 mr-2" aria-hidden="true" />
            Retour à l&apos;accueil
          </Button>
        </div>
        
        {/* Contact information */}
        <div className="pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            Si le problème persiste, contactez-nous au{' '}
            <a 
              href="tel:+213555123456" 
              className="text-blue-600 hover:text-blue-700 underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
            >
              05 55 12 34 56
            </a>
          </p>
        </div>
        
        {/* Screen reader announcement */}
        <div className="sr-only" role="alert" aria-live="assertive">
          Une erreur s&apos;est produite lors du chargement de la page. Des options de récupération sont disponibles.
        </div>
      </div>
    </div>
  );
}