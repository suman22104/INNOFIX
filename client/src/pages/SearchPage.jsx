import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import SearchResults from '../components/SearchResults';

export default function SearchPage() {
  const [params, setParams] = useSearchParams();
  const urlQuery = params.get('q') || '';
  const [input, setInput] = useState(urlQuery);

  // keep the box in sync when the URL changes (e.g. searching again from the modal)
  useEffect(() => {
    setInput(urlQuery);
  }, [urlQuery]);

  // push typing into the URL (debounced) so results are shareable / back-button friendly
  useEffect(() => {
    if (input.trim() === urlQuery.trim()) return undefined;
    const t = setTimeout(() => {
      const next = new URLSearchParams(params);
      if (input.trim()) next.set('q', input.trim());
      else next.delete('q');
      setParams(next, { replace: true });
    }, 300);
    return () => clearTimeout(t);
  }, [input]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="py-6 transition-colors">
      <div className="w-full px-4 sm:px-6 lg:px-8 max-w-[860px] mx-auto space-y-5">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Search</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            People, events, opportunities, projects, communities and posts.
          </p>
        </div>

        <div className="flex items-center gap-3 px-4 h-12 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm focus-within:border-amber-400 transition-colors">
          <Search className="w-5 h-5 text-amber-500 shrink-0" />
          <input
            autoFocus
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Search anything on INNOFIX..."
            className="w-full bg-transparent text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none"
          />
          {input && (
            <button onClick={() => setInput('')} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {urlQuery.trim() ? (
          <SearchResults key={params.get('type') || 'all'} query={urlQuery} initialTab={params.get('type') || 'all'} limit={12} />
        ) : (
          <div className="py-16 text-center text-sm text-slate-400">Type something to start searching.</div>
        )}
      </div>
    </div>
  );
}
