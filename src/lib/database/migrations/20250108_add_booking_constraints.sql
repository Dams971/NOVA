-- NOVA Platform: Appointment Booking Safety Constraints
-- Prevents double-booking and ensures data integrity

-- Add UTC timestamp columns for proper timezone handling
ALTER TABLE appointments 
  ADD COLUMN start_utc DATETIME NULL AFTER scheduled_at,
  ADD COLUMN end_utc DATETIME NULL AFTER start_utc,
  ADD COLUMN timezone VARCHAR(50) DEFAULT 'Europe/Paris' AFTER end_utc;

-- Migrate existing data to UTC format
UPDATE appointments 
SET 
  start_utc = CONVERT_TZ(scheduled_at, 'Europe/Paris', 'UTC'),
  end_utc = CONVERT_TZ(DATE_ADD(scheduled_at, INTERVAL duration_minutes MINUTE), 'Europe/Paris', 'UTC'),
  timezone = 'Europe/Paris'
WHERE start_utc IS NULL;

-- Make UTC columns required
ALTER TABLE appointments 
  MODIFY start_utc DATETIME NOT NULL,
  MODIFY end_utc DATETIME NOT NULL;

-- Create unique index to prevent double-booking
-- This ensures no two appointments can overlap for the same practitioner
CREATE UNIQUE INDEX ux_appt_practitioner_time_slot
  ON appointments(practitioner_id, start_utc, end_utc);

-- Add check constraint to ensure end_utc > start_utc
ALTER TABLE appointments 
  ADD CONSTRAINT ck_appt_time_order 
  CHECK (end_utc > start_utc);

-- Add check constraint for reasonable appointment duration (15 min to 8 hours)
ALTER TABLE appointments 
  ADD CONSTRAINT ck_appt_duration 
  CHECK (TIMESTAMPDIFF(MINUTE, start_utc, end_utc) BETWEEN 15 AND 480);

-- Add audit columns for compliance
ALTER TABLE appointments
  ADD COLUMN created_by VARCHAR(36) NULL AFTER notes,
  ADD COLUMN updated_by VARCHAR(36) NULL AFTER created_by,
  ADD COLUMN version INT DEFAULT 1 AFTER updated_by;

-- Create index for efficient timezone-aware queries
CREATE INDEX idx_appt_local_time ON appointments(practitioner_id, scheduled_at, timezone);

-- Create index for audit trail queries
CREATE INDEX idx_appt_audit ON appointments(created_by, created_at);
CREATE INDEX idx_appt_updated ON appointments(updated_by, updated_at);

-- Add foreign key constraint for created_by and updated_by
ALTER TABLE appointments
  ADD CONSTRAINT fk_appt_created_by 
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  ADD CONSTRAINT fk_appt_updated_by 
  FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL;

-- Create trigger to update version and updated_by on changes
DELIMITER //
CREATE TRIGGER tr_appointments_update 
  BEFORE UPDATE ON appointments
  FOR EACH ROW
BEGIN
  SET NEW.version = OLD.version + 1;
  SET NEW.updated_at = CURRENT_TIMESTAMP;
  -- NEW.updated_by should be set by application logic
END//
DELIMITER ;

-- Create appointment conflict check stored procedure
DELIMITER //
CREATE PROCEDURE CheckAppointmentConflict(
  IN p_practitioner_id VARCHAR(36),
  IN p_start_utc DATETIME,
  IN p_end_utc DATETIME,
  IN p_exclude_appointment_id VARCHAR(36),
  OUT p_conflict_count INT
)
BEGIN
  SELECT COUNT(*) INTO p_conflict_count
  FROM appointments
  WHERE practitioner_id = p_practitioner_id
    AND status NOT IN ('cancelled', 'no_show')
    AND (p_exclude_appointment_id IS NULL OR id != p_exclude_appointment_id)
    AND NOT (end_utc <= p_start_utc OR start_utc >= p_end_utc);
END//
DELIMITER ;

-- Create function to get appointment conflicts
DELIMITER //
CREATE FUNCTION GetAppointmentConflicts(
  p_practitioner_id VARCHAR(36),
  p_start_utc DATETIME,
  p_end_utc DATETIME,
  p_exclude_appointment_id VARCHAR(36)
) RETURNS JSON
READS SQL DATA
DETERMINISTIC
BEGIN
  DECLARE result JSON;
  
  SELECT JSON_ARRAYAGG(
    JSON_OBJECT(
      'id', id,
      'start_utc', start_utc,
      'end_utc', end_utc,
      'patient_id', patient_id,
      'status', status
    )
  ) INTO result
  FROM appointments
  WHERE practitioner_id = p_practitioner_id
    AND status NOT IN ('cancelled', 'no_show')
    AND (p_exclude_appointment_id IS NULL OR id != p_exclude_appointment_id)
    AND NOT (end_utc <= p_start_utc OR start_utc >= p_end_utc);
  
  RETURN IFNULL(result, JSON_ARRAY());
END//
DELIMITER ;

-- Add appointment status history table for audit trail
CREATE TABLE appointment_status_history (
  id VARCHAR(36) PRIMARY KEY,
  appointment_id VARCHAR(36) NOT NULL,
  old_status ENUM('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show'),
  new_status ENUM('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show') NOT NULL,
  changed_by VARCHAR(36),
  changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reason TEXT,
  
  FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE,
  FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE SET NULL,
  
  INDEX idx_appt_status_history (appointment_id, changed_at),
  INDEX idx_appt_status_audit (changed_by, changed_at)
);

-- Create trigger to log status changes
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

-- Add appointment reminders table
CREATE TABLE appointment_reminders (
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
);

-- Performance optimization: partition appointments table by month
-- ALTER TABLE appointments 
-- PARTITION BY RANGE (TO_DAYS(start_utc)) (
--   PARTITION p2024_01 VALUES LESS THAN (TO_DAYS('2024-02-01')),
--   PARTITION p2024_02 VALUES LESS THAN (TO_DAYS('2024-03-01')),
--   -- Add more partitions as needed
-- );

-- Create view for appointment conflicts checking
CREATE VIEW v_appointment_conflicts AS
SELECT 
  a1.id as appointment_id,
  a1.practitioner_id,
  a1.start_utc,
  a1.end_utc,
  a1.status,
  COUNT(a2.id) as conflict_count,
  JSON_ARRAYAGG(
    CASE WHEN a2.id IS NOT NULL THEN
      JSON_OBJECT(
        'id', a2.id,
        'start_utc', a2.start_utc,
        'end_utc', a2.end_utc,
        'status', a2.status
      )
    ELSE NULL END
  ) as conflicts
FROM appointments a1
LEFT JOIN appointments a2 ON (
  a1.practitioner_id = a2.practitioner_id 
  AND a1.id != a2.id
  AND a2.status NOT IN ('cancelled', 'no_show')
  AND NOT (a2.end_utc <= a1.start_utc OR a2.start_utc >= a1.end_utc)
)
WHERE a1.status NOT IN ('cancelled', 'no_show')
GROUP BY a1.id, a1.practitioner_id, a1.start_utc, a1.end_utc, a1.status;