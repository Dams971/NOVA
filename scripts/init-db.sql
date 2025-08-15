-- NOVA Platform Database Initialization
-- Creates main database and sample tenant databases with proper constraints

-- Create main platform database
CREATE DATABASE IF NOT EXISTS nova_main 
  CHARACTER SET utf8mb4 
  COLLATE utf8mb4_unicode_ci;

USE nova_main;

-- Create nova_user with proper permissions
CREATE USER IF NOT EXISTS 'nova_user'@'%' IDENTIFIED BY 'nova_password_2024';
GRANT ALL PRIVILEGES ON nova_main.* TO 'nova_user'@'%';
GRANT ALL PRIVILEGES ON `nova_cabinet_%`.* TO 'nova_user'@'%';
FLUSH PRIVILEGES;

-- Main platform tables (from existing schema)
-- Users table
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(36) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  role ENUM('super_admin', 'admin', 'manager', 'staff') NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  last_login_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_role (role),
  INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Cabinets table
CREATE TABLE IF NOT EXISTS cabinets (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  address_street VARCHAR(255),
  address_city VARCHAR(100),
  address_postal_code VARCHAR(20),
  address_country VARCHAR(100),
  phone VARCHAR(50),
  email VARCHAR(255),
  timezone VARCHAR(50) DEFAULT 'Europe/Paris',
  status ENUM('active', 'inactive', 'deploying', 'maintenance') DEFAULT 'active',
  database_name VARCHAR(100) NOT NULL,
  business_hours JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_status (status),
  INDEX idx_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- User-Cabinet assignments
CREATE TABLE IF NOT EXISTS user_cabinet_assignments (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  cabinet_id VARCHAR(36) NOT NULL,
  permissions JSON,
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (cabinet_id) REFERENCES cabinets(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_cabinet (user_id, cabinet_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- MFA table
CREATE TABLE IF NOT EXISTS user_mfa (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  secret VARCHAR(255) NOT NULL,
  backup_codes JSON,
  is_enabled BOOLEAN DEFAULT FALSE,
  enabled_at TIMESTAMP NULL,
  disabled_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_mfa (user_id),
  INDEX idx_user_enabled (user_id, is_enabled)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Cabinet configurations
CREATE TABLE IF NOT EXISTS cabinet_configurations (
  id VARCHAR(36) PRIMARY KEY,
  cabinet_id VARCHAR(36) NOT NULL,
  config_key VARCHAR(100) NOT NULL,
  config_value JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (cabinet_id) REFERENCES cabinets(id) ON DELETE CASCADE,
  UNIQUE KEY unique_cabinet_config (cabinet_id, config_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Audit logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36),
  cabinet_id VARCHAR(36),
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50),
  resource_id VARCHAR(36),
  details JSON,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (cabinet_id) REFERENCES cabinets(id) ON DELETE SET NULL,
  INDEX idx_user_action (user_id, action),
  INDEX idx_cabinet_action (cabinet_id, action),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Migrations tracking
CREATE TABLE IF NOT EXISTS migrations (
  id VARCHAR(255) PRIMARY KEY,
  filename VARCHAR(255) NOT NULL,
  executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert sample data
-- Super admin user (password: AdminPassword123!)
INSERT IGNORE INTO users (id, email, password_hash, first_name, last_name, role, is_active) VALUES 
('admin-super-1', 'admin@nova-dental.fr', '$2a$12$rQZYKjxC7oQvLjTBnWJgHOYq1KLG7jrqVhc2KjqZjqKjqZjqZjqZ', 'Nova', 'Admin', 'super_admin', TRUE);

-- Sample cabinets
INSERT IGNORE INTO cabinets (id, name, slug, address_city, phone, email, timezone, status, database_name, business_hours) VALUES 
('cabinet-1', 'Cabinet Dentaire Central', 'cabinet-1', 'Paris', '+33142123456', 'contact@cabinet-central.fr', 'Europe/Paris', 'active', 'nova_cabinet_cabinet_1',
  JSON_OBJECT(
    'monday', JSON_OBJECT('open', '08:00', 'close', '18:00'),
    'tuesday', JSON_OBJECT('open', '08:00', 'close', '18:00'),
    'wednesday', JSON_OBJECT('open', '08:00', 'close', '18:00'),
    'thursday', JSON_OBJECT('open', '08:00', 'close', '18:00'),
    'friday', JSON_OBJECT('open', '08:00', 'close', '18:00'),
    'saturday', JSON_OBJECT('open', '09:00', 'close', '13:00'),
    'sunday', JSON_OBJECT('open', null, 'close', null)
  )),
('cabinet-2', 'Clinique Dentaire Nord', 'cabinet-2', 'Lille', '+33320123456', 'contact@clinique-nord.fr', 'Europe/Paris', 'active', 'nova_cabinet_cabinet_2',
  JSON_OBJECT(
    'monday', JSON_OBJECT('open', '08:30', 'close', '17:30'),
    'tuesday', JSON_OBJECT('open', '08:30', 'close', '17:30'),
    'wednesday', JSON_OBJECT('open', '08:30', 'close', '17:30'),
    'thursday', JSON_OBJECT('open', '08:30', 'close', '17:30'),
    'friday', JSON_OBJECT('open', '08:30', 'close', '17:30'),
    'saturday', JSON_OBJECT('open', null, 'close', null),
    'sunday', JSON_OBJECT('open', null, 'close', null)
  ));

-- Sample managers (password: ManagerPassword123!)
INSERT IGNORE INTO users (id, email, password_hash, first_name, last_name, role, is_active) VALUES 
('manager-1', 'manager@cabinet-central.fr', '$2a$12$rQZYKjxC7oQvLjTBnWJgHOYq1KLG7jrqVhc2KjqZjqKjqZjqZjqZ', 'Marie', 'Dubois', 'manager', TRUE),
('manager-2', 'manager@clinique-nord.fr', '$2a$12$rQZYKjxC7oQvLjTBnWJgHOYq1KLG7jrqVhc2KjqZjqKjqZjqZjqZ', 'Pierre', 'Martin', 'manager', TRUE);

-- Cabinet assignments
INSERT IGNORE INTO user_cabinet_assignments (id, user_id, cabinet_id, permissions) VALUES 
('assign-1', 'admin-super-1', 'cabinet-1', JSON_OBJECT('role', 'super_admin', 'permissions', JSON_ARRAY('*'))),
('assign-2', 'admin-super-1', 'cabinet-2', JSON_OBJECT('role', 'super_admin', 'permissions', JSON_ARRAY('*'))),
('assign-3', 'manager-1', 'cabinet-1', JSON_OBJECT('role', 'manager', 'permissions', JSON_ARRAY('read', 'create', 'update'))),
('assign-4', 'manager-2', 'cabinet-2', JSON_OBJECT('role', 'manager', 'permissions', JSON_ARRAY('read', 'create', 'update')));

-- Now create sample cabinet databases
-- Cabinet 1 Database
CREATE DATABASE IF NOT EXISTS nova_cabinet_cabinet_1 
  CHARACTER SET utf8mb4 
  COLLATE utf8mb4_unicode_ci;

USE nova_cabinet_cabinet_1;

-- Patients table for cabinet 1
CREATE TABLE IF NOT EXISTS patients (
  id VARCHAR(36) PRIMARY KEY,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  date_of_birth DATE,
  gender ENUM('M', 'F', 'Other'),
  address_street VARCHAR(255),
  address_city VARCHAR(100),
  address_postal_code VARCHAR(20),
  emergency_contact_name VARCHAR(200),
  emergency_contact_phone VARCHAR(50),
  medical_notes TEXT,
  allergies JSON,
  current_treatments JSON,
  preferences JSON,
  is_active BOOLEAN DEFAULT TRUE,
  last_visit DATETIME,
  total_visits INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_name (last_name, first_name),
  INDEX idx_email (email),
  INDEX idx_phone (phone),
  INDEX idx_active (is_active),
  INDEX idx_last_visit (last_visit)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Practitioners table
CREATE TABLE IF NOT EXISTS practitioners (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36),
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  specialization VARCHAR(100),
  license_number VARCHAR(100),
  phone VARCHAR(50),
  email VARCHAR(255),
  schedule_config JSON,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id),
  INDEX idx_active (is_active),
  INDEX idx_specialization (specialization)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Services table
CREATE TABLE IF NOT EXISTS services (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  duration_minutes INT DEFAULT 30,
  price DECIMAL(10,2),
  category VARCHAR(100),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_category (category),
  INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Enhanced appointments table with all constraints
CREATE TABLE IF NOT EXISTS appointments (
  id VARCHAR(36) PRIMARY KEY,
  patient_id VARCHAR(36) NOT NULL,
  practitioner_id VARCHAR(36),
  service_id VARCHAR(36),
  service_type VARCHAR(100) NOT NULL,
  scheduled_at DATETIME NOT NULL,
  start_utc DATETIME NOT NULL,
  end_utc DATETIME NOT NULL,
  timezone VARCHAR(50) DEFAULT 'Europe/Paris',
  duration_minutes INT DEFAULT 30,
  status ENUM('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show') DEFAULT 'scheduled',
  notes TEXT,
  created_by VARCHAR(36),
  updated_by VARCHAR(36),
  version INT DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Foreign key constraints
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  FOREIGN KEY (practitioner_id) REFERENCES practitioners(id) ON DELETE SET NULL,
  FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE SET NULL,
  
  -- Performance indexes
  INDEX idx_scheduled_at (scheduled_at),
  INDEX idx_patient (patient_id),
  INDEX idx_practitioner (practitioner_id),
  INDEX idx_status (status),
  INDEX idx_utc_times (start_utc, end_utc),
  INDEX idx_local_time (practitioner_id, scheduled_at, timezone),
  INDEX idx_audit (created_by, created_at),
  
  -- Unique constraint to prevent double-booking
  UNIQUE KEY ux_appt_practitioner_time_slot (practitioner_id, start_utc, end_utc),
  
  -- Check constraints
  CONSTRAINT ck_appt_time_order CHECK (end_utc > start_utc),
  CONSTRAINT ck_appt_duration CHECK (TIMESTAMPDIFF(MINUTE, start_utc, end_utc) BETWEEN 15 AND 480)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Appointment status history
CREATE TABLE IF NOT EXISTS appointment_status_history (
  id VARCHAR(36) PRIMARY KEY,
  appointment_id VARCHAR(36) NOT NULL,
  old_status ENUM('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show'),
  new_status ENUM('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show') NOT NULL,
  changed_by VARCHAR(36),
  changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reason TEXT,
  
  FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE,
  INDEX idx_appt_status_history (appointment_id, changed_at),
  INDEX idx_appt_status_audit (changed_by, changed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Appointment reminders
CREATE TABLE IF NOT EXISTS appointment_reminders (
  id VARCHAR(36) PRIMARY KEY,
  appointment_id VARCHAR(36) NOT NULL,
  reminder_type ENUM('email', 'sms', 'push') NOT NULL,
  scheduled_for DATETIME NOT NULL,
  sent_at DATETIME NULL,
  status ENUM('pending', 'sent', 'failed', 'cancelled') DEFAULT 'pending',
  attempts INT DEFAULT 0,
  error_message TEXT NULL,
  
  FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE,
  INDEX idx_reminder_schedule (scheduled_for, status),
  INDEX idx_reminder_appointment (appointment_id),
  UNIQUE KEY ux_appointment_reminder_type (appointment_id, reminder_type, scheduled_for)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Medical records
CREATE TABLE IF NOT EXISTS medical_records (
  id VARCHAR(36) PRIMARY KEY,
  patient_id VARCHAR(36) NOT NULL,
  record_date DATETIME NOT NULL,
  record_type ENUM('consultation', 'treatment', 'note', 'allergy', 'medication', 'xray', 'procedure') NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  practitioner_id VARCHAR(36),
  attachments JSON,
  is_confidential BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  FOREIGN KEY (practitioner_id) REFERENCES practitioners(id) ON DELETE SET NULL,
  INDEX idx_patient_records (patient_id, record_date),
  INDEX idx_record_type (record_type),
  INDEX idx_practitioner_records (practitioner_id, record_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert sample data for cabinet 1
-- Sample practitioners
INSERT IGNORE INTO practitioners (id, first_name, last_name, specialization, phone, email, is_active, schedule_config) VALUES 
('prac-1-cabinet-1', 'Dr. Jean', 'Dupont', 'Dentiste généraliste', '+33142123457', 'dr.dupont@cabinet-central.fr', TRUE,
  JSON_OBJECT(
    'availability', JSON_OBJECT(
      'monday', JSON_ARRAY('08:00-12:00', '14:00-18:00'),
      'tuesday', JSON_ARRAY('08:00-12:00', '14:00-18:00'),
      'wednesday', JSON_ARRAY('08:00-12:00', '14:00-18:00'),
      'thursday', JSON_ARRAY('08:00-12:00', '14:00-18:00'),
      'friday', JSON_ARRAY('08:00-12:00', '14:00-17:00')
    ),
    'appointmentDuration', 30,
    'maxConsecutiveAppointments', 8
  )),
('prac-2-cabinet-1', 'Dr. Sophie', 'Leroy', 'Orthodontiste', '+33142123458', 'dr.leroy@cabinet-central.fr', TRUE,
  JSON_OBJECT(
    'availability', JSON_OBJECT(
      'tuesday', JSON_ARRAY('09:00-12:00', '14:00-17:00'),
      'wednesday', JSON_ARRAY('09:00-12:00', '14:00-17:00'),
      'thursday', JSON_ARRAY('09:00-12:00', '14:00-17:00'),
      'friday', JSON_ARRAY('09:00-12:00', '14:00-17:00')
    ),
    'appointmentDuration', 45,
    'maxConsecutiveAppointments', 6
  ));

-- Sample services
INSERT IGNORE INTO services (id, name, description, duration_minutes, price, category, is_active) VALUES 
('service-1', 'Consultation', 'Consultation dentaire de routine', 30, 60.00, 'Consultation', TRUE),
('service-2', 'Détartrage', 'Nettoyage et détartrage complet', 45, 80.00, 'Hygiène', TRUE),
('service-3', 'Plombage', 'Soin de carie avec composite', 60, 120.00, 'Soin', TRUE),
('service-4', 'Extraction', 'Extraction dentaire simple', 30, 90.00, 'Chirurgie', TRUE),
('service-5', 'Couronne', 'Pose de couronne céramique', 90, 600.00, 'Prothèse', TRUE),
('service-6', 'Urgence', 'Consultation d\'urgence', 30, 100.00, 'Urgence', TRUE);

-- Sample patients
INSERT IGNORE INTO patients (id, first_name, last_name, email, phone, date_of_birth, gender, address_city, emergency_contact_name, emergency_contact_phone, is_active, preferences, total_visits) VALUES 
('patient-1-cabinet-1', 'Marie', 'Dubois', 'marie.dubois@email.com', '+33123456789', '1985-03-15', 'F', 'Paris', 'Jean Dubois', '+33123456790', TRUE,
  JSON_OBJECT(
    'preferredLanguage', 'fr',
    'communicationMethod', 'email',
    'reminderEnabled', TRUE,
    'reminderHours', JSON_ARRAY(24, 2)
  ), 5),
('patient-2-cabinet-1', 'Pierre', 'Martin', 'pierre.martin@email.com', '+33987654321', '1978-11-22', 'M', 'Paris', 'Anne Martin', '+33987654322', TRUE,
  JSON_OBJECT(
    'preferredLanguage', 'fr',
    'communicationMethod', 'sms',
    'reminderEnabled', TRUE,
    'reminderHours', JSON_ARRAY(48, 24)
  ), 3),
('patient-3-cabinet-1', 'Sophie', 'Laurent', 'sophie.laurent@email.com', '+33456789123', '1992-07-08', 'F', 'Paris', NULL, NULL, TRUE,
  JSON_OBJECT(
    'preferredLanguage', 'fr',
    'communicationMethod', 'email',
    'reminderEnabled', FALSE,
    'reminderHours', JSON_ARRAY()
  ), 2);

-- Sample appointments (some in the past, some future)
INSERT IGNORE INTO appointments (id, patient_id, practitioner_id, service_id, service_type, scheduled_at, start_utc, end_utc, timezone, duration_minutes, status, created_by) VALUES 
('appt-1', 'patient-1-cabinet-1', 'prac-1-cabinet-1', 'service-1', 'Consultation', '2024-12-15 10:00:00', '2024-12-15 09:00:00', '2024-12-15 09:30:00', 'Europe/Paris', 30, 'completed', 'manager-1'),
('appt-2', 'patient-2-cabinet-1', 'prac-1-cabinet-1', 'service-2', 'Détartrage', '2024-12-20 14:30:00', '2024-12-20 13:30:00', '2024-12-20 14:15:00', 'Europe/Paris', 45, 'completed', 'manager-1'),
('appt-3', 'patient-1-cabinet-1', 'prac-2-cabinet-1', 'service-5', 'Couronne', '2025-01-15 09:00:00', '2025-01-15 08:00:00', '2025-01-15 09:30:00', 'Europe/Paris', 90, 'scheduled', 'manager-1'),
('appt-4', 'patient-3-cabinet-1', 'prac-1-cabinet-1', 'service-1', 'Consultation', '2025-01-20 15:00:00', '2025-01-20 14:00:00', '2025-01-20 14:30:00', 'Europe/Paris', 30, 'scheduled', 'manager-1');

-- Sample medical records
INSERT IGNORE INTO medical_records (id, patient_id, record_date, record_type, title, description, practitioner_id) VALUES 
('record-1', 'patient-1-cabinet-1', '2024-12-15 10:00:00', 'consultation', 'Consultation de routine', 'Examen dentaire complet. Aucun problème détecté. RDV de contrôle dans 6 mois.', 'prac-1-cabinet-1'),
('record-2', 'patient-2-cabinet-1', '2024-12-20 14:30:00', 'treatment', 'Détartrage complet', 'Détartrage et polissage des dents. Hygiène bucco-dentaire à améliorer.', 'prac-1-cabinet-1'),
('record-3', 'patient-2-cabinet-1', '2024-12-20 14:30:00', 'allergy', 'Allergie pénicilline', 'Patient allergique à la pénicilline. Utiliser des alternatives lors des prescriptions.', 'prac-1-cabinet-1');

-- Update patients' last visit dates
UPDATE patients SET last_visit = '2024-12-15 10:00:00' WHERE id = 'patient-1-cabinet-1';
UPDATE patients SET last_visit = '2024-12-20 14:30:00' WHERE id = 'patient-2-cabinet-1';

-- Triggers for appointment status changes
DELIMITER //
CREATE TRIGGER tr_appointments_status_change 
  AFTER UPDATE ON appointments
  FOR EACH ROW
BEGIN
  IF OLD.status != NEW.status THEN
    INSERT INTO appointment_status_history (
      id, appointment_id, old_status, new_status, changed_by, reason
    ) VALUES (
      UUID(), NEW.id, OLD.status, NEW.status, NEW.updated_by, 
      CONCAT('Status changed from ', OLD.status, ' to ', NEW.status)
    );
  END IF;
END//
DELIMITER ;

-- Back to main database
USE nova_main;

-- Record successful initialization
INSERT IGNORE INTO migrations (id, filename) VALUES 
('init-db', 'init-db.sql');

-- Create Cabinet 2 database (similar structure)
CREATE DATABASE IF NOT EXISTS nova_cabinet_cabinet_2 
  CHARACTER SET utf8mb4 
  COLLATE utf8mb4_unicode_ci;

-- Grant permissions
GRANT ALL PRIVILEGES ON nova_cabinet_cabinet_2.* TO 'nova_user'@'%';
FLUSH PRIVILEGES;

SELECT 'Database initialization completed successfully!' as status;