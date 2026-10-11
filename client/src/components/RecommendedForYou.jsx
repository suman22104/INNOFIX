import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Rocket, Calendar, Briefcase, Users } from 'lucide-react';
import { aiAPI } from '../services/aiApi';
import { useAuth } from '../context/AuthContext';
import MatchBadge from './MatchBadge';

const TABS = [
  { id: 'projects', label: 'Projects', icon: Rocket },
  { id: 'events', label: 'Events', icon: Calendar },
  { id: 'opportunities', label: 'Opportunities', icon: Briefcase },
  { id: 'communities', label: 'Communities', icon: Users },
];

const SINGULAR = { projects: 'project', events: 'event', opportunities: 'opportunity', communities: 'community' };

const linkFor = (tab, item) => {
  switch (tab) {
    case 'projects':
      return `/projects/${item._id}`;
    case 'communities':
      return `/communities/${item.slug || item._id}`;
    case 'events':
      return '/events';
    default:
      return '/opportunities';
  }
};

const titleOf = (tab, item) => (tab === 'communities' ? item.name : item.title);

const subtitleOf = (tab, item) => {
  switch (tab) {
    case 'projects':
      return item.category;
    case 'events':
      return [item.type, item.startDate && new Date(item.startDate).toLocaleDateString()]
        .filter(Boolean)
        .join(' · ');
    case 'opportunities':
      return [item.companyName, item.type].filter(Boolean).join(' · ');
    default:
      return `${item.memberCount || 0} members · ${item.category}`;
  }
};

export default function RecommendedForYou() {
  const { user } = useAuth();
  if (user?.role === 'company') return null;

  const [data, setData] = useState(null);
  const [strategy, setStrategy] = useState('personalized');
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState('projects');

  useEffect(() => {
    let cancelled = false;
    aiAPI
      .getRecommendations({ limit: 4 })
      .then((res) => {
        if (cancelled || !res.data.success) return;
        setData(res.data.recommendations);
        setStrategy(res.data.strategy);
        // open on the first tab that actually has results
        const first = TABS.find((t) => res.data.recommendations[t.id]?.length);
        if (first) setActive(first.id);
      })
      .catch(() => {}) // recommendations are optional: never break the dashboard
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-5 border border-slate-200 animate-pulse space-y-3">
        <div className="w-40 h-4 bg-slate-200 rounded" />
        <div className="w-full h-16 bg-slate-100 rounded-xl" />
      </div>
    );
  }

  if (!data || TABS.every((t) => !data[t.id]?.length)) return null;

  const items = data[active] || [];

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span>{strategy === 'personalized' ? 'Recommended for you' : 'Trending on INNOFIX'}</span>
        </div>
        {strategy === 'trending' && (
          <span className="text-[11px] text-slate-400 font-medium">
            Add skills to your profile for personalised picks
          </span>
        )}
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActive(id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 flex items-center gap-1.5 transition-all ${
              active === id
                ? 'bg-amber-400 text-slate-900 shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
            <span className="opacity-60">{data[id]?.length || 0}</span>
          </button>
        ))}
      </div>

      {items.length === 0 ? (
        <p className="text-xs text-slate-500 py-4">Nothing new to suggest here right now.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
          {items.map((item) => (
            <Link
              key={item._id}
              to={linkFor(active, item)}
              onClick={() =>
                aiAPI
                  .trackClick({
                    itemType: SINGULAR[active],
                    itemId: item._id,
                    title: titleOf(active, item),
                    score: item.ai?.score,
                  })
                  .catch(() => {})
              }
              className="p-3.5 rounded-xl border border-slate-200 hover:border-amber-400 hover:shadow-md transition-all flex items-center justify-between gap-3"
            >
              <div className="flex flex-col flex-1 min-w-0">
                <div className="flex flex-col gap-0.5">
                  <h4 className="font-bold text-sm text-slate-900 line-clamp-2 leading-snug">{titleOf(active, item)}</h4>
                  <p className="text-xs text-slate-500 capitalize truncate">{subtitleOf(active, item)}</p>
                </div>
                {item.ai?.reasons?.length > 0 && (
                  <p className="text-[11px] text-slate-600 mt-2.5 line-clamp-2">{item.ai.reasons[0]}</p>
                )}
              </div>
              <MatchBadge score={item.ai?.score} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
