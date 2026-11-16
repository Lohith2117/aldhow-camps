require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();

// Security Middleware
app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));
app.use(express.json({ limit: '10mb' })); // Increased for bulk imports

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 10,
  message: { error: 'Too many login attempts. Please try again later.' }
});

// Server-side audit log helper
const logActivity = async (client, req, category, actionTitle, details, campNo = null) => {
  await client.query(
    `INSERT INTO activity_logs (actor_name, actor_role, category, action_title, details, camp_no) 
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [req.user.name, req.user.role, category, actionTitle, details, campNo]
  );
};

// ==========================================
// PUBLIC: LOGIN
// ==========================================
app.post('/api/auth/login', loginLimiter, async (req, res) => {
  try {
    const { login, password } = req.body;
    const result = await pool.query('SELECT * FROM users WHERE email = $1 OR staff_id = $2', [login, login]);
    if (result.rowCount === 0) return res.status(401).json({ error: 'Invalid credentials' });
    
    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) return res.status(401).json({ error: 'Invalid credentials' });
    if (user.status !== 'Active') return res.status(403).json({ error: 'Account suspended' });

    const token = jwt.sign(
      { 
        id: user.id, staffId: user.staff_id, name: user.name, role: user.role, campScope: user.camp_scope, 
        permissions: { 
          canEditOccupants: user.can_edit_occupants, 
          canAddCamps: user.can_add_camps, 
          canDeleteCamps: user.can_delete_camps, 
          canApproveTransfers: user.can_approve_transfers 
        } 
      }, 
      process.env.JWT_SECRET, { expiresIn: '12h' }
    );
    
    await pool.query('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1', [user.id]);
    res.json({ 
      token, 
      user: { 
        id: user.id, name: user.name, role: user.role, staffId: user.staff_id, campScope: user.camp_scope, 
        permissions: { canEditOccupants: user.can_edit_occupants, canAddCamps: user.can_add_camps, canDeleteCamps: user.can_delete_camps, canApproveTransfers: user.can_approve_transfers } 
      } 
    });
  } catch (err) {
    console.error('Login Error:', err);
    res.status(500).json({ error: 'Server error' }); 
  }
});

// ==========================================
// JWT SECURITY MIDDLEWARE
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
// 1. BOOTSTRAP
// ==========================================
app.get('/api/bootstrap', async (req, res) => {
  try {
    const [users, emps, camps, floors, flats, rooms, ccs, leaves, rtds, trs, acts, others] = await Promise.all([
      pool.query('SELECT id, staff_id, name, email, title, role, camp_scope, status, last_login, can_manage_users, can_add_camps, can_delete_camps, can_edit_occupants, can_approve_transfers FROM users'),
      pool.query('SELECT * FROM employees'),
      pool.query('SELECT * FROM camps'),
      pool.query('SELECT * FROM floors'),
      pool.query('SELECT * FROM flats'),
      pool.query('SELECT * FROM rooms'),
      pool.query('SELECT * FROM cost_centers'),
      pool.query('SELECT * FROM leave_logs'),
      pool.query('SELECT * FROM rtd_logs'),
      pool.query('SELECT * FROM transfer_requests'),
      pool.query('SELECT * FROM activity_logs ORDER BY timestamp DESC LIMIT 500'),
      pool.query('SELECT * FROM billing_other_costs')
    ]);

    const mappedCamps = camps.rows.map(c => {
      // Role-Based Camp Scoping
      if (req.user.role === 'CAMP_EDITOR' && req.user.campScope !== 'ALL' && req.user.campScope !== c.camp_no) return null;
      
      const cFloors = floors.rows.filter(f => f.camp_no === c.camp_no).map(fl => {
        const cFlats = flats.rows.filter(ft => ft.floor_id === fl.id).map(ft => {
          const cRooms = rooms.rows.filter(r => r.flat_id === ft.id).map(rm => ({
            roomNo: rm.room_no, capacity: rm.capacity, 
            occupants: emps.rows.filter(e => e.room_no === rm.room_no && (e.employee_status === 'On Job' || e.employee_status === 'On Leave')).map(e => e.employee_id)
          }));
          return { flatNo: ft.flat_no, flatCode: ft.flat_code, roomGrade: ft.room_grade, rooms: cRooms };
        });
        return { floorNo: fl.floor_no, flats: cFlats };
      });
      return { id: c.camp_no, campNo: c.camp_no, campArea: c.camp_area, campDigit: c.camp_digit, status: c.status, floors: cFloors };
    }).filter(Boolean);

    res.json({
      users: users.rows,
      occupants: emps.rows.map(e => ({ 
        employeeId: e.employee_id, employeeName: e.employee_name, productiveType: e.productive_type, roomGrade: e.grade_type, division: e.division, 
        costCenter: e.cost_center, passportNo: e.passport_no, civilId: e.civil_id, mobileNo: e.mobile_no, employeeStatus: e.employee_status, 
        campNo: e.camp_no, roomNo: e.room_no, entryDate: e.entry_date, materialsIssued: e.materials_issued 
      })),
      camps: mappedCamps, costCenters: ccs.rows, leaveLogs: leaves.rows, rtdLogs: rtds.rows, transferRequests: trs.rows, activityLogs: acts.rows, otherCosts: others.rows
    });
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

// ==========================================
// 2. EMPLOYEES: PRE-REGISTER & CHECK-IN
// ==========================================
app.post('/api/employees', async (req, res) => {
  if (req.user.role === 'AUDITOR') return res.status(403).json({ error: 'Forbidden' });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { employeeId, employeeName, nationality, title, gradeType, productiveType, division, costCenter, passportNo, civilId, mobileNo, campNo, roomNo, entryDate, materialsIssued } = req.body;

    const existCheck = await client.query('SELECT * FROM employees WHERE employee_id = $1', [employeeId]);
    if (existCheck.rowCount > 0 && existCheck.rows[0].employee_status !== 'Unassigned') {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Employee already actively exists' });
    }

    // Capacity Check
    if (campNo && roomNo && campNo !== 'UNASSIGNED') {
      const roomCheck = await client.query('SELECT capacity FROM rooms WHERE room_no = $1 FOR UPDATE', [roomNo]);
      if (roomCheck.rowCount === 0) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Room not found' }); }
      
      const currentOcc = await client.query('SELECT count(*) FROM employees WHERE room_no = $1 AND employee_status IN (\'On Job\', \'On Leave\')', [roomNo]);
      if (parseInt(currentOcc.rows[0].count) >= roomCheck.rows[0].capacity) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Room is at full capacity' });
      }
    }

    const empStatus = (campNo === 'UNASSIGNED') ? 'Unassigned' : 'On Job';
    
    await client.query(
      `INSERT INTO employees (employee_id, employee_name, nationality, title, grade_type, productive_type, division, cost_center, passport_no, civil_id, mobile_no, camp_no, room_no, entry_date, employee_status, materials_issued) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
       ON CONFLICT (employee_id) DO UPDATE SET 
       camp_no = EXCLUDED.camp_no, room_no = EXCLUDED.room_no, employee_status = EXCLUDED.employee_status, materials_issued = EXCLUDED.materials_issued`,
      [employeeId, employeeName, nationality, title, gradeType, productiveType, division, costCenter, passportNo, civilId, mobileNo, campNo, roomNo, entryDate, empStatus, JSON.stringify(materialsIssued || {})]
    );

    if (empStatus === 'On Job') {
      await logActivity(client, req, 'CHECK_IN', `Assigned ${employeeId} to Room ${roomNo}`, '', campNo);
    } else {
      await logActivity(client, req, 'OCCUPANT_REG', `Pre-Registered ${employeeId}`, '');
    }

    await client.query('COMMIT');
    res.json({ success: true });
  } catch (err) { await client.query('ROLLBACK'); res.status(500).json({ error: 'Server error' }); } 
  finally { client.release(); }
});

// ==========================================
// 3. EMPLOYEES: BULK EXCEL IMPORT
// ==========================================
app.post('/api/employees/bulk', async (req, res) => {
  if (req.user.role === 'AUDITOR') return res.status(403).json({ error: 'Forbidden' });
  const { occupants } = req.body; // Array of employee objects
  if (!Array.isArray(occupants) || occupants.length === 0) return res.status(400).json({ error: 'No data provided' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Check capacities before inserting anything
    const roomCounts = {};
    for (const occ of occupants) {
      if (occ.campNo !== 'UNASSIGNED' && occ.roomNo !== 'PENDING') {
        roomCounts[occ.roomNo] = (roomCounts[occ.roomNo] || 0) + 1;
      }
    }

    for (const [rNo, count] of Object.entries(roomCounts)) {
      const roomCheck = await client.query('SELECT capacity FROM rooms WHERE room_no = $1 FOR UPDATE', [rNo]);
      if (roomCheck.rowCount > 0) {
        const currentOcc = await client.query('SELECT count(*) FROM employees WHERE room_no = $1 AND employee_status IN (\'On Job\', \'On Leave\')', [rNo]);
        if (parseInt(currentOcc.rows[0].count) + count > roomCheck.rows[0].capacity) {
          await client.query('ROLLBACK');
          return res.status(400).json({ error: `Room ${rNo} does not have enough capacity for bulk import.` });
        }
      }
    }

    for (const occ of occupants) {
      const empStatus = (occ.campNo === 'UNASSIGNED') ? 'Unassigned' : 'On Job';
      await client.query(
        `INSERT INTO employees (employee_id, employee_name, nationality, title, grade_type, productive_type, division, cost_center, passport_no, civil_id, mobile_no, camp_no, room_no, entry_date, employee_status) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
         ON CONFLICT (employee_id) DO NOTHING`,
        [occ.employeeId, occ.employeeName, occ.nationality, occ.title, occ.roomGrade, occ.productiveType, occ.division, occ.costCenter, occ.passportNo, occ.civilId, occ.mobileNo, occ.campNo, occ.roomNo, occ.entryDate, empStatus]
      );
    }

    await logActivity(client, req, 'EXCEL_IMPORT', `Bulk Imported ${occupants.length} Employees`, '');
    await client.query('COMMIT');
    res.json({ success: true });
  } catch (err) { await client.query('ROLLBACK'); res.status(500).json({ error: 'Server error' }); } 
  finally { client.release(); }
});

// ==========================================
// 4. EMPLOYEES: LEAVE & RETURN & RTD & RELOCATE
// ==========================================
app.post('/api/employees/:id/leave', async (req, res) => {
  const { startDate, expectedEndDate, remarks } = req.body;
  if (!startDate || !expectedEndDate || new Date(expectedEndDate) < new Date(startDate)) return res.status(400).json({ error: 'Invalid dates' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const empCheck = await client.query('SELECT employee_status, employee_name, camp_no, room_no FROM employees WHERE employee_id = $1 FOR UPDATE', [req.params.id]);
    if (empCheck.rowCount === 0) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Not found' }); }
    if (empCheck.rows[0].employee_status === 'On Leave') { await client.query('ROLLBACK'); return res.status(400).json({ error: 'Already on leave' }); }

    await client.query('UPDATE employees SET employee_status = $1, leave_start_date = $2, leave_end_date = $3 WHERE employee_id = $4', ['On Leave', startDate, expectedEndDate, req.params.id]);
    await client.query(
      `INSERT INTO leave_logs (employee_id, employee_name, camp_no, room_no, leave_start_date, expected_end_date, remarks, created_by) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [req.params.id, empCheck.rows[0].employee_name, empCheck.rows[0].camp_no, empCheck.rows[0].room_no, startDate, expectedEndDate, remarks, req.user.name]
    );

    await logActivity(client, req, 'LEAVE', `Marked ${req.params.id} on leave`, remarks, empCheck.rows[0].camp_no);
    await client.query('COMMIT');
    res.json({ success: true });
  } catch (err) { await client.query('ROLLBACK'); res.status(500).json({ error: 'Server error' }); } 
  finally { client.release(); }
});

app.post('/api/employees/:id/return-job', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const empCheck = await client.query('SELECT * FROM employees WHERE employee_id = $1 FOR UPDATE', [req.params.id]);
    if (empCheck.rowCount === 0) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Not found' }); }

    await client.query('UPDATE employees SET employee_status = $1, leave_return_date = CURRENT_DATE WHERE employee_id = $2', ['On Job', req.params.id]);
    await client.query(`UPDATE leave_logs SET status = 'Returned', actual_return_date = CURRENT_DATE WHERE employee_id = $1 AND status = 'Active Leave'`, [req.params.id]);

    await logActivity(client, req, 'LEAVE_RETURN', `Returned ${req.params.id} to Job`, '', empCheck.rows[0].camp_no);
    await client.query('COMMIT');
    res.json({ success: true });
  } catch (err) { await client.query('ROLLBACK'); res.status(500).json({ error: 'Server error' }); } 
  finally { client.release(); }
});

app.post('/api/employees/:id/rtd', async (req, res) => {
  const { rtdType, rtdDate, remarks } = req.body;
  if (!['Resigned', 'Terminated', 'Dismissed'].includes(rtdType)) return res.status(400).json({ error: 'Invalid RTD Type' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const empCheck = await client.query('SELECT * FROM employees WHERE employee_id = $1 FOR UPDATE', [req.params.id]);
    if (empCheck.rowCount === 0) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Not found' }); }
    
    await client.query(`UPDATE leave_logs SET status = 'Closed (RTD)', actual_return_date = $1 WHERE employee_id = $2 AND status = 'Active Leave'`, [rtdDate, req.params.id]);
    await client.query(`UPDATE stay_history SET end_date = $1 WHERE employee_id = $2 AND end_date IS NULL`, [rtdDate, req.params.id]);
    await client.query(`UPDATE employees SET employee_status = $1, rtd_type = $2, rtd_date = $3, camp_no = NULL, room_no = NULL WHERE employee_id = $4`, [`RTD - ${rtdType}`, rtdType, rtdDate, req.params.id]);

    await logActivity(client, req, 'RTD', `Processed RTD for ${req.params.id}`, remarks, empCheck.rows[0].camp_no);
    await client.query('COMMIT');
    res.json({ success: true });
  } catch (err) { await client.query('ROLLBACK'); res.status(500).json({ error: 'Server error' }); } 
  finally { client.release(); }
});

app.post('/api/employees/:id/relocate', async (req, res) => {
  if (req.user.role === 'AUDITOR') return res.status(403).json({ error: 'Forbidden' });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { targetCampNo, targetFlatCode, targetRoomNo, targetRoomGrade, transferDate, reason } = req.body;

    const empCheck = await client.query('SELECT * FROM employees WHERE employee_id = $1 FOR UPDATE', [req.params.id]);
    if (empCheck.rowCount === 0) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Not found' }); }
    
    const roomCheck = await client.query('SELECT capacity FROM rooms WHERE room_no = $1 FOR UPDATE', [targetRoomNo]);
    if (roomCheck.rowCount === 0) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Target room not found' }); }
    
    const currentOcc = await client.query('SELECT count(*) FROM employees WHERE room_no = $1 AND employee_status IN (\'On Job\', \'On Leave\')', [targetRoomNo]);
    if (parseInt(currentOcc.rows[0].count) >= roomCheck.rows[0].capacity) { await client.query('ROLLBACK'); return res.status(400).json({ error: 'Room is full' }); }

    const emp = empCheck.rows[0];
    await client.query(`INSERT INTO stay_history (employee_id, camp_no, room_no, cost_center, start_date, end_date, reason) VALUES ($1, $2, $3, $4, $5, $6, $7)`, [req.params.id, emp.camp_no, emp.room_no, emp.cost_center, emp.entry_date, transferDate, reason]);
    await client.query(`UPDATE employees SET camp_no = $1, flat_code = $2, room_no = $3, grade_type = $4, entry_date = $5 WHERE employee_id = $6`, [targetCampNo, targetFlatCode, targetRoomNo, targetRoomGrade, transferDate, req.params.id]);

    await logActivity(client, req, 'RELOCATION', `Relocated ${req.params.id}`, `Moved to ${targetCampNo} Room ${targetRoomNo}`, targetCampNo);
    await client.query('COMMIT');
    res.json({ success: true });
  } catch (err) { await client.query('ROLLBACK'); res.status(500).json({ error: 'Server error' }); } 
  finally { client.release(); }
});

// ==========================================
// 5. TRANSFER REQUESTS
// ==========================================
app.post('/api/transfer-requests', async (req, res) => {
  const { employeeId, toCostCenter, toDivision, reason } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const empCheck = await client.query('SELECT * FROM employees WHERE employee_id = $1 FOR UPDATE', [employeeId]);
    if (empCheck.rowCount === 0) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Not found' }); }

    if (req.user.role === 'SUPER_ADMIN') {
      await client.query('UPDATE employees SET cost_center = $1, division = $2 WHERE employee_id = $3', [toCostCenter, toDivision, employeeId]);
      await logActivity(client, req, 'TRANSFER', `Direct Transfer #${employeeId}`, `Moved to ${toCostCenter}`);
    } else if (req.user.role === 'AUDITOR') {
      await client.query('ROLLBACK'); return res.status(403).json({ error: 'Auditors review only' });
    } else {
      await client.query(
        `INSERT INTO transfer_requests (employee_id, employee_name, from_cost_center, to_cost_center, reason, requested_by, requested_by_role) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [employeeId, empCheck.rows[0].employee_name, empCheck.rows[0].cost_center, toCostCenter, reason, req.user.name, req.user.role]
      );
      await logActivity(client, req, 'TRANSFER_REQUEST', `Requested transfer for ${employeeId} to ${toCostCenter}`);
    }
    await client.query('COMMIT');
    res.json({ success: true });
  } catch (err) { await client.query('ROLLBACK'); res.status(500).json({ error: 'Server error' }); } 
  finally { client.release(); }
});

app.patch('/api/transfer-requests/:id/review', async (req, res) => {
  if (req.user.role !== 'SUPER_ADMIN' && req.user.role !== 'AUDITOR') return res.status(403).json({ error: 'Forbidden' });
  const { decision } = req.body;
  if (!['APPROVED', 'REJECTED'].includes(decision)) return res.status(400).json({ error: 'Invalid decision' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const trCheck = await client.query('SELECT * FROM transfer_requests WHERE id = $1 FOR UPDATE', [req.params.id]);
    if (trCheck.rowCount === 0 || trCheck.rows[0].status !== 'PENDING') { await client.query('ROLLBACK'); return res.status(400).json({ error: 'Invalid request' }); }
    
    await client.query('UPDATE transfer_requests SET status = $1, reviewed_by = $2, review_date = CURRENT_TIMESTAMP WHERE id = $3', [decision, req.user.name, req.params.id]);
    
    if (decision === 'APPROVED') {
      await client.query('UPDATE employees SET cost_center = $1 WHERE employee_id = $2', [trCheck.rows[0].to_cost_center, trCheck.rows[0].employee_id]);
    }
    await logActivity(client, req, 'TRANSFER_APPROVAL', `${decision} request ${req.params.id}`);
    await client.query('COMMIT');
    res.json({ success: true });
  } catch (err) { await client.query('ROLLBACK'); res.status(500).json({ error: 'Server error' }); } 
  finally { client.release(); }
});

// ==========================================
// 6. BILLING OTHERS
// ==========================================
app.put('/api/billing/others', async (req, res) => {
  if (req.user.role !== 'SUPER_ADMIN') return res.status(403).json({ error: 'Forbidden' });
  const { billingPeriod, costCenter, amount, description } = req.body;
  if (amount < 0) return res.status(400).json({ error: 'Amount cannot be negative' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(`
      INSERT INTO billing_other_costs (billing_period, cost_center, other_cost_kwd, other_cost_description, updated_by) 
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (billing_period, cost_center) 
      DO UPDATE SET other_cost_kwd = EXCLUDED.other_cost_kwd, other_cost_description = EXCLUDED.other_cost_description, updated_by = EXCLUDED.updated_by
    `, [billingPeriod, costCenter, amount, description, req.user.name]);
    
    await logActivity(client, req, 'BILLING', `Updated Other Costs for ${costCenter}`);
    await client.query('COMMIT');
    res.json({ success: true });
  } catch (err) { await client.query('ROLLBACK'); res.status(500).json({ error: 'Server error' }); } 
  finally { client.release(); }
});

app.get('/api/billing/others', async (req, res) => {
  try {
    const { period } = req.query;
    const result = await pool.query('SELECT * FROM billing_other_costs WHERE billing_period = $1', [period]);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

// ==========================================
// 7. CAMP DECOMMISSION
// ==========================================
app.patch('/api/camps/:id/decommission', async (req, res) => {
  if (!req.user.permissions.canDeleteCamps) return res.status(403).json({ error: 'Forbidden' });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const occCheck = await client.query('SELECT count(*) FROM employees WHERE camp_no = $1 AND employee_status IN (\'On Job\', \'On Leave\')', [req.params.id]);
    if (parseInt(occCheck.rows[0].count) > 0) { await client.query('ROLLBACK'); return res.status(400).json({ error: 'Camp has active occupants' }); }
    
    await client.query('UPDATE camps SET status = \'Decommissioned\' WHERE camp_no = $1', [req.params.id]);
    await logActivity(client, req, 'CAMP_MGMT', `Decommissioned ${req.params.id}`);
    await client.query('COMMIT');
    res.json({ success: true });
  } catch (err) { await client.query('ROLLBACK'); res.status(500).json({ error: 'Server error' }); } 
  finally { client.release(); }
});

// ==========================================
// 8. CAMP / FLOOR / FLAT CREATION
// ==========================================
app.post('/api/camps', async (req, res) => {
  if (!req.user.permissions.canAddCamps) return res.status(403).json({ error: 'Forbidden' });
  const { campNo, campArea, campDigit, campStartDate, floors } = req.body;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('INSERT INTO camps (camp_no, camp_area, camp_digit, camp_start_date) VALUES ($1, $2, $3, $4)', [campNo, campArea, campDigit, campStartDate]);
    
    for (const fl of floors) {
      const floorRes = await client.query('INSERT INTO floors (camp_no, floor_no) VALUES ($1, $2) RETURNING id', [campNo, fl.floorNo]);
      for (const ft of fl.flats) {
        const flatRes = await client.query('INSERT INTO flats (floor_id, flat_no, flat_code, room_grade) VALUES ($1, $2, $3, $4) RETURNING id', [floorRes.rows[0].id, ft.flatNo, ft.flatCode, ft.roomGrade]);
        for (const rm of ft.rooms) {
          await client.query('INSERT INTO rooms (flat_id, room_no, capacity) VALUES ($1, $2, $3)', [flatRes.rows[0].id, rm.roomNo, rm.capacity]);
        }
      }
    }
    await logActivity(client, req, 'CAMP_MGMT', `Created Camp ${campNo}`);
    await client.query('COMMIT');
    res.json({ success: true });
  } catch (err) { await client.query('ROLLBACK'); res.status(500).json({ error: 'Server error' }); } 
  finally { client.release(); }
});

// ==========================================
// 9. USER MANAGEMENT (SUPER ADMIN ONLY)
// ==========================================
const enforceSuperAdmin = (req, res, next) => {
  if (req.user.role !== 'SUPER_ADMIN') return res.status(403).json({ error: 'Forbidden: Admins only' });
  next();
};

app.post('/api/users', enforceSuperAdmin, async (req, res) => {
  const { staffId, name, email, password, role, campScope, permissions } = req.body;
  if (!password || password.length < 8) return res.status(400).json({ error: 'Password min 8 chars' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    
    await client.query(
      `INSERT INTO users (staff_id, name, email, password_hash, role, camp_scope, can_manage_users, can_add_camps, can_delete_camps, can_edit_occupants, can_approve_transfers) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [staffId, name, email, hash, role, campScope, permissions?.canManageUsers || false, permissions?.canAddCamps || false, permissions?.canDeleteCamps || false, permissions?.canEditOccupants || true, permissions?.canApproveTransfers || false]
    );

    await logActivity(client, req, 'USER_MGMT', `Created User ${name}`);
    await client.query('COMMIT');
    res.json({ success: true });
  } catch (err) { await client.query('ROLLBACK'); res.status(500).json({ error: 'Database error' }); } 
  finally { client.release(); }
});

app.patch('/api/users/:id', enforceSuperAdmin, async (req, res) => {
  const { role, status, permissions } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(
      `UPDATE users SET role = $1, status = $2, can_manage_users = $3, can_add_camps = $4, can_delete_camps = $5, can_edit_occupants = $6, can_approve_transfers = $7 WHERE id = $8`,
      [role, status, permissions?.canManageUsers, permissions?.canAddCamps, permissions?.canDeleteCamps, permissions?.canEditOccupants, permissions?.canApproveTransfers, req.params.id]
    );
    await logActivity(client, req, 'USER_MGMT', `Updated User ID ${req.params.id}`);
    await client.query('COMMIT');
    res.json({ success: true });
  } catch (err) { await client.query('ROLLBACK'); res.status(500).json({ error: 'Database error' }); } 
  finally { client.release(); }
});

app.post('/api/users/:id/reset-password', enforceSuperAdmin, async (req, res) => {
  const { password } = req.body;
  if (!password || password.length < 8) return res.status(400).json({ error: 'Password min 8 chars' });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    await client.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hash, req.params.id]);
    await logActivity(client, req, 'USER_MGMT', `Reset password for User ID ${req.params.id}`);
    await client.query('COMMIT');
    res.json({ success: true });
  } catch (err) { await client.query('ROLLBACK'); res.status(500).json({ error: 'Database error' }); } 
  finally { client.release(); }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Secure Server running on port ${PORT}`));