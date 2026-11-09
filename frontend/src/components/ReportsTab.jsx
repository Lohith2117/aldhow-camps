import React, { useState, useMemo } from 'react';
import {
  Printer, Users, Bed, Plane, UserX
} from 'lucide-react';

export default function ReportsTab({
  camps,
  occupants,
  leaveLogs,
  rtdLogs,
  projectInvoicingData
}) {
  const [reportMode, setReportMode] = useState('daily');
  const [selectedCampNo, setSelectedCampNo] = useState(camps[0]?.campNo || 'CAMP-01');
  const [reportDate, setReportDate] = useState('2026-11-09');

  const targetCamp = useMemo(() => {
    return camps.find(c => c.campNo === selectedCampNo) || camps[0];
  }, [camps, selectedCampNo]);

  // Compute Individual Camp Metrics (For Daily & Weekly Reports)
  const individualCampMetrics = useMemo(() => {
    if (!targetCamp) return null;

    let totalFlats = 0;
    let nonManualFlats = 0;
    let manualFlats = 0;
    let totalRooms = 0;
    let totalBeds = 0;
    let nonManualBeds = 0;
    let manualBeds = 0;
    let occupiedBeds = 0;
    let nonManualOccupied = 0;
    let manualOccupied = 0;

    const floorBreakdown = targetCamp.floors.map(fl => {
      let flBeds = 0;
      let flOcc = 0;
      let flNMFlats = 0;
      let flMFlats = 0;

      fl.flats.forEach(ft => {
        totalFlats += 1;
        if (ft.roomGrade === 'Non-Manual') {
          nonManualFlats += 1;
          flNMFlats += 1;
        } else {
          manualFlats += 1;
          flMFlats += 1;
        }

        ft.rooms.forEach(rm => {
          totalRooms += 1;
          totalBeds += rm.capacity;
          occupiedBeds += rm.occupants.length;
          flBeds += rm.capacity;
          flOcc += rm.occupants.length;

          if (ft.roomGrade === 'Non-Manual') {
            nonManualBeds += rm.capacity;
            nonManualOccupied += rm.occupants.length;
          } else {
            manualBeds += rm.capacity;
            manualOccupied += rm.occupants.length;
          }
        });
      });

      return {
        floorNo: fl.floorNo,
        flatsCount: fl.flats.length,
        nmFlats: flNMFlats,
        mFlats: flMFlats,
        beds: flBeds,
        occupied: flOcc,
        vacant: flBeds - flOcc,
        pct: flBeds > 0 ? Math.round((flOcc / flBeds) * 100) : 0
      };
    });

    const campOccupants = occupants.filter(o => o.campNo === targetCamp.campNo);
    const activeOccupants = campOccupants.filter(o => !o.employeeStatus.startsWith('RTD'));
    const onJobCount = activeOccupants.filter(o => o.employeeStatus === 'On Job').length;
    const onLeaveCount = activeOccupants.filter(o => o.employeeStatus === 'On Leave').length;
    const campRtds = rtdLogs.filter(r => r.vacatedCampNo === targetCamp.campNo);
    const campLeaves = leaveLogs.filter(l => l.campNo === targetCamp.campNo);

    return {
      camp: targetCamp,
      totalFlats,
      nonManualFlats,
      manualFlats,
      totalRooms,
      totalBeds,
      occupiedBeds,
      vacantBeds: totalBeds - occupiedBeds,
      occupancyPct: totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0,
      nonManualBeds,
      nonManualOccupied,
      nonManualVacant: nonManualBeds - nonManualOccupied,
      manualBeds,
      manualOccupied,
      manualVacant: manualBeds - manualOccupied,
      onJobCount,
      onLeaveCount,
      campRtds,
      campLeaves,
      floorBreakdown
    };
  }, [targetCamp, occupants, leaveLogs, rtdLogs]);

  // Compute All Camps Combined Metrics (For Monthly Report)
  const combinedMonthlyMetrics = useMemo(() => {
    let totalBeds = 0;
    let totalOcc = 0;
    let nmBeds = 0;
    let nmOcc = 0;
    let mBeds = 0;
    let mOcc = 0;

    const campSummaries = camps.map(c => {
      let cBeds = 0;
      let cOcc = 0;
      let cNMBeds = 0;
      let cNMOcc = 0;
      let cMBeds = 0;
      let cMOcc = 0;
      let cFlats = 0;

      c.floors.forEach(f => {
        cFlats += f.flats.length;
        f.flats.forEach(ft => {
          ft.rooms.forEach(r => {
            cBeds += r.capacity;
            cOcc += r.occupants.length;
            totalBeds += r.capacity;
            totalOcc += r.occupants.length;
            if (ft.roomGrade === 'Non-Manual') {
              cNMBeds += r.capacity;
              cNMOcc += r.occupants.length;
              nmBeds += r.capacity;
              nmOcc += r.occupants.length;
            } else {
              cMBeds += r.capacity;
              cMOcc += r.occupants.length;
              mBeds += r.capacity;
              mOcc += r.occupants.length;
            }
          });
        });
      });

      return {
        ...c,
        flatsCount: cFlats,
        beds: cBeds,
        occupied: cOcc,
        vacant: cBeds - cOcc,
        nmVacant: cNMBeds - cNMOcc,
        mVacant: cMBeds - cMOcc,
        pct: cBeds > 0 ? Math.round((cOcc / cBeds) * 100) : 0
      };
    });

    const activeOccs = occupants.filter(o => !o.employeeStatus.startsWith('RTD'));
    const rtdResigned = occupants.filter(o => o.employeeStatus === 'RTD - Resigned').length;
    const rtdTerminated = occupants.filter(o => o.employeeStatus === 'RTD - Terminated').length;
    const rtdDismissed = occupants.filter(o => o.employeeStatus === 'RTD - Dismissed').length;

    return {
      totalBeds,
      totalOcc,
      totalVacant: totalBeds - totalOcc,
      nmBeds,
      nmOcc,
      nmVacant: nmBeds - nmOcc,
      mBeds,
      mOcc,
      mVacant: mBeds - mOcc,
      occupancyPct: totalBeds > 0 ? Math.round((totalOcc / totalBeds) * 100) : 0,
      activeStaffCount: activeOccs.length,
      onJobCount: activeOccs.filter(o => o.employeeStatus === 'On Job').length,
      onLeaveCount: activeOccs.filter(o => o.employeeStatus === 'On Leave').length,
      rtdResigned,
      rtdTerminated,
      rtdDismissed,
      campSummaries
    };
  }, [camps, occupants]);

  return (
    <div className="space-y-6">
      {/* Report Mode Selector Bar */}
      <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setReportMode('daily')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              reportMode === 'daily'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Daily Report (Per Individual Camp)
          </button>
          <button
            onClick={() => setReportMode('weekly')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              reportMode === 'weekly'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Weekly Report (Per Individual Camp)
          </button>
          <button
            onClick={() => setReportMode('monthly')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              reportMode === 'monthly'
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Monthly Report (All Camps Combined)
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {(reportMode === 'daily' || reportMode === 'weekly') && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-600">Select Camp:</span>
              <select
                value={selectedCampNo}
                onChange={(e) => setSelectedCampNo(e.target.value)}
                className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900"
              >
                {camps.map(c => (
                  <option key={c.id} value={c.campNo}>
                    {c.campNo} — {c.campArea}
                  </option>
                ))}
              </select>
            </div>
          )}

          <input
            type="date"
            value={reportDate}
            onChange={(e) => setReportDate(e.target.value)}
            className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-mono text-slate-800"
          />

          <button
            onClick={() => window.print()}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            Print Report
          </button>
        </div>
      </div>

      {/* DAILY OR WEEKLY REPORT (PER INDIVIDUAL CAMP) */}
      {(reportMode === 'daily' || reportMode === 'weekly') && individualCampMetrics && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
              <div>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-cyan-50 text-cyan-700 font-bold border border-cyan-200">
                  {reportMode === 'daily' ? `DAILY CAMP SNAPSHOT (${reportDate})` : `WEEKLY CAMP SUMMARY (7-DAY PERIOD ENDING ${reportDate})`}
                </span>
                <h3 className="text-lg font-black text-slate-900 mt-1">
                  {individualCampMetrics.camp.campNo} — {individualCampMetrics.camp.campArea}
                </h3>
                <p className="text-xs text-slate-500">
                  Camp Start Date: <strong>{individualCampMetrics.camp.campStartDate || '2022-01-01'}</strong> • Master Cost Center: <strong>{individualCampMetrics.camp.costCenter}</strong>
                </p>
              </div>

              <div className="text-right">
                <div className="text-xs text-slate-500">Camp Vacancy Status</div>
                <div className="text-xl font-black text-emerald-600">
                  {individualCampMetrics.vacantBeds} Free Beds / {individualCampMetrics.totalBeds} Total
                </div>
              </div>
            </div>

            {/* Vacancy by Grade Type (Non-Manual vs Manual) */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-cyan-50/60 border border-cyan-200">
                <div className="text-xs font-bold text-cyan-900">Non-Manual Capacity</div>
                <div className="text-2xl font-black text-cyan-700 mt-1">
                  {individualCampMetrics.nonManualVacant} Free
                </div>
                <div className="text-[11px] text-cyan-800 mt-0.5">
                  Occupied: {individualCampMetrics.nonManualOccupied} / {individualCampMetrics.nonManualBeds} Beds ({individualCampMetrics.nonManualFlats} Flats)
                </div>
              </div>

              <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200">
                <div className="text-xs font-bold text-amber-900">Manual (Labor) Capacity</div>
                <div className="text-2xl font-black text-amber-700 mt-1">
                  {individualCampMetrics.manualVacant} Free
                </div>
                <div className="text-[11px] text-amber-800 mt-0.5">
                  Occupied: {individualCampMetrics.manualOccupied} / {individualCampMetrics.manualBeds} Beds ({individualCampMetrics.manualFlats} Flats)
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-xs font-bold text-slate-700">Active Attendance</div>
                <div className="text-2xl font-black text-slate-900 mt-1">
                  {individualCampMetrics.onJobCount} On Job
                </div>
                <div className="text-[11px] text-amber-700 font-semibold mt-0.5">
                  ✈ {individualCampMetrics.onLeaveCount} Currently On Leave
                </div>
              </div>

              <div className="p-4 rounded-xl bg-rose-50/60 border border-rose-200">
                <div className="text-xs font-bold text-rose-900">RTD (Resigned / Term / Dism)</div>
                <div className="text-2xl font-black text-rose-700 mt-1">
                  {individualCampMetrics.campRtds.length} RTD Exits
                </div>
                <div className="text-[11px] text-rose-700 mt-0.5">
                  Beds automatically vacated
                </div>
              </div>
            </div>

            {/* Floor-by-Floor Vacancy Table for this Camp */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5">
                Floor-by-Floor Flat & Vacancy Breakdown ({individualCampMetrics.camp.campNo})
              </h4>
              <div className="border border-slate-200 rounded-xl overflow-x-auto">
                <table className="w-full text-left text-xs whitespace-nowrap">
                  <thead className="bg-slate-100 text-slate-600 uppercase font-mono text-[10px] border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-4">Floor #</th>
                      <th className="py-2.5 px-4">Total Flats on Floor</th>
                      <th className="py-2.5 px-4">Non-Manual Flats</th>
                      <th className="py-2.5 px-4">Manual Flats</th>
                      <th className="py-2.5 px-4">Total Beds</th>
                      <th className="py-2.5 px-4">Occupied Beds</th>
                      <th className="py-2.5 px-4">Vacant / Free Beds</th>
                      <th className="py-2.5 px-4">Occupancy %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {individualCampMetrics.floorBreakdown.map(fl => (
                      <tr key={fl.floorNo} className="hover:bg-slate-50">
                        <td className="py-2.5 px-4 font-bold text-slate-900">Floor {fl.floorNo}</td>
                        <td className="py-2.5 px-4 font-semibold text-slate-700">{fl.flatsCount} Flats</td>
                        <td className="py-2.5 px-4 text-cyan-700 font-bold">{fl.nmFlats} Non-Manual</td>
                        <td className="py-2.5 px-4 text-amber-700 font-bold">{fl.mFlats} Manual</td>
                        <td className="py-2.5 px-4 font-mono">{fl.beds}</td>
                        <td className="py-2.5 px-4 font-mono font-bold text-cyan-700">{fl.occupied}</td>
                        <td className="py-2.5 px-4 font-mono font-bold text-emerald-700">{fl.vacant} Free</td>
                        <td className="py-2.5 px-4 font-mono">{fl.pct}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Leave & RTD Logs */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-2">
              <div className="border border-slate-200 rounded-xl p-4 space-y-2">
                <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Plane className="w-4 h-4 text-amber-600" />
                  Leave & Return Tracker ({individualCampMetrics.camp.campNo})
                </div>
                {individualCampMetrics.campLeaves.length > 0 ? (
                  <div className="divide-y divide-slate-100 text-xs">
                    {individualCampMetrics.campLeaves.map(lv => (
                      <div key={lv.id} className="py-2 flex items-center justify-between">
                        <div>
                          <span className="font-mono font-bold text-cyan-700">#{lv.employeeId}</span>{' '}
                          <span className="font-semibold text-slate-900">{lv.employeeName}</span>
                          <div className="text-[11px] text-slate-500">
                            Leave: {lv.leaveStartDate} → Exp: {lv.expectedEndDate}
                          </div>
                        </div>
                        <div className="text-right">
                          {lv.actualReturnDate ? (
                            <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                              Returned: {lv.actualReturnDate}
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-bold">
                              Currently On Leave
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-slate-400 italic py-2">No leave logs recorded for this camp.</div>
                )}
              </div>

              <div className="border border-slate-200 rounded-xl p-4 space-y-2">
                <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <UserX className="w-4 h-4 text-rose-600" />
                  RTD Log — Resigned, Terminated & Dismissed ({individualCampMetrics.camp.campNo})
                </div>
                {individualCampMetrics.campRtds.length > 0 ? (
                  <div className="divide-y divide-slate-100 text-xs">
                    {individualCampMetrics.campRtds.map(r => (
                      <div key={r.id} className="py-2 flex items-center justify-between">
                        <div>
                          <span className="font-mono font-bold text-rose-700">#{r.employeeId}</span>{' '}
                          <span className="font-semibold text-slate-900">{r.employeeName}</span>
                          <div className="text-[11px] text-slate-500">
                            Vacated Room {r.vacatedRoomNo} • {r.remarks}
                          </div>
                        </div>
                        <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold">
                          {r.rtdType} ({r.rtdDate})
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-slate-400 italic py-2">No RTD exits recorded for this camp.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MONTHLY REPORT (ALL CAMPS COMBINED) */}
      {reportMode === 'monthly' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
              <div>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-bold border border-indigo-200">
                  EXECUTIVE MONTHLY CONSOLIDATED REPORT — ALL CAMPS COMBINED
                </span>
                <h3 className="text-lg font-black text-slate-900 mt-1">
                  Dhow Engineering Accommodation Network ({camps.length} Buildings Combined)
                </h3>
              </div>
              <div className="text-right">
                <div className="text-xs text-slate-500">Combined Network Vacancy</div>
                <div className="text-xl font-black text-emerald-600">
                  {combinedMonthlyMetrics.totalVacant} Free Beds / {combinedMonthlyMetrics.totalBeds} Total ({combinedMonthlyMetrics.occupancyPct}% Full)
                </div>
              </div>
            </div>

            {/* Combined KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-cyan-50/70 border border-cyan-200">
                <div className="text-xs font-bold text-cyan-900">Combined Non-Manual</div>
                <div className="text-2xl font-black text-cyan-700 mt-1">{combinedMonthlyMetrics.nmVacant} Free</div>
                <div className="text-[11px] text-cyan-800">
                  Occupied: {combinedMonthlyMetrics.nmOcc} / {combinedMonthlyMetrics.nmBeds} Beds
                </div>
              </div>

              <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200">
                <div className="text-xs font-bold text-amber-900">Combined Manual (Labor)</div>
                <div className="text-2xl font-black text-amber-700 mt-1">{combinedMonthlyMetrics.mVacant} Free</div>
                <div className="text-[11px] text-amber-800">
                  Occupied: {combinedMonthlyMetrics.mOcc} / {combinedMonthlyMetrics.mBeds} Beds
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-xs font-bold text-slate-700">Active Workforce Status</div>
                <div className="text-2xl font-black text-slate-900 mt-1">{combinedMonthlyMetrics.onJobCount} On Job</div>
                <div className="text-[11px] text-amber-700 font-bold">
                  ✈ {combinedMonthlyMetrics.onLeaveCount} On Leave
                </div>
              </div>

              <div className="p-4 rounded-xl bg-rose-50/70 border border-rose-200">
                <div className="text-xs font-bold text-rose-900">Combined Monthly RTDs</div>
                <div className="text-2xl font-black text-rose-700 mt-1">
                  {combinedMonthlyMetrics.rtdResigned + combinedMonthlyMetrics.rtdTerminated + combinedMonthlyMetrics.rtdDismissed} Total
                </div>
                <div className="text-[11px] text-rose-800">
                  Resigned: {combinedMonthlyMetrics.rtdResigned} • Term: {combinedMonthlyMetrics.rtdTerminated} • Dism: {combinedMonthlyMetrics.rtdDismissed}
                </div>
              </div>
            </div>

            {/* All Camps Comparison Table */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5">
                All Camp Buildings Consolidated Matrix
              </h4>
              <div className="border border-slate-200 rounded-xl overflow-x-auto">
                <table className="w-full text-left text-xs whitespace-nowrap">
                  <thead className="bg-slate-100 text-slate-600 uppercase font-mono text-[10px] border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Camp #</th>
                      <th className="py-3 px-4">Area / Location</th>
                      <th className="py-3 px-4">Camp Start Date</th>
                      <th className="py-3 px-4">Floors / Flats</th>
                      <th className="py-3 px-4">Non-Manual Free</th>
                      <th className="py-3 px-4">Manual Free</th>
                      <th className="py-3 px-4">Occupied / Total Beds</th>
                      <th className="py-3 px-4">Total Vacant</th>
                      <th className="py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {combinedMonthlyMetrics.campSummaries.map(c => (
                      <tr key={c.id} className="hover:bg-slate-50">
                        <td className="py-3 px-4 font-bold text-slate-900">{c.campNo}</td>
                        <td className="py-3 px-4 text-slate-700">{c.campArea}</td>
                        <td className="py-3 px-4 font-mono text-slate-600">{c.campStartDate || '2022-01-01'}</td>
                        <td className="py-3 px-4 font-semibold">{c.floors.length} Flrs • {c.flatsCount} Flats</td>
                        <td className="py-3 px-4 font-mono font-bold text-cyan-700">{c.nmVacant} Free</td>
                        <td className="py-3 px-4 font-mono font-bold text-amber-700">{c.mVacant} Free</td>
                        <td className="py-3 px-4 font-mono">{c.occupied} / {c.beds} ({c.pct}%)</td>
                        <td className="py-3 px-4 font-mono font-black text-emerald-700">{c.vacant} Beds</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            c.status === 'Decommissioned' ? 'bg-rose-100 text-rose-800' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}>
                            {c.status || 'Active'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}