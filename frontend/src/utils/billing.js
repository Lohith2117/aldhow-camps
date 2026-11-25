// Billing helpers: turn an employee's stays and cost-centre history into dated pieces,
// then price the pieces that fall in a given month. Pure functions, no React.

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

// '2026-11-05' or '2026-11-05T00:00:00.000Z' -> whole day number (UTC), so dates never drift by timezone
export const toDay = (v) => {
  if (!v) return null;
  const s = String(v).slice(0, 10);
  const [y, m, d] = s.split('-').map(Number);
  if (!y || !m || !d) return null;
  return Math.floor(Date.UTC(y, m - 1, d) / 86400000);
};

export const dayToIso = (day) => new Date(day * 86400000).toISOString().slice(0, 10);

export const parsePeriod = (period) => {
  const [monthName, yearStr] = String(period).split(' ');
  const monthIdx = MONTHS.indexOf(monthName);
  return { monthIdx, year: parseInt(yearStr, 10) };
};

export const periodLabel = (year, monthIdx) => `${MONTHS[monthIdx]} ${year}`;

// Room stays of one employee as inclusive day ranges. A stay ended on the day he moved,
// so that day belongs to the next stay (end date is not counted for a closed stay).
export const buildStays = (occ, todayDay) => {
  const stays = [];
  (occ.stayHistory || []).forEach(h => {
    const start = toDay(h.startDate);
    const endExclusive = toDay(h.endDate);
    if (start === null || endExclusive === null) return;
    const end = endExclusive - 1;
    if (end < start) return;
    stays.push({ start, end, campNo: h.campNo, roomNo: h.roomNo, grade: h.roomGrade || occ.roomGrade, cc: h.costCenter || occ.costCenter });
  });
  const live = ['On Job', 'On Leave'].includes(occ.employeeStatus) && occ.campNo && occ.campNo !== 'UNASSIGNED';
  const entry = toDay(occ.entryDate);
  if (live && entry !== null) {
    stays.push({ start: entry, end: todayDay, campNo: occ.campNo, roomNo: occ.roomNo, grade: occ.roomGrade, cc: occ.costCenter, active: true });
  }
  return stays;
};

// Cost-centre periods (inclusive day ranges). Empty when the employee never changed cost centre.
export const buildCostCenterPeriods = (occ) => {
  const hist = [...(occ.costCenterHistory || [])];
  if (hist.length === 0) return [];
  const periods = hist.map(h => ({ cc: h.costCenter, start: toDay(h.startDate), end: toDay(h.endDate) - 1 }));
  const lastEnd = toDay(hist[hist.length - 1].endDate);
  periods.push({ cc: occ.costCenter, start: lastEnd, end: Infinity });
  return periods;
};

// Pieces of one employee's stay, split where the cost centre changed.
export const buildPieces = (occ, todayDay) => {
  const periods = buildCostCenterPeriods(occ);
  const pieces = [];
  buildStays(occ, todayDay).forEach(stay => {
    if (periods.length === 0) { pieces.push(stay); return; }
    periods.forEach(p => {
      const start = Math.max(stay.start, p.start === null ? -Infinity : p.start);
      const end = Math.min(stay.end, p.end);
      if (start <= end) pieces.push({ ...stay, start, end, cc: p.cc });
    });
  });
  return pieces;
};

// What one employee costs in one month, per piece.
export const chargesForMonth = (occ, year, monthIdx, rates, todayDay) => {
  const daysInMonth = new Date(Date.UTC(year, monthIdx + 1, 0)).getUTCDate();
  const monthStart = Math.floor(Date.UTC(year, monthIdx, 1) / 86400000);
  const monthEnd = monthStart + daysInMonth - 1;
  const rows = [];
  buildPieces(occ, todayDay).forEach(p => {
    const start = Math.max(p.start, monthStart);
    const end = Math.min(p.end, monthEnd);
    if (start > end) return;
    const days = end - start + 1;
    const rateKwd = p.grade === 'Non-Manual' ? Number(rates.nonManual || 0) : Number(rates.manual || 0);
    rows.push({ cc: p.cc, roomNo: p.roomNo, campNo: p.campNo, grade: p.grade, days, daysInMonth, amountFils: Math.round((days / daysInMonth) * rateKwd * 1000), start, end });
  });
  return rows;
};

// Months (as [year, monthIdx]) from the employee's first stay to the current month.
export const monthsOfStay = (occ, todayDay) => {
  const pieces = buildPieces(occ, todayDay);
  if (pieces.length === 0) return [];
  const first = new Date(Math.min(...pieces.map(p => p.start)) * 86400000);
  const last = new Date(Math.max(...pieces.map(p => p.end)) * 86400000);
  const out = [];
  let y = first.getUTCFullYear(), m = first.getUTCMonth();
  while (y < last.getUTCFullYear() || (y === last.getUTCFullYear() && m <= last.getUTCMonth())) {
    out.push([y, m]);
    m += 1; if (m > 11) { m = 0; y += 1; }
  }
  return out;
};
