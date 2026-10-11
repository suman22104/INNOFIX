import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { authAPI } from '../services/api';
import { adminAPI } from '../services/adminApi';
import { ArrowRight, AlertCircle, User, ShieldCheck, Lightbulb, Sun, Moon } from 'lucide-react';
import PasswordToggle from '../components/PasswordToggle';
import AuthShowcase from '../components/AuthShowcase';

const INPUT =
  'w-full h-12 px-4 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition-all';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, darkMode, toggleDarkMode } = useAuth();
  const toast = useToast();
  const [formData, setFormData] = useState({
    usernameOrEmail: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [remember, setRemember] = useState(true);
  const [justLogged, setJustLogged] = useState(false);

  const redirectPath = location.state?.from?.pathname
    ? location.state.from.pathname + (location.state.from.search || '')
    : '/dashboard';

  React.useEffect(() => {
    if (isAuthenticated && !justLogged) {
      navigate(redirectPath, { replace: true });
    }
  }, [isAuthenticated, justLogged, navigate, redirectPath]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = isAdmin ? await adminAPI.login(formData) : await authAPI.login(formData);
      if (res.data.success) {
        setJustLogged(true);
        login(res.data.token, res.data.user, isAdmin || !remember);
        toast.success(
          isAdmin
            ? 'Signed in to the Admin Console'
            : `Welcome back, ${res.data.user.fullName?.split(' ')[0] || res.data.user.username}!`,
          { description: isAdmin ? undefined : 'You are now logged in.' }
        );
        navigate(isAdmin ? '/admin' : redirectPath, { replace: true });
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Invalid username/email or password';
      setError(msg);
      toast.error('Login failed', { description: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 p-3 lg:p-4 flex transition-colors">
      {/* Left: Grid Motion showcase (desktop only) */}
      <AuthShowcase className="hidden lg:block w-[46%] shrink-0 min-h-[calc(100vh-2rem)]" />

      {/* Right: login form */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar: brand (mobile) + theme toggle */}
        <div className="flex items-center justify-between px-4 sm:px-8 lg:px-12 pt-3 lg:pt-6">
          <Link to="/" className="lg:invisible inline-flex items-center gap-2 group">
            <span className="grid size-9 place-items-center rounded-xl bg-amber-400 text-slate-900 shadow-sm group-hover:scale-105 transition-transform">
              <Lightbulb className="size-5" strokeWidth={2.5} />
            </span>
            <span className="font-display font-extrabold text-xl tracking-tight text-slate-900 dark:text-white">
              INNO<span className="text-amber-500">FIX</span>
            </span>
          </Link>

          <button
            type="button"
            onClick={toggleDarkMode}
            aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            title={darkMode ? 'Light mode' : 'Dark mode'}
            className="grid size-10 place-items-center rounded-full border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-amber-500 dark:hover:text-amber-400 hover:border-amber-300 dark:hover:border-amber-500/60 transition-colors"
          >
            {darkMode ? <Sun className="size-[18px]" /> : <Moon className="size-[18px]" />}
          </button>
        </div>

        {/* Form */}
        <div className="flex-1 flex items-center justify-center px-4 sm:px-8 py-8">
          <div className="w-full max-w-sm">
            <div className="text-center mb-7">
              <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white font-display">
                {isAdmin ? 'Admin Console' : 'Hi Builder'}
              </h1>
              <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                {isAdmin
                  ? 'Restricted area. Authorised administrators only.'
                  : 'Welcome back to INNOFIX. Log in to keep building.'}
              </p>
            </div>

            {/* Access mode: regular user vs admin */}
            <div className="grid grid-cols-2 gap-1 p-1 mb-5 bg-slate-100 dark:bg-slate-900 rounded-xl">
              {[
                { admin: false, label: 'User Login', Icon: User },
                { admin: true, label: 'Admin Login', Icon: ShieldCheck },
              ].map(({ admin, label, Icon }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => {
                    setIsAdmin(admin);
                    setError('');
                  }}
                  className={`py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                    isAdmin === admin
                      ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </button>
              ))}
            </div>

            {error && (
              <div className="mb-4 p-3.5 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 text-red-700 dark:text-red-300 rounded-xl text-xs sm:text-sm flex items-center gap-2 font-medium">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <input
                type="text"
                required
                aria-label="Username or email"
                autoComplete="username"
                placeholder="Email or username"
                value={formData.usernameOrEmail}
                onChange={(e) => setFormData({ ...formData, usernameOrEmail: e.target.value })}
                className={INPUT}
              />

              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  aria-label="Password"
                  autoComplete="current-password"
                  placeholder="Password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className={`${INPUT} pr-11`}
                />
                <PasswordToggle show={showPassword} onToggle={() => setShowPassword((v) => !v)} />
              </div>

              {!isAdmin && (
                <label className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300 cursor-pointer select-none pt-1">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="mt-0.5 accent-amber-500"
                  />
                  <span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      Keep me signed in on this browser
                    </span>
                    <span className="block text-slate-500 dark:text-slate-400">
                      Untick to sign in on this tab only, so other tabs can use different accounts.
                    </span>
                  </span>
                </label>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-amber-400 hover:bg-amber-300 text-slate-900 font-extrabold text-sm rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
              >
                {loading ? (
                  'Signing in...'
                ) : (
                  <>
                    <span>{isAdmin ? 'Admin Sign In' : 'Login'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <p
              className={`mt-6 text-center text-xs text-slate-600 dark:text-slate-400 ${isAdmin ? 'hidden' : ''}`}
            >
              Don't have an account?{' '}
              <Link
                to="/register"
                className="font-bold text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 underline"
              >
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
