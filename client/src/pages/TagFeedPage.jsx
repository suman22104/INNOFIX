import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Hash, Sparkles, ArrowLeft } from 'lucide-react';
import { postAPI } from '../services/api';
import PostCard from '../components/PostCard';

export default function TagFeedPage() {
  const { tag } = useParams();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTagPosts = async () => {
      setLoading(true);
      try {
        const res = await postAPI.getAll({ tag });
        if (res.data?.success) {
          setPosts(res.data.posts || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchTagPosts();
  }, [tag]);

  return (
    <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <Link
        to="/dashboard"
        className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Feed
      </Link>

      <div className="p-6 bg-gradient-to-r from-amber-400/10 via-amber-300/5 to-transparent rounded-3xl border border-amber-500/20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-400 text-slate-900 flex items-center justify-center font-black text-xl shadow-md">
            <Hash className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 dark:text-slate-100">
              #{tag}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Trending discussions and project showcases tagged with #{tag}
            </p>
          </div>
        </div>
        <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-amber-400 text-slate-900">
          {posts.length} Posts
        </span>
      </div>

      {loading ? (
        <div className="py-20 text-center text-xs text-slate-400">Loading posts...</div>
      ) : posts.length === 0 ? (
        <div className="py-16 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8">
          <Hash className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
          <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">No posts for #{tag} yet</h3>
          <p className="text-xs text-slate-400 mt-1">Be the first to publish a post with this hashtag!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <PostCard key={post._id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}
