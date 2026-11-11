import * as XLSX from 'xlsx';

// 1. Camp Occupancy Summary Status Generator
export function exportCampOccupancySummary(camps, occupants, leaveLogs, rtdLogs) {
  const todayStr = new Date().toISOString().split('T')[0];
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
  rows.push(['', 'Type of Inspection:', '', '', '', 'Conducted at:', todayStr]);
  rows.push(['', "Camp Boss's Weekly Inspection conducted at:", todayStr]);
  rows.push([]);
  rows.push(['', "Accommodation Department Head's approval"]);
  rows.push(['', 'Remarks: Regular accommodation operations compliant']);
  rows.push(['', 'Name:', 'Mohamed Bayoumi', '', 'Signature:', '______________', '', 'Date:', todayStr]);

  const ws = XLSX.utils.aoa_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
  XLSX.writeFile(wb, `Camp Occupancy Summary Status - ${todayStr}.xlsx`);
}

// 2. Daily Occupancy Report Generator
export function exportDailyOccupancyReport(activeCamp, occupants) {
  const todayStr = new Date().toISOString().split('T')[0];
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
      'Camp Coordinator'
    ]);
  });

  rows.push([]);
  rows.push(['Note: * - Employee code refers herein Al Dhow ID No, Civil ID No. and Passport No.']);

  const ws = XLSX.utils.aoa_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
  XLSX.writeFile(wb, `Daily Occupancy Report - ${activeCamp.campNo} - ${todayStr}.xlsx`);
}

// 3. Employee New Arrival - Material Issuance Form (Doc. Ref: 150-04)
export function exportMaterialIssuanceForm(occ, arrivalType = 'Local Residency Transfer') {
  const todayStr = new Date().toISOString().split('T')[0];

  const rows = [
    ['', '', 'EMPLOYEE NEW ARRIVAL - MATERIAL ISSUANCE FORM', '', '', '', '', '', '', '', '', '', '', '', '', '', '', 'Doc. Ref.:', '150-04'],
    ['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', 'Date :', todayStr],
    [],
    ['', 'Employee Details:', '', '', '', '', 'Arrival Type :', '', '', arrivalType === 'Overseas' ? '[X] Overseas' : '[ ] Overseas', '', '', '', '', arrivalType !== 'Overseas' ? '[X] Local Residency Transfer' : '[ ] Local Residency Transfer', '', '', '', '', 'Arrival Date :', occ.entryDate || todayStr],
    [],
    ['', 'Project / Dept. No.', 'Emp. Code', '', 'Name', '', 'Nationality', '', '', 'Passport / Civil ID No.', '', '', '', '', '', '', '', 'Designation'],
    ['', occ.costCenter, occ.employeeId, '', occ.employeeName, '', occ.nationality, '', '', `${occ.passportNo} / ${occ.civilId}`, '', '', '', '', '', '', '', occ.title],
    [],
    ['', 'Sl. No.', 'List of Materials', '', '', '', 'Total Qty Issued', '', '', '', 'Accommodation Request Ref. No. & Date', '', '', '', '', '', '', 'Assigned Camp No.', '', '', '', '', 'Assigned Room No.'],
    ['', '', '', '', '', '', 'YES', 'No', '', '', `${occ.afrLogNo || 'LOG-AFR'} (${occ.entryDate})`, '', '', '', '', '', '', occ.campNo, '', '', '', '', occ.roomNo],
    ['', 1, '  Mattress', '', '', '', 'YES', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
    ['', 2, '  Pillow', '', '', '', 'YES', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
    ['', 3, '  Bedsheet', '', '', '', 'YES', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
    ['', 4, '  Blanket', '', '', '', 'YES', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
    [],
    ['', 'Note: Employee has to return the received items in case of vacating the accommodation.'],
    [],
    ['', '', 'Requested by', '', '', '', 'Issued by', '', '', '', '', '', '', '', '', '', '', 'Approved by'],
    ['', 'Name:', occ.employeeName, '', '', '', 'Camp Supervisor', '', '', '', '', '', '', '', '', '', '', 'Mohamed Bayoumi'],
    ['', 'Designation:', occ.title, '', '', '', 'Camp Boss', '', '', '', '', '', '', '', '', '', '', 'Accommodation Dept Head'],
    ['', 'Signature:', '______________', '', '', '', '______________', '', '', '', '', '', '', '', '', '', '', '______________'],
    ['', 'Date:', todayStr, '', '', '', todayStr, '', '', '', '', '', '', '', '', '', '', todayStr]
  ];

  const ws = XLSX.utils.aoa_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '150-04');
  XLSX.writeFile(wb, `Material Issuance Form - ${occ.employeeId} - ${occ.employeeName}.xlsx`);
}

// 4. Occupants Relocation Form Generator
export function exportOccupantsRelocationForm(relocationRecords) {
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
  rows.push(['', 'Name:', '', 'Camp Supervisor', '', '', '', 'Project Coordinator', '', '', '', 'Accommodation Head']);
  rows.push(['', 'Designation:', '', 'Camp Admin', '', '', '', 'Field Engineer', '', '', '', 'Dept Head']);
  rows.push(['', 'Signature:', '', '______________', '', '', '', '______________', '', '', '', '______________']);
  rows.push(['', 'Date:', '', todayStr, '', '', '', todayStr, '', '', '', todayStr]);

  const ws = XLSX.utils.aoa_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
  XLSX.writeFile(wb, `Occupants Relocation Form - ${todayStr}.xlsx`);
}

// 5. Accommodation Misconduct Report Generator (Individual Incident)
export function exportAccommodationMisconductReport(incident) {
  const todayStr = new Date().toISOString().split('T')[0];

  const rows = [
    [],
    ['', 'Details of Offence'],
    ['', 'Accommodation No.:', incident.campNo, '', '', '', '', '', 'Date:', incident.incidentDate || todayStr],
    ['', 'Location of Offence:', incident.location, '', '', '', '', '', 'Time:', incident.incidentTime || '14:00'],
    ['', 'Name of Offender:', incident.employeeName, '', '', '', '', '', 'ID No.:', incident.employeeId],
    ['', 'Designation:', incident.title || 'Worker', '', '', '', '', '', 'Div./ Dept./ Proj.:', `${incident.division} / ${incident.costCenter}`],
    ['', 'Room No.:', incident.roomNo, '', '', '', '', '', 'Contact No.:', incident.contactNo || '+965'],
    [],
    ['', 'Brief Description of Offence'],
    ['', incident.description || 'Violation of camp safety and residential quiet hours regulations.'],
    [],
    [],
    ['', 'Witness (if available)'],
    ['', 'Sr. No.', 'Name', '', '', 'ID No.', '', 'Room No.', '', '', 'Contact No.'],
    ['', 1, incident.witnessName || 'Colleague on Site', '', '', incident.witnessId || 'N/A', '', incident.witnessRoom || 'N/A', '', '', incident.witnessPhone || '+965'],
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

// 6. Accommodation Misconduct Report Log Generator (Master Register)
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

// 7. Maintenance Log Generator (Complaints & Work Orders)
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
      item.areaFacility || 'Bathroom / AC Unit',
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