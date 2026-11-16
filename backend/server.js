require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();

// Security: Restrict CORS to specific frontend origin
app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// ==========================================
// AUTHENTICATION & LOGIN (C3 FIX)
// ==========================================
app.post('/api/auth/login', async (req, res) => {
  const { login, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1 OR staff_id = $2', [login, login]);
    if (result.rowCount === 0) return res.status(401).json({ error: 'Invalid credentials' });
    
    const user = result.rows[0];
    
    // Compare incoming password with stored bcrypt hash
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) return res.status(401).json({ error: 'Invalid credentials' });
    
    if (user.status !== 'Active') return res.status(403).json({ error: 'Account suspended' });

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, staffId: user.staff_id, name: user.name, role: user.role, campScope: user.camp_scope }, 
      process.env.JWT_SECRET, 
      { expiresIn: '12h' }
    );
    
    res.json({ token, user: { id: user.id, name: user.name, role: user.role, staffId: user.staff_id, campScope: user.camp_scope } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' }); // M3: Hiding DB schema errors from client
  }
});

// ==========================================
// SECURITY MIDDLEWARE (C4 FIX)
// ==========================================
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.status(401).json({ error: 'Unauthorized: No token provided' });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Forbidden: Invalid token' });
    req.user = user; // Attach verified identity to request
    next();
  });
};

// Protect all API routes below this line
app.use('/api', authenticateToken);

// ==========================================
// SECURE ROUTES & TRANSACTION FIXES (H3 & M5 FIX)
// ==========================================

// Create User (Hashes Password)
app.post('/api/users', async (req, res) => {
  if (req.user.role !== 'SUPER_ADMIN') return res.status(403).json({ error: 'Forbidden' });
  
  const { staffId, name, email, password, role, campScope } = req.body;
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    
    const result = await client.query(
      'INSERT INTO users (staff_id, name, email, password_hash, role, camp_scope) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, staff_id, name, role',
      [staffId, name, email, hash, role, campScope]
    );

    // Write server-side audit log using verified JWT identity
    await client.query(
      'INSERT INTO activity_logs (actor_name, actor_role, category, action_title) VALUES ($1, $2, $3, $4)', 
      [req.user.name, req.user.role, 'USER_MGMT', `Created User ${name}`]
    );

    await client.query('COMMIT');
    res.json(result.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: 'Database error' });
  } finally {
    client.release();
  }
});

// Leave Workflow with ROLLBACK Fix
app.post('/api/leave', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { employeeId, startDate, expectedEndDate } = req.body;
    
    const empCheck = await client.query('SELECT * FROM employees WHERE employee_id = $1 FOR UPDATE', [employeeId]);
    if (empCheck.rowCount === 0) {
      await client.query('ROLLBACK'); // H3 FIX: Added missing Rollback
      return res.status(404).json({ error: 'Employee not found' });
    }

    await client.query('UPDATE employees SET employee_status = $1 WHERE employee_id = $2', ['On Leave', employeeId]);
    
    // Server-side audit log
    await client.query(
      'INSERT INTO activity_logs (actor_name, actor_role, category, action_title) VALUES ($1, $2, $3, $4)', 
      [req.user.name, req.user.role, 'LEAVE_START', `Marked ${employeeId} On Leave`]
    );

    await client.query('COMMIT');
    res.json({ success: true });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
  }
});

// Fetch Occupants (No passwords leaked)
app.get('/api/occupants', async (req, res) => {
  try {
    const result = await pool.query('SELECT employee_id, employee_name, productive_type, room_grade, division, cost_center, employee_status, camp_no, room_no FROM employees');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Secure Server running on port ${PORT}`));