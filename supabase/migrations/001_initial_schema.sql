-- NOVA RDV+ - Initial Database Schema with RLS
-- Supabase PostgreSQL Migration
-- Timezone: Africa/Algiers (UTC+01)
-- Address: Cité 109, Daboussy El Achour, Alger

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- PROFILES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  phone_e164 TEXT CHECK (phone_e164 ~ '^\+213[567]\d{8}$' OR phone_e164 IS NULL),
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" 
  ON public.profiles FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" 
  ON public.profiles FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- =============================================
-- APPOINTMENTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  patient_name TEXT NOT NULL,
  patient_phone_e164 TEXT NOT NULL CHECK (patient_phone_e164 ~ '^\+213[567]\d{8}$'),
  patient_email TEXT,
  reason TEXT,
  care_type TEXT DEFAULT 'consultation' CHECK (
    care_type IN ('consultation', 'urgence', 'detartrage', 'soin', 'extraction', 'prothese', 'orthodontie', 'chirurgie')
  ),
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'PENDING' CHECK (
    status IN ('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED')
  ),
  clinic_address TEXT DEFAULT 'Cité 109, Daboussy El Achour, Alger',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_time_range CHECK (end_at > start_at)
);

-- Enable RLS on appointments
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Appointments policies
CREATE POLICY "Users can view own appointments" 
  ON public.appointments FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own appointments" 
  ON public.appointments FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own appointments" 
  ON public.appointments FOR UPDATE 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own appointments" 
  ON public.appointments FOR DELETE 
  USING (auth.uid() = user_id);

-- Index for performance
CREATE INDEX idx_appointments_user_id ON public.appointments(user_id);
CREATE INDEX idx_appointments_start_at ON public.appointments(start_at);
CREATE INDEX idx_appointments_status ON public.appointments(status);

-- =============================================
-- EMAIL LOGS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  to_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  template_name TEXT,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  message_id TEXT,
  status TEXT DEFAULT 'PENDING' CHECK (
    status IN ('PENDING', 'SENT', 'FAILED', 'BOUNCED')
  ),
  error_message TEXT,
  metadata JSONB
);

-- Enable RLS on email_logs
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

-- Email logs policies
CREATE POLICY "Users can view own email logs" 
  ON public.email_logs FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert email logs" 
  ON public.email_logs FOR INSERT 
  WITH CHECK (true); -- Allow system to log emails

-- =============================================
-- CONSENTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (
    kind IN ('data_processing', 'marketing_emails', 'transactional_emails', 'sms_notifications')
  ),
  accepted BOOLEAN NOT NULL,
  text_version TEXT,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on consents
ALTER TABLE public.consents ENABLE ROW LEVEL SECURITY;

-- Consents policies
CREATE POLICY "Users can view own consents" 
  ON public.consents FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own consents" 
  ON public.consents FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- No update/delete on consents for audit trail

-- Index for performance
CREATE INDEX idx_consents_user_id ON public.consents(user_id);
CREATE INDEX idx_consents_kind ON public.consents(kind);

-- =============================================
-- OTP CODES TABLE (for email verification)
-- =============================================
CREATE TABLE IF NOT EXISTS public.otp_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  attempts INTEGER DEFAULT 0,
  expires_at TIMESTAMPTZ NOT NULL,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on otp_codes
ALTER TABLE public.otp_codes ENABLE ROW LEVEL SECURITY;

-- OTP policies - only system can access
CREATE POLICY "System can manage OTP codes" 
  ON public.otp_codes FOR ALL 
  USING (true)
  WITH CHECK (true);

-- Index for performance
CREATE INDEX idx_otp_codes_email ON public.otp_codes(email);
CREATE INDEX idx_otp_codes_expires_at ON public.otp_codes(expires_at);

-- =============================================
-- UPDATED_AT TRIGGER FUNCTION
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to tables with updated_at
CREATE TRIGGER update_profiles_updated_at 
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_appointments_updated_at 
  BEFORE UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =============================================
-- GENERATE SLOTS RPC FUNCTION
-- =============================================
CREATE OR REPLACE FUNCTION public.generate_slots(
  target_date DATE,
  duration_minutes INT DEFAULT 30
)
RETURNS TABLE (
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  available BOOLEAN,
  display_time TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE time_slots AS (
    -- Start at 8:00 AM in Africa/Algiers timezone
    SELECT 
      (target_date::timestamp + time '08:00:00') AT TIME ZONE 'Africa/Algiers' AS slot_start,
      (target_date::timestamp + time '08:00:00' + (duration_minutes || ' minutes')::interval) AT TIME ZONE 'Africa/Algiers' AS slot_end
    
    UNION ALL
    
    -- Generate slots until 6:00 PM
    SELECT 
      slot_end AS slot_start,
      slot_end + (duration_minutes || ' minutes')::interval AS slot_end
    FROM time_slots
    WHERE slot_end < (target_date::timestamp + time '18:00:00') AT TIME ZONE 'Africa/Algiers'
  ),
  existing_appointments AS (
    SELECT start_at, end_at
    FROM public.appointments
    WHERE DATE(start_at AT TIME ZONE 'Africa/Algiers') = target_date
      AND status NOT IN ('CANCELLED')
      AND (auth.uid() IS NULL OR user_id = auth.uid())
  )
  SELECT 
    ts.slot_start AS start_time,
    ts.slot_end AS end_time,
    NOT EXISTS (
      SELECT 1 FROM existing_appointments ea
      WHERE (ea.start_at, ea.end_at) OVERLAPS (ts.slot_start, ts.slot_end)
    ) AS available,
    TO_CHAR(ts.slot_start AT TIME ZONE 'Africa/Algiers', 'HH24:MI') AS display_time
  FROM time_slots ts
  WHERE 
    -- Skip lunch hour (12:00 - 13:00)
    NOT (EXTRACT(HOUR FROM ts.slot_start AT TIME ZONE 'Africa/Algiers') = 12)
    -- Only weekdays and Saturday morning
    AND (
      EXTRACT(DOW FROM target_date) BETWEEN 1 AND 5  -- Monday to Friday
      OR (
        EXTRACT(DOW FROM target_date) = 6  -- Saturday
        AND EXTRACT(HOUR FROM ts.slot_start AT TIME ZONE 'Africa/Algiers') < 13
      )
    )
  ORDER BY ts.slot_start;
END;
$$;

-- =============================================
-- CREATE APPOINTMENT WITH VALIDATION RPC
-- =============================================
CREATE OR REPLACE FUNCTION public.create_appointment_validated(
  p_patient_name TEXT,
  p_patient_phone_e164 TEXT,
  p_patient_email TEXT,
  p_reason TEXT,
  p_care_type TEXT,
  p_start_at TIMESTAMPTZ,
  p_end_at TIMESTAMPTZ
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_appointment_id UUID;
  v_conflict_count INT;
BEGIN
  -- Validate phone format
  IF NOT p_patient_phone_e164 ~ '^\+213[567]\d{8}$' THEN
    RAISE EXCEPTION 'Invalid Algerian phone number format';
  END IF;
  
  -- Check for conflicts
  SELECT COUNT(*) INTO v_conflict_count
  FROM public.appointments
  WHERE user_id = auth.uid()
    AND status NOT IN ('CANCELLED')
    AND (start_at, end_at) OVERLAPS (p_start_at, p_end_at);
  
  IF v_conflict_count > 0 THEN
    RAISE EXCEPTION 'Time slot conflict with existing appointment';
  END IF;
  
  -- Check working hours (8:00 - 18:00, excluding lunch 12:00-13:00)
  IF EXTRACT(HOUR FROM p_start_at AT TIME ZONE 'Africa/Algiers') < 8 
     OR EXTRACT(HOUR FROM p_start_at AT TIME ZONE 'Africa/Algiers') >= 18
     OR EXTRACT(HOUR FROM p_start_at AT TIME ZONE 'Africa/Algiers') = 12 THEN
    RAISE EXCEPTION 'Appointment time outside working hours';
  END IF;
  
  -- Check if Sunday
  IF EXTRACT(DOW FROM p_start_at AT TIME ZONE 'Africa/Algiers') = 0 THEN
    RAISE EXCEPTION 'Appointments not available on Sundays';
  END IF;
  
  -- Saturday afternoon check
  IF EXTRACT(DOW FROM p_start_at AT TIME ZONE 'Africa/Algiers') = 6 
     AND EXTRACT(HOUR FROM p_start_at AT TIME ZONE 'Africa/Algiers') >= 13 THEN
    RAISE EXCEPTION 'Saturday appointments only available in the morning';
  END IF;
  
  -- Create appointment
  INSERT INTO public.appointments (
    user_id,
    patient_name,
    patient_phone_e164,
    patient_email,
    reason,
    care_type,
    start_at,
    end_at,
    status,
    clinic_address
  ) VALUES (
    auth.uid(),
    p_patient_name,
    p_patient_phone_e164,
    p_patient_email,
    p_reason,
    COALESCE(p_care_type, 'consultation'),
    p_start_at,
    p_end_at,
    'PENDING',
    'Cité 109, Daboussy El Achour, Alger'
  ) RETURNING id INTO v_appointment_id;
  
  RETURN v_appointment_id;
END;
$$;

-- =============================================
-- GRANT PERMISSIONS
-- =============================================
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;