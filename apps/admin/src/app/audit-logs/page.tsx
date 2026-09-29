'use client';

import React, { useEffect, useState } from 'react';
import AdminShell from '@/components/layout/AdminShell';
import { ShieldAlert, Search, Filter, Clock, Laptop, ChevronDown, ChevronRight } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function AuditLogsPage() {
  const { token } = useAuth();
  const [logs, setLogs] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [moduleFilter, setModuleFilter] = useState('');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    if (!token) return;
    try {
      let url = `/api/audit-logs?search=${encodeURIComponent(search)}`;
      if (moduleFilter) url += `&module=${moduleFilter}`;

      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const json = await res.json();
        setLogs(json.data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [token, search, moduleFilter]);

  const toggleExpand = (id: string) => {
    setExpandedLogId(expandedLogId === id ? null : id);
  };

  return (
    <AdminShell title="System Audit Logs & Security Traceability">
      {/* Top filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search action, module, record ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-xs w-72 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 shadow-sm"
            />
          </div>

          <select
            value={moduleFilter}
            onChange={(e) => setModuleFilter(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 shadow-sm"
          >
            <option value="">All System Modules</option>
            <option value="AUTH">Authentication</option>
            <option value="CLIENT_ASSIGNMENT">Client Assignment</option>
            <option value="ORDER">Orders</option>
            <option value="PAYMENT">Payments</option>
            <option value="ATTENDANCE">Attendance</option>
            <option value="VISIT">Visits</option>
            <option value="SETTINGS">Settings</option>
          </select>
        </div>

        <span className="text-xs text-slate-500">{logs.length} audit entries captured</span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold">
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Actor</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Module</th>
                <th className="py-3 px-4">Record ID</th>
                <th className="py-3 px-4">IP & Device</th>
                <th className="py-3 px-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.map((l) => {
                const isExpanded = expandedLogId === l.id;
                return (
                  <React.Fragment key={l.id}>
                    <tr className="hover:bg-slate-50/60 transition cursor-pointer" onClick={() => toggleExpand(l.id)}>
                      <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                        {new Date(l.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-800">
                        {l.userName}
                        <span className="block text-[10px] text-teal-600 font-normal uppercase">{l.userRole}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                          {l.action}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 font-medium">{l.module}</td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500 max-w-[120px] truncate">
                        {l.recordId || '—'}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                        <span>{l.ip}</span>
                        <span className="block text-[10px] text-slate-400 truncate max-w-[140px]">{l.device}</span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button className="p-1 text-slate-400 hover:text-slate-700">
                          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </button>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr className="bg-slate-50/90 border-b border-slate-200">
                        <td colSpan={7} className="p-4 text-xs">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="font-semibold text-slate-600 mb-1 text-[11px]">Old State (Before):</p>
                              <pre className="p-2.5 bg-slate-900 text-slate-200 rounded-lg text-[10px] overflow-x-auto font-mono">
                                {JSON.stringify(l.oldValue || {}, null, 2)}
                              </pre>
                            </div>
                            <div>
                              <p className="font-semibold text-slate-600 mb-1 text-[11px]">New State (After):</p>
                              <pre className="p-2.5 bg-slate-900 text-teal-300 rounded-lg text-[10px] overflow-x-auto font-mono">
                                {JSON.stringify(l.newValue || {}, null, 2)}
                              </pre>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </AdminShell>
  );
}
