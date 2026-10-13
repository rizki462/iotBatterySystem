'use client';

import React, { useState } from 'react';
import {
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend,
} from 'recharts';
import { Reading } from '../types/iot';
import { TrendingUp } from 'lucide-react';

interface TelemetryChartProps {
  readings: Reading[];
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: {
      id: number;
      time: string;
      fullDate: string;
      vcap: number;
      predicted_v: number;
      sleep_s: number;
      status: string;
    };
  }>;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-lg text-xs">
        <p className="font-semibold text-slate-700 mb-2 border-b border-slate-100 pb-1">
          Waktu: {data.fullDate}
        </p>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-4">
            <span className="text-sky-700 font-medium">Tegangan Aktual (Vcap):</span>
            <span className="font-bold text-slate-900">{data.vcap} V</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-indigo-700 font-medium">Prediksi ARIMA:</span>
            <span className="font-bold text-slate-900">{data.predicted_v} V</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-slate-500">Durasi Sleep:</span>
            <span className="text-slate-700 font-medium">{data.sleep_s} detik</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-slate-500">Status:</span>
            <span
              className={`font-semibold uppercase text-[10px] px-2 py-0.5 rounded-full border ${
                data.status === 'safe'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : data.status === 'medium'
                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                  : 'bg-rose-50 text-rose-700 border-rose-200'
              }`}
            >
              {data.status}
            </span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export const TelemetryChart: React.FC<TelemetryChartProps> = ({ readings }) => {
  const [dataLimit, setDataLimit] = useState<number>(20);

  // Format data for chart (sorted chronological for the graph: old -> new)
  const chartData = [...readings]
    .slice(0, dataLimit)
    .reverse()
    .map((r) => {
      const date = new Date(r.received_at);
      const timeStr = date.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
      return {
        id: r.id,
        time: timeStr,
        fullDate: date.toLocaleString('id-ID'),
        vcap: Number(r.vcap.toFixed(2)),
        predicted_v: Number(r.predicted_v.toFixed(2)),
        sleep_s: r.sleep_s,
        status: r.status,
      };
    });

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs lg:col-span-2">
      {/* Chart Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            <h3 className="text-base font-bold text-slate-900 tracking-tight">
              Dinamika Tegangan Superkapasitor & ARIMA
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Perbandingan tegangan real-time (Vcap) terhadap estimasi model ARIMA internal
          </p>
        </div>

        {/* Data points limit selector */}
        <div className="flex items-center gap-1 self-start sm:self-auto bg-slate-100 p-1 rounded-xl text-xs border border-slate-200/70">
          {[10, 20, 50].map((limit) => (
            <button
              key={limit}
              onClick={() => setDataLimit(limit)}
              className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                dataLimit === limit
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {limit} Poin
            </button>
          ))}
        </div>
      </div>

      {/* Chart Container */}
      <div className="h-72 sm:h-80 w-full">
        {chartData.length === 0 ? (
          <div className="flex h-full items-center justify-center text-slate-400 text-sm">
            Menunggu data telemetri pertama dari alat...
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="vcapGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0284c7" stopOpacity={0.18} />
                  <stop offset="95%" stopColor="#0284c7" stopOpacity={0.01} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey="time"
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#e2e8f0' }}
              />
              <YAxis
                stroke="#64748b"
                fontSize={11}
                domain={[2.5, 5.2]}
                tickLine={false}
                axisLine={{ stroke: '#e2e8f0' }}
                unit="V"
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="top"
                height={36}
                formatter={(value) => (
                  <span className="text-xs font-medium text-slate-700">
                    {value === 'vcap' ? 'Vcap Aktual (V)' : 'Prediksi ARIMA (V)'}
                  </span>
                )}
              />
              {/* Threshold Lines */}
              <ReferenceLine
                y={3.8}
                stroke="#059669"
                strokeDasharray="4 4"
                label={{
                  value: 'Safe (3.8V)',
                  fill: '#059669',
                  fontSize: 10,
                  position: 'right',
                }}
              />
              <ReferenceLine
                y={2.7}
                stroke="#e11d48"
                strokeDasharray="4 4"
                label={{
                  value: 'Cut-off (2.7V)',
                  fill: '#e11d48',
                  fontSize: 10,
                  position: 'right',
                }}
              />
              <Area
                type="monotone"
                dataKey="vcap"
                stroke="#0284c7"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#vcapGradient)"
                activeDot={{ r: 5, fill: '#0284c7', stroke: '#ffffff', strokeWidth: 2 }}
              />
              <Line
                type="monotone"
                dataKey="predicted_v"
                stroke="#6366f1"
                strokeWidth={2}
                strokeDasharray="4 2"
                dot={{ r: 3, fill: '#6366f1' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};
