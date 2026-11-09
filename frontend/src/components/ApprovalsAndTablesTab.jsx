import React, { useState } from 'react';
import { Database } from 'lucide-react';

export default function ApprovalsAndTablesTab({
  transferRequests,
  onReviewTransferRequest,
  canApproveTransfers,
  leaveLogs,
  rtdLogs,
  costCenters,
  occupants,
  onDownloadSQLSchema
}) {
  const [subTab, setSubTab] = useState('approvals');

  return (
    <div className="space-y-6">
      {/* Sub-navigation for Separate Tables */}
      <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setSubTab('approvals')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer ${
              subTab === 'approvals' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'
            }`}
          >
            Cost Center Approvals ({transferRequests.filter(r => r.status === 'PENDING').length} Pending)
          </button>
          <button
            onClick={() => setSubTab('leave_logs')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer ${
              subTab === 'leave_logs' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'
            }`}
          >
            Table: leave_logs ({leaveLogs.length})
          </button>
          <button
            onClick={() => setSubTab('rtd_logs')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer ${
              subTab === 'rtd_logs' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'
            }`}
          >
            Table: rtd_logs ({rtdLogs.length})
          </button>
          <button
            onClick={() => setSubTab('cost_centers')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer ${
              subTab === 'cost_centers' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'
            }`}
          >
            Table: cost_centers ({costCenters.length})
          </button>
        </div>

        <button
          onClick={onDownloadSQLSchema}
          className="px-3.5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
        >
          <Database className="w-3.5 h-3.5" />
          Download PostgreSQL Schema (.sql)
        </button>
      </div>

      {/* 1. COST CENTER TRANSFER APPROVALS QUEUE */}
      {subTab === 'approvals' && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
          <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
            <span className="font-bold text-slate-900">
              Project Cost Center Reallocation Requests (Editor → Super Admin / Auditor Approval)
            </span>
            <span className="text-slate-500">
              {canApproveTransfers ? 'You have approval authority' : 'Read-only view (Super Admin / Auditor approves)'}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-slate-100 text-slate-600 uppercase font-mono text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Req ID</th>
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">From Cost Center</th>
                  <th className="py-3 px-4">To Cost Center</th>
                  <th className="py-3 px-4">Reason</th>
                  <th className="py-3 px-4">Requested By</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Approval Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {transferRequests.map(req => (
                  <tr key={req.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-mono text-slate-500">{req.id}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      #{req.employeeId} — {req.employeeName}
                    </td>
                    <td className="py-3 px-4 font-mono text-rose-700 font-semibold">
                      {req.fromCostCenter} ({req.fromDivision})
                    </td>
                    <td className="py-3 px-4 font-mono text-emerald-700 font-bold">
                      → {req.toCostCenter} ({req.toDivision})
                    </td>
                    <td className="py-3 px-4 text-slate-600">{req.reason}</td>
                    <td className="py-3 px-4 text-slate-600">
                      {req.requestedBy} <span className="text-[10px] text-slate-400">({req.requestDate})</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        req.status === 'PENDING'
                          ? 'bg-amber-100 text-amber-800'
                          : req.status === 'APPROVED'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-rose-50 text-rose-700'
                      }`}>
                        {req.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {req.status === 'PENDING' && canApproveTransfers ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => onReviewTransferRequest(req.id, 'APPROVED')}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-xs cursor-pointer"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => onReviewTransferRequest(req.id, 'REJECTED')}
                            className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg font-bold text-xs cursor-pointer"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-[11px]">
                          {req.reviewedBy ? `Reviewed by ${req.reviewedBy}` : 'Awaiting Reviewer'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. LEAVE LOGS SEPARATE DATABASE TABLE */}
      {subTab === 'leave_logs' && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
          <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 font-bold text-xs text-slate-800">
            Database Table: `leave_logs` (Tracks Start Date, Expected End Date & Actual Return Date)
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-slate-100 text-slate-600 uppercase font-mono text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Log ID</th>
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Camp & Room</th>
                  <th className="py-3 px-4">Leave Start Date</th>
                  <th className="py-3 px-4">Expected End Date</th>
                  <th className="py-3 px-4">Actual Return Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {leaveLogs.map(lv => (
                  <tr key={lv.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-4 font-mono text-slate-500">{lv.id}</td>
                    <td className="py-2.5 px-4 font-bold text-slate-900">#{lv.employeeId} — {lv.employeeName}</td>
                    <td className="py-2.5 px-4 font-mono">{lv.campNo} ({lv.roomNo})</td>
                    <td className="py-2.5 px-4 font-mono text-amber-700 font-bold">{lv.leaveStartDate}</td>
                    <td className="py-2.5 px-4 font-mono text-slate-700">{lv.expectedEndDate}</td>
                    <td className="py-2.5 px-4 font-mono font-bold text-emerald-700">
                      {lv.actualReturnDate || 'Still On Leave'}
                    </td>
                    <td className="py-2.5 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        lv.status === 'Returned' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {lv.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-slate-500">{lv.remarks}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. RTD LOGS SEPARATE DATABASE TABLE */}
      {subTab === 'rtd_logs' && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
          <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 font-bold text-xs text-slate-800">
            Database Table: `rtd_logs` (Resigned, Terminated & Dismissed Records)
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-slate-100 text-slate-600 uppercase font-mono text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">RTD ID</th>
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">RTD Type</th>
                  <th className="py-3 px-4">Effective Date</th>
                  <th className="py-3 px-4">Vacated Room</th>
                  <th className="py-3 px-4">Remarks</th>
                  <th className="py-3 px-4">Recorded By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {rtdLogs.map(r => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-4 font-mono text-slate-500">{r.id}</td>
                    <td className="py-2.5 px-4 font-bold text-slate-900">#{r.employeeId} — {r.employeeName}</td>
                    <td className="py-2.5 px-4">
                      <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 font-bold text-[10px]">
                        {r.rtdType}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 font-mono">{r.rtdDate}</td>
                    <td className="py-2.5 px-4 font-mono">{r.vacatedCampNo} • {r.vacatedRoomNo}</td>
                    <td className="py-2.5 px-4 text-slate-600">{r.remarks}</td>
                    <td className="py-2.5 px-4 text-slate-500">{r.recordedBy}</td>
                  </tr>
                ))}
                {rtdLogs.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-6 text-center text-slate-400 italic">
                      No RTD records logged yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. COST CENTERS SEPARATE DATABASE TABLE */}
      {subTab === 'cost_centers' && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
          <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 font-bold text-xs text-slate-800">
            Database Table: `cost_centers`
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-slate-100 text-slate-600 uppercase font-mono text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">ID</th>
                  <th className="py-3 px-4">Code</th>
                  <th className="py-3 px-4">Project Name</th>
                  <th className="py-3 px-4">Division</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {costCenters.map(cc => (
                  <tr key={cc.id}>
                    <td className="py-2.5 px-4 font-mono text-slate-500">{cc.id}</td>
                    <td className="py-2.5 px-4 font-mono font-bold text-cyan-700">{cc.code}</td>
                    <td className="py-2.5 px-4 font-semibold">{cc.name}</td>
                    <td className="py-2.5 px-4">{cc.division}</td>
                    <td className="py-2.5 px-4">{cc.status}</td>
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