import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { projectAPI } from '../services/api';
import ProjectCard from '../components/ProjectCard';
import CreateProjectModal from '../components/CreateProjectModal';
import { Search, Plus, Filter, Compass, Rocket, Globe, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function ProjectsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const { isAuthenticated, user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [showModal, setShowModal] = useState(false);

  const categories = [
    'all',
    'Web Development',
    'Mobile Apps',
    'AI & Machine Learning',
    'Blockchain & Web3',
    'IoT & Hardware',
    'Cloud & DevOps',
    'UI/UX Design',
    'Cybersecurity',
    'Data Science',
  ];

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const params = {};
      if (selectedCategory !== 'all') params.category = selectedCategory;
      if (selectedStatus !== 'all') params.status = selectedStatus;
      if (search.trim()) params.search = search.trim();

      const res = await projectAPI.getAll(params);
      if (res.data.success) {
        setProjects(res.data.projects);
      }
    } catch (err) {
      console.error('Error fetching projects:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchProjects();
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [search, selectedCategory, selectedStatus]);

  const handleCreated = (newProject) => {
    setProjects([newProject, ...projects]);
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
                placeholder="Search projects..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-400 transition-colors"
              />
            </div>
            
            {/* Category Dropdown (Hover) */}
            <div className="relative group shrink-0 w-full xl:w-40">
              <button className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-400 transition-colors capitalize flex items-center justify-between">
                <span className="truncate">{selectedCategory === 'all' ? 'All Categories' : selectedCategory}</span>
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
                      {cat === 'all' ? 'All Categories' : cat}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Status Dropdown (Hover) */}
            <div className="relative group shrink-0 w-full xl:w-36">
              <button className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-400 transition-colors flex items-center justify-between">
                <span className="truncate">{selectedStatus === 'all' ? 'All Statuses' : selectedStatus === 'Open' ? 'Open for Teammates' : selectedStatus}</span>
                <ChevronDown className="w-3.5 h-3.5 ml-2 opacity-50" />
              </button>
              <div className="absolute left-0 top-full mt-1 w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 overflow-hidden py-1">
                {[
                  { val: 'all', label: 'All Statuses' },
                  { val: 'Open', label: 'Open for Teammates' },
                  { val: 'In Progress', label: 'In Progress' },
                  { val: 'Completed', label: 'Completed' }
                ].map((status) => (
                  <button
                    key={status.val}
                    onClick={() => setSelectedStatus(status.val)}
                    className="w-full text-left px-3 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-amber-50 dark:hover:bg-slate-700 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
                  >
                    {status.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Launch Project Button */}
            {user?.role !== 'admin' && (
              <button
                onClick={() => {
                  if (!isAuthenticated) {
                    toast.info('Please sign in to launch a project');
                    navigate('/login', { state: { from: location } });
                    return;
                  }
                  setShowModal(true);
                }}
                className="w-full xl:w-auto shrink-0 px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-900 font-extrabold text-xs rounded-lg shadow-sm hover:shadow transition-all flex items-center justify-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3px]" />
                <span>Launch Project</span>
              </button>
            )}
          </div>
        </div>

        {/* Project Grid */}
        {loading ? (
          <div className="flex flex-col gap-4">
            {[1, 2, 3, 4].map((n) => (
              <div
                key={n}
                className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 animate-pulse flex flex-col sm:flex-row items-center gap-6"
              >
                <div className="w-16 h-16 bg-slate-200 dark:bg-slate-700 rounded-full shrink-0"></div>
                <div className="flex-1 w-full space-y-3">
                  <div className="w-1/3 h-5 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
                  <div className="w-2/3 h-4 bg-slate-100 dark:bg-slate-700 rounded"></div>
                  <div className="flex gap-2">
                    <div className="w-16 h-6 bg-slate-100 dark:bg-slate-700 rounded-lg"></div>
                    <div className="w-16 h-6 bg-slate-100 dark:bg-slate-700 rounded-lg"></div>
                  </div>
                </div>
                <div className="w-16 h-16 bg-slate-200 dark:bg-slate-700 rounded-full hidden sm:block shrink-0"></div>
              </div>
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-16 text-center border border-slate-200 dark:border-slate-700">
            <div className="flex justify-center mb-4"><Rocket className="w-12 h-12 text-slate-300 dark:text-slate-600" /></div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">No projects found</h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-sm mx-auto">
              We couldn't find any projects matching your search criteria. Try clearing filters or launch your own project!
            </p>
            {user?.role !== 'admin' && (
              <button
                onClick={() => {
                  if (!isAuthenticated) {
                    toast.info('Please sign in to launch a project');
                    navigate('/login', { state: { from: location } });
                    return;
                  }
                  setShowModal(true);
                }}
                className="mt-6 px-6 py-2.5 bg-amber-400 text-slate-900 font-bold rounded-2xl text-xs shadow hover:bg-amber-300"
              >
                Launch a Project
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {projects.map((project) => (
              <ProjectCard key={project._id} project={project} />
            ))}
          </div>
        )}
      </div>

      <CreateProjectModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onCreated={handleCreated}
      />
    </div>
  );
}
