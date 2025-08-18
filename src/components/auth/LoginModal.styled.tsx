'use client';

import { X, Mail, Lock, Eye, EyeOff, LogIn, Sparkles, Shield, CheckCircle } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { colors, shadows, borderRadius, typography, gradients } from '@/styles/design-system';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToSignup: () => void;
}

export default function LoginModal({ isOpen, onClose, onSwitchToSignup }: LoginModalProps) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [focusedField, setFocusedField] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      await login(email, password);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Échec de la connexion');
    } finally {
      setLoading(false);
    }
  };

  const handleTestLogin = () => {
    setEmail('admin@cabinet-dentaire-cv.fr');
    setPassword('password123');
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
        className="relative w-full max-w-md transform transition-all"
        style={{
          animation: 'scaleUp 0.3s ease-out',
          background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 250, 252, 0.98) 100%)',
          backdropFilter: 'blur(20px)',
          borderRadius: borderRadius['3xl'],
          boxShadow: '0 20px 60px -10px rgba(0, 102, 255, 0.15), 0 10px 40px -10px rgba(0, 0, 0, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.5)',
        }}
      >
        {/* Gradient border effect */}
        <div
          className="absolute inset-0 rounded-3xl opacity-60"
          style={{
            background: gradients.brand,
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
          className="absolute top-4 right-4 p-2 rounded-full transition-all hover:scale-110"
          style={{
            background: 'rgba(255, 255, 255, 0.9)',
            boxShadow: shadows.sm,
          }}
        >
          <X className="w-5 h-5" style={{ color: colors.neutral[600] }} />
        </button>

        <div className="p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div 
              className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4"
              style={{
                background: gradients.primary,
                boxShadow: shadows.primary,
              }}
            >
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h2 
              className="text-3xl font-bold mb-2"
              style={{ 
                fontFamily: typography.fonts.heading,
                background: gradients.brand,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Bon retour !
            </h2>
            <p style={{ color: colors.neutral[600], fontSize: typography.sizes.base }}>
              Connectez-vous à votre espace NOVA
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email field */}
            <div>
              <label 
                className="block text-sm font-medium mb-2"
                style={{ color: colors.neutral[700] }}
              >
                Adresse email
              </label>
              <div className="relative">
                <div 
                  className="absolute left-3 top-1/2 -translate-y-1/2"
                  style={{ color: focusedField === 'email' ? colors.primary[500] : colors.neutral[400] }}
                >
                  <Mail className="w-5 h-5" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField('')}
                  className="w-full pl-10 pr-4 py-3 rounded-xl transition-all"
                  style={{
                    background: colors.white,
                    border: `2px solid ${focusedField === 'email' ? colors.primary[500] : colors.neutral[200]}`,
                    fontSize: typography.sizes.base,
                    outline: 'none',
                    boxShadow: focusedField === 'email' ? '0 0 0 3px rgba(0, 102, 255, 0.1)' : 'none',
                  }}
                  placeholder="vous@exemple.com"
                  required
                />
              </div>
            </div>

            {/* Password field */}
            <div>
              <label 
                className="block text-sm font-medium mb-2"
                style={{ color: colors.neutral[700] }}
              >
                Mot de passe
              </label>
              <div className="relative">
                <div 
                  className="absolute left-3 top-1/2 -translate-y-1/2"
                  style={{ color: focusedField === 'password' ? colors.primary[500] : colors.neutral[400] }}
                >
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField('')}
                  className="w-full pl-10 pr-12 py-3 rounded-xl transition-all"
                  style={{
                    background: colors.white,
                    border: `2px solid ${focusedField === 'password' ? colors.primary[500] : colors.neutral[200]}`,
                    fontSize: typography.sizes.base,
                    outline: 'none',
                    boxShadow: focusedField === 'password' ? '0 0 0 3px rgba(0, 102, 255, 0.1)' : 'none',
                  }}
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:scale-110 transition-transform"
                  style={{ color: colors.neutral[400] }}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Remember me & Forgot password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded"
                  style={{
                    accentColor: colors.primary[500],
                  }}
                />
                <span className="text-sm" style={{ color: colors.neutral[700] }}>
                  Se souvenir de moi
                </span>
              </label>
              <button
                type="button"
                className="text-sm font-medium hover:underline transition-all"
                style={{ color: colors.primary[600] }}
              >
                Mot de passe oublié ?
              </button>
            </div>

            {/* Error message */}
            {error && (
              <div 
                className="p-3 rounded-lg flex items-center space-x-2"
                style={{
                  background: `${colors.error[50]}`,
                  border: `1px solid ${colors.error[200]}`,
                }}
              >
                <X className="w-4 h-4" style={{ color: colors.error[600] }} />
                <p className="text-sm" style={{ color: colors.error[700] }}>{error}</p>
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-6 rounded-xl font-semibold text-white transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: loading ? colors.neutral[400] : gradients.primary,
                boxShadow: loading ? shadows.md : shadows.primary,
                fontSize: typography.sizes.base,
              }}
            >
              {loading ? (
                <span className="flex items-center justify-center space-x-2">
                  <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <span>Connexion...</span>
                </span>
              ) : (
                <span className="flex items-center justify-center space-x-2">
                  <LogIn className="w-5 h-5" />
                  <span>Se connecter</span>
                </span>
              )}
            </button>

            {/* Test credentials (dev mode) */}
            {process.env.NODE_ENV === 'development' && (
              <button
                type="button"
                onClick={handleTestLogin}
                className="w-full py-2 px-4 rounded-lg text-sm transition-all"
                style={{
                  background: `${colors.accent[50]}`,
                  border: `1px solid ${colors.accent[200]}`,
                  color: colors.accent[700],
                }}
              >
                <Sparkles className="inline w-4 h-4 mr-2" />
                Utiliser les identifiants de test
              </button>
            )}
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t" style={{ borderColor: colors.neutral[200] }} />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-3 bg-white" style={{ color: colors.neutral[600] }}>
                Nouveau sur NOVA ?
              </span>
            </div>
          </div>

          {/* Sign up link */}
          <button
            type="button"
            onClick={onSwitchToSignup}
            className="w-full py-3 px-6 rounded-xl font-semibold transition-all transform hover:scale-[1.02]"
            style={{
              background: colors.white,
              border: `2px solid ${colors.primary[500]}`,
              color: colors.primary[600],
              fontSize: typography.sizes.base,
            }}
          >
            Créer un compte gratuit
          </button>

          {/* Features */}
          <div className="mt-6 space-y-2">
            {[
              'Accès instantané à votre historique',
              'Réservation simplifiée',
              'Rappels automatiques'
            ].map((feature, index) => (
              <div key={index} className="flex items-center space-x-2 text-sm" style={{ color: colors.neutral[600] }}>
                <CheckCircle className="w-4 h-4" style={{ color: colors.success[500] }} />
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes scaleUp {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
}