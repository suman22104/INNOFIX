import React from 'react';
import { InfoTooltip } from './InfoTooltip';
import { Sparkline } from './Charts';

export function StatCard({ title, value, delta, tooltip, sparklineData, icon, color = 'amber' }) {
  const colorClasses = {
    blue: 'text-blue-500 bg-blue-50 dark:bg-blue-500/10',
    indigo: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10',
    amber: 'text-amber-500 bg-amber-50 dark:bg-amber-500/10',
    emerald: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10',
    rose: 'text-rose-500 bg-rose-50 dark:bg-rose-500/10',
    slate: 'text-slate-500 bg-slate-50 dark:bg-slate-500/10'
  };

  const isPositive = delta > 0;
  const isNegative = delta < 0;

  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm relative group overflow-hidden">
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-2xl ${colorClasses[color]}`}>
          {icon && React.cloneElement(icon, { className: 'w-5 h-5' })}
        </div>
        {delta !== undefined && delta !== null && (
          <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${
            isPositive ? 'text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-500/10' :
            isNegative ? 'text-rose-600 bg-rose-50 dark:text-rose-400 dark:bg-rose-500/10' :
            'text-slate-500 bg-slate-50 dark:bg-slate-800'
          }`}>
            {isPositive ? '▲' : isNegative ? '▼' : '−'}
            {Math.abs(delta)}%
          </div>
        )}
      </div>
      
      <div className="text-3xl font-black text-slate-900 dark:text-white mb-1 flex items-baseline gap-2">
        {value}
      </div>
      
      <div className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
        {title}
        {tooltip && <InfoTooltip text={tooltip} />}
      </div>

      {sparklineData && sparklineData.length > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-12 opacity-30 group-hover:opacity-100 transition-opacity">
          <Sparkline data={sparklineData} color={color === 'amber' ? '#f59e0b' : color === 'emerald' ? '#10b981' : color === 'rose' ? '#f43f5e' : '#3b82f6'} />
        </div>
      )}
    </div>
  );
}
