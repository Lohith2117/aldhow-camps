-- 003: saved monthly bed rates (only a Super Admin can change them). Safe to run more than once.
BEGIN;

CREATE TABLE IF NOT EXISTS billing_rates (
    id INT PRIMARY KEY CHECK (id = 1),
    non_manual_kwd NUMERIC(12,3) NOT NULL DEFAULT 120,
    manual_kwd NUMERIC(12,3) NOT NULL DEFAULT 45,
    updated_by VARCHAR(150),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO billing_rates (id, non_manual_kwd, manual_kwd) VALUES (1, 120, 45) ON CONFLICT (id) DO NOTHING;

COMMIT;
