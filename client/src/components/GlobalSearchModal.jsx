import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Sparkles, ArrowRight } from 'lucide-react';
import { searchAPI } from '../services/api';
import { ResultGroups, SEARCH_TABS, isEmptyResults } from './SearchResults';

export default function GlobalSearchModal({ isOpen, onClose }) {
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setResults(null);
      setActiveTab('all');
    }
  }, [isOpen]);

  // Esc / Ctrl+K close the modal (opening is handled by the search bar that renders it)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;
      if (e.key === 'Escape') onClose();
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults(null);
      return undefined;
    }
    let cancelled = false;
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await searchAPI.search(query, activeTab, 6);
        if (!cancelled && res.data.success) setResults(res.data.results);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, activeTab]);

  if (!isOpen) return null;

  const handleSelect = (url) => {
    onClose();
    navigate(url);
  };

  const seeAll = () => {
    const q = query.trim();
    if (!q) return;
    handleSelect(`/search?q=${encodeURIComponent(q)}${activeTab !== 'all' ? `&type=${activeTab}` : ''}`);
  };

  return (
    <div
      data-global-search
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
      className="fixed inset-0 z-[100] flex items-start justify-center pt-16 sm:pt-24 p-4 bg-slate-900/60 backdrop-blur-sm"
    >
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[80vh]">
        {/* Search Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-200 dark:border-slate-800">
          <Search className="w-5 h-5 text-amber-500 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && seeAll()}
            placeholder="Search people, events, opportunities, projects, #tags..."
            className="w-full bg-transparent text-sm sm:text-base text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          >
            ESC
          </button>
        </div>

        {/* Tab Filters */}
        <div className="flex items-center gap-2 px-5 py-2.5 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 overflow-x-auto text-xs">
          {SEARCH_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-xl font-bold transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-amber-400 text-slate-900 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {loading && (
            <div className="py-12 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
              Searching network...
            </div>
          )}

          {!loading && !query && (
            <div className="py-12 text-center">
              <Sparkles className="w-10 h-10 text-amber-400 mx-auto mb-3" />
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                Find people, events, opportunities and more
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Try a name, &quot;React&quot;, &quot;@username&quot;, or &quot;#ai&quot;
              </p>
            </div>
          )}

          {!loading && query && results && (
            isEmptyResults(results) ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No matching results found for &quot;{query}&quot;.
              </div>
            ) : (
              <ResultGroups results={results} onSelect={handleSelect} />
            )
          )}
        </div>

        {/* Footer */}
        {query.trim() && (
          <button
            onClick={seeAll}
            className="flex items-center justify-between px-5 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
          >
            <span>See all results for &quot;{query.trim()}&quot;</span>
            <span className="flex items-center gap-1.5 text-slate-400">
              Enter <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
