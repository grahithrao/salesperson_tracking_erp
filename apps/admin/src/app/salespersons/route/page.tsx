'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import AdminShell from '@/components/layout/AdminShell';
import RouteMap from '@/components/maps/RouteMap';
import {
  Calendar,
  User,
  Navigation,
  MapPin,
  Clock,
  ShoppingCart,
  CreditCard,
  Building2,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

function RouteHistoryContent() {
  const searchParams = useSearchParams();
  const initialSpId = searchParams.get('salespersonId') || '';
  const { token } = useAuth();

  const [salespersons, setSalespersons] = useState<any[]>([]);
  const [selectedSpId, setSelectedSpId] = useState(initialSpId);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [routeData, setRouteData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Load salespersons list
  useEffect(() => {
    if (!token) return;
    fetch('/api/salespersons', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((json) => {
        const list = json.data || [];
        setSalespersons(list);
        if (!selectedSpId && list.length > 0) {
          setSelectedSpId(list[0].id);
        }
      });
  }, [token]);

  // Load route history for selected salesperson & date
  useEffect(() => {
    if (!token || !selectedSpId) return;
    setLoading(true);
    fetch(`/api/location/history?salespersonId=${selectedSpId}&date=${selectedDate}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((json) => {
        setRouteData(json);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [token, selectedSpId, selectedDate]);

  const points = routeData?.points || [];
  const events = routeData?.events || {};

  return (
    <AdminShell title="Salesperson Daily Route & History">
      {/* Top Filter Controls */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-sm mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-slate-400" />
            <select
              value={selectedSpId}
              onChange={(e) => setSelectedSpId(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            >
              {salespersons.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.employeeCode} - {s.territory})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            />
          </div>
        </div>

        {routeData && (
          <div className="flex items-center gap-4 text-xs">
            <div className="bg-teal-50 text-teal-800 px-3 py-1.5 rounded-lg border border-teal-200 font-semibold">
              Distance: {routeData.estimatedDistanceKm} KM
            </div>
            <div className="bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg font-medium">
              GPS Points: {routeData.pointsCount}
            </div>
          </div>
        )}
      </div>

      {/* Main Content Layout */}
      <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-220px)]">
        {/* Left: Route Polyline Map */}
        <div className="flex-1 bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden flex flex-col">
          <div className="p-3 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800">
              Route Polyline & Event Markers ({selectedDate})
            </span>
            <div className="flex items-center gap-2 text-[11px] text-slate-500">
              <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Start</span>
              <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" /> End</span>
              <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded bg-purple-500" /> Visit</span>
              <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded bg-amber-500" /> Order</span>
            </div>
          </div>
          <div className="flex-1 relative">
            <RouteMap points={points} events={events} />
          </div>
        </div>

        {/* Right: Daily Timeline of Events */}
        <div className="w-full lg:w-96 bg-white rounded-2xl border border-slate-200/90 shadow-sm flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50/50">
            <h3 className="text-sm font-bold text-slate-800">Field Activity Timeline</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Chronological visits, orders & collections</p>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Start of day */}
            {routeData?.attendance?.loginAt && (
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0">
                  S
                </div>
                <div className="text-xs">
                  <p className="font-semibold text-slate-900">Work Session Started</p>
                  <p className="text-slate-400 text-[11px]">
                    {new Date(routeData.attendance.loginAt).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' })}
                  </p>
                </div>
              </div>
            )}

            {/* Visits */}
            {(events.visits || []).map((v: any) => (
              <div key={v.id} className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs shrink-0">
                  <Building2 className="w-3.5 h-3.5" />
                </div>
                <div className="text-xs">
                  <p className="font-semibold text-slate-900">Visit: {v.clientName}</p>
                  <p className="text-slate-500 text-[11px]">Outcome: {v.outcome}</p>
                  <p className="text-slate-400 text-[10px]">
                    {new Date(v.startedAt).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' })} • Distance: {v.distanceFromClient || 0}m
                  </p>
                </div>
              </div>
            ))}

            {/* Orders */}
            {(events.orders || []).map((o: any) => (
              <div key={o.id} className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xs shrink-0">
                  <ShoppingCart className="w-3.5 h-3.5" />
                </div>
                <div className="text-xs">
                  <p className="font-semibold text-slate-900">Order #{o.orderNumber}</p>
                  <p className="text-slate-700 font-bold">₹{o.grandTotal.toLocaleString('en-IN')}</p>
                  <p className="text-slate-400 text-[10px]">
                    {new Date(o.createdAt).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' })} • {o.clientName}
                  </p>
                </div>
              </div>
            ))}

            {/* Payments */}
            {(events.payments || []).map((p: any) => (
              <div key={p.id} className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0">
                  <CreditCard className="w-3.5 h-3.5" />
                </div>
                <div className="text-xs">
                  <p className="font-semibold text-slate-900">Payment {p.receiptNumber}</p>
                  <p className="text-emerald-700 font-bold">₹{p.amount.toLocaleString('en-IN')} ({p.method})</p>
                  <p className="text-slate-400 text-[10px]">
                    {new Date(p.collectedAt).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' })} • {p.clientName}
                  </p>
                </div>
              </div>
            ))}

            {/* End of day */}
            {routeData?.attendance?.logoutAt && (
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-red-100 text-red-700 flex items-center justify-center font-bold text-xs shrink-0">
                  E
                </div>
                <div className="text-xs">
                  <p className="font-semibold text-slate-900">Work Session Ended</p>
                  <p className="text-slate-400 text-[11px]">
                    {new Date(routeData.attendance.logoutAt).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' })}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminShell>
  );
}

export default function RouteHistoryPage() {
  return (
    <Suspense fallback={<div className="p-8 text-xs text-slate-400">Loading route history...</div>}>
      <RouteHistoryContent />
    </Suspense>
  );
}
