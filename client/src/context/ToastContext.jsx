import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle2, XCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

const STYLES = {
  success: {
    box: 'border-emerald-200 dark:border-emerald-800/60',
    icon: 'text-emerald-500',
    Icon: CheckCircle2,
  },
  error: {
    box: 'border-red-200 dark:border-red-800/60',
    icon: 'text-red-500',
    Icon: XCircle,
  },
  info: {
    box: 'border-slate-200 dark:border-slate-700',
    icon: 'text-amber-500',
    Icon: Info,
  },
};

const MAX_TOASTS = 4;

function ToastItem({ toast, onClose }) {
  const [shown, setShown] = useState(false);
  const { box, icon, Icon } = STYLES[toast.type] || STYLES.info;

  // slide/fade in on mount
  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <div
      role="status"
      className={`pointer-events-auto flex items-start gap-4 w-full sm:w-[28rem] p-5 rounded-2xl bg-white dark:bg-slate-800 border-2 shadow-xl shadow-slate-400/30 dark:shadow-none transition-all duration-300 ${box} ${
        shown ? 'translate-y-0 opacity-100 scale-100' : '-translate-y-4 opacity-0 scale-95'
      }`}
    >
      <Icon className={`w-7 h-7 shrink-0 ${icon}`} />
      <div className="min-w-0 flex-1">
        <p className="text-base font-bold text-slate-900 dark:text-white leading-snug">{toast.message}</p>
        {toast.description && (
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{toast.description}</p>
        )}
      </div>
      <button
        type="button"
        onClick={() => onClose(toast.id)}
        aria-label="Dismiss notification"
        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 shrink-0"
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  );
}

/**
 * Global toast notifications. Mounted above the router so a toast survives page changes
 * (e.g. "Welcome back" stays visible after login redirects to the dashboard).
 *
 *   const toast = useToast();
 *   toast.success('Saved');  toast.error('Failed', { description: '...' });  toast.info('FYI');
 */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef({});
  const nextId = useRef(1);

  const dismiss = useCallback((id) => {
    clearTimeout(timers.current[id]);
    delete timers.current[id];
    setToasts((list) => list.filter((t) => t.id !== id));
  }, []);

  const show = useCallback(
    (message, { type = 'info', description = '', duration = 3500 } = {}) => {
      const id = nextId.current++;
      setToasts((list) => [...list.slice(-(MAX_TOASTS - 1)), { id, type, message, description }]);
      if (duration > 0) timers.current[id] = setTimeout(() => dismiss(id), duration);
      return id;
    },
    [dismiss]
  );

  useEffect(() => {
    const active = timers.current;
    return () => Object.values(active).forEach(clearTimeout);
  }, []);

  const api = useMemo(
    () => ({
      show,
      dismiss,
      success: (message, opts) => show(message, { ...opts, type: 'success' }),
      error: (message, opts) => show(message, { duration: 5000, ...opts, type: 'error' }),
      info: (message, opts) => show(message, { ...opts, type: 'info' }),
    }),
    [show, dismiss]
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed top-20 inset-x-4 z-[100] flex flex-col items-center gap-3"
      >
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onClose={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
};
