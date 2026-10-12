import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Calendar,
  Briefcase,
  Compass,
  MessageSquare,
  Hash,
  ArrowRight,
  Search,
} from 'lucide-react';
import { searchAPI } from '../services/api';

export const SEARCH_TABS = [
  { id: 'all', label: 'All' },
  { id: 'users', label: 'People' },
  { id: 'events', label: 'Events' },
  { id: 'opportunities', label: 'Opportunities' },
  { id: 'projects', label: 'Projects' },
  { id: 'communities', label: 'Communities' },
  { id: 'posts', label: 'Posts' },
];

const cardCls =
  'p-3 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-amber-400 dark:hover:border-amber-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer transition-all';
const headCls =
  'text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5';

const fmtDate = (d) => {
  if (!d) return '';
  const date = new Date(d);
  return isNaN(date) ? '' : date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
};

const profileUrl = (username) => `/profile?username=${encodeURIComponent(username)}`;

function Section({ icon: Icon, color, title, count, children }) {
  return (
    <div className="space-y-2">
      <div className={headCls}>
        <Icon className={`w-3.5 h-3.5 ${color}`} /> {title} ({count})
      </div>
      {children}
    </div>
  );
}

/**
 * Grouped results for every searchable type.
 * Used by the Ctrl+K modal, the feed search and the /search page.
 */
export function ResultGroups({ results, onSelect }) {
  if (!results) return null;
  const { users = [], events = [], opportunities = [], projects = [], communities = [], posts = [] } = results;

  return (
    <div className="space-y-6">
      {users.length > 0 && (
        <Section icon={Users} color="text-blue-500" title="People" count={users.length}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {users.map((u) => (
              <div key={u._id} onClick={() => onSelect(profileUrl(u.username))} className={`${cardCls} flex items-center gap-3`}>
                <img
                  src={u.avatarUrl}
                  alt={u.fullName}
                  className="w-10 h-10 rounded-full object-cover border border-amber-400/40 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">{u.fullName}</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    @{u.username} · {u.role === 'company' && u.companyName ? u.companyName : u.role}
                  </p>
                  {u.headline && (
                    <p className="text-[11px] text-slate-400 truncate">{u.headline}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {events.length > 0 && (
        <Section icon={Calendar} color="text-rose-500" title="Events" count={events.length}>
          <div className="space-y-2">
            {events.map((ev) => (
              <div
                key={ev._id}
                onClick={() => onSelect(`/events?search=${encodeURIComponent(ev.title)}`)}
                className={`${cardCls} flex items-center justify-between gap-4`}
              >
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">{ev.title}</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                    <span className="capitalize">{ev.type}</span>
                    {ev.startDate ? ` · ${fmtDate(ev.startDate)}` : ''}
                    {ev.locationType ? ` · ${ev.locationType}` : ''}
                    {ev.organizerName ? ` · by ${ev.organizerName}` : ''}
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
              </div>
            ))}
          </div>
        </Section>
      )}

      {opportunities.length > 0 && (
        <Section icon={Briefcase} color="text-emerald-500" title="Opportunities" count={opportunities.length}>
          <div className="space-y-2">
            {opportunities.map((op) => (
              <div
                key={op._id}
                onClick={() => onSelect(`/opportunities?search=${encodeURIComponent(op.title)}`)}
                className={`${cardCls} flex items-center justify-between gap-4`}
              >
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">{op.title}</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                    {op.companyName || op.creator?.companyName}
                    {op.type ? ` · ${op.type}` : ''}
                    {op.workplaceType ? ` · ${op.workplaceType}` : ''}
                    {op.location ? ` · ${op.location}` : ''}
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
              </div>
            ))}
          </div>
        </Section>
      )}

      {projects.length > 0 && (
        <Section icon={Compass} color="text-amber-500" title="Projects" count={projects.length}>
          <div className="space-y-2">
            {projects.map((p) => (
              <div
                key={p._id}
                onClick={() => onSelect(`/projects/${p._id}`)}
                className={`${cardCls} flex items-center justify-between gap-4`}
              >
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">{p.title}</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                    {p.shortSummary || p.description}
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
              </div>
            ))}
          </div>
        </Section>
      )}

      {communities.length > 0 && (
        <Section icon={Hash} color="text-violet-500" title="Communities" count={communities.length}>
          <div className="space-y-2">
            {communities.map((c) => (
              <div
                key={c._id}
                onClick={() => onSelect(`/communities/${c.slug || c._id}`)}
                className={`${cardCls} flex items-center justify-between gap-4`}
              >
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                    {c.icon ? `${c.icon} ` : ''}
                    {c.name}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                    {c.category ? `${c.category} · ` : ''}
                    {c.description}
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
              </div>
            ))}
          </div>
        </Section>
      )}

      {posts.length > 0 && (
        <Section icon={MessageSquare} color="text-emerald-500" title="Posts" count={posts.length}>
          <div className="space-y-2">
            {posts.map((post) => (
              <div
                key={post._id}
                onClick={() => post.author?.username && onSelect(profileUrl(post.author.username))}
                className={cardCls}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100">{post.author?.fullName}</span>
                  <span className="text-[10px] text-slate-400">@{post.author?.username}</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-3">{post.content}</p>
              </div>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}

export const isEmptyResults = (results) =>
  !results || Object.values(results).every((arr) => !arr || arr.length === 0);

/**
 * Self-contained search results panel (tabs + fetch + groups).
 * Drop it anywhere: the feed shows it in place of posts while the feed search box has text.
 */
export default function SearchResults({ query, initialTab = 'all', limit = 8 }) {
  const navigate = useNavigate();
  const [tab, setTab] = useState(initialTab);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const q = (query || '').trim();
    if (!q) {
      setResults(null);
      return undefined;
    }
    let cancelled = false;
    setLoading(true);
    setError('');
    const timer = setTimeout(async () => {
      try {
        const res = await searchAPI.search(q, tab, limit);
        if (!cancelled && res.data.success) setResults(res.data.results);
      } catch (err) {
        if (!cancelled) setError(err.response?.data?.message || 'Search failed. Please try again.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, tab, limit]);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 overflow-x-auto text-xs">
        {SEARCH_TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-3 py-1.5 rounded-xl font-bold transition-colors whitespace-nowrap ${
              tab === t.id
                ? 'bg-amber-400 text-slate-900 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="p-4 sm:p-5">
        {loading && (
          <div className="py-10 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
            Searching INNOFIX...
          </div>
        )}

        {!loading && error && <div className="py-8 text-center text-xs text-rose-500">{error}</div>}

        {!loading && !error && results && (
          isEmptyResults(results) ? (
            <div className="py-10 text-center">
              <Search className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-600 dark:text-slate-300">
                No matches for &quot;{query}&quot;
              </p>
              <p className="text-xs text-slate-400 mt-1">Try a name, @username, skill or #tag.</p>
            </div>
          ) : (
            <ResultGroups results={results} onSelect={(url) => navigate(url)} />
          )
        )}
      </div>
    </div>
  );
}
