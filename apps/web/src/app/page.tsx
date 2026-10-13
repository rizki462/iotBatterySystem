'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  TrendingUp,
  Moon,
  Cpu,
  BatteryCharging,
} from 'lucide-react';
import { Header } from '../components/Header';
import { MetricCard } from '../components/MetricCard';
import { TelemetryChart } from '../components/TelemetryChart';
import { StatusDistributionCard } from '../components/StatusDistributionCard';
import { TransmissionEfficiencyCard } from '../components/TransmissionEfficiencyCard';
import { HistoryTable } from '../components/HistoryTable';
import { CommandModal } from '../components/CommandModal';
import { api, getAuthToken, removeAuthToken } from '../lib/api';
import { StatsStatus, Reading } from '../types/iot';

export default function DashboardPage() {
  const router = useRouter();

  // State
  const [stats, setStats] = useState<StatsStatus | null>(null);
  const [readings, setReadings] = useState<Reading[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('esp32c3-01');
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [autoRefreshInterval, setAutoRefreshInterval] = useState<number>(10);
  const [isCommandModalOpen, setIsCommandModalOpen] = useState<boolean>(false);
  const [userProfile, setUserProfile] = useState<{ id: number; email: string } | null>(null);

  // Authentication check
  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      router.push('/login');
      return;
    }

    api
      .getProfile()
      .then((user) => setUserProfile(user))
      .catch(() => {
        removeAuthToken();
        router.push('/login');
      });
  }, [router]);

  // Initial load and auto-refresh timer with async cancellation token
  useEffect(() => {
    let ignore = false;

    const fetchData = () => {
      Promise.all([
        api.getStats(selectedDeviceId),
        api.getReadings({ device_id: selectedDeviceId, limit: 100 }),
      ])
        .then(([statsData, readingsData]) => {
          if (!ignore) {
            setStats(statsData);
            setReadings(readingsData);
          }
        })
        .catch((err: unknown) => {
          console.error('Failed to load dashboard data:', err);
        });
    };

    fetchData();

    if (autoRefreshInterval > 0) {
      const interval = setInterval(fetchData, autoRefreshInterval * 1000);
      return () => {
        ignore = true;
        clearInterval(interval);
      };
    }

    return () => {
      ignore = true;
    };
  }, [selectedDeviceId, autoRefreshInterval]);

  // Manual refresh handler for button
  const handleManualRefresh = async () => {
    setRefreshing(true);
    try {
      const [statsData, readingsData] = await Promise.all([
        api.getStats(selectedDeviceId),
        api.getReadings({ device_id: selectedDeviceId, limit: 100 }),
      ]);
      setStats(statsData);
      setReadings(readingsData);
    } catch (err: unknown) {
      console.error('Manual refresh failed:', err);
    } finally {
      setRefreshing(false);
    }
  };

  const handleLogout = () => {
    removeAuthToken();
    router.push('/login');
  };

  // Metrics calculation
  const latest = stats?.latest_reading || readings[0] || null;
  const vcap = latest?.vcap || 0;
  const predV = latest?.predicted_v || 0;
  const deltaV = vcap && predV ? Number((predV - vcap).toFixed(2)) : 0;
  const sleepSec = latest?.sleep_s || 0;
  const status = (latest?.status || 'safe').toLowerCase();

  // Supercapacitor capacity percentage estimation:
  // Rated: 5.0V max, 2.7V cutoff
  const capPercent = Math.round(((vcap - 2.7) / (5.0 - 2.7)) * 100);

  const statusBadgeVariant =
    status === 'safe' ? 'safe' : status === 'medium' ? 'medium' : 'critical';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Top Header */}
      <Header
        devices={stats?.all_devices || []}
        selectedDeviceId={selectedDeviceId}
        onSelectDevice={(id) => setSelectedDeviceId(id)}
        isOnline={stats?.is_online ?? false}
        secondsSinceLastSeen={stats?.seconds_since_last_seen ?? null}
        refreshing={refreshing}
        onRefresh={handleManualRefresh}
        autoRefreshInterval={autoRefreshInterval}
        onChangeAutoRefresh={(val) => setAutoRefreshInterval(val)}
        onOpenCommandModal={() => setIsCommandModalOpen(true)}
        onLogout={handleLogout}
        userEmail={userProfile?.email}
      />

      {/* Main Container */}
      <main className="flex-1 mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
        {/* Metric Cards Row */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Card 1: Vcap */}
          <MetricCard
            title="Tegangan Superkapasitor (Vcap)"
            value={latest ? latest.vcap.toFixed(2) : '-'}
            unit="V"
            subtitle={`Kapasitas Catu Daya ~${Math.max(0, capPercent)}%`}
            badge={{
              text: `Status: ${latest ? latest.status.toUpperCase() : 'N/A'}`,
              variant: statusBadgeVariant,
            }}
            icon={<BatteryCharging className="h-5 w-5 text-blue-600" />}
            progressPercent={capPercent}
            progressColor={
              status === 'safe'
                ? 'bg-emerald-600'
                : status === 'medium'
                ? 'bg-amber-500'
                : 'bg-rose-600'
            }
          />

          {/* Card 2: ARIMA Prediction */}
          <MetricCard
            title="Estimasi Model ARIMA (Vpred)"
            value={latest ? latest.predicted_v.toFixed(2) : '-'}
            unit="V"
            subtitle={
              deltaV >= 0
                ? `Peningkatan Energi (+${deltaV}V)`
                : `Penurunan Energi (${deltaV}V)`
            }
            badge={{
              text: deltaV >= 0 ? 'Surplus Solar' : 'Konsumsi',
              variant: deltaV >= 0 ? 'safe' : 'medium',
            }}
            icon={<TrendingUp className="h-5 w-5 text-indigo-600" />}
            progressPercent={Math.min(Math.max(Math.round((predV / 5.0) * 100), 0), 100)}
            progressColor="bg-indigo-600"
          />

          {/* Card 3: Deep Sleep Duration */}
          <MetricCard
            title="Durasi Siklus Tidur"
            value={latest ? latest.sleep_s : '-'}
            unit="detik"
            subtitle={`Siklus ~${Math.round(sleepSec / 60)} Menit`}
            badge={{
              text: latest ? `Reset: ${latest.reset_reason}` : 'N/A',
              variant: 'cyan',
            }}
            icon={<Moon className="h-5 w-5 text-sky-600" />}
          />

          {/* Card 4: Active Cycle & Efficiency */}
          <MetricCard
            title="Waktu Aktif Transmisi"
            value={latest ? latest.active_ms : '-'}
            unit="ms"
            subtitle={`Wi-Fi: ${latest ? latest.wifi_ms : '-'}ms | Boot #${latest?.boot_count || 1}`}
            badge={{
              text: 'Ultra-Low Power',
              variant: 'safe',
            }}
            icon={<Cpu className="h-5 w-5 text-emerald-600" />}
          />
        </section>

        {/* Charts Section */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <TelemetryChart readings={readings} />
          <StatusDistributionCard
            distribution={stats?.status_distribution || { safe: 0, medium: 0, critical: 0 }}
            todaySummary={
              stats?.today_summary || {
                total_packets: 0,
                min_vcap: null,
                max_vcap: null,
                avg_vcap: null,
                avg_wifi_ms: null,
                avg_active_ms: null,
              }
            }
          />
        </section>

        {/* Timing and Energy Efficiency Metrics */}
        <section>
          <TransmissionEfficiencyCard latestReading={latest} />
        </section>

        {/* Telemetry Log Table */}
        <section>
          <HistoryTable readings={readings} />
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-5 text-center text-xs text-slate-500">
        <div className="mx-auto max-w-7xl px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>
            &copy; 2026 IoT Batteryless Monitoring System &bull; ESP32-C3 Supercapacitor Project
          </p>
          <div className="flex items-center gap-4 text-xs text-slate-500 font-medium">
            <span>NestJS API + Next.js App Router</span>
            <span>&bull;</span>
            <span>PostgreSQL Engine</span>
          </div>
        </div>
      </footer>

      {/* Action Command Modal */}
      <CommandModal
        isOpen={isCommandModalOpen}
        onClose={() => setIsCommandModalOpen(false)}
        deviceId={selectedDeviceId}
      />
    </div>
  );
}
