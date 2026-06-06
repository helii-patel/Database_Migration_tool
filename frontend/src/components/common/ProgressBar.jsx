import React from 'react';

const ProgressBar = ({ value = 0, label, showPercent = true, color, height = 'h-2', animated = true }) => {
  const pct = Math.min(100, Math.max(0, value));

  const colorClass = color ||
    (pct === 100 ? 'bg-gradient-to-r from-emerald-500 to-emerald-400' :
     pct > 50 ? 'bg-gradient-to-r from-primary-500 to-cyan-400' :
     pct > 20 ? 'bg-gradient-to-r from-amber-500 to-amber-400' :
     'bg-gradient-to-r from-rose-500 to-rose-400');

  return (
    <div className="w-full">
      {(label || showPercent) && (
        <div className="flex justify-between items-center mb-1.5">
          {label && <span className="text-xs text-slate-500 dark:text-slate-400">{label}</span>}
          {showPercent && <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">{pct.toFixed(1)}%</span>}
        </div>
      )}
      <div className={`progress-bar ${height}`}>
        <div
          className={`${height} rounded-full transition-all duration-500 ease-out ${colorClass}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;
