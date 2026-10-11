import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { postAPI } from '../services/api';
import { Heart, MessageCircle, Share2, Trash2, Send, Sparkles, Bookmark, ShieldCheck, Edit3, Check, X, Image, MoreHorizontal, MessageSquare, Lightbulb, Rocket, Calendar, Briefcase, Users } from 'lucide-react';
import { useToast } from '../context/ToastContext';

export default function PostCard({ post, onUpdate, onDelete }) {
  const toast = useToast();
  const { user, isAuthenticated, isBookmarked, toggleBookmark } = useAuth();
  const navigate = useNavigate();
  const [likesCount, setLikesCount] = useState(post.likes?.length || post.likesCount || 0);
  const [isLiked, setIsLiked] = useState(
    user ? post.likes?.some((id) => (id._id || id) === user._id || (id._id || id) === user.id) : false
  );
  const [bookmarked, setBookmarked] = useState(isBookmarked('post', post._id));
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState(post.comments || []);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content || '');
  const [showMenu, setShowMenu] = useState(false);

  const handleLike = async () => {
    if (!isAuthenticated) return toast.info('Please sign in to like posts');
    try {
      const res = await postAPI.like(post._id);
      if (res.data.success) {
        setIsLiked(res.data.liked);
        setLikesCount(res.data.likesCount);
      }
    } catch (err) {
      console.error('Error toggling like:', err);
    }
  };

  const handleBookmarkToggle = async () => {
    if (!isAuthenticated) return toast.info('Please sign in to save posts');
    const newState = await toggleBookmark('post', post._id);
    setBookmarked(newState);
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim() || !isAuthenticated) return;
    setSubmittingComment(true);
    try {
      const res = await postAPI.addComment(post._id, { content: commentText.trim() });
      if (res.data.success) {
        setComments(res.data.comments);
        setCommentText('');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not add your comment. Please try again.');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editContent.trim()) return;
    try {
      const res = await postAPI.update(post._id, { content: editContent });
      if (res.data.success) {
        setIsEditing(false);
        if (onUpdate) onUpdate(res.data.post);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not update the post. Please try again.');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    try {
      await postAPI.delete(post._id);
      if (onDelete) onDelete(post._id);
    } catch (err) {
      console.error('Error deleting post:', err);
    }
  };

  const getPostTypeBadge = (type) => {
    const badges = {
      idea: { label: <span className="flex items-center gap-1"><Lightbulb className="w-3.5 h-3.5"/> Idea</span>, class: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30' },
      project: { label: <span className="flex items-center gap-1"><Rocket className="w-3 h-3" /> Project</span>, class: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30' },
      event: { label: <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5"/> Event</span>, class: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30' },
      opportunity: { label: <span className="flex items-center gap-1"><Briefcase className="w-3.5 h-3.5"/> Opportunity</span>, class: 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30' },
      general: { label: <span className="flex items-center gap-1"><MessageSquare className="w-3.5 h-3.5"/> Discussion</span>, class: 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800' },
    };
    return badges[type] || badges.general;
  };

  const isAuthor =
    user &&
    (post.author?._id === user._id ||
      post.author?._id === user.id ||
      post.author === user._id ||
      user.role === 'admin');

  const badge = getPostTypeBadge(post.type);

  // Helper to render text with clickable #hashtags and @mentions
  const renderFormattedContent = (text) => {
    if (!text) return null;
    const parts = text.split(/(\s+)/);
    return parts.map((part, index) => {
      if (part.startsWith('#') && part.length > 1) {
        const tag = part.replace(/^#/, '').toLowerCase();
        return (
          <Link
            key={index}
            to={`/tags/${tag}`}
            className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline inline-block"
          >
            {part}
          </Link>
        );
      }
      if (part.startsWith('@') && part.length > 1) {
        const username = part.replace(/^@/, '').toLowerCase();
        return (
          <Link
            key={index}
            to={`/profile?username=${username}`}
            className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline inline-block"
          >
            {part}
          </Link>
        );
      }
      return part;
    });
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-all flex flex-col overflow-hidden">
      
      {/* AI Smart Attribution Hint if present */}
      {post.aiReason && (
        <div className="flex items-center gap-1.5 px-4 py-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>{post.aiReason}</span>
        </div>
      )}

      <div className="p-4 sm:p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-start gap-3">
            <Link to={`/profile?username=${post.author?.username}`}>
              <img
                src={
                  post.author?.avatarUrl ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(
                    post.author?.fullName || 'User'
                  )}&background=4F46E5&color=ffffff&bold=true`
                }
                alt={post.author?.fullName}
                className="w-12 h-12 rounded-full object-cover border border-slate-100 dark:border-slate-700 hover:brightness-95 transition-all"
              />
            </Link>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5 flex-wrap">
                <Link
                  to={`/profile?username=${post.author?.username}`}
                  className="font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                  {post.author?.fullName || 'Unknown User'}
                </Link>
                <span className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm">
                  @{post.author?.username}
                </span>
                <span className="text-slate-300 dark:text-slate-600 hidden sm:inline">•</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase ${badge.class} hidden sm:inline-block`}>
                  {badge.label}
                </span>
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1.5">
                <span>{post.author?.headline || post.author?.role || 'Member'}</span>
                <span>•</span>
                <span>
                  {new Date(post.createdAt).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
                {post.isEdited && <span className="italic opacity-75">(edited)</span>}
              </div>
            </div>
          </div>

          {/* Action Menu */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <MoreHorizontal className="w-5 h-5" />
            </button>
            
            {showMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)}></div>
                <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-100 dark:border-slate-700 py-1 z-20">
                  <button
                    onClick={() => {
                      handleBookmarkToggle();
                      setShowMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 flex items-center gap-2"
                  >
                    <Bookmark className={`w-4 h-4 ${bookmarked ? 'fill-slate-700 dark:fill-slate-300' : ''}`} />
                    {bookmarked ? 'Remove Bookmark' : 'Save Post'}
                  </button>
                  
                  {isAuthor && (
                    <>
                      <button
                        onClick={() => {
                          setIsEditing(true);
                          setShowMenu(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 flex items-center gap-2"
                      >
                        <Edit3 className="w-4 h-4" /> Edit Post
                      </button>
                      <div className="border-t border-slate-100 dark:border-slate-700 my-1"></div>
                      <button
                        onClick={() => {
                          handleDelete();
                          setShowMenu(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 flex items-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" /> Delete Post
                      </button>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Post Content or Edit Form */}
        {isEditing ? (
          <div className="space-y-3 mt-2 mb-4">
            <textarea
              rows={4}
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setIsEditing(false)}
                className="px-4 py-1.5 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-4 py-1.5 rounded-lg text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        ) : (
          <div className="text-slate-900 dark:text-slate-100 leading-relaxed text-sm sm:text-base whitespace-pre-wrap mt-1 mb-4">
            {renderFormattedContent(post.content)}
          </div>
        )}

        {/* Image Attachment */}
        {post.image && !isEditing && (
          <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 mb-4 bg-slate-50 dark:bg-slate-950/50 flex justify-center">
            <img
              src={post.image.startsWith('http') ? post.image : `/uploads/${post.image}`}
              alt="Post attachment"
              className="max-h-[500px] w-full object-contain"
            />
          </div>
        )}

        {/* Community tag */}
        {post.community && !isEditing && (
          <div className="mb-4">
            <Link
              to={`/communities/${post.community.slug || post.community._id}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              <span>{post.community.icon || <Users className="w-3.5 h-3.5 text-slate-400" />}</span>
              <span>{post.community.name}</span>
            </Link>
          </div>
        )}

        {/* Actions Row (Like, Comment, Share) */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1 sm:gap-4">
            <button
              onClick={handleLike}
              className={`flex items-center gap-2 px-2 sm:px-3 py-2 rounded-lg transition-colors font-semibold text-xs sm:text-sm ${
                isLiked
                  ? 'text-rose-600 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/40'
                  : 'hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <Heart className={`w-4.5 h-4.5 ${isLiked ? 'fill-rose-600' : ''}`} />
              <span>{likesCount}</span>
            </button>

            <button
              onClick={() => setShowComments(!showComments)}
              className="flex items-center gap-2 px-2 sm:px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-300 transition-colors font-semibold text-xs sm:text-sm"
            >
              <MessageCircle className="w-4.5 h-4.5" />
              <span>{comments.length}</span>
            </button>
          </div>

          <button
            onClick={() => {
              navigator.clipboard?.writeText(window.location.origin + `/dashboard?postId=${post._id}`);
              toast.success('Link copied!');
            }}
            className="flex items-center gap-2 px-2 sm:px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-300 transition-colors font-semibold text-xs sm:text-sm"
          >
            <Share2 className="w-4.5 h-4.5" />
            <span className="hidden sm:inline">Share</span>
          </button>
        </div>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 px-4 py-4 sm:px-5">
          {isAuthenticated ? (
            <form onSubmit={handleAddComment} className="flex gap-3 mb-5">
              <img
                src={
                  user?.avatarUrl ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(
                    user?.fullName || 'User'
                  )}&background=4F46E5&color=ffffff&bold=true`
                }
                alt="You"
                className="w-9 h-9 rounded-full object-cover border border-slate-200 dark:border-slate-700"
              />
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder="Add a comment..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-full pl-4 pr-12 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors shadow-sm"
                />
                <button
                  type="submit"
                  disabled={submittingComment || !commentText.trim()}
                  className="absolute right-1.5 top-1.5 bottom-1.5 px-2.5 bg-indigo-600 text-white rounded-full flex items-center justify-center hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          ) : (
            <p className="text-sm text-slate-500 mb-4 text-center">Sign in to leave a comment.</p>
          )}

          <div className="space-y-4 max-h-80 overflow-y-auto custom-scrollbar pr-1">
            {comments.map((comment, index) => (
              <div key={index} className="flex gap-3 group">
                <Link to={`/profile?username=${comment.user?.username}`} className="shrink-0">
                  <img
                    src={
                      comment.user?.avatarUrl ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(
                        comment.user?.fullName || 'User'
                      )}&background=4F46E5&color=ffffff&bold=true`
                    }
                    alt={comment.user?.fullName}
                    className="w-9 h-9 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                  />
                </Link>
                <div className="flex-1">
                  <div className="bg-white dark:bg-slate-800 rounded-2xl rounded-tl-none px-4 py-2.5 border border-slate-200/60 dark:border-slate-700/60 shadow-sm inline-block max-w-full">
                    <Link
                      to={`/profile?username=${comment.user?.username}`}
                      className="font-bold text-slate-900 dark:text-slate-100 hover:underline text-sm mr-2"
                    >
                      {comment.user?.fullName || 'User'}
                    </Link>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                      {comment.user?.headline || comment.user?.role || 'Member'}
                    </span>
                    <p className="text-slate-800 dark:text-slate-200 mt-0.5 text-sm whitespace-pre-wrap break-words">
                      {renderFormattedContent(comment.content)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 mt-1 ml-2 text-[11px] font-semibold text-slate-500">
                    <button className="hover:text-slate-700 dark:hover:text-slate-300">Like</button>
                    <span>•</span>
                    <span>{new Date(comment.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            ))}
            {comments.length === 0 && (
              <p className="text-center text-sm text-slate-500 py-4">No comments yet. Be the first!</p>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
