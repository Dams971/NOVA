/**
 * NOVA RDV+ - Supabase Client Configuration
 * 
 * Initializes Supabase client for authentication and database operations
 * Uses environment variables for secure configuration
 */

import { createClient } from '@supabase/supabase-js';

// Environment variables validation
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  },
  global: {
    headers: {
      'x-application-name': 'nova-rdv'
    }
  }
});

// Database types
export interface Profile {
  user_id: string;
  name: string | null;
  phone_e164: string | null;
  email: string | null;
  created_at: string;
  updated_at: string;
}

export interface Appointment {
  id: string;
  user_id: string;
  patient_name: string;
  patient_phone_e164: string;
  patient_email: string | null;
  reason: string | null;
  start_at: string;
  end_at: string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
  clinic_address: string;
  created_at: string;
  updated_at: string;
}

export interface EmailLog {
  id: string;
  user_id: string;
  to_email: string;
  subject: string;
  sent_at: string;
  message_id: string | null;
  status: 'SENT' | 'FAILED';
}

export interface Consent {
  id: string;
  user_id: string;
  kind: string;
  accepted: boolean;
  text_version: string | null;
  created_at: string;
}

// Helper functions for auth state
export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  return user;
};

export const getSession = async () => {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) throw error;
  return session;
};

export const isAuthenticated = async (): Promise<boolean> => {
  try {
    const user = await getCurrentUser();
    return !!user;
  } catch {
    return false;
  }
};