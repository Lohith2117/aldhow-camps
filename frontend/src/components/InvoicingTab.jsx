import React from 'react';
import { Receipt, Download, Tag, SlidersHorizontal } from 'lucide-react';

export default function InvoicingTab({
  billingPeriod,
  setBillingPeriod,
  rates,
  setRates,
  otherCosts,
  onUpdateOtherCost,
  projectInvoicingData,
  setShowManageCostCentersModal,
  setSelectedInvoiceModal,
  handleExportInvoicingCSV
}) {
  return (
    <div className="space-y-6">
      {/* Top Toolbar: Rate Card Configuration & Month Selection */}
      <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Receipt className="w-5 h-5 text-emerald-600" />
              Inter-Department Camp Recharge & Project Billing (With "Others" Misc. Costs)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Monthly recharge debited to project cost centers (Non-Manual, Manual & Others/Misc. Camp Costs) and credited to Master <strong>1ACD000</strong>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={billingPeriod}
              onChange={(e) => setBillingPeriod(e.target.value)}
              className="bg-slate-50 border border-slate-300 font-bold text-xs rounded-xl px-3 py-2 text-slate-800"
            >
              <option value="November 2026">Billing Period: November 2026</option>
              <option value="October 2026">Billing Period: October 2026</option>
              <option value="December 2026">Billing Period: December 2026</option>
            </select>

            <button
              onClick={() => setShowManageCostCentersModal(true)}
              className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Tag className="w-3.5 h-3.5 text-cyan-400" />
              Manage Cost Centers
            </button>

            <button
              onClick={handleExportInvoicingCSV}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Export Billing CSV
            </button>
          </div>
        </div>

        {/* Bed Rate Card: Non-Manual & Manual */}
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="font-bold text-slate-700 flex items-center gap-1.5">
            <SlidersHorizontal className="w-4 h-4 text-cyan-600" />
            Monthly Bed Recharge Rate Card (Per Occupant):
          </div>

          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-cyan-100 text-cyan-800 font-bold">Non-Manual (Eng / Foreman):</span>
              <input
                type="number"
                value={rates.nonManual}
                onChange={(e) => setRates({ ...rates, nonManual: Number(e.target.value) })}
                className="w-24 bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-right font-bold text-cyan-700"
              />
              <span className="text-slate-500 font-mono">KWD / bed</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold">Manual (Labor):</span>
              <input
                type="number"
                value={rates.manual}
                onChange={(e) => setRates({ ...rates, manual: Number(e.target.value) })}
                className="w-24 bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-right font-bold text-amber-700"
              />
              <span className="text-slate-500 font-mono">KWD / bed</span>
            </div>
          </div>
        </div>
      </div>

      {/* Invoicing Roll-up Table with Non-Manual, Manual & Others (Misc Costs) */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="font-bold text-slate-800">
            {projectInvoicingData.items.length} Project Cost Centers • Enter "Others" (Miscellaneous Camp Costs) Directly Below
          </div>
          <div className="flex items-center gap-4">
            <span className="text-slate-600">
              Non-Manual: <strong>{projectInvoicingData.totalNonManualKWD.toFixed(3)} KWD</strong>
            </span>
            <span className="text-slate-600">
              Manual: <strong>{projectInvoicingData.totalManualKWD.toFixed(3)} KWD</strong>
            </span>
            <span className="text-purple-700">
              Others (Misc): <strong>{projectInvoicingData.totalOthersKWD.toFixed(3)} KWD</strong>
            </span>
            <span className="text-emerald-700 font-black text-sm">
              Grand Total: {projectInvoicingData.grandTotalKWD.toFixed(3)} KWD
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead className="bg-slate-100 text-slate-600 uppercase font-mono text-[10px] border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">Debit Cost Center</th>
                <th className="py-3.5 px-4">Project / Division</th>
                <th className="py-3.5 px-4">Non-Manual ({rates.nonManual} KWD)</th>
                <th className="py-3.5 px-4">Manual ({rates.manual} KWD)</th>
                <th className="py-3.5 px-4 bg-purple-50/70 text-purple-900">Others / Misc. Cost (KWD)</th>
                <th className="py-3.5 px-4 bg-purple-50/70 text-purple-900">Others Description / Note</th>
                <th className="py-3.5 px-4 text-right">Total Recharge</th>
                <th className="py-3.5 px-4 text-right">Invoice</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {projectInvoicingData.items.map(item => {
                const miscObj = otherCosts[item.costCenter] || { amount: 0, description: '' };
                return (
                  <tr key={item.costCenter} className="hover:bg-slate-50">
                    <td className="py-3.5 px-4 font-mono font-bold text-cyan-600">{item.costCenter}</td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{item.projectName}</div>
                      <span className="px-2 py-0.5 rounded bg-cyan-50 text-cyan-700 font-bold text-[10px]">
                        {item.division} • {item.totalOccupants} Staff
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-mono font-bold text-cyan-700">{item.nonManualBeds} Beds</div>
                      <div className="text-[11px] text-slate-500 font-mono">{item.nonManualAmountKWD.toFixed(3)} KWD</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-mono font-bold text-amber-700">{item.manualBeds} Beds</div>
                      <div className="text-[11px] text-slate-500 font-mono">{item.manualAmountKWD.toFixed(3)} KWD</div>
                    </td>
                    <td className="py-3.5 px-4 bg-purple-50/30">
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          value={miscObj.amount}
                          onChange={(e) => onUpdateOtherCost(item.costCenter, Number(e.target.value), miscObj.description)}
                          className="w-24 bg-white border border-purple-300 rounded-lg px-2 py-1 text-right font-mono font-bold text-purple-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                        <span className="text-[10px] font-mono text-purple-700">KWD</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 bg-purple-50/30">
                      <input
                        type="text"
                        placeholder="e.g. Catering, Transport, Utilities..."
                        value={miscObj.description}
                        onChange={(e) => onUpdateOtherCost(item.costCenter, miscObj.amount, e.target.value)}
                        className="w-52 bg-white border border-purple-200 rounded-lg px-2.5 py-1 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </td>
                    <td className="py-3.5 px-4 text-right font-black text-sm text-slate-900 font-mono">
                      {item.totalAmountKWD.toFixed(3)} KWD
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setSelectedInvoiceModal(item)}
                        className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <Receipt className="w-3.5 h-3.5 text-cyan-400" />
                        <span>View Invoice</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}