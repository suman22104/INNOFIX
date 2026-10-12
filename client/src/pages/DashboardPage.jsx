import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { postAPI, analyticsAPI } from '../services/api';
import PostCard from '../components/PostCard';
import CreatePostModal from '../components/CreatePostModal';
import CreateProjectModal from '../components/CreateProjectModal';
import RecommendedForYou from '../components/RecommendedForYou';
import PeopleYouMayKnow from '../components/PeopleYouMayKnow';
import CompanyTalentMatch from '../components/CompanyTalentMatch';
import AIAssistantDrawer from '../components/AIAssistantDrawer';
import SearchResults from '../components/SearchResults';
import { Rocket, Calendar, Plus, Sparkles, Flame, UserCheck, Wand2, Image as ImageIcon, FileText, MessageSquare, TrendingUp, Bookmark, PenLine, Search, X } from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedTab, setFeedTab] = useState('foryou'); // 'foryou' | 'following' | 'trending' | 'idea' | 'project'
  const [showPostModal, setShowPostModal] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showAICopilot, setShowAICopilot] = useState(false);
  const [feedQuery, setFeedQuery] = useState('');
  const isSearching = feedQuery.trim().length > 0;
  const [stats, setStats] = useState({
    activeProjects: 0,
    upcomingEvents: 0,
    totalPosts: 0,
    totalCommunities: 0,
  });

  const fetchPosts = async () => {
    try {
      setLoading(true);
      let params = {};
      if (['foryou', 'following', 'trending'].includes(feedTab)) {
        params.tab = feedTab;
      } else {
        params.type = feedTab;
      }

      const res = await postAPI.getAll(params);
      if (res.data.success) {
        setPosts(res.data.posts || []);
      }
    } catch (err) {
      console.error('Error loading posts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [feedTab]);

  useEffect(() => {
    analyticsAPI
      .getStats()
      .then((res) => {
        if (res.data?.success && res.data.stats) {
          setStats(res.data.stats);
        }
      })
      .catch(() => { });
  }, []);

  const handlePostCreated = (newPost) => {
    setPosts([newPost, ...posts]);
  };

  const handlePostDeleted = (deletedId) => {
    setPosts(posts.filter((p) => p._id !== deletedId));
  };

  return (
    <div className="py-6 transition-colors">
      <div className="w-full px-4 sm:px-6 lg:px-8 max-w-[1200px] mx-auto">

        {/* Modern Layout with Fixed Right Sidebar */}
        <div className="flex justify-center items-start">

          {/* MAIN FEED COLUMN */}
          <div className="w-full max-w-[780px] space-y-5 flex-shrink xl:mr-[340px]">

            {/* Mobile-only Welcome */}
            <div className="lg:hidden flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Home</h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">Welcome back, {user?.fullName}</p>
              </div>
              <button onClick={() => setShowAICopilot(true)} className="p-2.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl border border-indigo-100 dark:border-indigo-800/50">
                <Wand2 className="w-5 h-5" />
              </button>
            </div>

            {/* LinkedIn-style Quick Share Box */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center gap-3">
                <Link to="/profile">
                  <img
                    src={
                      user?.avatarUrl ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(
                        user?.fullName || 'User'
                      )}&background=FBC02D&color=111827&bold=true`
                    }
                    alt={user?.fullName}
                    className="w-12 h-12 rounded-full object-cover border border-slate-200 dark:border-slate-700 hover:brightness-95 transition-all"
                  />
                </Link>
                <button
                  onClick={() => setShowPostModal(true)}
                  className="relative flex-1 rounded-full p-[2px] overflow-hidden group focus:outline-none shadow-sm"
                >
                  <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#facc15_0%,#000000_50%,#facc15_100%)] dark:bg-[conic-gradient(from_90deg_at_50%_50%,#facc15_0%,#ffffff_50%,#facc15_100%)] opacity-70 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="relative flex items-center gap-2 bg-white dark:bg-slate-900 group-hover:bg-slate-50 dark:group-hover:bg-slate-800 px-5 py-3.5 rounded-full w-full h-full text-sm text-slate-500 dark:text-slate-400 font-medium transition-colors">
                    <PenLine className="w-4 h-4 text-amber-500" /> Write a post...
                  </div>
                </button>
              </div>
            </div>

            {/* Feed search: people, events, opportunities, projects, communities, posts */}
            <div className="flex items-center gap-3 px-4 h-12 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm focus-within:border-amber-400 transition-colors">
              <Search className="w-4 h-4 text-amber-500 shrink-0" />
              <input
                value={feedQuery}
                onChange={(e) => setFeedQuery(e.target.value)}
                placeholder="Search people, events, opportunities, projects..."
                className="w-full bg-transparent text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none"
              />
              {feedQuery && (
                <button onClick={() => setFeedQuery('')} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200" title="Clear search">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {isSearching && <SearchResults query={feedQuery} />}

            {/* Smart Feed Tabs moved to Right Sidebar */}

            {/* Company Talent Matching Section for Company Accounts */}
            {!isSearching && user?.role === 'company' && feedTab === 'foryou' && (
              <CompanyTalentMatch />
            )}

            {/* Content-Based Recommender Section (Hidden for Company Users) */}
            {!isSearching && user?.role !== 'company' && feedTab === 'foryou' && <RecommendedForYou />}

            {/* Posts Stream */}
            <div className={`pb-10 ${isSearching ? 'hidden' : ''}`}>
              {loading ? (
                <div className="space-y-5">
                  {[1, 2, 3].map((n) => (
                    <div
                      key={n}
                      className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 animate-pulse space-y-4 shadow-sm"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 bg-slate-200 dark:bg-slate-800 rounded-full"></div>
                        <div className="space-y-2 flex-1">
                          <div className="w-32 h-3.5 bg-slate-200 dark:bg-slate-800 rounded-full"></div>
                          <div className="w-20 h-2.5 bg-slate-100 dark:bg-slate-800/50 rounded-full"></div>
                        </div>
                      </div>
                      <div className="space-y-2 pt-2">
                        <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full"></div>
                        <div className="w-[85%] h-3 bg-slate-100 dark:bg-slate-800 rounded-full"></div>
                        <div className="w-[60%] h-3 bg-slate-100 dark:bg-slate-800 rounded-full"></div>
                      </div>
                      <div className="w-full h-48 bg-slate-50 dark:bg-slate-800/50 rounded-xl mt-3"></div>
                    </div>
                  ))}
                </div>
              ) : posts.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 text-center border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center min-h-[300px]">
                  <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4 text-3xl">
                    💬
                  </div>
                  <h3 className="font-extrabold text-lg text-slate-900 dark:text-white mb-2">
                    {feedTab === 'following'
                      ? "You aren't following anyone yet"
                      : "It's quiet in here..."}
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-6 leading-relaxed">
                    {feedTab === 'following'
                      ? 'Discover amazing creators in the "People You May Know" section and build your personalized feed.'
                      : 'Be the first to break the silence. Share a thought, an idea, or showcase your latest project.'}
                  </p>
                  <button
                    onClick={() => setShowPostModal(true)}
                    className="px-6 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-900 font-bold rounded-xl shadow-sm transition-transform hover:scale-105"
                  >
                    Write a Post
                  </button>
                </div>
              ) : (
                <div className="space-y-5">
                  {posts.map((post) => (
                    <PostCard
                      key={post._id}
                      post={post}
                      onUpdate={fetchPosts}
                      onDelete={handlePostDeleted}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT SIDEBAR (Network & Explore) */}
          <aside className="hidden xl:block fixed right-0 top-16 h-[calc(100vh-4rem)] w-[360px] pt-6 pb-20 px-4 space-y-4 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] z-30 bg-transparent">
            {/* Feed Explorer Menu (Replaced Profile Card) */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
              <div className="text-xs font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3 px-3">
                Explore Feed
              </div>
              {[
                { id: 'foryou', label: 'For You', icon: Sparkles, color: 'text-amber-500', bgHover: 'hover:bg-amber-50 dark:hover:bg-amber-500/10' },
                { id: 'following', label: 'Following', icon: UserCheck, color: 'text-indigo-500', bgHover: 'hover:bg-indigo-50 dark:hover:bg-indigo-500/10' },
                { id: 'trending', label: 'Trending', icon: Flame, color: 'text-orange-500', bgHover: 'hover:bg-orange-50 dark:hover:bg-orange-500/10' },
                { id: 'idea', label: 'Ideas', icon: MessageSquare, color: 'text-emerald-500', bgHover: 'hover:bg-emerald-50 dark:hover:bg-emerald-500/10' },
                { id: 'project', label: 'Projects', icon: Rocket, color: 'text-blue-500', bgHover: 'hover:bg-blue-50 dark:hover:bg-blue-500/10' },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = feedTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setFeedTab(tab.id)}
                    className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-between group ${isActive
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white'
                      : `text-slate-600 dark:text-slate-400 ${tab.bgHover} hover:text-slate-900 dark:hover:text-white`
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-1.5 rounded-lg transition-colors ${isActive ? 'bg-white dark:bg-slate-700 shadow-sm' : 'bg-slate-100 dark:bg-slate-800/50 group-hover:bg-white dark:group-hover:bg-slate-700'}`}>
                        <Icon className={`w-4 h-4 ${isActive ? tab.color : 'text-slate-400 dark:text-slate-500 group-hover:' + tab.color}`} />
                      </div>
                      <span>{tab.label}</span>
                    </div>
                    {isActive && (
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-400"></div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Quick Actions */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
              <button
                onClick={() => setShowAICopilot(true)}
                className="w-full py-2.5 px-4 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white text-sm font-bold rounded-xl shadow-sm flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
              >
                <Wand2 className="w-4 h-4" />
                <span>Writing Helper</span>
              </button>
              {user?.role !== 'admin' && (
                <button
                  onClick={() => setShowProjectModal(true)}
                  className="w-full py-2.5 px-4 bg-amber-400 hover:bg-amber-500 text-slate-900 text-sm font-bold rounded-xl shadow-sm flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
                >
                  <Rocket className="w-4 h-4" />
                  <span>Launch Project</span>
                </button>
              )}
            </div>

            {/* Platform Stats / Trending */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-sm mb-4">
                <Flame className="w-4 h-4 text-orange-500" />
                <span>Trending Tags</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {['AI', 'React', 'Startups', 'MachineLearning', 'Design', 'Web3'].map((tag, i) => (
                  <Link
                    key={i}
                    to={`/tags/${tag.toLowerCase()}`}
                    className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-amber-100 dark:hover:bg-amber-900/40 border border-transparent dark:border-slate-700 hover:border-amber-200 dark:hover:border-amber-700/50 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 transition-colors"
                  >
                    #{tag}
                  </Link>
                ))}
              </div>
            </div>

            {/* People you may know */}
            <PeopleYouMayKnow limit={3} />

          </aside>
        </div>
      </div>

      {/* Modals & AI Drawer */}
      <CreatePostModal
        isOpen={showPostModal}
        onClose={() => setShowPostModal(false)}
        onCreated={handlePostCreated}
      />
      <CreateProjectModal
        isOpen={showProjectModal}
        onClose={() => setShowProjectModal(false)}
      />
      <AIAssistantDrawer
        isOpen={showAICopilot}
        onClose={() => setShowAICopilot(false)}
      />
    </div>
  );
}
