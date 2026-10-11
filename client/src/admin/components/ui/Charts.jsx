import React from 'react';

// A simple SVG Sparkline
export function Sparkline({ data, color = '#f59e0b', strokeWidth = 2 }) {
  if (!data || data.length === 0) return null;
  
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  
  const width = 100;
  const height = 30;
  const padding = 2;
  
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * (width - padding * 2) + padding;
    const y = height - ((d - min) / range) * (height - padding * 2) - padding;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible" preserveAspectRatio="none">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
}

// A simple HeatStrip (activity blocks)
export function HeatStrip({ data, className = '' }) {
  // data should be array of objects: { value: 0-4, date: string }
  return (
    <div className={`flex gap-1 overflow-hidden ${className}`}>
      {data.map((d, i) => (
        <div 
          key={i} 
          title={d.date ? `${d.date}: ${d.value} events` : `${d.value} events`}
          className={`flex-1 h-8 rounded-sm transition-opacity hover:opacity-80 ${
            d.value === 0 ? 'bg-slate-100 dark:bg-slate-800' :
            d.value === 1 ? 'bg-emerald-200 dark:bg-emerald-900' :
            d.value === 2 ? 'bg-emerald-300 dark:bg-emerald-700' :
            d.value === 3 ? 'bg-emerald-400 dark:bg-emerald-500' :
            'bg-emerald-500 dark:bg-emerald-400'
          }`}
        ></div>
      ))}
    </div>
  );
}
