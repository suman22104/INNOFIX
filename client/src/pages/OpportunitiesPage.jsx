import React, { useState, useEffect } from 'react';
import { opportunityAPI } from '../services/api';
import { aiAPI } from '../services/aiApi';
import OpportunityCard from '../components/OpportunityCard';
import CreateOpportunityModal from '../components/CreateOpportunityModal';
import { Briefcase, Plus, Search, GraduationCap, Zap, Gift, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function OpportunitiesPage() {
  const toast = useToast();
  const { user, isAuthenticated } = useAuth();
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedWorkplace, setSelectedWorkplace] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [matches, setMatches] = useState({});

  const fetchOpportunities = async () => {
    try {
      setLoading(true);
      const params = {};
      if (selectedType !== 'all') params.type = selectedType;
      if (selectedWorkplace !== 'all') params.workplaceType = selectedWorkplace;
      if (search.trim()) params.search = search.trim();

      const res = await opportunityAPI.getAll(params);
      if (res.data.success) {
        setOpportunities(res.data.opportunities);
      }
    } catch (err) {
      console.error('Error fetching opportunities:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOpportunities();
  }, [search, selectedType, selectedWorkplace]);

  useEffect(() => {
    if (!isAuthenticated) return;
    aiAPI
      .getOpportunityMatches()
      .then((res) => res.data.success && setMatches(res.data.matches || {}))
      .catch(() => {});
  }, [isAuthenticated]);

  const handleCreated = (newOpp) => {
    setOpportunities([newOpp, ...opportunities]);
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
                placeholder="Search by role, company, skills, or location..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-400 transition-colors"
              />
            </div>
            
            {/* Format Dropdown (Hover) */}
            <div className="relative group shrink-0 w-full xl:w-40">
              <button className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-400 transition-colors capitalize flex items-center justify-between">
                <span className="truncate">{selectedWorkplace === 'all' ? 'All Formats' : selectedWorkplace === 'Remote' ? 'Remote Only' : selectedWorkplace}</span>
                <ChevronDown className="w-3.5 h-3.5 ml-2 opacity-50" />
              </button>
              <div className="absolute left-0 top-full mt-1 w-full xl:w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 overflow-hidden py-1">
                {[
                  { val: 'all', label: 'All Formats' },
                  { val: 'Remote', label: 'Remote Only' },
                  { val: 'On-site', label: 'On-site' },
                  { val: 'Hybrid', label: 'Hybrid' }
                ].map((format) => (
                  <button
                    key={format.val}
                    onClick={() => setSelectedWorkplace(format.val)}
                    className="w-full text-left px-3 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-amber-50 dark:hover:bg-slate-700 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
                  >
                    {format.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Role Dropdown (Hover) */}
            <div className="relative group shrink-0 w-full xl:w-40">
              <button className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-400 transition-colors capitalize flex items-center justify-between">
                <span className="truncate">{selectedType === 'all' ? 'All Roles' : selectedType}</span>
                <ChevronDown className="w-3.5 h-3.5 ml-2 opacity-50" />
              </button>
              <div className="absolute left-0 top-full mt-1 w-full xl:w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 overflow-hidden py-1">
                {[
                  { id: 'all', label: 'All Roles' },
                  { id: 'internship', label: 'Internships' },
                  { id: 'full-time', label: 'Full-Time' },
                  { id: 'freelance', label: 'Freelance' },
                  { id: 'grant', label: 'Grants' },
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

            {/* Post Opportunity Button */}
            {['admin', 'company'].includes(user?.role) && (
              <button
                onClick={() => {
                  if (!isAuthenticated) return toast.info('Please sign in to post an opportunity');
                  setShowModal(true);
                }}
                className="w-full xl:w-auto shrink-0 px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-900 font-extrabold text-xs rounded-lg shadow-sm hover:shadow transition-all flex items-center justify-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3px]" />
                <span>Post Opportunity</span>
              </button>
            )}
          </div>
        </div>

        {/* Opportunity Grid */}
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
        ) : opportunities.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-16 text-center border border-slate-200 dark:border-slate-700">
            <div className="flex justify-center mb-4"><Briefcase className="w-12 h-12 text-slate-300 dark:text-slate-600" /></div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              No opportunities found
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-sm mx-auto">
              Are you hiring? Post your company's internship or contract position right now!
            </p>
            {user?.role !== 'admin' && (
              <button
                onClick={() => setShowModal(true)}
                className="mt-6 px-6 py-2.5 bg-amber-400 text-slate-900 font-bold rounded-2xl text-xs shadow"
              >
                Post Opportunity
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {opportunities.map((opp) => (
              <OpportunityCard
                key={opp._id}
                opportunity={opp}
                match={matches[opp._id]}
                onUpdate={fetchOpportunities}
              />
            ))}
          </div>
        )}
      </div>

      <CreateOpportunityModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onCreated={handleCreated}
      />
    </div>
  );
}
