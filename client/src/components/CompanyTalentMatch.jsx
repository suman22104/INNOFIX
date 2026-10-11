import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Sparkles, 
  Briefcase, 
  UserPlus, 
  UserCheck, 
  MessageSquare, 
  ArrowRight, 
  Star, 
  Target,
  ChevronDown
} from 'lucide-react';
import { userAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import MatchBadge from './MatchBadge';

export default function CompanyTalentMatch({ className = '' }) {
  const { user: currentUser, updateUser } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [students, setStudents] = useState([]);
  const [companyNeeds, setCompanyNeeds] = useState([]);
  const [hasNeedsConfigured, setHasNeedsConfigured] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const [followingMap, setFollowingMap] = useState({});

  const fetchMatches = async () => {
    try {
      setLoading(true);
      const res = await userAPI.getMatchedStudents({ limit: 20 });
      if (res.data?.success) {
        setStudents(res.data.students || []);
        setCompanyNeeds(res.data.companyNeeds || []);
        setHasNeedsConfigured(!!res.data.hasNeedsConfigured);
      }
    } catch (err) {
      console.error('Error fetching student matches:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser?.role === 'company') {
      fetchMatches();
    }
  }, [currentUser?.role]);

  const handleFollow = async (studentId) => {
    try {
      const isCurrentlyFollowed = followingMap[studentId] ?? 
        currentUser?.following?.some((id) => String(id._id || id) === String(studentId));

      if (isCurrentlyFollowed) {
        setFollowingMap((prev) => ({ ...prev, [studentId]: false }));
        const res = await userAPI.unfollow(studentId);
        if (res.data?.user) updateUser(res.data.user);
      } else {
        setFollowingMap((prev) => ({ ...prev, [studentId]: true }));
        const res = await userAPI.follow(studentId);
        if (res.data?.user) updateUser(res.data.user);
      }
    } catch (err) {
      toast.error('Could not update connection. Please try again.');
    }
  };

  if (currentUser?.role !== 'company') return null;

  if (loading) {
    return (
      <div className={`bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm ${className}`}>
        <div className="flex items-center gap-2 mb-4 animate-pulse">
          <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/50"></div>
          <div className="h-4 w-48 bg-slate-100 dark:bg-slate-800 rounded"></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 animate-pulse space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-800"></div>
                  <div className="space-y-1">
                    <div className="h-3 w-24 bg-slate-200 dark:bg-slate-800 rounded"></div>
                    <div className="h-2 w-16 bg-slate-100 dark:bg-slate-800/60 rounded"></div>
                  </div>
                </div>
                <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-800"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // If company has configured needs, strictly only show students with matching skills
  const matchingStudents = hasNeedsConfigured
    ? students.filter((s) => (s.matchCount || 0) > 0)
    : students;

  const visibleStudents = showAll ? matchingStudents : matchingStudents.slice(0, 4);

  return (
    <div className={`bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden ${className}`}>
      
      {/* Top Banner / Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3.5 border-b border-slate-100 dark:border-slate-800/80">
        <div className="flex items-start gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 text-slate-950 flex items-center justify-center shrink-0 shadow-sm shadow-amber-500/20">
            <Sparkles className="w-4 h-4 fill-slate-950" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-white tracking-tight">
                Student Talent Matching Your Needs
              </h2>
              {hasNeedsConfigured && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
                  AI Matched
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              {hasNeedsConfigured 
                ? 'Student innovators possessing the technical skills your company is looking for.' 
                : 'Scout top student innovators on INNOFIX.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {matchingStudents.length > 4 && (
            <button
              onClick={() => setShowAll(!showAll)}
              className="text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-amber-500 dark:hover:text-amber-400 transition-colors flex items-center gap-1"
            >
              <span>{showAll ? 'Show 4' : `View All (${matchingStudents.length})`}</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showAll ? 'rotate-180' : ''}`} />
            </button>
          )}

          <Link
            to="/profile"
            className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-400 hover:text-amber-500 hover:underline"
          >
            <Target className="w-3.5 h-3.5" />
            <span>{hasNeedsConfigured ? 'Edit Company Needs' : 'Configure Needs'}</span>
          </Link>
        </div>
      </div>

      {/* Active Needs Pills */}
      {hasNeedsConfigured ? (
        <div className="mb-4 flex flex-wrap items-center gap-1.5 bg-amber-50/50 dark:bg-amber-950/20 p-2.5 rounded-2xl border border-amber-200/60 dark:border-amber-800/40">
          <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 dark:text-amber-300 flex items-center gap-1 mr-1">
            <Target className="w-3 h-3 text-amber-600" />
            Seeking:
          </span>
          {companyNeeds.map((need, idx) => (
            <span
              key={idx}
              className="text-[11px] font-bold px-2 py-0.5 rounded-xl bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-amber-200 dark:border-amber-900/60 shadow-2xs"
            >
              {need}
            </span>
          ))}
        </div>
      ) : (
        <div className="mb-4 p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-xl bg-amber-400/20 text-amber-600 flex items-center justify-center shrink-0">
              <Briefcase className="w-3.5 h-3.5" />
            </div>
            <p className="text-xs text-amber-900 dark:text-amber-200">
              <strong>Set your hiring needs:</strong> Add your Company Needs in your profile to automatically match student developers here.
            </p>
          </div>
          <Link
            to="/profile"
            className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-900 text-xs font-bold rounded-xl whitespace-nowrap shadow-sm text-center"
          >
            Add Needs Now
          </Link>
        </div>
      )}

      {/* Compact 4-Cards Grid */}
      {matchingStudents.length === 0 ? (
        <div className="py-6 text-center text-xs text-slate-400 dark:text-slate-500">
          {hasNeedsConfigured
            ? `No students currently match your company needs (${companyNeeds.join(', ')}). Update your needs or check back soon!`
            : 'No matching student accounts found yet. Add company needs to start matching!'}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {visibleStudents.map((student) => {
              const isFollowed = followingMap[student._id] ?? 
                (currentUser && currentUser.following?.some(id => String(id._id || id) === String(student._id)));
              const matchCount = student.matchingSkills?.length || 0;
              const percent = student.matchPercentage ?? 
                (companyNeeds.length > 0 ? Math.round((matchCount / companyNeeds.length) * 100) : 0);

              return (
                <div
                  key={student._id}
                  className="group relative p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 hover:bg-white dark:hover:bg-slate-900 hover:border-amber-400/70 dark:hover:border-amber-500/50 hover:shadow-md transition-all duration-200 flex flex-col justify-between"
                >
                  <div>
                    {/* Top Row: User info on Left, Circular Percentage Chart on Right */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <Link
                        to={`/profile?username=${student.username}`}
                        className="flex items-center gap-2.5 min-w-0 group-hover:opacity-95 transition-opacity"
                      >
                        <img
                          src={
                            student.avatarUrl ||
                            `https://ui-avatars.com/api/?name=${encodeURIComponent(student.fullName)}&background=FBC02D&color=111827&bold=true`
                          }
                          alt={student.fullName}
                          className="w-10 h-10 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shadow-2xs shrink-0"
                        />
                        <div className="min-w-0">
                          <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100 truncate group-hover:text-amber-500 transition-colors">
                            {student.fullName}
                          </h4>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate">
                            @{student.username}
                          </p>
                        </div>
                      </Link>

                      {/* Animated Circular Percentage Match Chart */}
                      <div className="shrink-0 flex items-center justify-center">
                        {hasNeedsConfigured && matchCount > 0 ? (
                          <MatchBadge
                            score={percent}
                            size="sm"
                            title={`${matchCount} of ${companyNeeds.length} company needs matched (${student.matchingSkills?.join(', ')})`}
                          />
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-xl text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                            <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                            <span>{student.reputation || 0}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="pt-2.5 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleFollow(student._id)}
                        className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all flex items-center gap-1 ${
                          isFollowed
                            ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                            : 'bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-2xs'
                        }`}
                      >
                        {isFollowed ? (
                          <>
                            <UserCheck className="w-3 h-3 text-emerald-600" />
                            <span>Connected</span>
                          </>
                        ) : (
                          <>
                            <UserPlus className="w-3 h-3" />
                            <span>Connect</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => navigate(`/messages?userId=${student._id}`)}
                        className="p-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-amber-500 transition-colors"
                        title="Direct Message"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-amber-500" />
                      </button>
                    </div>

                    <Link
                      to={`/profile?username=${student.username}`}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
                    >
                      <span>View Profile</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

          {/* View All Bottom Bar */}
          {matchingStudents.length > 4 && (
            <button
              onClick={() => setShowAll(!showAll)}
              className="w-full mt-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
            >
              <span>{showAll ? 'Show Top 4 Matches' : `View All ${matchingStudents.length} Matched Students`}</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showAll ? 'rotate-180' : ''}`} />
            </button>
          )}
        </>
      )}
    </div>
  );
}
