import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import NotificationDropdown from './NotificationDropdown';
import { Compass, Briefcase, Calendar, Users, LayoutDashboard, BarChart3, ShieldCheck, Trophy, MessageSquare, User, LogOut, Settings, Bookmark, Sparkles, Star, Lightbulb, Sun, Moon } from 'lucide-react';

export default function Sidebar() {
  const { user, isAuthenticated, logout, darkMode, toggleDarkMode } = useAuth();
  const { unreadMessages } = useSocket();
  const location = useLocation();
  const navigate = useNavigate();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const profileDropdownRef = useRef(null);
  const timeoutRef = useRef(null);

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setProfileDropdownOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setProfileDropdownOpen(false);
    }, 300);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  if (!isAuthenticated) return null;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinks = [
    { name: 'Feed', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Projects', path: '/projects', icon: Compass },
    { name: 'Communities', path: '/communities', icon: Users },
    { name: 'Leaderboard', path: '/leaderboard', icon: Trophy },
    { name: 'Events', path: '/events', icon: Calendar },
    { name: 'Opportunities', path: '/opportunities', icon: Briefcase },
    { name: 'Impact', path: '/analytics', icon: BarChart3 },
  ];

  if (user?.role === 'admin') {
    navLinks.push({ name: 'Admin Console', path: '/admin', icon: ShieldCheck });
  }

  return (
    <aside className="hidden xl:flex flex-col fixed left-0 top-0 h-screen w-[72px] hover:w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-300 ease-in-out z-40 group shadow-lg">
      <div className="flex items-center px-4 py-3 h-16 shrink-0">
        <Link to="/" className="flex items-center gap-3 overflow-hidden ml-0.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-400 to-amber-300 text-slate-900 flex items-center justify-center font-bold text-lg shadow-md shrink-0 transition-transform">
            <Lightbulb className="w-5 h-5" strokeWidth={2.5} />
          </div>
          <div className="flex flex-col opacity-0 group-hover:opacity-100 transition-opacity duration-300 w-48">
            <span className="font-black text-xl tracking-tight text-slate-900 dark:text-white leading-none whitespace-nowrap">
              INNO<span className="text-amber-500">FIX</span>
            </span>
          </div>
        </Link>
      </div>

      <div className="flex-1 py-4 px-3 space-y-2 flex flex-col overflow-y-auto custom-scrollbar overflow-x-hidden">
        {navLinks.map((link) => {
          const Icon = link.icon;
          const isActive = location.pathname === link.path;
          return (
            <Link
              key={link.path}
              to={link.path}
              className={`flex items-center gap-4 px-3 py-3 rounded-xl transition-all whitespace-nowrap ${isActive
                  ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 font-extrabold shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
            >
              <Icon
                className={`w-6 h-6 shrink-0 transition-transform duration-200 group-hover:scale-110 ${isActive ? 'text-amber-500' : ''}`}
                strokeWidth={isActive ? 2.5 : 2}
              />
              <span className="text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                {link.name}
              </span>
            </Link>
          );
        })}
      </div>

      <div className="p-3 border-t border-slate-200 dark:border-slate-800 space-y-1">
        <Link
          to="/messages"
          className="relative flex items-center gap-4 px-3 py-3 rounded-xl transition-all whitespace-nowrap text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <div className="relative shrink-0 w-6 h-6 flex items-center justify-center">
            <MessageSquare className="w-6 h-6 shrink-0 transition-transform duration-200 group-hover:scale-110" strokeWidth={2} />
            {unreadMessages > 0 && (
              <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[16px] h-[16px] px-1 text-[9px] font-extrabold text-slate-900 bg-amber-400 rounded-full ring-2 ring-white dark:ring-slate-900 animate-pulse">
                {unreadMessages > 9 ? '9+' : unreadMessages}
              </span>
            )}
          </div>
          <span className="text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
            Messages
          </span>
        </Link>

        <NotificationDropdown isSidebar={true} />

        {/* Dark Mode Toggle */}
        <button
          onClick={toggleDarkMode}
          className="w-full flex items-center gap-4 px-3 py-3 rounded-xl transition-all whitespace-nowrap hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none"
        >
          <div className="relative shrink-0 w-6 h-6 flex items-center justify-center">
            {darkMode ? <Sun className="w-6 h-6 shrink-0 transition-transform duration-200 group-hover:scale-110 text-amber-500" strokeWidth={2} /> : <Moon className="w-6 h-6 shrink-0 transition-transform duration-200 group-hover:scale-110 text-slate-600" strokeWidth={2} />}
          </div>
          <span className="text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-slate-700 dark:text-slate-200 truncate">
            {darkMode ? 'Light Mode' : 'Dark Mode'}
          </span>
        </button>

        {/* Profile Dropdown Container */}
        <div
          className="relative"
          ref={profileDropdownRef}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <button
            onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
            className="w-full flex items-center gap-4 px-3 py-3 rounded-xl transition-all whitespace-nowrap hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none"
          >
            <img
              src={user?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.fullName || 'User')}&background=FBC02D&color=111827&bold=true`}
              alt={user?.fullName}
              className="w-6 h-6 rounded-full object-cover border border-amber-400 shrink-0 transition-transform duration-200 group-hover:scale-110"
            />
            <span className="text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-slate-700 dark:text-slate-200 truncate">
              Profile
            </span>
          </button>

          {profileDropdownOpen && (
            <div
              className="absolute bottom-0 left-full pl-2 z-50 animate-in fade-in slide-in-from-left-2 duration-150"
              onClick={() => setProfileDropdownOpen(false)}
            >
              <div className="w-56 mb-2 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 py-2">
                <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800">
                  <p className="text-[11px] text-slate-400">Signed in as</p>
                  <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                    @{user?.username}
                  </p>
                  {user?.reputation && (
                    <span className="text-[10px] font-extrabold text-amber-600 dark:text-amber-400 mt-0.5 block">
                      <span className="flex items-center gap-1"><Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" /> {user.reputation} Reputation</span>
                    </span>
                  )}
                </div>

                <Link to="/profile" className="flex items-center gap-2.5 px-4 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-semibold">
                  <User className="w-4 h-4 text-slate-400" /> My Profile
                </Link>
                <Link to="/settings" className="flex items-center gap-2.5 px-4 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-semibold">
                  <Settings className="w-4 h-4 text-slate-400" /> Settings & Privacy
                </Link>
                <Link to="/about/ai" className="flex items-center gap-2.5 px-4 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-semibold">
                  <Sparkles className="w-4 h-4 text-amber-500" /> How We Use AI
                </Link>

                <div className="border-t border-slate-100 dark:border-slate-800 my-1"></div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 font-semibold text-left"
                >
                  <LogOut className="w-4 h-4" /> Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
