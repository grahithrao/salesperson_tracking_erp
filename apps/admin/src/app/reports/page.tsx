'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import AdminShell from '@/components/layout/AdminShell';
import {
  FileBarChart,
  Download,
  Calendar,
  Filter,
  DollarSign,
  TrendingUp,
  Package,
  Users,
  CheckCircle,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

function ReportsContent() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') || 'sales';
  const { token } = useAuth();

  const [activeTab, setActiveTab] = useState(initialTab);
  const [reportData, setReportData] = useState<any>(null);
  const [salespersons, setSalespersons] = useState<any[]>([]);
  const [selectedSpId, setSelectedSpId] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) return;
    fetch('/api/salespersons', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((json) => setSalespersons(json.data || []));
  }, [token]);

  const fetchReport = async () => {
    if (!token) return;
    setLoading(true);
    try {
      let endpoint = `/api/reports/${activeTab}`;
      const params = new URLSearchParams();
      if (selectedSpId) params.append('salespersonId', selectedSpId);
      if (from) params.append('from', from);
      if (to) params.append('to', to);

      const url = `${endpoint}?${params.toString()}`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const json = await res.json();
        setReportData(json);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [token, activeTab, selectedSpId, from, to]);

  const handleExportCsv = () => {
    if (!token) return;
    const params = new URLSearchParams();
    if (selectedSpId) params.append('salespersonId', selectedSpId);
    if (from) params.append('from', from);
    if (to) params.append('to', to);
    params.append('format', 'csv');

    window.open(`/api/reports/${activeTab}?${params.toString()}`, '_blank');
  };

  const rows = reportData?.data || [];
  const summary = reportData?.summary || {};

  return (
    <AdminShell title="Business Intelligence & Operational Reports">
      {/* Tab navigation */}
      <div className="flex border-b border-slate-200 mb-6 gap-2">
        {[
          { id: 'sales', label: 'Sales Report' },
          { id: 'collections', label: 'Collections Report' },
          { id: 'attendance', label: 'Attendance Report' },
          { id: 'visits', label: 'Client Visits Report' },
          { id: 'product-sales', label: 'Product Sales' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`pb-3 px-4 text-xs font-semibold border-b-2 transition ${
              activeTab === tab.id
                ? 'border-teal-600 text-teal-700 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filter and Export Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-sm mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={selectedSpId}
            onChange={(e) => setSelectedSpId(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
          >
            <option value="">All Sales Representatives</option>
            {salespersons.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.employeeCode})
              </option>
            ))}
          </select>

          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>From:</span>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
            />
            <span>To:</span>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
            />
          </div>
        </div>

        <button
          onClick={handleExportCsv}
          className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition shadow-sm"
        >
          <Download className="w-3.5 h-3.5 text-teal-400" />
          <span>Export CSV / Excel</span>
        </button>
      </div>

      {/* Summary KPI preview if available */}
      {summary.totalSales !== undefined && (
        <div className="mb-6 p-4 bg-teal-50 border border-teal-200 rounded-xl flex items-center justify-between text-xs text-teal-900">
          <div>
            <span className="font-semibold text-teal-700">Total Filtered Sales: </span>
            <span className="text-base font-bold text-teal-950">₹{summary.totalSales.toLocaleString('en-IN')}</span>
          </div>
          <div>
            <span className="font-semibold text-teal-700">Orders: </span>
            <span className="text-base font-bold text-teal-950">{summary.totalOrders}</span>
          </div>
        </div>
      )}

      {/* Dynamic Report Table */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          {activeTab === 'sales' && (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <th className="py-3 px-4">Order #</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Salesperson</th>
                  <th className="py-3 px-4">Client</th>
                  <th className="py-3 px-4">City</th>
                  <th className="py-3 px-4 text-right">Subtotal</th>
                  <th className="py-3 px-4 text-right">Discount</th>
                  <th className="py-3 px-4 text-right">GST Tax</th>
                  <th className="py-3 px-4 text-right">Grand Total</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((r: any) => (
                  <tr key={r.id} className="hover:bg-slate-50/60">
                    <td className="py-3 px-4 font-mono font-bold text-teal-700">{r.orderNumber}</td>
                    <td className="py-3 px-4 text-slate-500">{new Date(r.date).toLocaleDateString('en-IN')}</td>
                    <td className="py-3 px-4 font-semibold text-slate-800">{r.salespersonName}</td>
                    <td className="py-3 px-4 text-slate-700">{r.clientName}</td>
                    <td className="py-3 px-4 text-slate-600">{r.clientCity}</td>
                    <td className="py-3 px-4 text-right text-slate-600">₹{r.subtotal.toLocaleString('en-IN')}</td>
                    <td className="py-3 px-4 text-right text-slate-600">₹{r.discount.toLocaleString('en-IN')}</td>
                    <td className="py-3 px-4 text-right text-slate-600">₹{r.tax.toLocaleString('en-IN')}</td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900">₹{r.grandTotal.toLocaleString('en-IN')}</td>
                    <td className="py-3 px-4 font-semibold text-[10px] text-teal-700">{r.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeTab === 'collections' && (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <th className="py-3 px-4">Receipt #</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Salesperson</th>
                  <th className="py-3 px-4">Client</th>
                  <th className="py-3 px-4">Mode</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Verified By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((r: any) => (
                  <tr key={r.id} className="hover:bg-slate-50/60">
                    <td className="py-3 px-4 font-mono font-bold text-teal-700">{r.receiptNumber}</td>
                    <td className="py-3 px-4 text-slate-500">{new Date(r.date).toLocaleDateString('en-IN')}</td>
                    <td className="py-3 px-4 font-semibold text-slate-800">{r.salespersonName}</td>
                    <td className="py-3 px-4 text-slate-700">{r.clientName}</td>
                    <td className="py-3 px-4 font-medium text-slate-600">{r.paymentMethod}</td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900">₹{r.amount.toLocaleString('en-IN')}</td>
                    <td className="py-3 px-4 font-semibold text-[10px]">{r.status}</td>
                    <td className="py-3 px-4 text-slate-500">{r.verifiedBy || 'Pending'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeTab === 'attendance' && (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <th className="py-3 px-4">Salesperson</th>
                  <th className="py-3 px-4">Territory</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Work Time</th>
                  <th className="py-3 px-4">Distance</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((r: any) => (
                  <tr key={r.id} className="hover:bg-slate-50/60">
                    <td className="py-3 px-4 font-semibold text-slate-800">{r.salespersonName}</td>
                    <td className="py-3 px-4 text-slate-600">{r.territory}</td>
                    <td className="py-3 px-4 text-slate-600">{r.date.split('T')[0]}</td>
                    <td className="py-3 px-4 font-medium text-slate-700">{r.workingMinutes} mins</td>
                    <td className="py-3 px-4 font-bold text-teal-700">{r.distanceKm} KM</td>
                    <td className="py-3 px-4 text-[10px] font-semibold">{r.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeTab === 'visits' && (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <th className="py-3 px-4">Salesperson</th>
                  <th className="py-3 px-4">Client</th>
                  <th className="py-3 px-4">City</th>
                  <th className="py-3 px-4">Visit Time</th>
                  <th className="py-3 px-4">GPS Distance</th>
                  <th className="py-3 px-4">Outcome</th>
                  <th className="py-3 px-4">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((r: any) => (
                  <tr key={r.id} className="hover:bg-slate-50/60">
                    <td className="py-3 px-4 font-semibold text-slate-800">{r.salespersonName}</td>
                    <td className="py-3 px-4 text-slate-700">{r.clientName}</td>
                    <td className="py-3 px-4 text-slate-600">{r.clientCity}</td>
                    <td className="py-3 px-4 text-slate-500">{new Date(r.startedAt).toLocaleString('en-IN')}</td>
                    <td className="py-3 px-4 font-mono">{r.distanceFromClient || 0}m</td>
                    <td className="py-3 px-4 font-semibold text-slate-700">{r.outcome}</td>
                    <td className="py-3 px-4 text-slate-500 max-w-xs truncate">{r.notes || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeTab === 'product-sales' && (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <th className="py-3 px-4">SKU</th>
                  <th className="py-3 px-4">Product Name</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4 text-right">Quantity Sold</th>
                  <th className="py-3 px-4 text-right">Total Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((r: any) => (
                  <tr key={r.sku} className="hover:bg-slate-50/60">
                    <td className="py-3 px-4 font-mono font-bold text-teal-700">{r.sku}</td>
                    <td className="py-3 px-4 font-semibold text-slate-800">{r.name}</td>
                    <td className="py-3 px-4 text-slate-600">{r.category}</td>
                    <td className="py-3 px-4 text-right font-bold text-slate-800">{r.quantity}</td>
                    <td className="py-3 px-4 text-right font-bold text-teal-700">₹{r.revenue.toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AdminShell>
  );
}

export default function ReportsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-xs text-slate-400">Loading reports...</div>}>
      <ReportsContent />
    </Suspense>
  );
}
