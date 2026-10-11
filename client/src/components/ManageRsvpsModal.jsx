import React, { useState } from 'react';
import { X, CheckCircle, XCircle, Users, Clock, ShieldCheck, UserCheck, AlertCircle, Calendar } from 'lucide-react';
import { eventAPI } from '../services/api';
import { useToast } from '../context/ToastContext';

export default function ManageRsvpsModal({ isOpen, onClose, event, onUpdate }) {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('pending');
  const [loadingId, setLoadingId] = useState(null);

  if (!isOpen || !event) return null;

  const attendees = event.attendees || [];
  
  // Pending requests
  const pendingAttendees = attendees.filter((a) => a.status === 'pending');
  // Confirmed attendees
  const acceptedAttendees = attendees.filter((a) => !a.status || a.status === 'accepted');
  // Declined attendees
  const declinedAttendees = attendees.filter((a) => a.status === 'declined');

  const handleDecision = async (userId, status) => {
    setLoadingId(userId);
    try {
      const res = await eventAPI.respondRsvp(event._id, userId, status);
      if (res.data.success) {
        toast.success(
          status === 'accepted'
            ? 'RSVP request accepted!'
            : 'RSVP request declined.'
        );
        if (onUpdate) onUpdate();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update RSVP status');
    } finally {
      setLoadingId(null);
    }
  };

  const getTargetUserId = (a) => {
    if (!a) return null;
    if (a.user?._id) return a.user._id;
    if (typeof a.user === 'string') return a.user;
    if (a._id) return a._id;
    return null;
  };

  const getDisplayName = (userObj) => {
    if (!userObj) return 'Anonymous User';
    return userObj.fullName || userObj.username || 'User';
  };

  const getUsername = (userObj) => {
    if (!userObj) return '';
    return userObj.username ? `@${userObj.username}` : '';
  };

  const getAvatar = (userObj) => {
    return userObj?.avatar || '';
  };

  const capacityRatio = event.maxAttendees
    ? Math.min(100, Math.round((acceptedAttendees.length / event.maxAttendees) * 100))
    : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto custom-scrollbar animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-700 relative my-8">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-6 top-6 p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-start gap-4 mb-6 pr-8">
          <div className="w-12 h-12 rounded-2xl bg-amber-400/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-300 dark:border-amber-700/50">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/40 px-2 py-0.5 rounded-md">
                Organizer Dashboard
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-1 line-clamp-1">
              Manage RSVPs
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
              {event.title}
            </p>
          </div>
        </div>

        {/* Capacity Bar */}
        <div className="mb-6 p-3.5 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
            <span className="text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-amber-500" /> Confirmed Attendees
            </span>
            <span className="text-slate-900 dark:text-white">
              {acceptedAttendees.length} / {event.maxAttendees || '∞'} Seats Filled
            </span>
          </div>
          {event.maxAttendees > 0 && (
            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${
                  capacityRatio >= 90
                    ? 'bg-rose-500'
                    : capacityRatio >= 70
                    ? 'bg-amber-500'
                    : 'bg-emerald-500'
                }`}
                style={{ width: `${capacityRatio}%` }}
              />
            </div>
          )}
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-700 mb-6 gap-2">
          <button
            onClick={() => setActiveTab('pending')}
            className={`pb-3 px-3 text-xs font-bold transition-all flex items-center gap-2 border-b-2 -mb-px ${
              activeTab === 'pending'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <span>Pending Requests</span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${
                pendingAttendees.length > 0
                  ? 'bg-amber-500 text-slate-900'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
              }`}
            >
              {pendingAttendees.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('accepted')}
            className={`pb-3 px-3 text-xs font-bold transition-all flex items-center gap-2 border-b-2 -mb-px ${
              activeTab === 'accepted'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <span>Confirmed ({acceptedAttendees.length})</span>
          </button>

          {declinedAttendees.length > 0 && (
            <button
              onClick={() => setActiveTab('declined')}
              className={`pb-3 px-3 text-xs font-bold transition-all flex items-center gap-2 border-b-2 -mb-px ${
                activeTab === 'declined'
                  ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <span>Declined ({declinedAttendees.length})</span>
            </button>
          )}
        </div>

        {/* Tab Content */}
        <div className="max-h-[360px] overflow-y-auto custom-scrollbar space-y-3 pr-1">
          {activeTab === 'pending' && (
            pendingAttendees.length === 0 ? (
              <div className="p-12 text-center">
                <Clock className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">
                  No Pending Requests
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto">
                  When other users hit "RSVP Now" on your event, their requests will appear here for you to accept or decline.
                </p>
              </div>
            ) : (
              pendingAttendees.map((a) => {
                const targetId = getTargetUserId(a);
                const userObj = a.user && typeof a.user === 'object' ? a.user : null;
                const name = getDisplayName(userObj);
                const username = getUsername(userObj);
                const avatar = getAvatar(userObj);
                const isProcessing = loadingId === targetId;

                return (
                  <div
                    key={a._id || targetId}
                    className="p-4 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-amber-400/60 transition-all"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {avatar ? (
                        <img
                          src={avatar}
                          alt={name}
                          className="w-10 h-10 rounded-full object-cover shrink-0 border border-slate-200 dark:border-slate-700"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-400 to-amber-200 text-slate-900 font-bold flex items-center justify-center text-sm shrink-0">
                          {name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-xs text-slate-900 dark:text-white truncate">
                            {name}
                          </span>
                          {username && (
                            <span className="text-[11px] text-slate-400 truncate">
                              {username}
                            </span>
                          )}
                        </div>
                        {userObj?.headline && (
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                            {userObj.headline}
                          </p>
                        )}
                        <span className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3 text-amber-500" />
                          Requested {a.registeredAt ? new Date(a.registeredAt).toLocaleDateString() : 'recently'}
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      <button
                        onClick={() => handleDecision(targetId, 'accepted')}
                        disabled={isProcessing}
                        className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Accept</span>
                      </button>
                      <button
                        onClick={() => handleDecision(targetId, 'declined')}
                        disabled={isProcessing}
                        className="px-3.5 py-1.5 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/40 active:scale-95 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border border-rose-200 dark:border-rose-900/50 disabled:opacity-50"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Decline</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )
          )}

          {activeTab === 'accepted' && (
            acceptedAttendees.length === 0 ? (
              <div className="p-12 text-center">
                <Users className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">
                  No Confirmed Attendees Yet
                </h4>
              </div>
            ) : (
              acceptedAttendees.map((a) => {
                const targetId = getTargetUserId(a);
                const userObj = a.user && typeof a.user === 'object' ? a.user : null;
                const name = getDisplayName(userObj);
                const username = getUsername(userObj);
                const avatar = getAvatar(userObj);

                return (
                  <div
                    key={a._id || targetId}
                    className="p-3.5 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {avatar ? (
                        <img
                          src={avatar}
                          alt={name}
                          className="w-9 h-9 rounded-full object-cover shrink-0 border border-slate-200 dark:border-slate-700"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold flex items-center justify-center text-xs shrink-0">
                          {name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-xs text-slate-900 dark:text-white truncate">
                            {name}
                          </span>
                          {username && (
                            <span className="text-[11px] text-slate-400 truncate">
                              {username}
                            </span>
                          )}
                        </div>
                        {userObj?.headline && (
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                            {userObj.headline}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> Confirmed
                      </span>
                    </div>
                  </div>
                );
              })
            )
          )}

          {activeTab === 'declined' && (
            declinedAttendees.map((a) => {
              const targetId = getTargetUserId(a);
              const userObj = a.user && typeof a.user === 'object' ? a.user : null;
              const name = getDisplayName(userObj);
              const username = getUsername(userObj);
              const avatar = getAvatar(userObj);

              return (
                <div
                  key={a._id || targetId}
                  className="p-3.5 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 opacity-75"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {avatar ? (
                      <img
                        src={avatar}
                        alt={name}
                        className="w-9 h-9 rounded-full object-cover shrink-0"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold flex items-center justify-center text-xs shrink-0">
                        {name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <span className="font-bold text-xs text-slate-900 dark:text-white truncate block">
                        {name}
                      </span>
                      {username && (
                        <span className="text-[11px] text-slate-400 truncate">
                          {username}
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => handleDecision(targetId, 'accepted')}
                    disabled={loadingId === targetId}
                    className="px-2.5 py-1 bg-slate-200 hover:bg-emerald-500 hover:text-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-[11px] font-semibold transition-all"
                  >
                    Re-Accept
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-700 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
