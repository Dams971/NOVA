-- Nova Database Seed Data
-- Migration 002: Insert test data

-- Insert test cabinets
INSERT INTO cabinets (id, name, description, address_street, address_city, address_postal_code, phone, email, specialties, opening_hours, is_active) VALUES
('cabinet-1', 'Cabinet Dentaire Central', 'Cabinet dentaire moderne au centre-ville', '123 Rue de la Paix', 'Paris', '75001', '+33 1 42 86 17 20', 'contact@cabinet-central.fr', '["dentisterie_generale", "orthodontie", "implantologie"]', '{"lundi": "9:00-18:00", "mardi": "9:00-18:00", "mercredi": "9:00-18:00", "jeudi": "9:00-18:00", "vendredi": "9:00-17:00"}', TRUE),
('cabinet-2', 'Clinique Dentaire Nord', 'Clinique spécialisée en chirurgie dentaire', '456 Avenue du Nord', 'Lille', '59000', '+33 3 20 12 34 56', 'info@clinique-nord.fr', '["chirurgie", "parodontologie", "endodontie"]', '{"lundi": "8:00-19:00", "mardi": "8:00-19:00", "mercredi": "8:00-19:00", "jeudi": "8:00-19:00", "vendredi": "8:00-18:00"}', TRUE);

-- Insert test users
INSERT INTO users (id, email, password_hash, first_name, last_name, phone, role, is_active, email_verified) VALUES
('user-manager-1', 'manager@cabinet-central.fr', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VcSAg/9qm', 'Jean', 'Dupont', '+33 6 12 34 56 78', 'manager', TRUE, TRUE),
('user-practitioner-1', 'dr.martin@cabinet-central.fr', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VcSAg/9qm', 'Dr. Pierre', 'Martin', '+33 6 23 45 67 89', 'practitioner', TRUE, TRUE),
('user-patient-1', 'marie.dubois@email.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VcSAg/9qm', 'Marie', 'Dubois', '+33 6 34 56 78 90', 'patient', TRUE, TRUE),
('user-patient-2', 'pierre.martin@email.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VcSAg/9qm', 'Pierre', 'Martin', '+33 6 45 67 89 01', 'patient', TRUE, TRUE),
('user-patient-3', 'sophie.laurent@email.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VcSAg/9qm', 'Sophie', 'Laurent', '+33 6 56 78 90 12', 'patient', TRUE, TRUE);

-- Insert cabinet members
INSERT INTO cabinet_members (id, cabinet_id, user_id, role, permissions, is_active) VALUES
('member-1', 'cabinet-1', 'user-manager-1', 'manager', '["read", "create", "update", "delete", "manage_appointments", "view_reports"]', TRUE),
('member-2', 'cabinet-1', 'user-practitioner-1', 'practitioner', '["read", "create", "update", "access_medical_records", "manage_appointments"]', TRUE);

-- Insert test patients
INSERT INTO patients (id, user_id, cabinet_id, date_of_birth, gender, address_street, address_city, address_postal_code, emergency_contact_name, emergency_contact_phone, emergency_contact_relationship, preferences, total_visits, last_visit_date, is_active) VALUES
('patient-1', 'user-patient-1', 'cabinet-1', '1985-03-15', 'female', '789 Rue des Fleurs', 'Paris', '75010', 'Jean Dubois', '+33 6 11 22 33 44', 'Époux', '{"preferredLanguage": "fr", "communicationMethod": "email", "reminderEnabled": true, "reminderHours": [24, 48]}', 5, '2024-01-15 10:30:00', TRUE),
('patient-2', 'user-patient-2', 'cabinet-1', '1978-07-22', 'male', '321 Boulevard Saint-Michel', 'Paris', '75005', 'Anne Martin', '+33 6 22 33 44 55', 'Épouse', '{"preferredLanguage": "fr", "communicationMethod": "sms", "reminderEnabled": true, "reminderHours": [48]}', 3, '2024-01-10 14:15:00', TRUE),
('patient-3', 'user-patient-3', 'cabinet-1', '1992-11-08', 'female', '654 Avenue de la République', 'Paris', '75011', 'Paul Laurent', '+33 6 33 44 55 66', 'Père', '{"preferredLanguage": "fr", "communicationMethod": "email", "reminderEnabled": false, "reminderHours": []}', 2, '2024-01-05 16:45:00', TRUE);

-- Insert medical records
INSERT INTO medical_records (id, patient_id, practitioner_id, type, title, description, date) VALUES
('record-1', 'patient-1', 'user-practitioner-1', 'consultation', 'Consultation de routine', 'Examen dentaire complet. Aucun problème détecté. Nettoyage effectué.', '2024-01-15 10:30:00'),
('record-2', 'patient-1', 'user-practitioner-1', 'treatment', 'Plombage dent 16', 'Carie sur la dent 16. Plombage composite réalisé.', '2023-12-10 09:15:00'),
('record-3', 'patient-2', 'user-practitioner-1', 'consultation', 'Contrôle post-traitement', 'Vérification du plombage. Tout va bien.', '2024-01-10 14:15:00'),
('record-4', 'patient-3', 'user-practitioner-1', 'consultation', 'Première consultation', 'Examen initial. Recommandation de nettoyage régulier.', '2024-01-05 16:45:00');

-- Insert test appointments
INSERT INTO appointments (id, cabinet_id, patient_id, practitioner_id, title, description, start_time, end_time, status, type) VALUES
('appointment-1', 'cabinet-1', 'patient-1', 'user-practitioner-1', 'Contrôle semestriel', 'Examen de routine et nettoyage', '2024-07-20 10:00:00', '2024-07-20 10:30:00', 'scheduled', 'consultation'),
('appointment-2', 'cabinet-1', 'patient-2', 'user-practitioner-1', 'Suivi traitement', 'Vérification du plombage', '2024-07-22 14:00:00', '2024-07-22 14:30:00', 'scheduled', 'suivi'),
('appointment-3', 'cabinet-1', 'patient-3', 'user-practitioner-1', 'Nettoyage', 'Détartrage et polissage', '2024-07-25 16:00:00', '2024-07-25 16:45:00', 'scheduled', 'nettoyage');
