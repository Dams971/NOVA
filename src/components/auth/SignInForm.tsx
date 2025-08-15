/**
 * Sign In Form Component for NOVA RDV+
 * 
 * Features:
 * - Email/OTP authentication
 * - Accessible form with ARIA labels
 * - Real-time validation
 * - Rate limiting display
 * - Auto-focus and keyboard navigation
 */

import React, { useState, useEffect, useRef } from 'react';
import { FocusTrap } from '../ui/FocusTrap';
import { LiveRegion } from '../ui/LiveRegion';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { ErrorMessage } from '../ui/ErrorMessage';
import { SuccessMessage } from '../ui/SuccessMessage';

export interface SignInFormProps {
  onSignInSuccess: (patient: any, sessionId: string) => void;
  onSignUpRedirect: () => void;
  onCancel: () => void;
  initialEmail?: string;
  className?: string;
}

export interface SignInState {
  step: 'email' | 'otp';
  email: string;
  otpCode: string;
  isLoading: boolean;
  error: string | null;
  success: string | null;
  otpSentAt: Date | null;
  attemptsRemaining: number;
  canResendOTP: boolean;
  resendCooldown: number;
}

export const SignInForm: React.FC<SignInFormProps> = ({
  onSignInSuccess,
  onSignUpRedirect,
  onCancel,
  initialEmail = '',
  className = ''
}) => {
  const [state, setState] = useState<SignInState>({
    step: 'email',
    email: initialEmail,
    otpCode: '',
    isLoading: false,
    error: null,
    success: null,
    otpSentAt: null,
    attemptsRemaining: 3,
    canResendOTP: false,
    resendCooldown: 0
  });

  const emailInputRef = useRef<HTMLInputElement>(null);
  const otpInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // Auto-focus on mount and step changes
  useEffect(() => {
    if (state.step === 'email' && emailInputRef.current) {
      emailInputRef.current.focus();
    } else if (state.step === 'otp' && otpInputRef.current) {
      otpInputRef.current.focus();
    }
  }, [state.step]);

  // Handle OTP resend cooldown
  useEffect(() => {
    if (state.resendCooldown > 0) {
      const timer = setTimeout(() => {
        setState(prev => ({
          ...prev,
          resendCooldown: prev.resendCooldown - 1,
          canResendOTP: prev.resendCooldown <= 1
        }));
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [state.resendCooldown]);

  const validateEmail = (email: string): string | null => {
    if (!email.trim()) {
      return 'Adresse email requise';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return 'Format d\'email invalide';
    }

    if (email.length > 254) {
      return 'Adresse email trop longue';
    }

    return null;
  };

  const validateOTP = (otp: string): string | null => {
    if (!otp.trim()) {
      return 'Code de vérification requis';
    }

    if (!/^\d{6}$/.test(otp)) {
      return 'Le code doit contenir 6 chiffres';
    }

    return null;
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const emailError = validateEmail(state.email);
    if (emailError) {
      setState(prev => ({ ...prev, error: emailError }));
      return;
    }

    setState(prev => ({ 
      ...prev, 
      isLoading: true, 
      error: null, 
      success: null 
    }));

    try {
      // Check if account exists
      const response = await fetch('/api/auth/check-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: state.email })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erreur de vérification du compte');
      }

      if (!result.exists) {
        setState(prev => ({ ...prev, isLoading: false }));
        onSignUpRedirect();
        return;
      }

      // Send OTP
      const otpResponse = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: state.email })
      });

      const otpResult = await otpResponse.json();

      if (!otpResponse.ok) {
        throw new Error(otpResult.error || 'Erreur d\'envoi du code');
      }

      setState(prev => ({
        ...prev,
        step: 'otp',
        isLoading: false,
        success: 'Code de vérification envoyé par email',
        otpSentAt: new Date(),
        resendCooldown: 60,
        canResendOTP: false
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Erreur de connexion'
      }));
    }
  };

  const handleOTPSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const otpError = validateOTP(state.otpCode);
    if (otpError) {
      setState(prev => ({ ...prev, error: otpError }));
      return;
    }

    setState(prev => ({ 
      ...prev, 
      isLoading: true, 
      error: null, 
      success: null 
    }));

    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: state.email, 
          otp: state.otpCode 
        })
      });

      const result = await response.json();

      if (!response.ok) {
        if (result.attempts_remaining !== undefined) {
          setState(prev => ({
            ...prev,
            isLoading: false,
            error: result.error,
            attemptsRemaining: result.attempts_remaining,
            otpCode: ''
          }));
        } else {
          throw new Error(result.error || 'Code de vérification invalide');
        }
        return;
      }

      setState(prev => ({
        ...prev,
        isLoading: false,
        success: 'Connexion réussie !'
      }));

      // Delay to show success message
      setTimeout(() => {
        onSignInSuccess(result.patient, result.sessionId);
      }, 1000);
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Erreur de vérification'
      }));
    }
  };

  const handleResendOTP = async () => {
    if (!state.canResendOTP) return;

    setState(prev => ({ 
      ...prev, 
      isLoading: true, 
      error: null 
    }));

    try {
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: state.email })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erreur d\'envoi du code');
      }

      setState(prev => ({
        ...prev,
        isLoading: false,
        success: 'Nouveau code envoyé par email',
        otpSentAt: new Date(),
        resendCooldown: 60,
        canResendOTP: false,
        attemptsRemaining: 3,
        otpCode: ''
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Erreur de renvoi'
      }));
    }
  };

  const handleBackToEmail = () => {
    setState(prev => ({
      ...prev,
      step: 'email',
      otpCode: '',
      error: null,
      success: null
    }));
  };

  const handleOTPChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setState(prev => ({ ...prev, otpCode: value, error: null }));

    // Auto-submit when 6 digits entered
    if (value.length === 6) {
      setTimeout(() => {
        if (formRef.current) {
          formRef.current.requestSubmit();
        }
      }, 100);
    }
  };

  return (
    <FocusTrap>
      <div className={`sign-in-form ${className}`}>
        <LiveRegion>
          {state.error && <ErrorMessage message={state.error} />}
          {state.success && <SuccessMessage message={state.success} />}
        </LiveRegion>

        <div className="sign-in-header">
          <h2 id="sign-in-title">
            {state.step === 'email' ? 'Connexion' : 'Vérification'}
          </h2>
          <p className="sign-in-description">
            {state.step === 'email' 
              ? 'Connectez-vous à votre compte NOVA RDV'
              : 'Entrez le code reçu par email'
            }
          </p>
        </div>

        {state.step === 'email' ? (
          <form 
            ref={formRef}
            onSubmit={handleEmailSubmit}
            noValidate
            role="form"
            aria-labelledby="sign-in-title"
          >
            <div className="form-group">
              <label htmlFor="signin-email" className="form-label">
                Adresse email
              </label>
              <input
                ref={emailInputRef}
                id="signin-email"
                type="email"
                value={state.email}
                onChange={(e) => setState(prev => ({ 
                  ...prev, 
                  email: e.target.value.toLowerCase().trim(),
                  error: null 
                }))}
                className={`form-input ${state.error ? 'error' : ''}`}
                placeholder="votre.email@exemple.com"
                required
                autoComplete="email"
                disabled={state.isLoading}
                aria-describedby={state.error ? "signin-email-error" : undefined}
              />
              {state.error && (
                <div id="signin-email-error" className="error-text" role="alert">
                  {state.error}
                </div>
              )}
            </div>

            <div className="form-actions">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={state.isLoading || !state.email.trim()}
                aria-describedby={state.isLoading ? "loading-status" : undefined}
              >
                {state.isLoading ? (
                  <>
                    <LoadingSpinner size="small" />
                    <span>Vérification...</span>
                  </>
                ) : (
                  'Se connecter'
                )}
              </button>

              <button
                type="button"
                onClick={onCancel}
                className="btn btn-secondary"
                disabled={state.isLoading}
              >
                Annuler
              </button>
            </div>

            <div className="form-footer">
              <p>
                Pas de compte ?{' '}
                <button
                  type="button"
                  onClick={onSignUpRedirect}
                  className="link-button"
                  disabled={state.isLoading}
                >
                  Créer un compte
                </button>
              </p>
            </div>
          </form>
        ) : (
          <form 
            ref={formRef}
            onSubmit={handleOTPSubmit}
            noValidate
            role="form"
            aria-labelledby="sign-in-title"
          >
            <div className="form-group">
              <label htmlFor="signin-otp" className="form-label">
                Code de vérification
              </label>
              <input
                ref={otpInputRef}
                id="signin-otp"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={state.otpCode}
                onChange={handleOTPChange}
                className={`form-input otp-input ${state.error ? 'error' : ''}`}
                placeholder="000000"
                maxLength={6}
                required
                autoComplete="one-time-code"
                disabled={state.isLoading}
                aria-describedby="otp-description"
              />
              <div id="otp-description" className="form-help">
                Code à 6 chiffres envoyé à {state.email}
              </div>
              {state.error && (
                <div className="error-text" role="alert">
                  {state.error}
                </div>
              )}
              {state.attemptsRemaining < 3 && (
                <div className="warning-text" role="alert">
                  {state.attemptsRemaining} tentative(s) restante(s)
                </div>
              )}
            </div>

            <div className="form-actions">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={state.isLoading || state.otpCode.length !== 6}
              >
                {state.isLoading ? (
                  <>
                    <LoadingSpinner size="small" />
                    <span>Vérification...</span>
                  </>
                ) : (
                  'Vérifier le code'
                )}
              </button>

              <button
                type="button"
                onClick={handleBackToEmail}
                className="btn btn-secondary"
                disabled={state.isLoading}
              >
                Modifier l'email
              </button>
            </div>

            <div className="form-footer">
              <div className="resend-section">
                {state.canResendOTP ? (
                  <button
                    type="button"
                    onClick={handleResendOTP}
                    className="link-button"
                    disabled={state.isLoading}
                  >
                    Renvoyer le code
                  </button>
                ) : (
                  <span className="resend-cooldown">
                    Renvoyer dans {state.resendCooldown}s
                  </span>
                )}
              </div>
            </div>
          </form>
        )}

        {state.isLoading && (
          <div id="loading-status" className="sr-only" aria-live="polite">
            Chargement en cours...
          </div>
        )}
      </div>

      <style jsx>{`
        .sign-in-form {
          max-width: 400px;
          margin: 0 auto;
          padding: 24px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .sign-in-header {
          text-align: center;
          margin-bottom: 32px;
        }

        .sign-in-header h2 {
          font-size: 24px;
          font-weight: 600;
          color: #1a202c;
          margin: 0 0 8px 0;
        }

        .sign-in-description {
          color: #718096;
          font-size: 14px;
          margin: 0;
        }

        .form-group {
          margin-bottom: 24px;
        }

        .form-label {
          display: block;
          font-weight: 600;
          color: #2d3748;
          margin-bottom: 8px;
          font-size: 14px;
        }

        .form-input {
          width: 100%;
          padding: 12px 16px;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          font-size: 16px;
          transition: border-color 0.2s, box-shadow 0.2s;
          background: white;
        }

        .form-input:focus {
          outline: none;
          border-color: #3182ce;
          box-shadow: 0 0 0 3px rgba(49, 130, 206, 0.1);
        }

        .form-input.error {
          border-color: #e53e3e;
        }

        .form-input.error:focus {
          border-color: #e53e3e;
          box-shadow: 0 0 0 3px rgba(229, 62, 62, 0.1);
        }

        .otp-input {
          text-align: center;
          font-size: 24px;
          font-weight: 600;
          letter-spacing: 8px;
          font-family: 'Courier New', monospace;
        }

        .form-help {
          font-size: 13px;
          color: #718096;
          margin-top: 4px;
        }

        .error-text {
          color: #e53e3e;
          font-size: 13px;
          margin-top: 4px;
          font-weight: 500;
        }

        .warning-text {
          color: #d69e2e;
          font-size: 13px;
          margin-top: 4px;
          font-weight: 500;
        }

        .form-actions {
          display: flex;
          gap: 12px;
          margin-bottom: 24px;
        }

        .btn {
          flex: 1;
          padding: 12px 16px;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .btn:focus {
          outline: none;
          box-shadow: 0 0 0 3px rgba(49, 130, 206, 0.3);
        }

        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .btn-primary {
          background: #3182ce;
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          background: #2c5aa0;
        }

        .btn-secondary {
          background: #e2e8f0;
          color: #4a5568;
        }

        .btn-secondary:hover:not(:disabled) {
          background: #cbd5e0;
        }

        .form-footer {
          text-align: center;
          font-size: 14px;
          color: #718096;
        }

        .link-button {
          background: none;
          border: none;
          color: #3182ce;
          text-decoration: underline;
          cursor: pointer;
          font-size: inherit;
          padding: 0;
        }

        .link-button:hover:not(:disabled) {
          color: #2c5aa0;
        }

        .link-button:focus {
          outline: 2px solid #3182ce;
          outline-offset: 2px;
        }

        .resend-section {
          margin-top: 16px;
        }

        .resend-cooldown {
          color: #a0aec0;
          font-size: 13px;
        }

        .sr-only {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border: 0;
        }

        @media (max-width: 480px) {
          .sign-in-form {
            margin: 0;
            padding: 20px;
            border-radius: 0;
          }

          .form-actions {
            flex-direction: column;
          }

          .btn {
            flex: none;
          }
        }
      `}</style>
    </FocusTrap>
  );
};