/**
 * OTP Input Component for NOVA RDV+
 * 
 * Features:
 * - 6-digit OTP input with individual boxes
 * - Auto-focus and navigation between inputs
 * - Paste support for full OTP codes
 * - Auto-submit when complete
 * - Accessible with ARIA labels
 * - Clear visual feedback
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';

export interface OTPInputProps {
  length?: number;
  value?: string;
  onChange?: (otp: string) => void;
  onComplete?: (otp: string) => void;
  disabled?: boolean;
  error?: boolean;
  autoSubmit?: boolean;
  className?: string;
  'aria-label'?: string;
  'aria-describedby'?: string;
}

export const OTPInput: React.FC<OTPInputProps> = ({
  length = 6,
  value = '',
  onChange,
  onComplete,
  disabled = false,
  error = false,
  autoSubmit = true,
  className = '',
  'aria-label': ariaLabel = 'Code de vérification',
  'aria-describedby': ariaDescribedBy
}) => {
  const [digits, setDigits] = useState<string[]>(Array(length).fill(''));
  const [focusedIndex, setFocusedIndex] = useState<number>(0);
  const inputRefs = useRef<HTMLInputElement[]>([]);

  // Initialize refs array
  useEffect(() => {
    inputRefs.current = inputRefs.current.slice(0, length);
    for (let i = 0; i < length; i++) {
      if (!inputRefs.current[i]) {
        inputRefs.current[i] = null as any;
      }
    }
  }, [length]);

  // Update internal state when value prop changes
  useEffect(() => {
    const valueDigits = value.slice(0, length).split('');
    const newDigits = Array(length).fill('');
    
    for (let i = 0; i < valueDigits.length; i++) {
      if (/\d/.test(valueDigits[i])) {
        newDigits[i] = valueDigits[i];
      }
    }
    
    setDigits(newDigits);
  }, [value, length]);

  // Auto-focus first empty input on mount
  useEffect(() => {
    const firstEmptyIndex = digits.findIndex(digit => digit === '');
    const targetIndex = firstEmptyIndex === -1 ? length - 1 : firstEmptyIndex;
    
    if (inputRefs.current[targetIndex]) {
      inputRefs.current[targetIndex].focus();
      setFocusedIndex(targetIndex);
    }
  }, []);

  const updateOTP = useCallback((newDigits: string[]) => {
    const otpValue = newDigits.join('');
    setDigits(newDigits);
    
    if (onChange) {
      onChange(otpValue);
    }
    
    // Check if OTP is complete
    if (otpValue.length === length && newDigits.every(digit => digit !== '')) {
      if (onComplete) {
        onComplete(otpValue);
      }
      
      // Auto-submit if enabled
      if (autoSubmit) {
        setTimeout(() => {
          const form = inputRefs.current[0]?.closest('form');
          if (form) {
            form.requestSubmit();
          }
        }, 100);
      }
    }
  }, [length, onChange, onComplete, autoSubmit]);

  const handleInputChange = (index: number, value: string) => {
    if (disabled) return;

    // Only allow digits
    const digit = value.replace(/\D/g, '').slice(-1);
    
    const newDigits = [...digits];
    newDigits[index] = digit;
    
    updateOTP(newDigits);
    
    // Move to next input if digit entered
    if (digit && index < length - 1) {
      const nextInput = inputRefs.current[index + 1];
      if (nextInput) {
        nextInput.focus();
        setFocusedIndex(index + 1);
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;

    switch (e.key) {
      case 'Backspace':
        if (!digits[index] && index > 0) {
          // Move to previous input if current is empty
          const prevInput = inputRefs.current[index - 1];
          if (prevInput) {
            prevInput.focus();
            setFocusedIndex(index - 1);
          }
        } else {
          // Clear current input
          const newDigits = [...digits];
          newDigits[index] = '';
          updateOTP(newDigits);
        }
        break;
        
      case 'Delete':
        const newDigits = [...digits];
        newDigits[index] = '';
        updateOTP(newDigits);
        break;
        
      case 'ArrowLeft':
        e.preventDefault();
        if (index > 0) {
          const prevInput = inputRefs.current[index - 1];
          if (prevInput) {
            prevInput.focus();
            setFocusedIndex(index - 1);
          }
        }
        break;
        
      case 'ArrowRight':
        e.preventDefault();
        if (index < length - 1) {
          const nextInput = inputRefs.current[index + 1];
          if (nextInput) {
            nextInput.focus();
            setFocusedIndex(index + 1);
          }
        }
        break;
        
      case 'Home':
        e.preventDefault();
        const firstInput = inputRefs.current[0];
        if (firstInput) {
          firstInput.focus();
          setFocusedIndex(0);
        }
        break;
        
      case 'End':
        e.preventDefault();
        const lastInput = inputRefs.current[length - 1];
        if (lastInput) {
          lastInput.focus();
          setFocusedIndex(length - 1);
        }
        break;
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    
    if (disabled) return;
    
    const pastedData = e.clipboardData.getData('text/plain');
    const pastedDigits = pastedData.replace(/\D/g, '').slice(0, length);
    
    if (pastedDigits.length > 0) {
      const newDigits = Array(length).fill('');
      
      for (let i = 0; i < pastedDigits.length; i++) {
        newDigits[i] = pastedDigits[i];
      }
      
      updateOTP(newDigits);
      
      // Focus the next empty input or last input
      const nextEmptyIndex = newDigits.findIndex(digit => digit === '');
      const targetIndex = nextEmptyIndex === -1 ? length - 1 : nextEmptyIndex;
      
      if (inputRefs.current[targetIndex]) {
        inputRefs.current[targetIndex].focus();
        setFocusedIndex(targetIndex);
      }
    }
  };

  const handleFocus = (index: number) => {
    setFocusedIndex(index);
  };

  const handleClick = (index: number) => {
    if (inputRefs.current[index]) {
      inputRefs.current[index].focus();
      setFocusedIndex(index);
    }
  };

  return (
    <div 
      className={`otp-input ${className} ${error ? 'error' : ''} ${disabled ? 'disabled' : ''}`}
      role="group"
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
    >
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(el) => (inputRefs.current[index] = el!)}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={1}
          value={digit}
          onChange={(e) => handleInputChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          onFocus={() => handleFocus(index)}
          onClick={() => handleClick(index)}
          disabled={disabled}
          className={`otp-digit ${focusedIndex === index ? 'focused' : ''} ${digit ? 'filled' : ''}`}
          aria-label={`Chiffre ${index + 1} sur ${length}`}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
        />
      ))}

      <style jsx>{`
        .otp-input {
          display: flex;
          gap: 8px;
          justify-content: center;
          align-items: center;
          margin: 16px 0;
        }

        .otp-digit {
          width: 48px;
          height: 56px;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          font-size: 24px;
          font-weight: 600;
          text-align: center;
          font-family: 'Courier New', monospace;
          background: white;
          color: #2d3748;
          transition: all 0.2s ease;
          outline: none;
        }

        .otp-digit:focus {
          border-color: #3182ce;
          box-shadow: 0 0 0 3px rgba(49, 130, 206, 0.1);
          transform: scale(1.05);
        }

        .otp-digit.focused {
          border-color: #3182ce;
          box-shadow: 0 0 0 3px rgba(49, 130, 206, 0.1);
        }

        .otp-digit.filled {
          background: #f7fafc;
          border-color: #4299e1;
          color: #2b6cb0;
        }

        .otp-digit:hover:not(:disabled) {
          border-color: #cbd5e0;
        }

        .otp-digit:disabled {
          background: #f7fafc;
          color: #a0aec0;
          cursor: not-allowed;
        }

        .otp-input.error .otp-digit {
          border-color: #e53e3e;
        }

        .otp-input.error .otp-digit:focus {
          border-color: #e53e3e;
          box-shadow: 0 0 0 3px rgba(229, 62, 62, 0.1);
        }

        .otp-input.error .otp-digit.filled {
          background: #fed7d7;
          border-color: #e53e3e;
          color: #c53030;
        }

        .otp-input.disabled .otp-digit {
          background: #f7fafc;
          border-color: #e2e8f0;
          color: #a0aec0;
        }

        /* Responsive design */
        @media (max-width: 480px) {
          .otp-input {
            gap: 6px;
          }

          .otp-digit {
            width: 40px;
            height: 48px;
            font-size: 20px;
          }
        }

        @media (max-width: 360px) {
          .otp-input {
            gap: 4px;
          }

          .otp-digit {
            width: 36px;
            height: 44px;
            font-size: 18px;
          }
        }

        /* High contrast mode support */
        @media (prefers-contrast: high) {
          .otp-digit {
            border-width: 3px;
          }

          .otp-digit:focus {
            border-width: 4px;
          }
        }

        /* Reduced motion support */
        @media (prefers-reduced-motion: reduce) {
          .otp-digit {
            transition: none;
          }

          .otp-digit:focus {
            transform: none;
          }
        }

        /* Dark mode support */
        @media (prefers-color-scheme: dark) {
          .otp-digit {
            background: #2d3748;
            border-color: #4a5568;
            color: #e2e8f0;
          }

          .otp-digit:focus {
            border-color: #63b3ed;
            box-shadow: 0 0 0 3px rgba(99, 179, 237, 0.2);
          }

          .otp-digit.filled {
            background: #4a5568;
            border-color: #63b3ed;
            color: #90cdf4;
          }

          .otp-digit:disabled {
            background: #1a202c;
            color: #718096;
          }

          .otp-input.error .otp-digit {
            border-color: #fc8181;
          }

          .otp-input.error .otp-digit:focus {
            box-shadow: 0 0 0 3px rgba(252, 129, 129, 0.2);
          }

          .otp-input.error .otp-digit.filled {
            background: #742a2a;
            color: #fc8181;
          }
        }
      `}</style>
    </div>
  );
};

export default OTPInput;