import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Trophy, Medal, Award, Flame, UserPlus, Check, Star, Info, ChevronDown, ChevronUp, History, Filter, GraduationCap, Building2 } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMedal } from '@fortawesome/free-solid-svg-icons';
import { userAPI } from '../services/api';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function LeaderboardPage() {
  const { user: currentUser, updateUser } = useAuth();
  const [leaders, setLeaders] = useState([]);
  const [roleFilter, setRoleFilter] = useState('student');
  const [periodFilter, setPeriodFilter] = useState('all'); // all, week, month
  const [loading, setLoading] = useState(true);
  const [followingMap, setFollowingMap] = useState({});
  const [myPosition, setMyPosition] = useState(null);
  const [scoringRules, setScoringRules] = useState([]);

  const [expandedRows, setExpandedRows] = useState(new Set());
  const [historyData, setHistoryData] = useState({});

  useEffect(() => {
    const fetchRules = async () => {
      try {
        const res = await userAPI.getReputationRules();
        if (res.data?.success) {
          setScoringRules(res.data.rules || []);
          setHistoryData(prev => ({ ...prev, levels: res.data.levels, badges: res.data.badges, notes: res.data.notes }));
        }
      } catch (err) {
        console.error("Failed to load scoring rules");
      }
    };
    fetchRules();
  }, []);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      try {
        const params = { period: periodFilter, limit: 30 };
        if (roleFilter !== 'all') params.role = roleFilter;
        
        const res = await userAPI.getLeaderboard(params);
        if (res.data?.success) {
          setLeaders(res.data.leaders || []);
        }

        if (currentUser) {
          const meRes = await userAPI.getMyLeaderboardPosition({ period: periodFilter });
          if (meRes.data?.success) setMyPosition(meRes.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, [roleFilter, periodFilter, currentUser]);

  const handleFollow = async (userId, e) => {
    e.stopPropagation();
    try {
      setFollowingMap((prev) => ({ ...prev, [userId]: true }));
      const res = await userAPI.follow(userId);
      if (res.data?.success) {
        updateUser(res.data.user);
      }
    } catch (err) {
      setFollowingMap((prev) => ({ ...prev, [userId]: false }));
    }
  };

  const toggleRow = async (userId) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(userId)) {
      newExpanded.delete(userId);
      setExpandedRows(newExpanded);
    } else {
      newExpanded.add(userId);
      setExpandedRows(newExpanded);
      if (!historyData[userId]) {
        fetchHistory(userId);
      }
    }
  };

  const fetchHistory = async (userId) => {
    setHistoryData(prev => ({ ...prev, [userId]: { loading: true, data: [] } }));
    try {
      const res = await API.get(`/users/${userId}/reputation`);
      if (res.data?.success) {
        setHistoryData(prev => ({ ...prev, [userId]: { loading: false, data: res.data.history } }));
      }
    } catch (error) {
      setHistoryData(prev => ({ ...prev, [userId]: { loading: false, data: [] } }));
    }
  };

  const getRankBadge = (rank) => {
    if (rank === 1) return <FontAwesomeIcon icon={faMedal} style={{ color: '#FFD700', fontSize: '24px' }} />;
    if (rank === 2) return <FontAwesomeIcon icon={faMedal} style={{ color: '#C0C0C0', fontSize: '20px' }} />;
    if (rank === 3) return <FontAwesomeIcon icon={faMedal} style={{ color: '#CD7F32', fontSize: '20px' }} />;
    return <span className="font-extrabold text-sm text-slate-400">#{rank}</span>;
  };

  const getScoreField = (leader) => {
    if (periodFilter === 'week') return leader.weeklyPoints || 0;
    if (periodFilter === 'month') return leader.monthlyPoints || 0;
    return leader.reputation || 0;
  };

  const top3 = leaders.slice(0, 3);
  const rest = leaders.slice(3);

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 pb-32">
      {/* Header Banner */}
      <div className="relative overflow-hidden p-6 sm:p-8 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-200 text-slate-950 rounded-3xl shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-950 text-white text-xs font-bold uppercase tracking-wider">
              <Trophy className="w-3.5 h-3.5 text-amber-400" /> Platform Leaderboard
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Top Innovators & Contributors
            </h1>
            <div className="flex items-start sm:items-center gap-2 group relative">
              <p className="text-xs sm:text-sm text-slate-800 font-medium">
                Track the most impactful community members.
              </p>
              
              {/* How Scoring Works Modal */}
              <button onClick={() => setExpandedRows(new Set(expandedRows.add('rules')))} className="inline-flex items-center gap-1 px-2 py-0.5 bg-white/40 rounded-full cursor-help hover:bg-white/60 transition-colors">
                <Info className="w-4 h-4 text-slate-700" />
                <span className="text-xs font-bold text-slate-800">Scoring Info</span>
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-2.5">
            {/* Period Tabs */}
            <div className="flex items-center bg-white/80 backdrop-blur-md p-1.5 rounded-2xl border border-white/50 w-full sm:w-80 text-xs self-end shadow-xs">
              {['all', 'month', 'week'].map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriodFilter(p)}
                  className={`flex-1 py-1.5 px-2 rounded-xl font-extrabold transition-all uppercase text-[11px] text-center ${
                    periodFilter === p
                      ? 'bg-amber-600 text-white shadow-md'
                      : 'text-slate-700 hover:text-slate-950 hover:bg-white/50'
                  }`}
                >
                  {p === 'all' ? 'All-Time' : p === 'week' ? 'This Week' : 'This Month'}
                </button>
              ))}
            </div>

            {/* Role Two-State Segmented Toggle Switch with Icons */}
            <div className="flex items-center bg-white/80 backdrop-blur-md p-1.5 rounded-2xl border border-white/50 w-full sm:w-80 text-xs self-end shadow-xs">
              <button
                onClick={() => setRoleFilter('student')}
                className={`flex-1 py-1.5 px-3 rounded-xl font-extrabold transition-all uppercase text-[11px] flex items-center justify-center gap-1.5 ${
                  roleFilter === 'student'
                    ? 'bg-slate-950 text-white shadow-md'
                    : 'text-slate-700 hover:text-slate-950 hover:bg-white/50'
                }`}
              >
                <GraduationCap className={`w-3.5 h-3.5 ${roleFilter === 'student' ? 'text-amber-400' : 'text-slate-500'}`} />
                <span>Students</span>
              </button>

              <button
                onClick={() => setRoleFilter('company')}
                className={`flex-1 py-1.5 px-3 rounded-xl font-extrabold transition-all uppercase text-[11px] flex items-center justify-center gap-1.5 ${
                  roleFilter === 'company'
                    ? 'bg-slate-950 text-white shadow-md'
                    : 'text-slate-700 hover:text-slate-950 hover:bg-white/50'
                }`}
              >
                <Building2 className={`w-3.5 h-3.5 ${roleFilter === 'company' ? 'text-amber-400' : 'text-slate-500'}`} />
                <span>Companies</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="py-24 text-center text-xs text-slate-400">Calculating reputation ranks...</div>
      ) : leaders.length === 0 ? (
        <div className="py-24 text-center text-xs text-slate-400">No users found.</div>
      ) : (
        <div className="space-y-8">
          {/* Rules Modal (Inline Expansion) */}
          {expandedRows.has('rules') && (
            <div className="bg-slate-900 text-white rounded-3xl p-6 relative">
              <button onClick={() => {
                const newExp = new Set(expandedRows);
                newExp.delete('rules');
                setExpandedRows(newExp);
              }} className="absolute top-4 right-4 text-slate-400 hover:text-white">✕</button>
              <h3 className="text-xl font-bold text-amber-400 mb-4">How Points Work</h3>
              <p className="text-sm text-slate-300 mb-4">
                Your score = sum of points from everything you do, minus penalties. Weekly and monthly boards count only points earned in that period.
              </p>
              <p className="text-xs text-rose-400 mb-4 font-bold">{historyData.notes}</p>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-bold text-slate-400 mb-2">Actions</h4>
                  <table className="w-full text-xs text-left text-slate-300">
                    <thead>
                      <tr className="border-b border-slate-700">
                        <th className="py-2">Action</th>
                        <th className="py-2">Points</th>
                        <th className="py-2">Limit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {scoringRules.map((r, i) => (
                        <tr key={i} className="border-b border-slate-800">
                          <td className="py-2">{r.label}</td>
                          <td className={`py-2 font-bold ${r.points > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{r.points > 0 ? '+' : ''}{r.points}</td>
                          <td className="py-2 text-slate-500">{r.oncePerUser ? 'Once' : r.dailyCap ? `${r.dailyCap}/day` : 'No limit'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div>
                  <h4 className="font-bold text-slate-400 mb-2">Levels & Badges</h4>
                  <div className="space-y-2 mb-4">
                    {historyData.levels?.map((l, i) => (
                      <div key={i} className="flex justify-between text-xs text-slate-300">
                        <span>Level {l.level}: {l.title}</span>
                        <span className="font-bold">{l.minPoints} pts</span>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-2">
                    {historyData.badges?.map((b, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-slate-300">
                        <span className="text-lg">{b.icon}</span>
                        <div>
                          <span className="font-bold block">{b.name}</span>
                          <span className="text-[10px] text-slate-500">{b.description}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* PODIUM (Top 3) */}
          {top3.length > 0 && (
            <div key={`podium-${periodFilter}-${roleFilter}`} className="max-w-3xl mx-auto pt-8">
              <div className="grid grid-cols-3 gap-3 sm:gap-4 items-end">
                {[
                  { 
                    data: top3[1], 
                    rank: 2, 
                    height: 'h-32', 
                    color: 'bg-slate-200 dark:bg-slate-700',
                    columnAnim: 'animate-podium-rise-2',
                    userAnim: 'animate-user-rise-2'
                  },
                  { 
                    data: top3[0], 
                    rank: 1, 
                    height: 'h-40', 
                    color: 'bg-amber-300 dark:bg-amber-500 shadow-[0_-4px_20px_rgba(251,191,36,0.25)]',
                    columnAnim: 'animate-podium-rise-1',
                    userAnim: 'animate-user-rise-1'
                  },
                  { 
                    data: top3[2], 
                    rank: 3, 
                    height: 'h-24', 
                    color: 'bg-orange-200 dark:bg-orange-800/60',
                    columnAnim: 'animate-podium-rise-3',
                    userAnim: 'animate-user-rise-3'
                  }
                ].map((podium) => podium.data && (
                  <div key={podium.data._id} className="flex flex-col items-center group relative">
                    {/* User Info Rising from the Baseline */}
                    <div className={`flex flex-col items-center mb-2 text-center w-full ${podium.userAnim}`}>
                      <div className="transform transition-transform duration-200 group-hover:-translate-y-2 flex flex-col items-center">
                        <div className="relative mb-2">
                          <img
                            src={podium.data.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(podium.data.fullName)}&background=111827&color=fff&bold=true`}
                            alt=""
                            className={`rounded-full object-cover border-4 shadow-xl ${podium.rank === 1 ? 'w-20 h-20 border-amber-400' : 'w-16 h-16 border-slate-300 dark:border-slate-600'}`}
                          />
                          <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-white dark:bg-slate-900 rounded-full shadow-md w-8 h-8 flex items-center justify-center">
                            {getRankBadge(podium.rank)}
                          </div>
                        </div>
                        <Link to={`/profile?username=${podium.data.username}`} className="font-black text-sm sm:text-base text-slate-900 dark:text-white truncate max-w-[100px] hover:underline">
                          {podium.data.fullName.split(' ')[0]}
                        </Link>
                        <div className="flex items-center gap-1 font-bold text-amber-600 dark:text-amber-400 text-xs">
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                          {getScoreField(podium.data)}
                        </div>
                      </div>
                    </div>
                    {/* Pedestal Column Rising from the Baseline */}
                    <div className={`w-full origin-bottom ${podium.height} ${podium.color} ${podium.columnAnim} rounded-t-2xl shadow-inner flex items-start justify-center pt-4 border border-black/5 dark:border-white/5`}>
                      <span className="text-xl font-black text-black/20 dark:text-white/20">{podium.rank}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* List of remaining leaders */}
          {rest.length > 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
              {rest.map((leader, index) => {
                const rank = index + 4;
                const isMe = currentUser?._id === leader._id;
                const isFollowing =
                  followingMap[leader._id] ||
                  currentUser?.following?.some((id) => String(id._id || id) === String(leader._id));
                const isExpanded = expandedRows.has(leader._id);

                return (
                  <div key={leader._id} className="flex flex-col">
                    <div
                      onClick={() => toggleRow(leader._id)}
                      className={`p-4 sm:p-5 flex items-center justify-between gap-4 transition-colors cursor-pointer group select-none ${
                        isMe
                          ? 'bg-amber-50/60 dark:bg-amber-950/20'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                      }`}
                    >
                      <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                        <div className="w-8 text-center shrink-0 font-extrabold text-sm text-slate-400">
                          #{rank}
                        </div>
                        <img
                          src={leader.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(leader.fullName)}&background=FBC02D&color=111827&bold=true`}
                          alt=""
                          className="w-11 h-11 rounded-full object-cover border-2 border-transparent group-hover:border-amber-400 transition-colors"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 truncate transition-colors">
                              {leader.fullName}
                            </span>
                            {isMe && (
                              <span className="px-1.5 py-0.2 rounded-md bg-amber-400/20 text-amber-700 dark:text-amber-300 font-extrabold text-[10px]">
                                YOU
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                            @{leader.username} · {leader.headline || leader.role}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 shrink-0">
                        <div className="text-right">
                          <div className="flex items-center gap-1 font-black text-sm sm:text-base text-amber-600 dark:text-amber-400 justify-end">
                            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                            {getScoreField(leader)}
                          </div>
                          <div className="flex items-center gap-1 text-[10px] text-slate-400 font-semibold justify-end">
                            Score
                            {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                          </div>
                        </div>

                        {!isMe && currentUser?.role === 'admin' ? (
                          <Link
                            to={`/profile?username=${leader.username}`}
                            onClick={(e) => e.stopPropagation()}
                            className="hidden sm:flex items-center gap-1 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 shadow-sm"
                          >
                            See Profile
                          </Link>
                        ) : !isMe && (
                          <button
                            onClick={(e) => handleFollow(leader._id, e)}
                            disabled={isFollowing}
                            className={`hidden sm:flex items-center gap-1 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                              isFollowing
                                ? 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                                : 'bg-amber-400 hover:bg-amber-300 text-slate-900 shadow-sm'
                            }`}
                          >
                            {isFollowing ? (
                              <><Check className="w-3.5 h-3.5 text-emerald-600" /> Following</>
                            ) : (
                              <><UserPlus className="w-3.5 h-3.5" /> Follow</>
                            )}
                          </button>
                        )}
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="px-4 sm:px-16 pb-5 pt-2 bg-slate-50 dark:bg-slate-800/20 border-t border-slate-100 dark:border-slate-800 shadow-inner">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-xs font-black text-slate-700 dark:text-slate-300 flex items-center gap-1.5 uppercase tracking-wider">
                            <History className="w-3.5 h-3.5" /> Recent Activity
                          </h4>
                          <Link to={`/profile?username=${leader.username}`} className="text-[10px] font-bold text-amber-600 hover:underline">
                            View Full Profile
                          </Link>
                        </div>
                        
                        {historyData[leader._id]?.loading ? (
                          <div className="text-xs text-slate-400 py-2 animate-pulse">Loading recent activity...</div>
                        ) : historyData[leader._id]?.data?.length > 0 ? (
                          <div className="space-y-2">
                            {historyData[leader._id].data.slice(0, 5).map(event => (
                              <div key={event._id} className="flex items-center gap-3 text-xs bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-800">
                                <span className="font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded-md min-w-[40px] text-center">
                                  +{event.points}
                                </span>
                                <span className="text-slate-600 dark:text-slate-300 flex-1 truncate">
                                  {event.reason}
                                </span>
                                <span className="text-[10px] text-slate-400 shrink-0">
                                  {new Date(event.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-xs text-slate-400 py-2">No recent reputation history available.</div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* STICKY "YOUR POSITION" BAR */}
      {currentUser && myPosition && !loading && (
        <div className="fixed bottom-0 left-0 right-0 z-40 p-4 xl:pl-[72px] pointer-events-none">
          <div className="max-w-3xl mx-auto">
            <div className="bg-slate-900 text-white rounded-2xl shadow-2xl p-4 flex items-center justify-between pointer-events-auto border border-slate-700/50 backdrop-blur-xl bg-slate-900/90">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center font-black text-slate-900 shadow-lg">
                  #{myPosition.rank}
                </div>
                <div>
                  <p className="text-sm font-bold">Your Position</p>
                  <p className="text-xs text-slate-400">
                    {periodFilter === 'all' ? 'All-Time' : periodFilter === 'week' ? 'This Week' : 'This Month'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 font-black text-amber-400 text-lg">
                <Star className="w-5 h-5 fill-amber-400" />
                {myPosition.score}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
