'use client';

import React, { useEffect, useState } from 'react';
import AdminShell from '@/components/layout/AdminShell';
import {
  Building2,
  Search,
  Plus,
  Phone,
  Mail,
  MapPin,
  Eye,
  IndianRupee,
  FileText,
  Clock,
  ShieldCheck,
  ChevronRight,
  X,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function ClientsPage() {
  const { token } = useAuth();
  const [clients, setClients] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [pendingOnly, setPendingOnly] = useState(false);
  const [loading, setLoading] = useState(true);

  // Detail Modal
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [clientDetail, setClientDetail] = useState<any>(null);
  const [detailTab, setDetailTab] = useState<'overview' | 'ledger' | 'orders' | 'payments' | 'visits'>('overview');

  // Add Client Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    businessName: '',
    contactPerson: '',
    phone: '',
    email: '',
    gstNumber: '',
    address: '',
    city: 'Mangalore',
    state: 'Karnataka',
    pincode: '575001',
    latitude: 12.8715,
    longitude: 74.8432,
    creditLimit: 100000,
    paymentTerms: 'Net 30',
    openingBalance: 0,
  });

  const fetchClients = async () => {
    if (!token) return;
    try {
      let url = `/api/clients?search=${encodeURIComponent(search)}`;
      if (pendingOnly) url += '&pendingOnly=true';

      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const json = await res.json();
        setClients(json.data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, [token, search, pendingOnly]);

  const openClientDetail = async (id: string) => {
    setSelectedClientId(id);
    setDetailTab('overview');
    try {
      const res = await fetch(`/api/clients/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const json = await res.json();
        setClientDetail(json.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setShowAddModal(false);
        fetchClients();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to create client');
      }
    } catch (e: any) {
      alert(e.message || 'Error creating client');
    }
  };

  return (
    <AdminShell title="Client Relationship Management">
      {/* Top Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search clients, phones, cities..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-xs w-72 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 shadow-sm"
            />
          </div>

          <label className="flex items-center gap-2 text-xs text-slate-600 bg-white px-3 py-2 border border-slate-200 rounded-lg shadow-sm cursor-pointer select-none">
            <input
              type="checkbox"
              checked={pendingOnly}
              onChange={(e) => setPendingOnly(e.target.checked)}
              className="rounded text-teal-600 focus:ring-teal-500"
            />
            <span>With Outstanding Balance Only</span>
          </label>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          <span>New Client</span>
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold">
                <th className="py-3 px-4">Client Name</th>
                <th className="py-3 px-4">Contact</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4">Assigned Representative</th>
                <th className="py-3 px-4">Credit Limit</th>
                <th className="py-3 px-4">Current Outstanding</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {clients.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/60 transition">
                  <td className="py-3.5 px-4">
                    <p className="font-semibold text-slate-800">{c.name}</p>
                    <p className="text-[11px] text-slate-400">{c.businessName || c.category}</p>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600">
                    <p className="font-medium text-slate-700">{c.contactPerson}</p>
                    <p className="text-[11px] text-slate-400">{c.phone}</p>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600">
                    <p>{c.city}, {c.state}</p>
                    <p className="text-[10px] text-slate-400 font-mono">
                      {c.latitude?.toFixed(4)}, {c.longitude?.toFixed(4)}
                    </p>
                  </td>
                  <td className="py-3.5 px-4">
                    {c.primarySalesperson ? (
                      <span className="font-medium text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md text-[11px]">
                        {c.primarySalesperson.name}
                      </span>
                    ) : (
                      <span className="text-[11px] text-amber-600 font-medium bg-amber-50 px-2 py-0.5 rounded-md">
                        Unassigned
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 font-medium">
                    ₹{(c.creditLimit || 0).toLocaleString('en-IN')}
                  </td>
                  <td className="py-3.5 px-4 font-bold text-slate-900">
                    <span className={c.currentOutstanding > 0 ? 'text-amber-700' : 'text-slate-700'}>
                      ₹{(c.currentOutstanding || 0).toLocaleString('en-IN')}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => openClientDetail(c.id)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-teal-700 bg-teal-50 hover:bg-teal-100 rounded-md text-[11px] font-semibold transition"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Ledger & Details</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Client Detail Modal with Authoritative Ledger */}
      {selectedClientId && clientDetail && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="text-base font-bold text-slate-900">{clientDetail.name}</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {clientDetail.businessName || 'Client Profile'} • GST: {clientDetail.gstNumber || 'Not Registered'}
                </p>
              </div>
              <button
                onClick={() => setSelectedClientId(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex border-b border-slate-200 px-5 gap-4 text-xs font-semibold bg-white">
              {(['overview', 'ledger', 'orders', 'payments', 'visits'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setDetailTab(tab)}
                  className={`py-3 capitalize border-b-2 transition ${
                    detailTab === tab
                      ? 'border-teal-600 text-teal-700 font-bold'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {tab === 'ledger' ? 'Authoritative Ledger' : tab}
                </button>
              ))}
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1">
              {detailTab === 'overview' && (
                <div className="space-y-4 text-xs">
                  <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <div>
                      <p className="text-slate-400 font-semibold uppercase text-[10px]">Contact Person</p>
                      <p className="text-sm font-bold text-slate-800 mt-0.5">{clientDetail.contactPerson}</p>
                      <p className="text-slate-600 mt-1">{clientDetail.phone}</p>
                      <p className="text-slate-600">{clientDetail.email || 'No email'}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 font-semibold uppercase text-[10px]">Financial Terms</p>
                      <p className="text-slate-700 mt-0.5">Credit Limit: ₹{Number(clientDetail.creditLimit).toLocaleString('en-IN')}</p>
                      <p className="text-slate-700">Payment Terms: {clientDetail.paymentTerms}</p>
                      <p className="font-bold text-amber-700 mt-1">Current Outstanding: ₹{Number(clientDetail.currentOutstanding).toLocaleString('en-IN')}</p>
                    </div>
                  </div>

                  <div>
                    <p className="font-bold text-slate-800 mb-1">Registered Address & Coordinates</p>
                    <p className="text-slate-600">{clientDetail.address}, {clientDetail.city}, {clientDetail.state} - {clientDetail.pincode}</p>
                    <p className="text-slate-400 font-mono mt-0.5">GPS: {clientDetail.latitude}, {clientDetail.longitude}</p>
                  </div>
                </div>
              )}

              {detailTab === 'ledger' && (
                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-600">Authoritative Running Balance Entries</span>
                    <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-1 rounded-md border border-amber-200">
                      Balance Due: ₹{Number(clientDetail.currentOutstanding).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                        <th className="py-2 px-3">Date</th>
                        <th className="py-2 px-3">Type</th>
                        <th className="py-2 px-3">Description</th>
                        <th className="py-2 px-3 text-right">Amount</th>
                        <th className="py-2 px-3 text-right">Running Balance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(clientDetail.ledgerEntries || []).map((le: any) => (
                        <tr key={le.id}>
                          <td className="py-2 px-3 text-slate-600">
                            {new Date(le.timestamp).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })}
                          </td>
                          <td className="py-2 px-3">
                            <span className="font-bold text-[10px] px-1.5 py-0.5 rounded bg-slate-100">
                              {le.entryType}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-slate-700">{le.description}</td>
                          <td className="py-2 px-3 text-right font-medium">
                            {le.entryType === 'PAYMENT' ? (
                              <span className="text-emerald-600">-₹{Number(le.amount).toLocaleString('en-IN')}</span>
                            ) : (
                              <span className="text-slate-800">+₹{Number(le.amount).toLocaleString('en-IN')}</span>
                            )}
                          </td>
                          <td className="py-2 px-3 text-right font-bold text-slate-900">
                            ₹{Number(le.runningBalance).toLocaleString('en-IN')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {detailTab === 'orders' && (
                <div className="space-y-2 text-xs">
                  {(clientDetail.orders || []).map((o: any) => (
                    <div key={o.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                      <div>
                        <p className="font-bold text-slate-800">Order #{o.orderNumber}</p>
                        <p className="text-[11px] text-slate-500">
                          {new Date(o.createdAt).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })} by {o.salesperson.user.name}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-slate-900">₹{Number(o.grandTotal).toLocaleString('en-IN')}</p>
                        <span className="text-[10px] font-semibold text-teal-700">{o.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {detailTab === 'payments' && (
                <div className="space-y-2 text-xs">
                  {(clientDetail.payments || []).map((p: any) => (
                    <div key={p.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                      <div>
                        <p className="font-bold text-slate-800">Receipt #{p.receiptNumber} ({p.paymentMethod})</p>
                        <p className="text-[11px] text-slate-500">
                          {new Date(p.collectedAt).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })} by {p.salesperson.user.name}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-emerald-700">₹{Number(p.amount).toLocaleString('en-IN')}</p>
                        <span className="text-[10px] font-semibold text-slate-600">{p.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {detailTab === 'visits' && (
                <div className="space-y-2 text-xs">
                  {(clientDetail.visits || []).map((v: any) => (
                    <div key={v.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                      <div>
                        <p className="font-bold text-slate-800">Outcome: {v.outcome}</p>
                        <p className="text-[11px] text-slate-500">{v.notes || 'No visit notes'}</p>
                        <p className="text-[10px] text-slate-400">
                          {new Date(v.startedAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} by {v.salesperson.user.name}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-[11px] font-mono text-slate-700">{v.distanceFromClient || 0}m GPS distance</span>
                        {v.isException && <span className="block text-[10px] text-amber-600 font-bold">Exception</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Client Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-slate-800 mb-4">Register New Client</h3>
            <form onSubmit={handleCreateClient} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Client Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Metro Mobile Care"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Contact Person</label>
                  <input
                    type="text"
                    required
                    value={formData.contactPerson}
                    onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                    placeholder="Store Manager"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="9845011223"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">GST Number</label>
                  <input
                    type="text"
                    value={formData.gstNumber}
                    onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value })}
                    placeholder="29ABCDE1234F1Z5"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Address</label>
                <input
                  type="text"
                  required
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Street / Mall Shop / Market"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">City</label>
                  <input
                    type="text"
                    required
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">State</label>
                  <input
                    type="text"
                    required
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Pincode</label>
                  <input
                    type="text"
                    required
                    value={formData.pincode}
                    onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">GPS Latitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    required
                    value={formData.latitude}
                    onChange={(e) => setFormData({ ...formData, latitude: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">GPS Longitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    required
                    value={formData.longitude}
                    onChange={(e) => setFormData({ ...formData, longitude: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Credit Limit (₹)</label>
                  <input
                    type="number"
                    value={formData.creditLimit}
                    onChange={(e) => setFormData({ ...formData, creditLimit: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Opening Balance (₹)</label>
                  <input
                    type="number"
                    value={formData.openingBalance}
                    onChange={(e) => setFormData({ ...formData, openingBalance: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-2 border border-slate-200 text-slate-600 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-600 text-white font-semibold rounded-lg"
                >
                  Save Client
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
