'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import AdminShell from '@/components/layout/AdminShell';
import LiveMap from '@/components/maps/LiveMap';
import {
  Navigation2,
  Battery,
  Zap,
  Clock,
  Radio,
  RefreshCw,
  Search,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function LiveTrackingPage() {
  const { token } = useAuth();
  const [trackers, setTrackers] = useState<any[]>([]);
  const [liveStatuses, setLiveStatuses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [filterDuty, setFilterDuty] = useState<'ALL' | 'ON_DUTY' | 'OFF_DUTY'>('ALL');

  const fetchTrackingData = async () => {
    if (!token) return;
    try {
      const [currentRes, statusRes] = await fetch('/api/location/current', {
        headers: { Authorization: `Bearer ${token}` },
      }).then(async (r) => [await r.json(), await fetch('/api/salespersons/live-status', { headers: { Authorization: `Bearer ${token}` } }).then(s => s.json())]);

      setTrackers(currentRes.data || []);
      setLiveStatuses(statusRes.data || []);
      setLastRefreshed(new Date());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrackingData();
    const interval = setInterval(fetchTrackingData, 10000); // 10s live polling
    return () => clearInterval(interval);
  }, [token]);

  const filteredStatuses = liveStatuses.filter((s) => {
    if (filterDuty === 'ON_DUTY') return s.dutyStatus === 'ON_DUTY';
    if (filterDuty === 'OFF_DUTY') return s.dutyStatus !== 'ON_DUTY';
    return true;
  });

  return (
    <AdminShell title="Live Field Tracking">
      <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-140px)]">
        {/* Left Side: Real-time map */}
        <div className="flex-1 bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Real-Time Territory Coverage Map
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[11px] text-slate-400">
                Auto-updates every 10s • Last: {lastRefreshed.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' })}
              </span>
              <button
                onClick={fetchTrackingData}
                className="p-1.5 text-slate-500 hover:text-teal-600 hover:bg-slate-100 rounded-md transition"
                title="Refresh now"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          <div className="flex-1 relative">
            <LiveMap salespersons={trackers} />
          </div>
        </div>

        {/* Right Side: Salespersons Live Status Feed (Section 15) */}
        <div className="w-full lg:w-96 bg-white rounded-2xl border border-slate-200/90 shadow-sm flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50/50">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-800">Salesperson Status</h3>
              <span className="text-xs font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full">
                {liveStatuses.filter((s) => s.dutyStatus === 'ON_DUTY').length} On Duty
              </span>
            </div>
            <div className="flex gap-1.5">
              {(['ALL', 'ON_DUTY', 'OFF_DUTY'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setFilterDuty(mode)}
                  className={`flex-1 py-1 text-[11px] font-semibold rounded-md transition ${
                    filterDuty === mode
                      ? 'bg-teal-600 text-white shadow-sm'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  {mode.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2 space-y-1">
            {filteredStatuses.map((s) => {
              const isOnDuty = s.dutyStatus === 'ON_DUTY';
              return (
                <div key={s.id} className="p-3 rounded-xl hover:bg-slate-50 transition border border-transparent hover:border-slate-200">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${isOnDuty ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                        <h4 className="text-xs font-bold text-slate-900">{s.salespersonName}</h4>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">{s.territory} • {s.employeeCode}</p>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isOnDuty ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {s.dutyStatus}
                    </span>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] bg-slate-50/70 p-2 rounded-lg border border-slate-100">
                    <div className="flex items-center gap-1.5 text-slate-600">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>{s.lastUpdateFormatted}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-600">
                      <Zap className="w-3 h-3 text-amber-500" />
                      <span>{s.speed ? `${s.speed} km/h` : 'Stationary'}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-600">
                      <Battery className="w-3 h-3 text-slate-400" />
                      <span>{s.batteryLevel ? `${s.batteryLevel}%` : 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-600">
                      <Radio className="w-3 h-3 text-teal-500" />
                      <span>{s.networkType || '4G LTE'}</span>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between pt-1">
                    <span className="text-[10px] text-slate-400">
                      {s.loginAt ? `In: ${new Date(s.loginAt).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' })}` : 'Not logged in today'}
                    </span>
                    <Link
                      href={`/salespersons/route?salespersonId=${s.id}`}
                      className="text-[11px] font-semibold text-teal-600 hover:text-teal-700 hover:underline flex items-center gap-0.5"
                    >
                      <span>Route History</span>
                      <ChevronRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
