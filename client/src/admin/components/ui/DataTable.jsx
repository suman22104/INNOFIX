import React from 'react';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';

export function DataTable({ columns, data, loading, onRowClick, emptyState, pagination }) {
  if (loading) {
    return (
      <div className="animate-pulse flex flex-col gap-4 p-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-12 bg-slate-100 dark:bg-slate-800 rounded-xl w-full"></div>
        ))}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return emptyState || (
      <div className="p-8 text-center text-slate-500">
        No data available
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="overflow-x-auto admin-scrollbar">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr>
              {columns.map((col, i) => (
                <th key={i} className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 text-xs font-black uppercase tracking-widest text-slate-400 bg-white dark:bg-slate-900 sticky top-0 z-10 whitespace-nowrap">
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr 
                key={row.id || i} 
                onClick={() => onRowClick && onRowClick(row)}
                className={`border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${onRowClick ? 'cursor-pointer' : ''}`}
              >
                {columns.map((col, j) => (
                  <td key={j} className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">
                    {col.cell ? col.cell(row) : row[col.accessorKey]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {pagination && (
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">
            Page {pagination.page} of {pagination.pages}
          </div>
          <div className="flex items-center gap-2">
            <button 
              disabled={pagination.page <= 1}
              onClick={() => pagination.setPage(pagination.page - 1)}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 text-slate-600 dark:text-slate-300 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button 
              disabled={pagination.page >= pagination.pages}
              onClick={() => pagination.setPage(pagination.page + 1)}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 text-slate-600 dark:text-slate-300 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
