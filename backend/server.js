require('dotenv').config();
require('pg').types.setTypeParser(1082, v => v);
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
app.set('trust proxy', 1);

app.use(helmet());
app.set('etag', false);
app.use('/api', (req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });
if (process.env.NODE_ENV === 'production' && !process.env.FRONTEND_URL) {
  console.error('CRITICAL: FRONTEND_URL is missing in production environment variables.');
}
app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));
app.use(express.json({ limit: '10mb' })); 

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 5,
  connectionTimeoutMillis: 15000,
  idleTimeoutMillis: 10000
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 10,
  message: { error: 'Too many login attempts. Please try again later.' }
});

// Remember the cost centre an employee is leaving, so the history of changes is kept.
const recordCostCenterChange = async (client, req, emp, toCostCenter, reason) => {
  if (!emp || emp.cost_center === toCostCenter) return;
  await client.query(
    `INSERT INTO cost_center_history (employee_id, cost_center, division, start_date, end_date, changed_by, reason)
     VALUES ($1::varchar, $2, $3, COALESCE((SELECT MAX(end_date) FROM cost_center_history WHERE employee_id = $1::varchar), $4::date), CURRENT_DATE, $5, $6)`,
    [emp.employee_id, emp.cost_center, emp.division, emp.entry_date, req.user?.name || null, reason || null]
  );
};

const logActivity = async (client, req, category, actionTitle, details = '', campNo = null) => {
  await client.query(
    `INSERT INTO activity_logs (actor_name, actor_role, category, action_title, details, camp_no) 
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [req.user.name, req.user.role, category, actionTitle, details, campNo]
  );
};

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
          canEditOccupants: user.can_edit_occupants, canAddCamps: user.can_add_camps, 
          canDeleteCamps: user.can_delete_camps, canApproveTransfers: user.can_approve_transfers 
        } 
      }, process.env.JWT_SECRET, { expiresIn: '12h' }
    );
    
    await pool.query('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1', [user.id]);
    res.json({ 
      token, 
      user: { 
        id: user.id, name: user.name, role: user.role, staffId: user.staff_id, campScope: user.camp_scope, 
        permissions: { canEditOccupants: user.can_edit_occupants, canAddCamps: user.can_add_camps, canDeleteCamps: user.can_delete_camps, canApproveTransfers: user.can_approve_transfers } 
      } 
    });
  } catch (err) { console.error('LOGIN ERROR:', err.message); res.status(500).json({ error: 'Server error' }); }
});

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized: No token provided' });
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Forbidden: Invalid token' });
    req.user = user; next();
  });
};
app.use('/api', authenticateToken);

const requireEditor = (req, res, next) => {
  if (req.user.role === 'AUDITOR' || req.user.permissions?.canEditOccupants === false) return res.status(403).json({ error: 'Forbidden' });
  next();
};

const assertCampAccess = (req, campNo) => {
  if (req.user.role !== 'CAMP_EDITOR') return true;
  if (req.user.campScope === 'ALL') return true;
  if (!campNo || campNo === 'UNASSIGNED') return true;
  return req.user.campScope === campNo;
};

app.get('/api/bootstrap', async (req, res) => {
  try {
    const [users, emps, camps, floors, flats, rooms, ccs, leaves, rtds, trs, acts, others, maint, misc, stays, ccHist, extraLines] = await Promise.all([
      pool.query('SELECT * FROM users'), pool.query('SELECT * FROM employees'), pool.query('SELECT * FROM camps'),
      pool.query('SELECT * FROM floors'), pool.query('SELECT * FROM flats'), pool.query('SELECT * FROM rooms'),
      pool.query('SELECT * FROM cost_centers'), pool.query('SELECT * FROM leave_logs'), pool.query('SELECT * FROM rtd_logs'),
      pool.query('SELECT * FROM transfer_requests'), pool.query('SELECT * FROM activity_logs ORDER BY timestamp DESC LIMIT 500'),
      pool.query('SELECT * FROM billing_other_costs'), pool.query('SELECT * FROM maintenance_logs'), pool.query('SELECT * FROM misconduct_logs'),
      pool.query('SELECT * FROM stay_history ORDER BY start_date, id'), pool.query('SELECT * FROM cost_center_history ORDER BY end_date, id'), pool.query('SELECT * FROM extra_invoice_lines ORDER BY id')
    ]);

    const isEditor = req.user.role === 'CAMP_EDITOR';
    const scope = req.user.campScope;
    const filterScope = (row) => (!isEditor || scope === 'ALL' || !row.camp_no || row.camp_no === 'UNASSIGNED' || row.camp_no === scope);

    const mappedCamps = camps.rows.filter(filterScope).map(c => {
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
      return { 
        id: c.camp_no, campNo: c.camp_no, campArea: c.camp_area, campDigit: c.camp_digit, status: c.status,
        incharge1Name: c.incharge_1_name, incharge1Contact: c.incharge_1_contact, incharge2Name: c.incharge_2_name, incharge2Contact: c.incharge_2_contact, floors: cFloors 
      };
    });

    res.json({
      users: users.rows.map(u => ({
        id: u.id, staffId: u.staff_id, name: u.name, email: u.email, title: u.title, role: u.role, campScope: u.camp_scope, status: u.status, lastLogin: u.last_login,
        permissions: { canManageUsers: u.can_manage_users, canAddCamps: u.can_add_camps, canDeleteCamps: u.can_delete_camps, canEditOccupants: u.can_edit_occupants, canApproveTransfers: u.can_approve_transfers }
      })),
      occupants: emps.rows.filter(filterScope).map(e => ({ 
        stayHistory: stays.rows.filter(h => h.employee_id === e.employee_id).map(h => ({ campNo: h.camp_no, roomNo: h.room_no, costCenter: h.cost_center, roomGrade: h.room_grade || e.grade_type, startDate: h.start_date, endDate: h.end_date, reason: h.reason })),
        costCenterHistory: ccHist.rows.filter(h => h.employee_id === e.employee_id).map(h => ({ costCenter: h.cost_center, division: h.division, startDate: h.start_date, endDate: h.end_date, changedBy: h.changed_by, reason: h.reason })),
        employeeId: e.employee_id, employeeName: e.employee_name, nationality: e.nationality, title: e.title, productiveType: e.productive_type, roomGrade: e.grade_type, division: e.division, 
        costCenter: e.cost_center, passportNo: e.passport_no, civilId: e.civil_id, mobileNo: e.mobile_no, employeeStatus: e.employee_status, 
        campNo: e.camp_no, roomNo: e.room_no, flatCode: e.flat_code, entryDate: e.entry_date, materialsIssued: e.materials_issued, afrEntryRef: e.afr_entry_ref, afrLogNo: e.afr_log_no, afrExitRef: e.afr_exit_ref, homeCountryAddress: e.home_country_address, residencyCompany: e.residency_company, srNo: e.sr_no, emergencyContactName: e.emergency_contact_name, emergencyContactPhone: e.emergency_contact_phone,
        leaveStartDate: e.leave_start_date, leaveEndDate: e.leave_end_date, leaveReturnDate: e.leave_return_date, rtdType: e.rtd_type, rtdDate: e.rtd_date, remarks: e.remarks
      })),
      camps: mappedCamps, costCenters: ccs.rows,
      leaveLogs: leaves.rows.filter(filterScope).map(l => ({ id: l.id, employeeId: l.employee_id, employeeName: l.employee_name, campNo: l.camp_no, roomNo: l.room_no, leaveStartDate: l.leave_start_date, expectedEndDate: l.expected_end_date, actualReturnDate: l.actual_return_date, status: l.status, remarks: l.remarks, createdBy: l.created_by })),
      rtdLogs: rtds.rows.filter(filterScope).map(r => ({ id: r.id, employeeId: r.employee_id, employeeName: r.employee_name, rtdType: r.rtd_type, rtdDate: r.rtd_date, vacatedCampNo: r.vacated_camp_no, vacatedRoomNo: r.vacated_room_no, costCenter: r.cost_center, remarks: r.remarks, recordedBy: r.recorded_by })),
      transferRequests: trs.rows.map(t => ({ id: t.id, employeeId: t.employee_id, employeeName: t.employee_name, fromCostCenter: t.from_cost_center, fromDivision: t.from_division, toCostCenter: t.to_cost_center, toDivision: t.to_division, reason: t.reason, status: t.status, requestedBy: t.requested_by, requestedByRole: t.requested_by_role, reviewedBy: t.reviewed_by, reviewDate: t.review_date })),
      activityLogs: acts.rows.map(a => ({ id: a.id, actorName: a.actor_name, actorRole: a.actor_role, category: a.category, actionTitle: a.action_title, details: a.details, campNo: a.camp_no, timestamp: a.timestamp })),
      extraInvoiceLines: extraLines.rows.map(x => ({ id: x.id, billingPeriod: x.billing_period, costCenter: x.cost_center, category: x.category, description: x.description, quantity: Number(x.quantity), unitRateKwd: Number(x.unit_rate_kwd), createdBy: x.created_by })),
      otherCosts: others.rows.map(o => ({ id: o.id, billingPeriod: o.billing_period, costCenter: o.cost_center, otherCostKwd: o.other_cost_kwd, otherCostDescription: o.other_cost_description, updatedBy: o.updated_by })),
      maintenanceLogs: maint.rows.filter(filterScope).map(m => ({ id: m.id, date: m.date, issueDetails: m.issue_details, reportedByEmpId: m.reported_by_emp_id, roomNo: m.room_no, status: m.status })),
      misconductLogs: misc.rows.map(m => ({ id: m.id, employeeId: m.employee_id, incidentDate: m.incident_date, typeOfViolation: m.type_of_violation, remarks: m.remarks }))
    });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

app.post('/api/camps', async (req, res) => {
  if (!req.user.permissions?.canAddCamps) return res.status(403).json({ error: 'Forbidden' });
  const { campNo, campArea, campDigit, campStartDate, incharge1Name, incharge1Contact, incharge2Name, incharge2Contact, floors } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('INSERT INTO camps (camp_no, camp_area, camp_digit, camp_start_date, incharge_1_name, incharge_1_contact, incharge_2_name, incharge_2_contact) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)', [campNo, campArea, campDigit, campStartDate, incharge1Name, incharge1Contact, incharge2Name, incharge2Contact]);
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
  } catch (err) { console.error(req.method, req.originalUrl, 'ERROR:', err.message); await client.query('ROLLBACK'); if (err.code === '23505') return res.status(409).json({ error: 'Duplicate camp, flat, or room code' }); res.status(500).json({ error: 'Server error' }); } finally { client.release(); }
});

app.put('/api/camps/:campNo', async (req, res) => {
  if (!req.user.permissions?.canAddCamps) return res.status(403).json({ error: 'Forbidden' });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    if (!assertCampAccess(req, req.params.campNo)) { await client.query('ROLLBACK'); return res.status(403).json({ error: 'Forbidden' }); }
    const { campArea, incharge1Name, incharge1Contact, incharge2Name, incharge2Contact, floors } = req.body;
    
    await client.query('UPDATE camps SET camp_area = $1, incharge_1_name = $2, incharge_1_contact = $3, incharge_2_name = $4, incharge_2_contact = $5 WHERE camp_no = $6', [campArea, incharge1Name, incharge1Contact, incharge2Name, incharge2Contact, req.params.campNo]);
    await client.query('DELETE FROM floors WHERE camp_no = $1', [req.params.campNo]);
    for (const fl of floors) {
      const floorRes = await client.query('INSERT INTO floors (camp_no, floor_no) VALUES ($1, $2) RETURNING id', [req.params.campNo, fl.floorNo]);
      for (const ft of fl.flats) {
        const flatRes = await client.query('INSERT INTO flats (floor_id, flat_no, flat_code, room_grade) VALUES ($1, $2, $3, $4) RETURNING id', [floorRes.rows[0].id, ft.flatNo, ft.flatCode, ft.roomGrade]);
        for (const rm of ft.rooms) {
          await client.query('INSERT INTO rooms (flat_id, room_no, capacity) VALUES ($1, $2, $3)', [flatRes.rows[0].id, rm.roomNo, rm.capacity]); // Fixed flatRes bug
        }
      }
    }
    await logActivity(client, req, 'CAMP_CONFIG', `Updated Camp ${req.params.campNo}`);
    await client.query('COMMIT');
    res.json({ success: true });
  } catch (err) { console.error(req.method, req.originalUrl, 'ERROR:', err.message); await client.query('ROLLBACK'); res.status(500).json({ error: 'Server error' }); } finally { client.release(); }
});

app.post('/api/cost-centers', async (req, res) => {
  const { code, name, division, status } = req.body;
  if (!code || !division) return res.status(400).json({ error: 'Cost center code and division are required' });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const cleanCode = code.trim().toUpperCase(); const cleanName = (name || code).trim(); const cleanDivision = division.trim(); const ccStatus = status || 'Active';
    if (req.user && req.user.role === 'SUPER_ADMIN') {
      await client.query(`INSERT INTO cost_centers (code, name, division, status) VALUES ($1, $2, $3, $4) ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, division = EXCLUDED.division, status = EXCLUDED.status`, [cleanCode, cleanName, cleanDivision, ccStatus]);
      try { await logActivity(client, req, 'COST_CENTER', `Created/Updated Cost Center ${cleanCode}`); } catch (e) {}
    } else {
      await client.query(`INSERT INTO transfer_requests (employee_id, employee_name, from_cost_center, from_division, to_cost_center, to_division, reason, requested_by, requested_by_role, request_type, new_cost_center_name) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`, ['SYS-CC', `New Cost Center: ${cleanCode} (${cleanName})`, 'N/A', 'N/A', cleanCode, cleanDivision, `New Cost Center Creation Request`, req.user?.name || 'Admin', req.user?.role || 'SUPER_ADMIN', 'NEW_COST_CENTER', cleanName]);
    }
    await client.query('COMMIT');
    res.json({ success: true });
  } catch(err) { console.error(req.method, req.originalUrl, 'ERROR:', err.message); await client.query('ROLLBACK'); res.status(500).json({ error: 'Server error' }); } finally { client.release(); }
});

app.patch('/api/cost-centers/:code/toggle', async (req, res) => {
  if (req.user.role !== 'SUPER_ADMIN') return res.status(403).json({ error: 'Forbidden' });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const cc = await client.query('SELECT status FROM cost_centers WHERE code = $1', [req.params.code]);
    if (cc.rowCount === 0) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Not found' }); }
    const nextStatus = cc.rows[0].status === 'Active' ? 'Inactive' : 'Active';
    await client.query('UPDATE cost_centers SET status = $1 WHERE code = $2', [nextStatus, req.params.code]);
    await logActivity(client, req, 'COST_CENTER', `Changed Status of ${req.params.code} to ${nextStatus}`);
    await client.query('COMMIT');
    res.json({ success: true });
  } catch(err) { console.error(req.method, req.originalUrl, 'ERROR:', err.message); await client.query('ROLLBACK'); res.status(500).json({ error: 'Server error' }); } finally { client.release(); }
});

app.post('/api/employees', requireEditor, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { employeeId, employeeName, nationality, title, roomGrade, productiveType, division, costCenter, passportNo, civilId, mobileNo, emergencyContactName, emergencyContactPhone, campNo, roomNo, flatCode, afrEntryRef, entryDate, materialsIssued } = req.body;
    const existCheck = await client.query('SELECT * FROM employees WHERE employee_id = $1 FOR UPDATE', [employeeId]);
    if (existCheck.rowCount > 0 && existCheck.rows[0].employee_status !== 'Unassigned') { await client.query('ROLLBACK'); return res.status(400).json({ error: 'Employee already actively exists' }); }
    if (campNo && campNo !== 'UNASSIGNED') {
      if (!roomNo) { await client.query('ROLLBACK'); return res.status(400).json({ error: 'Room number required' }); }
      if (!assertCampAccess(req, campNo)) { await client.query('ROLLBACK'); return res.status(403).json({ error: 'Forbidden camp access' }); }
      const roomVerify = await client.query(`SELECT r.capacity FROM rooms r JOIN flats ft ON r.flat_id = ft.id JOIN floors fl ON ft.floor_id = fl.id WHERE r.room_no = $1 AND fl.camp_no = $2 FOR UPDATE`, [roomNo, campNo]);
      if (roomVerify.rowCount === 0) { await client.query('ROLLBACK'); return res.status(400).json({ error: 'Room does not belong to camp' }); }
      const currentOcc = await client.query('SELECT count(*) FROM employees WHERE room_no = $1 AND employee_status IN (\'On Job\', \'On Leave\')', [roomNo]);
      if (parseInt(currentOcc.rows[0].count) >= roomVerify.rows[0].capacity) { await client.query('ROLLBACK'); return res.status(400).json({ error: 'Room is full' }); }
    }
    const empStatus = (campNo && campNo !== 'UNASSIGNED') ? 'On Job' : 'Unassigned';
    await client.query(
      `INSERT INTO employees (employee_id, employee_name, nationality, title, grade_type, productive_type, division, cost_center, passport_no, civil_id, mobile_no, emergency_contact_name, emergency_contact_phone, camp_no, room_no, flat_code, afr_entry_ref, entry_date, employee_status, materials_issued) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
       ON CONFLICT (employee_id) DO UPDATE SET camp_no = EXCLUDED.camp_no, room_no = EXCLUDED.room_no, flat_code = EXCLUDED.flat_code, afr_entry_ref = EXCLUDED.afr_entry_ref, entry_date = EXCLUDED.entry_date, employee_status = EXCLUDED.employee_status, materials_issued = EXCLUDED.materials_issued`,
      [employeeId, employeeName, nationality, title, roomGrade, productiveType, division, costCenter, passportNo, civilId, mobileNo, emergencyContactName, emergencyContactPhone, campNo, roomNo, flatCode, afrEntryRef, entryDate, empStatus, JSON.stringify(materialsIssued || {})]
    );
    if (empStatus === 'On Job') await logActivity(client, req, 'CHECK_IN', `Assigned ${employeeId} to Room ${roomNo}`, '', campNo);
    else await logActivity(client, req, 'OCCUPANT_REG', `Pre-Registered ${employeeId}`);
    await client.query('COMMIT');
    res.json({ success: true });
  } catch (err) { console.error(req.method, req.originalUrl, 'ERROR:', err.message); await client.query('ROLLBACK'); res.status(500).json({ error: 'Server error' }); } finally { client.release(); }
});

app.put('/api/employees/:id', requireEditor, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { employeeName, nationality, title, roomGrade, productiveType, division, costCenter, passportNo, civilId, mobileNo, emergencyContactName, emergencyContactPhone } = req.body;
    await client.query(`UPDATE employees SET employee_name = $1, nationality = $2, title = $3, grade_type = $4, productive_type = $5, division = $6, cost_center = $7, passport_no = $8, civil_id = $9, mobile_no = $10, emergency_contact_name = $11, emergency_contact_phone = $12 WHERE employee_id = $13`, [employeeName, nationality, title, roomGrade, productiveType, division, costCenter, passportNo, civilId, mobileNo, emergencyContactName, emergencyContactPhone, req.params.id]);
    await logActivity(client, req, 'OCCUPANT_EDIT', `Edited Details for #${req.params.id}`);
    await client.query('COMMIT');
    res.json({ success: true });
  } catch(err) { console.error(req.method, req.originalUrl, 'ERROR:', err.message); await client.query('ROLLBACK'); res.status(500).json({ error: 'Server error' }); } finally { client.release(); }
});

app.post('/api/employees/bulk', requireEditor, async (req, res) => {
  const { occupants } = req.body;
  if (!Array.isArray(occupants) || occupants.length === 0) return res.status(400).json({ error: 'No data' });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const empIds = occupants.map(o => o.employeeId);
    const existing = await client.query('SELECT employee_id FROM employees WHERE employee_id = ANY($1)', [empIds]);
    const existingIds = new Set(existing.rows.map(r => r.employee_id));
    const newOccupants = occupants.filter(o => !existingIds.has(o.employeeId));
    const roomCounts = {};

    for (const occ of newOccupants) {
      if (occ.campNo && occ.campNo !== 'UNASSIGNED' && occ.roomNo && occ.roomNo !== 'PENDING') {
        if (!assertCampAccess(req, occ.campNo)) { await client.query('ROLLBACK'); return res.status(403).json({ error: `Forbidden access to camp ${occ.campNo}` }); }
        const roomVerify = await client.query(`SELECT r.capacity FROM rooms r JOIN flats ft ON r.flat_id = ft.id JOIN floors fl ON ft.floor_id = fl.id WHERE r.room_no = $1 AND fl.camp_no = $2`, [occ.roomNo, occ.campNo]);
        if (roomVerify.rowCount === 0) { await client.query('ROLLBACK'); return res.status(400).json({ error: `Room ${occ.roomNo} does not exist in Camp ${occ.campNo} for row ${occ.employeeId}` }); }
        roomCounts[occ.roomNo] = (roomCounts[occ.roomNo] || 0) + 1;
      }
    }

    for (const [rNo, count] of Object.entries(roomCounts)) {
      const roomCheck = await client.query('SELECT capacity FROM rooms WHERE room_no = $1 FOR UPDATE', [rNo]);
      if (roomCheck.rowCount > 0) {
        const currentOcc = await client.query('SELECT count(*) FROM employees WHERE room_no = $1 AND employee_status IN (\'On Job\', \'On Leave\')', [rNo]);
        if (parseInt(currentOcc.rows[0].count) + count > roomCheck.rows[0].capacity) { await client.query('ROLLBACK'); return res.status(400).json({ error: `Room ${rNo} full.` }); }
      }
    }

    for (const occ of newOccupants) {
      const empStatus = (occ.campNo === 'UNASSIGNED' || !occ.campNo) ? 'Unassigned' : 'On Job';
      await client.query(
        `INSERT INTO employees (employee_id, employee_name, nationality, title, grade_type, productive_type, division, cost_center, passport_no, civil_id, mobile_no, emergency_contact_name, emergency_contact_phone, camp_no, room_no, flat_code, afr_entry_ref, entry_date, employee_status) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
         ON CONFLICT (employee_id) DO NOTHING`,
        [occ.employeeId, occ.employeeName, occ.nationality, occ.title, occ.roomGrade, occ.productiveType, occ.division, occ.costCenter, occ.passportNo, occ.civilId, occ.mobileNo, occ.emergencyContactName, occ.emergencyContactPhone, occ.campNo, occ.roomNo, occ.flatCode, occ.afrEntryRef, occ.entryDate, empStatus]
      );
    }
    await logActivity(client, req, 'EXCEL_IMPORT', `Bulk Imported ${newOccupants.length} Employees`);
    await client.query('COMMIT');
    res.json({ success: true, inserted: newOccupants.length, skipped: existingIds.size });
  } catch (err) { console.error(req.method, req.originalUrl, 'ERROR:', err.message); await client.query('ROLLBACK'); res.status(500).json({ error: 'Server error' }); } finally { client.release(); }
});

app.post('/api/employees/:id/leave', requireEditor, async (req, res) => {
  const { startDate, expectedEndDate, remarks } = req.body;
  if (!startDate || !expectedEndDate || new Date(expectedEndDate) < new Date(startDate)) return res.status(400).json({ error: 'Invalid dates' });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const empCheck = await client.query('SELECT employee_status, employee_name, camp_no, room_no FROM employees WHERE employee_id = $1 FOR UPDATE', [req.params.id]);
    if (empCheck.rowCount === 0) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Not found' }); }
    if (empCheck.rows[0].employee_status === 'On Leave') { await client.query('ROLLBACK'); return res.status(400).json({ error: 'Already on leave' }); }
    await client.query('UPDATE employees SET employee_status = $1, leave_start_date = $2, leave_end_date = $3 WHERE employee_id = $4', ['On Leave', startDate, expectedEndDate, req.params.id]);
    await client.query(`INSERT INTO leave_logs (employee_id, employee_name, camp_no, room_no, leave_start_date, expected_end_date, remarks, created_by) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`, [req.params.id, empCheck.rows[0].employee_name, empCheck.rows[0].camp_no, empCheck.rows[0].room_no, startDate, expectedEndDate, remarks, req.user.name]);
    await logActivity(client, req, 'LEAVE', `Marked ${req.params.id} on leave`, remarks, empCheck.rows[0].camp_no);
    await client.query('COMMIT');
    res.json({ success: true });
  } catch (err) { console.error(req.method, req.originalUrl, 'ERROR:', err.message); await client.query('ROLLBACK'); res.status(500).json({ error: 'Server error' }); } finally { client.release(); }
});

app.post('/api/employees/:id/return-job', requireEditor, async (req, res) => {
  const { actualReturnDate } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const empCheck = await client.query('SELECT employee_status, leave_start_date, camp_no FROM employees WHERE employee_id = $1 FOR UPDATE', [req.params.id]);
    if (empCheck.rowCount === 0) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Not found' }); }
    if (empCheck.rows[0].employee_status !== 'On Leave') { await client.query('ROLLBACK'); return res.status(400).json({ error: 'Employee is not on leave' }); }
    if (!assertCampAccess(req, empCheck.rows[0].camp_no)) { await client.query('ROLLBACK'); return res.status(403).json({ error: 'Forbidden' }); }
    if (new Date(actualReturnDate) < new Date(empCheck.rows[0].leave_start_date)) { await client.query('ROLLBACK'); return res.status(400).json({ error: 'Invalid dates' }); }
    
    await client.query('UPDATE employees SET employee_status = $1, leave_return_date = $2 WHERE employee_id = $3', ['On Job', actualReturnDate, req.params.id]);
    await client.query(`UPDATE leave_logs SET status = 'Returned', actual_return_date = $1 WHERE employee_id = $2 AND status = 'Active Leave'`, [actualReturnDate, req.params.id]);
    await logActivity(client, req, 'LEAVE_RETURN', `Returned ${req.params.id} to Job`, '', empCheck.rows[0].camp_no);
    await client.query('COMMIT');
    res.json({ success: true });
  } catch (err) { console.error(req.method, req.originalUrl, 'ERROR:', err.message); await client.query('ROLLBACK'); res.status(500).json({ error: 'Server error' }); } finally { client.release(); }
});

app.post('/api/employees/:id/rtd', requireEditor, async (req, res) => {
  const { rtdType, rtdDate, remarks, reason } = req.body; 
  if (!['Resigned', 'Terminated', 'Dismissed', 'Others'].includes(rtdType)) return res.status(400).json({ error: 'Invalid RTD Type' });
  if (!rtdDate) return res.status(400).json({ error: 'Exit date required' });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const empCheck = await client.query('SELECT * FROM employees WHERE employee_id = $1 FOR UPDATE', [req.params.id]);
    if (empCheck.rowCount === 0) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Not found' }); }
    await client.query(`UPDATE leave_logs SET status = 'Closed (RTD)', actual_return_date = $1 WHERE employee_id = $2 AND status = 'Active Leave'`, [rtdDate, req.params.id]);
    await client.query(`UPDATE stay_history SET end_date = $1 WHERE employee_id = $2 AND end_date IS NULL`, [rtdDate, req.params.id]);
    // close the stay he is leaving so it stays in his history and is still billed up to the exit date
    const leaving = empCheck.rows[0];
    if (leaving.camp_no && leaving.camp_no !== 'UNASSIGNED' && leaving.room_no) {
      await client.query(`INSERT INTO stay_history (employee_id, camp_no, room_no, cost_center, start_date, end_date, reason, room_grade) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`, [req.params.id, leaving.camp_no, leaving.room_no, leaving.cost_center, leaving.entry_date || rtdDate, rtdDate, rtdType === 'Others' ? 'Left camp (Others)' : `RTD - ${rtdType}`, leaving.grade_type]);
    }
    await client.query(`UPDATE employees SET employee_status = $1, rtd_type = $2, rtd_date = $3, camp_no = NULL, room_no = NULL WHERE employee_id = $4`, [`RTD - ${rtdType}`, rtdType, rtdDate, req.params.id]);
    await client.query(`INSERT INTO rtd_logs (employee_id, employee_name, rtd_type, rtd_date, vacated_camp_no, vacated_room_no, cost_center, remarks, recorded_by) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`, [req.params.id, empCheck.rows[0].employee_name, rtdType, rtdDate, empCheck.rows[0].camp_no, empCheck.rows[0].room_no, empCheck.rows[0].cost_center, reason || remarks, req.user.name]);
    await logActivity(client, req, 'RTD', `Processed RTD for ${req.params.id}`, reason || remarks, empCheck.rows[0].camp_no);
    await client.query('COMMIT');
    res.json({ success: true });
  } catch (err) { console.error(req.method, req.originalUrl, 'ERROR:', err.message); await client.query('ROLLBACK'); res.status(500).json({ error: 'Server error' }); } finally { client.release(); }
});

app.post('/api/employees/:id/relocate', requireEditor, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { targetCampId, targetFlatCode, targetRoomNo, targetRoomGrade, transferDate, reason, docRef } = req.body;
    
    const empCheck = await client.query('SELECT * FROM employees WHERE employee_id = $1 FOR UPDATE', [req.params.id]);
    if (empCheck.rowCount === 0) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Not found' }); }
    const emp = empCheck.rows[0];

    const campCheck = await client.query('SELECT camp_no FROM camps WHERE camp_no = $1', [targetCampId]);
    if (campCheck.rowCount === 0) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Target camp not found' }); }
    const targetCampNo = campCheck.rows[0].camp_no;

    if (!assertCampAccess(req, emp.camp_no) || !assertCampAccess(req, targetCampNo)) {
      await client.query('ROLLBACK'); return res.status(403).json({ error: 'Forbidden' });
    }
    
    const roomCheck = await client.query(`SELECT r.capacity, ft.room_grade FROM rooms r JOIN flats ft ON r.flat_id = ft.id JOIN floors fl ON ft.floor_id = fl.id WHERE r.room_no = $1 AND ft.flat_code = $2 AND fl.camp_no = $3 FOR UPDATE`, [targetRoomNo, targetFlatCode, targetCampNo]);
    if (roomCheck.rowCount === 0) { await client.query('ROLLBACK'); return res.status(400).json({ error: 'Target room does not belong to specified camp/flat' }); }
    const currentOcc = await client.query('SELECT count(*) FROM employees WHERE room_no = $1 AND employee_status IN (\'On Job\', \'On Leave\')', [targetRoomNo]);
    if (parseInt(currentOcc.rows[0].count) >= roomCheck.rows[0].capacity) { await client.query('ROLLBACK'); return res.status(400).json({ error: 'Room is full' }); }

    // A pre-registered employee has no bed yet, so this move is their first check-in, not a relocation.
    const isFirstAssignment = emp.employee_status === 'Unassigned' || !emp.camp_no || emp.camp_no === 'UNASSIGNED';
    if (!isFirstAssignment) {
      await client.query(`INSERT INTO stay_history (employee_id, camp_no, room_no, cost_center, start_date, end_date, reason, room_grade) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`, [req.params.id, emp.camp_no, emp.room_no, emp.cost_center, emp.entry_date || transferDate, transferDate, `${reason} (Ref: ${docRef})`, emp.grade_type]);
    }
    await client.query(`UPDATE employees SET camp_no = $1, flat_code = $2, room_no = $3, grade_type = $4, entry_date = $5, afr_entry_ref = $6, employee_status = $7 WHERE employee_id = $8`, [targetCampNo, targetFlatCode, targetRoomNo, roomCheck.rows[0].room_grade || targetRoomGrade || emp.grade_type, transferDate, docRef, isFirstAssignment ? 'On Job' : emp.employee_status, req.params.id]);
    if (isFirstAssignment) await logActivity(client, req, 'CHECK_IN', `Assigned ${req.params.id} to Room ${targetRoomNo}`, `Placed in ${targetCampNo}`, targetCampNo);
    else await logActivity(client, req, 'RELOCATION', `Relocated ${req.params.id}`, `Moved to ${targetCampNo} Room ${targetRoomNo}`, targetCampNo);
    await client.query('COMMIT');
    res.json({ success: true });
  } catch (err) { console.error(req.method, req.originalUrl, 'ERROR:', err.message); await client.query('ROLLBACK'); res.status(500).json({ error: 'Server error' }); } finally { client.release(); }
});

app.post('/api/transfer-requests', async (req, res) => {
  const { employeeId, toCostCenter, toDivision, reason } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const empCheck = await client.query('SELECT * FROM employees WHERE employee_id = $1 FOR UPDATE', [employeeId]);
    if (empCheck.rowCount === 0) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Not found' }); }

    if (req.user.role === 'SUPER_ADMIN') {
      await recordCostCenterChange(client, req, empCheck.rows[0], toCostCenter, reason);
      await client.query('UPDATE employees SET cost_center = $1, division = $2 WHERE employee_id = $3', [toCostCenter, toDivision, employeeId]);
      await logActivity(client, req, 'TRANSFER', `Direct Transfer #${employeeId}`, `Moved to ${toCostCenter}`);
    } else if (req.user.role === 'AUDITOR') {
      await client.query('ROLLBACK'); return res.status(403).json({ error: 'Auditors review only' });
    } else {
      await client.query(`INSERT INTO transfer_requests (employee_id, employee_name, from_cost_center, from_division, to_cost_center, to_division, reason, requested_by, requested_by_role, request_type) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`, [employeeId, empCheck.rows[0].employee_name, empCheck.rows[0].cost_center, empCheck.rows[0].division, toCostCenter, toDivision, reason, req.user.name, req.user.role, 'EMPLOYEE_TRANSFER']);
      await logActivity(client, req, 'TRANSFER_REQUEST', `Requested transfer for ${employeeId} to ${toCostCenter}`);
    }
    await client.query('COMMIT');
    res.json({ success: true });
  } catch (err) { console.error(req.method, req.originalUrl, 'ERROR:', err.message); await client.query('ROLLBACK'); res.status(500).json({ error: 'Server error' }); } finally { client.release(); }
});

app.patch('/api/transfer-requests/:id/review', async (req, res) => {
  if (!req.user.permissions.canApproveTransfers) return res.status(403).json({ error: 'Forbidden' });
  const { decision } = req.body;
  if (!['APPROVED', 'REJECTED'].includes(decision)) return res.status(400).json({ error: 'Invalid decision' });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const trCheck = await client.query('SELECT * FROM transfer_requests WHERE id = $1 FOR UPDATE', [req.params.id]);
    if (trCheck.rowCount === 0 || trCheck.rows[0].status !== 'PENDING') { await client.query('ROLLBACK'); return res.status(400).json({ error: 'Invalid request' }); }
    await client.query('UPDATE transfer_requests SET status = $1, reviewed_by = $2, review_date = CURRENT_TIMESTAMP WHERE id = $3', [decision, req.user.name, req.params.id]);
    
    if (decision === 'APPROVED') {
      if (trCheck.rows[0].request_type === 'NEW_COST_CENTER' || trCheck.rows[0].employee_id === 'SYS-CC') {
        await client.query('INSERT INTO cost_centers (code, name, division) VALUES ($1, $2, $3) ON CONFLICT (code) DO NOTHING', [trCheck.rows[0].to_cost_center, trCheck.rows[0].new_cost_center_name || trCheck.rows[0].to_cost_center, trCheck.rows[0].to_division]);
      } else {
        const trEmp = await client.query('SELECT * FROM employees WHERE employee_id = $1 FOR UPDATE', [trCheck.rows[0].employee_id]);
        await recordCostCenterChange(client, req, trEmp.rows[0], trCheck.rows[0].to_cost_center, trCheck.rows[0].reason);
        await client.query('UPDATE employees SET cost_center = $1, division = $2 WHERE employee_id = $3', [trCheck.rows[0].to_cost_center, trCheck.rows[0].to_division, trCheck.rows[0].employee_id]);
      }
    }
    await logActivity(client, req, 'TRANSFER_APPROVAL', `${decision} request ${req.params.id}`);
    await client.query('COMMIT');
    res.json({ success: true });
  } catch (err) { console.error(req.method, req.originalUrl, 'ERROR:', err.message); await client.query('ROLLBACK'); res.status(500).json({ error: 'Server error' }); } finally { client.release(); }
});

app.put('/api/billing/others', async (req, res) => {
  if (req.user.role !== 'SUPER_ADMIN') return res.status(403).json({ error: 'Forbidden' });
  const { billingPeriod, costCenter, amount, description } = req.body;
  if (amount < 0) return res.status(400).json({ error: 'Amount cannot be negative' });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(`INSERT INTO billing_other_costs (billing_period, cost_center, other_cost_kwd, other_cost_description, updated_by) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (billing_period, cost_center) DO UPDATE SET other_cost_kwd = EXCLUDED.other_cost_kwd, other_cost_description = EXCLUDED.other_cost_description, updated_by = EXCLUDED.updated_by`, [billingPeriod, costCenter, amount, description, req.user.name]);
    await logActivity(client, req, 'BILLING', `Updated Other Costs for ${costCenter}`);
    await client.query('COMMIT');
    res.json({ success: true });
  } catch (err) { console.error(req.method, req.originalUrl, 'ERROR:', err.message); await client.query('ROLLBACK'); res.status(500).json({ error: 'Server error' }); } finally { client.release(); }
});

app.post('/api/billing/extra-lines', async (req, res) => {
  if (req.user.role !== 'SUPER_ADMIN') return res.status(403).json({ error: 'Forbidden' });
  const { billingPeriod, costCenter, category, description, quantity, unitRateKwd } = req.body;
  const qty = Number(quantity), rate = Number(unitRateKwd);
  if (!billingPeriod || !costCenter || !category || !String(description || '').trim()) return res.status(400).json({ error: 'Period, cost center, category and description are required' });
  if (!Number.isFinite(qty) || qty <= 0 || !Number.isFinite(rate) || rate < 0) return res.status(400).json({ error: 'Quantity must be above 0 and rate cannot be negative' });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('INSERT INTO extra_invoice_lines (billing_period, cost_center, category, description, quantity, unit_rate_kwd, created_by) VALUES ($1, $2, $3, $4, $5, $6, $7)', [billingPeriod, costCenter, category, String(description).trim(), qty, rate, req.user.name]);
    await logActivity(client, req, 'BILLING', `Added ${category} charge for ${costCenter}`, `${billingPeriod}: ${description} (${qty} x ${rate})`);
    await client.query('COMMIT');
    res.json({ success: true });
  } catch (err) { console.error(req.method, req.originalUrl, 'ERROR:', err.message); await client.query('ROLLBACK'); res.status(500).json({ error: 'Server error' }); } finally { client.release(); }
});

app.delete('/api/billing/extra-lines/:id', async (req, res) => {
  if (req.user.role !== 'SUPER_ADMIN') return res.status(403).json({ error: 'Forbidden' });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const del = await client.query('DELETE FROM extra_invoice_lines WHERE id = $1 RETURNING cost_center, category, billing_period', [req.params.id]);
    if (del.rowCount === 0) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Not found' }); }
    await logActivity(client, req, 'BILLING', `Removed ${del.rows[0].category} charge for ${del.rows[0].cost_center}`, del.rows[0].billing_period);
    await client.query('COMMIT');
    res.json({ success: true });
  } catch (err) { console.error(req.method, req.originalUrl, 'ERROR:', err.message); await client.query('ROLLBACK'); res.status(500).json({ error: 'Server error' }); } finally { client.release(); }
});

app.post('/api/maintenance-logs', requireEditor, async (req, res) => {
  const { date, issueDetails, reportedByEmpId, roomNo, status, replacedMaterialCost } = req.body;
  const costValue = Math.max(0, parseFloat(replacedMaterialCost) || 0);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('INSERT INTO maintenance_logs (date, issue_details, reported_by_emp_id, room_no, status, cost) VALUES ($1, $2, $3, $4, $5, $6)', [date, issueDetails, reportedByEmpId, roomNo, status === 'Completed' ? 'Completed' : 'Pending', costValue]);
    await logActivity(client, req, 'MAINTENANCE', `Logged Work Order for Room ${roomNo}`, issueDetails);
    await client.query('COMMIT');
    res.json({ success: true });
  } catch(err) { console.error(req.method, req.originalUrl, 'ERROR:', err.message); await client.query('ROLLBACK'); res.status(500).json({ error: 'Server error' }); } finally { client.release(); }
});

app.post('/api/misconduct-logs', requireEditor, async (req, res) => {
  const { employeeId, incidentDate, typeOfViolation, remarks } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('INSERT INTO misconduct_logs (employee_id, incident_date, type_of_violation, remarks) VALUES ($1, $2, $3, $4)', [employeeId, incidentDate, typeOfViolation, remarks]);
    await logActivity(client, req, 'DISCIPLINARY', `Filed Misconduct for #${employeeId}`, typeOfViolation);
    await client.query('COMMIT');
    res.json({ success: true });
  } catch(err) { console.error(req.method, req.originalUrl, 'ERROR:', err.message); await client.query('ROLLBACK'); res.status(500).json({ error: 'Server error' }); } finally { client.release(); }
});

// ---- Employee photos (small JPEGs, kept in their own table and loaded on demand) ----
let photoTableReady = null;
const ensurePhotoTable = () => {
  if (!photoTableReady) {
    photoTableReady = pool.query(`CREATE TABLE IF NOT EXISTS employee_photos (
      employee_id VARCHAR(50) PRIMARY KEY REFERENCES employees(employee_id) ON DELETE CASCADE,
      photo TEXT NOT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`).catch(err => { photoTableReady = null; throw err; });
  }
  return photoTableReady;
};

app.get('/api/employees/:id/photo', async (req, res) => {
  try {
    await ensurePhotoTable();
    const r = await pool.query('SELECT photo FROM employee_photos WHERE employee_id = $1', [req.params.id]);
    res.json({ photo: r.rowCount ? r.rows[0].photo : null });
  } catch (err) { console.error('PHOTO GET ERROR:', err.message); res.status(500).json({ error: 'Server error' }); }
});

app.put('/api/employees/:id/photo', requireEditor, async (req, res) => {
  const { photo } = req.body || {};
  if (typeof photo !== 'string' || !/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(photo)) return res.status(400).json({ error: 'Photo must be a JPEG image' });
  if (photo.length > 200000) return res.status(400).json({ error: 'Photo is too large (max about 150 KB)' });
  try {
    await ensurePhotoTable();
    const emp = await pool.query('SELECT 1 FROM employees WHERE employee_id = $1', [req.params.id]);
    if (emp.rowCount === 0) return res.status(404).json({ error: 'Employee not found' });
    await pool.query(`INSERT INTO employee_photos (employee_id, photo) VALUES ($1, $2)
      ON CONFLICT (employee_id) DO UPDATE SET photo = EXCLUDED.photo, updated_at = CURRENT_TIMESTAMP`, [req.params.id, photo]);
    res.json({ success: true });
  } catch (err) { console.error('PHOTO PUT ERROR:', err.message); res.status(500).json({ error: 'Server error' }); }
});

app.delete('/api/employees/:id/photo', requireEditor, async (req, res) => {
  try {
    await ensurePhotoTable();
    await pool.query('DELETE FROM employee_photos WHERE employee_id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) { console.error('PHOTO DELETE ERROR:', err.message); res.status(500).json({ error: 'Server error' }); }
});

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
  } catch (err) { console.error(req.method, req.originalUrl, 'ERROR:', err.message); await client.query('ROLLBACK'); res.status(500).json({ error: 'Server error' }); } finally { client.release(); }
});

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
    const salt = await bcrypt.genSalt(10); const hash = await bcrypt.hash(password, salt);
    await client.query(`INSERT INTO users (staff_id, name, email, password_hash, role, camp_scope, can_manage_users, can_add_camps, can_delete_camps, can_edit_occupants, can_approve_transfers) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`, [staffId, name, email, hash, role, campScope, permissions?.canManageUsers || false, permissions?.canAddCamps || false, permissions?.canDeleteCamps || false, permissions?.canEditOccupants || true, permissions?.canApproveTransfers || false]);
    await logActivity(client, req, 'USER_MGMT', `Created User ${name}`);
    await client.query('COMMIT');
    res.json({ success: true });
  } catch (err) { console.error(req.method, req.originalUrl, 'ERROR:', err.message); await client.query('ROLLBACK'); res.status(500).json({ error: 'Database error' }); } finally { client.release(); }
});

app.patch('/api/users/:id', enforceSuperAdmin, async (req, res) => {
  const { role, status, permissions } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(`UPDATE users SET role = $1, status = $2, can_manage_users = $3, can_add_camps = $4, can_delete_camps = $5, can_edit_occupants = $6, can_approve_transfers = $7 WHERE id = $8`, [role, status, permissions?.canManageUsers, permissions?.canAddCamps, permissions?.canDeleteCamps, permissions?.canEditOccupants, permissions?.canApproveTransfers, req.params.id]);
    await logActivity(client, req, 'USER_MGMT', `Updated User ID ${req.params.id}`);
    await client.query('COMMIT');
    res.json({ success: true });
  } catch (err) { console.error(req.method, req.originalUrl, 'ERROR:', err.message); await client.query('ROLLBACK'); res.status(500).json({ error: 'Database error' }); } finally { client.release(); }
});

app.post('/api/users/:id/reset-password', enforceSuperAdmin, async (req, res) => {
  const { password } = req.body;
  if (!password || password.length < 8) return res.status(400).json({ error: 'Password min 8 chars' });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const salt = await bcrypt.genSalt(10); const hash = await bcrypt.hash(password, salt);
    await client.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hash, req.params.id]);
    await logActivity(client, req, 'USER_MGMT', `Reset password for User ID ${req.params.id}`);
    await client.query('COMMIT');
    res.json({ success: true });
  } catch (err) { console.error(req.method, req.originalUrl, 'ERROR:', err.message); await client.query('ROLLBACK'); res.status(500).json({ error: 'Database error' }); } finally { client.release(); }
});

module.exports = app;
if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`Secure Server running on port ${PORT}`));
}