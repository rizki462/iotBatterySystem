import React from 'react';
import { Wifi, Timer, RotateCcw, Award, CheckCircle2 } from 'lucide-react';
import { Reading } from '../types/iot';

interface TransmissionEfficiencyCardProps {
  latestReading: Reading | null;
}

export const TransmissionEfficiencyCard: React.FC<TransmissionEfficiencyCardProps> = ({
  latestReading,
}) => {
  const wifiMs = latestReading?.wifi_ms || 0;
  const activeMs = latestReading?.active_ms || 0;
  const bootCount = latestReading?.boot_count || 0;
  const resetReason = latestReading?.reset_reason || '-';

  // Energy efficiency score calculation based on active duration
  const isOptimal = activeMs > 0 && activeMs <= 3500;

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Award className="h-5 w-5 text-blue-600" />
          <h3 className="text-base font-bold text-slate-900 tracking-tight">
            Efisiensi Transmisi Radio & Boot
          </h3>
        </div>
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
            isOptimal
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-amber-50 text-amber-700 border-amber-200'
          }`}
        >
          <CheckCircle2 className="h-3.5 w-3.5" />
          {isOptimal ? 'Profil Sangat Hemat (Optimal)' : 'Normal'}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-3">
          <div className="flex items-center gap-1.5 text-slate-500 text-xs mb-1">
            <Wifi className="h-3.5 w-3.5 text-blue-600" />
            <span>Koneksi Wi-Fi</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-bold text-slate-900">{wifiMs}</span>
            <span className="text-xs text-slate-500">ms</span>
          </div>
          <span className="text-[11px] text-slate-400 block mt-1">Handshake & IP</span>
        </div>

        <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-3">
          <div className="flex items-center gap-1.5 text-slate-500 text-xs mb-1">
            <Timer className="h-3.5 w-3.5 text-indigo-600" />
            <span>Waktu Aktif Total</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-bold text-slate-900">{activeMs}</span>
            <span className="text-xs text-slate-500">ms</span>
          </div>
          <span className="text-[11px] text-slate-400 block mt-1">Bangun s/d Tidur</span>
        </div>

        <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-3">
          <div className="flex items-center gap-1.5 text-slate-500 text-xs mb-1">
            <RotateCcw className="h-3.5 w-3.5 text-emerald-600" />
            <span>Siklus Boot</span>
          </div>
          <div>
            <span className="text-xl font-bold text-slate-900">#{bootCount}</span>
          </div>
          <span className="text-[11px] text-slate-400 block mt-1">RTC Memory Count</span>
        </div>

        <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-3">
          <div className="flex items-center gap-1.5 text-slate-500 text-xs mb-1">
            <Award className="h-3.5 w-3.5 text-amber-500" />
            <span>Alasan Reset</span>
          </div>
          <div>
            <span className="text-sm font-bold text-amber-800 uppercase tracking-wide">
              {resetReason}
            </span>
          </div>
          <span className="text-[11px] text-slate-400 block mt-1">esp_reset_reason()</span>
        </div>
      </div>
    </div>
  );
};
