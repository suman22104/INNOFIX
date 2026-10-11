import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { projectAPI, authAPI, postAPI, userAPI } from '../services/api';
import ProjectCard from '../components/ProjectCard';
import PostCard from '../components/PostCard';
import { User, MapPin, Globe, Github, Linkedin, Twitter, Sparkles, Edit3, Check, X, Plus, UserPlus, UserCheck, MessageSquare, Award, Trophy, Star } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { useToast } from '../context/ToastContext';

export default function ProfilePage() {
  const toast = useToast();
  const { user: currentUser, updateUser } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const targetUsername = searchParams.get('username');

  const [profileUser, setProfileUser] = useState(null);
  const [isMe, setIsMe] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [userProjects, setUserProjects] = useState([]);
  const [userPosts, setUserPosts] = useState([]);
  const [activeTab, setActiveTab] = useState('posts');
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const [followModal, setFollowModal] = useState(null); // 'followers' | 'following' | null
  const [followList, setFollowList] = useState([]);
  const [loadingFollowList, setLoadingFollowList] = useState(false);

  const [formData, setFormData] = useState({
    fullName: '',
    headline: '',
    bio: '',
    location: '',
    skills: '',
    github: '',
    linkedin: '',
    twitter: '',
    website: '',
  });

  const loadProfile = async () => {
    setLoading(true);
    try {
      const usernameOrId = targetUsername || currentUser?.username || currentUser?._id;
      if (!usernameOrId) return;

      const res = await userAPI.getProfile(usernameOrId);
      if (res.data?.success) {
        const u = res.data.user;
        setProfileUser(u);
        setUserPosts(res.data.posts || []);
        setUserProjects(res.data.projects || []);
        setFollowersCount(u.followers?.length || u.followersCount || 0);
        setFollowingCount(u.following?.length || u.followingCount || 0);

        const isCurrent = currentUser?._id === u._id || currentUser?.id === u._id;
        setIsMe(isCurrent);

        if (!isCurrent && currentUser) {
          const isFollow = currentUser.following?.some(
            (id) => String(id._id || id) === String(u._id)
          );
          setIsFollowing(!!isFollow);
        }

        if (isCurrent) {
          setFormData({
            fullName: u.fullName || '',
            headline: u.headline || '',
            bio: u.bio || '',
            location: u.location || '',
            skills: u.skills?.join(', ') || '',
            github: u.github || '',
            linkedin: u.linkedin || '',
            twitter: u.twitter || '',
            website: u.website || '',
          });
        }
      }
    } catch (err) {
      console.error('Error loading profile:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [targetUsername, currentUser?._id]);

  useEffect(() => {
    if (profileUser && currentUser && profileUser._id !== (currentUser._id || currentUser.id)) {
      const isFollow = currentUser.following?.some(
        (id) => String(id._id || id) === String(profileUser._id)
      );
      setIsFollowing(!!isFollow);
    }
  }, [currentUser, profileUser]);

  const handleFollowToggle = async () => {
    if (!profileUser || isMe) return;
    try {
      if (isFollowing) {
        const res = await userAPI.unfollow(profileUser._id);
        setIsFollowing(false);
        setFollowersCount((prev) => Math.max(0, prev - 1));
        if (res.data?.user) updateUser(res.data.user);
      } else {
        const res = await userAPI.follow(profileUser._id);
        setIsFollowing(true);
        setFollowersCount((prev) => prev + 1);
        if (res.data?.user) updateUser(res.data.user);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not update follow status. Please try again.');
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      const skillsArray = formData.skills
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const res = await authAPI.updateProfile({
        ...formData,
        skills: skillsArray,
      });

      if (res.data.success) {
        updateUser(res.data.user);
        setProfileUser(res.data.user);
        setEditing(false);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not save your profile. Please try again.');
    }
  };

  const handleOpenFollowModal = async (type) => {
    if (!profileUser) return;
    setFollowModal(type);
    setLoadingFollowList(true);
    setFollowList([]);
    try {
      let res;
      if (type === 'followers') {
        res = await userAPI.getFollowers(profileUser._id);
        setFollowList(res.data?.followers || []);
      } else {
        res = await userAPI.getFollowing(profileUser._id);
        setFollowList(res.data?.following || []);
      }
    } catch (err) {
      console.error('Error fetching follow list:', err);
    } finally {
      setLoadingFollowList(false);
    }
  };

  const handleModalFollowToggle = async (userId, currentlyFollowing, e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      if (currentlyFollowing) {
        const res = await userAPI.unfollow(userId);
        if (res.data?.user) updateUser(res.data.user);
        if (isMe && followModal === 'following') {
          setFollowingCount((prev) => Math.max(0, prev - 1));
        }
      } else {
        const res = await userAPI.follow(userId);
        if (res.data?.user) updateUser(res.data.user);
        if (isMe && followModal === 'following') {
          setFollowingCount((prev) => prev + 1);
        }
      }
    } catch (err) {
      console.error('Error toggling follow from modal:', err);
    }
  };

  if (loading) {
    return (
      <div className="py-16 text-center text-xs text-slate-400">
        Loading profile...
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="py-16 text-center">
        <p className="text-sm font-bold text-slate-700 dark:text-slate-300">User profile not found.</p>
      </div>
    );
  }

  return (
    <div className="py-8 transition-colors">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Profile Card Header */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm mb-8">
          
          {/* Cover Header */}
          <div className="h-36 sm:h-48 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 relative"></div>

          {/* User info banner */}
          <div className="px-6 sm:px-8 pb-8 pt-0 relative">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between -mt-16 sm:-mt-20 gap-4 mb-6">
              <div className="flex items-end gap-4">
                <img
                  src={
                    profileUser.avatarUrl ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(
                      profileUser.fullName || 'User'
                    )}&background=FBC02D&color=111827&bold=true`
                  }
                  alt={profileUser.fullName}
                  className="w-24 h-24 sm:w-32 sm:h-32 rounded-3xl object-cover border-4 border-white dark:border-slate-900 shadow-xl bg-white"
                />
                <div className="mb-2">
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100">
                      {profileUser.fullName}
                    </h1>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-300 border border-amber-300">
                      {profileUser.role}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                    @{profileUser.username}
                  </p>
                </div>
              </div>

              {/* Action Buttons: Follow / Message / Edit */}
              <div className="flex items-center gap-2.5">
                {isMe ? (
                  <button
                    onClick={() => setEditing(!editing)}
                    className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-2xl transition-colors flex items-center gap-2"
                  >
                    <Edit3 className="w-4 h-4" />
                    <span>{editing ? 'Cancel' : 'Edit Profile'}</span>
                  </button>
                ) : currentUser?.role !== 'admin' && (
                  <>
                    <button
                      onClick={handleFollowToggle}
                      className={`px-5 py-2.5 rounded-2xl font-bold text-xs transition-all flex items-center gap-1.5 shadow-sm ${
                        isFollowing
                          ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                          : 'bg-amber-400 hover:bg-amber-300 text-slate-900'
                      }`}
                    >
                      {isFollowing ? (
                        <>
                          <UserCheck className="w-4 h-4 text-emerald-600" /> Following
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-4 h-4" /> Follow
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => navigate(`/messages?userId=${profileUser._id}`)}
                      className="px-4 py-2.5 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white font-bold text-xs rounded-2xl transition-all flex items-center gap-1.5 shadow-sm"
                    >
                      <MessageSquare className="w-4 h-4 text-amber-400" />
                      <span>Message</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Editing Form or Info Display */}
            {editing && isMe ? (
              <form
                onSubmit={handleSaveProfile}
                className="p-6 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 text-xs mt-4"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Headline / Title
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Full-Stack Developer"
                      value={formData.headline}
                      onChange={(e) => setFormData({ ...formData, headline: e.target.value })}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Bio
                  </label>
                  <textarea
                    rows="3"
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 text-xs focus:outline-none focus:ring-2 focus:ring-amber-400"
                  ></textarea>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Location
                    </label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                  </div>
                  {profileUser?.role !== 'company' && (
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Skills (comma separated)
                      </label>
                      <input
                        type="text"
                        value={formData.skills}
                        onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-amber-400"
                      />
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditing(false)}
                    className="px-4 py-2 font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-200 rounded-xl text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-900 font-bold rounded-xl text-xs shadow-md"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                {profileUser.headline && (
                  <p className="text-base font-semibold text-slate-800 dark:text-slate-200">
                    {profileUser.headline}
                  </p>
                )}

                {profileUser.bio && (
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-w-3xl">
                    {profileUser.bio}
                  </p>
                )}

                {/* Badges Display */}
                {profileUser.badges?.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {profileUser.badges.map((b, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-800 text-xs font-bold shadow-sm"
                        title={b.description}
                      >
                        <span className="flex items-center text-amber-500">
                          {b.icon && LucideIcons[b.icon]
                            ? React.createElement(LucideIcons[b.icon], { className: 'w-3.5 h-3.5' })
                            : b.icon}
                        </span>
                        <span>{b.name}</span>
                      </span>
                    ))}
                  </div>
                )}

                {/* Skills */}
                {profileUser.role !== 'company' && profileUser.skills && profileUser.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {profileUser.skills.map((skill, i) => (
                      <span
                        key={i}
                        className="text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-3 py-1 rounded-xl border border-slate-200 dark:border-slate-700"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                )}

                {/* Social Graph Stats & Meta */}
                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400 pt-2">
                  {profileUser.role !== 'admin' && (
                    <>
                      <button 
                        onClick={() => {
                          if (currentUser?.role === 'admin') return;
                          handleOpenFollowModal('followers');
                        }}
                        className={`font-extrabold text-slate-900 dark:text-slate-100 focus:outline-none ${currentUser?.role === 'admin' ? 'cursor-default' : 'hover:underline cursor-pointer'}`}
                      >
                        <strong className="text-amber-600 dark:text-amber-400">{followersCount}</strong> Followers
                      </button>
                      <span>·</span>
                      <button 
                        onClick={() => {
                          if (currentUser?.role === 'admin') return;
                          handleOpenFollowModal('following');
                        }}
                        className={`font-extrabold text-slate-900 dark:text-slate-100 focus:outline-none ${currentUser?.role === 'admin' ? 'cursor-default' : 'hover:underline cursor-pointer'}`}
                      >
                        <strong className="text-amber-600 dark:text-amber-400">{followingCount}</strong> Following
                      </button>
                      <span>·</span>
                      <span className="font-extrabold text-amber-600 dark:text-amber-400">
                        <span className="flex items-center gap-1.5"><Star className="w-4 h-4 text-amber-500 fill-amber-500" /> {profileUser.reputation ?? 0} Reputation</span>
                      </span>
                    </>
                  )}

                  {profileUser.location && (
                    <>
                      {profileUser.role !== 'admin' && <span>·</span>}
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-amber-500" />
                        {profileUser.location}
                      </span>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-4 border-b border-slate-200 dark:border-slate-800 mb-6 text-xs">
          <button
            onClick={() => setActiveTab('posts')}
            className={`pb-3 font-bold border-b-2 transition-colors ${
              activeTab === 'posts'
                ? 'border-amber-400 text-slate-900 dark:text-slate-100'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Posts ({userPosts.length})
          </button>
          <button
            onClick={() => setActiveTab('projects')}
            className={`pb-3 font-bold border-b-2 transition-colors ${
              activeTab === 'projects'
                ? 'border-amber-400 text-slate-900 dark:text-slate-100'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Projects ({userProjects.length})
          </button>
        </div>

        {/* Content Stream */}
        {activeTab === 'posts' ? (
          userPosts.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-slate-200 dark:border-slate-800">
              <p className="text-xs text-slate-400">No posts shared yet.</p>
            </div>
          ) : (
            <div className="space-y-4 max-w-3xl">
              {userPosts.map((post) => (
                <PostCard
                  key={post._id}
                  post={post}
                  onDelete={(id) => setUserPosts(userPosts.filter((p) => p._id !== id))}
                />
              ))}
            </div>
          )
        ) : userProjects.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-slate-200 dark:border-slate-800">
            <p className="text-xs text-slate-400">No projects created yet.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {userProjects.map((p) => (
              <ProjectCard key={p._id} project={p} />
            ))}
          </div>
        )}
      </div>

      {/* Follow Modal */}
      {followModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800 shrink-0">
              <h3 className="text-lg font-black text-slate-900 dark:text-white capitalize">
                {followModal}
              </h3>
              <button onClick={() => setFollowModal(null)} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-y-auto p-3 custom-scrollbar flex-1">
              {loadingFollowList ? (
                <div className="py-12 flex justify-center items-center">
                  <div className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : followList.length === 0 ? (
                <div className="py-12 text-center text-sm font-semibold text-slate-400">
                  No {followModal} found.
                </div>
              ) : (
                <div className="space-y-1">
                  {followList.map((u) => {
                    const isFollowingUser = currentUser?.following?.some(
                      (id) => String(id._id || id) === String(u._id)
                    );
                    const isSelf = currentUser?._id === u._id || currentUser?.id === u._id;
                    
                    return (
                      <div
                        key={u._id}
                        className="flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group"
                      >
                        <Link
                          to={`/profile?username=${u.username}`}
                          onClick={() => setFollowModal(null)}
                          className="flex items-center gap-3 flex-1"
                        >
                          <img
                            src={u.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.fullName || 'User')}&background=FBC02D&color=111827&bold=true`}
                            alt={u.fullName}
                            className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-700 group-hover:border-amber-400 transition-colors"
                          />
                          <div>
                            <div className="font-bold text-sm text-slate-900 dark:text-slate-100 leading-tight group-hover:text-amber-500 transition-colors">
                              {u.fullName}
                            </div>
                            <div className="text-xs text-slate-500 font-medium">@{u.username}</div>
                          </div>
                        </Link>
                        
                        {!isSelf && (
                          <button
                            onClick={(e) => handleModalFollowToggle(u._id, isFollowingUser, e)}
                            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all shadow-sm ${
                              isFollowingUser
                                ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                                : 'bg-amber-400 text-slate-900 hover:bg-amber-300'
                            }`}
                          >
                            {isFollowingUser ? 'Following' : 'Follow'}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
