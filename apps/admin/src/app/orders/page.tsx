'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import AdminShell from '@/components/layout/AdminShell';
import {
  ShoppingCart,
  Search,
  Filter,
  Eye,
  CheckCircle2,
  XCircle,
  Truck,
  PackageCheck,
  Clock,
  X,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

function OrdersContent() {
  const searchParams = useSearchParams();
  const initialStatus = searchParams.get('status') || '';
  const { token } = useAuth();

  const [orders, setOrders] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Selected Order Detail Modal
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [orderDetail, setOrderDetail] = useState<any>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const fetchOrders = async () => {
    if (!token) return;
    try {
      let url = `/api/orders?search=${encodeURIComponent(search)}`;
      if (statusFilter) url += `&status=${statusFilter}`;

      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const json = await res.json();
        setOrders(json.data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [token, statusFilter, search]);

  const openOrderDetail = async (id: string) => {
    setSelectedOrderId(id);
    try {
      const res = await fetch(`/api/orders/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const json = await res.json();
        setOrderDetail(json.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateStatus = async (newStatus: string) => {
    if (!selectedOrderId) return;
    setUpdatingStatus(true);
    try {
      const res = await fetch(`/api/orders/${selectedOrderId}/status`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        openOrderDetail(selectedOrderId);
        fetchOrders();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to update order status');
      }
    } catch (e: any) {
      alert(e.message || 'Error updating order status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  return (
    <AdminShell title="Sales Orders & Fulfillment Workflow">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search by order # or client..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-xs w-64 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 shadow-sm"
            />
          </div>

          <div className="flex flex-wrap gap-1 bg-slate-100 p-1 rounded-lg">
            {['', 'SUBMITTED', 'CONFIRMED', 'PROCESSING', 'DISPATCHED', 'DELIVERED', 'CANCELLED'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition ${
                  statusFilter === st ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {st === '' ? 'ALL' : st}
              </button>
            ))}
          </div>
        </div>

        <span className="text-xs text-slate-500">{orders.length} orders found</span>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold">
                <th className="py-3 px-4">Order Number</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Client</th>
                <th className="py-3 px-4">Sales Representative</th>
                <th className="py-3 px-4">Items</th>
                <th className="py-3 px-4 text-right">Grand Total</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orders.map((o) => (
                <tr key={o.id} className="hover:bg-slate-50/60 transition">
                  <td className="py-3.5 px-4 font-mono font-bold text-teal-700">{o.orderNumber}</td>
                  <td className="py-3.5 px-4 text-slate-500">
                    {new Date(o.createdAt).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })}
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-slate-800">{o.clientName}</td>
                  <td className="py-3.5 px-4 text-slate-600">
                    {o.salespersonName} ({o.salespersonCode})
                  </td>
                  <td className="py-3.5 px-4 text-slate-600">{o.itemsCount} lines</td>
                  <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                    ₹{o.grandTotal.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        o.status === 'CONFIRMED'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : o.status === 'DELIVERED'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : o.status === 'SUBMITTED'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : o.status === 'CANCELLED' || o.status === 'REJECTED'
                          ? 'bg-red-50 text-red-700'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {o.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => openOrderDetail(o.id)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-teal-700 bg-teal-50 hover:bg-teal-100 rounded-md text-[11px] font-semibold transition"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Review</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Details Modal */}
      {selectedOrderId && orderDetail && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900">Order #{orderDetail.orderNumber}</h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800">
                    {orderDetail.status}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Client: {orderDetail.client.name} • Rep: {orderDetail.salesperson.user.name}
                </p>
              </div>
              <button
                onClick={() => setSelectedOrderId(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Line items table */}
            <div className="p-5 overflow-y-auto flex-1">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                    <th className="py-2 px-3">Item Details</th>
                    <th className="py-2 px-3 text-center">Qty</th>
                    <th className="py-2 px-3 text-right">Unit Price</th>
                    <th className="py-2 px-3 text-right">Tax (GST)</th>
                    <th className="py-2 px-3 text-right">Line Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {orderDetail.items.map((it: any) => (
                    <tr key={it.id}>
                      <td className="py-2.5 px-3">
                        <p className="font-semibold text-slate-800">{it.productName}</p>
                        <p className="text-[10px] font-mono text-slate-400">{it.productSku}</p>
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold text-slate-800">{it.quantity}</td>
                      <td className="py-2.5 px-3 text-right text-slate-600">₹{Number(it.unitPrice).toLocaleString('en-IN')}</td>
                      <td className="py-2.5 px-3 text-right text-slate-600">₹{Number(it.tax).toLocaleString('en-IN')}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                        ₹{Number(it.total).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Financial summary breakdown */}
              <div className="mt-4 pt-3 border-t border-slate-200 flex justify-end">
                <div className="w-64 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal:</span>
                    <span>₹{Number(orderDetail.subtotal).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Discount:</span>
                    <span>-₹{Number(orderDetail.discount).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>GST Tax:</span>
                    <span>+₹{Number(orderDetail.tax).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between font-bold text-sm text-slate-900 pt-2 border-t border-slate-200">
                    <span>Grand Total:</span>
                    <span className="text-teal-700">₹{Number(orderDetail.grandTotal).toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Workflow Action Buttons */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <span className="text-xs text-slate-500">Status Actions:</span>
              <div className="flex gap-2">
                {orderDetail.status === 'SUBMITTED' && (
                  <button
                    onClick={() => handleUpdateStatus('CONFIRMED')}
                    disabled={updatingStatus}
                    className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold shadow-sm transition"
                  >
                    Confirm & Post Invoice
                  </button>
                )}
                {orderDetail.status === 'CONFIRMED' && (
                  <button
                    onClick={() => handleUpdateStatus('DISPATCHED')}
                    disabled={updatingStatus}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition"
                  >
                    Mark Dispatched
                  </button>
                )}
                {orderDetail.status === 'DISPATCHED' && (
                  <button
                    onClick={() => handleUpdateStatus('DELIVERED')}
                    disabled={updatingStatus}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition"
                  >
                    Confirm Delivery
                  </button>
                )}
                {orderDetail.status !== 'DELIVERED' && orderDetail.status !== 'CANCELLED' && (
                  <button
                    onClick={() => handleUpdateStatus('CANCELLED')}
                    disabled={updatingStatus}
                    className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg text-xs font-semibold transition"
                  >
                    Cancel Order
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
}

export default function OrdersPage() {
  return (
    <Suspense fallback={<div className="p-8 text-xs text-slate-400">Loading orders...</div>}>
      <OrdersContent />
    </Suspense>
  );
}
