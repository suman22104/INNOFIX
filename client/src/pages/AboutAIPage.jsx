import React from 'react';
import { Sparkles, Shield, Cpu, Lock, CheckCircle, Scale, Eye, Users } from 'lucide-react';

export default function AboutAIPage() {
  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header Banner */}
      <div className="p-8 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-200 text-slate-950 rounded-3xl shadow-xl space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-950 text-white text-xs font-bold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" /> AI Usage
        </div>
        <h1 className="text-3xl font-black tracking-tight">
          How We Use AI
        </h1>
        <p className="text-xs sm:text-sm text-slate-800 max-w-2xl leading-relaxed">
          We want you to know when AI is involved and what it does. This page explains how suggestions, moderation and team matching work, and how your privacy is protected.
        </p>
      </div>

      {/* 4 Core Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-400/20 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
            <Eye className="w-5 h-5" />
          </div>
          <h2 className="font-extrabold text-base text-slate-900 dark:text-slate-100">
            1. Suggestions come with reasons
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Every suggestion comes with a short reason, like "Matches your skills: PyTorch & React" or "3 mutual connections". Suggestions are based on shared skills and connections, not hidden scoring.
          </p>
        </div>

        <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
            <Lock className="w-5 h-5" />
          </div>
          <h2 className="font-extrabold text-base text-slate-900 dark:text-slate-100">
            2. Your messages stay private
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Your direct messages, private project drafts and personal data are never used to train AI models. Messages are sent over a secure, signed-in connection.
          </p>
        </div>

        <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
            <Shield className="w-5 h-5" />
          </div>
          <h2 className="font-extrabold text-base text-slate-900 dark:text-slate-100">
            3. Flagged posts get human review
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Posts are checked for abuse and spam. Anything borderline goes to an admin for review, so genuine posts are not removed by mistake.
          </p>
        </div>

        <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <div className="w-10 h-10 rounded-2xl bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
            <Cpu className="w-5 h-5" />
          </div>
          <h2 className="font-extrabold text-base text-slate-900 dark:text-slate-100">
            4. Always available
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            AI features use Google Gemini for writing help and moderation. If the service is unavailable, simpler built-in checks take over so the site keeps working.
          </p>
        </div>
      </div>

      {/* Technical FAQ Table */}
      <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 uppercase tracking-wider">
          How our AI works
        </h3>
        <div className="overflow-x-auto text-xs">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400">
                <th className="py-2.5 font-bold">Module</th>
                <th className="py-2.5 font-bold">Algorithm / Strategy</th>
                <th className="py-2.5 font-bold">If AI is unavailable</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              <tr>
                <td className="py-2.5 font-semibold text-slate-900 dark:text-slate-100">People You May Know</td>
                <td className="py-2.5">Shared skills, mutual connections and reputation</td>
                <td className="py-2.5 text-emerald-600 dark:text-emerald-400 font-bold">Built-in rules</td>
              </tr>
              <tr>
                <td className="py-2.5 font-semibold text-slate-900 dark:text-slate-100">Content Moderation</td>
                <td className="py-2.5">AI check plus keyword and pattern filters</td>
                <td className="py-2.5 text-emerald-600 dark:text-emerald-400 font-bold">Keyword and pattern filters</td>
              </tr>
              <tr>
                <td className="py-2.5 font-semibold text-slate-900 dark:text-slate-100">AI Team Matcher</td>
                <td className="py-2.5">Skill matching and missing-skill detection</td>
                <td className="py-2.5 text-emerald-600 dark:text-emerald-400 font-bold">Skill keyword match</td>
              </tr>
              <tr>
                <td className="py-2.5 font-semibold text-slate-900 dark:text-slate-100">Smart Feed Ranking</td>
                <td className="py-2.5">Newer posts first, plus likes, comments and people you follow</td>
                <td className="py-2.5 text-emerald-600 dark:text-emerald-400 font-bold">Built-in rules</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
