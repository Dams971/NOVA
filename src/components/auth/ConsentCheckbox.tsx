/**
 * GDPR Consent Checkbox Component for NOVA RDV+
 * 
 * Features:
 * - Accessible checkbox with proper ARIA labels
 * - Required/optional consent types
 * - Privacy policy modal integration
 * - Clear visual design with help text
 * - Keyboard navigation support
 * - Consent timestamp tracking
 */

import React, { useState } from 'react';

export interface ConsentCheckboxProps {
  id: string;
  type: 'data_processing' | 'marketing_emails' | 'transactional_emails';
  label: string;
  helpText?: string;
  required?: boolean;
  checked?: boolean;
  disabled?: boolean;
  onChange?: (checked: boolean, timestamp?: Date) => void;
  onPrivacyPolicyClick?: () => void;
  className?: string;
  error?: boolean;
  errorMessage?: string;
}

export const ConsentCheckbox: React.FC<ConsentCheckboxProps> = ({
  id,
  type,
  label,
  helpText,
  required = false,
  checked = false,
  disabled = false,
  onChange,
  onPrivacyPolicyClick,
  className = '',
  error = false,
  errorMessage
}) => {
  const [isChecked, setIsChecked] = useState(checked);
  const [consentTimestamp, setConsentTimestamp] = useState<Date | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newChecked = e.target.checked;
    const timestamp = newChecked ? new Date() : null;
    
    setIsChecked(newChecked);
    setConsentTimestamp(timestamp);
    
    if (onChange) {
      onChange(newChecked, timestamp || undefined);
    }
  };

  const getConsentIcon = () => {
    switch (type) {
      case 'data_processing':
        return '🔒';
      case 'marketing_emails':
        return '📧';
      case 'transactional_emails':
        return '✉️';
      default:
        return '📋';
    }
  };

  const getConsentDescription = () => {
    switch (type) {
      case 'data_processing':
        return 'Nécessaire pour créer et gérer votre compte patient, prendre rendez-vous et assurer le suivi médical.';
      case 'marketing_emails':
        return 'Recevoir des informations sur nos nouveaux services, conseils de santé dentaire et offres spéciales.';
      case 'transactional_emails':
        return 'Recevoir les confirmations de rendez-vous, rappels et informations importantes concernant vos soins.';
      default:
        return '';
    }
  };

  const checkboxId = `consent-${id}`;
  const helpId = `${checkboxId}-help`;
  const errorId = `${checkboxId}-error`;

  return (
    <div className={`consent-checkbox ${className} ${error ? 'error' : ''} ${disabled ? 'disabled' : ''}`}>
      <div className="consent-main">
        <label htmlFor={checkboxId} className="consent-label">
          <div className="consent-input-wrapper">
            <input
              id={checkboxId}
              type="checkbox"
              checked={isChecked}
              onChange={handleChange}
              disabled={disabled}
              required={required}
              className="consent-input"
              aria-describedby={`${helpId} ${error ? errorId : ''}`.trim()}
              aria-invalid={error}
            />
            <div className="consent-checkmark" aria-hidden="true">
              {isChecked && (
                <svg 
                  width="12" 
                  height="12" 
                  viewBox="0 0 12 12" 
                  fill="none"
                  className="checkmark-icon"
                >
                  <path
                    d="M10 3L4.5 8.5L2 6"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </div>
          </div>
          
          <div className="consent-content">
            <div className="consent-header">
              <span className="consent-icon" aria-hidden="true">
                {getConsentIcon()}
              </span>
              <span className="consent-text">
                {label}
                {required && (
                  <span className="required-indicator" aria-label="requis">
                    {' '}*
                  </span>
                )}
              </span>
            </div>
            
            {helpText && (
              <div id={helpId} className="consent-help">
                {helpText}
              </div>
            )}
            
            <div className="consent-description">
              {getConsentDescription()}
            </div>
          </div>
        </label>
      </div>

      {/* Privacy Policy Link */}
      {type === 'data_processing' && onPrivacyPolicyClick && (
        <div className="privacy-policy-link">
          <button
            type="button"
            onClick={onPrivacyPolicyClick}
            className="link-button"
            disabled={disabled}
          >
            Consulter notre politique de confidentialité
          </button>
        </div>
      )}

      {/* Error Message */}
      {error && errorMessage && (
        <div id={errorId} className="error-message" role="alert">
          {errorMessage}
        </div>
      )}

      {/* Consent Timestamp (for debugging/compliance) */}
      {consentTimestamp && process.env.NODE_ENV === 'development' && (
        <div className="consent-timestamp">
          <small>
            Consentement donné le {consentTimestamp.toLocaleString('fr-FR')}
          </small>
        </div>
      )}

      <style jsx>{`
        .consent-checkbox {
          margin-bottom: 20px;
          padding: 16px;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          background: #f9fafb;
          transition: all 0.2s ease;
        }

        .consent-checkbox:hover:not(.disabled) {
          border-color: #cbd5e0;
          background: #f7fafc;
        }

        .consent-checkbox.error {
          border-color: #e53e3e;
          background: #fed7d7;
        }

        .consent-checkbox.disabled {
          opacity: 0.6;
          background: #f1f5f9;
        }

        .consent-main {
          margin-bottom: 12px;
        }

        .consent-label {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          cursor: pointer;
          font-size: 14px;
          line-height: 1.5;
        }

        .consent-label:hover .consent-checkmark {
          border-color: #3182ce;
        }

        .consent-input-wrapper {
          position: relative;
          flex-shrink: 0;
          margin-top: 2px;
        }

        .consent-input {
          position: absolute;
          opacity: 0;
          width: 20px;
          height: 20px;
          margin: 0;
          cursor: pointer;
        }

        .consent-input:focus + .consent-checkmark {
          outline: 2px solid #3182ce;
          outline-offset: 2px;
        }

        .consent-checkmark {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 20px;
          height: 20px;
          border: 2px solid #cbd5e0;
          border-radius: 4px;
          background: white;
          transition: all 0.2s ease;
          color: white;
        }

        .consent-input:checked + .consent-checkmark {
          background: #3182ce;
          border-color: #3182ce;
        }

        .checkmark-icon {
          opacity: 0;
          transform: scale(0.5);
          transition: all 0.2s ease;
        }

        .consent-input:checked + .consent-checkmark .checkmark-icon {
          opacity: 1;
          transform: scale(1);
        }

        .consent-content {
          flex: 1;
          min-width: 0;
        }

        .consent-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 4px;
        }

        .consent-icon {
          font-size: 16px;
        }

        .consent-text {
          font-weight: 500;
          color: #2d3748;
        }

        .required-indicator {
          color: #e53e3e;
          font-weight: 600;
        }

        .consent-help {
          font-size: 13px;
          color: #4a5568;
          margin-bottom: 8px;
          font-weight: 500;
        }

        .consent-description {
          font-size: 12px;
          color: #718096;
          line-height: 1.4;
        }

        .privacy-policy-link {
          margin-top: 8px;
          padding-left: 32px;
        }

        .link-button {
          background: none;
          border: none;
          color: #3182ce;
          text-decoration: underline;
          cursor: pointer;
          font-size: 12px;
          padding: 0;
          line-height: 1.4;
        }

        .link-button:hover:not(:disabled) {
          color: #2c5aa0;
          text-decoration-color: #2c5aa0;
        }

        .link-button:focus {
          outline: 2px solid #3182ce;
          outline-offset: 2px;
        }

        .link-button:disabled {
          color: #a0aec0;
          cursor: not-allowed;
        }

        .error-message {
          margin-top: 8px;
          padding: 8px 12px;
          background: #fed7d7;
          border: 1px solid #feb2b2;
          border-radius: 4px;
          color: #c53030;
          font-size: 13px;
          font-weight: 500;
        }

        .consent-timestamp {
          margin-top: 8px;
          padding-left: 32px;
        }

        .consent-timestamp small {
          color: #a0aec0;
          font-size: 11px;
        }

        /* High contrast mode support */
        @media (prefers-contrast: high) {
          .consent-checkmark {
            border-width: 3px;
          }

          .consent-input:checked + .consent-checkmark {
            background: #000;
            border-color: #000;
          }
        }

        /* Reduced motion support */
        @media (prefers-reduced-motion: reduce) {
          .consent-checkbox,
          .consent-checkmark,
          .checkmark-icon {
            transition: none;
          }
        }

        /* Dark mode support */
        @media (prefers-color-scheme: dark) {
          .consent-checkbox {
            background: #2d3748;
            border-color: #4a5568;
          }

          .consent-checkbox:hover:not(.disabled) {
            background: #374151;
            border-color: #6b7280;
          }

          .consent-checkbox.error {
            background: #742a2a;
            border-color: #e53e3e;
          }

          .consent-text {
            color: #e2e8f0;
          }

          .consent-help {
            color: #cbd5e0;
          }

          .consent-description {
            color: #a0aec0;
          }

          .consent-checkmark {
            background: #4a5568;
            border-color: #6b7280;
          }

          .consent-input:checked + .consent-checkmark {
            background: #3182ce;
            border-color: #3182ce;
          }

          .link-button {
            color: #63b3ed;
          }

          .link-button:hover:not(:disabled) {
            color: #90cdf4;
          }

          .error-message {
            background: #742a2a;
            border-color: #f56565;
            color: #fc8181;
          }
        }

        /* Mobile responsiveness */
        @media (max-width: 480px) {
          .consent-checkbox {
            padding: 12px;
          }

          .consent-label {
            gap: 10px;
          }

          .consent-input-wrapper {
            margin-top: 1px;
          }

          .consent-checkmark {
            width: 18px;
            height: 18px;
          }

          .privacy-policy-link {
            padding-left: 28px;
          }
        }
      `}</style>
    </div>
  );
};

export default ConsentCheckbox;