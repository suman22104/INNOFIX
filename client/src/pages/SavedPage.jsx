import React, { useState, useEffect } from 'react';
import { Bookmark, Compass, Briefcase, Calendar, MessageSquare, Sparkles } from 'lucide-react';
import { userAPI } from '../services/api';
import ProjectCard from '../components/ProjectCard';
import OpportunityCard from '../components/OpportunityCard';
import EventCard from '../components/EventCard';
import PostCard from '../components/PostCard';

export default function SavedPage({ isEmbedded = false }) {
  const [activeTab, setActiveTab] = useState('all');
  const [bookmarks, setBookmarks] = useState({ posts: [], projects: [], opportunities: [], events: [] });
  const [loading, setLoading] = useState(true);

  const fetchBookmarks = async () => {
    setLoading(true);
    try {
      const res = await userAPI.getBookmarks();
      if (res.data?.success) {
        setBookmarks(res.data.bookmarks);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookmarks();
  }, []);

  const totalCount =
    (bookmarks.posts?.length || 0) +
    (bookmarks.projects?.length || 0) +
    (bookmarks.opportunities?.length || 0) +
    (bookmarks.events?.length || 0);

  return (
    <div className={isEmbedded ? "w-full space-y-6" : "w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6"}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Bookmark className="w-6 h-6 text-amber-500 fill-amber-500" /> Saved Items
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Your personalized repository of saved posts, projects, events, and opportunities.
          </p>
        </div>
        <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 w-fit">
          {totalCount} Bookmarks
        </span>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3 overflow-x-auto text-xs">
        {[
          { id: 'all', label: 'All Items', count: totalCount },
          { id: 'posts', label: 'Posts', count: bookmarks.posts?.length || 0 },
          { id: 'projects', label: 'Projects', count: bookmarks.projects?.length || 0 },
          { id: 'opportunities', label: 'Opportunities', count: bookmarks.opportunities?.length || 0 },
          { id: 'events', label: 'Events', count: bookmarks.events?.length || 0 },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-xl font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-amber-400 text-slate-900 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {tab.label}
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/10 dark:bg-white/10">
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-20 text-center text-xs text-slate-400">Loading saved items...</div>
      ) : totalCount === 0 ? (
        <div className="py-20 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8">
          <Bookmark className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
          <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">No saved items yet</h3>
          <p className="text-xs text-slate-400 mt-1">
            Click the bookmark icon on any post, project, or event to save it for later.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {(activeTab === 'all' || activeTab === 'posts') && bookmarks.posts?.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-emerald-500" /> Saved Posts
              </h2>
              {bookmarks.posts.map((post) => (
                <PostCard key={post._id} post={post} />
              ))}
            </div>
          )}

          {(activeTab === 'all' || activeTab === 'projects') && bookmarks.projects?.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-amber-500" /> Saved Projects
              </h2>
              <div className="flex flex-col gap-4">
                {bookmarks.projects.map((proj) => (
                  <ProjectCard key={proj._id} project={proj} />
                ))}
              </div>
            </div>
          )}

          {(activeTab === 'all' || activeTab === 'opportunities') && bookmarks.opportunities?.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Briefcase className="w-4 h-4 text-blue-500" /> Saved Opportunities
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {bookmarks.opportunities.map((opp) => (
                  <OpportunityCard key={opp._id} opportunity={opp} />
                ))}
              </div>
            </div>
          )}

          {(activeTab === 'all' || activeTab === 'events') && bookmarks.events?.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-purple-500" /> Saved Events
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {bookmarks.events.map((evt) => (
                  <EventCard key={evt._id} event={evt} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
