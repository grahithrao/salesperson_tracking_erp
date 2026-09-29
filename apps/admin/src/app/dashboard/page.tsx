'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import AdminShell from '@/components/layout/AdminShell';
import {
  Users,
  Building2,
  ShoppingCart,
  IndianRupee,
  ShieldCheck,
  Clock,
  ArrowUpRight,
  TrendingUp,
  MapPin,
  ChevronRight,
  AlertCircle,
  FileSpreadsheet,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  AreaChart,
  Area,
} from 'recharts';

export default function DashboardPage() {
  const { token } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/dashboard/summary', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [token]);

  const kpis = data?.kpis || {};
  const charts = data?.charts || {};

  return (
    <AdminShell title="Operational Overview">
      {/* Quick Action Banner */}
      <div className="mb-8 p-6 bg-gradient-to-r from-slate-900 via-slate-800 to-teal-950 rounded-2xl text-white shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-semibold tracking-wider uppercase text-teal-400">
            Real-Time Operations
          </span>
          <h2 className="text-xl font-bold mt-1">Field Tracking & Sales Command Center</h2>
          <p className="text-xs text-slate-300 mt-1 max-w-xl">
            Live duty attendance, real-time GPS locations, transactional order approvals, and collection reconciliation.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/salespersons/live"
            className="flex items-center gap-2 px-4 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-semibold text-xs rounded-lg transition shadow-md shadow-teal-500/20"
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Open Live Map</span>
          </Link>
          <Link
            href="/payments?status=PENDING"
            className="flex items-center gap-2 px-4 py-2 bg-slate-700/80 hover:bg-slate-700 text-white font-medium text-xs rounded-lg border border-slate-600 transition"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-teal-300" />
            <span>Verify Collections</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {/* Total Salespersons */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Sales Representatives</span>
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{kpis.totalSalespersons ?? 0}</span>
            <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              {kpis.activeSalespersons ?? 0} On Duty Now
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">Active duty location tracking enabled</p>
        </div>

        {/* Total Clients */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Clients</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{kpis.totalClients ?? 0}</span>
            <span className="text-xs font-medium text-slate-500">Retail & Wholesale</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">Assigned across field territories</p>
        </div>

        {/* Today's Sales */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Today's Order Sales</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ShoppingCart className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">
              ₹{(kpis.todaySales ?? 0).toLocaleString('en-IN')}
            </span>
            <span className="text-xs font-medium text-emerald-600">
              {kpis.todayOrdersCount ?? 0} Orders
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">Net confirmed orders for today</p>
        </div>

        {/* Total Outstanding */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Client Outstanding</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">
              ₹{(kpis.totalOutstanding ?? 0).toLocaleString('en-IN')}
            </span>
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-[11px] text-slate-400">
            <span>Today's Verified:</span>
            <span className="font-semibold text-slate-700">₹{(kpis.todayVerifiedCollections ?? 0).toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Sales by Day Chart */}
        <div className="bg-white p-6 rounded-xl border border-slate-200/90 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Sales Trend (Last 7 Days)</h3>
              <p className="text-xs text-slate-400">Daily confirmed order revenue</p>
            </div>
            <span className="text-xs font-medium text-teal-600 bg-teal-50 px-2 py-1 rounded-md">
              7 Day Total: ₹{(charts.salesByDay || []).reduce((acc: number, curr: any) => acc + curr.amount, 0).toLocaleString('en-IN')}
            </span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={charts.salesByDay || []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0f766e" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#0f766e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickFormatter={(val) => val.slice(5)} />
                <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(val) => `₹${val}`} />
                <Tooltip formatter={(value: any) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Sales']} />
                <Area type="monotone" dataKey="amount" stroke="#0f766e" strokeWidth={2} fillOpacity={1} fill="url(#salesGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Collections Chart */}
        <div className="bg-white p-6 rounded-xl border border-slate-200/90 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Verified Collections (Last 7 Days)</h3>
              <p className="text-xs text-slate-400">Cash, UPI & Bank Transfer verified payments</p>
            </div>
            <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">
              7 Day Total: ₹{(charts.collectionsByDay || []).reduce((acc: number, curr: any) => acc + curr.amount, 0).toLocaleString('en-IN')}
            </span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.collectionsByDay || []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickFormatter={(val) => val.slice(5)} />
                <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(val) => `₹${val}`} />
                <Tooltip formatter={(value: any) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Collections']} />
                <Bar dataKey="amount" fill="#14b8a6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Leaderboard and Top Products Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Salesperson Performance Leaderboard */}
        <div className="bg-white p-6 rounded-xl border border-slate-200/90 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-800">Field Performance (Past 7 Days)</h3>
            <Link href="/salespersons/performance" className="text-xs font-medium text-teal-600 hover:underline flex items-center">
              <span>View All</span>
              <ChevronRight className="w-3 h-3 ml-0.5" />
            </Link>
          </div>
          <div className="divide-y divide-slate-100">
            {(charts.salespersonPerformance || []).map((sp: any, idx: number) => (
              <div key={sp.id} className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center">
                    {idx + 1}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-800">{sp.name}</p>
                    <p className="text-[11px] text-slate-400">{sp.territory}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-slate-900">₹{sp.sales.toLocaleString('en-IN')}</p>
                  <p className="text-[10px] text-emerald-600">{sp.ordersCount} orders • ₹{sp.collections.toLocaleString('en-IN')} coll.</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Selling Products */}
        <div className="bg-white p-6 rounded-xl border border-slate-200/90 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-800">Top In-Demand Products</h3>
            <Link href="/products" className="text-xs font-medium text-teal-600 hover:underline flex items-center">
              <span>Catalog</span>
              <ChevronRight className="w-3 h-3 ml-0.5" />
            </Link>
          </div>
          <div className="divide-y divide-slate-100">
            {(charts.topProducts || []).map((p: any) => (
              <div key={p.name} className="py-3 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-800">{p.name}</p>
                  <p className="text-[11px] text-slate-400">{p.quantity} units sold</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-teal-700">₹{p.total.toLocaleString('en-IN')}</p>
                  <span className="text-[10px] text-slate-400">Total Revenue</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
