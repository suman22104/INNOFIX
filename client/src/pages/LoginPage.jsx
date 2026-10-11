import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { authAPI } from '../services/api';
import { adminAPI } from '../services/adminApi';
import { LogIn, Sparkles, ArrowRight, Lock, User, AlertCircle, ShieldCheck, Lightbulb } from 'lucide-react';
import PasswordToggle from '../components/PasswordToggle';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
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
  const { isAuthenticated } = useAuth();

  React.useEffect(() => {
    if (isAuthenticated && !justLogged) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, justLogged, navigate]);

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
        navigate(isAdmin ? '/admin' : '/dashboard');
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4 py-12 transition-colors">
      <div className="max-w-md w-full">
        {/* Logo & Welcome */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 group mb-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-400 text-slate-900 flex items-center justify-center font-bold text-2xl shadow-md group-hover:scale-105 transition-transform">
              <Lightbulb className="w-7 h-7" strokeWidth={2.5} />
            </div>
            <span className="font-extrabold text-3xl text-slate-900 dark:text-white font-display">
              INNO<span className="text-amber-500">FIX</span>
            </span>
          </Link>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white font-display">
            {isAdmin ? 'Admin Console' : 'Welcome back!'}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {isAdmin
              ? 'Restricted area. Authorised administrators only.'
              : 'Log in to continue building and discovering opportunities.'}
          </p>
        </div>

        {/* Form Container */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 border border-slate-200/80 dark:border-slate-700 shadow-xl shadow-slate-200/50 dark:shadow-none">
          {/* Access mode: regular user vs admin */}
          <div className="grid grid-cols-2 gap-1 p-1 mb-6 bg-slate-100 dark:bg-slate-900 rounded-xl">
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
            <div className="mb-5 p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-xs sm:text-sm flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                Username or Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  placeholder="Email or username"
                  value={formData.usernameOrEmail}
                  onChange={(e) =>
                    setFormData({ ...formData, usernameOrEmail: e.target.value })
                  }
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:bg-white dark:focus:bg-slate-800 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="w-full pl-10 pr-11 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:bg-white dark:focus:bg-slate-800 transition-all"
                />
                <PasswordToggle show={showPassword} onToggle={() => setShowPassword((v) => !v)} />
              </div>
            </div>

            {!isAdmin && (
              <label className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="mt-0.5 accent-amber-500"
                />
                <span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">Keep me signed in on this browser</span>
                  <span className="block text-slate-500 dark:text-slate-400">
                    Untick to sign in on this tab only, so other tabs can use different accounts.
                  </span>
                </span>
              </label>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-amber-400 hover:bg-amber-300 text-slate-900 font-extrabold text-sm rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
            >
              {loading ? (
                'Signing in...'
              ) : (
                <>
                  <span>{isAdmin ? 'Admin Sign In' : 'Sign In'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className={`mt-6 pt-5 border-t border-slate-100 dark:border-slate-700 text-center text-xs text-slate-600 dark:text-slate-400 ${isAdmin ? 'hidden' : ''}`}>
            Don't have an account yet?{' '}
            <Link
              to="/register"
              className="font-bold text-amber-600 hover:text-amber-700 underline"
            >
              Create an account
            </Link>
          </div>
        </div>

        {/* Demo Credentials Quick-Fill box */}
        <div className={`mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-2xl border border-amber-200/80 dark:border-amber-800/50 text-center text-xs text-amber-900 dark:text-amber-400 ${isAdmin ? 'hidden' : ''}`}>
          <span className="font-bold flex items-center gap-1"><Lightbulb className="w-4 h-4 text-amber-500" /> Demo Login:</span>{' '}
          <button
            onClick={() =>
              setFormData({ usernameOrEmail: 'alexm', password: 'password123' })
            }
            className="underline font-semibold hover:text-amber-700"
          >
            Auto-fill Student (alexm)
          </button>
          {' • '}
          <button
            onClick={() =>
              setFormData({ usernameOrEmail: 'techcorp', password: 'password123' })
            }
            className="underline font-semibold hover:text-amber-700"
          >
            Company (techcorp)
          </button>
        </div>
      </div>
    </div>
  );
}