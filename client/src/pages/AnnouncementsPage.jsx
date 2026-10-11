import React, { useState, useEffect } from 'react';
import { announcementAPI } from '../services/api';
import { Megaphone, Pin, Plus, X, Sparkles, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function AnnouncementsPage() {
  const toast = useToast();
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'General',
    priority: 'medium',
    targetRole: 'all',
    isPinned: false,
  });

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const res = await announcementAPI.getAll();
      if (res.data.success) {
        setAnnouncements(res.data.announcements);
      }
    } catch (err) {
      console.error('Error fetching announcements:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const res = await announcementAPI.create(formData);
      if (res.data.success) {
        setShowModal(false);
        setFormData({
          title: '',
          content: '',
          category: 'General',
          priority: 'medium',
          targetRole: 'all',
          isPinned: false,
        });
        fetchAnnouncements();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not post the announcement. Please try again.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure?')) return;
    try {
      await announcementAPI.delete(id);
      setAnnouncements(announcements.filter((a) => a._id !== id));
    } catch (err) {
      toast.error('Could not delete the announcement. Please try again.');
    }
  };

  const getPriorityBadge = (p) => {
    switch (p) {
      case 'urgent':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const canPost = user && (user.role === 'admin' || user.role === 'company');

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-1.5 bg-amber-100 rounded-lg text-amber-700">
                <Megaphone className="w-5 h-5" />
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 font-display">
                Announcements
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-500">
              Official platform updates, feature releases, and community highlights.
            </p>
          </div>

          {canPost && (
            <button
              onClick={() => setShowModal(true)}
              className="px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-900 font-extrabold text-xs sm:text-sm rounded-2xl shadow-sm flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Post Announcement</span>
            </button>
          )}
        </div>

        {/* List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2].map((n) => (
              <div
                key={n}
                className="bg-white rounded-3xl p-6 border border-slate-200 animate-pulse h-36"
              ></div>
            ))}
          </div>
        ) : announcements.length === 0 ? (
          <div className="bg-white rounded-3xl p-16 text-center border border-slate-200">
            <div className="flex justify-center mb-4"><Megaphone className="w-12 h-12 text-slate-300 dark:text-slate-600" /></div>
            <h3 className="text-xl font-bold text-slate-900">
              No announcements yet
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Check back soon for platform updates and release notes.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {announcements.map((a) => (
              <div
                key={a._id}
                className={`bg-white rounded-3xl p-6 sm:p-7 border transition-all ${
                  a.isPinned
                    ? 'border-amber-400 shadow-md ring-2 ring-amber-400/20'
                    : 'border-slate-200 shadow-sm'
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    {a.isPinned && (
                      <span className="inline-flex items-center gap-1 text-xs font-black bg-amber-400 text-slate-950 px-2.5 py-0.5 rounded-full shadow-xs">
                        <Pin className="w-3 h-3 fill-slate-950" /> Pinned
                      </span>
                    )}
                    <span
                      className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${getPriorityBadge(
                        a.priority
                      )}`}
                    >
                      {a.priority.toUpperCase()}
                    </span>
                    <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
                      {a.category}
                    </span>
                  </div>

                  {(user?.role === 'admin' || a.author?._id === user?._id) && (
                    <button
                      onClick={() => handleDelete(a._id)}
                      className="text-slate-400 hover:text-red-600 p-1 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <h2 className="text-xl font-bold text-slate-900 font-display">
                  {a.title}
                </h2>

                <p className="text-sm text-slate-700 mt-2 leading-relaxed whitespace-pre-wrap">
                  {a.content}
                </p>

                <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-700">
                      {a.author?.fullName || 'Platform Team'}
                    </span>
                    <span>•</span>
                    <span>{new Date(a.createdAt).toLocaleDateString()}</span>
                  </div>
                  <span className="capitalize font-semibold text-amber-700">
                    Audience: {a.targetRole}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Post Announcement Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 relative animate-in zoom-in-95">
            <button
              onClick={() => setShowModal(false)}
              className="absolute right-6 top-6 p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-xl font-bold text-slate-900 font-display mb-4">
              Publish Announcement
            </h2>

            <form onSubmit={handleCreate} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. INNOFIX Version 2.0 Live"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-400"
                  >
                    <option value="General">General</option>
                    <option value="Platform Update">Platform Update</option>
                    <option value="Feature Release">Feature Release</option>
                    <option value="Hackathon">Hackathon</option>
                    <option value="Event">Event</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Priority
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) =>
                      setFormData({ ...formData, priority: e.target.value })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-400"
                  >
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Content *
                </label>
                <textarea
                  rows="4"
                  required
                  placeholder="Write the full announcement message..."
                  value={formData.content}
                  onChange={(e) =>
                    setFormData({ ...formData, content: e.target.value })
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3.5 focus:outline-none focus:ring-2 focus:ring-amber-400"
                ></textarea>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="pinCheck"
                  checked={formData.isPinned}
                  onChange={(e) =>
                    setFormData({ ...formData, isPinned: e.target.checked })
                  }
                  className="w-4 h-4 text-amber-500 rounded focus:ring-amber-400"
                />
                <label
                  htmlFor="pinCheck"
                  className="text-xs font-bold text-slate-700 cursor-pointer"
                >
                  Pin this announcement to top of board
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-900 font-bold rounded-xl text-xs shadow-md"
                >
                  Publish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
