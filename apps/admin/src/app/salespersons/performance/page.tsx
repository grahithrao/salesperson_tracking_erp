'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import AdminShell from '@/components/layout/AdminShell';
import {
  Award,
  Calendar,
  IndianRupee,
  ShoppingCart,
  Users,
  Navigation,
  Clock,
  Filter,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

function PerformanceContent() {
  const searchParams = useSearchParams();
  const initialSpId = searchParams.get('salespersonId') || '';
  const { token } = useAuth();

  const [salespersons, setSalespersons] = useState<any[]>([]);
  const [selectedSpId, setSelectedSpId] = useState(initialSpId);
  const [range, setRange] = useState('this_month');
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    if (!token || !selectedSpId) return;
    setLoading(true);
    fetch(`/api/salespersons/${selectedSpId}/performance?range=${range}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((json) => setMetrics(json))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [token, selectedSpId, range]);

  const selectedSp = salespersons.find((s) => s.id === selectedSpId);

  return (
    <AdminShell title="Salesperson Performance Analytics">
      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-sm mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={selectedSpId}
            onChange={(e) => setSelectedSpId(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
          >
            {salespersons.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.employeeCode} - {s.territory})
              </option>
            ))}
          </select>

          <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
            {[
              { id: 'today', label: 'Today' },
              { id: 'this_week', label: 'This Week' },
              { id: 'this_month', label: 'This Month' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setRange(tab.id)}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition ${
                  range === tab.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {selectedSp && (
          <div className="text-xs text-slate-500">
            Reporting Period:{' '}
            <span className="font-semibold text-slate-700 capitalize">{range.replace('_', ' ')}</span>
          </div>
        )}
      </div>

      {/* Metrics Cards */}
      {metrics && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
          {/* Sales */}
          <div className="bg-white p-6 rounded-xl border border-slate-200/90 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Confirmed Order Sales</span>
              <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
                <IndianRupee className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-bold text-slate-900">
                ₹{(metrics.totalSales || 0).toLocaleString('en-IN')}
              </p>
              <p className="text-xs text-emerald-600 mt-1 font-medium">{metrics.ordersCount || 0} Orders Closed</p>
            </div>
          </div>

          {/* Collections */}
          <div className="bg-white p-6 rounded-xl border border-slate-200/90 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Verified Collections</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Award className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-bold text-slate-900">
                ₹{(metrics.totalCollections || 0).toLocaleString('en-IN')}
              </p>
              <p className="text-xs text-slate-500 mt-1">Reconciled to Client Ledgers</p>
            </div>
          </div>

          {/* Visits */}
          <div className="bg-white p-6 rounded-xl border border-slate-200/90 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Client Outreaches</span>
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-bold text-slate-900">{metrics.clientsVisited || 0}</p>
              <p className="text-xs text-slate-500 mt-1">Visits completed with GPS proof</p>
            </div>
          </div>

          {/* Distance */}
          <div className="bg-white p-6 rounded-xl border border-slate-200/90 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Distance Travelled</span>
              <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                <Navigation className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-bold text-slate-900">{metrics.distanceKm || 0} KM</p>
              <p className="text-xs text-slate-500 mt-1">Filtered GPS travel path</p>
            </div>
          </div>

          {/* Working Days */}
          <div className="bg-white p-6 rounded-xl border border-slate-200/90 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Working Days</span>
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-bold text-slate-900">{metrics.workingDays || 0} Days</p>
              <p className="text-xs text-slate-500 mt-1">Logged duty sessions</p>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
}

export default function PerformancePage() {
  return (
    <Suspense fallback={<div className="p-8 text-xs text-slate-400">Loading performance data...</div>}>
      <PerformanceContent />
    </Suspense>
  );
}
