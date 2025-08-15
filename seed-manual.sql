-- NOVA Manual Seed Data
-- Run this after the schema setup to populate test data

-- Insert test cabinet
INSERT INTO cabinets (id, name, address, city, postal_code, phone, email, website, business_hours, settings) VALUES 
(
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
);

-- Insert admin user
INSERT INTO users (id, email, password_hash, role, first_name, last_name, phone, email_verified) VALUES 
(
    '550e8400-e29b-41d4-a716-446655440002',
    'admin@cabinet-dentaire-cv.fr',
    '$2a$12$LQv3c1yqBTVHhHvjHOKvEe/DatdT4JXiGMp4/kqNl.C1.1H1Q1H1Q', -- password: password123
    'cabinet_admin',
    'Marie',
    'Dubois',
    '+33 6 12 34 56 78',
    true
);

-- Insert test practitioners
INSERT INTO users (id, email, password_hash, role, first_name, last_name, phone, email_verified) VALUES 
(
    '550e8400-e29b-41d4-a716-446655440003',
    'dr.martin@cabinet-dentaire-cv.fr',
    '$2a$12$LQv3c1yqBTVHhHvjHOKvEe/DatdT4JXiGMp4/kqNl.C1.1H1Q1H1Q', -- password: password123
    'practitioner',
    'Pierre',
    'Martin',
    '+33 6 23 45 67 89',
    true
),
(
    '550e8400-e29b-41d4-a716-446655440004',
    'dr.lefebvre@cabinet-dentaire-cv.fr',
    '$2a$12$LQv3c1yqBTVHhHvjHOKvEe/DatdT4JXiGMp4/kqNl.C1.1H1Q1H1Q', -- password: password123
    'practitioner',
    'Sophie',
    'Lefebvre',
    '+33 6 34 56 78 90',
    true
);

-- Insert practitioners details
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
);

-- Link users to cabinet
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
);

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
);

-- Link services to practitioners
INSERT INTO practitioner_services (practitioner_id, service_id) VALUES 
-- Dr. Martin (general dentistry)
('550e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440007'),
('550e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440008'),
('550e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440009'),
('550e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440011'),

-- Dr. Lefebvre (orthodontist)
('550e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440007'),
('550e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440010');

-- Insert test patient
INSERT INTO users (id, email, password_hash, role, first_name, last_name, phone, email_verified) VALUES 
(
    '550e8400-e29b-41d4-a716-446655440012',
    'patient.test@example.com',
    '$2a$12$LQv3c1yqBTVHhHvjHOKvEe/DatdT4JXiGMp4/kqNl.C1.1H1Q1H1Q', -- password: password123
    'patient',
    'Jean',
    'Dupont',
    '+33 6 45 67 89 01',
    true
);

INSERT INTO patients (id, user_id, date_of_birth, gender, preferred_language) VALUES 
(
    '550e8400-e29b-41d4-a716-446655440013',
    '550e8400-e29b-41d4-a716-446655440012',
    '1985-03-15',
    'male',
    'fr'
);

-- Insert some test appointments
INSERT INTO appointments (
    id, cabinet_id, patient_id, practitioner_id, service_id,
    scheduled_at, status, title, patient_email, patient_name, price
) VALUES 
(
    '550e8400-e29b-41d4-a716-446655440014',
    '550e8400-e29b-41d4-a716-446655440001',
    '550e8400-e29b-41d4-a716-446655440013',
    '550e8400-e29b-41d4-a716-446655440005',
    '550e8400-e29b-41d4-a716-446655440007',
    CURRENT_TIMESTAMP + INTERVAL '2 days' + INTERVAL '14 hours',
    'confirmed',
    'Consultation de contrôle',
    'patient.test@example.com',
    'Jean Dupont',
    80.00
),
(
    '550e8400-e29b-41d4-a716-446655440015',
    '550e8400-e29b-41d4-a716-446655440001',
    NULL, -- Non-registered patient
    '550e8400-e29b-41d4-a716-446655440005',
    '550e8400-e29b-41d4-a716-446655440008',
    CURRENT_TIMESTAMP + INTERVAL '3 days' + INTERVAL '10 hours',
    'scheduled',
    'Détartrage',
    'nouveau.patient@example.com',
    'Marie Nouveau',
    120.00
);

-- Create a test chat session
INSERT INTO chat_sessions (
    id, session_id, cabinet_id, 
    current_intent, collected_slots, conversation_state
) VALUES 
(
    '550e8400-e29b-41d4-a716-446655440016',
    'demo_session_001',
    '550e8400-e29b-41d4-a716-446655440001',
    'book_appointment',
    '{"serviceType": "consultation", "preferredDate": "demain"}',
    'waiting_for_input'
);

-- Insert demo chat messages
INSERT INTO chat_messages (session_id, role, content, intent, confidence) VALUES 
('550e8400-e29b-41d4-a716-446655440016', 'user', 'Bonjour', 'greeting', 0.95),
('550e8400-e29b-41d4-a716-446655440016', 'assistant', 'Bonjour ! Je suis Nova, votre assistant pour prendre rendez-vous. Comment puis-je vous aider ?', NULL, NULL),
('550e8400-e29b-41d4-a716-446655440016', 'user', 'Je voudrais prendre un rendez-vous', 'book_appointment', 0.87),
('550e8400-e29b-41d4-a716-446655440016', 'assistant', 'Parfait ! Je vais vous aider à réserver un rendez-vous. Quel type de consultation souhaitez-vous ?', NULL, NULL);

SELECT 'NOVA seed data inserted successfully!' as message;
SELECT 'Test users created with password: password123' as info;