import * as XLSX from 'xlsx';

// 1. Camp Occupancy Summary Status (Template 1)
export function exportCampOccupancySummary(camps, occupants, leaveLogs, rtdLogs, meta = {}) {
  const todayStr = meta.date || new Date().toISOString().split('T')[0];
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' });

  const rows = [
    ['', '', '', '', '', '', 'Date:', todayStr],
    [],
    ['', 'Sr. No.', 'Accommodation No.', 'Total Capacity [No. of Beds]', `Total Bed Space Occupied as on ${yesterdayStr}`, 'Vacation', 'RTD', 'Remarks']
  ];

  camps.forEach((camp, idx) => {
    let cap = 0;
    camp.floors.forEach(fl => fl.flats.forEach(ft => ft.rooms.forEach(rm => { cap += rm.capacity; })));
    const activeInCamp = occupants.filter(o => o.campNo === camp.campNo);
    const onJob = activeInCamp.filter(o => o.employeeStatus === 'On Job').length;
    const onLeave = activeInCamp.filter(o => o.employeeStatus === 'On Leave').length;
    const rtdCount = rtdLogs.filter(r => r.vacatedCampNo === camp.campNo).length;

    rows.push([
      '',
      idx + 1,
      `${camp.campNo} (${camp.campArea})`,
      cap,
      onJob + onLeave,
      onLeave,
      rtdCount,
      `${cap - (onJob + onLeave)} Beds Vacant`
    ]);
  });

  rows.push([]);
  rows.push(['', 'Inspection Details']);
  rows.push(['', 'Type of Inspection:', meta.inspectionType || 'Weekly Routine Inspection', '', '', 'Conducted at:', meta.conductedAt || 'All Camp Facilities']);
  rows.push(['', "Camp Boss's Weekly Inspection conducted at:", todayStr]);
  rows.push([]);
  rows.push(['', "Accommodation Department Head's approval"]);
  rows.push(['', `Remarks: ${meta.remarks || 'Regular accommodation operations compliant and inspected.'}`]);
  rows.push(['', 'Name:', meta.approverName || 'Mohamed Bayoumi', '', 'Signature:', '______________', '', 'Date:', todayStr]);

  const ws = XLSX.utils.aoa_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
  XLSX.writeFile(wb, `Camp Occupancy Summary Status - ${todayStr}.xlsx`);
}

// 2. Daily Occupancy Report (Template 2)
export function exportDailyOccupancyReport(activeCamp, occupants, meta = {}) {
  const todayStr = meta.date || new Date().toISOString().split('T')[0];
  const campOccupants = occupants.filter(o => o.campNo === activeCamp.campNo);

  const rows = [
    ['Accommodation No.:', activeCamp.campNo, '', '', '', '', 'Area:', activeCamp.campArea, '', ''],
    [],
    ['Sr. No.', 'Employee', '', '', '', 'Occupancy', '', 'Date', '', 'Entered by'],
    ['', 'Code*', 'Name', 'Designation', 'Project/ Dept. No.', 'Room No.', 'Status', 'Arrival', 'Leaving', '']
  ];

  campOccupants.forEach((occ, idx) => {
    rows.push([
      idx + 1,
      occ.employeeId,
      occ.employeeName,
      occ.title,
      occ.costCenter,
      occ.roomNo,
      occ.employeeStatus,
      occ.entryDate,
      occ.exitDate || '-',
      meta.enteredBy || 'Camp Coordinator'
    ]);
  });

  rows.push([]);
  rows.push(['Note: * - Employee code refers herein Al Dhow ID No, Civil ID No. and Passport No.']);

  const ws = XLSX.utils.aoa_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
  XLSX.writeFile(wb, `Daily Occupancy Report - ${activeCamp.campNo} - ${todayStr}.xlsx`);
}

// 3. Employee New Arrival - Material Issuance Form (Template 3 / Doc Ref 150-04)
export function exportMaterialIssuanceForm(occ, arrivalType = 'Local Residency Transfer', meta = {}) {
  const todayStr = new Date().toISOString().split('T')[0];

  const rows = [
    ['', '', 'EMPLOYEE NEW ARRIVAL - MATERIAL ISSUANCE FORM', '', '', '', '', '', '', '', '', '', '', '', '', '', '', 'Doc. Ref.:', '150-04'],
    ['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', 'Date :', todayStr],
    [],
    ['', 'Employee Details:', '', '', '', '', 'Arrival Type :', '', '', arrivalType === 'Overseas' ? '[X] Overseas' : '[ ] Overseas', '', '', '', '', arrivalType !== 'Overseas' ? '[X] Local Residency Transfer' : '[ ] Local Residency Transfer', '', '', '', '', 'Arrival Date :', occ.entryDate || todayStr],
    [],
    ['', 'Project / Dept. No.', 'Emp. Code', '', 'Name', '', 'Nationality', '', '', 'Passport / Civil ID No.', '', '', '', '', '', '', '', 'Designation'],
    ['', occ.costCenter, occ.employeeId, '', occ.employeeName, '', occ.nationality, '', '', `${occ.passportNo || 'N/A'} / ${occ.civilId || 'N/A'}`, '', '', '', '', '', '', '', occ.title],
    [],
    ['', 'Sl. No.', 'List of Materials', '', '', '', 'Total Qty Issued', '', '', '', 'Accommodation Request Ref. No. & Date', '', '', '', '', '', '', 'Assigned Camp No.', '', '', '', '', 'Assigned Room No.'],
    ['', '', '', '', '', '', 'YES', 'No', '', '', `${occ.afrLogNo || 'LOG-AFR'} (${occ.entryDate || todayStr})`, '', '', '', '', '', '', occ.campNo, '', '', '', '', occ.roomNo],
    ['', 1, '  Mattress', '', '', '', 'YES', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
    ['', 2, '  Pillow', '', '', '', 'YES', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
    ['', 3, '  Bedsheet', '', '', '', 'YES', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
    ['', 4, '  Blanket', '', '', '', 'YES', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
    [],
    ['', 'Note: Employee has to return the received items in case of vacating the accommodation.'],
    [],
    ['', '', 'Requested by', '', '', '', 'Issued by', '', '', '', '', '', '', '', '', '', '', 'Approved by'],
    ['', 'Name:', occ.employeeName, '', '', '', meta.issuedByName || 'Camp Supervisor', '', '', '', '', '', '', '', '', '', '', meta.approvedByName || 'Mohamed Bayoumi'],
    ['', 'Designation:', occ.title, '', '', '', 'Camp Boss', '', '', '', '', '', '', '', '', '', '', 'Accommodation Dept Head'],
    ['', 'Signature:', '______________', '', '', '', '______________', '', '', '', '', '', '', '', '', '', '', '______________'],
    ['', 'Date:', todayStr, '', '', '', todayStr, '', '', '', '', '', '', '', '', '', '', todayStr]
  ];

  const ws = XLSX.utils.aoa_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '150-04');
  XLSX.writeFile(wb, `Material Issuance Form - ${occ.employeeId} - ${occ.employeeName}.xlsx`);
}

// 4. Occupants Relocation Form (Template 4)
export function exportOccupantsRelocationForm(relocationRecords, meta = {}) {
  const todayStr = new Date().toISOString().split('T')[0];

  const rows = [
    [],
    ['', 'Sr. No.', 'Employee ID', 'Employee Name', '', '', '', 'Designation', '', 'From', 'To', 'Date of Relocation', 'Remarks']
  ];

  const list = Array.isArray(relocationRecords) ? relocationRecords : [relocationRecords];
  list.forEach((rec, idx) => {
    rows.push([
      '',
      idx + 1,
      rec.employeeId,
      rec.employeeName,
      '', '', '',
      rec.title || 'Staff',
      '',
      rec.fromRoom || rec.oldRoomNo,
      rec.toRoom || rec.newRoomNo,
      rec.relocationDate || todayStr,
      rec.reason || 'Camp Project Reallocation'
    ]);
  });

  rows.push([]);
  rows.push([]);
  rows.push(['', '', '', 'Prepared by', '', '', '', 'Reviewed by', '', '', '', 'Approved by']);
  rows.push(['', 'Name:', '', meta.preparedByName || 'Camp Supervisor', '', '', '', meta.reviewedByName || 'Project Coordinator', '', '', '', meta.approvedByName || 'Accommodation Head']);
  rows.push(['', 'Designation:', '', 'Camp Admin', '', '', '', 'Field Engineer', '', '', '', 'Dept Head']);
  rows.push(['', 'Signature:', '', '______________', '', '', '', '______________', '', '', '', '______________']);
  rows.push(['', 'Date:', '', todayStr, '', '', '', todayStr, '', '', '', todayStr]);

  const ws = XLSX.utils.aoa_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
  XLSX.writeFile(wb, `Occupants Relocation Form - ${todayStr}.xlsx`);
}

// 5. Accommodation Misconduct Report (Template 5)
export function exportAccommodationMisconductReport(incident) {
  const todayStr = new Date().toISOString().split('T')[0];

  const rows = [
    [],
    ['', 'Details of Offence'],
    ['', 'Accommodation No.:', incident.campNo, '', '', '', '', '', 'Date:', incident.incidentDate || todayStr],
    ['', 'Location of Offence:', incident.location || incident.incidentLocation, '', '', '', '', '', 'Time:', incident.incidentTime || '14:00'],
    ['', 'Name of Offender:', incident.employeeName, '', '', '', '', '', 'ID No.:', incident.employeeId],
    ['', 'Designation:', incident.title || 'Worker', '', '', '', '', '', 'Div./ Dept./ Proj.:', `${incident.division} / ${incident.costCenter}`],
    ['', 'Room No.:', incident.roomNo, '', '', '', '', '', 'Contact No.:', incident.contactNo || '+965'],
    [],
    ['', 'Brief Description of Offence'],
    ['', incident.description || 'Violation of camp safety regulations.'],
    [],
    [],
    ['', 'Witness (if available)'],
    ['', 'Sr. No.', 'Name', '', '', 'ID No.', '', 'Room No.', '', '', 'Contact No.'],
    ['', 1, incident.witnessName || 'None', '', '', incident.witnessId || 'N/A', '', incident.witnessRoom || 'N/A', '', '', incident.witnessPhone || '+965'],
    [],
    ['', 'Submitted by:'],
    ['', 'Name', incident.reportedBy || 'Camp Supervisor', '', '', '', 'Signature', '______________', '', '', 'Date', todayStr],
    [],
    ['', 'Recommendation for Action'],
    ['', 'Accommodation Department '],
    ['', 'Name', 'Mohamed Bayoumi', '', '', '', 'Signature', '______________', '', '', 'Date', todayStr],
    [],
    ['', 'Division/ Department/ Project'],
    ['', 'Name', 'Project Site Manager', '', '', '', 'Signature', '______________', '', '', 'Date', todayStr],
    [],
    ['', 'Human Resources Department'],
    ['', 'Name', 'HR Disciplinary Committee', '', '', '', 'Signature', '______________', '', '', 'Date', todayStr]
  ];

  const ws = XLSX.utils.aoa_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
  XLSX.writeFile(wb, `Accommodation Misconduct Report - ${incident.employeeId} - ${todayStr}.xlsx`);
}

// 6. Accommodation Misconduct Report Log (Template 6)
export function exportMisconductLog(misconductLogs) {
  const todayStr = new Date().toISOString().split('T')[0];

  const rows = [
    ['EMPLOYEE DISCIPLINARY ACTION LOG'],
    ['Sl N.', 'ID', 'Name', 'Designation', 'Incident Date', 'Incident Location', 'Type of Violation', 'Doc Ref', 'Cost Center', 'Remarks']
  ];

  misconductLogs.forEach((item, idx) => {
    rows.push([
      idx + 1,
      item.employeeId,
      item.employeeName,
      item.title || 'Staff',
      item.incidentDate,
      item.incidentLocation,
      item.typeOfViolation,
      item.docRef || `DISC-${item.employeeId}`,
      item.costCenter,
      item.remarks
    ]);
  });

  const ws = XLSX.utils.aoa_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet-1');
  XLSX.writeFile(wb, `Accommodation Misconduct Report Log - ${todayStr}.xlsx`);
}

// 7. Maintenance Log (Template 7)
export function exportMaintenanceLog(maintenanceRecords) {
  const todayStr = new Date().toISOString().split('T')[0];

  const rows = [
    ['Accommodation Maintenance log'],
    [],
    ['Uni.ID', 'Date', 'Month', 'Maintenance Issue Details', 'Issue Reported by  Emp. ID#', 'Employee Name', 'Floor', 'Flat', 'Room', 'Area / Facility', 'Inspected by ', 'Action Taken by', 'Status (Pending/Completed)', 'Replaced Material Cost', 'Charge to Emp. ID#', 'Remarks']
  ];

  maintenanceRecords.forEach((item) => {
    rows.push([
      item.id,
      item.date,
      item.month,
      item.issueDetails,
      item.reportedByEmpId,
      item.employeeName,
      item.floorNo,
      item.flatCode,
      item.roomNo,
      item.areaFacility || 'Bedroom AC / Electrical',
      item.inspectedBy,
      item.actionTakenBy,
      item.status,
      item.replacedMaterialCost || '0.000',
      item.chargeToEmpId || 'N/A',
      item.remarks
    ]);
  });

  const ws = XLSX.utils.aoa_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Complaint report');
  XLSX.writeFile(wb, `Accommodation Maintenance Log - ${todayStr}.xlsx`);
}