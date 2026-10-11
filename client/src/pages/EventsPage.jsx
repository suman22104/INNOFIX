import React, { useState, useEffect } from 'react';
import { eventAPI } from '../services/api';
import EventCard from '../components/EventCard';
import CreateEventModal from '../components/CreateEventModal';
import { Calendar, Plus, Search, Trophy, Video, Wrench, Coffee, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function EventsPage() {
  const toast = useToast();
  const { isAuthenticated, user } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [showModal, setShowModal] = useState(false);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const params = {};
      if (selectedType !== 'all') params.type = selectedType;
      if (search.trim()) params.search = search.trim();

      const res = await eventAPI.getAll(params);
      if (res.data.success) {
        setEvents(res.data.events);
      }
    } catch (err) {
      console.error('Error fetching events:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [search, selectedType]);

  const handleCreated = (newEvent) => {
    setEvents([newEvent, ...events]);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-8 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Filter & Search Bar (1-Row Layout) */}
        <div className="mb-8">
          <div className="flex flex-col xl:flex-row items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1 w-full">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search hackathons, webinars, workshops..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-400 transition-colors"
              />
            </div>
            
            {/* Format Dropdown (Hover) */}
            <div className="relative group shrink-0 w-full xl:w-40">
              <button className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-400 transition-colors capitalize flex items-center justify-between">
                <span className="truncate">{selectedType === 'all' ? 'All Formats' : selectedType}</span>
                <ChevronDown className="w-3.5 h-3.5 ml-2 opacity-50" />
              </button>
              <div className="absolute left-0 top-full mt-1 w-full xl:w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 overflow-hidden">
                <div className="max-h-60 overflow-y-auto custom-scrollbar py-1">
                  {[
                    { id: 'all', label: 'All Formats' },
                    { id: 'hackathon', label: 'Hackathons' },
                    { id: 'webinar', label: 'Webinars' },
                    { id: 'workshop', label: 'Workshops' },
                    { id: 'meetup', label: 'Meetups' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setSelectedType(t.id)}
                      className="w-full text-left px-3 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-amber-50 dark:hover:bg-slate-700 hover:text-amber-600 dark:hover:text-amber-400 capitalize transition-colors"
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Host Event Button */}
            {user?.role !== 'admin' && (
              <button
                onClick={() => {
                  if (!isAuthenticated) return toast.info('Please sign in to host an event');
                  setShowModal(true);
                }}
                className="w-full xl:w-auto shrink-0 px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-900 font-extrabold text-xs rounded-lg shadow-sm hover:shadow transition-all flex items-center justify-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3px]" />
                <span>Host an Event</span>
              </button>
            )}
          </div>
        </div>

        {/* Events Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 animate-pulse h-64 space-y-3"
              >
                <div className="w-20 h-5 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
                <div className="w-3/4 h-6 bg-slate-200 dark:bg-slate-700 rounded"></div>
                <div className="w-full h-16 bg-slate-100 dark:bg-slate-700 rounded"></div>
              </div>
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-16 text-center border border-slate-200 dark:border-slate-700">
            <div className="flex justify-center mb-4"><Calendar className="w-12 h-12 text-slate-300 dark:text-slate-600" /></div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">No events found</h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-sm mx-auto">
              Host a virtual hackathon, webinar, or developer meetup and invite the community!
            </p>
            {user?.role !== 'admin' && (
              <button
                onClick={() => setShowModal(true)}
                className="mt-6 px-6 py-2.5 bg-amber-400 text-slate-900 font-bold rounded-2xl text-xs shadow"
              >
                Host an Event
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <EventCard key={event._id} event={event} onUpdate={fetchEvents} />
            ))}
          </div>
        )}
      </div>

      <CreateEventModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onCreated={handleCreated}
      />
    </div>
  );
}
