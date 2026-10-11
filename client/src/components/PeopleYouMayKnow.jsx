import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { UserPlus, Check, Sparkles, Zap } from 'lucide-react';
import { aiAPI, userAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function PeopleYouMayKnow({ limit = 4, className = '' }) {
  const { user: currentUser, updateUser } = useAuth();
  const [people, setPeople] = useState([]);
  const [loading, setLoading] = useState(true);
  const [followingMap, setFollowingMap] = useState({});

  useEffect(() => {
    const fetchPYMK = async () => {
      try {
        const res = await aiAPI.getPeopleYouMayKnow({ limit });
        if (res.data?.success) {
          setPeople(res.data.people || []);
        }
      } catch (err) {
        console.error('Error loading PYMK:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPYMK();
  }, [limit]);

  const handleFollow = async (userId) => {
    try {
      setFollowingMap((prev) => ({ ...prev, [userId]: true }));
      const res = await userAPI.follow(userId);
      if (res.data?.success && res.data.user) {
        updateUser(res.data.user);
      }
    } catch (err) {
      setFollowingMap((prev) => ({ ...prev, [userId]: false }));
    }
  };

  if (currentUser?.role === 'admin') return null;

  if (loading) {
    return (
      <div className={`p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm ${className}`}>
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-4 h-4 text-amber-500 animate-spin" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Finding collaborators...</span>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 animate-pulse">
              <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 shrink-0"></div>
              <div className="flex-1 space-y-1.5">
                <div className="h-3 w-28 bg-slate-100 dark:bg-slate-800 rounded"></div>
                <div className="h-2.5 w-36 bg-slate-100 dark:bg-slate-800 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (people.length === 0) return null;

  return (
    <div className={`p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm ${className}`}>
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-amber-400/20 text-amber-600 flex items-center justify-center shrink-0">
          <UserPlus className="w-5 h-5" strokeWidth={2.5} />
        </div>
        <div className="flex flex-col min-w-0">
          <h3 className="font-extrabold text-[15px] text-slate-900 dark:text-slate-100 leading-tight truncate">
            {currentUser?.role === 'company' ? 'Matching Student Talent' : 'People You May Know'}
          </h3>
          <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 truncate mt-0.5">
            {currentUser?.role === 'company' ? 'Matched by skills & tech' : 'Suggested for you'}
          </span>
        </div>
      </div>

      <div className="space-y-3.5">
        {people.map(({ user, score, reason }) => {
          const isFollowed = followingMap[user._id] || (currentUser && currentUser.following?.some(id => String(id._id || id) === String(user._id)));
          return (
            <div
              key={user._id}
              className="flex items-center justify-between gap-3 p-2 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
            >
              <Link
                to={`/profile?username=${user.username}`}
                className="flex items-center gap-3 min-w-0 group"
              >
                <img
                  src={
                    user.avatarUrl ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName)}&background=FBC02D&color=111827&bold=true`
                  }
                  alt={user.fullName}
                  className="w-10 h-10 rounded-full object-cover border border-amber-400/40 shrink-0 group-hover:scale-105 transition-transform"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors min-w-0">
                      {user.fullName}
                    </p>
                    {score && (
                      <span className="shrink-0 whitespace-nowrap text-[9px] font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded-md border border-emerald-500/20">
                        {score}% match
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                    {reason || user.headline || `@${user.username}`}
                  </p>
                </div>
              </Link>

              <button
                onClick={() => handleFollow(user._id)}
                disabled={isFollowed}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1 ${
                  isFollowed
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-500 cursor-default'
                    : 'bg-amber-400 hover:bg-amber-300 text-slate-900 shadow-sm'
                }`}
              >
                {isFollowed ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" /> Following
                  </>
                ) : (
                  <>
                    <UserPlus className="w-3.5 h-3.5" /> Follow
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
