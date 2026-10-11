import React from 'react';

export function Skeleton({ className = '' }) {
  return (
    <div className={`animate-pulse bg-slate-200 dark:bg-slate-800 rounded-xl ${className}`}></div>
  );
}

export function SkeletonTable({ rows = 5, cols = 4 }) {
  return (
    <div className="w-full">
      <div className="flex gap-4 p-4 border-b border-slate-200 dark:border-slate-800">
        {[...Array(cols)].map((_, i) => (
          <Skeleton key={i} className="h-4 w-24 rounded" />
        ))}
      </div>
      {[...Array(rows)].map((_, r) => (
        <div key={r} className="flex gap-4 p-4 border-b border-slate-100 dark:border-slate-800/50">
          {[...Array(cols)].map((_, i) => (
            <Skeleton key={i} className={`h-4 ${i === 0 ? 'w-32' : 'w-24'} rounded`} />
          ))}
        </div>
      ))}
    </div>
  );
}
