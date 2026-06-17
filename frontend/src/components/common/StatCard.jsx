import React from 'react';

const TREND_COLORS = {
  up: 'text-emerald-500',
  down: 'text-rose-500',
  neutral: 'text-slate-400',
};

const StatCard = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  trendValue,
  color = 'primary',
  loading,
  id,
}) => {
  const colorMap = {
    primary: 'from-primary-500/20 to-primary-600/5 border-primary-500/20',
    emerald: 'from-emerald-500/20 to-emerald-600/5 border-emerald-500/20',
    rose: 'from-rose-500/20 to-rose-600/5 border-rose-500/20',
    amber: 'from-amber-500/20 to-amber-600/5 border-amber-500/20',
    cyan: 'from-cyan-500/20 to-cyan-600/5 border-cyan-500/20',
    purple: 'from-purple-500/20 to-purple-600/5 border-purple-500/20',
  };

  const iconBgMap = {
    primary: 'bg-primary-500/10 text-primary-500',
    emerald: 'bg-emerald-500/10 text-emerald-500',
    rose: 'bg-rose-500/10 text-rose-500',
    amber: 'bg-amber-500/10 text-amber-500',
    cyan: 'bg-cyan-500/10 text-cyan-500',
    purple: 'bg-purple-500/10 text-purple-500',
  };

  if (loading) {
    return (
      <div className="card p-5">
        <div className="skeleton h-4 w-24 mb-3 rounded" />
        <div className="skeleton h-8 w-32 mb-2 rounded" />
        <div className="skeleton h-3 w-20 rounded" />
      </div>
    );
  }

  return (
    <div
      id={id}
      className={`relative overflow-hidden rounded-2xl p-5 border bg-gradient-to-br ${colorMap[color]}
        bg-white dark:bg-surface-800 hover:shadow-lg transition-all duration-300 animate-fade-in group`}
    >
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 opacity-5 transform translate-x-8 -translate-y-8">
        <div className={`w-full h-full rounded-full ${iconBgMap[color].split(' ')[0]}`} />
      </div>

      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
            {title}
          </p>
          <p className="text-3xl font-bold text-slate-800 dark:text-white mb-1 tabular-nums">
            {value ?? '—'}
          </p>
          {subtitle && (
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{subtitle}</p>
          )}
          {(trend || trendValue) && (
            <p className={`text-xs font-medium mt-2 ${TREND_COLORS[trend]}`}>
              {trend === 'up' ? '▲' : trend === 'down' ? '▼' : '—'} {trendValue}
            </p>
          )}
        </div>
        {icon && (
          <div
            className={`flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center text-xl ${iconBgMap[color]}
            group-hover:scale-110 transition-transform duration-300`}
          >
            {icon}
          </div>
        )}
      </div>
    </div>
  );
};

export default StatCard;
