import React from 'react';

interface MetricCardProps {
  title: string;
  value: string | number;
  unit?: string;
  subtitle?: string;
  badge?: {
    text: string;
    variant: 'safe' | 'medium' | 'critical' | 'cyan' | 'purple' | 'slate';
  };
  icon: React.ReactNode;
  progressPercent?: number;
  progressColor?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  unit,
  subtitle,
  badge,
  icon,
  progressPercent,
  progressColor = 'bg-blue-600',
}) => {
  const badgeColors = {
    safe: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    medium: 'bg-amber-50 text-amber-700 border-amber-200',
    critical: 'bg-rose-50 text-rose-700 border-rose-200',
    cyan: 'bg-sky-50 text-sky-700 border-sky-200',
    purple: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    slate: 'bg-slate-100 text-slate-700 border-slate-200',
  };

  return (
    <div className="relative overflow-hidden rounded-2xl bg-white border border-slate-200/90 p-5 shadow-xs transition-all duration-200 hover:border-slate-300 hover:shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold tracking-wider uppercase text-slate-500">
            {title}
          </p>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-3xl font-bold tracking-tight text-slate-900">
              {value}
            </span>
            {unit && <span className="text-sm font-medium text-slate-500">{unit}</span>}
          </div>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-50 border border-slate-100 text-blue-600 shadow-2xs">
          {icon}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between text-xs">
        {subtitle && <span className="text-slate-500 font-medium">{subtitle}</span>}
        {badge && (
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
              badgeColors[badge.variant]
            }`}
          >
            {badge.text}
          </span>
        )}
      </div>

      {typeof progressPercent === 'number' && (
        <div className="mt-3 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${progressColor}`}
            style={{ width: `${Math.min(Math.max(progressPercent, 0), 100)}%` }}
          />
        </div>
      )}
    </div>
  );
};
