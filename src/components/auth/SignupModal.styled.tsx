'use client';

import { useState } from 'react';
import { X, Mail, Lock, User, Phone, Eye, EyeOff, UserPlus, CheckCircle, AlertCircle, Shield } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { colors, shadows, borderRadius, spacing, typography, transitions, gradients, glass } from '@/styles/design-system';

interface SignupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToLogin: () => void;
}

export default function SignupModal({ isOpen, onClose, onSwitchToLogin }: SignupModalProps) {
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [focusedField, setFocusedField] = useState('');

  if (!isOpen) return null;

  const passwordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.match(/[a-z]/) && password.match(/[A-Z]/)) strength++;
    if (password.match(/[0-9]/)) strength++;
    if (password.match(/[^a-zA-Z0-9]/)) strength++;
    return strength;
  };

  const getPasswordStrengthColor = () => {
    const strength = passwordStrength(formData.password);
    if (strength === 0) return colors.neutral[300];
    if (strength === 1) return colors.error[500];
    if (strength === 2) return colors.warning[500];
    if (strength === 3) return colors.secondary[500];
    return colors.success[500];
  };

  const getPasswordStrengthText = () => {
    const strength = passwordStrength(formData.password);
    if (strength === 0) return '';
    if (strength === 1) return 'Faible';
    if (strength === 2) return 'Moyen';
    if (strength === 3) return 'Bon';
    return 'Excellent';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }
    
    if (!acceptTerms) {
      setError('Veuillez accepter les conditions d\'utilisation');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      await register(
        formData.email,
        formData.password,
        formData.firstName,
        formData.lastName,
        formData.phone
      );
      onClose();
    } catch (err: any) {
      setError(err.message || 'Échec de l\'inscription');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ 
        background: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(8px)'
      }}
    >
      <div 
        className="relative w-full max-w-md max-h-[90vh] overflow-y-auto transform transition-all"
        style={{
          animation: 'slideUp 0.3s ease-out',
          background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 250, 252, 0.98) 100%)',
          backdropFilter: 'blur(20px)',
          borderRadius: borderRadius['3xl'],
          boxShadow: '0 20px 60px -10px rgba(168, 85, 247, 0.15), 0 10px 40px -10px rgba(0, 0, 0, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.5)',
        }}
      >
        {/* Gradient border effect */}
        <div
          className="absolute inset-0 rounded-3xl opacity-60"
          style={{
            background: gradients.aurora,
            padding: '1px',
            borderRadius: borderRadius['3xl'],
            mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            maskComposite: 'exclude',
            WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            WebkitMaskComposite: 'xor',
          }}
        />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full transition-all hover:scale-110 z-10"
          style={{
            background: 'rgba(255, 255, 255, 0.9)',
            boxShadow: shadows.sm,
          }}
        >
          <X className="w-5 h-5" style={{ color: colors.neutral[600] }} />
        </button>

        <div className="p-8">
          {/* Header */}
          <div className="text-center mb-6">
            <div 
              className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4"
              style={{
                background: gradients.accent,
                boxShadow: shadows.accent,
              }}
            >
              <UserPlus className="w-8 h-8 text-white" />
            </div>
            <h2 
              className="text-3xl font-bold mb-2"
              style={{ 
                fontFamily: typography.fonts.heading,
                background: gradients.aurora,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Bienvenue sur NOVA
            </h2>
            <p style={{ color: colors.neutral[600], fontSize: typography.sizes.base }}>
              Créez votre compte en quelques secondes
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name fields */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: colors.neutral[700] }}>
                  Prénom
                </label>
                <div className="relative">
                  <div 
                    className="absolute left-3 top-1/2 -translate-y-1/2"
                    style={{ color: focusedField === 'firstName' ? colors.primary[500] : colors.neutral[400] }}
                  >
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={handleChange('firstName')}
                    onFocus={() => setFocusedField('firstName')}
                    onBlur={() => setFocusedField('')}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl transition-all"
                    style={{
                      background: colors.white,
                      border: `2px solid ${focusedField === 'firstName' ? colors.primary[500] : colors.neutral[200]}`,
                      fontSize: typography.sizes.sm,
                      outline: 'none',
                      boxShadow: focusedField === 'firstName' ? '0 0 0 3px rgba(0, 102, 255, 0.1)' : 'none',
                    }}
                    placeholder="Jean"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: colors.neutral[700] }}>
                  Nom
                </label>
                <div className="relative">
                  <div 
                    className="absolute left-3 top-1/2 -translate-y-1/2"
                    style={{ color: focusedField === 'lastName' ? colors.primary[500] : colors.neutral[400] }}
                  >
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={handleChange('lastName')}
                    onFocus={() => setFocusedField('lastName')}
                    onBlur={() => setFocusedField('')}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl transition-all"
                    style={{
                      background: colors.white,
                      border: `2px solid ${focusedField === 'lastName' ? colors.primary[500] : colors.neutral[200]}`,
                      fontSize: typography.sizes.sm,
                      outline: 'none',
                      boxShadow: focusedField === 'lastName' ? '0 0 0 3px rgba(0, 102, 255, 0.1)' : 'none',
                    }}
                    placeholder="Dupont"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Email field */}
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: colors.neutral[700] }}>
                Email
              </label>
              <div className="relative">
                <div 
                  className="absolute left-3 top-1/2 -translate-y-1/2"
                  style={{ color: focusedField === 'email' ? colors.primary[500] : colors.neutral[400] }}
                >
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  value={formData.email}
                  onChange={handleChange('email')}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField('')}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl transition-all"
                  style={{
                    background: colors.white,
                    border: `2px solid ${focusedField === 'email' ? colors.primary[500] : colors.neutral[200]}`,
                    fontSize: typography.sizes.sm,
                    outline: 'none',
                    boxShadow: focusedField === 'email' ? '0 0 0 3px rgba(0, 102, 255, 0.1)' : 'none',
                  }}
                  placeholder="jean.dupont@exemple.com"
                  required
                />
              </div>
            </div>

            {/* Phone field */}
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: colors.neutral[700] }}>
                Téléphone (optionnel)
              </label>
              <div className="relative">
                <div 
                  className="absolute left-3 top-1/2 -translate-y-1/2"
                  style={{ color: focusedField === 'phone' ? colors.primary[500] : colors.neutral[400] }}
                >
                  <Phone className="w-4 h-4" />
                </div>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange('phone')}
                  onFocus={() => setFocusedField('phone')}
                  onBlur={() => setFocusedField('')}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl transition-all"
                  style={{
                    background: colors.white,
                    border: `2px solid ${focusedField === 'phone' ? colors.primary[500] : colors.neutral[200]}`,
                    fontSize: typography.sizes.sm,
                    outline: 'none',
                    boxShadow: focusedField === 'phone' ? '0 0 0 3px rgba(0, 102, 255, 0.1)' : 'none',
                  }}
                  placeholder="06 12 34 56 78"
                />
              </div>
            </div>

            {/* Password field */}
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: colors.neutral[700] }}>
                Mot de passe
              </label>
              <div className="relative">
                <div 
                  className="absolute left-3 top-1/2 -translate-y-1/2"
                  style={{ color: focusedField === 'password' ? colors.primary[500] : colors.neutral[400] }}
                >
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleChange('password')}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField('')}
                  className="w-full pl-9 pr-10 py-2.5 rounded-xl transition-all"
                  style={{
                    background: colors.white,
                    border: `2px solid ${focusedField === 'password' ? colors.primary[500] : colors.neutral[200]}`,
                    fontSize: typography.sizes.sm,
                    outline: 'none',
                    boxShadow: focusedField === 'password' ? '0 0 0 3px rgba(0, 102, 255, 0.1)' : 'none',
                  }}
                  placeholder="••••••••"
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:scale-110 transition-transform"
                  style={{ color: colors.neutral[400] }}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {formData.password && (
                <div className="mt-2">
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full transition-all duration-300"
                        style={{
                          width: `${(passwordStrength(formData.password) / 4) * 100}%`,
                          background: getPasswordStrengthColor(),
                        }}
                      />
                    </div>
                    <span className="text-xs font-medium" style={{ color: getPasswordStrengthColor() }}>
                      {getPasswordStrengthText()}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password field */}
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: colors.neutral[700] }}>
                Confirmer le mot de passe
              </label>
              <div className="relative">
                <div 
                  className="absolute left-3 top-1/2 -translate-y-1/2"
                  style={{ color: focusedField === 'confirmPassword' ? colors.primary[500] : colors.neutral[400] }}
                >
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={handleChange('confirmPassword')}
                  onFocus={() => setFocusedField('confirmPassword')}
                  onBlur={() => setFocusedField('')}
                  className="w-full pl-9 pr-10 py-2.5 rounded-xl transition-all"
                  style={{
                    background: colors.white,
                    border: `2px solid ${focusedField === 'confirmPassword' ? colors.primary[500] : colors.neutral[200]}`,
                    fontSize: typography.sizes.sm,
                    outline: 'none',
                    boxShadow: focusedField === 'confirmPassword' ? '0 0 0 3px rgba(0, 102, 255, 0.1)' : 'none',
                  }}
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:scale-110 transition-transform"
                  style={{ color: colors.neutral[400] }}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                <p className="mt-1 text-xs flex items-center" style={{ color: colors.error[600] }}>
                  <AlertCircle className="w-3 h-3 mr-1" />
                  Les mots de passe ne correspondent pas
                </p>
              )}
            </div>

            {/* Terms acceptance */}
            <label className="flex items-start space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded"
                style={{
                  accentColor: colors.primary[500],
                }}
              />
              <span className="text-xs" style={{ color: colors.neutral[700] }}>
                J'accepte les{' '}
                <a href="#" className="font-medium hover:underline" style={{ color: colors.primary[600] }}>
                  conditions d'utilisation
                </a>{' '}
                et la{' '}
                <a href="#" className="font-medium hover:underline" style={{ color: colors.primary[600] }}>
                  politique de confidentialité
                </a>
              </span>
            </label>

            {/* Error message */}
            {error && (
              <div 
                className="p-3 rounded-lg flex items-center space-x-2"
                style={{
                  background: `${colors.error[50]}`,
                  border: `1px solid ${colors.error[200]}`,
                }}
              >
                <AlertCircle className="w-4 h-4" style={{ color: colors.error[600] }} />
                <p className="text-sm" style={{ color: colors.error[700] }}>{error}</p>
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading || !acceptTerms}
              className="w-full py-3 px-6 rounded-xl font-semibold text-white transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: loading || !acceptTerms ? colors.neutral[400] : gradients.accent,
                boxShadow: loading || !acceptTerms ? shadows.md : shadows.accent,
                fontSize: typography.sizes.base,
              }}
            >
              {loading ? (
                <span className="flex items-center justify-center space-x-2">
                  <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <span>Création...</span>
                </span>
              ) : (
                <span className="flex items-center justify-center space-x-2">
                  <Shield className="w-5 h-5" />
                  <span>Créer mon compte</span>
                </span>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t" style={{ borderColor: colors.neutral[200] }} />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-3 bg-white" style={{ color: colors.neutral[600] }}>
                Déjà inscrit ?
              </span>
            </div>
          </div>

          {/* Login link */}
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="w-full py-2.5 px-6 rounded-xl font-semibold transition-all transform hover:scale-[1.02]"
            style={{
              background: colors.white,
              border: `2px solid ${colors.primary[500]}`,
              color: colors.primary[600],
              fontSize: typography.sizes.sm,
            }}
          >
            Se connecter
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}