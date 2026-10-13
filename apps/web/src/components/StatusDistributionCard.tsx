'use client';

import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { PieChart as PieIcon, SunMedium } from 'lucide-react';
import { StatsStatus } from '../types/iot';

interface StatusDistributionCardProps {
  distribution: StatsStatus['status_distribution'];
  todaySummary: StatsStatus['today_summary'];
}

export const StatusDistributionCard: React.FC<StatusDistributionCardProps> = ({
  distribution,
  todaySummary,
}) => {
  const pieData = [
    { name: 'Safe', value: distribution?.safe || 0, color: '#10b981' },
    { name: 'Medium', value: distribution?.medium || 0, color: '#f59e0b' },
    { name: 'Critical', value: distribution?.critical || 0, color: '#ef4444' },
  ].filter((d) => d.value > 0);

  const total = (distribution?.safe || 0) + (distribution?.medium || 0) + (distribution?.critical || 0);

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <PieIcon className="h-5 w-5 text-emerald-600" />
            <h3 className="text-base font-bold text-slate-900 tracking-tight">
              Proporsi Status Energi
            </h3>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            Total {total} Paket
          </span>
        </div>

        {/* Donut Chart */}
        <div className="h-44 w-full relative">
          {pieData.length === 0 ? (
            <div className="flex h-full items-center justify-center text-slate-400 text-xs">
              Belum ada riwayat status
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderColor: '#e2e8f0',
                      borderRadius: '12px',
                      fontSize: '12px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    }}
                    itemStyle={{ color: '#0f172a' }}
                  />
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={68}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              {/* Centered label */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-bold text-slate-900">
                  {total > 0
                    ? `${Math.round(((distribution?.safe || 0) / total) * 100)}%`
                    : '0%'}
                </span>
                <span className="text-[10px] uppercase text-emerald-700 font-semibold tracking-wider">
                  Safe Level
                </span>
              </div>
            </>
          )}
        </div>

        {/* Legend */}
        <div className="grid grid-cols-3 gap-2 text-center text-xs mt-3 pt-3 border-t border-slate-100">
          <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200">
            <p className="text-[10px] text-emerald-700 font-semibold uppercase">Safe</p>
            <p className="text-base font-bold text-emerald-900 mt-0.5">
              {distribution?.safe || 0}
            </p>
          </div>
          <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200">
            <p className="text-[10px] text-amber-700 font-semibold uppercase">Medium</p>
            <p className="text-base font-bold text-amber-900 mt-0.5">
              {distribution?.medium || 0}
            </p>
          </div>
          <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200">
            <p className="text-[10px] text-rose-700 font-semibold uppercase">Critical</p>
            <p className="text-base font-bold text-rose-900 mt-0.5">
              {distribution?.critical || 0}
            </p>
          </div>
        </div>
      </div>

      {/* Today Aggregations Summary */}
      <div className="mt-5 pt-4 border-t border-slate-100">
        <p className="text-[11px] font-semibold tracking-wider uppercase text-slate-500 mb-2.5 flex items-center gap-1.5">
          <SunMedium className="h-3.5 w-3.5 text-amber-500" /> Agregasi Hari Ini
        </p>
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-200/80">
            <span className="text-[10px] text-slate-500 block font-medium">Min Vcap</span>
            <span className="font-bold text-slate-800 text-sm">
              {todaySummary?.min_vcap ? `${todaySummary.min_vcap}V` : '-'}
            </span>
          </div>
          <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-200/80">
            <span className="text-[10px] text-slate-500 block font-medium">Avg Vcap</span>
            <span className="font-bold text-blue-700 text-sm">
              {todaySummary?.avg_vcap ? `${todaySummary.avg_vcap}V` : '-'}
            </span>
          </div>
          <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-200/80">
            <span className="text-[10px] text-slate-500 block font-medium">Max Vcap</span>
            <span className="font-bold text-emerald-700 text-sm">
              {todaySummary?.max_vcap ? `${todaySummary.max_vcap}V` : '-'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
