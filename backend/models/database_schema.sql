-- PostgreSQL Database Schema for Doctor Recertification and ICU Shift Scheduling Application

-- Enable UUID extension for generating unique IDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable PostGIS for location-based queries (if needed)
-- CREATE EXTENSION IF NOT EXISTS postgis;

-- Create schema
CREATE SCHEMA IF NOT EXISTS doctor_scheduling;

-- Set search path
SET search_path TO doctor_scheduling, public;

-- Users table (doctors and administrators)
CREATE TABLE users (
    user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    crm_number VARCHAR(50) NOT NULL,
    crm_state CHAR(2) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(50),
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_crm UNIQUE (crm_number, crm_state)
);

-- Authentication table
CREATE TABLE authentication (
    auth_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'doctor',
    last_login TIMESTAMP WITH TIME ZONE,
    reset_token VARCHAR(255),
    token_expiry TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_role CHECK (role IN ('doctor', 'admin'))
);

-- Qualifications table
CREATE TABLE qualifications (
    qualification_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User qualifications mapping table
CREATE TABLE user_qualifications (
    user_qualification_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    qualification_id UUID NOT NULL REFERENCES qualifications(qualification_id) ON DELETE CASCADE,
    certification_date DATE NOT NULL,
    expiration_date DATE NOT NULL,
    certification_document VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_user_qualification UNIQUE (user_id, qualification_id),
    CONSTRAINT valid_certification_dates CHECK (expiration_date > certification_date)
);

-- Groups table
CREATE TABLE groups (
    group_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User groups mapping table
CREATE TABLE user_groups (
    user_group_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    group_id UUID NOT NULL REFERENCES groups(group_id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_active_user_group UNIQUE (user_id, group_id, start_date),
    CONSTRAINT valid_group_dates CHECK (end_date IS NULL OR end_date > start_date)
);

-- Shifts table
CREATE TABLE shifts (
    shift_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    duration_hours NUMERIC(4,2) NOT NULL,
    required_qualifications JSONB,
    min_doctors INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_shift_times CHECK (start_time <> end_time)
);

-- Schedules table
CREATE TABLE schedules (
    schedule_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shift_id UUID NOT NULL REFERENCES shifts(shift_id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    date DATE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'planned',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_user_shift_date UNIQUE (user_id, shift_id, date),
    CONSTRAINT valid_status CHECK (status IN ('planned', 'completed', 'missed', 'swapped'))
);

-- Shift balance table
CREATE TABLE shift_balances (
    balance_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    expected_shifts INTEGER NOT NULL DEFAULT 0,
    completed_shifts INTEGER NOT NULL DEFAULT 0,
    balance INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_user_period UNIQUE (user_id, period_start, period_end),
    CONSTRAINT valid_period_dates CHECK (period_end >= period_start)
);

-- Preferences table
CREATE TABLE preferences (
    preference_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    day_of_week INTEGER,
    specific_date DATE,
    shift_id UUID REFERENCES shifts(shift_id) ON DELETE CASCADE,
    preference_level INTEGER NOT NULL,
    valid_from DATE NOT NULL,
    valid_to DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_preference_level CHECK (preference_level BETWEEN 1 AND 5),
    CONSTRAINT valid_preference_dates CHECK (valid_to IS NULL OR valid_to > valid_from),
    CONSTRAINT day_or_date CHECK (
        (day_of_week IS NOT NULL AND specific_date IS NULL) OR
        (day_of_week IS NULL AND specific_date IS NOT NULL)
    ),
    CONSTRAINT valid_day_of_week CHECK (day_of_week IS NULL OR day_of_week BETWEEN 0 AND 6)
);

-- Availability table
CREATE TABLE availability (
    availability_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    start_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
    end_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
    availability_type VARCHAR(50) NOT NULL,
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_availability_type CHECK (availability_type IN ('available', 'unavailable')),
    CONSTRAINT valid_availability_dates CHECK (end_datetime > start_datetime)
);

-- Shift swaps table
CREATE TABLE shift_swaps (
    swap_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    requester_schedule_id UUID NOT NULL REFERENCES schedules(schedule_id) ON DELETE CASCADE,
    acceptor_schedule_id UUID REFERENCES schedules(schedule_id) ON DELETE SET NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_swap_status CHECK (status IN ('pending', 'accepted', 'rejected', 'cancelled'))
);

-- Recertification reminders table
CREATE TABLE recertification_reminders (
    reminder_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_qualification_id UUID NOT NULL REFERENCES user_qualifications(user_qualification_id) ON DELETE CASCADE,
    reminder_date DATE NOT NULL,
    sent BOOLEAN DEFAULT FALSE,
    sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Audit log table
CREATE TABLE audit_logs (
    log_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(user_id) ON DELETE SET NULL,
    action VARCHAR(255) NOT NULL,
    table_name VARCHAR(255) NOT NULL,
    record_id UUID NOT NULL,
    old_values JSONB,
    new_values JSONB,
    ip_address VARCHAR(50),
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- System settings table
CREATE TABLE system_settings (
    setting_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(255) NOT NULL UNIQUE,
    value TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance optimization
CREATE INDEX idx_user_qualifications_user_id ON user_qualifications(user_id);
CREATE INDEX idx_user_qualifications_expiration_date ON user_qualifications(expiration_date);
CREATE INDEX idx_user_groups_user_id ON user_groups(user_id);
CREATE INDEX idx_schedules_user_id ON schedules(user_id);
CREATE INDEX idx_schedules_date ON schedules(date);
CREATE INDEX idx_schedules_status ON schedules(status);
CREATE INDEX idx_preferences_user_id ON preferences(user_id);
CREATE INDEX idx_availability_user_id ON availability(user_id);
CREATE INDEX idx_availability_dates ON availability(start_datetime, end_datetime);

-- Create views for common queries
CREATE OR REPLACE VIEW view_active_doctors AS
SELECT u.user_id, u.name, u.crm_number, u.crm_state, u.email, u.phone,
       array_agg(DISTINCT g.name) AS groups,
       array_agg(DISTINCT q.name) AS qualifications
FROM users u
LEFT JOIN user_groups ug ON u.user_id = ug.user_id AND (ug.end_date IS NULL OR ug.end_date >= CURRENT_DATE)
LEFT JOIN groups g ON ug.group_id = g.group_id
LEFT JOIN user_qualifications uq ON u.user_id = uq.user_id AND uq.expiration_date >= CURRENT_DATE
LEFT JOIN qualifications q ON uq.qualification_id = q.qualification_id
WHERE u.active = TRUE
GROUP BY u.user_id, u.name, u.crm_number, u.crm_state, u.email, u.phone;

CREATE OR REPLACE VIEW view_expiring_certifications AS
SELECT u.user_id, u.name, u.email, q.name AS qualification, 
       uq.certification_date, uq.expiration_date,
       (uq.expiration_date - CURRENT_DATE) AS days_until_expiration
FROM users u
JOIN user_qualifications uq ON u.user_id = uq.user_id
JOIN qualifications q ON uq.qualification_id = q.qualification_id
WHERE uq.expiration_date >= CURRENT_DATE
AND uq.expiration_date <= (CURRENT_DATE + INTERVAL '90 days')
ORDER BY uq.expiration_date;

CREATE OR REPLACE VIEW view_shift_balance_summary AS
SELECT u.user_id, u.name, 
       sb.period_start, sb.period_end,
       sb.expected_shifts, sb.completed_shifts, sb.balance
FROM users u
JOIN shift_balances sb ON u.user_id = sb.user_id
WHERE u.active = TRUE
ORDER BY sb.period_end DESC, u.name;

-- Create functions and triggers for maintaining data integrity

-- Function to update the 'updated_at' timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply the update_updated_at_column trigger to all tables with updated_at column
DO $$
DECLARE
    t text;
BEGIN
    FOR t IN 
        SELECT table_name 
        FROM information_schema.columns 
        WHERE column_name = 'updated_at' 
        AND table_schema = 'doctor_scheduling'
    LOOP
        EXECUTE format('
            CREATE TRIGGER update_updated_at_timestamp
            BEFORE UPDATE ON doctor_scheduling.%I
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
        ', t);
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to update shift balances when schedules are updated
CREATE OR REPLACE FUNCTION update_shift_balance()
RETURNS TRIGGER AS $$
DECLARE
    shift_date DATE;
    period_start DATE;
    period_end DATE;
    doctor_id UUID;
BEGIN
    -- Determine which record to use (NEW for INSERT/UPDATE, OLD for DELETE)
    IF TG_OP = 'DELETE' THEN
        shift_date := OLD.date;
        doctor_id := OLD.user_id;
    ELSE
        shift_date := NEW.date;
        doctor_id := NEW.user_id;
    END IF;
    
    -- Calculate period start/end (assuming monthly periods)
    period_start := DATE_TRUNC('month', shift_date)::DATE;
    period_end := (DATE_TRUNC('month', shift_date) + INTERVAL '1 month' - INTERVAL '1 day')::DATE;
    
    -- Create balance record if it doesn't exist
    INSERT INTO shift_balances (user_id, period_start, period_end, expected_shifts, completed_shifts, balance)
    VALUES (doctor_id, period_start, period_end, 0, 0, 0)
    ON CONFLICT (user_id, period_start, period_end) DO NOTHING;
    
    -- Update the balance based on the operation
    IF TG_OP = 'INSERT' THEN
        IF NEW.status = 'planned' THEN
            UPDATE shift_balances 
            SET expected_shifts = expected_shifts + 1,
                balance = balance - 1
            WHERE user_id = doctor_id 
            AND period_start = period_start 
            AND period_end = period_end;
        ELSIF NEW.status = 'completed' THEN
            UPDATE shift_balances 
            SET expected_shifts = expected_shifts + 1,
                completed_shifts = completed_shifts + 1
            WHERE user_id = doctor_id 
            AND period_start = period_start 
            AND period_end = period_end;
        END IF;
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.status = 'planned' AND NEW.status = 'completed' THEN
            UPDATE shift_balances 
            SET completed_shifts = completed_shifts + 1,
                balance = balance + 1
            WHERE user_id = doctor_id 
            AND period_start = period_start 
            AND period_end = period_end;
        ELSIF OLD.status = 'completed' AND NEW.status = 'planned' THEN
            UPDATE shift_balances 
            SET completed_shifts = completed_shifts - 1,
                balance = balance - 1
            WHERE user_id = doctor_id 
            AND period_start = period_start 
            AND period_end = period_end;
        END IF;
    ELSIF TG_OP = 'DELETE' THEN
        IF OLD.status = 'planned' THEN
            UPDATE shift_balances 
            SET expected_shifts = expected_shifts - 1,
                balance = balance + 1
            WHERE user_id = doctor_id 
            AND period_start = period_start 
            AND period_end = period_end;
        ELSIF OLD.status = 'completed' THEN
            UPDATE shift_balances 
            SET expected_shifts = expected_shifts - 1,
                completed_shifts = completed_shifts - 1
            WHERE user_id = doctor_id 
            AND period_start = period_start 
            AND period_end = period_end;
        END IF;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for shift balance updates
CREATE TRIGGER update_shift_balance_trigger
AFTER INSERT OR UPDATE OR DELETE ON schedules
FOR EACH ROW
EXECUTE FUNCTION update_shift_balance();

-- Function to check for scheduling conflicts
CREATE OR REPLACE FUNCTION check_scheduling_conflicts()
RETURNS TRIGGER AS $$
DECLARE
    conflict_count INTEGER;
    shift_start TIMESTAMP WITH TIME ZONE;
    shift_end TIMESTAMP WITH TIME ZONE;
    shift_start_time TIME;
    shift_end_time TIME;
BEGIN
    -- Get the shift times
    SELECT start_time, end_time INTO shift_start_time, shift_end_time
    FROM shifts
    WHERE shift_id = NEW.shift_id;
    
    -- Calculate the actual start and end timestamps
    shift_start := (NEW.date + shift_start_time)::TIMESTAMP WITH TIME ZONE;
    
    -- Handle overnight shifts
    IF shift_end_time < shift_start_time THEN
        shift_end := (NEW.date + INTERVAL '1 day' + shift_end_time)::TIMESTAMP WITH TIME ZONE;
    ELSE
        shift_end := (NEW.date + shift_end_time)::TIMESTAMP WITH TIME ZONE;
    END IF;
    
    -- Check for conflicts with other shifts
    SELECT COUNT(*) INTO conflict_count
    FROM schedules s
    JOIN shifts sh ON s.shift_id = sh.shift_id
    WHERE s.user_id = NEW.user_id
    AND s.date = NEW.date
    AND s.schedule_id <> NEW.schedule_id
    AND (
        (NEW.date + shift_start_time, NEW.date + shift_end_time) OVERLAPS
        (s.date + sh.start_time, 
         CASE WHEN sh.end_time < sh.start_time 
              THEN s.date + INTERVAL '1 day' + sh.end_time
              ELSE s.date + sh.end_time
         END)
    );
    
    IF conflict_count > 0 THEN
        RAISE EXCEPTION 'Scheduling conflict detected for doctor % on %', NEW.user_id, NEW.date;
    END IF;
    
    -- Check for conflicts with unavailability periods
    SELECT COUNT(*) INTO conflict_count
    FROM availability a
    WHERE a.user_id = NEW.user_id
    AND a.availability_type = 'unavailable'
    AND (shift_start, shift_end) OVERLAPS (a.start_datetime, a.end_datetime);
    
    IF conflict_count > 0 THEN
        RAISE EXCEPTION 'Doctor % is marked as unavailable during this shift on %', NEW.user_id, NEW.date;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for scheduling conflict checks
CREATE TRIGGER check_scheduling_conflicts_trigger
BEFORE INSERT OR UPDATE ON schedules
FOR EACH ROW
EXECUTE FUNCTION check_scheduling_conflicts();

-- Insert initial system settings
INSERT INTO system_settings (key, value, description)
VALUES 
('recertification_reminder_days', '90,60,30,15,7,1', 'Days before expiration to send recertification reminders'),
('min_doctors_per_shift', '2', 'Minimum number of doctors required per shift'),
('max_consecutive_shifts', '3', 'Maximum number of consecutive shifts a doctor can work'),
('max_night_shifts_per_week', '3', 'Maximum number of night shifts per week'),
('min_rest_hours_between_shifts', '11', 'Minimum rest hours required between shifts');

-- Create initial admin user (password needs to be hashed in application code)
-- This is just a placeholder, actual implementation should use proper password hashing
INSERT INTO users (name, crm_number, crm_state, email, phone)
VALUES ('System Administrator', 'ADMIN', 'NA', 'admin@hospital.com.br', '(00)00000-0000');

INSERT INTO authentication (user_id, password_hash, role)
VALUES (
    (SELECT user_id FROM users WHERE email = 'admin@hospital.com.br'),
    'PLACEHOLDER_HASH_TO_BE_REPLACED_BY_APPLICATION',
    'admin'
);

-- Create initial qualification types
INSERT INTO qualifications (name, description)
VALUES 
('UTI Adulto', 'Qualificação para atendimento em UTI de adultos'),
('UTI Pediátrica', 'Qualificação para atendimento em UTI pediátrica'),
('Cardiologia', 'Especialização em cardiologia'),
('Pneumologia', 'Especialização em pneumologia'),
('Neurologia', 'Especialização em neurologia'),
('Nefrologia', 'Especialização em nefrologia'),
('Infectologia', 'Especialização em infectologia'),
('Emergência', 'Qualificação para atendimento de emergência'),
('Neonatologia', 'Especialização em neonatologia');

-- Create initial groups
INSERT INTO groups (name, description)
VALUES 
('Grupo A', 'Grupo principal de médicos plantonistas'),
('Grupo B', 'Grupo secundário de médicos plantonistas'),
('Grupo C', 'Grupo de médicos especialistas');

-- Create initial shift types
INSERT INTO shifts (name, start_time, end_time, duration_hours, min_doctors, required_qualifications)
VALUES 
('Manhã', '07:00:00', '19:00:00', 12.0, 2, '{"UTI Adulto": 1, "Cardiologia": 1}'),
('Noite', '19:00:00', '07:00:00', 12.0, 2, '{"UTI Adulto": 1, "Emergência": 1}'),
('Manhã Pediátrica', '07:00:00', '19:00:00', 12.0, 1, '{"UTI Pediátrica": 1}'),
('Noite Pediátrica', '19:00:00', '07:00:00', 12.0, 1, '{"UTI Pediátrica": 1}');

-- Comment explaining the schema
COMMENT ON SCHEMA doctor_scheduling IS 'Schema for the Doctor Recertification and ICU Shift Scheduling Application';