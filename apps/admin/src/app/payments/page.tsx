'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import AdminShell from '@/components/layout/AdminShell';
import {
  CreditCard,
  Search,
  CheckCircle,
  XCircle,
  FileText,
  ShieldCheck,
  Clock,
  IndianRupee,
  Download,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

function PaymentsContent() {
  const searchParams = useSearchParams();
  const initialStatus = searchParams.get('status') || '';
  const { token } = useAuth();

  const [payments, setPayments] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchPayments = async () => {
    if (!token) return;
    try {
      let url = `/api/payments?search=${encodeURIComponent(search)}`;
      if (statusFilter) url += `&status=${statusFilter}`;

      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const json = await res.json();
        setPayments(json.data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [token, statusFilter, search]);

  const handleVerify = async (id: string, status: 'VERIFIED' | 'REJECTED') => {
    if (!confirm(`Are you sure you want to mark this payment as ${status}?`)) return;
    try {
      const res = await fetch(`/api/payments/${id}/verify`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, notes: `Reviewed by administrator` }),
      });

      if (res.ok) {
        fetchPayments();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to update payment status');
      }
    } catch (e: any) {
      alert(e.message || 'Error updating payment');
    }
  };

  const handleDownloadPdf = (id: string, receiptNumber: string) => {
    if (!token) return;
    window.open(`/api/payments/${id}/receipt-pdf?token=${token}`, '_blank');
  };

  return (
    <AdminShell title="Payment Collections & Ledger Verification">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search receipt #, ref, client..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-xs w-64 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 shadow-sm"
            />
          </div>

          <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
            {[
              { id: '', label: 'ALL' },
              { id: 'PENDING', label: 'PENDING VERIFICATION' },
              { id: 'VERIFIED', label: 'VERIFIED' },
              { id: 'REJECTED', label: 'REJECTED' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1 text-[11px] font-semibold rounded-md transition ${
                  statusFilter === tab.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <span className="text-xs text-slate-500">{payments.length} collections recorded</span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold">
                <th className="py-3 px-4">Receipt Number</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Client</th>
                <th className="py-3 px-4">Collected By</th>
                <th className="py-3 px-4">Method & Ref</th>
                <th className="py-3 px-4 text-right">Amount</th>
                <th className="py-3 px-4">Verification</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {payments.map((p) => {
                const isPending = p.status === 'PENDING';
                return (
                  <tr key={p.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-teal-700">{p.receiptNumber}</td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {new Date(p.collectedAt).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800">{p.clientName}</td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {p.salespersonName} ({p.salespersonCode})
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-slate-700">{p.paymentMethod}</span>
                      {p.transactionReference && (
                        <span className="block text-[10px] font-mono text-slate-400">{p.transactionReference}</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                      ₹{p.amount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          p.status === 'VERIFIED'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : p.status === 'REJECTED'
                            ? 'bg-red-50 text-red-700'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {isPending && (
                          <>
                            <button
                              onClick={() => handleVerify(p.id, 'VERIFIED')}
                              title="Verify & Post Credit to Ledger"
                              className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-bold transition shadow-xs"
                            >
                              Verify
                            </button>
                            <button
                              onClick={() => handleVerify(p.id, 'REJECTED')}
                              title="Reject"
                              className="px-2 py-1 bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-700 rounded text-[10px] font-semibold transition"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => handleDownloadPdf(p.id, p.receiptNumber)}
                          title="Download Official PDF Voucher"
                          className="p-1 text-slate-400 hover:text-teal-600 hover:bg-slate-100 rounded transition"
                        >
                          <FileText className="w-3.5 h-3.5" />
                        </button>
                      </div>
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

export default function PaymentsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-xs text-slate-400">Loading payments...</div>}>
      <PaymentsContent />
    </Suspense>
  );
}
