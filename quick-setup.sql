-- Quick NOVA Database Setup
-- This file creates everything in one go

-- Step 1: Create user and database (run as postgres user)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'nova_user') THEN
        CREATE USER nova_user WITH PASSWORD 'nova_password_2024';
    END IF;
END $$;

-- Create database if it doesn't exist
SELECT 'CREATE DATABASE nova_db OWNER nova_user'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'nova_db')\gexec

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE nova_db TO nova_user;
ALTER USER nova_user CREATEDB;

-- Switch to nova_db database
\c nova_db

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create enum types
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('super_admin', 'cabinet_admin', 'practitioner', 'secretary', 'patient');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'appointment_status') THEN
        CREATE TYPE appointment_status AS ENUM ('scheduled', 'confirmed', 'completed', 'cancelled', 'no_show');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'email_job_status') THEN
        CREATE TYPE email_job_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'cancelled');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'email_job_type') THEN
        CREATE TYPE email_job_type AS ENUM ('appointment_confirmation', 'appointment_reminder', 'appointment_cancellation', 'appointment_reschedule');
    END IF;
END $$;

-- Create tables
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    role user_role NOT NULL DEFAULT 'patient',
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cabinets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    address TEXT,
    city VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(2) DEFAULT 'FR',
    phone VARCHAR(20),
    email VARCHAR(255),
    website VARCHAR(255),
    timezone VARCHAR(50) DEFAULT 'Europe/Paris',
    business_hours JSONB,
    settings JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS practitioners (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    cabinet_id UUID REFERENCES cabinets(id) ON DELETE CASCADE,
    specialty VARCHAR(100),
    license_number VARCHAR(100),
    title VARCHAR(50),
    bio TEXT,
    consultation_duration INTEGER DEFAULT 30,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS patients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    date_of_birth DATE,
    gender VARCHAR(10),
    emergency_contact_name VARCHAR(255),
    emergency_contact_phone VARCHAR(20),
    medical_notes TEXT,
    allergies TEXT,
    insurance_info JSONB,
    preferred_language VARCHAR(5) DEFAULT 'fr',
    communication_preferences JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cabinet_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    cabinet_id UUID REFERENCES cabinets(id) ON DELETE CASCADE,
    role user_role NOT NULL,
    permissions JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, cabinet_id)
);

CREATE TABLE IF NOT EXISTS services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cabinet_id UUID REFERENCES cabinets(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    duration INTEGER,
    price DECIMAL(10,2),
    color VARCHAR(7),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS practitioner_services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    practitioner_id UUID REFERENCES practitioners(id) ON DELETE CASCADE,
    service_id UUID REFERENCES services(id) ON DELETE CASCADE,
    custom_price DECIMAL(10,2),
    custom_duration INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(practitioner_id, service_id)
);

CREATE TABLE IF NOT EXISTS appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cabinet_id UUID REFERENCES cabinets(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    practitioner_id UUID REFERENCES practitioners(id) ON DELETE CASCADE,
    service_id UUID REFERENCES services(id),
    scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
    duration INTEGER NOT NULL DEFAULT 30,
    end_time TIMESTAMP WITH TIME ZONE,
    status appointment_status DEFAULT 'scheduled',
    title VARCHAR(255),
    notes TEXT,
    patient_notes TEXT,
    patient_email VARCHAR(255),
    patient_phone VARCHAR(20),
    patient_name VARCHAR(255),
    price DECIMAL(10,2),
    paid BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    confirmed_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT valid_patient_info CHECK (
        patient_id IS NOT NULL OR 
        (patient_email IS NOT NULL AND patient_name IS NOT NULL)
    )
);

CREATE TABLE IF NOT EXISTS email_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cabinet_id UUID REFERENCES cabinets(id) ON DELETE CASCADE,
    job_type email_job_type NOT NULL,
    status email_job_status DEFAULT 'pending',
    priority INTEGER DEFAULT 5,
    recipient_email VARCHAR(255) NOT NULL,
    subject VARCHAR(500) NOT NULL,
    html_body TEXT,
    text_body TEXT,
    appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
    template_data JSONB,
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    scheduled_for TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_attempt_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS chat_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id VARCHAR(255) UNIQUE NOT NULL,
    cabinet_id UUID REFERENCES cabinets(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    ip_address INET,
    user_agent TEXT,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP WITH TIME ZONE,
    current_intent VARCHAR(100),
    collected_slots JSONB,
    conversation_state VARCHAR(50) DEFAULT 'active',
    escalated BOOLEAN DEFAULT false,
    satisfaction_rating INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL,
    content TEXT NOT NULL,
    intent VARCHAR(100),
    confidence DECIMAL(3,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    cabinet_id UUID REFERENCES cabinets(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50),
    resource_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert test cabinet
INSERT INTO cabinets (id, name, address, city, postal_code, phone, email, website, business_hours, settings) 
VALUES (
    '550e8400-e29b-41d4-a716-446655440001',
    'Cabinet Dentaire Centre-Ville',
    '123 Rue de la Paix',
    'Paris',
    '75001',
    '+33 1 42 86 83 00',
    'contact@cabinet-dentaire-cv.fr',
    'https://cabinet-dentaire-cv.fr',
    '{
        "monday": {"open": "08:00", "close": "18:00"},
        "tuesday": {"open": "08:00", "close": "18:00"}, 
        "wednesday": {"open": "08:00", "close": "18:00"},
        "thursday": {"open": "08:00", "close": "18:00"},
        "friday": {"open": "08:00", "close": "18:00"},
        "saturday": {"open": "09:00", "close": "13:00"},
        "sunday": {"open": "", "close": ""}
    }',
    '{
        "allowOnlineBooking": true,
        "appointmentBuffer": 15,
        "maxAdvanceBookingDays": 60,
        "sendReminders": true,
        "reminderTiming": [1440, 120],
        "primaryColor": "#3b82f6",
        "chatbotEnabled": true
    }'
) ON CONFLICT (id) DO NOTHING;

-- Insert test users with password hashes (password: password123)
INSERT INTO users (id, email, password_hash, role, first_name, last_name, phone, email_verified) VALUES 
(
    '550e8400-e29b-41d4-a716-446655440002',
    'admin@cabinet-dentaire-cv.fr',
    '$2a$12$LQv3c1yqBTVHhHvjHOKvEe/DatdT4JXiGMp4/kqNl.C1.1H1Q1H1Q',
    'cabinet_admin',
    'Marie',
    'Dubois',
    '+33 6 12 34 56 78',
    true
),
(
    '550e8400-e29b-41d4-a716-446655440003',
    'dr.martin@cabinet-dentaire-cv.fr',
    '$2a$12$LQv3c1yqBTVHhHvjHOKvEe/DatdT4JXiGMp4/kqNl.C1.1H1Q1H1Q',
    'practitioner',
    'Pierre',
    'Martin',
    '+33 6 23 45 67 89',
    true
),
(
    '550e8400-e29b-41d4-a716-446655440004',
    'dr.lefebvre@cabinet-dentaire-cv.fr',
    '$2a$12$LQv3c1yqBTVHhHvjHOKvEe/DatdT4JXiGMp4/kqNl.C1.1H1Q1H1Q',
    'practitioner',
    'Sophie',
    'Lefebvre',
    '+33 6 34 56 78 90',
    true
),
(
    '550e8400-e29b-41d4-a716-446655440012',
    'patient.test@example.com',
    '$2a$12$LQv3c1yqBTVHhHvjHOKvEe/DatdT4JXiGMp4/kqNl.C1.1H1Q1H1Q',
    'patient',
    'Jean',
    'Dupont',
    '+33 6 45 67 89 01',
    true
) ON CONFLICT (email) DO NOTHING;

-- Insert practitioners
INSERT INTO practitioners (id, user_id, cabinet_id, specialty, license_number, title, bio, consultation_duration) VALUES 
(
    '550e8400-e29b-41d4-a716-446655440005',
    '550e8400-e29b-41d4-a716-446655440003',
    '550e8400-e29b-41d4-a716-446655440001',
    'Dentisterie générale',
    'CD-75-12345',
    'Dr.',
    'Chirurgien-dentiste avec 15 ans d''expérience en dentisterie générale et esthétique.',
    30
),
(
    '550e8400-e29b-41d4-a716-446655440006',
    '550e8400-e29b-41d4-a716-446655440004',
    '550e8400-e29b-41d4-a716-446655440001',
    'Orthodontie',
    'CD-75-67890',
    'Dr.',
    'Spécialiste en orthodontie avec une expertise en traitements invisibles.',
    45
) ON CONFLICT (id) DO NOTHING;

-- Insert cabinet users relationships
INSERT INTO cabinet_users (user_id, cabinet_id, role, permissions) VALUES 
(
    '550e8400-e29b-41d4-a716-446655440002',
    '550e8400-e29b-41d4-a716-446655440001',
    'cabinet_admin',
    '{"manage_appointments": true, "manage_practitioners": true, "manage_patients": true, "view_analytics": true}'
),
(
    '550e8400-e29b-41d4-a716-446655440003',
    '550e8400-e29b-41d4-a716-446655440001',
    'practitioner',
    '{"view_own_appointments": true, "manage_own_schedule": true}'
),
(
    '550e8400-e29b-41d4-a716-446655440004',
    '550e8400-e29b-41d4-a716-446655440001',
    'practitioner',
    '{"view_own_appointments": true, "manage_own_schedule": true}'
) ON CONFLICT (user_id, cabinet_id) DO NOTHING;

-- Insert services
INSERT INTO services (id, cabinet_id, name, description, duration, price, color) VALUES 
(
    '550e8400-e29b-41d4-a716-446655440007',
    '550e8400-e29b-41d4-a716-446655440001',
    'Consultation de contrôle',
    'Examen dentaire de routine avec nettoyage',
    30,
    80.00,
    '#22c55e'
),
(
    '550e8400-e29b-41d4-a716-446655440008',
    '550e8400-e29b-41d4-a716-446655440001',
    'Détartrage',
    'Nettoyage professionnel et détartrage',
    45,
    120.00,
    '#3b82f6'
),
(
    '550e8400-e29b-41d4-a716-446655440009',
    '550e8400-e29b-41d4-a716-446655440001',
    'Plombage',
    'Soin d''une carie avec composite',
    60,
    150.00,
    '#f59e0b'
),
(
    '550e8400-e29b-41d4-a716-446655440010',
    '550e8400-e29b-41d4-a716-446655440001',
    'Consultation orthodontie',
    'Première consultation en orthodontie',
    45,
    100.00,
    '#8b5cf6'
),
(
    '550e8400-e29b-41d4-a716-446655440011',
    '550e8400-e29b-41d4-a716-446655440001',
    'Urgence dentaire',
    'Consultation d''urgence pour douleur dentaire',
    30,
    120.00,
    '#ef4444'
) ON CONFLICT (id) DO NOTHING;

-- Insert patient
INSERT INTO patients (id, user_id, date_of_birth, gender, preferred_language) VALUES 
(
    '550e8400-e29b-41d4-a716-446655440013',
    '550e8400-e29b-41d4-a716-446655440012',
    '1985-03-15',
    'male',
    'fr'
) ON CONFLICT (id) DO NOTHING;

-- Link services to practitioners
INSERT INTO practitioner_services (practitioner_id, service_id) VALUES 
('550e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440007'),
('550e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440008'),
('550e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440009'),
('550e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440011'),
('550e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440007'),
('550e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440010')
ON CONFLICT (practitioner_id, service_id) DO NOTHING;

-- Create basic indexes (most important ones only for quick setup)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_users_email') THEN
        CREATE INDEX idx_users_email ON users(email);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_appointments_cabinet') THEN
        CREATE INDEX idx_appointments_cabinet ON appointments(cabinet_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_appointments_scheduled_at') THEN
        CREATE INDEX idx_appointments_scheduled_at ON appointments(scheduled_at);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_email_queue_status') THEN
        CREATE INDEX idx_email_queue_status ON email_queue(status);
    END IF;
END $$;

-- Success message
SELECT 'NOVA Database Setup Complete!' as message,
       'Database: nova_db' as database,
       'User: nova_user' as user,
       'Test cabinet and users created successfully!' as status;