const express = require('express');
const cors = require('cors');
const db = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

// Chrome-Style Activity Logger Helper
async function recordActivity(client, { actorName, actorRole, category, actionTitle, details, campNo }) {
  const id = `act-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  await client.query(
    `INSERT INTO activity_logs (id, actor_name, actor_role, category, action_title, details, camp_no)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [id, actorName || 'System Admin', actorRole || 'SUPER_ADMIN', category, actionTitle, details, campNo || 'ALL']
  );
}

// ==========================================
// 1. BOOTSTRAP: FETCH ALL SYSTEM TABLES
// ==========================================
app.get('/api/bootstrap', async (req, res) => {
  try {
    const [
      users, costCenters, camps, floors, flats, rooms, employees,
      leaveLogs, rtdLogs, transferRequests, stayHistory,
      billingOtherCosts, activityLogs
    ] = await Promise.all([
      db.query('SELECT * FROM users ORDER BY created_at ASC'),
      db.query('SELECT * FROM cost_centers ORDER BY code ASC'),
      db.query('SELECT * FROM camps ORDER BY camp_no ASC'),
      db.query('SELECT * FROM floors ORDER BY camp_id, floor_no ASC'),
      db.query('SELECT * FROM flats ORDER BY flat_code ASC'),
      db.query('SELECT * FROM rooms ORDER BY room_no ASC'),
      db.query('SELECT * FROM employees ORDER BY sr_no ASC'),
      db.query('SELECT * FROM leave_logs ORDER BY created_at DESC'),
      db.query('SELECT * FROM rtd_logs ORDER BY created_at DESC'),
      db.query('SELECT * FROM transfer_requests ORDER BY request_date DESC'),
      db.query('SELECT * FROM stay_history ORDER BY start_date DESC'),
      db.query('SELECT * FROM billing_other_costs'),
      db.query('SELECT * FROM activity_logs ORDER BY timestamp DESC LIMIT 500')
    ]);

    res.json({
      users: users.rows,
      costCenters: costCenters.rows,
      camps: camps.rows,
      floors: floors.rows,
      flats: flats.rows,
      rooms: rooms.rows,
      employees: employees.rows,
      leaveLogs: leaveLogs.rows,
      rtdLogs: rtdLogs.rows,
      transferRequests: transferRequests.rows,
      stayHistory: stayHistory.rows,
      billingOtherCosts: billingOtherCosts.rows,
      activityLogs: activityLogs.rows
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 2. CHECK-IN NEW EMPLOYEE
// ==========================================
app.post('/api/employees', async (req, res) => {
  const {
    employeeId, employeeName, nationality, title, gradeType, division, costCenter,
    passportNo, civilId, mobileNo, emergencyContactName, emergencyContactPhone,
    homeCountryAddress, campNo, campArea, floorNo, flatNo, flatCode, roomNo,
    entryDate, afrEntryRef, actorName, actorRole
  } = req.body;

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(
      `INSERT INTO employees (
        employee_id, employee_name, nationality, title, grade_type, division, cost_center,
        passport_no, civil_id, mobile_no, emergency_contact_name, emergency_contact_phone,
        home_country_address, camp_no, camp_area, floor_no, flat_no, flat_code, room_no,
        entry_date, afr_entry_ref, afr_log_no, employee_status
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,'On Job')`,
      [
        employeeId, employeeName, nationality, title, gradeType || 'Non-Manual', division, costCenter,
        passportNo, civilId, mobileNo, emergencyContactName, emergencyContactPhone,
        homeCountryAddress, campNo, campArea, floorNo, flatNo, flatCode, roomNo,
        entryDate, afrEntryRef, `LOG-${employeeId}`
      ]
    );

    await recordActivity(client, {
      actorName, actorRole,
      category: 'CHECK_IN',
      actionTitle: `Assigned #${employeeId} to ${campNo} Room ${roomNo}`,
      details: `${employeeName} (${title}) checked in. Mobile: ${mobileNo}. Emergency: ${emergencyContactName} (${emergencyContactPhone}).`,
      campNo
    });

    await client.query('COMMIT');
    res.json({ success: true });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// ==========================================
// 3. LEAVE WORKFLOW: START LEAVE
// ==========================================
app.post('/api/employees/:id/leave', async (req, res) => {
  const { id } = req.params;
  const { leaveStartDate, expectedEndDate, afrLogNo, remarks, actorName, actorRole } = req.body;
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    const empRes = await client.query('SELECT * FROM employees WHERE employee_id = $1', [id]);
    if (!empRes.rows.length) return res.status(404).json({ error: 'Employee not found' });
    const emp = empRes.rows[0];

    await client.query(
      `UPDATE employees
       SET employee_status = 'On Leave', leave_start_date = $1, leave_end_date = $2, leave_return_date = NULL
       WHERE employee_id = $3`,
      [leaveStartDate, expectedEndDate, id]
    );

    const logId = `lv-${Date.now()}`;
    await client.query(
      `INSERT INTO leave_logs (id, employee_id, employee_name, camp_no, room_no, leave_start_date, expected_end_date, afr_log_no, remarks, status, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'Active Leave', $10)`,
      [logId, id, emp.employee_name, emp.camp_no, emp.room_no, leaveStartDate, expectedEndDate, afrLogNo, remarks, actorName]
    );

    await recordActivity(client, {
      actorName, actorRole,
      category: 'LEAVE_START',
      actionTitle: `Marked #${id} On Leave`,
      details: `${emp.employee_name} on vacation from ${leaveStartDate} to expected return ${expectedEndDate} (Bed held in ${emp.camp_no} Room ${emp.room_no})`,
      campNo: emp.camp_no
    });

    await client.query('COMMIT');
    res.json({ success: true, logId });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// ==========================================
// 4. LEAVE WORKFLOW: ACTUAL RETURN TO JOB
// ==========================================
app.post('/api/employees/:id/return-job', async (req, res) => {
  const { id } = req.params;
  const { actualReturnDate, remarks, actorName, actorRole } = req.body;
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    const empRes = await client.query('SELECT * FROM employees WHERE employee_id = $1', [id]);
    if (!empRes.rows.length) return res.status(404).json({ error: 'Employee not found' });
    const emp = empRes.rows[0];

    await client.query(
      `UPDATE employees
       SET employee_status = 'On Job', leave_return_date = $1
       WHERE employee_id = $2`,
      [actualReturnDate, id]
    );

    await client.query(
      `UPDATE leave_logs
       SET actual_return_date = $1, status = 'Returned', remarks = COALESCE(remarks || ' • Return Note: ' || $2, remarks)
       WHERE employee_id = $3 AND status = 'Active Leave'`,
      [actualReturnDate, remarks || 'Returned on schedule', id]
    );

    await recordActivity(client, {
      actorName, actorRole,
      category: 'LEAVE_RETURN',
      actionTitle: `Marked #${id} Returned to Job`,
      details: `${emp.employee_name} returned on Actual Return Date: ${actualReturnDate} (${emp.camp_no} Room ${emp.room_no})`,
      campNo: emp.camp_no
    });

    await client.query('COMMIT');
    res.json({ success: true });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// ==========================================
// 5. RTD: RESIGNED, TERMINATED, DISMISSED
// ==========================================
app.post('/api/employees/:id/rtd', async (req, res) => {
  const { id } = req.params;
  const { rtdType, rtdDate, afrExitRef, remarks, actorName, actorRole } = req.body;
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    const empRes = await client.query('SELECT * FROM employees WHERE employee_id = $1', [id]);
    if (!empRes.rows.length) return res.status(404).json({ error: 'Employee not found' });
    const emp = empRes.rows[0];
    const statusLabel = `RTD - ${rtdType}`;

    await client.query(
      `UPDATE employees
       SET employee_status = $1, rtd_type = $2, rtd_date = $3, afr_exit_ref = $4, remarks = $5,
           camp_no = NULL, room_no = NULL, flat_code = NULL
       WHERE employee_id = $6`,
      [statusLabel, rtdType, rtdDate, afrExitRef, remarks, id]
    );

    const rtdId = `rtd-${Date.now()}`;
    await client.query(
      `INSERT INTO rtd_logs (id, employee_id, employee_name, rtd_type, rtd_date, vacated_camp_no, vacated_room_no, cost_center, afr_exit_ref, remarks, recorded_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [rtdId, id, emp.employee_name, rtdType, rtdDate, emp.camp_no, emp.room_no, emp.cost_center, afrExitRef, remarks, actorName]
    );

    await recordActivity(client, {
      actorName, actorRole,
      category: 'RTD_EXIT',
      actionTitle: `Processed RTD (${rtdType}) for #${id}`,
      details: `${emp.employee_name} marked as ${statusLabel} effective ${rtdDate}. Vacated bed in ${emp.camp_no} Room ${emp.room_no}.`,
      campNo: emp.camp_no
    });

    await client.query('COMMIT');
    res.json({ success: true, rtdId });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// ==========================================
// 6. 1-CLICK BED RELOCATION & HISTORY
// ==========================================
app.post('/api/employees/:id/relocate', async (req, res) => {
  const { id } = req.params;
  const { targetCampNo, targetCampArea, targetFloorNo, targetFlatCode, targetRoomNo, targetRoomGrade, transferDate, reason, actorName, actorRole } = req.body;
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    const empRes = await client.query('SELECT * FROM employees WHERE employee_id = $1', [id]);
    if (!empRes.rows.length) return res.status(404).json({ error: 'Employee not found' });
    const emp = empRes.rows[0];

    // Archive previous stay to stay_history
    await client.query(
      `INSERT INTO stay_history (employee_id, camp_no, camp_area, flat_code, room_no, room_grade, cost_center, start_date, end_date, reason)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [id, emp.camp_no, emp.camp_area, emp.flat_code, emp.room_no, emp.grade_type, emp.cost_center, emp.entry_date, transferDate, reason || 'Inter-Camp Relocation']
    );

    // Update current room
    await client.query(
      `UPDATE employees
       SET camp_no = $1, camp_area = $2, floor_no = $3, flat_code = $4, room_no = $5, grade_type = $6, entry_date = $7
       WHERE employee_id = $8`,
      [targetCampNo, targetCampArea, targetFloorNo, targetFlatCode, targetRoomNo, targetRoomGrade, transferDate, id]
    );

    await recordActivity(client, {
      actorName, actorRole,
      category: 'RELOCATION',
      actionTitle: `Relocated #${id} to ${targetCampNo} Room ${targetRoomNo}`,
      details: `${emp.employee_name} moved from ${emp.camp_no} Room ${emp.room_no} to ${targetCampNo} Room ${targetRoomNo}. Reason: ${reason}`,
      campNo: targetCampNo
    });

    await client.query('COMMIT');
    res.json({ success: true });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// ==========================================
// 7. COST CENTER TRANSFER APPROVAL REQUESTS
// ==========================================
app.post('/api/transfer-requests', async (req, res) => {
  const { employeeId, toCostCenter, toDivision, reason, actorName, actorRole } = req.body;
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    const empRes = await client.query('SELECT * FROM employees WHERE employee_id = $1', [employeeId]);
    if (!empRes.rows.length) return res.status(404).json({ error: 'Employee not found' });
    const emp = empRes.rows[0];

    // If Super Admin or Auditor, apply immediately
    if (actorRole === 'SUPER_ADMIN' || actorRole === 'AUDITOR') {
      await client.query('UPDATE employees SET cost_center = $1, division = $2 WHERE employee_id = $3', [toCostCenter, toDivision, employeeId]);
      await recordActivity(client, {
        actorName, actorRole,
        category: 'COST_CENTER_TRANSFER',
        actionTitle: `Direct Cost Center Move #${employeeId}`,
        details: `${actorName} directly reassigned #${employeeId} (${emp.employee_name}) from ${emp.cost_center} to ${toCostCenter}.`,
        campNo: emp.camp_no
      });
      await client.query('COMMIT');
      return res.json({ success: true, appliedDirectly: true });
    }

    // Editor creates request
    const reqId = `tr-${Date.now()}`;
    await client.query(
      `INSERT INTO transfer_requests (id, employee_id, employee_name, from_cost_center, from_division, to_cost_center, to_division, reason, requested_by, requested_by_role, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'PENDING')`,
      [reqId, employeeId, emp.employee_name, emp.cost_center, emp.division, toCostCenter, toDivision, reason, actorName, actorRole]
    );

    await recordActivity(client, {
      actorName, actorRole,
      category: 'COST_CENTER_REQUEST',
      actionTitle: `Requested Transfer for #${employeeId}`,
      details: `${actorName} requested moving #${employeeId} (${emp.employee_name}) from ${emp.cost_center} to ${toCostCenter}. Awaiting Super Admin / Auditor approval.`,
      campNo: emp.camp_no
    });

    await client.query('COMMIT');
    res.json({ success: true, reqId, appliedDirectly: false });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

app.patch('/api/transfer-requests/:id/review', async (req, res) => {
  const { id } = req.params;
  const { decision, reviewerName, reviewRemarks } = req.body; // 'APPROVED' or 'REJECTED'
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    const reqRes = await client.query('SELECT * FROM transfer_requests WHERE id = $1', [id]);
    if (!reqRes.rows.length) return res.status(404).json({ error: 'Request not found' });
    const tr = reqRes.rows[0];

    if (decision === 'APPROVED') {
      await client.query('UPDATE employees SET cost_center = $1, division = $2 WHERE employee_id = $3', [tr.to_cost_center, tr.to_division, tr.employee_id]);
    }

    await client.query(
      `UPDATE transfer_requests
       SET status = $1, reviewed_by = $2, review_date = CURRENT_TIMESTAMP, review_remarks = $3
       WHERE id = $4`,
      [decision, reviewerName, reviewRemarks || '', id]
    );

    await recordActivity(client, {
      actorName: reviewerName, actorRole: 'SUPER_ADMIN',
      category: decision === 'APPROVED' ? 'COST_CENTER_APPROVAL' : 'COST_CENTER_REJECTION',
      actionTitle: `${decision} Cost Center Transfer #${tr.employee_id}`,
      details: `Reviewer ${reviewerName} ${decision.toLowerCase()} transfer of #${tr.employee_id} (${tr.employee_name}) to ${tr.to_cost_center}.`
    });

    await client.query('COMMIT');
    res.json({ success: true });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// ==========================================
// 8. BILLING "OTHERS" (MISCELLANEOUS COSTS)
// ==========================================
app.put('/api/billing/others', async (req, res) => {
  const { billingPeriod, costCenter, amount, description, actorName } = req.body;
  try {
    const id = `oth-${billingPeriod}-${costCenter}`;
    await db.query(
      `INSERT INTO billing_other_costs (id, billing_period, cost_center, other_cost_kwd, other_cost_description, updated_by, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
       ON CONFLICT (billing_period, cost_center)
       DO UPDATE SET other_cost_kwd = $4, other_cost_description = $5, updated_by = $6, updated_at = CURRENT_TIMESTAMP`,
      [id, billingPeriod, costCenter, amount, description, actorName]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 9. SAFE CAMP DECOMMISSIONING
// ==========================================
app.patch('/api/camps/:id/decommission', async (req, res) => {
  const { id } = req.params;
  const { actorName, actorRole } = req.body;
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    const campRes = await client.query('SELECT * FROM camps WHERE id = $1', [id]);
    if (!campRes.rows.length) return res.status(404).json({ error: 'Camp not found' });
    const camp = campRes.rows[0];

    // Zero-Occupancy Check
    const activeStaff = await client.query(
      "SELECT employee_id, employee_name, room_no FROM employees WHERE camp_no = $1 AND employee_status NOT LIKE 'RTD%'",
      [camp.camp_no]
    );

    if (activeStaff.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        error: `Cannot decommission ${camp.camp_no}: ${activeStaff.rows.length} active occupants remain.`,
        occupants: activeStaff.rows
      });
    }

    await client.query("UPDATE camps SET status = 'Decommissioned' WHERE id = $1", [id]);

    await recordActivity(client, {
      actorName, actorRole,
      category: 'CAMP_DECOMMISSION',
      actionTitle: `Decommissioned ${camp.camp_no}`,
      details: `${camp.camp_no} (${camp.camp_area}) archived safely with zero active occupants. Preserved for audits and historical billing.`,
      campNo: camp.camp_no
    });

    await client.query('COMMIT');
    res.json({ success: true });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Dhow Camp Management ERP Backend running on port ${PORT}`);
});