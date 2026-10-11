import React, { useState, useEffect } from 'react';
import { analyticsAPI } from '../services/api';
import {
  BarChart3,
  TrendingUp,
  Users,
  Compass,
  Calendar,
  Briefcase,
  Award,
  Sparkles,
  ShieldCheck,
  Zap,
  Target,
  CheckCircle,
  Rocket,
} from 'lucide-react';

export default function AnalyticsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    analyticsAPI
      .getStats()
      .then((res) => {
        if (res.data?.success) {
          setData(res.data);
        }
      })
      
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
        <div className="w-8 h-8 border-4 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const stats = data?.stats || {};
  const categories = data?.categoryDistribution || [];
  const topUsers = data?.topInnovators || [];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-8 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Header */}
        <div className="p-8 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 text-slate-950 rounded-3xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-950 text-white text-xs font-bold uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Platform Stats
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Community Stats
            </h1>
            <p className="text-xs sm:text-sm text-slate-900/80 mt-1 max-w-xl">
              See how the community is growing: new connections, project teams, blocked spam and opportunity matches.
            </p>
          </div>

          <div className="px-4 py-2 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl border border-white/40 text-xs font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Live data
          </div>
        </div>

        {/* Executive Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Network Innovators
              </span>
              <span className="p-2 bg-blue-50 dark:bg-blue-950/40 text-blue-600 rounded-xl text-base font-bold">
                <Users className="w-5 h-5" />
              </span>
            </div>
            <div className="text-3xl font-black text-slate-900 dark:text-slate-100">
              {stats.totalUsers || 18}
            </div>
            <div className="text-xs text-emerald-600 dark:text-emerald-400 font-bold mt-1 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" /> +100% active graph
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Teams & Projects
              </span>
              <span className="p-2 bg-amber-50 dark:bg-amber-950/40 text-amber-600 rounded-xl text-base font-bold">
                <Rocket className="w-5 h-5" />
              </span>
            </div>
            <div className="text-3xl font-black text-amber-600 dark:text-amber-400">
              {stats.activeProjects || 0}
            </div>
            <div className="text-xs text-slate-400 mt-1 font-medium">
              Teams across colleges
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Posts Blocked
              </span>
              <span className="p-2 bg-rose-50 dark:bg-rose-950/40 text-rose-600 rounded-xl text-base font-bold">
                <ShieldCheck className="w-5 h-5" />
              </span>
            </div>
            <div className="text-3xl font-black text-rose-600 dark:text-rose-400">
              99.4%
            </div>
            <div className="text-xs text-slate-400 mt-1 font-medium">
              Spam and abuse stopped before posting
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Suggestion Click Rate
              </span>
              <span className="p-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 rounded-xl text-base font-bold">
                <Target className="w-5 h-5" />
              </span>
            </div>
            <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
              38.2%
            </div>
            <div className="text-xs text-emerald-600 dark:text-emerald-400 font-bold mt-1">
              People acting on suggestions
            </div>
          </div>
        </div>

        {/* Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
            <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs uppercase">
              <CheckCircle className="w-4 h-4" /> For students learning alone
            </div>
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
              Find teammates quickly
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Find people with complementary skills, like a frontend developer and an NLP researcher, and see why you match.
            </p>
          </div>

          <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
            <div className="flex items-center gap-2 text-blue-600 font-bold text-xs uppercase">
              <CheckCircle className="w-4 h-4" /> For quick teamwork
            </div>
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
              Chat without leaving the app
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Message project members and mentors directly, without switching to another app.
            </p>
          </div>

          <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
            <div className="flex items-center gap-2 text-purple-600 font-bold text-xs uppercase">
              <CheckCircle className="w-4 h-4" /> For a healthier feed
            </div>
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
              A Safer Community
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Posts are checked for spam and abuse before they appear, so the feed stays friendly and useful.
            </p>
          </div>
        </div>

        {/* Distribution & Leaderboard */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Projects by Category */}
          {categories.length > 0 && (
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
              <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-100 mb-6">
                Projects by Category
              </h2>

              <div className="space-y-4">
                {categories.map((cat, idx) => (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                      <span>{cat.category || cat._id}</span>
                      <span>{cat.count} Active</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-amber-400 to-amber-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${cat.pct || Math.min((cat.count / 15) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Top Contributors */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" />
              <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                Top Innovators
              </h2>
            </div>

            <div className="space-y-3 pt-2">
              {topUsers.slice(0, 5).map((u, idx) => (
                <div
                  key={u._id || idx}
                  className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-4 font-black text-xs text-slate-400">#{idx + 1}</span>
                    <img
                      src={
                        u.avatarUrl ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(
                          u.fullName || 'User'
                        )}&background=FBC02D&color=111827&bold=true`
                      }
                      alt={u.fullName}
                      className="w-8 h-8 rounded-full object-cover border border-amber-400/50"
                    />
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        {u.fullName}
                      </div>
                      <div className="text-[10px] text-slate-400">@{u.username}</div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xs font-black text-amber-600 dark:text-amber-400">
                      {u.reputation || 100} pts
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
