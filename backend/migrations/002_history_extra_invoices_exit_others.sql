-- 002: history, extra invoices, "Others" camp exit. Safe to run more than once.
BEGIN;

-- room grade of each past stay (needed to bill past stays at the right rate)
ALTER TABLE stay_history ADD COLUMN IF NOT EXISTS room_grade VARCHAR(30);

-- every cost centre an employee has left (the current one lives on employees)
CREATE TABLE IF NOT EXISTS cost_center_history (
    id SERIAL PRIMARY KEY,
    employee_id VARCHAR(50) NOT NULL REFERENCES employees(employee_id) ON DELETE CASCADE,
    cost_center VARCHAR(50) NOT NULL,
    division VARCHAR(50),
    start_date DATE,
    end_date DATE NOT NULL,
    changed_by VARCHAR(150),
    reason TEXT
);

-- separate invoices for Transport / Consumables / other charges, per cost centre and month
CREATE TABLE IF NOT EXISTS extra_invoice_lines (
    id SERIAL PRIMARY KEY,
    billing_period VARCHAR(30) NOT NULL,
    cost_center VARCHAR(50) NOT NULL,
    category VARCHAR(40) NOT NULL,
    description TEXT NOT NULL,
    quantity NUMERIC(12,3) NOT NULL DEFAULT 1,
    unit_rate_kwd NUMERIC(12,3) NOT NULL DEFAULT 0,
    created_by VARCHAR(150),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- allow the 4th exit type
ALTER TABLE rtd_logs DROP CONSTRAINT IF EXISTS rtd_logs_rtd_type_check;
ALTER TABLE rtd_logs ADD CONSTRAINT rtd_logs_rtd_type_check CHECK (rtd_type IN ('Resigned', 'Terminated', 'Dismissed', 'Others'));

-- camp incharge details (the app already writes these; older schema files did not define them)
ALTER TABLE camps ADD COLUMN IF NOT EXISTS incharge_1_name VARCHAR(150);
ALTER TABLE camps ADD COLUMN IF NOT EXISTS incharge_1_contact VARCHAR(50);
ALTER TABLE camps ADD COLUMN IF NOT EXISTS incharge_2_name VARCHAR(150);
ALTER TABLE camps ADD COLUMN IF NOT EXISTS incharge_2_contact VARCHAR(50);

COMMIT;
