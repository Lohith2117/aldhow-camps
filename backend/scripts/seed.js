require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

if (!process.env.ADMIN_PASSWORD || process.env.ADMIN_PASSWORD.length < 12) {
  console.error("CRITICAL: Refusing to seed. Missing or weak ADMIN_PASSWORD in environment.");
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function runSeed() {
  const client = await pool.connect();
  try {
    console.log("Creating database schema...");
    const schemaPath = path.join(__dirname, '..', 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    await client.query(schemaSql);

    console.log("Seeding Initial SUPER_ADMIN...");
    const hash = await bcrypt.hash(process.env.ADMIN_PASSWORD, 10);
    await client.query(`
      INSERT INTO users (staff_id, name, email, password_hash, role, can_manage_users, can_add_camps, can_delete_camps, can_approve_transfers) 
      VALUES ('SYS-001', 'System Admin', $1, $2, 'SUPER_ADMIN', true, true, true, true)
      ON CONFLICT (staff_id) DO NOTHING
    `, [process.env.ADMIN_EMAIL || 'admin@aldhow.com', hash]);

    console.log("Seed successful.");
    client.release();
    process.exit(0);
  } catch (err) {
    console.error("Seed failed:", err);
    client.release();
    process.exit(1);
  }
}

runSeed();