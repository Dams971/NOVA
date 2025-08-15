/**
 * NOVA RDV+ - Supabase Authentication Service
 * 
 * Handles user authentication with Supabase Auth
 * Implements OTP sign-in, sign-up, and profile management
 */

import { supabase } from '@/lib/supabase/client';
import { parsePhoneNumber, isValidPhoneNumber } from 'libphonenumber-js';

export interface SignInResult {
  success: boolean;
  message: string;
  requiresVerification?: boolean;
  user?: any;
}

export interface SignUpData {
  email: string;
  name: string;
  phone: string;
  gdprConsent: boolean;
}

export class SupabaseAuthService {
  /**
   * Sign in with OTP (magic link)
   */
  async signInWithOtp(email: string, shouldCreateUser: boolean = true): Promise<SignInResult> {
    try {
      const { data, error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser,
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (error) {
        if (error.message.includes('User not found') && !shouldCreateUser) {
          return {
            success: false,
            message: 'Aucun compte trouvé avec cet email. Veuillez vous inscrire.'
          };
        }
        throw error;
      }

      return {
        success: true,
        message: 'Un email de connexion a été envoyé. Vérifiez votre boîte mail.',
        requiresVerification: true
      };
    } catch (error: any) {
      console.error('SignIn error:', error);
      return {
        success: false,
        message: error.message || 'Erreur lors de la connexion'
      };
    }
  }

  /**
   * Sign up new user
   */
  async signUp(data: SignUpData): Promise<SignInResult> {
    try {
      // Validate and normalize phone number
      let phoneE164 = data.phone;
      if (!data.phone.startsWith('+')) {
        // Try to parse as Algerian number
        if (data.phone.startsWith('0')) {
          phoneE164 = `+213${data.phone.substring(1)}`;
        } else {
          phoneE164 = `+213${data.phone}`;
        }
      }

      // Validate phone format
      if (!isValidPhoneNumber(phoneE164, 'DZ')) {
        return {
          success: false,
          message: 'Numéro de téléphone invalide. Format attendu: +213XXXXXXXXX'
        };
      }

      // Create user account
      const { data: authData, error: authError } = await supabase.auth.signInWithOtp({
        email: data.email,
        options: {
          shouldCreateUser: true,
          data: {
            name: data.name,
            phone_e164: phoneE164
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (authError) throw authError;

      // Record GDPR consent
      if (data.gdprConsent) {
        await this.recordConsent(data.email, 'data_processing', true);
        await this.recordConsent(data.email, 'transactional_emails', true);
      }

      return {
        success: true,
        message: 'Compte créé avec succès! Un email de vérification a été envoyé.',
        requiresVerification: true
      };
    } catch (error: any) {
      console.error('SignUp error:', error);
      return {
        success: false,
        message: error.message || 'Erreur lors de l\'inscription'
      };
    }
  }

  /**
   * Create or update user profile
   */
  async upsertProfile(userId: string, data: Partial<SignUpData>): Promise<void> {
    try {
      let phoneE164 = data.phone;
      if (data.phone && !data.phone.startsWith('+')) {
        phoneE164 = data.phone.startsWith('0') 
          ? `+213${data.phone.substring(1)}`
          : `+213${data.phone}`;
      }

      const { error } = await supabase
        .from('profiles')
        .upsert({
          user_id: userId,
          name: data.name,
          phone_e164: phoneE164,
          email: data.email,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;
    } catch (_error) {
      console.error('Profile upsert error:', error);
      throw error;
    }
  }

  /**
   * Record GDPR consent
   */
  async recordConsent(email: string, kind: string, accepted: boolean): Promise<void> {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('consents')
        .insert({
          user_id: user.id,
          kind,
          accepted,
          text_version: '1.0',
          ip_address: await this.getClientIP(),
          user_agent: navigator.userAgent
        });

      if (error) throw error;
    } catch (_error) {
      console.error('Consent recording error:', error);
      // Don't throw - consent recording failure shouldn't block signup
    }
  }

  /**
   * Get current authenticated user
   */
  async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
  }

  /**
   * Get user profile
   */
  async getUserProfile(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Check if user has account
   */
  async checkAccountExists(email: string): Promise<boolean> {
    try {
      // Try to sign in without creating user
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: false
        }
      });

      // If no error or specific user exists error, account exists
      return !error || !error.message.includes('User not found');
    } catch {
      return false;
    }
  }

  /**
   * Sign out current user
   */
  async signOut(): Promise<void> {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }

  /**
   * Verify OTP code
   */
  async verifyOtp(email: string, token: string): Promise<SignInResult> {
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'email'
      });

      if (error) throw error;

      return {
        success: true,
        message: 'Connexion réussie!',
        user: data.user
      };
    } catch (error: any) {
      return {
        success: false,
        message: 'Code invalide ou expiré'
      };
    }
  }

  /**
   * Get client IP address
   */
  private async getClientIP(): Promise<string> {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch {
      return 'unknown';
    }
  }

  /**
   * Listen to auth state changes
   */
  onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback);
  }
}