import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  Layout, Users, Cpu, ShieldAlert, Settings, Server, TrendingUp, 
  Menu, X, RefreshCcw, Search, Zap, ArrowLeft, LogOut, Moon, Sun
} from 'lucide-react';

import { CommandPalette } from '../components/ui/CommandPalette';
import '../admin.css';

// Admin Pages
import OverviewPage from '../pages/OverviewPage';
import UsersPage from '../pages/UsersPage';
import AIEnginePage from '../pages/AIEnginePage';
import ModerationPage from '../pages/ModerationPage';
import AnalyticsPage from '../pages/AnalyticsPage';
import ReputationPage from '../pages/ReputationPage';
import AdminsPage from '../pages/AdminsPage';
import SystemPage from '../pages/SystemPage';

const NAVIGATION = [
  { id: 'overview', path: '/admin', label: 'Overview', icon: <Layout />, group: 'Monitor' },
  { id: 'analytics', path: '/admin/analytics', label: 'Impact & Analytics', icon: <TrendingUp />, group: 'Monitor' },
  { id: 'users', path: '/admin/users', label: 'Users & Roles', icon: <Users />, group: 'People' },
  { id: 'reputation', path: '/admin/reputation', label: 'Reputation Control', icon: <Zap />, group: 'People' },
  { id: 'moderation', path: '/admin/moderation', label: 'Moderation Queue', icon: <ShieldAlert />, group: 'Content' },
  { id: 'ai', path: '/admin/ai', label: 'AI Engine', icon: <Cpu />, group: 'AI' },
  { id: 'admins', path: '/admin/settings', label: 'Admins & Audit', icon: <Settings />, group: 'System' },
  { id: 'system', path: '/admin/system', label: 'Server Health', icon: <Server />, group: 'System' },
];

export function AdminLayout() {
  const { user, logout, darkMode, toggleDarkMode } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Command palette listener
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'k' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        setCmdOpen(o => !o);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  const groups = [...new Set(NAVIGATION.map(n => n.group))];

  return (
    <div className="admin-layout-wrapper min-h-screen bg-slate-50 dark:bg-slate-950 flex font-sans transition-colors text-slate-900 dark:text-slate-100">
      
      {/* MOBILE SIDEBAR BACKDROP */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col transition-transform duration-300 md:translate-x-0 md:static ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="h-16 px-6 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 shrink-0">
          <Link to="/admin" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-amber-400 shadow-lg">
              <Zap className="w-4 h-4" />
            </div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white leading-none tracking-tight">
              COMMAND<span className="text-amber-500">CENTER</span>
            </h1>
          </Link>
          <button className="md:hidden p-2 text-slate-400" onClick={() => setSidebarOpen(false)}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto admin-scrollbar py-4 px-3 space-y-6">
          {groups.map(group => (
            <div key={group}>
              <h4 className="pl-10 pr-3 mb-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                {group}
              </h4>
              <nav className="space-y-0.5">
                {NAVIGATION.filter(n => n.group === group).map(nav => (
                  <Link
                    key={nav.id}
                    to={nav.path}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-bold transition-all ${
                      (location.pathname === nav.path || (nav.path !== '/admin' && location.pathname.startsWith(nav.path)))
                        ? 'bg-amber-400 text-slate-900 shadow-sm'
                        : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    {React.cloneElement(nav.icon, { className: 'w-4 h-4' })}
                    {nav.label}
                  </Link>
                ))}
              </nav>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-slate-200 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-500 flex items-center justify-center font-bold text-sm uppercase shrink-0">
              {user?.fullName?.[0] || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{user?.fullName}</p>
              <p className="text-[10px] uppercase font-black text-slate-400 tracking-wider truncate">{user?.role}</p>
            </div>
            <button onClick={logout} className="p-2 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        
        {/* TOP HEADER */}
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 sm:px-6 shrink-0">
          <div className="flex items-center gap-4">
            <button className="md:hidden p-2 -ml-2 text-slate-500" onClick={() => setSidebarOpen(true)}>
              <Menu className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setCmdOpen(true)}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors w-64"
            >
              <Search className="w-4 h-4" />
              <span>Global Search...</span>
              <kbd className="ml-auto text-[10px] font-black uppercase bg-white dark:bg-slate-900 px-1.5 rounded border border-slate-200 dark:border-slate-700">Ctrl K</kbd>
            </button>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-4">
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Mode
            </span>
            <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block"></div>
            <span className="text-[10px] font-bold text-slate-400 hidden sm:block">
              Updated: {lastUpdated.toLocaleTimeString()}
            </span>
            <button 
              onClick={() => {
                setLastUpdated(new Date());
                window.dispatchEvent(new Event('admin-refresh'));
              }}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Refresh Data"
            >
              <RefreshCcw className="w-4 h-4" />
            </button>
            <button 
              onClick={toggleDarkMode}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main className="flex-1 overflow-y-auto admin-scrollbar p-4 sm:p-6 lg:p-8 relative">
          <Routes>
            <Route index element={<OverviewPage />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="moderation" element={<ModerationPage />} />
            <Route path="ai" element={<AIEnginePage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="reputation" element={<ReputationPage />} />
            <Route path="settings" element={<AdminsPage />} />
            <Route path="system" element={<SystemPage />} />
          </Routes>
        </main>
      </div>

      <CommandPalette 
        isOpen={cmdOpen} 
        onClose={() => setCmdOpen(false)}
        navigation={NAVIGATION.map(n => ({
          ...n,
          onClick: () => navigate(n.path)
        }))}
      />
    </div>
  );
}
