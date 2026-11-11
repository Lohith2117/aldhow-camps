import React, { useState } from 'react';
import {
  Download, Printer, FileSpreadsheet, Building2, UserCheck, ShieldAlert,
  Wrench, ArrowRightLeft, Layers, CheckCircle2, Calendar
} from 'lucide-react';
import dhowLogoImg from '../assets/dhow-logo.png';

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
  const [approverName, setApproverName] = useState('Mohamed Bayoumi');
  const [reportRemarks, setReportRemarks] = useState('Regular accommodation operations compliant and inspected.');
  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-5">
      {/* 7-Template Navigation Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-xs flex items-center gap-2 overflow-x-auto">
        <button
          onClick={() => setSelectedTemplateTab('t1')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-2 cursor-pointer transition-all ${
            selectedTemplateTab === 't1' ? 'bg-slate-900 text-white shadow-sm' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <Building2 className="w-4 h-4 text-cyan-400" />
          <span>1. Summary Status (T1)</span>
        </button>

        <button
          onClick={() => setSelectedTemplateTab('t2')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-2 cursor-pointer transition-all ${
            selectedTemplateTab === 't2' ? 'bg-slate-900 text-white shadow-sm' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <UserCheck className="w-4 h-4 text-emerald-400" />
          <span>2. Daily Occupancy (T2)</span>
        </button>

        <button
          onClick={() => setSelectedTemplateTab('t6')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-2 cursor-pointer transition-all ${
            selectedTemplateTab === 't6' ? 'bg-slate-900 text-white shadow-sm' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <ShieldAlert className="w-4 h-4 text-rose-400" />
          <span>5 & 6. Disciplinary Log (T6)</span>
        </button>

        <button
          onClick={() => setSelectedTemplateTab('t7')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-2 cursor-pointer transition-all ${
            selectedTemplateTab === 't7' ? 'bg-slate-900 text-white shadow-sm' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <Wrench className="w-4 h-4 text-amber-400" />
          <span>7. Maintenance Log (T7)</span>
        </button>
      </div>

      {/* TEMPLATE 1: CAMP OCCUPANCY SUMMARY STATUS (EXACT ON-SCREEN SHEET) */}
      {selectedTemplateTab === 't1' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4">
            <div className="flex items-center gap-3">
              <img src={dhowLogoImg} alt="Dhow" className="h-9 w-auto" />
              <div>
                <h2 className="text-base font-black tracking-tight text-slate-900 uppercase">
                  CAMP OCCUPANCY SUMMARY STATUS
                </h2>
                <p className="text-xs text-slate-500 font-mono">Template 1 • Official Weekly Management Review</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-4 h-4" /> Print / Save PDF
              </button>
              <button
                type="button"
                onClick={onExportCampOccupancySummary}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Download className="w-4 h-4" /> Export Excel (.xlsx)
              </button>
            </div>
          </div>

          <div className="flex justify-end text-xs font-mono font-bold text-slate-600">
            <span>Date: {todayStr}</span>
          </div>

          <div className="border border-slate-300 rounded-xl overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                <tr>
                  <th className="p-3 border-r">Sr. No.</th>
                  <th className="p-3 border-r">Accommodation No.</th>
                  <th className="p-3 border-r text-center">Total Capacity [No. of Beds]</th>
                  <th className="p-3 border-r text-center">Total Bed Space Occupied</th>
                  <th className="p-3 border-r text-center">Vacation</th>
                  <th className="p-3 border-r text-center">RTD</th>
                  <th className="p-3">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {camps.map((camp, idx) => {
                  let cap = 0;
                  camp.floors.forEach(fl => fl.flats.forEach(ft => ft.rooms.forEach(rm => { cap += rm.capacity; })));
                  const inCamp = occupants.filter(o => o.campNo === camp.campNo);
                  const onJob = inCamp.filter(o => o.employeeStatus === 'On Job').length;
                  const onLeave = inCamp.filter(o => o.employeeStatus === 'On Leave').length;
                  const rtdCount = rtdLogs.filter(r => r.vacatedCampNo === camp.campNo).length;

                  return (
                    <tr key={camp.id} className="hover:bg-slate-50">
                      <td className="p-3 border-r font-mono text-center">{idx + 1}</td>
                      <td className="p-3 border-r font-bold text-slate-900">{camp.campNo} ({camp.campArea})</td>
                      <td className="p-3 border-r text-center font-bold">{cap}</td>
                      <td className="p-3 border-r text-center font-bold text-cyan-700">{onJob + onLeave}</td>
                      <td className="p-3 border-r text-center font-bold text-amber-700">{onLeave}</td>
                      <td className="p-3 border-r text-center font-bold text-rose-700">{rtdCount}</td>
                      <td className="p-3 font-semibold text-emerald-700">{cap - (onJob + onLeave)} Beds Vacant</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Inspection Details Section (Matching Screenshot 2) */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 text-xs">
            <div className="font-bold text-slate-900 uppercase">Inspection Details</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-500 mb-1">Type of Inspection:</label>
                <input
                  type="text"
                  value={inspectionType}
                  onChange={e => setInspectionType(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 font-semibold"
                />
              </div>
              <div>
                <label className="block text-slate-500 mb-1">Conducted at:</label>
                <input
                  type="text"
                  defaultValue="All Active Camp Buildings"
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 font-semibold"
                />
              </div>
            </div>

            <div className="pt-2">
              <label className="block text-slate-500 mb-1">Accommodation Department Head's Approval Remarks:</label>
              <input
                type="text"
                value={reportRemarks}
                onChange={e => setReportRemarks(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 font-semibold"
              />
            </div>

            <div className="grid grid-cols-3 gap-3 pt-3 border-t border-slate-200">
              <div>
                <span className="text-slate-500">Name:</span>
                <input
                  type="text"
                  value={approverName}
                  onChange={e => setApproverName(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1 font-bold text-slate-900 mt-1"
                />
              </div>
              <div>
                <span className="text-slate-500">Signature:</span>
                <div className="font-mono text-slate-400 mt-2">____________________</div>
              </div>
              <div>
                <span className="text-slate-500">Date:</span>
                <div className="font-mono font-bold text-slate-900 mt-2">{todayStr}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TEMPLATE 2: DAILY OCCUPANCY REPORT */}
      {selectedTemplateTab === 't2' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4">
            <div>
              <h2 className="text-base font-black tracking-tight text-slate-900 uppercase">
                DAILY OCCUPANCY REPORT: {activeCamp?.campNo} ({activeCamp?.campArea})
              </h2>
              <p className="text-xs text-slate-500 font-mono">Template 2 • Arrival & Leaving Log</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-4 h-4" /> Print / Save PDF
              </button>
              <button
                type="button"
                onClick={onExportDailyOccupancyReport}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Download className="w-4 h-4" /> Export Excel (.xlsx)
              </button>
            </div>
          </div>

          <div className="border border-slate-300 rounded-xl overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300 text-[11px]">
                <tr>
                  <th className="p-2.5 border-r">Sr. No.</th>
                  <th className="p-2.5 border-r">Employee Code*</th>
                  <th className="p-2.5 border-r">Name</th>
                  <th className="p-2.5 border-r">Designation</th>
                  <th className="p-2.5 border-r">Project / Dept. No.</th>
                  <th className="p-2.5 border-r">Room No.</th>
                  <th className="p-2.5 border-r">Status</th>
                  <th className="p-2.5 border-r">Date Arrival</th>
                  <th className="p-2.5 border-r">Date Leaving</th>
                  <th className="p-2.5">Entered By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {occupants.filter(o => o.campNo === activeCamp?.campNo).map((occ, idx) => (
                  <tr key={occ.employeeId} className="hover:bg-slate-50">
                    <td className="p-2.5 border-r text-center font-mono">{idx + 1}</td>
                    <td className="p-2.5 border-r font-mono font-bold text-cyan-700">#{occ.employeeId}</td>
                    <td className="p-2.5 border-r font-bold text-slate-900">{occ.employeeName}</td>
                    <td className="p-2.5 border-r">{occ.title}</td>
                    <td className="p-2.5 border-r font-mono">{occ.costCenter}</td>
                    <td className="p-2.5 border-r font-mono">{occ.roomNo}</td>
                    <td className="p-2.5 border-r font-bold text-cyan-800">{occ.employeeStatus}</td>
                    <td className="p-2.5 border-r font-mono">{occ.entryDate}</td>
                    <td className="p-2.5 border-r font-mono text-slate-500">{occ.exitDate || '-'}</td>
                    <td className="p-2.5 font-semibold text-slate-600">Camp Coordinator</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="text-[11px] text-slate-500 italic">
            * Note: Employee code refers herein to Al Dhow ID No, Civil ID No. and Passport No.
          </div>
        </div>
      )}

      {/* TEMPLATE 6: EMPLOYEE DISCIPLINARY ACTION LOG */}
      {selectedTemplateTab === 't6' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4">
            <div>
              <h2 className="text-base font-black tracking-tight text-slate-900 uppercase">
                EMPLOYEE DISCIPLINARY ACTION LOG
              </h2>
              <p className="text-xs text-slate-500 font-mono">Template 6 • Accommodation Misconduct Register</p>
            </div>

            <button
              type="button"
              onClick={onExportMisconductLog}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Download className="w-4 h-4" /> Export Disciplinary Log (.xlsx)
            </button>
          </div>

          <div className="border border-slate-300 rounded-xl overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                <tr>
                  <th className="p-2.5 border-r">Sl N.</th>
                  <th className="p-2.5 border-r">ID</th>
                  <th className="p-2.5 border-r">Name</th>
                  <th className="p-2.5 border-r">Designation</th>
                  <th className="p-2.5 border-r">Incident Date</th>
                  <th className="p-2.5 border-r">Incident Location</th>
                  <th className="p-2.5 border-r">Type of Violation</th>
                  <th className="p-2.5 border-r">Doc Ref</th>
                  <th className="p-2.5 border-r">Cost Center</th>
                  <th className="p-2.5">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {misconductLogs.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="p-2.5 border-r text-center font-mono">{idx + 1}</td>
                    <td className="p-2.5 border-r font-mono font-bold text-rose-700">#{item.employeeId}</td>
                    <td className="p-2.5 border-r font-bold text-slate-900">{item.employeeName}</td>
                    <td className="p-2.5 border-r">{item.title}</td>
                    <td className="p-2.5 border-r font-mono">{item.incidentDate}</td>
                    <td className="p-2.5 border-r">{item.incidentLocation}</td>
                    <td className="p-2.5 border-r font-bold text-rose-800">{item.typeOfViolation}</td>
                    <td className="p-2.5 border-r font-mono">{item.docRef}</td>
                    <td className="p-2.5 border-r font-mono">{item.costCenter}</td>
                    <td className="p-2.5 text-slate-600">{item.remarks}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TEMPLATE 7: ACCOMMODATION MAINTENANCE LOG */}
      {selectedTemplateTab === 't7' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4">
            <div>
              <h2 className="text-base font-black tracking-tight text-slate-900 uppercase">
                ACCOMMODATION MAINTENANCE LOG
              </h2>
              <p className="text-xs text-slate-500 font-mono">Template 7 • Complaints, Inspections & Work Orders</p>
            </div>

            <button
              type="button"
              onClick={onExportMaintenanceLog}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Download className="w-4 h-4" /> Export Maintenance Log (.xlsx)
            </button>
          </div>

          <div className="border border-slate-300 rounded-xl overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                <tr>
                  <th className="p-2.5 border-r">Uni.ID</th>
                  <th className="p-2.5 border-r">Date</th>
                  <th className="p-2.5 border-r">Month</th>
                  <th className="p-2.5 border-r">Issue Details</th>
                  <th className="p-2.5 border-r">Reported By</th>
                  <th className="p-2.5 border-r">Room</th>
                  <th className="p-2.5 border-r">Inspected By</th>
                  <th className="p-2.5 border-r">Action Taken By</th>
                  <th className="p-2.5 border-r">Status</th>
                  <th className="p-2.5 border-r">Cost (KWD)</th>
                  <th className="p-2.5">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {maintenanceLogs.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="p-2.5 border-r font-mono font-bold text-cyan-700">{item.id}</td>
                    <td className="p-2.5 border-r font-mono">{item.date}</td>
                    <td className="p-2.5 border-r">{item.month}</td>
                    <td className="p-2.5 border-r font-semibold text-slate-900">{item.issueDetails}</td>
                    <td className="p-2.5 border-r font-mono">#{item.reportedByEmpId} ({item.employeeName})</td>
                    <td className="p-2.5 border-r font-mono">{item.roomNo}</td>
                    <td className="p-2.5 border-r">{item.inspectedBy}</td>
                    <td className="p-2.5 border-r">{item.actionTakenBy}</td>
                    <td className="p-2.5 border-r">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        item.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="p-2.5 border-r font-mono font-bold text-slate-900">{item.replacedMaterialCost}</td>
                    <td className="p-2.5 text-slate-600">{item.remarks}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}