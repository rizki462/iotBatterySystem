'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Zap, Lock, Mail, ArrowRight, ShieldCheck, AlertCircle, Loader2 } from 'lucide-react';
import { api } from '../../lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await api.login(email, password);
      router.push('/');
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error ? err.message : 'Login gagal. Periksa kembali email dan password.';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleUseDemoAdmin = () => {
    setEmail('admin@iot.local');
    setPassword('admin123456');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 relative overflow-hidden">
      {/* Background subtle decoration */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-100/50 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-100/50 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md rounded-3xl border border-slate-200/90 bg-white p-8 shadow-xl">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 shadow-md shadow-blue-500/20 mb-4 text-white">
            <Zap className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            SuperCap IoT Monitor
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-xs font-medium">
            Masuk ke Dashboard Sistem Monitoring Batteryless ESP32-C3
          </p>
        </div>

        {/* Error notification */}
        {error && (
          <div className="mb-6 rounded-xl bg-rose-50 border border-rose-200 p-3.5 text-xs text-rose-800 flex items-start gap-2.5">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 block mb-1.5">
              Email Akun
            </label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@domain.com"
                required
                className="w-full rounded-xl bg-slate-50 border border-slate-200 py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
              <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-400 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 block mb-1.5">
              Kata Sandi
            </label>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;"
                required
                className="w-full rounded-xl bg-slate-50 border border-slate-200 py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
              <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-400 pointer-events-none" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-sm text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition-all disabled:opacity-50 cursor-pointer active:scale-[0.99]"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <span>Masuk ke Dashboard</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        {/* Quick Demo Helper */}
        <div className="mt-6 pt-5 border-t border-slate-100 text-center">
          <button
            type="button"
            onClick={handleUseDemoAdmin}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors cursor-pointer"
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            Isi Kredensial Default Admin (admin@iot.local)
          </button>
        </div>
      </div>
    </div>
  );
}
