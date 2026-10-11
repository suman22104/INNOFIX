import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { communityAPI, postAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import PostCard from '../components/PostCard';
import CreatePostModal from '../components/CreatePostModal';
import { Users, Plus, ArrowLeft, ShieldCheck, Sparkles, Lightbulb, MessageSquare } from 'lucide-react';
import { useToast } from '../context/ToastContext';

export default function CommunityDetailsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const { idOrSlug } = useParams();
  const { user, isAuthenticated } = useAuth();
  const [community, setCommunity] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPostModal, setShowPostModal] = useState(false);

  const fetchCommunity = async () => {
    try {
      setLoading(true);
      const res = await communityAPI.getByIdOrSlug(idOrSlug);
      if (res.data.success) {
        setCommunity(res.data.community);
        setPosts(res.data.posts);
      }
    } catch (err) {
      console.error('Error loading community:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCommunity();
  }, [idOrSlug]);

  const handleJoinToggle = async () => {
    if (!isAuthenticated) {
      toast.info('Please sign in to join this community');
      navigate('/login', { state: { from: location } });
      return;
    }
    try {
      const isMember = community.members?.some(
        (m) =>
          (m.user?._id || m.user) === user._id || (m.user?._id || m.user) === user.id
      );
      if (isMember) {
        await communityAPI.leave(community._id);
      } else {
        await communityAPI.join(community._id);
      }
      fetchCommunity();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not update your membership. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4 transition-colors">
        <div className="w-8 h-8 border-4 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!community) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center p-4 text-center transition-colors">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Community Not Found</h2>
        <Link to="/communities" className="mt-4 px-4 py-2 bg-amber-400 font-bold rounded-xl text-xs">
          Back to Communities
        </Link>
      </div>
    );
  }

  const isMember = user
    ? community.members?.some(
        (m) =>
          (m.user?._id || m.user) === user._id || (m.user?._id || m.user) === user.id
      )
    : false;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-8 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link
          to="/communities"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Communities</span>
        </Link>

        {/* Community Header Banner */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-700 shadow-sm mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6 transition-colors">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-200 dark:border-amber-800/50 flex items-center justify-center text-4xl shrink-0">
              {community.icon || <Lightbulb className="w-8 h-8 text-amber-500" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/30 px-2.5 py-0.5 rounded-full border border-amber-200 dark:border-amber-800/50">
                  {community.category}
                </span>
                <span className="text-xs text-slate-400 dark:text-slate-500">
                  Created by @{community.creator?.username}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-display mt-1">
                {community.name}
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 max-w-2xl">
                {community.description}
              </p>
            </div>
          </div>

          {user?.role !== 'admin' && (
            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={handleJoinToggle}
                className={`px-6 py-2.5 rounded-2xl text-xs sm:text-sm font-bold shadow-sm transition-all ${
                  isMember
                    ? 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-700 dark:hover:text-red-400 border border-slate-200 dark:border-slate-600'
                    : 'bg-amber-400 hover:bg-amber-300 text-slate-900'
                }`}
              >
                {isMember ? 'Joined Member ✓' : '+ Join Community'}
              </button>
              <button
                onClick={() => setShowPostModal(true)}
                className="px-5 py-2.5 bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-sm transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Post</span>
              </button>
            </div>
          )}
        </div>

        {/* Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Discussion Feed (2 cols) */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white font-display">
              Community Feed ({posts.length})
            </h2>

            {posts.length === 0 ? (
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-12 text-center border border-slate-200 dark:border-slate-700 transition-colors">
                <div className="flex justify-center mb-2"><MessageSquare className="w-10 h-10 text-slate-300 dark:text-slate-600" /></div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  No discussions yet
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Start the first conversation in {community.name}!
                </p>
                <button
                  onClick={() => setShowPostModal(true)}
                  className="mt-4 px-4 py-2 bg-amber-400 text-slate-900 font-bold rounded-xl text-xs"
                >
                  Create Discussion
                </button>
              </div>
            ) : (
              posts.map((post) => (
                <PostCard
                  key={post._id}
                  post={post}
                  onUpdate={fetchCommunity}
                  onDelete={(id) => setPosts(posts.filter((p) => p._id !== id))}
                />
              ))
            )}
          </div>

          {/* Info & Members Sidebar (1 col) */}
          <div className="space-y-6">
            {/* Guidelines */}
            {community.rules && community.rules.length > 0 && (
              <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm space-y-3 transition-colors">
                <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-sm">
                  <ShieldCheck className="w-4 h-4 text-amber-500" />
                  <span>Community Guidelines</span>
                </div>
                <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
                  {community.rules.map((rule, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="font-bold text-amber-500">{idx + 1}.</span>
                      <span>{rule}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Members roster */}
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4 transition-colors">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Members ({community.members?.length || 0})
                </h3>
              </div>
              <div className="space-y-2.5 max-h-72 overflow-y-auto custom-scrollbar pr-1">
                {community.members?.map((m, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={
                          m.user?.avatarUrl ||
                          `https://ui-avatars.com/api/?name=${encodeURIComponent(
                            m.user?.fullName || 'User'
                          )}&background=FBC02D&color=111827&bold=true`
                        }
                        alt={m.user?.fullName}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white">
                          {m.user?.fullName}
                        </div>
                        <div className="text-[10px] text-slate-400 dark:text-slate-500 capitalize">
                          {m.role || 'Member'}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <CreatePostModal
        isOpen={showPostModal}
        onClose={() => setShowPostModal(false)}
        defaultCommunityId={community._id}
        onCreated={(newPost) => setPosts([newPost, ...posts])}
      />
    </div>
  );
}
