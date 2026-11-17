-- Brings an older production database in line with the current backend code.
-- Safe to run more than once: every statement checks before it changes anything.
-- Adds columns and one table only. It deletes no data.

BEGIN;

-- Employees are saved with the flat they are placed in.
ALTER TABLE employees ADD COLUMN IF NOT EXISTS flat_code VARCHAR(50);

-- Transfer / new cost center requests.
ALTER TABLE transfer_requests DROP CONSTRAINT IF EXISTS transfer_requests_employee_id_fkey;
ALTER TABLE transfer_requests ADD COLUMN IF NOT EXISTS from_division VARCHAR(50);
ALTER TABLE transfer_requests ADD COLUMN IF NOT EXISTS to_division VARCHAR(50);
ALTER TABLE transfer_requests ADD COLUMN IF NOT EXISTS request_type VARCHAR(30) DEFAULT 'EMPLOYEE_TRANSFER';
ALTER TABLE transfer_requests ADD COLUMN IF NOT EXISTS new_cost_center_name VARCHAR(150);

-- Employee photos (the backend also creates this on first use).
CREATE TABLE IF NOT EXISTS employee_photos (
    employee_id VARCHAR(50) PRIMARY KEY REFERENCES employees(employee_id) ON DELETE CASCADE,
    photo TEXT NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMIT;
