'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  RotateCcw,
  Moon,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Send,
  Loader2,
} from 'lucide-react';
import { api } from '../lib/api';
import { Command } from '../types/iot';

interface CommandModalProps {
  isOpen: boolean;
  onClose: () => void;
  deviceId: string;
}

export const CommandModal: React.FC<CommandModalProps> = ({
  isOpen,
  onClose,
  deviceId,
}) => {
  const [activeTab, setActiveTab] = useState<'restart' | 'sleep'>('restart');
  const [sleepSeconds, setSleepSeconds] = useState<number>(1800);
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );
  const [recentCommands, setRecentCommands] = useState<Command[]>([]);

  useEffect(() => {
    let ignore = false;
    if (isOpen && deviceId) {
      api
        .getCommands(deviceId)
        .then((cmds) => {
          if (!ignore) {
            setRecentCommands(cmds.slice(0, 5));
          }
        })
        .catch(() => {});
    }
    return () => {
      ignore = true;
    };
  }, [isOpen, deviceId]);

  if (!isOpen) return null;

  const refreshCommands = async () => {
    try {
      const cmds = await api.getCommands(deviceId);
      setRecentCommands(cmds.slice(0, 5));
    } catch {
      // ignore
    }
  };

  const handleSendRestart = async () => {
    setLoading(true);
    setMessage(null);
    try {
      await api.sendCommand(deviceId, 'restart');
      setMessage({
        type: 'success',
        text: 'Perintah restart berhasil dimasukkan ke antrean! Perintah akan dikirim pada saat ESP32 bangun berikutnya.',
      });
      await refreshCommands();
    } catch (err: unknown) {
      const errorText = err instanceof Error ? err.message : 'Gagal mengirim perintah restart';
      setMessage({
        type: 'error',
        text: errorText,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSendSleep = async () => {
    setLoading(true);
    setMessage(null);
    try {
      await api.sendCommand(deviceId, 'sleep', { sleep_s: sleepSeconds });
      setMessage({
        type: 'success',
        text: `Perintah sleep (${sleepSeconds} detik) berhasil diantrekan!`,
      });
      await refreshCommands();
    } catch (err: unknown) {
      const errorText = err instanceof Error ? err.message : 'Gagal mengirim perintah sleep';
      setMessage({
        type: 'error',
        text: errorText,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Kontrol Perangkat IoT</h3>
            <p className="text-xs text-slate-500 mt-0.5">Target ID: {deviceId}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab selection */}
        <div className="grid grid-cols-2 gap-2 mt-4 p-1 bg-slate-100 rounded-xl border border-slate-200/60">
          <button
            onClick={() => setActiveTab('restart')}
            className={`flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              activeTab === 'restart'
                ? 'bg-white text-rose-700 border border-rose-200 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Restart / Reset
          </button>
          <button
            onClick={() => setActiveTab('sleep')}
            className={`flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              activeTab === 'sleep'
                ? 'bg-white text-blue-700 border border-blue-200 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Moon className="h-3.5 w-3.5" />
            Ubah Durasi Sleep
          </button>
        </div>

        {/* Feedback Alert */}
        {message && (
          <div
            className={`mt-4 rounded-xl p-3 text-xs flex items-start gap-2.5 border ${
              message.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
            ) : (
              <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
            )}
            <p className="leading-relaxed">{message.text}</p>
          </div>
        )}

        {/* Tab Content */}
        <div className="mt-5 space-y-4">
          {activeTab === 'restart' && (
            <div className="space-y-4">
              <div className="rounded-xl bg-amber-50 border border-amber-200 p-3.5 text-xs text-amber-900 leading-relaxed flex items-start gap-3">
                <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
                <div>
                  <p className="font-semibold text-amber-900">
                    Mekanisme Piggybacking Komando
                  </p>
                  <p className="mt-1 text-slate-600">
                    Perintah reset akan diselipkan pada <strong>balasan HTTP</strong> saat ESP32
                    bangun dan mengirim data berikutnya. Reset dari web <em>tidak bisa</em> menghidupkan
                    alat yang sedang kehabisan daya (mati).
                  </p>
                </div>
              </div>

              <button
                onClick={handleSendRestart}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-semibold text-xs text-white bg-rose-600 hover:bg-rose-700 shadow-xs transition-all disabled:opacity-50 cursor-pointer active:scale-[0.99]"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                Konfirmasi Antrekan Perintah Restart
              </button>
            </div>
          )}

          {activeTab === 'sleep' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-500 leading-relaxed">
                Kirim instruksi durasi Deep Sleep khusus untuk override kalkulasi ARIMA pada siklus
                selanjutnya.
              </p>

              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: '10 Menit', val: 600 },
                  { label: '30 Menit', val: 1800 },
                  { label: '1 Jam', val: 3600 },
                ].map((item) => (
                  <button
                    key={item.val}
                    type="button"
                    onClick={() => setSleepSeconds(item.val)}
                    className={`p-2.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                      sleepSeconds === item.val
                        ? 'bg-blue-50 border-blue-300 text-blue-700 shadow-2xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <div>
                <label className="text-xs text-slate-600 block mb-1">
                  Atau masukkan detik secara manual:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={sleepSeconds}
                    onChange={(e) => setSleepSeconds(Math.max(10, Number(e.target.value)))}
                    className="w-full rounded-xl bg-slate-50 border border-slate-200 py-2 px-3 text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-xs text-slate-500 font-medium">detik</span>
                </div>
              </div>

              <button
                onClick={handleSendSleep}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-semibold text-xs text-white bg-blue-600 hover:bg-blue-700 shadow-xs transition-all disabled:opacity-50 cursor-pointer active:scale-[0.99]"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                Kirim Perintah Sleep ({sleepSeconds}s)
              </button>
            </div>
          )}
        </div>

        {/* Antrean Terakhir */}
        {recentCommands.length > 0 && (
          <div className="mt-6 pt-4 border-t border-slate-100">
            <h4 className="text-xs font-semibold text-slate-600 flex items-center gap-1.5 mb-2.5">
              <Clock className="h-3.5 w-3.5" /> Riwayat Antrean Terakhir
            </h4>
            <div className="space-y-1.5 max-h-32 overflow-y-auto">
              {recentCommands.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 uppercase">{c.type}</span>
                    {c.payload && <span className="text-slate-500 text-[11px]">{c.payload}</span>}
                  </div>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${
                      c.delivered_at
                        ? 'bg-slate-100 text-slate-600 border-slate-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}
                  >
                    {c.delivered_at ? 'Delivered' : 'Menunggu Bangun'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
