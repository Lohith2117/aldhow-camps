import React, { useState } from 'react';
import {
  Download, Printer, Building2, UserCheck, ShieldAlert, Wrench, Calendar, LogOut
} from 'lucide-react';
import dhowLogoImg from '../assets/dhow-logo.png';
import {
  printFormattedElement,
  exportCampOccupancySummary,
  exportDailyOccupancyReport,
  exportMisconductLog,
  exportMaintenanceLog,
  exportVacatedLog
} from '../utils/reportGenerators';
import { toDay } from '../utils/billing';

export default function ReportsTab({
  camps,
  occupants,
  leaveLogs,
  rtdLogs,
  maintenanceLogs = [],
  misconductLogs = [],
  activeCamp
}) {
  const [selectedTemplateTab, setSelectedTemplateTab] = useState('daily');
  const [reportCampId, setReportCampId] = useState(camps[0]?.id || 'camp-1');
  const [inspectionType, setInspectionType] = useState('Weekly Routine Inspection');
  const [conductedAt, setConductedAt] = useState('All Active Camp Facilities');
  const [approverName, setApproverName] = useState('Mohamed Bayoumi');
  const [reportRemarks, setReportRemarks] = useState('Regular accommodation operations compliant and inspected.');

  // Camp vacated log: everyone who left the camp (RTD or left on his own), month by month
  const [vacatedMonth, setVacatedMonth] = useState('ALL');
  const [vacatedCamp, setVacatedCamp] = useState('ALL');
  const vacatedAll = rtdLogs.map(r => {
    const emp = occupants.find(o => o.employeeId === r.employeeId) || {};
    const exitDay = toDay(r.rtdDate), entryDay = toDay(emp.entryDate);
    return {
      employeeId: r.employeeId, employeeName: r.employeeName, title: emp.title || '', grade: emp.roomGrade || '', costCenter: r.costCenter || emp.costCenter || '', division: emp.division || '',
      campNo: r.vacatedCampNo || '', roomNo: r.vacatedRoomNo || '', entryDate: emp.entryDate ? String(emp.entryDate).slice(0, 10) : '', exitDate: r.rtdDate ? String(r.rtdDate).slice(0, 10) : '',
      daysStayed: exitDay !== null && entryDay !== null && r.vacatedCampNo ? Math.max(0, exitDay - entryDay) : '',
      exitType: r.rtdType === 'Others' ? 'Left camp (Others)' : `RTD - ${r.rtdType}`, remarks: r.remarks || '', recordedBy: r.recordedBy || ''
    };
  }).sort((a, b) => String(b.exitDate).localeCompare(String(a.exitDate)));
  const vacatedMonths = Array.from(new Set(vacatedAll.map(v => v.exitDate.slice(0, 7)).filter(Boolean))).sort().reverse();
  const vacatedRows = vacatedAll.filter(v => (vacatedMonth === 'ALL' || v.exitDate.startsWith(vacatedMonth)) && (vacatedCamp === 'ALL' || v.campNo === vacatedCamp));
  const vacatedLabel = vacatedMonth === 'ALL' ? 'All months' : new Date(vacatedMonth + '-01T00:00:00Z').toLocaleDateString('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' });

  const targetReportCamp = camps.find(c => c.id === reportCampId) || activeCamp || camps[0];

  const today = new Date();
  const todayFormatted = today.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }).replace(/ /g, '/');
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const yesterdayFormatted = yesterday.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }).replace(/ /g, '-');

  const totalSummaryRows = Math.max(30, camps.length);

  return (
    <div className="space-y-5">
      {/* Control Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-xs flex flex-wrap items-center justify-between gap-3 no-print">
        <div className="flex items-center gap-2 overflow-x-auto">
          <button
            onClick={() => setSelectedTemplateTab('daily')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-2 cursor-pointer transition-all ${
              selectedTemplateTab === 'daily' ? 'bg-slate-900 text-white shadow-sm' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <UserCheck className="w-4 h-4 text-emerald-400" />
            <span>Daily Report (Individual Camp)</span>
          </button>

          <button
            onClick={() => setSelectedTemplateTab('weekly')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-2 cursor-pointer transition-all ${
              selectedTemplateTab === 'weekly' ? 'bg-slate-900 text-white shadow-sm' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Calendar className="w-4 h-4 text-cyan-400" />
            <span>Weekly Report (Individual Camp)</span>
          </button>

          <button
            onClick={() => setSelectedTemplateTab('monthly')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-2 cursor-pointer transition-all ${
              selectedTemplateTab === 'monthly' ? 'bg-slate-900 text-white shadow-sm' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Building2 className="w-4 h-4 text-purple-400" />
            <span>Monthly Summary (All Camps Combined)</span>
          </button>

          <button
            onClick={() => setSelectedTemplateTab('t6')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-2 cursor-pointer transition-all ${
              selectedTemplateTab === 't6' ? 'bg-slate-900 text-white shadow-sm' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            <span>Disciplinary Log</span>
          </button>

          <button
            onClick={() => setSelectedTemplateTab('t7')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-2 cursor-pointer transition-all ${
              selectedTemplateTab === 't7' ? 'bg-slate-900 text-white shadow-sm' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Wrench className="w-4 h-4 text-amber-400" />
            <span>Maintenance Log</span>
          </button>

          <button
            onClick={() => setSelectedTemplateTab('t8')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-2 cursor-pointer transition-all ${
              selectedTemplateTab === 't8' ? 'bg-slate-900 text-white shadow-sm' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <LogOut className="w-4 h-4 text-orange-400" />
            <span>Camp Vacated Log</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {selectedTemplateTab === 't8' && (
            <>
              <select value={vacatedMonth} onChange={e => setVacatedMonth(e.target.value)} className="bg-slate-50 border border-slate-300 text-slate-900 font-bold text-xs rounded-xl px-3 py-2">
                <option value="ALL">All months</option>
                {vacatedMonths.map(m => <option key={m} value={m}>{new Date(m + '-01T00:00:00Z').toLocaleDateString('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' })}</option>)}
              </select>
              <select value={vacatedCamp} onChange={e => setVacatedCamp(e.target.value)} className="bg-slate-50 border border-slate-300 text-slate-900 font-bold text-xs rounded-xl px-3 py-2">
                <option value="ALL">All camps</option>
                {camps.map(c => <option key={c.id} value={c.campNo}>{c.campNo}</option>)}
              </select>
            </>
          )}

          {(selectedTemplateTab === 'daily' || selectedTemplateTab === 'weekly') && (
            <select
              value={reportCampId}
              onChange={e => setReportCampId(e.target.value)}
              className="bg-slate-50 border border-slate-300 text-slate-900 font-bold text-xs rounded-xl px-3 py-2"
            >
              {camps.map(c => <option key={c.id} value={c.id}>{c.campNo} ({c.campArea})</option>)}
            </select>
          )}

          <button
            type="button"
            onClick={() => printFormattedElement('excel-print-area', 'Al-Dhow Official Report', selectedTemplateTab === 'daily' || selectedTemplateTab === 't8')}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Printer className="w-4 h-4" /> Print / Save PDF (1 Page Fit)
          </button>

          {(selectedTemplateTab === 'daily' || selectedTemplateTab === 'weekly') && (
            <button
              type="button"
              onClick={() => exportDailyOccupancyReport(targetReportCamp, occupants)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Download className="w-4 h-4" /> Download Excel (.xlsx)
            </button>
          )}

          {selectedTemplateTab === 'monthly' && (
            <button
              type="button"
              onClick={() => exportCampOccupancySummary(camps, occupants, leaveLogs, rtdLogs, {
                inspectionType,
                conductedAt,
                approverName,
                remarks: reportRemarks
              })}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Download className="w-4 h-4" /> Download Excel (.xlsx)
            </button>
          )}

          {selectedTemplateTab === 't6' && (
            <button
              type="button"
              onClick={() => exportMisconductLog(misconductLogs)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Download className="w-4 h-4" /> Download Excel (.xlsx)
            </button>
          )}

          {selectedTemplateTab === 't8' && (
            <button
              type="button"
              onClick={() => exportVacatedLog(vacatedRows, vacatedLabel)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Download className="w-4 h-4" /> Download Excel (.xlsx)
            </button>
          )}

          {selectedTemplateTab === 't7' && (
            <button
              type="button"
              onClick={() => exportMaintenanceLog(maintenanceLogs)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Download className="w-4 h-4" /> Download Excel (.xlsx)
            </button>
          )}
        </div>
      </div>

      {/* COMPACT A4 PREVIEW CONTAINER */}
      <div id="excel-print-area" className="bg-white border border-slate-300 shadow-lg mx-auto max-w-[950px] p-5 text-black font-sans text-xs">
        
        {/* 1. DAILY REPORT */}
        {selectedTemplateTab === 'daily' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between border-b-2 border-black pb-2">
              <img src={dhowLogoImg} alt="Dhow Engineering" className="h-7 w-auto object-contain" />
              <div className="report-title text-xs font-black tracking-wider uppercase text-center flex-1">
                DAILY OCCUPANCY REPORT
              </div>
              <div className="w-16"></div>
            </div>

            <div className="border-2 border-black p-2 space-y-2 bg-white">
              <div className="flex justify-between items-center report-meta text-[11px] font-bold px-1">
                <span>Accommodation No.: {targetReportCamp?.campNo}</span>
                <span>Area: {targetReportCamp?.campArea}</span>
              </div>

              <table className="w-full border-collapse text-[10.5px]">
                <thead>
                  <tr className="bg-slate-100 font-bold text-center">
                    <th rowSpan={2} className="border border-black p-1 w-10">Sr. No.</th>
                    <th colSpan={4} className="border border-black p-1">Employee</th>
                    <th colSpan={2} className="border border-black p-1">Occupancy</th>
                    <th colSpan={2} className="border border-black p-1">Date</th>
                    <th rowSpan={2} className="border border-black p-1 w-24">Entered by</th>
                  </tr>
                  <tr className="bg-slate-100 font-bold text-center">
                    <th className="border border-black p-1 w-16">Code*</th>
                    <th className="border border-black p-1">Name</th>
                    <th className="border border-black p-1">Designation</th>
                    <th className="border border-black p-1 w-24">Project/ Dept.</th>
                    <th className="border border-black p-1 w-20">Room No.</th>
                    <th className="border border-black p-1 w-16">Status</th>
                    <th className="border border-black p-1 w-20">Arrival</th>
                    <th className="border border-black p-1 w-20">Leaving</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: Math.max(16, occupants.filter(o => o.campNo === targetReportCamp?.campNo).length) }).map((_, idx) => {
                    const campOccs = occupants.filter(o => o.campNo === targetReportCamp?.campNo);
                    const occ = campOccs[idx];
                    return (
                      <tr key={idx} style={{ height: '20px' }}>
                        <td className="border border-black px-1.5 py-0.5 text-center">{occ ? idx + 1 : ''}</td>
                        <td className="border border-black px-1.5 py-0.5 text-center font-mono">{occ ? occ.employeeId : ''}</td>
                        <td className="border border-black px-1.5 py-0.5 font-semibold">{occ ? occ.employeeName : ''}</td>
                        <td className="border border-black px-1.5 py-0.5">{occ ? occ.title : ''}</td>
                        <td className="border border-black px-1.5 py-0.5 text-center font-mono">{occ ? occ.costCenter : ''}</td>
                        <td className="border border-black px-1.5 py-0.5 text-center font-mono">{occ ? occ.roomNo : ''}</td>
                        <td className="border border-black px-1.5 py-0.5 text-center">{occ ? occ.employeeStatus : ''}</td>
                        <td className="border border-black px-1.5 py-0.5 text-center font-mono">{occ ? occ.entryDate : ''}</td>
                        <td className="border border-black px-1.5 py-0.5 text-center font-mono">{occ ? (occ.exitDate || '-') : ''}</td>
                        <td className="border border-black px-1.5 py-0.5 text-center">{occ ? 'Camp Coordinator' : ''}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <div className="report-note text-[9px] italic pt-0.5">
                Note: * - Employee code refers herein Al Dhow ID No, Civil ID No. and Passport No.
              </div>
            </div>
          </div>
        )}

        {/* 2. WEEKLY REPORT */}
        {selectedTemplateTab === 'weekly' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between border-b-2 border-black pb-2">
              <img src={dhowLogoImg} alt="Dhow Engineering" className="h-7 w-auto object-contain" />
              <div className="report-title text-xs font-black tracking-wider uppercase text-center flex-1">
                WEEKLY CAMP OCCUPANCY & INSPECTION REPORT
              </div>
              <div className="w-16"></div>
            </div>

            <div className="border-2 border-black p-3 space-y-2.5 bg-white">
              <div className="flex justify-between report-meta text-xs font-bold">
                <span>Facility: {targetReportCamp?.campNo} ({targetReportCamp?.campArea})</span>
                <span>Week Ending: {todayFormatted}</span>
              </div>

              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 font-bold text-center">
                    <th className="border border-black p-1.5">Metric</th>
                    <th className="border border-black p-1.5">Count / Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ height: '20px' }}>
                    <td className="border border-black p-1.5 font-semibold">Total Building Capacity</td>
                    <td className="border border-black p-1.5 text-center font-bold">
                      {targetReportCamp?.floors.reduce((acc, fl) => acc + fl.flats.reduce((fa, ft) => fa + ft.rooms.reduce((ra, rm) => ra + rm.capacity, 0), 0), 0)} Beds
                    </td>
                  </tr>
                  <tr style={{ height: '20px' }}>
                    <td className="border border-black p-1.5 font-semibold">Active Residents On Job</td>
                    <td className="border border-black p-1.5 text-center font-bold text-cyan-700">
                      {occupants.filter(o => o.campNo === targetReportCamp?.campNo && o.employeeStatus === 'On Job').length}
                    </td>
                  </tr>
                  <tr style={{ height: '20px' }}>
                    <td className="border border-black p-1.5 font-semibold">Residents On Leave (Beds Held)</td>
                    <td className="border border-black p-1.5 text-center font-bold text-amber-700">
                      {occupants.filter(o => o.campNo === targetReportCamp?.campNo && o.employeeStatus === 'On Leave').length}
                    </td>
                  </tr>
                  <tr style={{ height: '20px' }}>
                    <td className="border border-black p-1.5 font-semibold">Vacant / Available Beds</td>
                    <td className="border border-black p-1.5 text-center font-bold text-emerald-700">
                      {targetReportCamp?.floors.reduce((acc, fl) => acc + fl.flats.reduce((fa, ft) => fa + ft.rooms.reduce((ra, rm) => ra + rm.capacity, 0), 0), 0) - occupants.filter(o => o.campNo === targetReportCamp?.campNo && !o.employeeStatus.startsWith('RTD')).length}
                    </td>
                  </tr>
                </tbody>
              </table>

              <div className="p-2 bg-slate-50 border border-black space-y-1 text-xs">
                <div className="font-bold">Weekly Camp Boss Inspection Sign-Off:</div>
                <div>Status: Fully compliant with Kuwait Labour & Fire Safety Regulations.</div>
                <div>Inspected by: Camp Supervisor & Safety Officer</div>
              </div>
            </div>
          </div>
        )}

        {/* 3. MONTHLY SUMMARY */}
        {selectedTemplateTab === 'monthly' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between border-b-2 border-black pb-2">
              <img src={dhowLogoImg} alt="Dhow Engineering" className="h-7 w-auto object-contain" />
              <div className="report-title text-xs font-black tracking-wider uppercase text-center flex-1">
                CAMP OCCUPANCY SUMMARY STATUS
              </div>
              <div className="w-16"></div>
            </div>

            <div className="border-2 border-black p-2.5 space-y-2 bg-white">
              <div className="flex justify-end items-center mb-1.5">
                <span className="report-meta text-xs font-bold mr-2">Date:</span>
                <span className="border border-black px-4 py-0.5 text-xs font-bold text-center min-w-[90px]">
                  {todayFormatted}
                </span>
              </div>

              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 font-bold text-center">
                    <th className="border border-black py-1 px-1 w-10">Sr. No.</th>
                    <th className="border border-black py-1 px-2">Accommodation No.</th>
                    <th className="border border-black py-1 px-1 w-24">Total Capacity [No. of Beds]</th>
                    <th className="border border-black py-1 px-1 w-32">Total Bed Space Occupied as on {yesterdayFormatted}</th>
                    <th className="border border-black py-1 px-1 w-16">Vacation</th>
                    <th className="border border-black py-1 px-1 w-16">RTD</th>
                    <th className="border border-black py-1 px-2 w-28">Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: totalSummaryRows }).map((_, idx) => {
                    const camp = camps[idx];
                    let cap = 0;
                    let onJob = 0;
                    let onLeave = 0;
                    let rtdCount = 0;

                    if (camp) {
                      camp.floors.forEach(fl => fl.flats.forEach(ft => ft.rooms.forEach(rm => { cap += rm.capacity; })));
                      const inCamp = occupants.filter(o => o.campNo === camp.campNo);
                      onJob = inCamp.filter(o => o.employeeStatus === 'On Job').length;
                      onLeave = inCamp.filter(o => o.employeeStatus === 'On Leave').length;
                      rtdCount = rtdLogs.filter(r => r.vacatedCampNo === camp.campNo).length;
                    }

                    return (
                      <tr key={idx} style={{ height: '18px' }}>
                        <td className="border border-black px-1.5 py-0.5 text-center">{camp ? idx + 1 : ''}</td>
                        <td className="border border-black px-1.5 py-0.5 font-semibold">{camp ? `${camp.campNo} (${camp.campArea})` : ''}</td>
                        <td className="border border-black px-1.5 py-0.5 text-center">{camp ? cap : ''}</td>
                        <td className="border border-black px-1.5 py-0.5 text-center font-bold">{camp ? onJob + onLeave : ''}</td>
                        <td className="border border-black px-1.5 py-0.5 text-center">{camp ? onLeave : ''}</td>
                        <td className="border border-black px-1.5 py-0.5 text-center">{camp ? rtdCount : ''}</td>
                        <td className="border border-black px-1.5 py-0.5">{camp ? `${cap - (onJob + onLeave)} Beds Vacant` : ''}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <table className="w-full border-collapse text-xs mt-1.5">
                <tbody>
                  <tr className="bg-slate-100">
                    <td colSpan={6} className="border border-black px-2 py-0.5 font-bold">Inspection Details</td>
                  </tr>
                  <tr style={{ height: '20px' }}>
                    <td className="border border-black px-2 py-0.5 font-bold w-36">Type of Inspection:</td>
                    <td colSpan={2} className="border border-black px-2 py-0.5">
                      <input type="text" value={inspectionType} onChange={e => setInspectionType(e.target.value)} className="w-full text-xs focus:outline-none" />
                    </td>
                    <td className="border border-black px-2 py-0.5 font-bold w-24">Conducted at:</td>
                    <td colSpan={2} className="border border-black px-2 py-0.5">
                      <input type="text" value={conductedAt} onChange={e => setConductedAt(e.target.value)} className="w-full text-xs focus:outline-none" />
                    </td>
                  </tr>
                  <tr className="bg-slate-100">
                    <td colSpan={6} className="border border-black px-2 py-0.5 font-bold">Accommodation Department Head's approval</td>
                  </tr>
                  <tr style={{ height: '20px' }}>
                    <td className="border border-black px-2 py-0.5 font-bold">Remarks:</td>
                    <td colSpan={5} className="border border-black px-2 py-0.5">
                      <input type="text" value={reportRemarks} onChange={e => setReportRemarks(e.target.value)} className="w-full text-xs focus:outline-none" />
                    </td>
                  </tr>
                  <tr style={{ height: '20px' }}>
                    <td className="border border-black px-2 py-0.5 font-bold">Name:</td>
                    <td className="border border-black px-2 py-0.5 font-semibold">
                      <input type="text" value={approverName} onChange={e => setApproverName(e.target.value)} className="w-full text-xs font-bold focus:outline-none" />
                    </td>
                    <td className="border border-black px-2 py-0.5 font-bold">Signature:</td>
                    <td className="border border-black px-2 py-0.5 w-28"></td>
                    <td className="border border-black px-2 py-0.5 font-bold w-12">Date:</td>
                    <td className="border border-black px-2 py-0.5 text-center">{todayFormatted}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 6. DISCIPLINARY LOG */}
        {selectedTemplateTab === 't6' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between border-b-2 border-black pb-2">
              <img src={dhowLogoImg} alt="Dhow Engineering" className="h-7 w-auto object-contain" />
              <div className="report-title text-xs font-black tracking-wider uppercase text-center flex-1">
                EMPLOYEE DISCIPLINARY ACTION LOG
              </div>
              <div className="w-16"></div>
            </div>
            <div className="border-2 border-black p-2 bg-white">
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 font-bold text-center">
                    <th className="border border-black p-1">Sl N.</th>
                    <th className="border border-black p-1">ID</th>
                    <th className="border border-black p-1">Name</th>
                    <th className="border border-black p-1">Designation</th>
                    <th className="border border-black p-1">Incident Date</th>
                    <th className="border border-black p-1">Incident Location</th>
                    <th className="border border-black p-1">Type of Violation</th>
                    <th className="border border-black p-1">Doc Ref</th>
                    <th className="border border-black p-1">Cost Center</th>
                    <th className="border border-black p-1">Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: Math.max(16, misconductLogs.length) }).map((_, i) => {
                    const item = misconductLogs[i];
                    return (
                      <tr key={i} style={{ height: '20px' }}>
                        <td className="border border-black px-1.5 py-0.5 text-center">{item ? i + 1 : ''}</td>
                        <td className="border border-black px-1.5 py-0.5 text-center">{item ? item.employeeId : ''}</td>
                        <td className="border border-black px-1.5 py-0.5 font-semibold">{item ? item.employeeName : ''}</td>
                        <td className="border border-black px-1.5 py-0.5">{item ? item.title : ''}</td>
                        <td className="border border-black px-1.5 py-0.5 text-center">{item ? item.incidentDate : ''}</td>
                        <td className="border border-black px-1.5 py-0.5">{item ? item.incidentLocation : ''}</td>
                        <td className="border border-black px-1.5 py-0.5">{item ? item.typeOfViolation : ''}</td>
                        <td className="border border-black px-1.5 py-0.5 text-center">{item ? item.docRef : ''}</td>
                        <td className="border border-black px-1.5 py-0.5 text-center">{item ? item.costCenter : ''}</td>
                        <td className="border border-black px-1.5 py-0.5">{item ? item.remarks : ''}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 8. CAMP VACATED LOG */}
        {selectedTemplateTab === 't8' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between border-b-2 border-black pb-2">
              <img src={dhowLogoImg} alt="Dhow Engineering" className="h-7 w-auto object-contain" />
              <div className="report-title text-xs font-black tracking-wider uppercase text-center flex-1">
                CAMP VACATED LOG — {vacatedLabel}{vacatedCamp !== 'ALL' ? ` — ${vacatedCamp}` : ''}
              </div>
              <div className="w-16 text-right text-[10px] font-mono">{vacatedRows.length} exits</div>
            </div>
            <div className="border-2 border-black p-2 bg-white">
              <table className="w-full border-collapse text-[10px]">
                <thead>
                  <tr className="bg-slate-100 font-bold text-center">
                    <th className="border border-black p-1">Sl</th>
                    <th className="border border-black p-1">Emp ID</th>
                    <th className="border border-black p-1">Name</th>
                    <th className="border border-black p-1">Designation</th>
                    <th className="border border-black p-1">Grade</th>
                    <th className="border border-black p-1">Cost Center</th>
                    <th className="border border-black p-1">Camp</th>
                    <th className="border border-black p-1">Room</th>
                    <th className="border border-black p-1">Entry Date</th>
                    <th className="border border-black p-1">Exit Date</th>
                    <th className="border border-black p-1">Days</th>
                    <th className="border border-black p-1">Exit Type</th>
                    <th className="border border-black p-1">Reason / Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {vacatedRows.length === 0 && (
                    <tr><td colSpan={13} className="border border-black p-3 text-center text-slate-500">No one left the camp in this selection.</td></tr>
                  )}
                  {vacatedRows.map((v, i) => (
                    <tr key={`${v.employeeId}-${v.exitDate}-${i}`} style={{ breakInside: 'avoid' }}>
                      <td className="border border-black px-1 py-0.5 text-center">{i + 1}</td>
                      <td className="border border-black px-1 py-0.5 text-center font-mono font-bold">{v.employeeId}</td>
                      <td className="border border-black px-1 py-0.5 font-semibold">{v.employeeName}</td>
                      <td className="border border-black px-1 py-0.5">{v.title}</td>
                      <td className="border border-black px-1 py-0.5 text-center">{v.grade}</td>
                      <td className="border border-black px-1 py-0.5 text-center">{v.costCenter}</td>
                      <td className="border border-black px-1 py-0.5 text-center">{v.campNo}</td>
                      <td className="border border-black px-1 py-0.5 text-center font-mono">{v.roomNo}</td>
                      <td className="border border-black px-1 py-0.5 text-center">{v.entryDate}</td>
                      <td className="border border-black px-1 py-0.5 text-center font-bold">{v.exitDate}</td>
                      <td className="border border-black px-1 py-0.5 text-center">{v.daysStayed}</td>
                      <td className="border border-black px-1 py-0.5 text-center">{v.exitType}</td>
                      <td className="border border-black px-1 py-0.5">{v.remarks}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 7. MAINTENANCE LOG */}
        {selectedTemplateTab === 't7' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between border-b-2 border-black pb-2">
              <img src={dhowLogoImg} alt="Dhow Engineering" className="h-7 w-auto object-contain" />
              <div className="report-title text-xs font-black tracking-wider uppercase text-center flex-1">
                ACCOMMODATION MAINTENANCE LOG
              </div>
              <div className="w-16"></div>
            </div>
            <div className="border-2 border-black p-2 overflow-x-auto bg-white">
              <table className="w-full border-collapse text-[10px]">
                <thead>
                  <tr className="bg-slate-100 font-bold text-center">
                    <th className="border border-black p-1">Uni.ID</th>
                    <th className="border border-black p-1">Date</th>
                    <th className="border border-black p-1">Month</th>
                    <th className="border border-black p-1">Maintenance Issue Details</th>
                    <th className="border border-black p-1">Emp. ID#</th>
                    <th className="border border-black p-1">Employee Name</th>
                    <th className="border border-black p-1">Room</th>
                    <th className="border border-black p-1">Area / Facility</th>
                    <th className="border border-black p-1">Inspected by</th>
                    <th className="border border-black p-1">Action Taken by</th>
                    <th className="border border-black p-1">Status</th>
                    <th className="border border-black p-1">Cost</th>
                    <th className="border border-black p-1">Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: Math.max(16, maintenanceLogs.length) }).map((_, i) => {
                    const item = maintenanceLogs[i];
                    return (
                      <tr key={i} style={{ height: '20px' }}>
                        <td className="border border-black px-1 py-0.5 text-center">{item ? item.id : ''}</td>
                        <td className="border border-black px-1 py-0.5 text-center">{item ? item.date : ''}</td>
                        <td className="border border-black px-1 py-0.5 text-center">{item ? item.month : ''}</td>
                        <td className="border border-black px-1 py-0.5">{item ? item.issueDetails : ''}</td>
                        <td className="border border-black px-1 py-0.5 text-center">{item ? item.reportedByEmpId : ''}</td>
                        <td className="border border-black px-1.5 py-0.5">{item ? item.employeeName : ''}</td>
                        <td className="border border-black px-1.5 py-0.5 text-center">{item ? item.roomNo : ''}</td>
                        <td className="border border-black px-1.5 py-0.5">{item ? item.areaFacility : ''}</td>
                        <td className="border border-black px-1.5 py-0.5">{item ? item.inspectedBy : ''}</td>
                        <td className="border border-black px-1.5 py-0.5">{item ? item.actionTakenBy : ''}</td>
                        <td className="border border-black px-1.5 py-0.5 text-center font-bold">{item ? item.status : ''}</td>
                        <td className="border border-black px-1.5 py-0.5 text-center">{item ? item.replacedMaterialCost : ''}</td>
                        <td className="border border-black px-1.5 py-0.5">{item ? item.remarks : ''}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
