-- NOVA RDV v2 - Migration des tables de rendez-vous
-- Migration pour ajouter les tables d'appointments et structures associées
-- Conforme au schéma architecture database-schema.sql
-- Fuseau horaire: Africa/Algiers (UTC+01)

-- =============================================
-- CONFIGURATION INITIALE
-- =============================================

-- Extensions nécessaires
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "btree_gin";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Configuration timezone
SET timezone = 'Africa/Algiers';

-- =============================================
-- PATIENTS
-- =============================================

CREATE TABLE IF NOT EXISTS patients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Identité
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    full_name VARCHAR(201) GENERATED ALWAYS AS (first_name || ' ' || last_name) STORED,
    date_of_birth DATE,
    gender VARCHAR(10) CHECK (gender IN ('M', 'F', 'Other')),
    
    -- Contact (format algérien obligatoire)
    phone_primary VARCHAR(50) NOT NULL CHECK (phone_primary ~ '^\+213[567]\d{8}$'),
    phone_secondary VARCHAR(50) CHECK (phone_secondary ~ '^\+213[567]\d{8}$'),
    email VARCHAR(255) CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    
    -- Adresse (tous résidents d'Alger)
    address_street VARCHAR(255),
    address_city VARCHAR(100) DEFAULT 'El Achour',
    address_postal_code VARCHAR(20),
    address_state VARCHAR(100) DEFAULT 'Alger',
    address_country VARCHAR(100) DEFAULT 'Algérie',
    
    -- Contact d'urgence
    emergency_contact_name VARCHAR(200),
    emergency_contact_phone VARCHAR(50) CHECK (emergency_contact_phone ~ '^\+213[567]\d{8}$'),
    emergency_contact_relationship VARCHAR(100),
    
    -- Informations médicales
    medical_notes TEXT,
    allergies TEXT[],
    current_medications TEXT[],
    medical_conditions TEXT[],
    
    -- Préférences patient
    preferred_language VARCHAR(5) DEFAULT 'fr' CHECK (preferred_language = 'fr'),
    communication_method VARCHAR(20) DEFAULT 'sms' 
        CHECK (communication_method IN ('sms', 'email', 'phone', 'whatsapp', 'none')),
    reminder_enabled BOOLEAN DEFAULT true,
    reminder_hours INTEGER[] DEFAULT ARRAY[24, 2],
    
    -- Consentements RGPD
    gdpr_consent JSONB NOT NULL DEFAULT '{
        "data_processing": {"consent": false, "date": null},
        "marketing": {"consent": false, "date": null},
        "data_sharing": {"consent": false, "date": null},
        "photography": {"consent": false, "date": null}
    }'::jsonb,
    
    -- Statistiques
    total_visits INTEGER DEFAULT 0,
    total_amount_spent DECIMAL(10,2) DEFAULT 0.00,
    last_visit_date DATE,
    next_appointment_date DATE,
    
    -- Statut et métadonnées
    is_active BOOLEAN DEFAULT true,
    patient_since DATE DEFAULT CURRENT_DATE,
    source VARCHAR(50) DEFAULT 'walk_in',
    notes_internal TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_contact_at TIMESTAMPTZ,
    
    -- Contraintes
    CONSTRAINT chk_patient_names CHECK (LENGTH(first_name) >= 2 AND LENGTH(last_name) >= 2),
    CONSTRAINT chk_patient_age CHECK (date_of_birth IS NULL OR date_of_birth <= CURRENT_DATE - INTERVAL '1 year'),
    CONSTRAINT chk_gdpr_consent_valid CHECK (jsonb_typeof(gdpr_consent) = 'object')
);

-- Index pour recherche patients
CREATE INDEX IF NOT EXISTS idx_patients_name ON patients USING gin(to_tsvector('french', full_name));
CREATE INDEX IF NOT EXISTS idx_patients_phone ON patients(phone_primary);
CREATE INDEX IF NOT EXISTS idx_patients_email ON patients(email) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_patients_active ON patients(is_active, last_visit_date) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_patients_birthday ON patients(extract(month from date_of_birth), extract(day from date_of_birth));

-- =============================================
-- PRATICIENS
-- =============================================

CREATE TABLE IF NOT EXISTS practitioners (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID, -- Référence vers users table
    
    -- Identité professionnelle
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    title VARCHAR(50) DEFAULT 'Dr.',
    specialization VARCHAR(100),
    license_number VARCHAR(100) UNIQUE,
    
    -- Contact professionnel
    phone VARCHAR(50) CHECK (phone ~ '^\+213[567]\d{8}$'),
    email VARCHAR(255) CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    
    -- Configuration planning
    schedule_config JSONB DEFAULT '{
        "working_days": ["monday", "tuesday", "wednesday", "thursday", "friday"],
        "working_hours": {"start": "08:00", "end": "18:00"},
        "break_time": {"start": "12:00", "end": "13:00"},
        "slot_duration": 30,
        "max_patients_per_day": 20
    }'::jsonb,
    
    -- Spécialisations soins
    care_types_allowed VARCHAR(50)[] DEFAULT ARRAY[
        'consultation', 'detartrage', 'soin', 'extraction'
    ],
    
    -- Statut
    is_active BOOLEAN DEFAULT true,
    is_available BOOLEAN DEFAULT true,
    vacation_until DATE,
    
    -- Métadonnées
    hire_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT chk_practitioner_names CHECK (LENGTH(first_name) >= 2 AND LENGTH(last_name) >= 2),
    CONSTRAINT chk_schedule_valid CHECK (jsonb_typeof(schedule_config) = 'object')
);

CREATE INDEX IF NOT EXISTS idx_practitioners_active ON practitioners(is_active, is_available) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_practitioners_user ON practitioners(user_id) WHERE user_id IS NOT NULL;

-- =============================================
-- SERVICES ET TARIFS
-- =============================================

CREATE TABLE IF NOT EXISTS services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Définition service
    name VARCHAR(200) NOT NULL,
    care_type VARCHAR(50) NOT NULL CHECK (care_type IN (
        'consultation', 'urgence', 'detartrage', 'soin',
        'extraction', 'prothese', 'orthodontie', 'chirurgie'
    )),
    description TEXT,
    
    -- Configuration
    duration_minutes INTEGER NOT NULL DEFAULT 30,
    price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
    currency VARCHAR(3) DEFAULT 'DZD',
    
    -- Conditions
    requires_anesthesia BOOLEAN DEFAULT false,
    max_sessions_required INTEGER DEFAULT 1,
    follow_up_required BOOLEAN DEFAULT false,
    
    -- Contraintes
    age_min INTEGER CHECK (age_min >= 0),
    age_max INTEGER CHECK (age_max <= 120),
    gender_restriction VARCHAR(10) CHECK (gender_restriction IN ('M', 'F')),
    
    -- Configuration IA
    keywords TEXT[], -- Mots-clés pour reconnaissance
    ai_priority INTEGER DEFAULT 5 CHECK (ai_priority BETWEEN 1 AND 10),
    
    -- Statut
    is_active BOOLEAN DEFAULT true,
    is_emergency BOOLEAN DEFAULT false,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT chk_service_name_length CHECK (LENGTH(name) >= 3)
);

-- Services par défaut
INSERT INTO services (name, care_type, duration_minutes, price, description, keywords) VALUES
('Consultation générale', 'consultation', 30, 3000, 'Examen dentaire de routine', ARRAY['consultation', 'examen', 'contrôle', 'visite']),
('Urgence dentaire', 'urgence', 20, 4000, 'Prise en charge urgente', ARRAY['urgence', 'douleur', 'mal', 'rage']),
('Détartrage complet', 'detartrage', 45, 5000, 'Nettoyage professionnel', ARRAY['détartrage', 'nettoyage', 'tartre', 'hygiène']),
('Soin conservateur', 'soin', 60, 8000, 'Traitement carie', ARRAY['soin', 'carie', 'plombage', 'composite']),
('Extraction simple', 'extraction', 30, 6000, 'Extraction dentaire', ARRAY['extraction', 'arracher', 'enlever', 'retirer']),
('Prothèse dentaire', 'prothese', 90, 25000, 'Pose prothèse', ARRAY['prothèse', 'dentier', 'couronne', 'bridge']),
('Orthodontie', 'orthodontie', 45, 15000, 'Traitement orthodontique', ARRAY['orthodontie', 'appareil', 'bagues', 'redresser']),
('Chirurgie orale', 'chirurgie', 120, 50000, 'Intervention chirurgicale', ARRAY['chirurgie', 'opération', 'implant', 'greffe'])
ON CONFLICT DO NOTHING;

-- =============================================
-- RENDEZ-VOUS (table principale)
-- =============================================

CREATE TABLE IF NOT EXISTS appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Relations
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
    practitioner_id UUID REFERENCES practitioners(id) ON DELETE SET NULL,
    service_id UUID REFERENCES services(id) ON DELETE SET NULL,
    
    -- Détails du rendez-vous
    care_type VARCHAR(50) NOT NULL CHECK (care_type IN (
        'consultation', 'urgence', 'detartrage', 'soin', 
        'extraction', 'prothese', 'orthodontie', 'chirurgie'
    )),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    
    -- Planification (toujours en Africa/Algiers)
    scheduled_at TIMESTAMPTZ NOT NULL,
    duration_minutes INTEGER NOT NULL DEFAULT 30 
        CHECK (duration_minutes >= 15 AND duration_minutes <= 180),
    estimated_end_at TIMESTAMPTZ GENERATED ALWAYS AS (
        scheduled_at + (duration_minutes || ' minutes')::INTERVAL
    ) STORED,
    
    -- Statut
    status VARCHAR(20) NOT NULL DEFAULT 'scheduled' CHECK (status IN (
        'scheduled', 'confirmed', 'in_progress', 'completed', 
        'cancelled', 'no_show', 'rescheduled'
    )),
    
    -- Informations complémentaires
    notes TEXT,
    internal_notes TEXT, -- Notes staff privées
    reason TEXT, -- Motif détaillé
    
    -- Facturation
    price DECIMAL(10,2) CHECK (price >= 0),
    payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN (
        'pending', 'partial', 'paid', 'refunded', 'cancelled'
    )),
    payment_method VARCHAR(20) CHECK (payment_method IN (
        'cash', 'card', 'transfer', 'insurance', 'free'
    )),
    
    -- Notifications
    patient_notified_at TIMESTAMPTZ,
    reminder_sent_at TIMESTAMPTZ[],
    confirmation_required BOOLEAN DEFAULT true,
    confirmed_at TIMESTAMPTZ,
    confirmed_by VARCHAR(50), -- 'patient', 'staff', 'auto'
    
    -- Métadonnées IA (pour amélioration continue)
    ai_confidence_score DECIMAL(3,2) CHECK (ai_confidence_score BETWEEN 0 AND 1),
    ai_session_id VARCHAR(100),
    original_message TEXT, -- Message patient original
    
    -- Urgence
    is_urgent BOOLEAN DEFAULT false,
    urgency_level INTEGER CHECK (urgency_level BETWEEN 1 AND 5),
    triage_notes TEXT,
    
    -- Historique
    original_scheduled_at TIMESTAMPTZ, -- Si reprogrammé
    rescheduled_count INTEGER DEFAULT 0,
    cancelled_reason TEXT,
    cancelled_by UUID, -- Référence user
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    
    -- Contraintes métier
    CONSTRAINT chk_appointment_title_length CHECK (LENGTH(title) >= 5),
    CONSTRAINT chk_future_appointment CHECK (scheduled_at > NOW() - INTERVAL '1 hour'),
    CONSTRAINT chk_working_hours CHECK (
        EXTRACT(hour FROM scheduled_at AT TIME ZONE 'Africa/Algiers') BETWEEN 7 AND 19
    )
);

-- Index critiques pour performance
CREATE INDEX IF NOT EXISTS idx_appointments_scheduled_status ON appointments(scheduled_at, status) 
    WHERE status IN ('scheduled', 'confirmed');
CREATE INDEX IF NOT EXISTS idx_appointments_patient_date ON appointments(patient_id, scheduled_at DESC);
CREATE INDEX IF NOT EXISTS idx_appointments_practitioner_date ON appointments(practitioner_id, scheduled_at)
    WHERE practitioner_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_appointments_care_type ON appointments(care_type, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status, updated_at);
CREATE INDEX IF NOT EXISTS idx_appointments_urgent ON appointments(is_urgent, scheduled_at) 
    WHERE is_urgent = true;
CREATE INDEX IF NOT EXISTS idx_appointments_ai_session ON appointments(ai_session_id) 
    WHERE ai_session_id IS NOT NULL;

-- Index pour recherche conflits créneaux
CREATE INDEX IF NOT EXISTS idx_appointments_time_overlap ON appointments 
    USING gist (tstzrange(scheduled_at, estimated_end_at, '[)'))
    WHERE status IN ('scheduled', 'confirmed', 'in_progress');

-- =============================================
-- CONVERSATIONS IA (traçabilité)
-- =============================================

CREATE TABLE IF NOT EXISTS ai_conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id VARCHAR(100) NOT NULL,
    
    -- Contexte patient
    patient_id UUID REFERENCES patients(id) ON DELETE SET NULL,
    patient_phone VARCHAR(50) CHECK (patient_phone ~ '^\+213[567]\d{8}$'),
    patient_name VARCHAR(200),
    
    -- Données conversation
    messages JSONB NOT NULL DEFAULT '[]'::jsonb,
    intent VARCHAR(100),
    extracted_entities JSONB DEFAULT '{}'::jsonb,
    
    -- Résultat
    appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
    action_taken VARCHAR(50), -- 'appointment_created', 'slots_provided', 'info_requested'
    success BOOLEAN DEFAULT false,
    
    -- Métadonnées IA
    model_used VARCHAR(100) DEFAULT 'claude-3-7-sonnet-20250219',
    tokens_consumed INTEGER,
    processing_time_ms INTEGER,
    confidence_score DECIMAL(3,2),
    
    -- Statut conversation
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN (
        'active', 'completed', 'abandoned', 'escalated'
    )),
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    
    CONSTRAINT chk_session_id_format CHECK (LENGTH(session_id) >= 10),
    CONSTRAINT chk_messages_array CHECK (jsonb_typeof(messages) = 'array')
);

CREATE INDEX IF NOT EXISTS idx_ai_conversations_session ON ai_conversations(session_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_patient ON ai_conversations(patient_id) WHERE patient_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ai_conversations_status_date ON ai_conversations(status, created_at);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_appointment ON ai_conversations(appointment_id) WHERE appointment_id IS NOT NULL;

-- =============================================
-- NOTIFICATIONS ET COMMUNICATIONS
-- =============================================

CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Destinataire
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE,
    
    -- Type et contenu
    type VARCHAR(50) NOT NULL CHECK (type IN (
        'appointment_created', 'appointment_reminder', 'appointment_cancelled',
        'appointment_rescheduled', 'appointment_confirmed', 'follow_up'
    )),
    
    channel VARCHAR(20) NOT NULL CHECK (channel IN ('sms', 'email', 'whatsapp', 'push')),
    
    -- Contenu
    title VARCHAR(200),
    message TEXT NOT NULL,
    template_used VARCHAR(100),
    variables_used JSONB DEFAULT '{}'::jsonb,
    
    -- Planification
    scheduled_for TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    sent_at TIMESTAMPTZ,
    
    -- Statut
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN (
        'pending', 'sent', 'delivered', 'failed', 'cancelled'
    )),
    
    -- Réponse patient
    response_received BOOLEAN DEFAULT false,
    response_content TEXT,
    response_at TIMESTAMPTZ,
    
    -- Métadonnées
    provider VARCHAR(50), -- 'twilio', 'sendgrid', etc.
    provider_message_id VARCHAR(200),
    cost DECIMAL(8,4), -- Coût envoi
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT chk_message_not_empty CHECK (LENGTH(message) > 0)
);

CREATE INDEX IF NOT EXISTS idx_notifications_patient_type ON notifications(patient_id, type);
CREATE INDEX IF NOT EXISTS idx_notifications_scheduled ON notifications(scheduled_for) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status, updated_at);

-- =============================================
-- TRIGGERS ET FONCTIONS
-- =============================================

-- Fonction mise à jour automatique updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers updated_at pour toutes les tables
CREATE TRIGGER IF NOT EXISTS trigger_patients_updated_at 
    BEFORE UPDATE ON patients 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER IF NOT EXISTS trigger_practitioners_updated_at 
    BEFORE UPDATE ON practitioners 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER IF NOT EXISTS trigger_services_updated_at 
    BEFORE UPDATE ON services 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER IF NOT EXISTS trigger_appointments_updated_at 
    BEFORE UPDATE ON appointments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER IF NOT EXISTS trigger_ai_conversations_updated_at 
    BEFORE UPDATE ON ai_conversations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER IF NOT EXISTS trigger_notifications_updated_at 
    BEFORE UPDATE ON notifications 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Fonction mise à jour statistiques patient
CREATE OR REPLACE FUNCTION update_patient_stats()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        UPDATE patients
        SET 
            total_visits = (
                SELECT COUNT(*)
                FROM appointments
                WHERE patient_id = NEW.patient_id AND status = 'completed'
            ),
            total_amount_spent = (
                SELECT COALESCE(SUM(price), 0)
                FROM appointments
                WHERE patient_id = NEW.patient_id AND status = 'completed'
            ),
            last_visit_date = (
                SELECT MAX(scheduled_at::DATE)
                FROM appointments
                WHERE patient_id = NEW.patient_id AND status = 'completed'
            ),
            next_appointment_date = (
                SELECT MIN(scheduled_at::DATE)
                FROM appointments
                WHERE patient_id = NEW.patient_id 
                  AND status IN ('scheduled', 'confirmed')
                  AND scheduled_at > NOW()
            )
        WHERE id = NEW.patient_id;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger automatique statistiques
CREATE TRIGGER IF NOT EXISTS trigger_update_patient_stats
    AFTER INSERT OR UPDATE OR DELETE ON appointments
    FOR EACH ROW EXECUTE FUNCTION update_patient_stats();

-- =============================================
-- FONCTIONS MÉTIER
-- =============================================

-- Fonction pour vérifier disponibilité créneau
CREATE OR REPLACE FUNCTION check_slot_availability(
    p_start_time TIMESTAMPTZ,
    p_duration INTEGER,
    p_practitioner_id UUID DEFAULT NULL,
    p_exclude_appointment_id UUID DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
    conflict_count INTEGER;
    end_time TIMESTAMPTZ;
BEGIN
    end_time := p_start_time + (p_duration || ' minutes')::INTERVAL;
    
    SELECT COUNT(*)
    INTO conflict_count
    FROM appointments
    WHERE status IN ('scheduled', 'confirmed', 'in_progress')
      AND (p_exclude_appointment_id IS NULL OR id != p_exclude_appointment_id)
      AND (p_practitioner_id IS NULL OR practitioner_id = p_practitioner_id)
      AND tstzrange(scheduled_at, estimated_end_at, '[)') && 
          tstzrange(p_start_time, end_time, '[)');
    
    RETURN conflict_count = 0;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour générer créneaux disponibles
CREATE OR REPLACE FUNCTION generate_available_slots(
    p_date DATE,
    p_care_type VARCHAR(50) DEFAULT 'consultation',
    p_practitioner_id UUID DEFAULT NULL
) RETURNS TABLE (
    start_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ,
    duration INTEGER,
    is_available BOOLEAN
) AS $$
DECLARE
    slot_duration INTEGER;
    working_start TIME := '08:00';
    working_end TIME := '18:00';
    break_start TIME := '12:00';
    break_end TIME := '13:00';
    current_slot TIMESTAMPTZ;
    end_slot TIMESTAMPTZ;
BEGIN
    -- Récupérer durée standard pour le type de soin
    SELECT duration_minutes INTO slot_duration
    FROM services
    WHERE care_type = p_care_type AND is_active = true
    LIMIT 1;
    
    IF slot_duration IS NULL THEN
        slot_duration := 30; -- Défaut
    END IF;
    
    -- Générer créneaux de la journée
    current_slot := (p_date::TEXT || ' ' || working_start::TEXT)::TIMESTAMPTZ AT TIME ZONE 'Africa/Algiers';
    
    WHILE current_slot::TIME < working_end LOOP
        end_slot := current_slot + (slot_duration || ' minutes')::INTERVAL;
        
        -- Éviter la pause déjeuner
        IF NOT (current_slot::TIME >= break_start AND current_slot::TIME < break_end) THEN
            RETURN QUERY SELECT 
                current_slot,
                end_slot,
                slot_duration,
                check_slot_availability(current_slot, slot_duration, p_practitioner_id);
        END IF;
        
        current_slot := current_slot + INTERVAL '15 minutes'; -- Créneaux tous les 15min
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- VUES POUR RAPPORTS
-- =============================================

-- Vue planning du jour
CREATE OR REPLACE VIEW daily_schedule AS
SELECT 
    a.id,
    a.scheduled_at AT TIME ZONE 'Africa/Algiers' as local_time,
    a.care_type,
    a.status,
    p.full_name as patient_name,
    p.phone_primary,
    COALESCE(pr.first_name || ' ' || pr.last_name, 'Non assigné') as practitioner_name,
    a.duration_minutes,
    a.notes
FROM appointments a
JOIN patients p ON a.patient_id = p.id
LEFT JOIN practitioners pr ON a.practitioner_id = pr.id
WHERE DATE(a.scheduled_at AT TIME ZONE 'Africa/Algiers') = CURRENT_DATE
  AND a.status IN ('scheduled', 'confirmed', 'in_progress')
ORDER BY a.scheduled_at;

-- Vue patients actifs
CREATE OR REPLACE VIEW active_patients AS
SELECT 
    p.*,
    COUNT(a.id) as total_appointments,
    MAX(a.scheduled_at) as last_appointment,
    SUM(a.price) as total_spent
FROM patients p
LEFT JOIN appointments a ON p.id = a.patient_id
WHERE p.is_active = true
GROUP BY p.id
ORDER BY last_appointment DESC;

-- =============================================
-- DONNÉES DE TEST (optionnel)
-- =============================================

-- Insertion d'un praticien par défaut
INSERT INTO practitioners (first_name, last_name, specialization, license_number, is_active)
VALUES ('Ahmed', 'Benali', 'Dentisterie générale', 'DZ-DENT-2024-001', true)
ON CONFLICT DO NOTHING;

-- Message de succès
SELECT 
    'Migration RDV v2 terminée avec succès!' as status,
    'Tables créées: patients, practitioners, services, appointments, ai_conversations, notifications' as tables_created,
    'Timezone: Africa/Algiers' as timezone,
    'Format téléphone: +213[567]XXXXXXXX' as phone_format,
    'Services par défaut: 8 types de soins' as services_info;