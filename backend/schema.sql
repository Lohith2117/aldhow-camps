-- ============================================================================
-- DHOW ENGINEERING CAMP MANAGEMENT ERP - NORMALIZED POSTGRESQL DATABASE SCHEMA
-- Master Cost Center: 1ACD000
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. SYSTEM USERS & RBAC TABLE
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(50) PRIMARY KEY,
    staff_id VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    title VARCHAR(100),
    role VARCHAR(30) NOT NULL CHECK (role IN ('SUPER_ADMIN', 'CAMP_EDITOR', 'AUDITOR')),
    camp_scope VARCHAR(50) DEFAULT 'ALL',
    status VARCHAR(30) DEFAULT 'Active' CHECK (status IN ('Active', 'Suspended')),
    can_manage_users BOOLEAN DEFAULT FALSE,
    can_add_camps BOOLEAN DEFAULT FALSE,
    can_delete_camps BOOLEAN DEFAULT FALSE,
    can_edit_occupants BOOLEAN DEFAULT TRUE,
    can_export_reports BOOLEAN DEFAULT TRUE,
    can_approve_transfers BOOLEAN DEFAULT FALSE,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. PROJECT COST CENTERS TABLE
CREATE TABLE IF NOT EXISTS cost_centers (
    id VARCHAR(50) PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    division VARCHAR(50) NOT NULL,
    status VARCHAR(30) DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. CAMPS / APARTMENT BUILDINGS TABLE
CREATE TABLE IF NOT EXISTS camps (
    id VARCHAR(50) PRIMARY KEY,
    camp_no VARCHAR(50) UNIQUE NOT NULL,
    camp_area VARCHAR(150) NOT NULL,
    cost_center VARCHAR(50) DEFAULT '1ACD000',
    camp_digit VARCHAR(10) NOT NULL,
    camp_start_date DATE NOT NULL,
    status VARCHAR(30) DEFAULT 'Active' CHECK (status IN ('Active', 'Decommissioned')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. FLOORS TABLE (Supports Individual Flat Counts per Floor, e.g., Flr 1 = 2 flats, Flrs 2-10 = 3 flats)
CREATE TABLE IF NOT EXISTS floors (
    id SERIAL PRIMARY KEY,
    camp_id VARCHAR(50) NOT NULL REFERENCES camps(id) ON DELETE CASCADE,
    floor_no INT NOT NULL,
    UNIQUE (camp_id, floor_no)
);

-- 5. FLATS TABLE (Grades: 'Non-Manual' or 'Manual')
CREATE TABLE IF NOT EXISTS flats (
    id SERIAL PRIMARY KEY,
    floor_id INT NOT NULL REFERENCES floors(id) ON DELETE CASCADE,
    flat_no INT NOT NULL,
    flat_code VARCHAR(50) UNIQUE NOT NULL,
    room_grade VARCHAR(30) NOT NULL CHECK (room_grade IN ('Non-Manual', 'Manual')),
    UNIQUE (floor_id, flat_no)
);

-- 6. ROOMS TABLE
CREATE TABLE IF NOT EXISTS rooms (
    id SERIAL PRIMARY KEY,
    flat_id INT NOT NULL REFERENCES flats(id) ON DELETE CASCADE,
    room_no VARCHAR(50) UNIQUE NOT NULL,
    capacity INT NOT NULL DEFAULT 3
);

-- 7. EMPLOYEES / OCCUPANTS MASTER TABLE
CREATE TABLE IF NOT EXISTS employees (
    employee_id VARCHAR(50) PRIMARY KEY,
    sr_no SERIAL,
    employee_name VARCHAR(200) NOT NULL,
    nationality VARCHAR(80) NOT NULL,
    title VARCHAR(120) NOT NULL,
    grade_type VARCHAR(30) NOT NULL CHECK (grade_type IN ('Non-Manual', 'Manual')),
    division VARCHAR(50) NOT NULL,
    cost_center VARCHAR(50) NOT NULL REFERENCES cost_centers(code),
    passport_no VARCHAR(50) NOT NULL,
    civil_id VARCHAR(50) NOT NULL,
    mobile_no VARCHAR(50) NOT NULL,
    emergency_contact_name VARCHAR(150),
    emergency_contact_phone VARCHAR(50),
    home_country_address TEXT,
    camp_no VARCHAR(50),
    camp_area VARCHAR(150),
    floor_no INT,
    flat_no INT,
    flat_code VARCHAR(50),
    room_no VARCHAR(50),
    entry_date DATE NOT NULL,
    afr_entry_ref VARCHAR(80),
    afr_log_no VARCHAR(80),
    employee_status VARCHAR(40) NOT NULL DEFAULT 'On Job'
        CHECK (employee_status IN ('On Job', 'On Leave', 'RTD - Resigned', 'RTD - Terminated', 'RTD - Dismissed')),
    leave_start_date DATE,
    leave_end_date DATE,
    leave_return_date DATE,
    rtd_type VARCHAR(30),
    rtd_date DATE,
    afr_exit_ref VARCHAR(80),
    residency_company VARCHAR(200) DEFAULT 'Dhow Engineering General Trading & Contracting Company',
    remarks TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. LEAVE LOGS TABLE (Tracks Start Date, Expected End Date & Actual Return Date)
CREATE TABLE IF NOT EXISTS leave_logs (
    id VARCHAR(50) PRIMARY KEY,
    employee_id VARCHAR(50) NOT NULL REFERENCES employees(employee_id) ON DELETE CASCADE,
    employee_name VARCHAR(200) NOT NULL,
    camp_no VARCHAR(50) NOT NULL,
    room_no VARCHAR(50) NOT NULL,
    leave_start_date DATE NOT NULL,
    expected_end_date DATE NOT NULL,
    actual_return_date DATE,
    afr_log_no VARCHAR(80),
    remarks TEXT,
    status VARCHAR(30) DEFAULT 'Active Leave' CHECK (status IN ('Active Leave', 'Returned')),
    created_by VARCHAR(150),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 9. RTD LOGS TABLE (Resigned, Terminated, Dismissed Records)
CREATE TABLE IF NOT EXISTS rtd_logs (
    id VARCHAR(50) PRIMARY KEY,
    employee_id VARCHAR(50) NOT NULL REFERENCES employees(employee_id) ON DELETE CASCADE,
    employee_name VARCHAR(200) NOT NULL,
    rtd_type VARCHAR(30) NOT NULL CHECK (rtd_type IN ('Resigned', 'Terminated', 'Dismissed')),
    rtd_date DATE NOT NULL,
    vacated_camp_no VARCHAR(50),
    vacated_room_no VARCHAR(50),
    cost_center VARCHAR(50),
    afr_exit_ref VARCHAR(80),
    remarks TEXT,
    recorded_by VARCHAR(150),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 10. STAY & RELOCATION HISTORY TIMELINE TABLE
CREATE TABLE IF NOT EXISTS stay_history (
    id SERIAL PRIMARY KEY,
    employee_id VARCHAR(50) NOT NULL REFERENCES employees(employee_id) ON DELETE CASCADE,
    camp_no VARCHAR(50) NOT NULL,
    camp_area VARCHAR(150),
    flat_code VARCHAR(50),
    room_no VARCHAR(50) NOT NULL,
    room_grade VARCHAR(30) NOT NULL,
    cost_center VARCHAR(50),
    start_date DATE NOT NULL,
    end_date DATE,
    reason TEXT
);

-- 11. COST CENTER TRANSFER APPROVAL REQUESTS TABLE (Editor -> Super Admin / Auditor)
CREATE TABLE IF NOT EXISTS transfer_requests (
    id VARCHAR(50) PRIMARY KEY,
    employee_id VARCHAR(50) NOT NULL REFERENCES employees(employee_id) ON DELETE CASCADE,
    employee_name VARCHAR(200) NOT NULL,
    from_cost_center VARCHAR(50) NOT NULL,
    from_division VARCHAR(50) NOT NULL,
    to_cost_center VARCHAR(50) NOT NULL,
    to_division VARCHAR(50) NOT NULL,
    reason TEXT,
    requested_by VARCHAR(150) NOT NULL,
    requested_by_role VARCHAR(40) NOT NULL,
    request_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(30) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    reviewed_by VARCHAR(150),
    review_date TIMESTAMP,
    review_remarks TEXT
);

-- 12. BILLING "OTHERS" (MISCELLANEOUS CAMP COSTS) TABLE
CREATE TABLE IF NOT EXISTS billing_other_costs (
    id VARCHAR(50) PRIMARY KEY,
    billing_period VARCHAR(50) NOT NULL,
    cost_center VARCHAR(50) NOT NULL REFERENCES cost_centers(code),
    other_cost_kwd NUMERIC(12, 3) DEFAULT 0.000,
    other_cost_description TEXT,
    updated_by VARCHAR(150),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (billing_period, cost_center)
);

-- 13. CHROME-STYLE ACTIVITY TIME LOG TABLE
CREATE TABLE IF NOT EXISTS activity_logs (
    id VARCHAR(50) PRIMARY KEY,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actor_name VARCHAR(150) NOT NULL,
    actor_role VARCHAR(50) NOT NULL,
    category VARCHAR(50) NOT NULL,
    action_title VARCHAR(200) NOT NULL,
    details TEXT NOT NULL,
    camp_no VARCHAR(50)
);