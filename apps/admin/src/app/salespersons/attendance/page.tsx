'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import AdminShell from '@/components/layout/AdminShell';
import { Calendar, User, Clock, Navigation, MapPin } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function AttendancePage() {
  const { token } = useAuth();
  const [attendances, setAttendances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [salespersonId, setSalespersonId] = useState('');
  const [salespersons, setSalespersons] = useState<any[]>([]);

  useEffect(() => {
    if (!token) return;
    fetch('/api/salespersons', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((json) => setSalespersons(json.data || []));
  }, [token]);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    let url = '/api/attendance/history';
    if (salespersonId) url += `?salespersonId=${salespersonId}`;

    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((json) => setAttendances(json.data || []))
      .finally(() => setLoading(false));
  }, [token, salespersonId]);

  return (
    <AdminShell title="Salesperson Attendance & Work Sessions">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <select
            value={salespersonId}
            onChange={(e) => setSalespersonId(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 shadow-sm"
          >
            <option value="">All Sales Representatives</option>
            {salespersons.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.employeeCode})
              </option>
            ))}
          </select>
          <span className="text-xs text-slate-500">{attendances.length} shift logs found</span>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold">
                <th className="py-3 px-4">Salesperson</th>
                <th className="py-3 px-4">Territory</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Login Time</th>
                <th className="py-3 px-4">Logout Time</th>
                <th className="py-3 px-4">Work Duration</th>
                <th className="py-3 px-4">Est. Distance</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Route Map</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {attendances.map((a) => {
                const hours = Math.floor(a.workingMinutes / 60);
                const mins = a.workingMinutes % 60;
                const formattedTime = a.workingMinutes > 0 ? `${hours}h ${mins}m` : 'In Session';
                const dateStr = a.date.split('T')[0];

                return (
                  <tr key={a.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3.5 px-4 font-semibold text-slate-800">
                      {a.salespersonName}
                      <span className="block text-[11px] text-slate-400 font-normal">{a.employeeCode}</span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">{a.territory}</td>
                    <td className="py-3.5 px-4 font-medium text-slate-700">{dateStr}</td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {new Date(a.loginAt).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' })}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {a.logoutAt
                        ? new Date(a.logoutAt).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' })
                        : 'Active Shift'}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-700">{formattedTime}</td>
                    <td className="py-3.5 px-4 font-bold text-teal-700">{a.distanceKm} KM</td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          a.status === 'ON_DUTY'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {a.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        href={`/salespersons/route?salespersonId=${a.salespersonId}&date=${dateStr}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-50 hover:bg-teal-50 text-slate-700 hover:text-teal-700 border border-slate-200 hover:border-teal-300 rounded-md text-[11px] font-medium transition"
                      >
                        <MapPin className="w-3 h-3" />
                        <span>Replay</span>
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </AdminShell>
  );
}
