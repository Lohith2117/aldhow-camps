import ExcelJS from 'exceljs';
import dhowLogoImg from '../assets/dhow-logo.png';

// Helper: Trigger browser download from ExcelJS workbook
async function downloadWorkbook(wb, filename) {
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}

// Helper: Embed Dhow Logo into ExcelJS workbook
async function addLogoToWorkbook(wb, ws, tl = { col: 1, row: 0 }, ext = { width: 110, height: 45 }) {
  try {
    const response = await fetch(dhowLogoImg);
    const arrayBuffer = await response.arrayBuffer();
    const logoId = wb.addImage({
      buffer: arrayBuffer,
      extension: 'png'
    });
    ws.addImage(logoId, { tl, ext });
  } catch (e) {
    console.warn('Could not embed logo image into Excel:', e);
  }
}

const thinBorder = {
  top: { style: 'thin', color: { argb: 'FF000000' } },
  left: { style: 'thin', color: { argb: 'FF000000' } },
  bottom: { style: 'thin', color: { argb: 'FF000000' } },
  right: { style: 'thin', color: { argb: 'FF000000' } }
};

const headerFill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FFF2F4F8' }
};

// ============================================================================
// PRINT ISOLATION ENGINE (Prints ONLY the Excel-styled Sheet or Preview Modal)
// ============================================================================
export function printFormattedElement(elementId, docTitle = 'Al-Dhow Official Report') {
  const el = document.getElementById(elementId);
  if (!el) {
    window.print();
    return;
  }

  const printWin = window.open('', '_blank', 'width=1024,height=800');
  if (!printWin) {
    window.print();
    return;
  }

  printWin.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${docTitle}</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 10mm;
          }
          * {
            box-sizing: border-box;
            font-family: Calibri, 'Segoe UI', Arial, sans-serif;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body {
            margin: 0;
            padding: 0;
            background: #ffffff;
            color: #000000;
          }
          .no-print {
            display: none !important;
          }
          table {
            width: 100%;
            border-collapse: collapse;
          }
          th, td {
            border: 1px solid #000000;
            padding: 4px 6px;
            font-size: 11px;
          }
          th {
            background-color: #f3f4f6;
            font-weight: 700;
            text-align: center;
          }
          input, textarea {
            border: none !important;
            background: transparent !important;
            font-family: inherit;
            font-size: inherit;
            font-weight: inherit;
            color: inherit;
            width: 100%;
            padding: 0;
            margin: 0;
          }
        </style>
      </head>
      <body>
        ${el.innerHTML}
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.focus();
              window.print();
              window.close();
            }, 250);
          };
        </script>
      </body>
    </html>
  `);
  printWin.document.close();
}

// ============================================================================
// 1. CAMP OCCUPANCY SUMMARY STATUS (Matches Template 1 Layout)
// ============================================================================
export async function exportCampOccupancySummary(camps, occupants, leaveLogs, rtdLogs, meta = {}) {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Sheet1', {
    pageSetup: { paperSize: 9, orientation: 'portrait', fitToPage: true, fitToWidth: 1, fitToHeight: 1 }
  });

  const today = new Date();
  const todayFormatted = today.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }).replace(/ /g, '/');
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const yesterdayFormatted = yesterday.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }).replace(/ /g, '-');

  ws.columns = [
    { width: 3 },  // A
    { width: 8 },  // B: Sr. No.
    { width: 28 }, // C: Accommodation No.
    { width: 18 }, // D: Total Capacity
    { width: 22 }, // E: Total Bed Space Occupied
    { width: 13 }, // F: Vacation
    { width: 13 }, // G: RTD
    { width: 16 }, // H: Remarks Pt 1
    { width: 16 }  // I: Remarks Pt 2
  ];

  await addLogoToWorkbook(wb, ws, { col: 1.1, row: 0.2 }, { width: 95, height: 42 });

  ws.mergeCells('C1:H1');
  const titleCell = ws.getCell('C1');
  titleCell.value = 'CAMP OCCUPANCY SUMMARY STATUS';
  titleCell.font = { name: 'Calibri', size: 14, bold: true };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getRow(1).height = 36;

  ws.getCell('G2').value = 'Date:';
  ws.getCell('G2').font = { name: 'Calibri', size: 11, bold: true };
  ws.getCell('G2').alignment = { horizontal: 'right', vertical: 'middle' };

  ws.mergeCells('H2:I2');
  ws.getCell('H2').value = meta.date || todayFormatted;
  ws.getCell('H2').font = { name: 'Calibri', size: 11, bold: true };
  ws.getCell('H2').alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getCell('H2').border = thinBorder;
  ws.getCell('I2').border = thinBorder;

  ws.getRow(4).height = 32;
  ws.mergeCells('H4:I4');
  const headers = [
    { cell: 'B4', text: 'Sr. No.' },
    { cell: 'C4', text: 'Accommodation No.' },
    { cell: 'D4', text: 'Total Capacity\n[No. of Beds]' },
    { cell: 'E4', text: `Total Bed Space\nOccupied as on ${yesterdayFormatted}` },
    { cell: 'F4', text: 'Vacation' },
    { cell: 'G4', text: 'RTD' },
    { cell: 'H4', text: 'Remarks' }
  ];

  headers.forEach(h => {
    const c = ws.getCell(h.cell);
    c.value = h.text;
    c.font = { name: 'Calibri', size: 10, bold: true };
    c.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    c.fill = headerFill;
  });
  ['B4', 'C4', 'D4', 'E4', 'F4', 'G4', 'H4', 'I4'].forEach(ref => {
    ws.getCell(ref).border = thinBorder;
  });

  const totalGridRows = Math.max(34, camps.length);
  for (let i = 0; i < totalGridRows; i++) {
    const rIdx = 5 + i;
    ws.getRow(rIdx).height = 18;
    ws.mergeCells(`H${rIdx}:I${rIdx}`);

    const camp = camps[i];
    if (camp) {
      let cap = 0;
      camp.floors.forEach(fl => fl.flats.forEach(ft => ft.rooms.forEach(rm => { cap += rm.capacity; })));
      const inCamp = occupants.filter(o => o.campNo === camp.campNo);
      const onJob = inCamp.filter(o => o.employeeStatus === 'On Job').length;
      const onLeave = inCamp.filter(o => o.employeeStatus === 'On Leave').length;
      const rtdCount = rtdLogs.filter(r => r.vacatedCampNo === camp.campNo).length;

      ws.getCell(`B${rIdx}`).value = i + 1;
      ws.getCell(`C${rIdx}`).value = `${camp.campNo} (${camp.campArea})`;
      ws.getCell(`D${rIdx}`).value = cap;
      ws.getCell(`E${rIdx}`).value = onJob + onLeave;
      ws.getCell(`F${rIdx}`).value = onLeave;
      ws.getCell(`G${rIdx}`).value = rtdCount;
      ws.getCell(`H${rIdx}`).value = `${cap - (onJob + onLeave)} Beds Vacant`;
    }

    ['B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'].forEach(col => {
      const cell = ws.getCell(`${col}${rIdx}`);
      cell.border = thinBorder;
      cell.font = { name: 'Calibri', size: 10 };
      cell.alignment = {
        horizontal: col === 'C' || col === 'H' ? 'left' : 'center',
        vertical: 'middle'
      };
    });
  }

  const footerStart = 5 + totalGridRows;

  const rInspHdr = footerStart;
  ws.mergeCells(`B${rInspHdr}:I${rInspHdr}`);
  ws.getCell(`B${rInspHdr}`).value = 'Inspection Details';
  ws.getCell(`B${rInspHdr}`).font = { name: 'Calibri', size: 11, bold: true };
  ws.getCell(`B${rInspHdr}`).fill = headerFill;
  ['B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'].forEach(c => { ws.getCell(`${c}${rInspHdr}`).border = thinBorder; });

  const rInsp1 = footerStart + 1;
  ws.mergeCells(`B${rInsp1}:C${rInsp1}`);
  ws.mergeCells(`D${rInsp1}:E${rInsp1}`);
  ws.mergeCells(`G${rInsp1}:I${rInsp1}`);
  ws.getCell(`B${rInsp1}`).value = 'Type of Inspection:';
  ws.getCell(`B${rInsp1}`).font = { name: 'Calibri', size: 10, bold: true };
  ws.getCell(`D${rInsp1}`).value = meta.inspectionType || 'Weekly Routine Inspection';
  ws.getCell(`F${rInsp1}`).value = 'Conducted at:';
  ws.getCell(`F${rInsp1}`).font = { name: 'Calibri', size: 10, bold: true };
  ws.getCell(`G${rInsp1}`).value = meta.conductedAt || 'All Active Camp Facilities';
  ['B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'].forEach(c => { ws.getCell(`${c}${rInsp1}`).border = thinBorder; });

  const rInsp2 = footerStart + 2;
  ws.mergeCells(`B${rInsp2}:C${rInsp2}`);
  ws.mergeCells(`D${rInsp2}:I${rInsp2}`);
  ws.getCell(`B${rInsp2}`).value = "Camp Boss's Weekly Inspection conducted at:";
  ws.getCell(`B${rInsp2}`).font = { name: 'Calibri', size: 10, bold: true };
  ws.getCell(`D${rInsp2}`).value = todayFormatted;
  ['B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'].forEach(c => { ws.getCell(`${c}${rInsp2}`).border = thinBorder; });

  const rAppHdr = footerStart + 4;
  ws.mergeCells(`B${rAppHdr}:I${rAppHdr}`);
  ws.getCell(`B${rAppHdr}`).value = "Accommodation Department Head's approval";
  ws.getCell(`B${rAppHdr}`).font = { name: 'Calibri', size: 11, bold: true };
  ws.getCell(`B${rAppHdr}`).fill = headerFill;
  ['B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'].forEach(c => { ws.getCell(`${c}${rAppHdr}`).border = thinBorder; });

  const rRem = footerStart + 5;
  ws.mergeCells(`B${rRem}:I${rRem}`);
  ws.getCell(`B${rRem}`).value = `Remarks: ${meta.remarks || 'Regular accommodation operations compliant and inspected.'}`;
  ws.getCell(`B${rRem}`).font = { name: 'Calibri', size: 10 };
  ['B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'].forEach(c => { ws.getCell(`${c}${rRem}`).border = thinBorder; });

  const rSign = footerStart + 6;
  ws.mergeCells(`C${rSign}:D${rSign}`);
  ws.mergeCells(`F${rSign}:G${rSign}`);
  ws.getCell(`B${rSign}`).value = 'Name:';
  ws.getCell(`B${rSign}`).font = { name: 'Calibri', size: 10, bold: true };
  ws.getCell(`C${rSign}`).value = meta.approverName || 'Mohamed Bayoumi';
  ws.getCell(`E${rSign}`).value = 'Signature:';
  ws.getCell(`E${rSign}`).font = { name: 'Calibri', size: 10, bold: true };
  ws.getCell(`F${rSign}`).value = '';
  ws.getCell(`H${rSign}`).value = 'Date:';
  ws.getCell(`H${rSign}`).font = { name: 'Calibri', size: 10, bold: true };
  ws.getCell(`I${rSign}`).value = todayFormatted;
  ['B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'].forEach(c => { ws.getCell(`${c}${rSign}`).border = thinBorder; });

  const isoDate = today.toISOString().split('T')[0];
  await downloadWorkbook(wb, `Camp Occupancy Summary Status - ${isoDate}.xlsx`);
}

// ============================================================================
// 2. DAILY OCCUPANCY REPORT
// ============================================================================
export async function exportDailyOccupancyReport(activeCamp, occupants, meta = {}) {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Sheet1', {
    pageSetup: { paperSize: 9, orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 1 }
  });

  const todayStr = new Date().toISOString().split('T')[0];
  const campOccupants = occupants.filter(o => o.campNo === activeCamp?.campNo);

  ws.columns = [
    { width: 8 },  // A: Sr. No.
    { width: 14 }, // B: Code*
    { width: 26 }, // C: Name
    { width: 20 }, // D: Designation
    { width: 18 }, // E: Project/Dept No.
    { width: 14 }, // F: Room No.
    { width: 14 }, // G: Status
    { width: 14 }, // H: Arrival
    { width: 14 }, // I: Leaving
    { width: 18 }  // J: Entered by
  ];

  await addLogoToWorkbook(wb, ws, { col: 0.2, row: 0.1 }, { width: 90, height: 38 });

  ws.mergeCells('C1:H1');
  ws.getCell('C1').value = 'DAILY OCCUPANCY REPORT';
  ws.getCell('C1').font = { name: 'Calibri', size: 14, bold: true };
  ws.getCell('C1').alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getRow(1).height = 32;

  ws.mergeCells('A2:B2');
  ws.getCell('A2').value = `Accommodation No.: ${activeCamp?.campNo || 'CAMP-01'}`;
  ws.getCell('A2').font = { name: 'Calibri', size: 11, bold: true };

  ws.mergeCells('G2:J2');
  ws.getCell('G2').value = `Area: ${activeCamp?.campArea || 'Farwaniya'}`;
  ws.getCell('G2').font = { name: 'Calibri', size: 11, bold: true };

  ws.mergeCells('A3:A4');
  ws.mergeCells('B3:E3');
  ws.mergeCells('F3:G3');
  ws.mergeCells('H3:I3');
  ws.mergeCells('J3:J4');

  ws.getCell('A3').value = 'Sr. No.';
  ws.getCell('B3').value = 'Employee';
  ws.getCell('F3').value = 'Occupancy';
  ws.getCell('H3').value = 'Date';
  ws.getCell('J3').value = 'Entered by';

  const subHeaders = [
    { col: 'B', text: 'Code*' },
    { col: 'C', text: 'Name' },
    { col: 'D', text: 'Designation' },
    { col: 'E', text: 'Project/ Dept. No.' },
    { col: 'F', text: 'Room No.' },
    { col: 'G', text: 'Status' },
    { col: 'H', text: 'Arrival' },
    { col: 'I', text: 'Leaving' }
  ];
  subHeaders.forEach(sh => {
    ws.getCell(`${sh.col}4`).value = sh.text;
  });

  [3, 4].forEach(r => {
    ws.getRow(r).height = 20;
    ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'].forEach(col => {
      const c = ws.getCell(`${col}${r}`);
      c.font = { name: 'Calibri', size: 10, bold: true };
      c.alignment = { horizontal: 'center', vertical: 'middle' };
      c.fill = headerFill;
      c.border = thinBorder;
    });
  });

  const totalRows = Math.max(22, campOccupants.length);
  for (let i = 0; i < totalRows; i++) {
    const rIdx = 5 + i;
    ws.getRow(rIdx).height = 18;
    const occ = campOccupants[i];

    if (occ) {
      ws.getCell(`A${rIdx}`).value = i + 1;
      ws.getCell(`B${rIdx}`).value = occ.employeeId;
      ws.getCell(`C${rIdx}`).value = occ.employeeName;
      ws.getCell(`D${rIdx}`).value = occ.title;
      ws.getCell(`E${rIdx}`).value = occ.costCenter;
      ws.getCell(`F${rIdx}`).value = occ.roomNo;
      ws.getCell(`G${rIdx}`).value = occ.employeeStatus;
      ws.getCell(`H${rIdx}`).value = occ.entryDate;
      ws.getCell(`I${rIdx}`).value = occ.exitDate || '-';
      ws.getCell(`J${rIdx}`).value = meta.enteredBy || 'Camp Coordinator';
    }

    ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'].forEach(col => {
      const cell = ws.getCell(`${col}${rIdx}`);
      cell.border = thinBorder;
      cell.font = { name: 'Calibri', size: 10 };
      cell.alignment = { horizontal: col === 'C' || col === 'D' ? 'left' : 'center', vertical: 'middle' };
    });
  }

  const noteRow = 5 + totalRows + 1;
  ws.mergeCells(`A${noteRow}:J${noteRow}`);
  ws.getCell(`A${noteRow}`).value = 'Note: * - Employee code refers herein Al Dhow ID No, Civil ID No. and Passport No.';
  ws.getCell(`A${noteRow}`).font = { name: 'Calibri', size: 9, italic: true };

  await downloadWorkbook(wb, `Daily Occupancy Report - ${activeCamp?.campNo || 'CAMP'} - ${todayStr}.xlsx`);
}

// ============================================================================
// 3. MATERIAL ISSUANCE FORM (Doc. Ref: 150-04)
// ============================================================================
export async function exportMaterialIssuanceForm(occ, arrivalType = 'Local Residency Transfer', meta = {}) {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('150-04', {
    pageSetup: { paperSize: 9, orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 1 }
  });

  const todayStr = new Date().toISOString().split('T')[0];
  const docRefNo = meta.docRef || occ.afrEntryRef || occ.afrLogNo || '150-04';
  const matIssued = meta.materials || occ.materialsIssued || {
    mattress: true,
    pillow: true,
    bedsheet: true,
    blanket: true
  };

  ws.columns = [
    { width: 3 },  // A
    { width: 16 }, // B
    { width: 16 }, // C
    { width: 24 }, // D
    { width: 15 }, // E
    { width: 22 }, // F
    { width: 18 }, // G
    { width: 16 }, // H
    { width: 16 }  // I
  ];

  await addLogoToWorkbook(wb, ws, { col: 1.1, row: 0.2 }, { width: 95, height: 40 });

  ws.mergeCells('C1:G1');
  ws.getCell('C1').value = 'EMPLOYEE NEW ARRIVAL - MATERIAL ISSUANCE FORM';
  ws.getCell('C1').font = { name: 'Calibri', size: 13, bold: true };
  ws.getCell('C1').alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getCell('H1').value = `Doc. Ref.: ${docRefNo}`;
  ws.getCell('H1').font = { name: 'Calibri', size: 10, bold: true };
  ws.getCell('I1').value = `Date: ${todayStr}`;
  ws.getCell('I1').font = { name: 'Calibri', size: 10, bold: true };
  ws.getRow(1).height = 35;

  ws.getCell('B3').value = 'Employee Details:';
  ws.getCell('B3').font = { name: 'Calibri', size: 10, bold: true };
  ws.getCell('D3').value = `Arrival Type:   [${arrivalType === 'Overseas' ? 'X' : ' '}] Overseas     [${arrivalType !== 'Overseas' ? 'X' : ' '}] Local Residency / Camp Shift`;
  ws.getCell('D3').font = { name: 'Calibri', size: 10, bold: true };
  ws.getCell('H3').value = `Arrival Date: ${occ.entryDate || todayStr}`;
  ws.getCell('H3').font = { name: 'Calibri', size: 10, bold: true };

  const empHeaders = [
    { col: 'B', text: 'Project / Dept. No.' },
    { col: 'C', text: 'Emp. Code' },
    { col: 'D', text: 'Name' },
    { col: 'E', text: 'Nationality' },
    { col: 'F', text: 'Passport / Civil ID No.' },
    { col: 'G', text: 'Designation' },
    { col: 'H', text: 'Assigned Camp No.' },
    { col: 'I', text: 'Assigned Room No.' }
  ];
  empHeaders.forEach(h => {
    const cell = ws.getCell(`${h.col}5`);
    cell.value = h.text;
    cell.font = { name: 'Calibri', size: 10, bold: true };
    cell.fill = headerFill;
    cell.border = thinBorder;
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
  });

  const empVals = [
    { col: 'B', val: occ.costCenter },
    { col: 'C', val: occ.employeeId },
    { col: 'D', val: occ.employeeName },
    { col: 'E', val: occ.nationality },
    { col: 'F', val: `${occ.passportNo || ''} / ${occ.civilId || ''}` },
    { col: 'G', val: `${occ.title || ''} (${occ.roomGrade || 'Manual'})` },
    { col: 'H', val: occ.campNo },
    { col: 'I', val: occ.roomNo }
  ];
  empVals.forEach(v => {
    const cell = ws.getCell(`${v.col}6`);
    cell.value = v.val;
    cell.font = { name: 'Calibri', size: 10 };
    cell.border = thinBorder;
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
  });

  ws.mergeCells('C8:D8');
  ws.mergeCells('G8:I8');
  ws.getCell('B8').value = 'Sl. No.';
  ws.getCell('C8').value = 'List of Materials';
  ws.getCell('E8').value = 'Issued (YES)';
  ws.getCell('F8').value = 'Issued (NO)';
  ws.getCell('G8').value = 'Accommodation Request Ref. No. & Date';
  ['B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'].forEach(c => {
    const cell = ws.getCell(`${c}8`);
    cell.font = { name: 'Calibri', size: 10, bold: true };
    cell.fill = headerFill;
    cell.border = thinBorder;
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
  });

  const materials = [
    { name: 'Mattress', isIssued: matIssued.mattress !== false },
    { name: 'Pillow', isIssued: matIssued.pillow !== false },
    { name: 'Bedsheet', isIssued: matIssued.bedsheet !== false },
    { name: 'Blanket', isIssued: matIssued.blanket !== false }
  ];
  materials.forEach((mat, idx) => {
    const r = 9 + idx;
    ws.mergeCells(`C${r}:D${r}`);
    ws.mergeCells(`G${r}:I${r}`);
    ws.getCell(`B${r}`).value = idx + 1;
    ws.getCell(`C${r}`).value = mat.name;
    ws.getCell(`E${r}`).value = mat.isIssued ? 'YES (1)' : '-';
    ws.getCell(`F${r}`).value = mat.isIssued ? '-' : 'NO';
    ws.getCell(`G${r}`).value = idx === 0 ? `${docRefNo} (${occ.entryDate || todayStr})` : '';
    ['B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'].forEach(c => {
      const cell = ws.getCell(`${c}${r}`);
      cell.border = thinBorder;
      cell.font = { name: 'Calibri', size: 10 };
      cell.alignment = { horizontal: c === 'C' ? 'left' : 'center', vertical: 'middle' };
    });
  });

  ws.mergeCells('B14:I14');
  ws.getCell('B14').value = 'Note: Employee has to return the received items in case of vacating the accommodation.';
  ws.getCell('B14').font = { name: 'Calibri', size: 10, bold: true, italic: true };

  ws.mergeCells('C16:D16');
  ws.mergeCells('E16:F16');
  ws.mergeCells('G16:I16');
  ws.getCell('C16').value = 'Requested by (Employee)';
  ws.getCell('E16').value = 'Issued by (Camp Boss)';
  ws.getCell('G16').value = 'Approved by (Accommodation Head)';
  ['B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'].forEach(c => {
    ws.getCell(`${c}16`).font = { name: 'Calibri', size: 10, bold: true };
    ws.getCell(`${c}16`).fill = headerFill;
    ws.getCell(`${c}16`).border = thinBorder;
  });

  const signRows = [
    { r: 17, label: 'Name:', c1: occ.employeeName, c2: meta.issuedByName || 'Camp Supervisor', c3: meta.approvedByName || 'Mohamed Bayoumi' },
    { r: 18, label: 'Designation:', c1: occ.title, c2: 'Camp Boss', c3: 'Accommodation Dept Head' },
    { r: 19, label: 'Signature & Date:', c1: todayStr, c2: todayStr, c3: todayStr }
  ];
  signRows.forEach(sr => {
    ws.mergeCells(`C${sr.r}:D${sr.r}`);
    ws.mergeCells(`E${sr.r}:F${sr.r}`);
    ws.mergeCells(`G${sr.r}:I${sr.r}`);
    ws.getCell(`B${sr.r}`).value = sr.label;
    ws.getCell(`B${sr.r}`).font = { name: 'Calibri', size: 10, bold: true };
    ws.getCell(`C${sr.r}`).value = sr.c1;
    ws.getCell(`E${sr.r}`).value = sr.c2;
    ws.getCell(`G${sr.r}`).value = sr.c3;
    ['B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'].forEach(c => { ws.getCell(`${c}${sr.r}`).border = thinBorder; });
  });

  await downloadWorkbook(wb, `Material Issuance Form - ${occ.employeeId} - ${occ.employeeName}.xlsx`);
}

// ============================================================================
// 4. OCCUPANTS RELOCATION FORM
// ============================================================================
export async function exportOccupantsRelocationForm(relocationRecords, meta = {}) {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Sheet1', {
    pageSetup: { paperSize: 9, orientation: 'portrait', fitToPage: true, fitToWidth: 1, fitToHeight: 1 }
  });

  const todayStr = new Date().toISOString().split('T')[0];
  const list = Array.isArray(relocationRecords) ? relocationRecords : [relocationRecords];

  ws.columns = [
    { width: 3 },  // A
    { width: 8 },  // B: Sr. No.
    { width: 14 }, // C: Employee ID
    { width: 26 }, // D: Employee Name
    { width: 18 }, // E: Designation
    { width: 16 }, // F: From
    { width: 16 }, // G: To
    { width: 16 }, // H: Date of Relocation
    { width: 24 }  // I: Remarks / Doc Ref
  ];

  await addLogoToWorkbook(wb, ws, { col: 1.1, row: 0.2 }, { width: 95, height: 40 });

  ws.mergeCells('C1:I1');
  ws.getCell('C1').value = 'OCCUPANTS RELOCATION FORM';
  ws.getCell('C1').font = { name: 'Calibri', size: 14, bold: true };
  ws.getCell('C1').alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getRow(1).height = 35;

  const headers = [
    { col: 'B', text: 'Sr. No.' },
    { col: 'C', text: 'Employee ID' },
    { col: 'D', text: 'Employee Name' },
    { col: 'E', text: 'Designation' },
    { col: 'F', text: 'From' },
    { col: 'G', text: 'To' },
    { col: 'H', text: 'Date of Relocation' },
    { col: 'I', text: 'Remarks & Doc. Ref #' }
  ];
  ws.getRow(3).height = 24;
  headers.forEach(h => {
    const c = ws.getCell(`${h.col}3`);
    c.value = h.text;
    c.font = { name: 'Calibri', size: 10, bold: true };
    c.fill = headerFill;
    c.border = thinBorder;
    c.alignment = { horizontal: 'center', vertical: 'middle' };
  });

  const totalRows = Math.max(24, list.length);
  for (let i = 0; i < totalRows; i++) {
    const r = 4 + i;
    ws.getRow(r).height = 18;
    const rec = list[i];
    if (rec) {
      const refText = rec.docRef ? `[Ref: ${rec.docRef}] ` : '';
      ws.getCell(`B${r}`).value = i + 1;
      ws.getCell(`C${r}`).value = rec.employeeId;
      ws.getCell(`D${r}`).value = rec.employeeName;
      ws.getCell(`E${r}`).value = rec.title || 'Staff';
      ws.getCell(`F${r}`).value = rec.fromRoom || rec.oldRoomNo;
      ws.getCell(`G${r}`).value = rec.toRoom || rec.newRoomNo;
      ws.getCell(`H${r}`).value = rec.relocationDate || todayStr;
      ws.getCell(`I${r}`).value = `${refText}${rec.reason || 'Camp Reallocation'}`;
    }
    ['B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'].forEach(col => {
      const cell = ws.getCell(`${col}${r}`);
      cell.border = thinBorder;
      cell.font = { name: 'Calibri', size: 10 };
      cell.alignment = { horizontal: col === 'D' || col === 'I' ? 'left' : 'center', vertical: 'middle' };
    });
  }

  const fStart = 4 + totalRows + 1;
  ws.mergeCells(`C${fStart}:D${fStart}`);
  ws.mergeCells(`E${fStart}:F${fStart}`);
  ws.mergeCells(`G${fStart}:I${fStart}`);
  ws.getCell(`C${fStart}`).value = 'Prepared by';
  ws.getCell(`E${fStart}`).value = 'Reviewed by';
  ws.getCell(`G${fStart}`).value = 'Approved by';
  ['B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'].forEach(c => {
    ws.getCell(`${c}${fStart}`).font = { name: 'Calibri', size: 10, bold: true };
    ws.getCell(`${c}${fStart}`).fill = headerFill;
    ws.getCell(`${c}${fStart}`).border = thinBorder;
  });

  const sRows = [
    { offset: 1, label: 'Name:', c1: meta.preparedByName || 'Camp Supervisor', c2: 'Project Coordinator', c3: 'Mohamed Bayoumi' },
    { offset: 2, label: 'Designation:', c1: 'Camp Admin', c2: 'Site Engineer', c3: 'Accommodation Head' },
    { offset: 3, label: 'Signature:', c1: '', c2: '', c3: '' },
    { offset: 4, label: 'Date:', c1: todayStr, c2: todayStr, c3: todayStr }
  ];
  sRows.forEach(sr => {
    const r = fStart + sr.offset;
    ws.mergeCells(`C${r}:D${r}`);
    ws.mergeCells(`E${r}:F${r}`);
    ws.mergeCells(`G${r}:I${r}`);
    ws.getCell(`B${r}`).value = sr.label;
    ws.getCell(`B${r}`).font = { name: 'Calibri', size: 10, bold: true };
    ws.getCell(`C${r}`).value = sr.c1;
    ws.getCell(`E${r}`).value = sr.c2;
    ws.getCell(`G${r}`).value = sr.c3;
    ['B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'].forEach(c => { ws.getCell(`${c}${r}`).border = thinBorder; });
  });

  await downloadWorkbook(wb, `Occupants Relocation Form - ${todayStr}.xlsx`);
}

// ============================================================================
// 5. ACCOMMODATION MISCONDUCT REPORT
// ============================================================================
export async function exportAccommodationMisconductReport(incident) {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Sheet1', {
    pageSetup: { paperSize: 9, orientation: 'portrait', fitToPage: true, fitToWidth: 1, fitToHeight: 1 }
  });

  const todayStr = new Date().toISOString().split('T')[0];

  ws.columns = [
    { width: 3 },  // A
    { width: 22 }, // B
    { width: 26 }, // C
    { width: 18 }, // D
    { width: 24 }  // E
  ];

  await addLogoToWorkbook(wb, ws, { col: 1.1, row: 0.2 }, { width: 95, height: 40 });

  ws.mergeCells('C1:E1');
  ws.getCell('C1').value = 'ACCOMMODATION MISCONDUCT REPORT';
  ws.getCell('C1').font = { name: 'Calibri', size: 14, bold: true };
  ws.getCell('C1').alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getRow(1).height = 35;

  ws.mergeCells('B2:E2');
  ws.getCell('B2').value = 'Details of Offence';
  ws.getCell('B2').font = { name: 'Calibri', size: 11, bold: true };
  ws.getCell('B2').fill = headerFill;
  ['B', 'C', 'D', 'E'].forEach(c => { ws.getCell(`${c}2`).border = thinBorder; });

  const offenceRows = [
    ['Accommodation No.:', incident.campNo, 'Date:', incident.incidentDate || todayStr],
    ['Location of Offence:', incident.incidentLocation || incident.location, 'Time:', incident.incidentTime || '14:00'],
    ['Name of Offender:', incident.employeeName, 'ID No.:', incident.employeeId],
    ['Designation:', incident.title || 'Worker', 'Div./ Dept./ Proj.:', `${incident.division} / ${incident.costCenter}`],
    ['Room No.:', incident.roomNo, 'Contact No.:', incident.contactNo || '+965']
  ];

  offenceRows.forEach((rowVals, idx) => {
    const r = 3 + idx;
    ws.getRow(r).height = 20;
    ws.getCell(`B${r}`).value = rowVals[0];
    ws.getCell(`B${r}`).font = { name: 'Calibri', size: 10, bold: true };
    ws.getCell(`C${r}`).value = rowVals[1];
    ws.getCell(`D${r}`).value = rowVals[2];
    ws.getCell(`D${r}`).font = { name: 'Calibri', size: 10, bold: true };
    ws.getCell(`E${r}`).value = rowVals[3];
    ['B', 'C', 'D', 'E'].forEach(c => { ws.getCell(`${c}${r}`).border = thinBorder; });
  });

  ws.mergeCells('B9:E9');
  ws.getCell('B9').value = 'Brief Description of Offence';
  ws.getCell('B9').font = { name: 'Calibri', size: 11, bold: true };
  ws.getCell('B9').fill = headerFill;
  ['B', 'C', 'D', 'E'].forEach(c => { ws.getCell(`${c}9`).border = thinBorder; });

  ws.mergeCells('B10:E12');
  ws.getCell('B10').value = incident.description || 'Violation of camp safety and residential regulations.';
  ws.getCell('B10').alignment = { horizontal: 'left', vertical: 'top', wrapText: true };
  for (let r = 10; r <= 12; r++) {
    ['B', 'C', 'D', 'E'].forEach(c => { ws.getCell(`${c}${r}`).border = thinBorder; });
  }

  ws.mergeCells('B14:E14');
  ws.getCell('B14').value = 'Witness (if available)';
  ws.getCell('B14').font = { name: 'Calibri', size: 11, bold: true };
  ws.getCell('B14').fill = headerFill;
  ['B', 'C', 'D', 'E'].forEach(c => { ws.getCell(`${c}14`).border = thinBorder; });

  const wHeaders = [
    { col: 'B', text: 'Witness Name' },
    { col: 'C', text: 'ID No.' },
    { col: 'D', text: 'Room No.' },
    { col: 'E', text: 'Contact No.' }
  ];
  wHeaders.forEach(wh => {
    const c = ws.getCell(`${wh.col}15`);
    c.value = wh.text;
    c.font = { name: 'Calibri', size: 10, bold: true };
    c.border = thinBorder;
  });

  ws.getCell('B16').value = incident.witnessName || 'N/A';
  ws.getCell('C16').value = incident.witnessId || 'N/A';
  ws.getCell('D16').value = incident.witnessRoom || 'N/A';
  ws.getCell('E16').value = incident.witnessPhone || '+965';
  ['B', 'C', 'D', 'E'].forEach(c => { ws.getCell(`${c}16`).border = thinBorder; });

  const depts = [
    { r: 18, title: 'Submitted by (Camp Supervisor):', name: incident.reportedBy || 'Camp Supervisor' },
    { r: 21, title: 'Recommendation - Accommodation Department:', name: 'Mohamed Bayoumi' },
    { r: 24, title: 'Recommendation - Division / Project Department:', name: 'Project Site Manager' },
    { r: 27, title: 'Action Taken - Human Resources Department:', name: 'HR Disciplinary Committee' }
  ];

  depts.forEach(d => {
    ws.mergeCells(`B${d.r}:E${d.r}`);
    ws.getCell(`B${d.r}`).value = d.title;
    ws.getCell(`B${d.r}`).font = { name: 'Calibri', size: 10, bold: true };
    ws.getCell(`B${d.r}`).fill = headerFill;
    ['B', 'C', 'D', 'E'].forEach(c => { ws.getCell(`${c}${d.r}`).border = thinBorder; });

    const nr = d.r + 1;
    ws.getCell(`B${nr}`).value = `Name: ${d.name}`;
    ws.getCell(`C${nr}`).value = 'Signature: ________________';
    ws.getCell(`D${nr}`).value = 'Date:';
    ws.getCell(`E${nr}`).value = todayStr;
    ['B', 'C', 'D', 'E'].forEach(c => { ws.getCell(`${c}${nr}`).border = thinBorder; });
  });

  await downloadWorkbook(wb, `Accommodation Misconduct Report - ${incident.employeeId} - ${todayStr}.xlsx`);
}

// ============================================================================
// 6. MISCONDUCT REPORT LOG
// ============================================================================
export async function exportMisconductLog(misconductLogs) {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Sheet-1', {
    pageSetup: { paperSize: 9, orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 1 }
  });

  const todayStr = new Date().toISOString().split('T')[0];

  ws.columns = [
    { width: 8 },  // A: Sl N.
    { width: 12 }, // B: ID
    { width: 24 }, // C: Name
    { width: 18 }, // D: Designation
    { width: 15 }, // E: Incident Date
    { width: 24 }, // F: Incident Location
    { width: 28 }, // G: Type of Violation
    { width: 16 }, // H: Doc Ref
    { width: 16 }, // I: Cost Center
    { width: 24 }  // J: Remarks
  ];

  await addLogoToWorkbook(wb, ws, { col: 0.2, row: 0.1 }, { width: 90, height: 38 });

  ws.mergeCells('C1:J1');
  ws.getCell('C1').value = 'EMPLOYEE DISCIPLINARY ACTION LOG';
  ws.getCell('C1').font = { name: 'Calibri', size: 14, bold: true };
  ws.getCell('C1').alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getRow(1).height = 34;

  const headers = ['Sl N.', 'ID', 'Name', 'Designation', 'Incident Date', 'Incident Location', 'Type of Violation', 'Doc Ref', 'Cost Center', 'Remarks'];
  ws.getRow(2).height = 24;
  headers.forEach((h, i) => {
    const col = String.fromCharCode(65 + i);
    const cell = ws.getCell(`${col}2`);
    cell.value = h;
    cell.font = { name: 'Calibri', size: 10, bold: true };
    cell.fill = headerFill;
    cell.border = thinBorder;
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
  });

  const totalRows = Math.max(20, misconductLogs.length);
  for (let i = 0; i < totalRows; i++) {
    const r = 3 + i;
    ws.getRow(r).height = 18;
    const item = misconductLogs[i];
    if (item) {
      ws.getCell(`A${r}`).value = i + 1;
      ws.getCell(`B${r}`).value = item.employeeId;
      ws.getCell(`C${r}`).value = item.employeeName;
      ws.getCell(`D${r}`).value = item.title || 'Staff';
      ws.getCell(`E${r}`).value = item.incidentDate;
      ws.getCell(`F${r}`).value = item.incidentLocation;
      ws.getCell(`G${r}`).value = item.typeOfViolation;
      ws.getCell(`H${r}`).value = item.docRef || `DISC-${item.employeeId}`;
      ws.getCell(`I${r}`).value = item.costCenter;
      ws.getCell(`J${r}`).value = item.remarks;
    }
    ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'].forEach(col => {
      const c = ws.getCell(`${col}${r}`);
      c.border = thinBorder;
      c.font = { name: 'Calibri', size: 10 };
    });
  }

  await downloadWorkbook(wb, `Accommodation Misconduct Report Log - ${todayStr}.xlsx`);
}

// ============================================================================
// 7. MAINTENANCE LOG
// ============================================================================
export async function exportMaintenanceLog(maintenanceRecords) {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Complaint report', {
    pageSetup: { paperSize: 9, orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 1 }
  });

  const todayStr = new Date().toISOString().split('T')[0];

  const headers = [
    { text: 'Uni.ID', width: 10 },
    { text: 'Date', width: 13 },
    { text: 'Month', width: 12 },
    { text: 'Maintenance Issue Details', width: 30 },
    { text: 'Issue Reported by Emp. ID#', width: 16 },
    { text: 'Employee Name', width: 22 },
    { text: 'Floor', width: 8 },
    { text: 'Flat', width: 14 },
    { text: 'Room', width: 14 },
    { text: 'Area / Facility', width: 18 },
    { text: 'Inspected by', width: 18 },
    { text: 'Action Taken by', width: 18 },
    { text: 'Status (Pending/Completed)', width: 18 },
    { text: 'Replaced Material Cost', width: 16 },
    { text: 'Charge to Emp. ID#', width: 16 },
    { text: 'Remarks', width: 22 }
  ];

  ws.columns = headers.map(h => ({ width: h.width }));

  await addLogoToWorkbook(wb, ws, { col: 0.2, row: 0.1 }, { width: 90, height: 38 });

  ws.mergeCells('C1:P1');
  ws.getCell('C1').value = 'Accommodation Maintenance log';
  ws.getCell('C1').font = { name: 'Calibri', size: 14, bold: true };
  ws.getCell('C1').alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getRow(1).height = 34;

  ws.getRow(3).height = 26;
  headers.forEach((h, i) => {
    const col = String.fromCharCode(65 + i);
    const cell = ws.getCell(`${col}3`);
    cell.value = h.text;
    cell.font = { name: 'Calibri', size: 9, bold: true };
    cell.fill = headerFill;
    cell.border = thinBorder;
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
  });

  const totalRows = Math.max(20, maintenanceRecords.length);
  for (let i = 0; i < totalRows; i++) {
    const r = 4 + i;
    ws.getRow(r).height = 18;
    const item = maintenanceRecords[i];
    if (item) {
      const vals = [
        item.id, item.date, item.month, item.issueDetails, item.reportedByEmpId,
        item.employeeName, item.floorNo, item.flatCode, item.roomNo,
        item.areaFacility || 'Bedroom AC', item.inspectedBy, item.actionTakenBy,
        item.status, item.replacedMaterialCost || '0.000', item.chargeToEmpId || 'N/A', item.remarks
      ];
      vals.forEach((v, idx) => {
        const col = String.fromCharCode(65 + idx);
        ws.getCell(`${col}${r}`).value = v;
      });
    }
    for (let idx = 0; idx < 16; idx++) {
      const col = String.fromCharCode(65 + idx);
      const cell = ws.getCell(`${col}${r}`);
      cell.border = thinBorder;
      cell.font = { name: 'Calibri', size: 9 };
    }
  }

  await downloadWorkbook(wb, `Accommodation Maintenance Log - ${todayStr}.xlsx`);
}