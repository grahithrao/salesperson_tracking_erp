'use client';

import React, { useEffect, useState } from 'react';
import AdminShell from '@/components/layout/AdminShell';
import { Users, Building2, UserCheck, ArrowRight, ShieldCheck, Clock } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function ClientAssignmentsPage() {
  const { token } = useAuth();
  const [clients, setClients] = useState<any[]>([]);
  const [salespersons, setSalespersons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [primarySpId, setPrimarySpId] = useState('');
  const [backupSpId, setBackupSpId] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    if (!token) return;
    try {
      const [cRes, sRes] = await Promise.all([
        fetch('/api/clients', { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()),
        fetch('/api/salespersons', { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()),
      ]);
      setClients(cRes.data || []);
      setSalespersons(sRes.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  const openAssignModal = (client: any) => {
    setSelectedClient(client);
    setPrimarySpId(client.primarySalesperson?.id || '');
    setBackupSpId(client.backupSalesperson?.id || '');
    setNotes('');
  };

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient || !primarySpId) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/clients/${selectedClient.id}/assign`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          primarySalespersonId: primarySpId,
          backupSalespersonId: backupSpId || undefined,
          notes,
        }),
      });

      if (res.ok) {
        setSelectedClient(null);
        fetchData();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to update assignment');
      }
    } catch (e: any) {
      alert(e.message || 'Error updating assignment');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminShell title="Client Territory & Representative Assignments">
      <div className="mb-6 p-4 bg-teal-50 border border-teal-200 rounded-xl text-xs text-teal-800">
        <p className="font-bold">Territory Assignment Engine</p>
        <p className="mt-0.5 text-teal-700">
          Client assignments maintain an auditable assignment history rather than overwriting records. Historical financial data remains securely preserved.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
              <th className="py-3 px-4">Client Name</th>
              <th className="py-3 px-4">City / Area</th>
              <th className="py-3 px-4">Primary Representative</th>
              <th className="py-3 px-4">Backup Representative</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {clients.map((c) => (
              <tr key={c.id} className="hover:bg-slate-50/60 transition">
                <td className="py-3.5 px-4 font-semibold text-slate-800">{c.name}</td>
                <td className="py-3.5 px-4 text-slate-600">{c.city}</td>
                <td className="py-3.5 px-4">
                  {c.primarySalesperson ? (
                    <span className="font-semibold text-slate-800 bg-teal-50 text-teal-700 border border-teal-200 px-2.5 py-0.5 rounded-full text-[11px]">
                      {c.primarySalesperson.name}
                    </span>
                  ) : (
                    <span className="text-amber-600 bg-amber-50 px-2 py-0.5 rounded text-[11px]">Unassigned</span>
                  )}
                </td>
                <td className="py-3.5 px-4 text-slate-600">
                  {c.backupSalesperson ? (
                    <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px]">
                      {c.backupSalesperson.name}
                    </span>
                  ) : (
                    <span className="text-slate-400">None</span>
                  )}
                </td>
                <td className="py-3.5 px-4">
                  <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full text-[10px] font-bold">
                    ACTIVE
                  </span>
                </td>
                <td className="py-3.5 px-4 text-right">
                  <button
                    onClick={() => openAssignModal(c)}
                    className="px-3 py-1 bg-slate-100 hover:bg-teal-600 hover:text-white rounded-md text-[11px] font-semibold transition"
                  >
                    Reassign
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {selectedClient && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md p-6">
            <h3 className="text-base font-bold text-slate-800 mb-1">
              Assign Representative: {selectedClient.name}
            </h3>
            <p className="text-xs text-slate-500 mb-4">{selectedClient.city} • Territory Mapping</p>

            <form onSubmit={handleAssign} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Primary Sales Representative *</label>
                <select
                  required
                  value={primarySpId}
                  onChange={(e) => setPrimarySpId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                >
                  <option value="">Select Primary Representative</option>
                  {salespersons.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.employeeCode} - {s.territory})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Backup Sales Representative (Optional)</label>
                <select
                  value={backupSpId}
                  onChange={(e) => setBackupSpId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                >
                  <option value="">No Backup Representative</option>
                  {salespersons.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.employeeCode} - {s.territory})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Assignment Rationale / Notes</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Territory realignment for Mangalore North"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setSelectedClient(null)}
                  className="px-3 py-1.5 border border-slate-200 text-slate-600 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 bg-teal-600 text-white font-semibold rounded-lg disabled:opacity-60"
                >
                  {submitting ? 'Saving...' : 'Confirm Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
