require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// ==========================================
// 1. AUTHENTICATION & LOGIN
// ==========================================
app.post('/api/auth/login', async (req, res) => {
  const { login, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1 OR staff_id = $2', [login, login]);
    if (result.rowCount === 0) return res.status(401).json({ error: 'Invalid credentials' });
    
    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) return res.status(401).json({ error: 'Invalid credentials' });
    if (user.status !== 'Active') return res.status(403).json({ error: 'Account suspended' });

    const token = jwt.sign(
      { id: user.id, staffId: user.staff_id, name: user.name, role: user.role, campScope: user.camp_scope }, 
      process.env.JWT_SECRET, 
      { expiresIn: '12h' }
    );
    
    // Update last login
    await pool.query('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1', [user.id]);
    
    res.json({ token, user: { id: user.id, name: user.name, role: user.role, staffId: user.staff_id, campScope: user.camp_scope } });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// ==========================================
// 2. SECURITY MIDDLEWARE
// ==========================================
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized: No token provided' });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Forbidden: Invalid token' });
    req.user = user; 
    next();
  });
};

app.use('/api', authenticateToken);

// ==========================================
// 3. BOOTSTRAP (LOAD ALL DATA FOR UI)
// ==========================================
app.get('/api/bootstrap', async (req, res) => {
  try {
    // Exclude password_hash for security
    const usersRes = await pool.query('SELECT id, staff_id, name, email, title, role, camp_scope, status, last_login FROM users');
    const empRes = await pool.query('SELECT * FROM employees');
    const campsRes = await pool.query('SELECT * FROM camps');
    const ccRes = await pool.query('SELECT * FROM cost_centers');
    const leaveRes = await pool.query('SELECT * FROM leave_logs');
    const rtdRes = await pool.query('SELECT * FROM rtd_logs');
    const trRes = await pool.query('SELECT * FROM transfer_requests');
    const actRes = await pool.query('SELECT * FROM activity_logs ORDER BY timestamp DESC LIMIT 100');

    res.json({
      users: usersRes.rows,
      occupants: empRes.rows,
      camps: campsRes.rows,
      costCenters: ccRes.rows,
      leaveLogs: leaveRes.rows,
      rtdLogs: rtdRes.rows,
      transferRequests: trRes.rows,
      activityLogs: actRes.rows
    });
  } catch (err) {
    console.error('Bootstrap error:', err);
    res.status(500).json({ error: 'Failed to load initial data' });
  }
});

// ==========================================
// 4. USERS MANAGEMENT
// ==========================================
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

    await client.query(
      'INSERT INTO activity_logs (actor_name, actor_role, category, action_title, details) VALUES ($1, $2, $3, $4, $5)', 
      [req.user.name, req.user.role, 'USER_MGMT', `Created User ${name}`, `Staff ID: ${staffId}`]
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

// ==========================================
// 5. EMPLOYEE & BED MANAGEMENT
// ==========================================
app.post('/api/employees', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { employeeId, employeeName, nationality, title, gradeType, productiveType, division, costCenter, passportNo, civilId, mobileNo, campNo, roomNo, entryDate, materialsIssued } = req.body;

    // Check capacity before insert
    if (campNo && roomNo) {
      const roomCheck = await client.query('SELECT capacity FROM rooms WHERE room_no = $1', [roomNo]);
      const currentOcc = await client.query('SELECT count(*) FROM employees WHERE room_no = $1 AND employee_status IN (\'On Job\', \'On Leave\')', [roomNo]);
      
      if (roomCheck.rowCount > 0 && parseInt(currentOcc.rows[0].count) >= roomCheck.rows[0].capacity) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Room is at full capacity' });
      }
    }

    await client.query(
      `INSERT INTO employees 
      (employee_id, employee_name, nationality, title, grade_type, productive_type, division, cost_center, passport_no, civil_id, mobile_no, camp_no, room_no, entry_date, materials_issued) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
      [employeeId, employeeName, nationality, title, gradeType, productiveType, division, costCenter, passportNo, civilId, mobileNo, campNo, roomNo, entryDate, JSON.stringify(materialsIssued)]
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

// ==========================================
// 6. RELOCATION (With H3 Rollback Fixes)
// ==========================================
app.post('/api/relocate', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { employeeId, targetCampNo, targetFlatCode, targetRoomNo, targetRoomGrade, transferDate, docRef, reason } = req.body;

    const empCheck = await client.query('SELECT * FROM employees WHERE employee_id = $1 FOR UPDATE', [employeeId]);
    if (empCheck.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Employee not found' });
    }
    const emp = empCheck.rows[0];

    // Log old stay history
    await client.query(
      `INSERT INTO stay_history (employee_id, camp_no, camp_area, flat_code, room_no, room_grade, cost_center, start_date, end_date, reason) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [employeeId, emp.camp_no, emp.camp_area, emp.flat_code, emp.room_no, emp.room_grade, emp.cost_center, emp.entry_date, transferDate, reason]
    );

    // Update Employee
    await client.query(
      `UPDATE employees SET camp_no = $1, flat_code = $2, room_no = $3, room_grade = $4, entry_date = $5, afr_entry_ref = $6 WHERE employee_id = $7`,
      [targetCampNo, targetFlatCode, targetRoomNo, targetRoomGrade, transferDate, docRef, employeeId]
    );

    await client.query(
      'INSERT INTO activity_logs (actor_name, actor_role, category, action_title, details, camp_no) VALUES ($1, $2, $3, $4, $5, $6)', 
      [req.user.name, req.user.role, 'RELOCATION', `Relocated ${employeeId}`, `Moved to ${targetCampNo} Room ${targetRoomNo}`, targetCampNo]
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

// ==========================================
// 7. LEAVE & RTD
// ==========================================
app.post('/api/leave', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { employeeId, startDate, expectedEndDate, remarks } = req.body;
    
    const empCheck = await client.query('SELECT * FROM employees WHERE employee_id = $1 FOR UPDATE', [employeeId]);
    if (empCheck.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Employee not found' });
    }

    await client.query('UPDATE employees SET employee_status = $1, leave_start_date = $2, leave_end_date = $3 WHERE employee_id = $4', 
      ['On Leave', startDate, expectedEndDate, employeeId]
    );
    
    await client.query(
      `INSERT INTO leave_logs (id, employee_id, employee_name, camp_no, room_no, leave_start_date, expected_end_date, remarks, created_by) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [`lv-${Date.now()}`, employeeId, empCheck.rows[0].employee_name, empCheck.rows[0].camp_no, empCheck.rows[0].room_no, startDate, expectedEndDate, remarks, req.user.name]
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

app.post('/api/rtd', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { employeeId, rtdType, rtdDate, afrExitRef, remarks } = req.body;
    
    const empCheck = await client.query('SELECT * FROM employees WHERE employee_id = $1 FOR UPDATE', [employeeId]);
    if (empCheck.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Employee not found' });
    }

    const emp = empCheck.rows[0];
    const rtdStatus = `RTD - ${rtdType}`;

    // H4 FIX: Close active leave logs if they exist
    await client.query(
      `UPDATE leave_logs SET status = 'Closed (RTD)', actual_return_date = $1, remarks = CONCAT(remarks, ' • Closed due to RTD') WHERE employee_id = $2 AND status = 'Active Leave'`,
      [rtdDate, employeeId]
    );

    await client.query(
      `UPDATE employees SET employee_status = $1, rtd_type = $2, rtd_date = $3, afr_exit_ref = $4, remarks = $5 WHERE employee_id = $6`,
      [rtdStatus, rtdType, rtdDate, afrExitRef, remarks, employeeId]
    );

    await client.query(
      `INSERT INTO rtd_logs (id, employee_id, employee_name, rtd_type, rtd_date, vacated_camp_no, vacated_room_no, cost_center, afr_exit_ref, remarks, recorded_by) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [`rtd-${Date.now()}`, employeeId, emp.employee_name, rtdType, rtdDate, emp.camp_no, emp.room_no, emp.cost_center, afrExitRef, remarks, req.user.name]
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

// ==========================================
// 8. APPROVALS & LOGS (MISCONDUCT & MAINT)
// ==========================================
app.post('/api/transfer-requests', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { employeeId, fromCostCenter, fromDivision, toCostCenter, toDivision, reason } = req.body;
    
    // Check if Super Admin -> Auto Approve
    if (req.user.role === 'SUPER_ADMIN') {
      await client.query('UPDATE employees SET cost_center = $1, division = $2 WHERE employee_id = $3', [toCostCenter, toDivision, employeeId]);
      await client.query('INSERT INTO activity_logs (actor_name, actor_role, category, action_title, details) VALUES ($1, $2, $3, $4, $5)', [req.user.name, req.user.role, 'COST_CENTER_TRANSFER', `Direct Transfer #${employeeId}`, `Moved to ${toCostCenter}`]);
    } else {
      // Pending request for standard user
      await client.query(
        `INSERT INTO transfer_requests (id, employee_id, employee_name, from_cost_center, from_division, to_cost_center, to_division, reason, requested_by, requested_by_role, status) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'PENDING')`,
        [`tr-${Date.now()}`, employeeId, 'Employee Name', fromCostCenter, fromDivision, toCostCenter, toDivision, reason, req.user.name, req.user.role]
      );
    }
    await client.query('COMMIT');
    res.json({ success: true });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Secure Server running on port ${PORT}`));