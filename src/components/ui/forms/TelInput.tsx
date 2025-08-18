import { parsePhoneNumber, isValidPhoneNumber } from 'libphonenumber-js';
import React, { forwardRef, useState } from 'react';
import TextInput from './TextInput';

interface TelInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string;
  error?: string;
  hint?: string;
  onPhoneChange?: (phoneE164: string | null) => void;
}

const TelInput = forwardRef<HTMLInputElement, TelInputProps>(
  ({ label, error, hint, onPhoneChange, onChange, ...props }, ref) => {
    const [phoneError, setPhoneError] = useState<string | undefined>();
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      
      // Clear previous error when user starts typing
      if (phoneError && value !== '') {
        setPhoneError(undefined);
      }
      
      // Try to parse as Algerian number
      let phoneE164 = value;
      if (value && !value.startsWith('+')) {
        if (value.startsWith('0')) {
          // Remove leading 0 and add Algeria country code
          phoneE164 = `+213${value.substring(1)}`;
        } else if (value.length >= 9 && !value.startsWith('213')) {
          // Add Algeria country code if not present
          phoneE164 = `+213${value}`;
        }
      }
      
      // Validate phone number
      if (value.trim()) {
        try {
          if (phoneE164 && isValidPhoneNumber(phoneE164, 'DZ')) {
            setPhoneError(undefined);
            onPhoneChange?.(phoneE164);
          } else {
            // Try parsing without assuming country
            const parsed = parsePhoneNumber(value);
            if (parsed && parsed.isValid()) {
              setPhoneError(undefined);
              onPhoneChange?.(parsed.number);
            } else {
              setPhoneError('Format invalide. Ex: 0555123456 ou +213555123456');
              onPhoneChange?.(null);
            }
          }
        } catch {
          setPhoneError('Format invalide. Ex: 0555123456 ou +213555123456');
          onPhoneChange?.(null);
        }
      } else {
        setPhoneError(undefined);
        onPhoneChange?.(null);
      }
      
      // Call the original onChange handler
      onChange?.(e);
    };
    
    return (
      <TextInput
        ref={ref}
        label={label}
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        placeholder="0555123456"
        error={error || phoneError}
        hint={hint || "Numéro de téléphone algérien (ex: 0555123456)"}
        onChange={handleChange}
        {...props}
      />
    );
  }
);

TelInput.displayName = 'TelInput';
export default TelInput;