'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Navigation2, Lock, User, AlertCircle, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
  const [identifier, setIdentifier] = useState('admin@erp.com');
  const [password, setPassword] = useState('Password123!');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { login } = useAuth();

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      login(data.token, data.user);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Unable to connect to ERP server');
    } finally {
      setLoading(false);
    }
  };

  const setDemoCredentials = (id: string) => {
    setIdentifier(id);
    setPassword('Password123!');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-slate-50 to-teal-50/30 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white border border-slate-200/80 rounded-2xl shadow-xl p-8 backdrop-blur-sm">
        {/* Logo and Title */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-teal-600 flex items-center justify-center text-white shadow-lg shadow-teal-600/30 mb-3">
            <Navigation2 className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">FIELD TRACK ERP</h1>
          <p className="text-xs text-slate-500 mt-1">Sales Management & GPS Tracking Suite</p>
        </div>

        {error && (
          <div className="mb-6 p-3 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2.5 text-xs text-red-700">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Employee Code, Mobile, or Email
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
                placeholder="e.g. admin@erp.com or EMP-001"
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-2.5 px-4 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white text-sm font-semibold rounded-lg shadow-md shadow-teal-600/20 flex items-center justify-center gap-2 transition disabled:opacity-60"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>Sign In to Console</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Quick Demo Credentials */}
        <div className="mt-8 pt-6 border-t border-slate-100">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-3 text-center">
            Quick Demo Accounts
          </p>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setDemoCredentials('admin@erp.com')}
              className="py-1.5 px-2 bg-slate-50 hover:bg-teal-50 border border-slate-200 hover:border-teal-300 rounded-md text-[11px] font-medium text-slate-700 hover:text-teal-700 transition text-center"
            >
              Super Admin
            </button>
            <button
              type="button"
              onClick={() => setDemoCredentials('manager@erp.com')}
              className="py-1.5 px-2 bg-slate-50 hover:bg-teal-50 border border-slate-200 hover:border-teal-300 rounded-md text-[11px] font-medium text-slate-700 hover:text-teal-700 transition text-center"
            >
              Manager
            </button>
            <button
              type="button"
              onClick={() => setDemoCredentials('rahul@erp.com')}
              className="py-1.5 px-2 bg-slate-50 hover:bg-teal-50 border border-slate-200 hover:border-teal-300 rounded-md text-[11px] font-medium text-slate-700 hover:text-teal-700 transition text-center"
            >
              Salesperson
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
