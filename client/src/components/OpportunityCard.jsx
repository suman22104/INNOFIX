import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Briefcase, MapPin, DollarSign, ExternalLink, Check, Send, Users, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { opportunityAPI } from '../services/api';
import MatchBadge from './MatchBadge';
import { useToast } from '../context/ToastContext';

export default function OpportunityCard({ opportunity, onUpdate, match }) {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const { user, isAuthenticated } = useAuth();
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [note, setNote] = useState('');
  const [resumeUrl, setResumeUrl] = useState('');
  const [applied, setApplied] = useState(
    user
      ? opportunity.applicants?.some(
          (a) => (a.user?._id || a.user) === user._id || (a.user?._id || a.user) === user.id
        )
      : false
  );
  const [submitting, setSubmitting] = useState(false);

  const handleApply = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.info('Please sign in to apply');
      navigate('/login', { state: { from: location } });
      return;
    }
    setSubmitting(true);
    try {
      const res = await opportunityAPI.apply(opportunity._id, {
        resumeUrl,
        note,
      });
      if (res.data.success) {
        setApplied(true);
        setShowApplyModal(false);
        toast.success('Your application has been sent.');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not send your application. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const getTypeStyle = (type) => {
    switch (type) {
      case 'internship':
        return 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300';
      case 'full-time':
        return 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300';
      case 'freelance':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300';
      case 'grant':
        return 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300';
      default:
        return 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-300';
    }
  };

  const priorityLabel = match
    ? match.score >= 75
      ? 'HIGH PRIORITY'
      : match.score >= 45
      ? 'MODERATE PRIORITY'
      : 'STANDARD PRIORITY'
    : opportunity.type
    ? `${opportunity.type.toUpperCase()} PRIORITY`
    : 'MODERATE PRIORITY';

  return (
    <>
      <div className="relative bg-white dark:bg-slate-900/95 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-amber-400/60 p-5 sm:p-6 shadow-sm hover:shadow-xl hover:shadow-amber-400/5 transition-all duration-300 flex flex-col justify-between group overflow-hidden">
        {/* Subtle top glow highlight on hover */}
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

        <div>
          {/* Top Row: Type Pill, Workplace & Salary */}
          <div className="flex items-center justify-between gap-2 mb-3.5">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-amber-400/10 text-amber-600 dark:text-amber-400 border border-amber-400/25">
                {opportunity.type}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700/60">
                {opportunity.workplaceType}
              </span>
            </div>

            {opportunity.salaryOrStipend && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black tracking-tight bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/25 whitespace-nowrap">
                {opportunity.salaryOrStipend}
              </span>
            )}
          </div>

          {/* Company & Title Header */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400/20 to-amber-500/5 border border-amber-400/30 flex items-center justify-center font-black text-amber-500 dark:text-amber-400 text-xs shadow-inner shrink-0">
                {opportunity.companyName?.[0] || 'C'}
              </div>
              <div className="min-w-0">
                <span className="font-bold text-xs text-slate-700 dark:text-slate-300 truncate block">
                  {opportunity.companyName}
                </span>
                <span className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-amber-500 shrink-0" />
                  <span className="truncate">{opportunity.location}</span>
                </span>
              </div>
            </div>

            <h3 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white group-hover:text-amber-500 dark:group-hover:text-amber-400 transition-colors line-clamp-2 leading-snug pt-1">
              {opportunity.title}
            </h3>
          </div>

          {/* AI Match Pill if available */}
          {match && (
            <div className="mt-2.5 flex items-center gap-2">
              <div
                title={match.missing?.length ? `Missing: ${match.missing.join(', ')}` : 'You cover every listed skill'}
                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/25 shadow-2xs"
              >
                <Sparkles className="w-3 h-3 text-emerald-500" />
                <span>{match.score}% Match</span>
              </div>
              {match.missing?.length > 0 && (
                <span className="text-[10px] text-slate-400 dark:text-slate-500 truncate max-w-[150px]">
                  Gap: {match.missing.slice(0, 2).join(', ')}
                </span>
              )}
            </div>
          )}

          {/* Description */}
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-2.5 line-clamp-2 leading-relaxed">
            {opportunity.description}
          </p>

          {/* Skills Chips */}
          {opportunity.skills?.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 mt-3.5">
              {opportunity.skills.slice(0, 4).map((skill, i) => (
                <span
                  key={i}
                  className="text-[11px] font-medium bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 px-2.5 py-0.5 rounded-lg border border-slate-200 dark:border-slate-700/60"
                >
                  {skill}
                </span>
              ))}
              {opportunity.skills.length > 4 && (
                <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500">
                  +{opportunity.skills.length - 4}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Card Footer */}
        <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-medium">
            <Users className="w-3.5 h-3.5 text-slate-400" />
            <span>{opportunity.applicants?.length || 0} applicants</span>
          </div>

          <div className="shrink-0">
            {user?.role === 'admin' ? null : opportunity.applyUrlOrEmail?.startsWith('http') ? (
              <a
                href={opportunity.applyUrlOrEmail}
                target="_blank"
                rel="noreferrer"
                className="shrink-0 whitespace-nowrap px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-sm hover:scale-[1.02] active:scale-95"
              >
                <span>Apply External</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            ) : applied ? (
              <span className="shrink-0 whitespace-nowrap px-3.5 py-1.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-400 rounded-xl text-xs font-bold flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Applied
              </span>
            ) : (
              <button
                onClick={() => {
                  if (!isAuthenticated) {
                    toast.info('Please sign in to apply');
                    navigate('/login', { state: { from: location } });
                    return;
                  }
                  setShowApplyModal(true);
                }}
                className="shrink-0 whitespace-nowrap px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-sm hover:scale-[1.02] active:scale-95"
              >
                <span>Apply Now</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Quick Application Modal */}
      {showApplyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 dark:border-slate-700 animate-in fade-in zoom-in-95">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
              Apply for {opportunity.title}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">{opportunity.companyName}</p>

            <form onSubmit={handleApply} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Resume / Portfolio Link *
                </label>
                <input
                  type="url"
                  placeholder="https://github.com/yourprofile or Google Drive link"
                  required
                  value={resumeUrl}
                  onChange={(e) => setResumeUrl(e.target.value)}
                  className="w-full text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Why are you a great fit?
                </label>
                <textarea
                  rows="3"
                  placeholder="Tell the team about your skills and interests..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-400"
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowApplyModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-xs font-bold bg-amber-400 hover:bg-amber-300 text-slate-900 rounded-xl shadow-sm"
                >
                  {submitting ? 'Submitting...' : 'Send Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
