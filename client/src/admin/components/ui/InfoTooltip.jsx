import React from 'react';
import { HelpCircle } from 'lucide-react';

export function InfoTooltip({ text }) {
  return (
    <div className="relative group inline-flex items-center justify-center">
      <HelpCircle className="w-3.5 h-3.5 text-slate-400 cursor-help hover:text-slate-600 dark:hover:text-slate-300 transition-colors" />
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-slate-800 dark:bg-slate-700 text-white text-xs rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 text-center font-medium pointer-events-none">
        {text}
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800 dark:border-t-slate-700"></div>
      </div>
    </div>
  );
}
