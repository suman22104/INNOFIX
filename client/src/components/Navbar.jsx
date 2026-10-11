import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import NotificationDropdown from './NotificationDropdown';
import GlobalSearchModal from './GlobalSearchModal';
import {
  Search,
  User,
  LogOut,
  Settings,
  Menu,
  X,
  Compass,
  Briefcase,
  Calendar,
  Users,
  LayoutDashboard,
  BarChart3,
  ShieldCheck,
  MessageSquare,
  Bookmark,
  Trophy,
  Sun,
  Moon,
  Sparkles,
  Lightbulb,
} from 'lucide-react';

export default function Navbar() {
  const { user, isAuthenticated, logout, darkMode, toggleDarkMode } = useAuth();
  const { unreadMessages } = useSocket();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);

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

  return (
    <>
      <nav className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Logo */}
            <div className="flex items-center gap-6 lg:gap-8">
              <Link to={isAuthenticated ? '/dashboard' : '/'} className="flex items-center gap-2.5 group">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-400 to-amber-300 text-slate-900 flex items-center justify-center font-bold text-lg shadow-md group-hover:scale-105 transition-transform">
                  <Lightbulb className="w-5 h-5" strokeWidth={2.5} />
                </div>
                <div className="flex flex-col">
                  <span className="font-black text-xl tracking-tight text-slate-900 dark:text-white leading-none">
                    INNO<span className="text-amber-500">FIX</span>{' '}
                    <span className="text-xs px-1.5 py-0.5 rounded-md bg-amber-400/20 text-amber-600 dark:text-amber-400 font-bold ml-0.5">
                      AI
                    </span>
                  </span>
                  <span className="text-[9px] uppercase font-bold tracking-widest text-slate-400">
                    Student Network
                  </span>
                </div>
              </Link>
            </div>

            {/* Middle Quick Search Bar Trigger */}
            <div className="hidden md:flex items-center flex-1 max-w-lg mx-4">
              <button
                onClick={() => setSearchModalOpen(true)}
                className="w-full flex items-center justify-between px-4 py-2 rounded-2xl bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200/70 dark:hover:bg-slate-800 text-slate-400 text-sm font-medium border border-transparent hover:border-slate-300 dark:hover:border-slate-700 transition-all"
              >
                <span className="flex items-center gap-2">
                  <Search className="w-4 h-4 text-amber-500" /> Search network...
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white dark:bg-slate-900 text-slate-500 border border-slate-200 dark:border-slate-700">
                  Ctrl+K
                </span>
              </button>
            </div>

            {/* Right Action Items */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Dark Mode Toggle */}
              <button
                onClick={toggleDarkMode}
                className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {darkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-600" />}
              </button>

              {/* Mobile Search Button */}
              <button
                onClick={() => setSearchModalOpen(true)}
                className="md:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Search"
              >
                <Search className="w-5 h-5" />
              </button>

              {isAuthenticated ? (
                <>
                  {/* Mobile Menu Toggle Button */}
                  <button
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    className="xl:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                  </button>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    to="/login"
                    className="px-3.5 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    className="px-4 py-1.5 text-xs font-bold text-slate-900 bg-amber-400 hover:bg-amber-300 rounded-xl shadow-sm transition-all"
                  >
                    Get Started
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Navigation Drawer */}
          {isAuthenticated && mobileMenuOpen && (
            <div className="xl:hidden border-t border-slate-200 dark:border-slate-800 py-3 space-y-1">
              {navLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <Icon className="w-4 h-4" />
                    {link.name}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </nav>

      {/* Global Omni-Search Modal */}
      <GlobalSearchModal
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
      />
    </>
  );
}
