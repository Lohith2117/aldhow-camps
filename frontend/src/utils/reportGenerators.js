import React, { useState } from 'react';
import {
  Download, Printer, Building2, UserCheck, ShieldAlert, Wrench
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
  const [selectedTemplateTab, setSelectedTemplateTab] = useState('t1');
  const [inspectionType, setInspectionType] = useState('Weekly Routine Inspection');
  const [conductedAt, setConductedAt] = useState('All Active Camp Facilities');
  const [approverName, setApproverName] = useState('Mohamed Bayoumi');
  const [reportRemarks, setReportRemarks] = useState('Regular accommodation operations compliant and inspected.');

  const today = new Date();
  const todayFormatted = today.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }).replace(/ /g, '/');
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const yesterdayFormatted = yesterday.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }).replace(/ /g, '-');

  // Pad to 34 rows to match the official A4 Excel sheet template
  const totalSummaryRows = Math.max(34, camps.length);

  return (
    <div className="space-y-5">
      {/* Control Bar (Excluded from Print) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-xs flex flex-wrap items-center justify-between gap-3 no-print">
        <div className="flex items-center gap-2 overflow-x-auto">
          <button
            onClick={() => setSelectedTemplateTab('t1')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-2 cursor-pointer transition-all ${
              selectedTemplateTab === 't1' ? 'bg-slate-900 text-white shadow-sm' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Building2 className="w-4 h-4 text-cyan-400" />
            <span>1. Camp Occupancy Summary Status</span>
          </button>

          <button
            onClick={() => setSelectedTemplateTab('t2')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-2 cursor-pointer transition-all ${
              selectedTemplateTab === 't2' ? 'bg-slate-900 text-white shadow-sm' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <UserCheck className="w-4 h-4 text-emerald-400" />
            <span>2. Daily Occupancy Report</span>
          </button>

          <button
            onClick={() => setSelectedTemplateTab('t6')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-2 cursor-pointer transition-all ${
              selectedTemplateTab === 't6' ? 'bg-slate-900 text-white shadow-sm' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            <span>6. Disciplinary Action Log</span>
          </button>

          <button
            onClick={() => setSelectedTemplateTab('t7')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-2 cursor-pointer transition-all ${
              selectedTemplateTab === 't7' ? 'bg-slate-900 text-white shadow-sm' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Wrench className="w-4 h-4 text-amber-400" />
            <span>7. Maintenance Log</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => printFormattedElement('excel-print-area', 'Al-Dhow Official Report')}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Printer className="w-4 h-4" /> Print Report Sheet Only (A4)
          </button>

          {selectedTemplateTab === 't1' && (
            <button
              type="button"
              onClick={onExportCampOccupancySummary}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Download className="w-4 h-4" /> Export Formatted Excel (.xlsx)
            </button>
          )}
          {selectedTemplateTab === 't2' && (
            <button
              type="button"
              onClick={onExportDailyOccupancyReport}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Download className="w-4 h-4" /> Export Formatted Excel (.xlsx)
            </button>
          )}
          {selectedTemplateTab === 't6' && (
            <button
              type="button"
              onClick={onExportMisconductLog}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Download className="w-4 h-4" /> Export Formatted Excel (.xlsx)
            </button>
          )}
          {selectedTemplateTab === 't7' && (
            <button
              type="button"
              onClick={onExportMaintenanceLog}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Download className="w-4 h-4" /> Export Formatted Excel (.xlsx)
            </button>
          )}
        </div>
      </div>

      {/* ===================================================================== */}
      {/* EXACT EXCEL PAGE LAYOUT SHEET CONTAINER (Isolated when printing)      */}
      {/* ===================================================================== */}
      <div id="excel-print-area" className="bg-white border border-slate-300 shadow-lg mx-auto max-w-[900px] p-8 text-black font-sans">
        {/* TEMPLATE 1: CAMP OCCUPANCY SUMMARY STATUS */}
        {selectedTemplateTab === 't1' && (
          <div>
            {/* Top Banner outside the bordered frame (Matches Screenshot 10) */}
            <div className="flex items-center justify-between mb-3">
              <img src={dhowLogoImg} alt="Dhow Engineering" className="h-11 w-auto" />
              <h1 className="text-lg font-bold tracking-wide text-black uppercase flex-1 text-center pr-16">
                CAMP OCCUPANCY SUMMARY STATUS
              </h1>
            </div>

            {/* Outer Thick Black Frame */}
            <div className="border-2 border-black p-2">
              {/* Date Row at Top Right */}
              <div className="flex justify-end items-center mb-2">
                <span className="text-xs font-bold mr-3">Date:</span>
                <span className="border border-black px-6 py-0.5 text-xs font-bold text-center min-w-[120px]">
                  {todayFormatted}
                </span>
              </div>

              {/* 34-Row Grid Table */}
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

              {/* Boxed Inspection & Approval Footer inside the Outer Frame */}
              <table className="w-full border-collapse text-xs mt-2">
                <tbody>
                  <tr className="bg-slate-100">
                    <td colSpan={6} className="border border-black px-2 py-1 font-bold">
                      Inspection Details
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-black px-2 py-1 font-bold w-40">Type of Inspection:</td>
                    <td colSpan={2} className="border border-black px-2 py-1">
                      <input
                        type="text"
                        value={inspectionType}
                        onChange={e => setInspectionType(e.target.value)}
                        className="w-full text-xs focus:outline-none"
                      />
                    </td>
                    <td className="border border-black px-2 py-1 font-bold w-28">Conducted at:</td>
                    <td colSpan={2} className="border border-black px-2 py-1">
                      <input
                        type="text"
                        value={conductedAt}
                        onChange={e => setConductedAt(e.target.value)}
                        className="w-full text-xs focus:outline-none"
                      />
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={2} className="border border-black px-2 py-1 font-bold">
                      Camp Boss's Weekly Inspection conducted at:
                    </td>
                    <td colSpan={4} className="border border-black px-2 py-1">
                      {todayFormatted}
                    </td>
                  </tr>
                  <tr className="bg-slate-100">
                    <td colSpan={6} className="border border-black px-2 py-1 font-bold">
                      Accommodation Department Head's approval
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-black px-2 py-1 font-bold">Remarks:</td>
                    <td colSpan={5} className="border border-black px-2 py-1">
                      <input
                        type="text"
                        value={reportRemarks}
                        onChange={e => setReportRemarks(e.target.value)}
                        className="w-full text-xs focus:outline-none"
                      />
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-black px-2 py-1.5 font-bold">Name:</td>
                    <td className="border border-black px-2 py-1.5 font-semibold">
                      <input
                        type="text"
                        value={approverName}
                        onChange={e => setApproverName(e.target.value)}
                        className="w-full text-xs font-bold focus:outline-none"
                      />
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

        {/* TEMPLATE 2: DAILY OCCUPANCY REPORT */}
        {selectedTemplateTab === 't2' && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <img src={dhowLogoImg} alt="Dhow Engineering" className="h-10 w-auto" />
              <h1 className="text-lg font-bold uppercase text-center flex-1 pr-14">DAILY OCCUPANCY REPORT</h1>
            </div>

            <div className="border-2 border-black p-2">
              <div className="flex justify-between text-xs font-bold mb-2 px-1">
                <span>Accommodation No.: {activeCamp?.campNo}</span>
                <span>Area: {activeCamp?.campArea}</span>
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
                  {Array.from({ length: Math.max(22, occupants.filter(o => o.campNo === activeCamp?.campNo).length) }).map((_, idx) => {
                    const campOccs = occupants.filter(o => o.campNo === activeCamp?.campNo);
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

        {/* TEMPLATE 6: EMPLOYEE DISCIPLINARY ACTION LOG */}
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

        {/* TEMPLATE 7: ACCOMMODATION MAINTENANCE LOG */}
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