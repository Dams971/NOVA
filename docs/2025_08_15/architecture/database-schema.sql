-- NOVA RDV v2 - Schéma de Base de Données Complet
-- Architecture multi-tenant avec isolation stricte par cabinet
-- Conformité RGPD/GDPR pour données médicales
-- Optimisé pour le fuseau horaire Africa/Algiers (UTC+01)

-- =============================================
-- CONFIGURATION GLOBALE POSTGRESQL
-- =============================================

-- Extensions nécessaires
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_cron";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
CREATE EXTENSION IF NOT EXISTS "btree_gin";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Configuration timezone par défaut
SET timezone = 'Africa/Algiers';

-- Paramètres optimisés pour charge médical
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET random_page_cost = 1.1;
ALTER SYSTEM SET checkpoint_completion_target = 0.9;
ALTER SYSTEM SET wal_buffers = '16MB';
ALTER SYSTEM SET default_statistics_target = 100;

-- =============================================
-- BASE DE DONNÉES PRINCIPALE - NOVA_MAIN
-- =============================================

CREATE DATABASE nova_main 
WITH 
    ENCODING = 'UTF8'
    LC_COLLATE = 'fr_FR.UTF-8'
    LC_CTYPE = 'fr_FR.UTF-8'
    TEMPLATE = template0;

\c nova_main;

-- Schéma pour isoler les objets système
CREATE SCHEMA IF NOT EXISTS nova_system;
CREATE SCHEMA IF NOT EXISTS nova_audit;

-- =============================================
-- TABLES GLOBALES - GESTION PLATEFORME
-- =============================================

-- Table des cabinets dentaires
CREATE TABLE nova_system.cabinets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    
    -- Adresse fixe pour tous les cabinets NOVA
    address_street VARCHAR(255) NOT NULL DEFAULT 'Cité 109, Daboussy',
    address_city VARCHAR(100) NOT NULL DEFAULT 'El Achour',
    address_state VARCHAR(100) NOT NULL DEFAULT 'Alger',
    address_country VARCHAR(100) NOT NULL DEFAULT 'Algérie',
    address_full VARCHAR(500) GENERATED ALWAYS AS (
        address_street || ', ' || address_city || ', ' || address_state
    ) STORED,
    
    -- Contact
    phone VARCHAR(50) CHECK (phone ~ '^\+213[567]\d{8}$'),
    email VARCHAR(255) CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    website VARCHAR(255),
    
    -- Configuration technique
    timezone VARCHAR(50) NOT NULL DEFAULT 'Africa/Algiers' CHECK (timezone = 'Africa/Algiers'),
    locale VARCHAR(10) NOT NULL DEFAULT 'fr_DZ',
    currency VARCHAR(3) NOT NULL DEFAULT 'DZD',
    
    -- Statut et métadonnées
    status VARCHAR(20) NOT NULL DEFAULT 'deploying' 
        CHECK (status IN ('active', 'inactive', 'deploying', 'maintenance', 'suspended')),
    database_name VARCHAR(100) NOT NULL,
    subscription_plan VARCHAR(50) DEFAULT 'standard',
    max_appointments_per_day INTEGER DEFAULT 50,
    max_practitioners INTEGER DEFAULT 5,
    
    -- Configurations spécialisées
    working_hours JSONB DEFAULT '{
        "monday": {"start": "08:00", "end": "18:00", "break_start": "12:00", "break_end": "13:00"},
        "tuesday": {"start": "08:00", "end": "18:00", "break_start": "12:00", "break_end": "13:00"},
        "wednesday": {"start": "08:00", "end": "18:00", "break_start": "12:00", "break_end": "13:00"},
        "thursday": {"start": "08:00", "end": "18:00", "break_start": "12:00", "break_end": "13:00"},
        "friday": {"start": "08:00", "end": "17:00", "break_start": "12:00", "break_end": "14:00"},
        "saturday": {"start": "08:00", "end": "13:00"},
        "sunday": {"closed": true}
    }'::jsonb,
    
    holidays JSONB DEFAULT '[]'::jsonb,
    care_types_config JSONB DEFAULT '{
        "consultation": {"duration": 30, "price": 3000, "color": "#3B82F6"},
        "urgence": {"duration": 20, "price": 4000, "color": "#EF4444"},
        "detartrage": {"duration": 45, "price": 5000, "color": "#10B981"},
        "soin": {"duration": 60, "price": 8000, "color": "#F59E0B"},
        "extraction": {"duration": 30, "price": 6000, "color": "#8B5CF6"},
        "prothese": {"duration": 90, "price": 25000, "color": "#EC4899"},
        "orthodontie": {"duration": 45, "price": 15000, "color": "#06B6D4"},
        "chirurgie": {"duration": 120, "price": 50000, "color": "#DC2626"}
    }'::jsonb,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_backup_at TIMESTAMPTZ,
    
    -- Métadonnées RGPD
    data_retention_years INTEGER DEFAULT 7,
    gdpr_consent_required BOOLEAN DEFAULT true,
    
    -- Index et contraintes
    CONSTRAINT chk_cabinet_name_length CHECK (LENGTH(name) >= 2),
    CONSTRAINT chk_cabinet_slug_format CHECK (slug ~ '^[a-z0-9-]+$'),
    CONSTRAINT chk_working_hours_valid CHECK (jsonb_typeof(working_hours) = 'object')
);

-- Index pour performance
CREATE INDEX idx_cabinets_status ON nova_system.cabinets(status) WHERE status = 'active';
CREATE INDEX idx_cabinets_slug ON nova_system.cabinets(slug);
CREATE INDEX idx_cabinets_database_name ON nova_system.cabinets(database_name);
CREATE INDEX idx_cabinets_updated_at ON nova_system.cabinets(updated_at);

-- Trigger mise à jour automatique updated_at
CREATE OR REPLACE FUNCTION nova_system.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_cabinets_updated_at 
    BEFORE UPDATE ON nova_system.cabinets 
    FOR EACH ROW EXECUTE FUNCTION nova_system.update_updated_at_column();

-- =============================================
-- GESTION UTILISATEURS GLOBALE
-- =============================================

-- Table des utilisateurs de la plateforme
CREATE TABLE nova_system.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL 
        CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    email_verified_at TIMESTAMPTZ,
    
    -- Authentification
    password_hash VARCHAR(255) NOT NULL,
    password_changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMPTZ,
    
    -- Informations personnelles
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    full_name VARCHAR(201) GENERATED ALWAYS AS (first_name || ' ' || last_name) STORED,
    phone VARCHAR(50) CHECK (phone ~ '^\+213[567]\d{8}$'),
    
    -- Autorisations
    role VARCHAR(20) NOT NULL DEFAULT 'staff' 
        CHECK (role IN ('super_admin', 'admin', 'manager', 'practitioner', 'staff', 'reception')),
    is_active BOOLEAN DEFAULT true,
    requires_password_change BOOLEAN DEFAULT false,
    
    -- Préférences
    preferred_language VARCHAR(5) DEFAULT 'fr' CHECK (preferred_language = 'fr'),
    timezone VARCHAR(50) DEFAULT 'Africa/Algiers' CHECK (timezone = 'Africa/Algiers'),
    date_format VARCHAR(20) DEFAULT 'DD/MM/YYYY',
    time_format VARCHAR(10) DEFAULT '24h',
    
    -- Sécurité et conformité
    last_login_at TIMESTAMPTZ,
    last_login_ip INET,
    last_activity_at TIMESTAMPTZ,
    gdpr_consent_at TIMESTAMPTZ,
    marketing_consent BOOLEAN DEFAULT false,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    
    -- Contraintes
    CONSTRAINT chk_user_name_length CHECK (LENGTH(first_name) >= 2 AND LENGTH(last_name) >= 2),
    CONSTRAINT chk_password_changed_recent CHECK (password_changed_at <= NOW())
);

-- Index pour performance et sécurité
CREATE UNIQUE INDEX idx_users_email_active ON nova_system.users(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_role ON nova_system.users(role) WHERE is_active = true;
CREATE INDEX idx_users_last_login ON nova_system.users(last_login_at);
CREATE INDEX idx_users_failed_attempts ON nova_system.users(failed_login_attempts) WHERE failed_login_attempts > 0;
CREATE INDEX idx_users_locked ON nova_system.users(locked_until) WHERE locked_until > NOW();

-- Trigger mise à jour
CREATE TRIGGER trigger_users_updated_at 
    BEFORE UPDATE ON nova_system.users 
    FOR EACH ROW EXECUTE FUNCTION nova_system.update_updated_at_column();

-- =============================================
-- ASSIGNATION UTILISATEURS-CABINETS
-- =============================================

-- Table d'association avec permissions granulaires
CREATE TABLE nova_system.user_cabinet_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES nova_system.users(id) ON DELETE CASCADE,
    cabinet_id UUID NOT NULL REFERENCES nova_system.cabinets(id) ON DELETE CASCADE,
    
    -- Permissions spécifiques par cabinet
    permissions JSONB NOT NULL DEFAULT '{
        "appointments": {"read": true, "write": false, "delete": false},
        "patients": {"read": true, "write": false, "delete": false},
        "calendar": {"read": true, "write": false},
        "reports": {"read": false, "write": false},
        "settings": {"read": false, "write": false}
    }'::jsonb,
    
    -- Rôle spécifique dans ce cabinet
    cabinet_role VARCHAR(20) DEFAULT 'staff',
    is_primary_cabinet BOOLEAN DEFAULT false,
    
    -- Statut et dates
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    assigned_by UUID REFERENCES nova_system.users(id),
    last_access_at TIMESTAMPTZ,
    
    -- Contraintes
    UNIQUE(user_id, cabinet_id),
    CONSTRAINT chk_permissions_valid CHECK (jsonb_typeof(permissions) = 'object')
);

-- Index pour requêtes fréquentes
CREATE INDEX idx_assignments_user_id ON nova_system.user_cabinet_assignments(user_id) WHERE status = 'active';
CREATE INDEX idx_assignments_cabinet_id ON nova_system.user_cabinet_assignments(cabinet_id) WHERE status = 'active';
CREATE INDEX idx_assignments_primary ON nova_system.user_cabinet_assignments(user_id, is_primary_cabinet) WHERE is_primary_cabinet = true;

-- =============================================
-- AUTHENTIFICATION MFA
-- =============================================

-- Multi-Factor Authentication
CREATE TABLE nova_system.user_mfa (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES nova_system.users(id) ON DELETE CASCADE,
    
    -- Configuration TOTP
    secret_encrypted VARCHAR(500) NOT NULL, -- Chiffré avec clé système
    backup_codes_encrypted TEXT[], -- Codes de récupération chiffrés
    
    -- Statut
    is_enabled BOOLEAN DEFAULT false,
    is_verified BOOLEAN DEFAULT false,
    enabled_at TIMESTAMPTZ,
    last_used_at TIMESTAMPTZ,
    
    -- Métadonnées
    qr_code_shown_at TIMESTAMPTZ,
    setup_completed_at TIMESTAMPTZ,
    recovery_codes_used INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(user_id)
);

CREATE INDEX idx_mfa_user_enabled ON nova_system.user_mfa(user_id, is_enabled) WHERE is_enabled = true;

-- =============================================
-- CONFIGURATION GLOBALE
-- =============================================

-- Paramètres système globaux
CREATE TABLE nova_system.global_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value JSONB,
    description TEXT,
    category VARCHAR(50),
    is_sensitive BOOLEAN DEFAULT false,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by UUID REFERENCES nova_system.users(id)
);

-- Paramètres par défaut
INSERT INTO nova_system.global_settings (setting_key, setting_value, description, category) VALUES
('platform.default_timezone', '"Africa/Algiers"', 'Fuseau horaire par défaut', 'system'),
('platform.default_language', '"fr"', 'Langue par défaut', 'system'),
('platform.clinic_address', '"Cité 109, Daboussy El Achour, Alger"', 'Adresse fixe des cabinets', 'system'),
('security.password_min_length', '8', 'Longueur minimale mot de passe', 'security'),
('security.mfa_required_roles', '["admin", "super_admin"]', 'Rôles nécessitant MFA', 'security'),
('appointments.max_advance_booking_days', '90', 'Jours maximum pour réserver à l\'avance', 'business'),
('appointments.reminder_hours', '[24, 2]', 'Heures de rappel par défaut', 'business'),
('ai.anthropic_model', '"claude-3-7-sonnet-20250219"', 'Modèle IA pour RDV', 'ai'),
('notifications.sms_enabled', 'true', 'Notifications SMS activées', 'notifications'),
('notifications.email_enabled', 'true', 'Notifications email activées', 'notifications');

-- =============================================
-- AUDIT ET CONFORMITÉ
-- =============================================

-- Table d'audit pour traçabilité RGPD
CREATE TABLE nova_audit.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Contexte
    user_id UUID REFERENCES nova_system.users(id) ON DELETE SET NULL,
    cabinet_id UUID REFERENCES nova_system.cabinets(id) ON DELETE SET NULL,
    session_id VARCHAR(100),
    
    -- Action
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id VARCHAR(100),
    
    -- Détails
    details JSONB,
    old_values JSONB,
    new_values JSONB,
    
    -- Métadonnées réseau
    ip_address INET,
    user_agent TEXT,
    referer TEXT,
    
    -- Géolocalisation (approximative pour sécurité)
    country VARCHAR(2),
    city VARCHAR(100),
    
    -- Conformité
    gdpr_category VARCHAR(50), -- 'patient_data', 'appointment', 'medical_record'
    retention_until DATE,
    
    -- Timestamp
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Index pour recherches rapides
    CONSTRAINT chk_action_not_empty CHECK (LENGTH(action) > 0),
    CONSTRAINT chk_resource_type_valid CHECK (resource_type IN (
        'user', 'patient', 'appointment', 'cabinet', 'setting', 'report'
    ))
);

-- Index pour performance audit
CREATE INDEX idx_audit_user_action ON nova_audit.audit_logs(user_id, action, created_at);
CREATE INDEX idx_audit_cabinet_date ON nova_audit.audit_logs(cabinet_id, created_at);
CREATE INDEX idx_audit_resource ON nova_audit.audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_gdpr ON nova_audit.audit_logs(gdpr_category, retention_until);
CREATE INDEX idx_audit_ip ON nova_audit.audit_logs(ip_address) WHERE ip_address IS NOT NULL;

-- Fonction d'audit automatique
CREATE OR REPLACE FUNCTION nova_audit.log_audit_event(
    p_user_id UUID,
    p_cabinet_id UUID,
    p_action VARCHAR(100),
    p_resource_type VARCHAR(50),
    p_resource_id VARCHAR(100),
    p_details JSONB DEFAULT NULL,
    p_old_values JSONB DEFAULT NULL,
    p_new_values JSONB DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    audit_id UUID;
BEGIN
    INSERT INTO nova_audit.audit_logs (
        user_id, cabinet_id, action, resource_type, resource_id,
        details, old_values, new_values,
        ip_address, user_agent,
        gdpr_category, retention_until
    ) VALUES (
        p_user_id, p_cabinet_id, p_action, p_resource_type, p_resource_id,
        p_details, p_old_values, p_new_values,
        inet_client_addr(), current_setting('application_name', true),
        CASE 
            WHEN p_resource_type = 'patient' THEN 'patient_data'
            WHEN p_resource_type = 'appointment' THEN 'appointment'
            ELSE 'system'
        END,
        CURRENT_DATE + INTERVAL '7 years' -- Rétention légale
    ) RETURNING id INTO audit_id;
    
    RETURN audit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- TEMPLATE BASE CABINET - SCHEMA DYNAMIQUE
-- =============================================

-- Fonction pour créer une nouvelle base cabinet
CREATE OR REPLACE FUNCTION nova_system.create_cabinet_database(
    p_cabinet_id UUID,
    p_database_name VARCHAR(100)
) RETURNS BOOLEAN AS $$
DECLARE
    sql_command TEXT;
BEGIN
    -- Créer la base de données
    sql_command := format('CREATE DATABASE %I WITH ENCODING = ''UTF8'' LC_COLLATE = ''fr_FR.UTF-8'' LC_CTYPE = ''fr_FR.UTF-8''', p_database_name);
    EXECUTE sql_command;
    
    -- Log de création
    PERFORM nova_audit.log_audit_event(
        NULL, p_cabinet_id, 'database_created', 'cabinet', p_cabinet_id::text,
        jsonb_build_object('database_name', p_database_name)
    );
    
    RETURN true;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Erreur création base cabinet: %', SQLERRM;
        RETURN false;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- SCHEMA CABINET TYPE (à dupliquer pour chaque cabinet)
-- =============================================

-- Le schéma suivant sera créé dynamiquement pour chaque cabinet
-- Nom de DB: nova_cabinet_{cabinet_id}

/*
-- Connexion à la base cabinet (exemple)
\c nova_cabinet_123;

-- Configuration timezone pour cette base
SET timezone = 'Africa/Algiers';

-- Schémas d'organisation
CREATE SCHEMA IF NOT EXISTS cabinet_data;
CREATE SCHEMA IF NOT EXISTS cabinet_reports;
CREATE SCHEMA IF NOT EXISTS cabinet_temp;

-- =============================================
-- PATIENTS (isolés par cabinet)
-- =============================================

CREATE TABLE cabinet_data.patients (
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
    
    -- Adresse
    address_street VARCHAR(255),
    address_city VARCHAR(100),
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
    source VARCHAR(50) DEFAULT 'walk_in', -- walk_in, referral, online, etc.
    notes_internal TEXT, -- Notes staff, pas visibles patient
    
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
CREATE INDEX idx_patients_name ON cabinet_data.patients USING gin(to_tsvector('french', full_name));
CREATE INDEX idx_patients_phone ON cabinet_data.patients(phone_primary);
CREATE INDEX idx_patients_email ON cabinet_data.patients(email) WHERE email IS NOT NULL;
CREATE INDEX idx_patients_active ON cabinet_data.patients(is_active, last_visit_date) WHERE is_active = true;
CREATE INDEX idx_patients_birthday ON cabinet_data.patients(extract(month from date_of_birth), extract(day from date_of_birth));

-- =============================================
-- PRATICIENS (par cabinet)
-- =============================================

CREATE TABLE cabinet_data.practitioners (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID, -- Référence vers nova_main.users
    
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

CREATE INDEX idx_practitioners_active ON cabinet_data.practitioners(is_active, is_available) WHERE is_active = true;
CREATE INDEX idx_practitioners_user ON cabinet_data.practitioners(user_id) WHERE user_id IS NOT NULL;

-- =============================================
-- RENDEZ-VOUS (cœur du système)
-- =============================================

CREATE TABLE cabinet_data.appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Relations
    patient_id UUID NOT NULL REFERENCES cabinet_data.patients(id) ON DELETE RESTRICT,
    practitioner_id UUID REFERENCES cabinet_data.practitioners(id) ON DELETE SET NULL,
    
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
    ),
    CONSTRAINT chk_not_weekend CHECK (
        EXTRACT(dow FROM scheduled_at AT TIME ZONE 'Africa/Algiers') NOT IN (0, 6) -- Pas dimanche/samedi après-midi
    )
);

-- Index critiques pour performance
CREATE INDEX idx_appointments_scheduled_status ON cabinet_data.appointments(scheduled_at, status) 
    WHERE status IN ('scheduled', 'confirmed');
CREATE INDEX idx_appointments_patient_date ON cabinet_data.appointments(patient_id, scheduled_at DESC);
CREATE INDEX idx_appointments_practitioner_date ON cabinet_data.appointments(practitioner_id, scheduled_at)
    WHERE practitioner_id IS NOT NULL;
CREATE INDEX idx_appointments_care_type ON cabinet_data.appointments(care_type, scheduled_at);
CREATE INDEX idx_appointments_status ON cabinet_data.appointments(status, updated_at);
CREATE INDEX idx_appointments_urgent ON cabinet_data.appointments(is_urgent, scheduled_at) 
    WHERE is_urgent = true;
CREATE INDEX idx_appointments_ai_session ON cabinet_data.appointments(ai_session_id) 
    WHERE ai_session_id IS NOT NULL;

-- Index pour recherche conflits créneaux
CREATE INDEX idx_appointments_time_overlap ON cabinet_data.appointments 
    USING gist (tstzrange(scheduled_at, estimated_end_at, '[)'))
    WHERE status IN ('scheduled', 'confirmed', 'in_progress');

-- =============================================
-- SERVICES ET TARIFS
-- =============================================

CREATE TABLE cabinet_data.services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Définition service
    name VARCHAR(200) NOT NULL,
    care_type VARCHAR(50) NOT NULL REFERENCES (SELECT UNNEST(ARRAY[
        'consultation', 'urgence', 'detartrage', 'soin',
        'extraction', 'prothese', 'orthodontie', 'chirurgie'
    ])),
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
INSERT INTO cabinet_data.services (name, care_type, duration_minutes, price, description, keywords) VALUES
('Consultation générale', 'consultation', 30, 3000, 'Examen dentaire de routine', ARRAY['consultation', 'examen', 'contrôle', 'visite']),
('Urgence dentaire', 'urgence', 20, 4000, 'Prise en charge urgente', ARRAY['urgence', 'douleur', 'mal', 'rage']),
('Détartrage complet', 'detartrage', 45, 5000, 'Nettoyage professionnel', ARRAY['détartrage', 'nettoyage', 'tartre', 'hygiène']),
('Soin conservateur', 'soin', 60, 8000, 'Traitement carie', ARRAY['soin', 'carie', 'plombage', 'composite']),
('Extraction simple', 'extraction', 30, 6000, 'Extraction dentaire', ARRAY['extraction', 'arracher', 'enlever', 'retirer']),
('Prothèse dentaire', 'prothese', 90, 25000, 'Pose prothèse', ARRAY['prothèse', 'dentier', 'couronne', 'bridge']),
('Orthodontie', 'orthodontie', 45, 15000, 'Traitement orthodontique', ARRAY['orthodontie', 'appareil', 'bagues', 'redresser']),
('Chirurgie orale', 'chirurgie', 120, 50000, 'Intervention chirurgicale', ARRAY['chirurgie', 'opération', 'implant', 'greffe']);

-- =============================================
-- CONVERSATIONS IA (traçabilité)
-- =============================================

CREATE TABLE cabinet_data.ai_conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id VARCHAR(100) NOT NULL,
    
    -- Contexte patient
    patient_id UUID REFERENCES cabinet_data.patients(id) ON DELETE SET NULL,
    patient_phone VARCHAR(50) CHECK (patient_phone ~ '^\+213[567]\d{8}$'),
    patient_name VARCHAR(200),
    
    -- Données conversation
    messages JSONB NOT NULL DEFAULT '[]'::jsonb,
    intent VARCHAR(100),
    extracted_entities JSONB DEFAULT '{}'::jsonb,
    
    -- Résultat
    appointment_id UUID REFERENCES cabinet_data.appointments(id) ON DELETE SET NULL,
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

CREATE INDEX idx_ai_conversations_session ON cabinet_data.ai_conversations(session_id);
CREATE INDEX idx_ai_conversations_patient ON cabinet_data.ai_conversations(patient_id) WHERE patient_id IS NOT NULL;
CREATE INDEX idx_ai_conversations_status_date ON cabinet_data.ai_conversations(status, created_at);
CREATE INDEX idx_ai_conversations_appointment ON cabinet_data.ai_conversations(appointment_id) WHERE appointment_id IS NOT NULL;

-- =============================================
-- NOTIFICATIONS ET COMMUNICATIONS
-- =============================================

CREATE TABLE cabinet_data.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Destinataire
    patient_id UUID REFERENCES cabinet_data.patients(id) ON DELETE CASCADE,
    appointment_id UUID REFERENCES cabinet_data.appointments(id) ON DELETE CASCADE,
    
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

CREATE INDEX idx_notifications_patient_type ON cabinet_data.notifications(patient_id, type);
CREATE INDEX idx_notifications_scheduled ON cabinet_data.notifications(scheduled_for) WHERE status = 'pending';
CREATE INDEX idx_notifications_status ON cabinet_data.notifications(status, updated_at);

-- =============================================
-- RAPPORTS ET ANALYSES
-- =============================================

-- Vue pour statistiques cabinet
CREATE VIEW cabinet_reports.appointment_stats AS
SELECT 
    DATE_TRUNC('day', scheduled_at AT TIME ZONE 'Africa/Algiers') as date,
    care_type,
    status,
    COUNT(*) as count,
    SUM(price) as total_revenue,
    AVG(duration_minutes) as avg_duration,
    COUNT(CASE WHEN is_urgent THEN 1 END) as urgent_count
FROM cabinet_data.appointments
WHERE scheduled_at >= CURRENT_DATE - INTERVAL '1 year'
GROUP BY date, care_type, status
ORDER BY date DESC;

-- Vue patients actifs
CREATE VIEW cabinet_reports.active_patients AS
SELECT 
    p.*,
    COUNT(a.id) as total_appointments,
    MAX(a.scheduled_at) as last_appointment,
    SUM(a.price) as total_spent
FROM cabinet_data.patients p
LEFT JOIN cabinet_data.appointments a ON p.id = a.patient_id
WHERE p.is_active = true
GROUP BY p.id
ORDER BY last_appointment DESC;

-- Vue planning du jour
CREATE VIEW cabinet_reports.daily_schedule AS
SELECT 
    a.id,
    a.scheduled_at AT TIME ZONE 'Africa/Algiers' as local_time,
    a.care_type,
    a.status,
    p.full_name as patient_name,
    p.phone_primary,
    pr.first_name || ' ' || pr.last_name as practitioner_name,
    a.duration_minutes,
    a.notes
FROM cabinet_data.appointments a
JOIN cabinet_data.patients p ON a.patient_id = p.id
LEFT JOIN cabinet_data.practitioners pr ON a.practitioner_id = pr.id
WHERE DATE(a.scheduled_at AT TIME ZONE 'Africa/Algiers') = CURRENT_DATE
  AND a.status IN ('scheduled', 'confirmed', 'in_progress')
ORDER BY a.scheduled_at;

-- =============================================
-- FONCTIONS UTILITAIRES
-- =============================================

-- Fonction pour vérifier disponibilité créneau
CREATE OR REPLACE FUNCTION cabinet_data.check_slot_availability(
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
    FROM cabinet_data.appointments
    WHERE status IN ('scheduled', 'confirmed', 'in_progress')
      AND (p_exclude_appointment_id IS NULL OR id != p_exclude_appointment_id)
      AND (p_practitioner_id IS NULL OR practitioner_id = p_practitioner_id)
      AND tstzrange(scheduled_at, estimated_end_at, '[)') && 
          tstzrange(p_start_time, end_time, '[)');
    
    RETURN conflict_count = 0;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour générer créneaux disponibles
CREATE OR REPLACE FUNCTION cabinet_data.generate_available_slots(
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
    FROM cabinet_data.services
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
                cabinet_data.check_slot_availability(current_slot, slot_duration, p_practitioner_id);
        END IF;
        
        current_slot := current_slot + INTERVAL '15 minutes'; -- Créneaux tous les 15min
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Fonction mise à jour statistiques patient
CREATE OR REPLACE FUNCTION cabinet_data.update_patient_stats()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        UPDATE cabinet_data.patients
        SET 
            total_visits = (
                SELECT COUNT(*)
                FROM cabinet_data.appointments
                WHERE patient_id = NEW.patient_id AND status = 'completed'
            ),
            total_amount_spent = (
                SELECT COALESCE(SUM(price), 0)
                FROM cabinet_data.appointments
                WHERE patient_id = NEW.patient_id AND status = 'completed'
            ),
            last_visit_date = (
                SELECT MAX(scheduled_at::DATE)
                FROM cabinet_data.appointments
                WHERE patient_id = NEW.patient_id AND status = 'completed'
            ),
            next_appointment_date = (
                SELECT MIN(scheduled_at::DATE)
                FROM cabinet_data.appointments
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
CREATE TRIGGER trigger_update_patient_stats
    AFTER INSERT OR UPDATE OR DELETE ON cabinet_data.appointments
    FOR EACH ROW EXECUTE FUNCTION cabinet_data.update_patient_stats();

-- =============================================
-- SÉCURITÉ ROW LEVEL SECURITY
-- =============================================

-- Activer RLS sur toutes les tables sensibles
ALTER TABLE cabinet_data.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE cabinet_data.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE cabinet_data.practitioners ENABLE ROW LEVEL SECURITY;
ALTER TABLE cabinet_data.ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE cabinet_data.notifications ENABLE ROW LEVEL SECURITY;

-- Politique : seul le cabinet propriétaire peut accéder
CREATE POLICY cabinet_isolation_patients ON cabinet_data.patients
    FOR ALL TO authenticated_users
    USING (true); -- Isolation au niveau base de données

CREATE POLICY cabinet_isolation_appointments ON cabinet_data.appointments
    FOR ALL TO authenticated_users
    USING (true);

-- =============================================
-- TÂCHES AUTOMATISÉES
-- =============================================

-- Nettoyage automatique logs anciens (RGPD)
SELECT cron.schedule('cleanup-old-logs', '0 2 * * *', 
$$
DELETE FROM cabinet_data.ai_conversations 
WHERE created_at < NOW() - INTERVAL '2 years'
  AND status = 'completed';

DELETE FROM cabinet_data.notifications
WHERE created_at < NOW() - INTERVAL '1 year'
  AND status IN ('sent', 'delivered', 'failed');
$$);

-- Envoi rappels automatiques
SELECT cron.schedule('send-reminders', '0 9,15 * * *',
$$
INSERT INTO cabinet_data.notifications (patient_id, appointment_id, type, channel, message, scheduled_for)
SELECT 
    a.patient_id,
    a.id,
    'appointment_reminder',
    p.communication_method,
    'Rappel: Vous avez un rendez-vous demain à ' || 
    TO_CHAR(a.scheduled_at AT TIME ZONE 'Africa/Algiers', 'HH24:MI') ||
    ' pour ' || a.care_type || '. Cabinet NOVA, Cité 109 Daboussy El Achour.',
    NOW()
FROM cabinet_data.appointments a
JOIN cabinet_data.patients p ON a.patient_id = p.id
WHERE a.scheduled_at >= NOW() + INTERVAL '23 hours'
  AND a.scheduled_at <= NOW() + INTERVAL '25 hours'
  AND a.status IN ('scheduled', 'confirmed')
  AND p.reminder_enabled = true
  AND NOT EXISTS (
      SELECT 1 FROM cabinet_data.notifications n
      WHERE n.appointment_id = a.id 
        AND n.type = 'appointment_reminder'
        AND n.scheduled_for > NOW() - INTERVAL '1 day'
  );
$$);

*/

-- =============================================
-- FINALISATION ET DOCUMENTATION
-- =============================================

-- Commentaires de documentation
COMMENT ON DATABASE nova_main IS 'Base principale NOVA - Gestion multi-tenant des cabinets dentaires';
COMMENT ON SCHEMA nova_system IS 'Tables système globales et configuration plateforme';
COMMENT ON SCHEMA nova_audit IS 'Logs d\'audit et conformité RGPD';

COMMENT ON TABLE nova_system.cabinets IS 'Registre des cabinets dentaires de la plateforme NOVA';
COMMENT ON TABLE nova_system.users IS 'Utilisateurs globaux avec authentification centralisée';
COMMENT ON TABLE nova_system.user_cabinet_assignments IS 'Assignation utilisateurs aux cabinets avec permissions';
COMMENT ON TABLE nova_audit.audit_logs IS 'Logs d\'audit complets pour conformité RGPD et traçabilité';

-- Contraintes globales de sécurité
REVOKE ALL ON SCHEMA nova_system FROM PUBLIC;
REVOKE ALL ON SCHEMA nova_audit FROM PUBLIC;

-- Création rôles applicatifs
CREATE ROLE nova_app_reader;
CREATE ROLE nova_app_writer;
CREATE ROLE nova_admin;

-- Permissions lecture
GRANT USAGE ON SCHEMA nova_system TO nova_app_reader;
GRANT SELECT ON ALL TABLES IN SCHEMA nova_system TO nova_app_reader;

-- Permissions écriture
GRANT nova_app_reader TO nova_app_writer;
GRANT INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA nova_system TO nova_app_writer;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA nova_system TO nova_app_writer;

-- Permissions admin
GRANT nova_app_writer TO nova_admin;
GRANT ALL PRIVILEGES ON SCHEMA nova_system TO nova_admin;
GRANT ALL PRIVILEGES ON SCHEMA nova_audit TO nova_admin;

-- Message de fin
SELECT 'Base de données NOVA RDV v2 initialisée avec succès!' as status,
       'Timezone: Africa/Algiers' as timezone,
       'Adresse fixe: Cité 109, Daboussy El Achour, Alger' as clinic_address,
       'Conformité: RGPD/GDPR activée' as compliance;