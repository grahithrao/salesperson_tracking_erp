'use client';

import React, { useEffect, useState } from 'react';
import AdminShell from '@/components/layout/AdminShell';
import { CalendarCheck, MapPin, AlertTriangle, CheckCircle, Search, User } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function ClientVisitsPage() {
  const { token } = useAuth();
  const [visits, setVisits] = useState<any[]>([]);
  const [outcomeFilter, setOutcomeFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchVisits = async () => {
    if (!token) return;
    try {
      let url = '/api/visits';
      if (outcomeFilter) url += `?outcome=${outcomeFilter}`;

      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const json = await res.json();
        setVisits(json.data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVisits();
  }, [token, outcomeFilter]);

  return (
    <AdminShell title="Client Field Visits & GPS Verification">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <select
            value={outcomeFilter}
            onChange={(e) => setOutcomeFilter(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 shadow-sm"
          >
            <option value="">All Visit Outcomes</option>
            <option value="ORDER_TAKEN">Order Taken</option>
            <option value="PAYMENT_COLLECTED">Payment Collected</option>
            <option value="FOLLOW_UP_REQUIRED">Follow-up Required</option>
            <option value="NO_ORDER">No Order</option>
            <option value="CLIENT_CLOSED">Client Closed</option>
          </select>
          <span className="text-xs text-slate-500">{visits.length} recorded visits</span>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold">
                <th className="py-3 px-4">Client</th>
                <th className="py-3 px-4">Sales Representative</th>
                <th className="py-3 px-4">Visit Time</th>
                <th className="py-3 px-4">GPS Evidence (Distance)</th>
                <th className="py-3 px-4">Outcome</th>
                <th className="py-3 px-4">Notes & Observations</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visits.map((v) => (
                <tr key={v.id} className="hover:bg-slate-50/60 transition">
                  <td className="py-3.5 px-4 font-semibold text-slate-800">
                    {v.clientName}
                    <span className="block text-[11px] text-slate-400 font-normal">{v.clientAddress}</span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-700 font-medium">
                    {v.salespersonName} ({v.salespersonCode})
                  </td>
                  <td className="py-3.5 px-4 text-slate-600">
                    <p>{new Date(v.startedAt).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })}</p>
                    <p className="text-[11px] text-slate-400">
                      {new Date(v.startedAt).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' })}
                    </p>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-slate-800">
                        {v.distanceFromClient !== null ? `${v.distanceFromClient}m` : 'N/A'}
                      </span>
                      {v.isException ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full" title={v.exceptionReason}>
                          <AlertTriangle className="w-3 h-3 text-amber-500" />
                          Radius Breach
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                          <CheckCircle className="w-3 h-3 text-emerald-500" />
                          Within 100m
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-700">
                      {v.outcome.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 max-w-xs truncate">
                    {v.notes || 'No remarks recorded'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminShell>
  );
}
