import React from 'react';

export function Badge({ children, variant = 'default', className = '' }) {
  const variants = {
    default: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
    green: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400',
    amber: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400',
    red: 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400',
    blue: 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400',
    purple: 'bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400',
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${variants[variant] || variants.default} ${className}`}>
      {children}
    </span>
  );
}

export function StatusPill({ status }) {
  const map = {
    active: { v: 'green', l: 'Active' },
    healthy: { v: 'green', l: 'Healthy' },
    verified: { v: 'green', l: 'Verified' },
    resolved: { v: 'green', l: 'Resolved' },
    pending: { v: 'amber', l: 'Pending' },
    watch: { v: 'amber', l: 'Watch' },
    suspended: { v: 'red', l: 'Suspended' },
    error: { v: 'red', l: 'Error' },
    dismissed: { v: 'slate', l: 'Dismissed' },
  };

  const config = map[status?.toLowerCase()] || { v: 'default', l: status };
  
  return (
    <Badge variant={config.v} className="flex items-center gap-1">
      {config.v === 'green' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>}
      {config.v === 'amber' && <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>}
      {config.v === 'red' && <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>}
      {config.l}
    </Badge>
  );
}
