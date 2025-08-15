/**
 * Sign Up Form Component for NOVA RDV+
 * 
 * Features:
 * - Complete patient registration
 * - GDPR consent checkboxes
 * - Real-time validation
 * - Accessible form with ARIA labels
 * - Phone number formatting
 * - Password-less registration (email verification)
 */

import React, { useState, useEffect, useRef } from 'react';
import { parsePhoneNumber } from 'libphonenumber-js';
import { FocusTrap } from '../ui/FocusTrap';
import { LiveRegion } from '../ui/LiveRegion';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { ErrorMessage } from '../ui/ErrorMessage';
import { SuccessMessage } from '../ui/SuccessMessage';

export interface SignUpFormProps {
  onSignUpSuccess: (patient: any) => void;
  onSignInRedirect: () => void;
  onCancel: () => void;
  initialEmail?: string;
  initialName?: string;
  initialPhone?: string;
  className?: string;
}

export interface SignUpState {
  formData: {
    name: string;
    email: string;
    phone: string;
  };
  consent: {
    dataProcessing: boolean;
    marketingEmails: boolean;
    transactionalEmails: boolean;
  };
  validation: {
    name: string | null;
    email: string | null;
    phone: string | null;
    consent: string | null;
  };
  isLoading: boolean;
  error: string | null;
  success: string | null;
  showPrivacyPolicy: boolean;
}

export const SignUpForm: React.FC<SignUpFormProps> = ({
  onSignUpSuccess,
  onSignInRedirect,
  onCancel,
  initialEmail = '',
  initialName = '',
  initialPhone = '',
  className = ''
}) => {
  const [state, setState] = useState<SignUpState>({
    formData: {
      name: initialName,
      email: initialEmail,
      phone: initialPhone
    },
    consent: {
      dataProcessing: false,
      marketingEmails: false,
      transactionalEmails: true // Usually checked by default
    },
    validation: {
      name: null,
      email: null,
      phone: null,
      consent: null
    },
    isLoading: false,
    error: null,
    success: null,
    showPrivacyPolicy: false
  });

  const nameInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // Auto-focus on mount
  useEffect(() => {
    if (nameInputRef.current) {
      nameInputRef.current.focus();
    }
  }, []);

  const validateName = (name: string): string | null => {
    if (!name.trim()) {
      return 'Nom et prénom requis';
    }

    if (name.trim().length < 2) {
      return 'Le nom doit contenir au moins 2 caractères';
    }

    if (name.trim().length > 100) {
      return 'Le nom ne peut pas dépasser 100 caractères';
    }

    // Check for valid characters (letters, spaces, hyphens, dots)
    if (!/^[A-Za-zÀ-ÿ\s\-\.]+$/.test(name.trim())) {
      return 'Le nom ne peut contenir que des lettres, espaces, tirets et points';
    }

    // Must have at least one vowel and consonant
    const hasVowel = /[aeiouàáâãäåæèéêëìíîïòóôõöøùúûüý]/i.test(name);
    const hasConsonant = /[bcdfghjklmnpqrstvwxyz]/i.test(name);
    
    if (!hasVowel || !hasConsonant) {
      return 'Veuillez entrer un nom valide';
    }

    return null;
  };

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

    // Check for temporary email providers
    const tempDomains = ['10minutemail.com', 'guerrillamail.com', 'mailinator.com', 'yopmail.com'];
    const domain = email.split('@')[1]?.toLowerCase();
    if (tempDomains.includes(domain)) {
      return 'Les emails temporaires ne sont pas autorisés';
    }

    return null;
  };

  const validatePhone = (phone: string): string | null => {
    if (!phone.trim()) {
      return 'Numéro de téléphone requis';
    }

    try {
      const phoneNumber = parsePhoneNumber(phone, 'DZ');
      
      if (!phoneNumber.isValid()) {
        return 'Numéro de téléphone invalide';
      }

      if (phoneNumber.country !== 'DZ') {
        return 'Veuillez entrer un numéro algérien (+213)';
      }

      if (!phoneNumber.getType() || phoneNumber.getType() !== 'MOBILE') {
        return 'Veuillez entrer un numéro de mobile';
      }

      return null;
    } catch (error) {
      return 'Format de téléphone invalide. Utilisez +213XXXXXXXXX';
    }
  };

  const validateConsent = (consent: typeof state.consent): string | null => {
    if (!consent.dataProcessing) {
      return 'Vous devez accepter le traitement de vos données personnelles pour créer un compte';
    }
    return null;
  };

  const formatPhoneNumber = (phone: string): string => {
    // Remove all non-digits first
    const digits = phone.replace(/\D/g, '');
    
    // If starts with 213, format as +213 X XX XX XX XX
    if (digits.startsWith('213')) {
      const number = digits.slice(3);
      if (number.length <= 9) {
        return `+213 ${number.slice(0, 1)} ${number.slice(1, 3)} ${number.slice(3, 5)} ${number.slice(5, 7)} ${number.slice(7, 9)}`.trim();
      }
    }
    
    // If starts with 0, replace with +213
    if (digits.startsWith('0')) {
      const number = digits.slice(1);
      if (number.length <= 9) {
        return `+213 ${number.slice(0, 1)} ${number.slice(1, 3)} ${number.slice(3, 5)} ${number.slice(5, 7)} ${number.slice(7, 9)}`.trim();
      }
    }
    
    // Otherwise just add +213 prefix if needed
    if (!phone.startsWith('+213') && digits.length <= 9) {
      return `+213 ${digits.slice(0, 1)} ${digits.slice(1, 3)} ${digits.slice(3, 5)} ${digits.slice(5, 7)} ${digits.slice(7, 9)}`.trim();
    }
    
    return phone;
  };

  const handleInputChange = (field: keyof typeof state.formData, value: string) => {
    let processedValue = value;
    
    if (field === 'phone') {
      processedValue = formatPhoneNumber(value);
    } else if (field === 'email') {
      processedValue = value.toLowerCase().trim();
    }

    setState(prev => ({
      ...prev,
      formData: {
        ...prev.formData,
        [field]: processedValue
      },
      validation: {
        ...prev.validation,
        [field]: null
      },
      error: null
    }));
  };

  const handleConsentChange = (type: keyof typeof state.consent, checked: boolean) => {
    setState(prev => ({
      ...prev,
      consent: {
        ...prev.consent,
        [type]: checked
      },
      validation: {
        ...prev.validation,
        consent: null
      },
      error: null
    }));
  };

  const validateForm = (): boolean => {
    const nameError = validateName(state.formData.name);
    const emailError = validateEmail(state.formData.email);
    const phoneError = validatePhone(state.formData.phone);
    const consentError = validateConsent(state.consent);

    setState(prev => ({
      ...prev,
      validation: {
        name: nameError,
        email: emailError,
        phone: phoneError,
        consent: consentError
      }
    }));

    return !nameError && !emailError && !phoneError && !consentError;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setState(prev => ({ 
      ...prev, 
      isLoading: true, 
      error: null, 
      success: null 
    }));

    try {
      // Normalize phone to E.164 format
      const phoneNumber = parsePhoneNumber(state.formData.phone, 'DZ');
      const phoneE164 = phoneNumber.format('E.164');

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: state.formData.name.trim(),
          email: state.formData.email,
          phone_e164: phoneE164,
          gdpr_consent: {
            data_processing: {
              consent: state.consent.dataProcessing,
              timestamp: new Date().toISOString()
            },
            marketing_emails: {
              consent: state.consent.marketingEmails,
              timestamp: new Date().toISOString()
            },
            transactional_emails: {
              consent: state.consent.transactionalEmails,
              timestamp: new Date().toISOString()
            }
          }
        })
      });

      const result = await response.json();

      if (!response.ok) {
        if (result.error === 'Account with this email already exists') {
          setState(prev => ({ ...prev, isLoading: false }));
          onSignInRedirect();
          return;
        }
        throw new Error(result.error || 'Erreur lors de la création du compte');
      }

      setState(prev => ({
        ...prev,
        isLoading: false,
        success: 'Compte créé avec succès !'
      }));

      // Delay to show success message
      setTimeout(() => {
        onSignUpSuccess(result.patient);
      }, 1500);
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Erreur de création du compte'
      }));
    }
  };

  return (
    <FocusTrap>
      <div className={`sign-up-form ${className}`}>
        <LiveRegion>
          {state.error && <ErrorMessage message={state.error} />}
          {state.success && <SuccessMessage message={state.success} />}
        </LiveRegion>

        <div className="sign-up-header">
          <h2 id="sign-up-title">Créer un compte</h2>
          <p className="sign-up-description">
            Rejoignez NOVA RDV pour gérer vos rendez-vous facilement
          </p>
        </div>

        <form 
          ref={formRef}
          onSubmit={handleSubmit}
          noValidate
          role="form"
          aria-labelledby="sign-up-title"
        >
          {/* Name Field */}
          <div className="form-group">
            <label htmlFor="signup-name" className="form-label">
              Nom et prénom *
            </label>
            <input
              ref={nameInputRef}
              id="signup-name"
              type="text"
              value={state.formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className={`form-input ${state.validation.name ? 'error' : ''}`}
              placeholder="Jean Dupont"
              required
              autoComplete="name"
              disabled={state.isLoading}
              aria-describedby={state.validation.name ? "signup-name-error" : undefined}
            />
            {state.validation.name && (
              <div id="signup-name-error" className="error-text" role="alert">
                {state.validation.name}
              </div>
            )}
          </div>

          {/* Email Field */}
          <div className="form-group">
            <label htmlFor="signup-email" className="form-label">
              Adresse email *
            </label>
            <input
              id="signup-email"
              type="email"
              value={state.formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className={`form-input ${state.validation.email ? 'error' : ''}`}
              placeholder="jean.dupont@exemple.com"
              required
              autoComplete="email"
              disabled={state.isLoading}
              aria-describedby={state.validation.email ? "signup-email-error" : undefined}
            />
            {state.validation.email && (
              <div id="signup-email-error" className="error-text" role="alert">
                {state.validation.email}
              </div>
            )}
          </div>

          {/* Phone Field */}
          <div className="form-group">
            <label htmlFor="signup-phone" className="form-label">
              Numéro de téléphone *
            </label>
            <input
              id="signup-phone"
              type="tel"
              value={state.formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              className={`form-input ${state.validation.phone ? 'error' : ''}`}
              placeholder="+213 5 XX XX XX XX"
              required
              autoComplete="tel"
              disabled={state.isLoading}
              aria-describedby="phone-help signup-phone-error"
            />
            <div id="phone-help" className="form-help">
              Format algérien (+213) requis
            </div>
            {state.validation.phone && (
              <div id="signup-phone-error" className="error-text" role="alert">
                {state.validation.phone}
              </div>
            )}
          </div>

          {/* GDPR Consent Section */}
          <div className="consent-section">
            <h3 className="consent-title">Consentements RGPD</h3>
            
            {/* Data Processing Consent (Required) */}
            <div className="consent-group">
              <label className="consent-label">
                <input
                  type="checkbox"
                  checked={state.consent.dataProcessing}
                  onChange={(e) => handleConsentChange('dataProcessing', e.target.checked)}
                  className="consent-checkbox"
                  required
                  disabled={state.isLoading}
                  aria-describedby="data-processing-help"
                />
                <span className="consent-text">
                  J'accepte le traitement de mes données personnelles pour la création et gestion de mon compte *
                </span>
              </label>
              <div id="data-processing-help" className="consent-help">
                Requis pour créer votre compte et gérer vos rendez-vous
              </div>
            </div>

            {/* Transactional Emails Consent */}
            <div className="consent-group">
              <label className="consent-label">
                <input
                  type="checkbox"
                  checked={state.consent.transactionalEmails}
                  onChange={(e) => handleConsentChange('transactionalEmails', e.target.checked)}
                  className="consent-checkbox"
                  disabled={state.isLoading}
                />
                <span className="consent-text">
                  J'accepte de recevoir les emails de confirmation et rappel de rendez-vous
                </span>
              </label>
              <div className="consent-help">
                Recommandé pour recevoir vos confirmations de RDV
              </div>
            </div>

            {/* Marketing Emails Consent */}
            <div className="consent-group">
              <label className="consent-label">
                <input
                  type="checkbox"
                  checked={state.consent.marketingEmails}
                  onChange={(e) => handleConsentChange('marketingEmails', e.target.checked)}
                  className="consent-checkbox"
                  disabled={state.isLoading}
                />
                <span className="consent-text">
                  J'accepte de recevoir des informations sur les services et promotions
                </span>
              </label>
              <div className="consent-help">
                Optionnel - vous pouvez modifier ce choix à tout moment
              </div>
            </div>

            {state.validation.consent && (
              <div className="error-text" role="alert">
                {state.validation.consent}
              </div>
            )}
          </div>

          {/* Privacy Policy Link */}
          <div className="privacy-section">
            <p className="privacy-text">
              En créant un compte, vous acceptez nos{' '}
              <button
                type="button"
                onClick={() => setState(prev => ({ ...prev, showPrivacyPolicy: true }))}
                className="link-button"
                disabled={state.isLoading}
              >
                conditions d'utilisation
              </button>{' '}
              et notre{' '}
              <button
                type="button"
                onClick={() => setState(prev => ({ ...prev, showPrivacyPolicy: true }))}
                className="link-button"
                disabled={state.isLoading}
              >
                politique de confidentialité
              </button>.
            </p>
          </div>

          {/* Form Actions */}
          <div className="form-actions">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={state.isLoading || !state.consent.dataProcessing}
            >
              {state.isLoading ? (
                <>
                  <LoadingSpinner size="small" />
                  <span>Création du compte...</span>
                </>
              ) : (
                'Créer mon compte'
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
              Déjà un compte ?{' '}
              <button
                type="button"
                onClick={onSignInRedirect}
                className="link-button"
                disabled={state.isLoading}
              >
                Se connecter
              </button>
            </p>
          </div>
        </form>

        {state.isLoading && (
          <div className="sr-only" aria-live="polite">
            Création du compte en cours...
          </div>
        )}
      </div>

      <style jsx>{`
        .sign-up-form {
          max-width: 500px;
          margin: 0 auto;
          padding: 24px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .sign-up-header {
          text-align: center;
          margin-bottom: 32px;
        }

        .sign-up-header h2 {
          font-size: 24px;
          font-weight: 600;
          color: #1a202c;
          margin: 0 0 8px 0;
        }

        .sign-up-description {
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

        .consent-section {
          margin-bottom: 24px;
          padding: 20px;
          background: #f7fafc;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
        }

        .consent-title {
          font-size: 16px;
          font-weight: 600;
          color: #2d3748;
          margin: 0 0 16px 0;
        }

        .consent-group {
          margin-bottom: 16px;
        }

        .consent-label {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          cursor: pointer;
          font-size: 14px;
          line-height: 1.5;
        }

        .consent-checkbox {
          margin-top: 2px;
          width: 16px;
          height: 16px;
          accent-color: #3182ce;
        }

        .consent-text {
          color: #2d3748;
        }

        .consent-help {
          font-size: 12px;
          color: #718096;
          margin-top: 4px;
          margin-left: 28px;
        }

        .privacy-section {
          margin-bottom: 24px;
          padding: 16px;
          background: #edf2f7;
          border-radius: 6px;
        }

        .privacy-text {
          font-size: 13px;
          color: #4a5568;
          margin: 0;
          line-height: 1.5;
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
          .sign-up-form {
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

          .consent-label {
            gap: 8px;
          }

          .consent-help {
            margin-left: 24px;
          }
        }
      `}</style>
    </FocusTrap>
  );
};