import { Zap, ShieldCheck } from 'lucide-react';
import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800 pt-12 pb-8 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-400 text-slate-900 flex items-center justify-center"><Zap className="w-5 h-5" /></div>
              <span className="font-extrabold text-xl text-white font-display">
                INNO<span className="text-amber-400">FIX</span>
              </span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              A place for students and developers to find teammates, share projects and learn together.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
              Explore
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/dashboard" className="hover:text-amber-400 transition-colors">
                  Feed & Suggested People
                </Link>
              </li>
              <li>
                <Link to="/messages" className="hover:text-amber-400 transition-colors">
                  Messages
                </Link>
              </li>
              <li>
                <Link to="/projects" className="hover:text-amber-400 transition-colors">
                  Projects & Teams
                </Link>
              </li>
              <li>
                <Link to="/leaderboard" className="hover:text-amber-400 transition-colors">
                  Leaderboard
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources & AI */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
              Trust & Safety
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/about/ai" className="hover:text-amber-400 transition-colors">
                  How We Use AI
                </Link>
              </li>
              <li>
                <Link to="/analytics" className="hover:text-amber-400 transition-colors">
                  Community Stats
                </Link>
              </li>
              <li>
                <a href="#faq" className="hover:text-amber-400 transition-colors">
                  FAQ & Guidelines
                </a>
              </li>
            </ul>
          </div>

          {/* Connect */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
              Platform
            </h4>
            <p className="text-sm text-slate-400 mb-3">
              Collaboration for student builders
            </p>
          </div>
        </div>

        <div className="border-t border-slate-800 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500">
          <p>© {new Date().getFullYear()} INNOFIX. All rights reserved.</p>
          <div className="flex items-center gap-4 mt-3 sm:mt-0">
            <span>Built by students, for students.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
