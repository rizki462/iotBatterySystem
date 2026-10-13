'use client';

import React, { useState } from 'react';
import { Download, Filter, ChevronLeft, ChevronRight, Table as TableIcon } from 'lucide-react';
import { Reading } from '../types/iot';

interface HistoryTableProps {
  readings: Reading[];
}

export const HistoryTable: React.FC<HistoryTableProps> = ({ readings }) => {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 10;

  // Filter
  const filtered = readings.filter((r) => {
    if (filterStatus === 'all') return true;
    return r.status.toLowerCase() === filterStatus.toLowerCase();
  });

  // Pagination
  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
  const paginatedData = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // CSV Export
  const exportToCSV = () => {
    if (readings.length === 0) return;
    const headers = [
      'ID',
      'Device ID',
      'Timestamp',
      'Vcap (V)',
      'Status',
      'Predicted V (V)',
      'Sleep (s)',
      'Reset Reason',
      'Boot Count',
      'WiFi (ms)',
      'Active (ms)',
    ];

    const rows = readings.map((r) => [
      r.id,
      r.device_id,
      new Date(r.received_at).toISOString(),
      r.vcap,
      r.status,
      r.predicted_v,
      r.sleep_s,
      r.reset_reason,
      r.boot_count,
      r.wifi_ms,
      r.active_ms,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `iot_supercap_telemetry_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <div className="flex items-center gap-2">
          <TableIcon className="h-5 w-5 text-blue-600" />
          <div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight">
              Log Riwayat Telemetri
            </h3>
            <p className="text-xs text-slate-500">
              Total {filtered.length} catatan telemetri tersimpan di PostgreSQL
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Status Filter */}
          <div className="relative">
            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="rounded-xl bg-white border border-slate-200 py-1.5 pl-3 pr-8 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs cursor-pointer hover:border-slate-300"
            >
              <option value="all">Semua Status</option>
              <option value="safe">Safe</option>
              <option value="medium">Medium</option>
              <option value="critical">Critical</option>
            </select>
            <Filter className="absolute right-2.5 top-2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
          </div>

          {/* Export CSV Button */}
          <button
            onClick={exportToCSV}
            className="flex items-center gap-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors shadow-2xs cursor-pointer"
            title="Download Telemetri sebagai file CSV"
          >
            <Download className="h-3.5 w-3.5 text-blue-600" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
        </div>
      </div>

      {/* Responsive Table Container */}
      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full text-left text-xs text-slate-700">
          <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider text-[11px] border-b border-slate-200">
            <tr>
              <th className="py-3 px-3.5">Waktu Masuk</th>
              <th className="py-3 px-3.5">Vcap</th>
              <th className="py-3 px-3.5">Prediksi</th>
              <th className="py-3 px-3.5">Status</th>
              <th className="py-3 px-3.5">Durasi Sleep</th>
              <th className="py-3 px-3.5">WiFi / Aktif</th>
              <th className="py-3 px-3.5">Boot</th>
              <th className="py-3 px-3.5">Reset Reason</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-slate-400 font-sans">
                  Tidak ada catatan telemetri yang sesuai kriteria.
                </td>
              </tr>
            ) : (
              paginatedData.map((r) => {
                const date = new Date(r.received_at);
                const timeString = date.toLocaleTimeString('id-ID', {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                });
                const dateString = date.toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'short',
                });

                return (
                  <tr
                    key={r.id}
                    className="hover:bg-slate-50/70 transition-colors"
                  >
                    <td className="py-3 px-3.5 whitespace-nowrap">
                      <span className="text-slate-900 font-medium">{timeString}</span>
                      <span className="text-[11px] text-slate-400 block">
                        {dateString}
                      </span>
                    </td>
                    <td className="py-3 px-3.5 font-bold text-sky-700 whitespace-nowrap">
                      {r.vcap.toFixed(2)} V
                    </td>
                    <td className="py-3 px-3.5 font-semibold text-indigo-700 whitespace-nowrap">
                      {r.predicted_v.toFixed(2)} V
                    </td>
                    <td className="py-3 px-3.5 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                          r.status === 'safe'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : r.status === 'medium'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="py-3 px-3.5 text-slate-700 whitespace-nowrap">
                      {r.sleep_s}s
                      <span className="text-[11px] text-slate-400 ml-1">
                        ({Math.round(r.sleep_s / 60)}m)
                      </span>
                    </td>
                    <td className="py-3 px-3.5 whitespace-nowrap text-slate-600 text-xs">
                      <span className="font-medium text-slate-900">{r.wifi_ms}ms</span> / {r.active_ms}ms
                    </td>
                    <td className="py-3 px-3.5 text-slate-700 whitespace-nowrap font-medium">
                      #{r.boot_count}
                    </td>
                    <td className="py-3 px-3.5 uppercase text-xs text-slate-500 whitespace-nowrap">
                      {r.reset_reason}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 text-xs text-slate-500">
          <span>
            Halaman {currentPage} dari {totalPages}
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-40 transition-colors shadow-2xs cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4 text-slate-600" />
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-40 transition-colors shadow-2xs cursor-pointer"
            >
              <ChevronRight className="h-4 w-4 text-slate-600" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
