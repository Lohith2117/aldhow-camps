import React from 'react';
import { Printer, X } from 'lucide-react';
import dhowLogoImg from '../assets/dhow-logo.png';
import { EmployeePhoto } from './EmployeePhoto';
import { printFormattedElement } from '../utils/reportGenerators';
import { toDay, periodLabel, chargesForMonth, monthsOfStay } from '../utils/billing';

const d10 = (v) => (v ? String(v).slice(0, 10) : '');

function Section({ title, children }) {
  return (
    <div style={{ breakInside: 'avoid' }}>
      <div className="text-xs font-black uppercase tracking-wide border-b border-black pb-0.5 mb-1.5">{title}</div>
      {children}
    </div>
  );
}

function Empty({ text }) {
  return <p className="text-[11px] text-slate-500 italic">{text}</p>;
}

const th = 'border border-black p-1.5 bg-slate-100 text-center font-bold';
const td = 'border border-black p-1.5';

export default function OccupantHistoryModal({ occupant, leaveLogs = [], misconductLogs = [], maintenanceLogs = [], transferRequests = [], rtdLogs = [], rates, todayStr, onClose }) {
  const id = occupant.employeeId;
  const todayDay = toDay(todayStr);

  // Room and camp stays, oldest first, with the stay he is in now at the end
  const stays = [
    ...(occupant.stayHistory || []).map(h => ({ campNo: h.campNo, roomNo: h.roomNo, costCenter: h.costCenter, grade: h.roomGrade, from: d10(h.startDate), to: d10(h.endDate), reason: h.reason || '' })),
  ];
  const live = ['On Job', 'On Leave'].includes(occupant.employeeStatus) && occupant.campNo && occupant.campNo !== 'UNASSIGNED';
  if (live) stays.push({ campNo: occupant.campNo, roomNo: occupant.roomNo, costCenter: occupant.costCenter, grade: occupant.roomGrade, from: d10(occupant.entryDate), to: '', reason: 'Current room' });
  stays.sort((a, b) => a.from.localeCompare(b.from));

  // Cost centres, oldest first, with the current one at the end
  const ccRows = (occupant.costCenterHistory || []).map(h => ({ costCenter: h.costCenter, division: h.division, from: d10(h.startDate), to: d10(h.endDate), by: h.changedBy || '', reason: h.reason || '' }));
  const firstEntry = stays.length ? stays[0].from : d10(occupant.entryDate);
  const lastCcEnd = ccRows.length ? ccRows[ccRows.length - 1].to : firstEntry;
  ccRows.push({ costCenter: occupant.costCenter, division: occupant.division, from: lastCcEnd, to: '', by: '', reason: 'Current cost center' });

  const leaves = leaveLogs.filter(l => l.employeeId === id);
  const misconduct = misconductLogs.filter(m => m.employeeId === id);
  const maintenance = maintenanceLogs.filter(m => m.reportedByEmpId === id);
  const transfers = transferRequests.filter(t => t.employeeId === id);
  const exits = rtdLogs.filter(r => r.employeeId === id);

  // Monthly recharge statement for this employee, month by month
  const statement = [];
  monthsOfStay(occupant, todayDay).forEach(([y, m]) => {
    chargesForMonth(occupant, y, m, rates, todayDay).forEach(r => statement.push({ period: periodLabel(y, m), ...r }));
  });
  const statementTotal = statement.reduce((a, r) => a + r.amountFils, 0) / 1000;

  const statusText = occupant.employeeStatus === 'RTD - Others' ? 'Left Camp (Others)' : occupant.employeeStatus;

  return (
    <div className="fixed inset-0 bg-slate-900/70 z-[58] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] overflow-y-auto p-5 space-y-4 shadow-2xl text-xs">
        <div className="flex items-center justify-between border-b pb-3">
          <span className="font-mono font-bold text-slate-800">FULL HISTORY — #{id}</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => printFormattedElement('occupant-history-print-area', `History-${id}`, false, { fit: 'flow' })}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" /> Print / Save PDF
            </button>
            <button type="button" onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"><X className="w-5 h-5" /></button>
          </div>
        </div>

        <div id="occupant-history-print-area" className="p-6 bg-white text-black font-sans space-y-4 border border-slate-300">
          <div className="flex items-center justify-between border-b-2 border-black pb-3">
            <img src={dhowLogoImg} alt="Dhow Engineering" className="h-9 w-auto" />
            <div className="text-center">
              <h2 className="text-sm font-black tracking-wider uppercase">OCCUPANT FULL HISTORY</h2>
              <p className="text-[11px] text-slate-600 font-semibold">Accommodation record up to {todayStr}</p>
            </div>
            <div className="w-16"></div>
          </div>

          <div className="border border-black p-3 bg-slate-50 flex gap-4">
            <EmployeePhoto employeeId={id} className="w-20 h-20 rounded border border-black" />
            <div className="grid grid-cols-3 gap-x-6 gap-y-1.5 flex-1 text-[11px]">
              <div><span className="text-slate-500">Emp ID: </span><strong className="font-mono">{id}</strong></div>
              <div className="col-span-2"><span className="text-slate-500">Name: </span><strong>{occupant.employeeName}</strong></div>
              <div><span className="text-slate-500">Designation: </span><strong>{occupant.title}</strong></div>
              <div><span className="text-slate-500">Nationality: </span><strong>{occupant.nationality}</strong></div>
              <div><span className="text-slate-500">Grade: </span><strong>{occupant.roomGrade}</strong></div>
              <div><span className="text-slate-500">Civil ID: </span><strong className="font-mono">{occupant.civilId}</strong></div>
              <div><span className="text-slate-500">Passport: </span><strong className="font-mono">{occupant.passportNo}</strong></div>
              <div><span className="text-slate-500">Mobile: </span><strong className="font-mono">{occupant.mobileNo}</strong></div>
              <div><span className="text-slate-500">Emergency: </span><strong>{occupant.emergencyContactName || '-'} {occupant.emergencyContactPhone || ''}</strong></div>
              <div><span className="text-slate-500">Status: </span><strong>{statusText}</strong></div>
              <div><span className="text-slate-500">First entry: </span><strong>{firstEntry || '-'}</strong></div>
            </div>
          </div>

          <Section title="1. Camp and room history">
            {stays.length === 0 ? <Empty text="No room stays on record." /> : (
              <table className="w-full border-collapse text-[11px]">
                <thead><tr><th className={th}>#</th><th className={th}>From</th><th className={th}>To</th><th className={th}>Camp</th><th className={th}>Room</th><th className={th}>Grade</th><th className={th}>Cost Center</th><th className={th}>Reason</th></tr></thead>
                <tbody>
                  {stays.map((s, i) => (
                    <tr key={i} style={{ breakInside: 'avoid' }}>
                      <td className={`${td} text-center`}>{i + 1}</td>
                      <td className={`${td} text-center`}>{s.from}</td>
                      <td className={`${td} text-center`}>{s.to || 'Present'}</td>
                      <td className={`${td} text-center`}>{s.campNo}{i > 0 && stays[i - 1].campNo !== s.campNo ? ' (camp change)' : ''}</td>
                      <td className={`${td} text-center font-mono`}>{s.roomNo}</td>
                      <td className={`${td} text-center`}>{s.grade}</td>
                      <td className={`${td} text-center`}>{s.costCenter}</td>
                      <td className={td}>{s.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Section>

          <Section title="2. Cost center history">
            <table className="w-full border-collapse text-[11px]">
              <thead><tr><th className={th}>#</th><th className={th}>From</th><th className={th}>To</th><th className={th}>Cost Center</th><th className={th}>Division</th><th className={th}>Changed by</th><th className={th}>Reason</th></tr></thead>
              <tbody>
                {ccRows.map((c, i) => (
                  <tr key={i} style={{ breakInside: 'avoid' }}>
                    <td className={`${td} text-center`}>{i + 1}</td>
                    <td className={`${td} text-center`}>{c.from || '-'}</td>
                    <td className={`${td} text-center`}>{c.to || 'Present'}</td>
                    <td className={`${td} text-center font-mono font-bold`}>{c.costCenter}</td>
                    <td className={`${td} text-center`}>{c.division}</td>
                    <td className={td}>{c.by}</td>
                    <td className={td}>{c.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {transfers.length > 0 && (
              <p className="text-[10px] text-slate-600 mt-1">Transfer requests: {transfers.map(t => `${t.fromCostCenter} to ${t.toCostCenter} (${t.status})`).join('; ')}</p>
            )}
          </Section>

          <Section title="3. Leave">
            {leaves.length === 0 ? <Empty text="No leave on record." /> : (
              <table className="w-full border-collapse text-[11px]">
                <thead><tr><th className={th}>Start</th><th className={th}>Expected end</th><th className={th}>Returned</th><th className={th}>Status</th><th className={th}>Remarks</th></tr></thead>
                <tbody>
                  {leaves.map(l => (
                    <tr key={l.id} style={{ breakInside: 'avoid' }}>
                      <td className={`${td} text-center`}>{d10(l.leaveStartDate)}</td>
                      <td className={`${td} text-center`}>{d10(l.expectedEndDate)}</td>
                      <td className={`${td} text-center`}>{d10(l.actualReturnDate) || '-'}</td>
                      <td className={`${td} text-center`}>{l.status}</td>
                      <td className={td}>{l.remarks}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Section>

          <Section title="4. Misconduct">
            {misconduct.length === 0 ? <Empty text="No misconduct on record." /> : (
              <table className="w-full border-collapse text-[11px]">
                <thead><tr><th className={th}>Date</th><th className={th}>Violation</th><th className={th}>Remarks</th></tr></thead>
                <tbody>
                  {misconduct.map(m => (
                    <tr key={m.id} style={{ breakInside: 'avoid' }}>
                      <td className={`${td} text-center`}>{d10(m.incidentDate)}</td>
                      <td className={td}>{m.typeOfViolation}</td>
                      <td className={td}>{m.remarks}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Section>

          <Section title="5. Maintenance issues reported">
            {maintenance.length === 0 ? <Empty text="No maintenance issues reported." /> : (
              <table className="w-full border-collapse text-[11px]">
                <thead><tr><th className={th}>Date</th><th className={th}>Room</th><th className={th}>Issue</th><th className={th}>Status</th></tr></thead>
                <tbody>
                  {maintenance.map(m => (
                    <tr key={m.id} style={{ breakInside: 'avoid' }}>
                      <td className={`${td} text-center`}>{d10(m.date)}</td>
                      <td className={`${td} text-center font-mono`}>{m.roomNo}</td>
                      <td className={td}>{m.issueDetails}</td>
                      <td className={`${td} text-center`}>{m.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Section>

          <Section title="6. Camp exit">
            {exits.length === 0 ? <Empty text="Still in the camp system. No exit recorded." /> : (
              <table className="w-full border-collapse text-[11px]">
                <thead><tr><th className={th}>Exit date</th><th className={th}>Type</th><th className={th}>Camp</th><th className={th}>Room</th><th className={th}>Reason</th></tr></thead>
                <tbody>
                  {exits.map(r => (
                    <tr key={r.id} style={{ breakInside: 'avoid' }}>
                      <td className={`${td} text-center`}>{d10(r.rtdDate)}</td>
                      <td className={`${td} text-center`}>{r.rtdType === 'Others' ? 'Left camp (Others)' : `RTD - ${r.rtdType}`}</td>
                      <td className={`${td} text-center`}>{r.vacatedCampNo || '-'}</td>
                      <td className={`${td} text-center font-mono`}>{r.vacatedRoomNo || '-'}</td>
                      <td className={td}>{r.remarks}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Section>

          <Section title="7. Monthly recharge statement (accommodation charged to cost centers)">
            {statement.length === 0 ? <Empty text="No billable stay yet." /> : (
              <>
                <table className="w-full border-collapse text-[11px]">
                  <thead><tr><th className={th}>Month</th><th className={th}>Cost Center</th><th className={th}>Room</th><th className={th}>Grade</th><th className={th}>Days</th><th className={th}>Amount (KWD)</th></tr></thead>
                  <tbody>
                    {statement.map((r, i) => (
                      <tr key={i} style={{ breakInside: 'avoid' }}>
                        <td className={td}>{r.period}</td>
                        <td className={`${td} text-center font-mono`}>{r.cc}</td>
                        <td className={`${td} text-center font-mono`}>{r.roomNo}</td>
                        <td className={`${td} text-center`}>{r.grade}</td>
                        <td className={`${td} text-center`}>{r.days} / {r.daysInMonth}</td>
                        <td className={`${td} text-right font-mono`}>{(r.amountFils / 1000).toFixed(3)}</td>
                      </tr>
                    ))}
                    <tr className="bg-slate-100 font-bold">
                      <td colSpan={5} className={`${td} text-right uppercase`}>Total charged:</td>
                      <td className={`${td} text-right font-mono`}>{statementTotal.toFixed(3)}</td>
                    </tr>
                  </tbody>
                </table>
                <p className="text-[10px] text-slate-500 mt-1">Worked out from the stay dates and the current monthly rates ({Number(rates.nonManual || 0).toFixed(3)} KWD Non-Manual, {Number(rates.manual || 0).toFixed(3)} KWD Manual). Miscellaneous and Transport / Consumables charges are billed per cost center and are not split per person.</p>
              </>
            )}
          </Section>
        </div>
      </div>
    </div>
  );
}
