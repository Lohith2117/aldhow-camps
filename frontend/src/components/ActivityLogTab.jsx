import React, { useState, useMemo } from 'react';
import { History, Search, Clock, User } from 'lucide-react';
import { formatTimestamp } from '../utils/helpers';

export default function ActivityLogTab({ activityLogs, onClearLogs, isSuperAdmin }) {
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  const categories = useMemo(() => {
    return Array.from(new Set(activityLogs.map(a => a.category))).filter(Boolean);
  }, [activityLogs]);

  const filteredLogs = useMemo(() => {
    return activityLogs.filter(log => {
      const q = query.toLowerCase();
      const matchesQuery =
        log.actionTitle.toLowerCase().includes(q) ||
        log.details.toLowerCase().includes(q) ||
        log.actorName.toLowerCase().includes(q) ||
        (log.campNo && log.campNo.toLowerCase().includes(q));
      const matchesCat = categoryFilter === 'ALL' || log.category === categoryFilter;
      return matchesQuery && matchesCat;
    });
  }, [activityLogs, query, categoryFilter]);

  return (
    <div className="space-y-4">
      <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <History className="w-5 h-5 text-cyan-600" />
            System Activity Time Log (Chrome History Timeline)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Chronological audit trail of every check-in, camp/flat edit, leave, return, RTD exit, relocation, and billing change.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search history actions..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-700"
          >
            <option value="ALL">All Action Types</option>
            {categories.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs text-slate-500 font-semibold">
          <span>Showing {filteredLogs.length} Chronological History Entries</span>
          <span>Real-Time Audit Stream</span>
        </div>

        <div className="divide-y divide-slate-100">
          {filteredLogs.map(log => (
            <div key={log.id} className="px-5 py-3.5 hover:bg-slate-50/90 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div className="flex items-start gap-3.5">
                <div className="font-mono text-[11px] text-slate-400 w-40 shrink-0 pt-0.5 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{formatTimestamp(log.timestamp)}</span>
                </div>

                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-slate-900">{log.actionTitle}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-50 text-cyan-700 border border-cyan-200">
                      {log.category}
                    </span>
                    {log.campNo && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-100 text-slate-700">
                        {log.campNo}
                      </span>
                    )}
                  </div>
                  <p className="text-slate-600 mt-0.5">{log.details}</p>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-semibold text-[11px]">
                  <User className="w-3 h-3 text-slate-500" />
                  {log.actorName} ({log.actorRole})
                </span>
              </div>
            </div>
          ))}

          {filteredLogs.length === 0 && (
            <div className="p-8 text-center text-xs text-slate-400 italic">
              No matching activity history entries found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}