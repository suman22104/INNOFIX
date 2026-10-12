import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Search } from 'lucide-react';
import GlobalSearchModal from './GlobalSearchModal';

/**
 * Search bar for the top of every signed-in screen (student, company and admin).
 * Opens the omni-search (people, events, opportunities, projects, communities, posts)
 * and responds to Ctrl/Cmd + K.
 *
 * Render it only for signed-in users, e.g. {isAuthenticated && <NavSearch />}.
 *
 * Desktop: a wide bar that fills the free space next to the logo.
 * Mobile:  a compact icon button.
 */
export default function NavSearch() {
  const [open, setOpen] = useState(false);

  const isMac =
    typeof navigator !== 'undefined' && /Mac|iPhone|iPad/i.test(navigator.platform || '');

  useEffect(() => {
    const onKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        // If a search modal is already open it closes itself on Ctrl+K
        if (!document.querySelector('[data-global-search]')) setOpen(true);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    <>
      {/* Desktop / tablet: full search bar */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Search INNOFIX"
        className="hidden md:flex flex-1 max-w-xl ml-4 mr-auto h-11 items-center justify-between gap-3 px-4 rounded-2xl border border-slate-300/70 dark:border-white/15 bg-white/70 dark:bg-white/10 backdrop-blur-md text-sm font-medium text-slate-500 dark:text-slate-300 shadow-sm hover:bg-white dark:hover:bg-white/15 hover:border-amber-400 dark:hover:border-amber-400/70 transition-all"
      >
        <span className="flex items-center gap-2.5 min-w-0">
          <Search className="w-4 h-4 shrink-0 text-amber-500" />
          <span className="truncate">Search people, events, opportunities…</span>
        </span>
        <kbd className="hidden lg:inline-block shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-white dark:bg-slate-900/70 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
          {isMac ? '⌘ K' : 'Ctrl K'}
        </kbd>
      </button>

      {/* Mobile: icon only */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Search INNOFIX"
        className="md:hidden ml-auto mr-3 grid size-10 place-items-center rounded-xl border border-slate-300/70 dark:border-white/15 bg-white/70 dark:bg-white/10 backdrop-blur-md text-slate-600 dark:text-slate-200 hover:border-amber-400 transition-colors"
      >
        <Search className="w-[18px] h-[18px] text-amber-500" />
      </button>

      {/* Rendered in <body> so no parent stacking context can hide it */}
      {open &&
        createPortal(
          <GlobalSearchModal isOpen onClose={() => setOpen(false)} />,
          document.body
        )}
    </>
  );
}
