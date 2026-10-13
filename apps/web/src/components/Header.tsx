'use client';

import React from 'react';
import {
  RefreshCw,
  Cpu,
  SlidersHorizontal,
  Clock,
  LogOut,
  Zap,
} from 'lucide-react';
import { Device } from '../types/iot';

interface HeaderProps {
  devices: Device[];
  selectedDeviceId: string;
  onSelectDevice: (id: string) => void;
  isOnline: boolean;
  secondsSinceLastSeen: number | null;
  refreshing: boolean;
  onRefresh: () => void;
  autoRefreshInterval: number; // 0 = off, else seconds
  onChangeAutoRefresh: (val: number) => void;
  onOpenCommandModal: () => void;
  onLogout: () => void;
  userEmail?: string;
}

export const Header: React.FC<HeaderProps> = ({
  devices,
  selectedDeviceId,
  onSelectDevice,
  isOnline,
  secondsSinceLastSeen,
  refreshing,
  onRefresh,
  autoRefreshInterval,
  onChangeAutoRefresh,
  onOpenCommandModal,
  onLogout,
  userEmail,
}) => {
  const formatLastSeen = (sec: number | null) => {
    if (sec === null) return 'Belum terdeteksi';
    if (sec < 60) return `${sec} detik lalu`;
    const min = Math.floor(sec / 60);
    if (min < 60) return `${min} menit lalu`;
    const hours = Math.floor(min / 60);
    return `${hours} jam lalu`;
  };

  return (
    <header className="sticky top-0 z-30 w-full border-b border-slate-200/90 bg-white/90 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between gap-4">
          {/* Logo & Device Title */}
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-sm">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900">
                  SuperCap IoT
                </h1>
                <span className="hidden sm:inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700 border border-blue-200">
                  Batteryless
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium hidden sm:block">
                ESP32-C3 &bull; Solar + Supercapacitor &bull; ARIMA Dynamic Sleep
              </p>
            </div>
          </div>

          {/* Right Action Tools */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Device Selector */}
            {devices.length > 0 && (
              <div className="relative hidden md:block">
                <select
                  value={selectedDeviceId}
                  onChange={(e) => onSelectDevice(e.target.value)}
                  className="rounded-xl bg-white border border-slate-200 py-2 pl-3 pr-8 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs cursor-pointer hover:border-slate-300"
                >
                  {devices.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name || d.id}
                    </option>
                  ))}
                </select>
                <Cpu className="absolute right-2.5 top-2.5 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
              </div>
            )}

            {/* Heartbeat Status Indicator */}
            <div className="flex items-center gap-2 rounded-xl bg-white border border-slate-200 px-3 py-2 text-xs shadow-xs">
              <span className="relative flex h-2.5 w-2.5">
                {isOnline && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                )}
                <span
                  className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                    isOnline ? 'bg-emerald-500' : 'bg-rose-500'
                  }`}
                />
              </span>
              <span className={`font-semibold ${isOnline ? 'text-emerald-700' : 'text-rose-700'}`}>
                {isOnline ? 'Online' : 'Sleep / Offline'}
              </span>
              <span className="text-slate-400 hidden lg:inline text-xs">
                ({formatLastSeen(secondsSinceLastSeen)})
              </span>
            </div>

            {/* Auto Refresh selector */}
            <div className="relative hidden lg:block">
              <select
                value={autoRefreshInterval}
                onChange={(e) => onChangeAutoRefresh(Number(e.target.value))}
                className="rounded-xl bg-white border border-slate-200 py-2 pl-3 pr-8 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs cursor-pointer hover:border-slate-300"
                title="Pilih interval pembaruan otomatis"
              >
                <option value={0}>Auto: Nonaktif</option>
                <option value={5}>Auto: Tiap 5d</option>
                <option value={15}>Auto: Tiap 15d</option>
                <option value={30}>Auto: Tiap 30d</option>
              </select>
              <Clock className="absolute right-2.5 top-2.5 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
            </div>

            {/* Refresh Now Button */}
            <button
              onClick={onRefresh}
              disabled={refreshing}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
              title="Perbarui Data Sekarang"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin text-blue-600' : ''}`} />
            </button>

            {/* Send Command Button */}
            <button
              onClick={onOpenCommandModal}
              className="flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 px-3.5 py-2 text-xs font-semibold text-white shadow-xs transition-colors cursor-pointer"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Perintah</span>
            </button>

            {/* Logout button */}
            <button
              onClick={onLogout}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50/50 transition-colors shadow-xs cursor-pointer"
              title={`Logout (${userEmail || 'Admin'})`}
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
