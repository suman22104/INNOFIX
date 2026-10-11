import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Calendar, Clock, MapPin, Users, CheckCircle, ExternalLink, Link, Globe, Trophy, Video, Wrench, Coffee, Gift } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { eventAPI } from '../services/api';
import { useToast } from '../context/ToastContext';

export default function EventCard({ event, onUpdate }) {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const { user, isAuthenticated } = useAuth();
  const [isRegistered, setIsRegistered] = useState(
    user
      ? event.attendees?.some(
          (a) => (a.user?._id || a.user) === user._id || (a.user?._id || a.user) === user.id
        )
      : false
  );
  const [attendeesCount, setAttendeesCount] = useState(event.attendees?.length || 0);
  const [loading, setLoading] = useState(false);

  const handleToggleRegister = async () => {
    if (!isAuthenticated) {
      toast.info('Please sign in to RSVP for events');
      navigate('/login', { state: { from: location } });
      return;
    }
    setLoading(true);
    try {
      const res = await eventAPI.register(event._id);
      if (res.data.success) {
        setIsRegistered(res.data.registered);
        setAttendeesCount(res.data.attendeesCount);
        if (onUpdate) onUpdate();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not update your RSVP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getEventTypeBadge = (type) => {
    const map = {
      hackathon: { label: <span className="flex items-center gap-1.5"><Trophy className="w-3.5 h-3.5" /> Hackathon</span>, bg: 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300' },
      webinar: { label: <span className="flex items-center gap-1.5"><Video className="w-3.5 h-3.5" /> Webinar</span>, bg: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300' },
      workshop: { label: <span className="flex items-center gap-1.5"><Wrench className="w-3.5 h-3.5" /> Workshop</span>, bg: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300' },
      meetup: { label: <span className="flex items-center gap-1.5"><Coffee className="w-3.5 h-3.5" /> Meetup</span>, bg: 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300' },
    };
    return map[type] || { label: type, bg: 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-300' };
  };

  const badge = getEventTypeBadge(event.type);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 flex flex-col justify-between hover:border-amber-400 hover:shadow-lg transition-all">
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${badge.bg}`}>
            {badge.label}
          </span>
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
            {event.locationType === 'online' ? (
              <><Globe strokeWidth={2} className="w-4 h-4 text-green-500" /> Online</>
            ) : (
              <><MapPin className="w-4 h-4 text-rose-500" /> In-Person</>
            )}
          </span>
        </div>

        <h3 className="font-bold text-lg text-slate-900 dark:text-white line-clamp-2">
          {event.title}
        </h3>

        <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 line-clamp-3 leading-relaxed">
          {event.shortDescription || event.description}
        </p>

        {event.prizes && (
          <div className="mt-3 p-2.5 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200/80 dark:border-amber-800/50 text-xs font-semibold text-amber-900 dark:text-amber-400 flex items-center gap-1.5">
            <Gift className="w-3.5 h-3.5 shrink-0" />
            <span>{event.prizes}</span>
          </div>
        )}

        {/* Schedule & Location */}
        <div className="mt-4 space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-amber-500 shrink-0" />
            <span>
              {new Date(event.startDate).toLocaleDateString(undefined, {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
              {event.time && ` • ${event.time}`}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {event.locationType === 'online' || (event.venueOrLink && event.venueOrLink.startsWith('http')) ? (
              <Link strokeWidth={2} className="w-4 h-4 text-amber-500 shrink-0" />
            ) : (
              <MapPin className="w-4 h-4 text-amber-500 shrink-0" />
            )}
            <span className="truncate">{event.venueOrLink}</span>
          </div>
        </div>
      </div>

      {/* Footer & RSVP */}
      <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-400">
          <Users className="w-4 h-4 text-slate-400 dark:text-slate-500" />
          <span>
            {attendeesCount} / {event.maxAttendees || '∞'} Attending
          </span>
        </div>

        {user?.role !== 'admin' && (
          <button
            onClick={handleToggleRegister}
            disabled={loading}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              isRegistered
                ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-400 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-700 dark:hover:text-red-400'
                : 'bg-amber-400 text-slate-900 hover:bg-amber-300 shadow-sm'
            }`}
          >
            {isRegistered ? (
              <>
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                <span>Registered</span>
              </>
            ) : (
              <span>RSVP Now</span>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
