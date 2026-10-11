import React from 'react';

export function Tabs({ tabs, activeTab, onChange }) {
  return (
    <div className="flex space-x-1 p-1 bg-slate-100 dark:bg-slate-800/50 rounded-xl overflow-x-auto admin-scrollbar">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-lg transition-all whitespace-nowrap ${
            activeTab === tab.id
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-700/50'
          }`}
        >
          {tab.icon && React.cloneElement(tab.icon, { className: 'w-4 h-4' })}
          {tab.label}
          {tab.count !== undefined && (
            <span className={`px-2 py-0.5 rounded-full text-[10px] ${
              activeTab === tab.id 
                ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-500' 
                : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
            }`}>
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
