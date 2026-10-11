import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import { GraduationCap, Building2, ArrowRight, AlertCircle, Lightbulb, Sun, Moon } from 'lucide-react';
import PasswordToggle from '../components/PasswordToggle';
import AuthShowcase from '../components/AuthShowcase';

const INPUT =
  'w-full h-12 px-4 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition-all';

export default function RegisterPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, darkMode, toggleDarkMode } = useAuth();
  const [role, setRole] = useState('student');
  const [justLogged, setJustLogged] = useState(false);

  const redirectPath = location.state?.from?.pathname
    ? location.state.from.pathname + (location.state.from.search || '')
    : '/dashboard';

  React.useEffect(() => {
    if (isAuthenticated && !justLogged) {
      navigate(redirectPath, { replace: true });
    }
  }, [isAuthenticated, justLogged, navigate, redirectPath]);
  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    email: '',
    password: '',
    companyName: '',
    companyWebsite: '',
    companyNeeds: '',
    industry: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await authAPI.register({
        ...formData,
        role,
      });

      if (res.data.success) {
        setJustLogged(true);
        login(res.data.token, res.data.user);
        navigate(redirectPath, { replace: true });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Could not create your account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const roleBtn = (value, Icon, title, sub) => (
    <button
      type="button"
      onClick={() => setRole(value)}
      className={`p-3.5 rounded-2xl border text-center transition-all flex flex-col items-center gap-1 ${
        role === value
          ? 'border-amber-400 dark:border-amber-500 bg-amber-50/80 dark:bg-amber-900/30 text-slate-900 dark:text-amber-50 shadow-sm ring-2 ring-amber-400/20 dark:ring-amber-500/20'
          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
      }`}
    >
      <Icon className={`w-6 h-6 ${role === value ? 'text-amber-600' : 'text-slate-400 dark:text-slate-500'}`} />
      <span className="text-xs font-bold">{title}</span>
      <span className="text-[10px] text-slate-500 dark:text-slate-400">{sub}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 p-3 lg:p-4 flex transition-colors">
      {/* Left: Grid Motion showcase (desktop only) */}
      <AuthShowcase
        className="hidden lg:block w-[46%] shrink-0 min-h-[calc(100vh-2rem)]"
        cta={{ to: '/login', label: 'Log In' }}
      />

      {/* Right: register form */}
      <div className="flex-1 flex flex-col min-w-0">
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

        <div className="flex-1 flex items-center justify-center px-4 sm:px-8 py-8">
          <div className="w-full max-w-sm">
            <div className="text-center mb-7">
              <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white font-display">
                Join INNOFIX
              </h1>
              <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                Join thousands of student innovators and technology teams.
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3.5 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 text-red-700 dark:text-red-300 rounded-xl text-xs sm:text-sm flex items-center gap-2 font-medium">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Role selector */}
            <div className="mb-5">
              <p className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wider">
                I am joining as a
              </p>
              <div className="grid grid-cols-2 gap-3">
                {roleBtn('student', GraduationCap, 'Student / Builder', 'Projects and events')}
                {roleBtn('company', Building2, 'Company / Org', 'Hire & Sponsor')}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <input
                type="text"
                required
                aria-label="Full name"
                autoComplete="name"
                placeholder="Full name"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className={INPUT}
              />

              <input
                type="text"
                required
                aria-label="Username"
                autoComplete="username"
                placeholder="Choose a username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase() })}
                className={INPUT}
              />

              <input
                type="email"
                required
                aria-label="Email address"
                autoComplete="email"
                placeholder="you@college.edu"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className={INPUT}
              />

              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={8}
                  aria-label="Password"
                  autoComplete="new-password"
                  placeholder="Password (at least 8 characters)"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className={`${INPUT} pr-11`}
                />
                <PasswordToggle show={showPassword} onToggle={() => setShowPassword((v) => !v)} />
              </div>

              {/* Company specific fields */}
              {role === 'company' && (
                <div className="space-y-3.5 pt-3.5 border-t border-slate-100 dark:border-slate-800">
                  <input
                    type="text"
                    required
                    aria-label="Company name"
                    placeholder="Company name"
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    className={INPUT}
                  />

                  <input
                    type="url"
                    aria-label="Company website"
                    placeholder="Company website (optional) https://…"
                    value={formData.companyWebsite}
                    onChange={(e) => setFormData({ ...formData, companyWebsite: e.target.value })}
                    className={INPUT}
                  />

                  <div>
                    <input
                      type="text"
                      aria-label="Company needs"
                      placeholder="Skills you need: React, Node.js, UI/UX"
                      value={formData.companyNeeds}
                      onChange={(e) => setFormData({ ...formData, companyNeeds: e.target.value })}
                      className={INPUT}
                    />
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1.5">
                      Comma separated skills to match students for your hiring & project needs
                    </p>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-amber-400 hover:bg-amber-300 text-slate-900 font-extrabold text-sm rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
              >
                {loading ? (
                  'Creating Account...'
                ) : (
                  <>
                    <span>Create Account</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <p className="mt-6 text-center text-xs text-slate-600 dark:text-slate-400">
              Already registered?{' '}
              <Link
                to="/login"
                className="font-bold text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 underline"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
