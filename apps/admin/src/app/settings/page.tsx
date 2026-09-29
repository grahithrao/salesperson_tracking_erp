'use client';

import React, { useEffect, useState } from 'react';
import AdminShell from '@/components/layout/AdminShell';
import { Settings, Shield, Sliders, Check, Save } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function SettingsPage() {
  const { token, user } = useAuth();
  const [settings, setSettings] = useState<any[]>([]);
  const [permissions, setPermissions] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'system' | 'roles'>('system');
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  const fetchSettings = async () => {
    if (!token) return;
    try {
      const [sRes, pRes] = await Promise.all([
        fetch('/api/settings', { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()),
        fetch('/api/settings/permissions', { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()),
      ]);
      setSettings(sRes.data || []);
      setPermissions(pRes.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, [token]);

  const handleSettingChange = (key: string, value: string) => {
    setSettings((prev) => prev.map((s) => (s.key === key ? { ...s, value } : s)));
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    setStatusMsg('');
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings }),
      });
      if (res.ok) {
        setStatusMsg('System settings saved successfully!');
        setTimeout(() => setStatusMsg(''), 4000);
      }
    } catch (e: any) {
      alert(e.message || 'Error saving settings');
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePermission = async (userId: string, permKey: string, currentValue: boolean) => {
    try {
      const updated = { [permKey]: !currentValue };
      const res = await fetch(`/api/settings/permissions/${userId}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
      if (res.ok) {
        setPermissions((prev) =>
          prev.map((p) => (p.userId === userId ? { ...p, [permKey]: !currentValue } : p))
        );
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <AdminShell title="System Configuration & Permissions">
      <div className="flex border-b border-slate-200 mb-6 gap-2">
        <button
          onClick={() => setActiveTab('system')}
          className={`pb-3 px-4 text-xs font-semibold border-b-2 transition ${
            activeTab === 'system'
              ? 'border-teal-600 text-teal-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Operational Settings
        </button>
        <button
          onClick={() => setActiveTab('roles')}
          className={`pb-3 px-4 text-xs font-semibold border-b-2 transition ${
            activeTab === 'roles'
              ? 'border-teal-600 text-teal-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Manager Permissions Matrix
        </button>
      </div>

      {statusMsg && (
        <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-medium">
          {statusMsg}
        </div>
      )}

      {activeTab === 'system' && (
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm p-6 max-w-3xl">
          <div className="space-y-5 divide-y divide-slate-100">
            {settings.map((s) => (
              <div key={s.key} className="pt-4 first:pt-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-800 font-mono">{s.key}</label>
                  <p className="text-[11px] text-slate-500 mt-0.5">{s.description}</p>
                </div>
                <div className="w-full sm:w-60">
                  {s.key.includes('required') ? (
                    <select
                      value={s.value}
                      onChange={(e) => handleSettingChange(s.key, e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium"
                    >
                      <option value="true">Enabled (Yes)</option>
                      <option value="false">Disabled (No)</option>
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={s.value}
                      onChange={(e) => handleSettingChange(s.key, e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                    />
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 pt-4 border-t border-slate-200 flex justify-end">
            <button
              onClick={handleSaveSettings}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold shadow-sm transition disabled:opacity-60"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saving ? 'Saving...' : 'Save Configuration'}</span>
            </button>
          </div>
        </div>
      )}

      {activeTab === 'roles' && (
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50/50">
            <h3 className="text-xs font-bold text-slate-800">Manager Role Capability Matrix (Section 30)</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Toggle specific administrative permissions for field managers</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <th className="py-3 px-4">Manager Name</th>
                  <th className="py-3 px-3 text-center">Dashboard</th>
                  <th className="py-3 px-3 text-center">Manage Users</th>
                  <th className="py-3 px-3 text-center">Clients</th>
                  <th className="py-3 px-3 text-center">Assign Clients</th>
                  <th className="py-3 px-3 text-center">GPS Tracking</th>
                  <th className="py-3 px-3 text-center">Approve Orders</th>
                  <th className="py-3 px-3 text-center">Verify Payments</th>
                  <th className="py-3 px-3 text-center">Export Reports</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {permissions.map((p) => (
                  <tr key={p.id}>
                    <td className="py-3 px-4 font-semibold text-slate-800">{p.user?.name || 'Manager'}</td>
                    {[
                      'canViewDashboard',
                      'canManageUsers',
                      'canManageClients',
                      'canAssignClients',
                      'canViewGps',
                      'canApproveOrders',
                      'canVerifyPayments',
                      'canExportReports',
                    ].map((permKey) => (
                      <td key={permKey} className="py-3 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={Boolean(p[permKey])}
                          onChange={() => handleTogglePermission(p.userId, permKey, Boolean(p[permKey]))}
                          className="rounded text-teal-600 focus:ring-teal-500 w-4 h-4 cursor-pointer"
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
