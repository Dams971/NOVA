/**
 * NOVA RDV v2 - Error Boundary pour RDV
 * 
 * Composant Error Boundary spécialisé pour la gestion des erreurs
 * dans l'interface de rendez-vous et l'assistant IA
 */

'use client';

import { motion } from 'framer-motion';
import { AlertTriangle, RefreshCw, MessageCircle, Phone } from 'lucide-react';
import React, { Component, ReactNode } from 'react';
import { logger } from '@/lib/logging/logger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorId: string;
}

export class RDVErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorId: ''
    };
  }

  static getDerivedStateFromError(error: Error): State {
    const errorId = `rdv_error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      hasError: true,
      error,
      errorId
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log l'erreur avec contexte RDV
    logger.error('Erreur RDV Error Boundary:', {
      error: error.message,
      stack: error.stack,
      errorInfo,
      errorId: this.state.errorId,
      timestamp: new Date().toISOString(),
      context: 'rdv_interface'
    });

    // Callback personnalisé
    this.props.onError?.(error, errorInfo);

    // Optionnel: Envoyer à un service de monitoring
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'exception', {
        description: `RDV Error: ${error.message}`,
        fatal: false,
        custom_map: {
          error_id: this.state.errorId
        }
      });
    }
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorId: ''
    });
  };

  render() {
    if (this.state.hasError) {
      // Utiliser le fallback personnalisé si fourni
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Interface d'erreur par défaut
      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="min-h-[400px] flex items-center justify-center p-6"
        >
          <div className="max-w-md w-full text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2 }}
              className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4"
            >
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </motion.div>

            <h3 className="text-xl font-heading font-semibold text-gray-900 mb-2">
              Oups ! Une erreur s'est produite
            </h3>
            
            <p className="text-gray-600 mb-6">
              Notre assistant IA a rencontré un problème technique. 
              Nos équipes ont été notifiées automatiquement.
            </p>

            {/* Détails techniques (dev mode seulement) */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mb-6 text-left bg-gray-50 p-4 rounded-lg">
                <summary className="cursor-pointer text-sm font-medium text-gray-700 mb-2">
                  Détails techniques
                </summary>
                <pre className="text-xs text-gray-600 overflow-auto">
                  <code>{this.state.error.message}</code>
                </pre>
                <p className="text-xs text-gray-500 mt-2">
                  ID: {this.state.errorId}
                </p>
              </details>
            )}

            {/* Actions de récupération */}
            <div className="space-y-3">
              <motion.button
                onClick={this.handleRetry}
                className="w-full bg-nova-blue text-white px-6 py-3 rounded-xl hover:bg-nova-blue-dark transition-colors flex items-center justify-center space-x-2"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <RefreshCw className="w-5 h-5" />
                <span>Réessayer</span>
              </motion.button>

              <button
                onClick={() => window.location.reload()}
                className="w-full bg-gray-100 text-gray-700 px-6 py-3 rounded-xl hover:bg-gray-200 transition-colors"
              >
                Recharger la page
              </button>
            </div>

            {/* Contact support */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-500 mb-3">
                Le problème persiste ?
              </p>
              
              <div className="flex space-x-4 justify-center">
                <a
                  href="tel:+213XXXXXXXXX"
                  className="flex items-center space-x-2 text-nova-blue hover:underline text-sm"
                >
                  <Phone className="w-4 h-4" />
                  <span>Nous appeler</span>
                </a>
                
                <button
                  onClick={() => {
                    // Rediriger vers un chat de support ou un formulaire
                    window.location.href = '/contact';
                  }}
                  className="flex items-center space-x-2 text-nova-blue hover:underline text-sm"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Chat support</span>
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      );
    }

    return this.props.children;
  }
}

// Wrapper fonctionnel pour usage avec hooks
export function withRDVErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  errorFallback?: ReactNode
) {
  return function WithErrorBoundaryComponent(props: P) {
    return (
      <RDVErrorBoundary fallback={errorFallback}>
        <WrappedComponent {...props} />
      </RDVErrorBoundary>
    );
  };
}

export default RDVErrorBoundary;