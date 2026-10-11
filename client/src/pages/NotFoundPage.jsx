import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, Home, ArrowLeft, Search } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6 animate-in fade-in zoom-in-95 duration-200">
        <div className="relative inline-block">
          <div className="w-24 h-24 rounded-3xl bg-amber-400/20 text-amber-500 flex items-center justify-center mx-auto text-4xl font-black">
            404
          </div>
          <span className="absolute -bottom-1 -right-1 p-2 bg-amber-400 text-slate-950 rounded-2xl shadow-sm">
            <Compass className="w-5 h-5 animate-pulse" />
          </span>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 font-display">
            Page Not Found
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-sm mx-auto">
            The link you followed may be broken, or the page may have been removed or relocated.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/"
            className="w-full sm:w-auto px-6 py-3 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-2xl shadow-sm transition-all flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            <span>Go to Homepage</span>
          </Link>
          <Link
            to="/dashboard"
            className="w-full sm:w-auto px-6 py-3 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm transition-all flex items-center justify-center gap-2"
          >
            <span>Explore Dashboard</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
