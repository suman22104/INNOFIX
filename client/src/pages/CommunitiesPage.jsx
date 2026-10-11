import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { communityAPI } from '../services/api';
import CreateCommunityModal from '../components/CreateCommunityModal';
import { Users, Plus, Search, ArrowRight, Shield, Lightbulb, Globe, ChevronDown } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function CommunitiesPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const { user, isAuthenticated } = useAuth();
  const [communities, setCommunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showModal, setShowModal] = useState(false);

  const categories = [
    'all',
    'Web Development',
    'Artificial Intelligence',
    'Mobile Development',
    'Cloud Computing',
    'Cybersecurity',
    'Design & UI/UX',
    'Competitive Programming',
    'Entrepreneurship',
    'General Tech',
  ];

  const fetchCommunities = async () => {
    try {
      setLoading(true);
      const params = {};
      if (selectedCategory !== 'all') params.category = selectedCategory;
      if (search.trim()) params.search = search.trim();

      const res = await communityAPI.getAll(params);
      if (res.data.success) {
        setCommunities(res.data.communities);
      }
    } catch (err) {
      console.error('Error fetching communities:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCommunities();
  }, [search, selectedCategory]);

  const handleJoinToggle = async (communityId, isMember) => {
    if (!isAuthenticated) {
      toast.info('Please sign in to join communities');
      navigate('/login', { state: { from: location } });
      return;
    }
    try {
      if (isMember) {
        await communityAPI.leave(communityId);
      } else {
        await communityAPI.join(communityId);
      }
      fetchCommunities();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not update your membership. Please try again.');
    }
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
                placeholder="Search communities by name or topic..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-400 transition-colors"
              />
            </div>
            
            {/* Category Dropdown (Hover) */}
            <div className="relative group shrink-0 w-full xl:w-40">
              <button className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-400 transition-colors capitalize flex items-center justify-between">
                <span className="truncate">{selectedCategory === 'all' ? 'All Topics' : selectedCategory}</span>
                <ChevronDown className="w-3.5 h-3.5 ml-2 opacity-50" />
              </button>
              <div className="absolute left-0 top-full mt-1 w-full xl:w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 overflow-hidden">
                <div className="max-h-60 overflow-y-auto custom-scrollbar py-1">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className="w-full text-left px-3 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-amber-50 dark:hover:bg-slate-700 hover:text-amber-600 dark:hover:text-amber-400 capitalize transition-colors"
                    >
                      {cat === 'all' ? 'All Topics' : cat}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Create Community Button */}
            {['admin', 'company'].includes(user?.role) && (
              <button
                onClick={() => {
                  if (!isAuthenticated) {
                    toast.info('Please sign in to create a community');
                    navigate('/login', { state: { from: location } });
                    return;
                  }
                  setShowModal(true);
                }}
                className="w-full xl:w-auto shrink-0 px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-900 font-extrabold text-xs rounded-lg shadow-sm hover:shadow transition-all flex items-center justify-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3px]" />
                <span>Create Community</span>
              </button>
            )}
          </div>
        </div>

        {/* Communities Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div
                key={n}
                className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 animate-pulse h-56 space-y-3"
              >
                <div className="w-12 h-12 bg-slate-200 dark:bg-slate-700 rounded-xl"></div>
                <div className="w-3/4 h-5 bg-slate-200 dark:bg-slate-700 rounded"></div>
                <div className="w-full h-12 bg-slate-100 dark:bg-slate-700 rounded"></div>
              </div>
            ))}
          </div>
        ) : communities.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-16 text-center border border-slate-200 dark:border-slate-700">
            <div className="flex justify-center mb-4"><Users className="w-12 h-12 text-slate-300 dark:text-slate-600" /></div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">No communities found</h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-sm mx-auto">
              Start your own community and invite your classmates and fellow developers!
            </p>
            {user?.role !== 'admin' && (
              <button
                onClick={() => setShowModal(true)}
                className="mt-6 px-6 py-2.5 bg-amber-400 text-slate-900 font-bold rounded-2xl text-xs shadow"
              >
                Create Community
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {communities.map((comm) => {
              const isMember = user
                ? comm.members?.some(
                    (m) =>
                      (m.user?._id || m.user) === user._id ||
                      (m.user?._id || m.user) === user.id
                  )
                : false;

              return (
                <div
                  key={comm._id}
                  className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 flex flex-col justify-between hover:border-amber-400 hover:shadow-lg transition-all group"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 flex items-center justify-center group-hover:scale-110 transition-transform text-amber-500">
                        {comm.icon && LucideIcons[comm.icon] ? (
                          React.createElement(LucideIcons[comm.icon], { className: 'w-6 h-6' })
                        ) : (
                          <Lightbulb className="w-6 h-6" />
                        )}
                      </div>
                      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2.5 py-0.5 rounded-full">
                        {comm.category}
                      </span>
                    </div>

                    <Link to={`/communities/${comm.slug || comm._id}`}>
                      <h3 className="font-bold text-lg text-slate-900 dark:text-white group-hover:text-amber-600 transition-colors">
                        {comm.name}
                      </h3>
                    </Link>

                    <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 line-clamp-3 leading-relaxed">
                      {comm.description}
                    </p>

                    {comm.tags && comm.tags.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-1.5">
                        {comm.tags.slice(0, 3).map((tag, idx) => (
                          <span
                            key={idx}
                            className="text-[11px] font-medium bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 px-2 py-0.5 rounded-md"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
                      <Users className="w-4 h-4 text-amber-500" />
                      <span>{comm.members?.length || 0} Members</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {user?.role !== 'admin' && (
                        <button
                          onClick={() => handleJoinToggle(comm._id, isMember)}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                            isMember
                              ? 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-700 dark:hover:text-red-400'
                              : 'bg-amber-400 text-slate-900 hover:bg-amber-300 shadow-sm'
                          }`}
                        >
                          {isMember ? 'Joined ✓' : 'Join'}
                        </button>
                      )}
                      <Link
                        to={`/communities/${comm.slug || comm._id}`}
                        className="p-1.5 bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 rounded-lg"
                      >
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <CreateCommunityModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onCreated={() => fetchCommunities()}
      />
    </div>
  );
}
