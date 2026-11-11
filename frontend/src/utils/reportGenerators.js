import React, { useState } from 'react';
import {
  Download, Printer, Building2, UserCheck, ShieldAlert, Wrench, Calendar, Layers
} from 'lucide-react';
import dhowLogoImg from '../assets/dhow-logo.png';
import { printFormattedElement } from '../utils/reportGenerators';

export default function ReportsTab({
  camps,
  occupants,
  leaveLogs,
  rtdLogs,
  maintenanceLogs = [],
  misconductLogs = [],
  activeCamp,
  onExportCampOccupancySummary,
  onExportDailyOccupancyReport,
  onExportMisconductLog,
  onExportMaintenanceLog
}) {
  const [selectedTemplateTab, setSelectedTemplateTab] = useState('daily');
  const [reportCampId, setReportCampId] = useState(camps[0]?.id || 'camp-1');
  const [inspectionType, setInspectionType] = useState('Weekly Routine Inspection');
  const [conductedAt, setConductedAt] = useState('All Active Camp Facilities');
  const [approverName, setApproverName] = useState('Mohamed Bayoumi');
  const [reportRemarks, setReportRemarks] = useState('Regular accommodation operations compliant and inspected.');

  const targetReportCamp = camps.find(c => c.id === reportCampId) || activeCamp || camps[0];

  const today = new Date();
  const todayFormatted = today.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }).replace(/ /g, '/');
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const yesterdayFormatted = yesterday.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }).replace(/ /g, '-');

  const totalSummaryRows = Math.max(34, camps.length);

  return (
    <div className="space-y-5">
      {/* Control Bar (Excluded from Print) */}
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
            <span>Monthly Report (All Camps Combined)</span>
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
        </div>

        <div className="flex items-center gap-2">
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
            onClick={() => printFormattedElement('excel-print-area', 'Al-Dhow Official Report')}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Printer className="w-4 h-4" /> Print / Save PDF
          </button>

          {(selectedTemplateTab === 'daily' || selectedTemplateTab === 'weekly') && (
            <button
              type="button"
              onClick={onExportDailyOccupancyReport}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Download className="w-4 h-4" /> Export Excel (.xlsx)
            </button>
          )}

          {selectedTemplateTab === 'monthly' && (
            <button
              type="button"
              onClick={onExportCampOccupancySummary}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Download className="w-4 h-4" /> Export Excel (.xlsx)
            </button>
          )}

          {selectedTemplateTab === 't6' && (
            <button
              type="button"
              onClick={onExportMisconductLog}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Download className="w-4 h-4" /> Export Excel (.xlsx)
            </button>
          )}

          {selectedTemplateTab === 't7' && (
            <button
              type="button"
              onClick={onExportMaintenanceLog}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Download className="w-4 h-4" /> Export Excel (.xlsx)
            </button>
          )}
        </div>
      </div>

      {/* ===================================================================== */}
      {/* REPORT SHEET CONTAINER (A4 Print / View Area)                         */}
      {/* ===================================================================== */}
      <div id="excel-print-area" className="bg-white border border-slate-300 shadow-lg mx-auto max-w-[900px] p-8 text-black font-sans">
        
        {/* 1. DAILY REPORT (Individual Camp) */}
        {selectedTemplateTab === 'daily' && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <img src={dhowLogoImg} alt="Dhow Engineering" className="h-10 w-auto" />
              <h1 className="text-lg font-bold uppercase text-center flex-1 pr-14">DAILY OCCUPANCY REPORT</h1>
            </div>

            <div className="border-2 border-black p-2">
              <div className="flex justify-between text-xs font-bold mb-2 px-1">
                <span>Accommodation No.: {targetReportCamp?.campNo}</span>
                <span>Area: {targetReportCamp?.campArea}</span>
              </div>

              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 font-bold text-center">
                    <th rowSpan={2} className="border border-black p-1.5">Sr. No.</th>
                    <th colSpan={4} className="border border-black p-1.5">Employee</th>
                    <th colSpan={2} className="border border-black p-1.5">Occupancy</th>
                    <th colSpan={2} className="border border-black p-1.5">Date</th>
                    <th rowSpan={2} className="border border-black p-1.5">Entered by</th>
                  </tr>
                  <tr className="bg-slate-100 font-bold text-center">
                    <th className="border border-black p-1.5">Code*</th>
                    <th className="border border-black p-1.5">Name</th>
                    <th className="border border-black p-1.5">Designation</th>
                    <th className="border border-black p-1.5">Project/ Dept. No.</th>
                    <th className="border border-black p-1.5">Room No.</th>
                    <th className="border border-black p-1.5">Status</th>
                    <th className="border border-black p-1.5">Arrival</th>
                    <th className="border border-black p-1.5">Leaving</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: Math.max(20, occupants.filter(o => o.campNo === targetReportCamp?.campNo).length) }).map((_, idx) => {
                    const campOccs = occupants.filter(o => o.campNo === targetReportCamp?.campNo);
                    const occ = campOccs[idx];
                    return (
                      <tr key={idx} className="h-5">
                        <td className="border border-black px-2 py-0.5 text-center">{occ ? idx + 1 : ''}</td>
                        <td className="border border-black px-2 py-0.5 text-center font-mono">{occ ? occ.employeeId : ''}</td>
                        <td className="border border-black px-2 py-0.5 font-semibold">{occ ? occ.employeeName : ''}</td>
                        <td className="border border-black px-2 py-0.5">{occ ? occ.title : ''}</td>
                        <td className="border border-black px-2 py-0.5 text-center">{occ ? occ.costCenter : ''}</td>
                        <td className="border border-black px-2 py-0.5 text-center">{occ ? occ.roomNo : ''}</td>
                        <td className="border border-black px-2 py-0.5 text-center">{occ ? occ.employeeStatus : ''}</td>
                        <td className="border border-black px-2 py-0.5 text-center">{occ ? occ.entryDate : ''}</td>
                        <td className="border border-black px-2 py-0.5 text-center">{occ ? (occ.exitDate || '-') : ''}</td>
                        <td className="border border-black px-2 py-0.5 text-center">{occ ? 'Camp Coordinator' : ''}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div className="text-[10px] italic mt-1.5">
                Note: * - Employee code refers herein Al Dhow ID No, Civil ID No. and Passport No.
              </div>
            </div>
          </div>
        )}

        {/* 2. WEEKLY REPORT (Individual Camp) */}
        {selectedTemplateTab === 'weekly' && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <img src={dhowLogoImg} alt="Dhow Engineering" className="h-10 w-auto" />
              <h1 className="text-lg font-bold uppercase text-center flex-1 pr-14">WEEKLY CAMP OCCUPANCY & INSPECTION REPORT</h1>
            </div>

            <div className="border-2 border-black p-3 space-y-3">
              <div className="flex justify-between text-xs font-bold">
                <span>Facility: {targetReportCamp?.campNo} ({targetReportCamp?.campArea})</span>
                <span>Week Ending: {todayFormatted}</span>
              </div>

              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 font-bold text-center">
                    <th className="border border-black p-2">Metric</th>
                    <th className="border border-black p-2">Count / Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-black p-2 font-semibold">Total Building Capacity</td>
                    <td className="border border-black p-2 text-center font-bold">
                      {targetReportCamp?.floors.reduce((acc, fl) => acc + fl.flats.reduce((fa, ft) => fa + ft.rooms.reduce((ra, rm) => ra + rm.capacity, 0), 0), 0)} Beds
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-black p-2 font-semibold">Active Residents On Job</td>
                    <td className="border border-black p-2 text-center font-bold text-cyan-700">
                      {occupants.filter(o => o.campNo === targetReportCamp?.campNo && o.employeeStatus === 'On Job').length}
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-black p-2 font-semibold">Residents On Leave (Beds Held)</td>
                    <td className="border border-black p-2 text-center font-bold text-amber-700">
                      {occupants.filter(o => o.campNo === targetReportCamp?.campNo && o.employeeStatus === 'On Leave').length}
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-black p-2 font-semibold">Vacant / Available Beds</td>
                    <td className="border border-black p-2 text-center font-bold text-emerald-700">
                      {targetReportCamp?.floors.reduce((acc, fl) => acc + fl.flats.reduce((fa, ft) => fa + ft.rooms.reduce((ra, rm) => ra + rm.capacity, 0), 0), 0) - occupants.filter(o => o.campNo === targetReportCamp?.campNo && !o.employeeStatus.startsWith('RTD')).length}
                    </td>
                  </tr>
                </tbody>
              </table>

              <div className="p-3 bg-slate-50 border border-black space-y-1 text-xs">
                <div className="font-bold">Weekly Camp Boss Inspection Sign-Off:</div>
                <div>Status: Fully compliant with Kuwait Labour & Fire Safety Regulations.</div>
                <div>Inspected by: Camp Supervisor & Safety Officer</div>
              </div>
            </div>
          </div>
        )}

        {/* 3. MONTHLY REPORT (All Camps Combined - Template 1) */}
        {selectedTemplateTab === 'monthly' && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <img src={dhowLogoImg} alt="Dhow Engineering" className="h-11 w-auto" />
              <h1 className="text-lg font-bold tracking-wide text-black uppercase flex-1 text-center pr-16">
                MONTHLY CAMP OCCUPANCY SUMMARY STATUS (ALL CAMPS)
              </h1>
            </div>

            <div className="border-2 border-black p-2">
              <div className="flex justify-end items-center mb-2">
                <span className="text-xs font-bold mr-3">Date:</span>
                <span className="border border-black px-6 py-0.5 text-xs font-bold text-center min-w-[120px]">
                  {todayFormatted}
                </span>
              </div>

              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 font-bold text-center">
                    <th className="border border-black py-1.5 px-2 w-12">Sr.<br />No.</th>
                    <th className="border border-black py-1.5 px-3">Accommodation No.</th>
                    <th className="border border-black py-1.5 px-2 w-28">Total Capacity<br />[No. of Beds]</th>
                    <th className="border border-black py-1.5 px-2 w-36">Total Bed Space<br />Occupied as on {yesterdayFormatted}</th>
                    <th className="border border-black py-1.5 px-2 w-20">Vacation</th>
                    <th className="border border-black py-1.5 px-2 w-20">RTD</th>
                    <th className="border border-black py-1.5 px-3 w-40">Remarks</th>
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
                      <tr key={idx} className="h-5">
                        <td className="border border-black px-2 py-0.5 text-center">{camp ? idx + 1 : ''}</td>
                        <td className="border border-black px-2 py-0.5 font-semibold">{camp ? `${camp.campNo} (${camp.campArea})` : ''}</td>
                        <td className="border border-black px-2 py-0.5 text-center">{camp ? cap : ''}</td>
                        <td className="border border-black px-2 py-0.5 text-center font-bold">{camp ? onJob + onLeave : ''}</td>
                        <td className="border border-black px-2 py-0.5 text-center">{camp ? onLeave : ''}</td>
                        <td className="border border-black px-2 py-0.5 text-center">{camp ? rtdCount : ''}</td>
                        <td className="border border-black px-2 py-0.5">{camp ? `${cap - (onJob + onLeave)} Beds Vacant` : ''}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <table className="w-full border-collapse text-xs mt-2">
                <tbody>
                  <tr className="bg-slate-100">
                    <td colSpan={6} className="border border-black px-2 py-1 font-bold">Monthly Executive Audit & Sign-Off</td>
                  </tr>
                  <tr>
                    <td className="border border-black px-2 py-1.5 font-bold">Name:</td>
                    <td className="border border-black px-2 py-1.5 font-semibold">
                      <input type="text" value={approverName} onChange={e => setApproverName(e.target.value)} className="w-full text-xs font-bold focus:outline-none" />
                    </td>
                    <td className="border border-black px-2 py-1.5 font-bold">Signature:</td>
                    <td className="border border-black px-2 py-1.5 w-36"></td>
                    <td className="border border-black px-2 py-1.5 font-bold w-16">Date:</td>
                    <td className="border border-black px-2 py-1.5 text-center">{todayFormatted}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 6. DISCIPLINARY LOG */}
        {selectedTemplateTab === 't6' && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <img src={dhowLogoImg} alt="Dhow Engineering" className="h-10 w-auto" />
              <h1 className="text-lg font-bold uppercase text-center flex-1 pr-14">EMPLOYEE DISCIPLINARY ACTION LOG</h1>
            </div>
            <div className="border-2 border-black p-2">
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 font-bold text-center">
                    <th className="border border-black p-1.5">Sl N.</th>
                    <th className="border border-black p-1.5">ID</th>
                    <th className="border border-black p-1.5">Name</th>
                    <th className="border border-black p-1.5">Designation</th>
                    <th className="border border-black p-1.5">Incident Date</th>
                    <th className="border border-black p-1.5">Incident Location</th>
                    <th className="border border-black p-1.5">Type of Violation</th>
                    <th className="border border-black p-1.5">Doc Ref</th>
                    <th className="border border-black p-1.5">Cost Center</th>
                    <th className="border border-black p-1.5">Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: Math.max(20, misconductLogs.length) }).map((_, i) => {
                    const item = misconductLogs[i];
                    return (
                      <tr key={i} className="h-5">
                        <td className="border border-black px-2 py-0.5 text-center">{item ? i + 1 : ''}</td>
                        <td className="border border-black px-2 py-0.5 text-center">{item ? item.employeeId : ''}</td>
                        <td className="border border-black px-2 py-0.5 font-semibold">{item ? item.employeeName : ''}</td>
                        <td className="border border-black px-2 py-0.5">{item ? item.title : ''}</td>
                        <td className="border border-black px-2 py-0.5 text-center">{item ? item.incidentDate : ''}</td>
                        <td className="border border-black px-2 py-0.5">{item ? item.incidentLocation : ''}</td>
                        <td className="border border-black px-2 py-0.5">{item ? item.typeOfViolation : ''}</td>
                        <td className="border border-black px-2 py-0.5 text-center">{item ? item.docRef : ''}</td>
                        <td className="border border-black px-2 py-0.5 text-center">{item ? item.costCenter : ''}</td>
                        <td className="border border-black px-2 py-0.5">{item ? item.remarks : ''}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 7. MAINTENANCE LOG */}
        {selectedTemplateTab === 't7' && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <img src={dhowLogoImg} alt="Dhow Engineering" className="h-10 w-auto" />
              <h1 className="text-lg font-bold uppercase text-center flex-1 pr-14">ACCOMMODATION MAINTENANCE LOG</h1>
            </div>
            <div className="border-2 border-black p-2 overflow-x-auto">
              <table className="w-full border-collapse text-[11px]">
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
                  {Array.from({ length: Math.max(20, maintenanceLogs.length) }).map((_, i) => {
                    const item = maintenanceLogs[i];
                    return (
                      <tr key={i} className="h-5">
                        <td className="border border-black px-1.5 py-0.5 text-center">{item ? item.id : ''}</td>
                        <td className="border border-black px-1.5 py-0.5 text-center">{item ? item.date : ''}</td>
                        <td className="border border-black px-1.5 py-0.5 text-center">{item ? item.month : ''}</td>
                        <td className="border border-black px-1.5 py-0.5">{item ? item.issueDetails : ''}</td>
                        <td className="border border-black px-1.5 py-0.5 text-center">{item ? item.reportedByEmpId : ''}</td>
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