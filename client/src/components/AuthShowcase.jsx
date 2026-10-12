import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Lightbulb,
  Rocket,
  Sparkles,
  CalendarDays,
  Briefcase,
  Users,
  Trophy,
  MessageCircle,
  GraduationCap,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react';
import GridMotion from './GridMotion';
import { useAuth } from '../context/AuthContext';

/* -------------------------------------------------------------------------- */
/*  Tiles: little "snapshots" of what the platform does                        */
/*  They are plain JSX, so they follow the dark / light theme automatically.   */
/*  Want real photos instead? Replace TILES with image URLs/paths, e.g.        */
/*  ['/login/1.jpg', '/login/2.jpg', ...] (put the files in /public/login).    */
/* -------------------------------------------------------------------------- */

const TONES = {
  amber:
    'from-amber-100 to-orange-200 text-amber-950 dark:from-amber-500/45 dark:to-orange-700/50 dark:text-amber-50',
  indigo:
    'from-indigo-100 to-violet-200 text-indigo-950 dark:from-indigo-500/45 dark:to-violet-700/50 dark:text-indigo-50',
  emerald:
    'from-emerald-100 to-teal-200 text-emerald-950 dark:from-emerald-500/40 dark:to-teal-700/50 dark:text-emerald-50',
  rose: 'from-rose-100 to-pink-200 text-rose-950 dark:from-rose-500/45 dark:to-pink-700/50 dark:text-rose-50',
  sky: 'from-sky-100 to-blue-200 text-sky-950 dark:from-sky-500/45 dark:to-blue-700/50 dark:text-sky-50',
  violet:
    'from-fuchsia-100 to-purple-200 text-fuchsia-950 dark:from-fuchsia-500/45 dark:to-purple-700/50 dark:text-fuchsia-50',
};

const Chip = ({ children }) => (
  <span className="rounded-full bg-white/70 px-[3cqw] py-[1.1cqw] text-[3.4cqw] font-semibold dark:bg-white/10">
    {children}
  </span>
);

const Bar = ({ value }) => (
  <div className="h-[2cqw] w-full overflow-hidden rounded-full bg-black/10 dark:bg-white/15">
    <div className="h-full rounded-full bg-current opacity-70" style={{ width: `${value}%` }} />
  </div>
);

const Avatars = ({ count = 4 }) => (
  <div className="flex items-center">
    {Array.from({ length: count }, (_, i) => (
      <span
        key={i}
        className="-ml-[2cqw] first:ml-0 size-[8cqw] rounded-full border-2 border-white/80 bg-current opacity-60 dark:border-white/20"
        style={{ opacity: 0.35 + i * 0.12 }}
      />
    ))}
  </div>
);

// Tile root sets a size container so every inner size scales with the tile (cqw).
const Snap = ({ tone, Icon, kicker, title, meta, foot }) => (
  <div className="h-full w-full [container-type:size]">
    <div
      className={`flex h-full w-full flex-col justify-between bg-gradient-to-br p-[7cqw] text-left ${TONES[tone]}`}
    >
      <div className="flex items-center justify-between">
        <span className="grid size-[14cqw] place-items-center rounded-[4cqw] bg-white/70 shadow-sm dark:bg-white/10">
          <Icon className="size-[7.5cqw]" strokeWidth={2.2} />
        </span>
        <span className="text-[3.4cqw] font-bold uppercase tracking-[0.14em] opacity-60">{kicker}</span>
      </div>
      <div>
        <p className="font-display text-[7.4cqw] font-bold leading-[1.15]">{title}</p>
        <p className="mt-[1.6cqw] text-[4cqw] opacity-70">{meta}</p>
      </div>
      <div className="flex items-center gap-[2cqw]">{foot}</div>
    </div>
  </div>
);

const TILES = [
  <Snap
    key="projects"
    tone="amber"
    Icon={Rocket}
    kicker="Projects"
    title="Smart Campus Navigator"
    meta="3 of 5 roles filled"
    foot={<Bar value={60} />}
  />,
  <Snap
    key="match"
    tone="indigo"
    Icon={Sparkles}
    kicker="AI Match"
    title="92% match for you"
    meta="Based on your skills & interests"
    foot={
      <>
        <Chip>React</Chip>
        <Chip>Node.js</Chip>
      </>
    }
  />,
  <Snap
    key="events"
    tone="emerald"
    Icon={CalendarDays}
    kicker="Events"
    title="Weekend Hackathon"
    meta="Saturday · 48 spots left"
    foot={
      <>
        <Chip>48 hrs</Chip>
        <Chip>Prizes</Chip>
      </>
    }
  />,
  <Snap
    key="jobs"
    tone="rose"
    Icon={Briefcase}
    kicker="Opportunities"
    title="Product Design Intern"
    meta="TechCorp · Remote"
    foot={
      <>
        <Chip>Internship</Chip>
        <Chip>Paid</Chip>
      </>
    }
  />,
  <Snap
    key="communities"
    tone="sky"
    Icon={Users}
    kicker="Communities"
    title="AI & Robotics Club"
    meta="1.2k members"
    foot={<Avatars />}
  />,
  <Snap
    key="leaderboard"
    tone="violet"
    Icon={Trophy}
    kicker="Leaderboard"
    title="Top builder this week"
    meta="+240 reputation points"
    foot={<Bar value={82} />}
  />,
  <Snap
    key="messages"
    tone="amber"
    Icon={MessageCircle}
    kicker="Messages"
    title="Team chat, live"
    meta="3 new messages"
    foot={<Avatars count={3} />}
  />,
  <Snap
    key="mentors"
    tone="emerald"
    Icon={GraduationCap}
    kicker="Mentors"
    title="Find your mentor"
    meta="42 mentors online now"
    foot={
      <>
        <Chip>Career</Chip>
        <Chip>Code review</Chip>
      </>
    }
  />,
];

const CAPTIONS = [
  { title: 'INNOFIX AI', sub: 'Learn, INNOvate, FIX.' },
  { title: 'Projects', sub: 'Join teams building real things' },
  { title: 'Opportunities', sub: 'Internships & gigs matched to you' },
];

// Rounded panel whose right edge leans in at the bottom (objectBoundingBox units).
const CLIP_ID = 'auth-showcase-clip';
const CLIP_PATH =
  'M0.045,0 H0.955 Q1,0 1,0.035 L0.94,0.965 Q0.937,1 0.892,1 H0.045 Q0,1 0,0.965 V0.035 Q0,0 0.045,0 Z';

export default function AuthShowcase({ className = '', cta = { to: '/register', label: 'Join Us' } }) {
  const { darkMode } = useAuth();
  const [index, setIndex] = useState(0);
  const caption = CAPTIONS[index];
  const step = (dir) => setIndex((i) => (i + dir + CAPTIONS.length) % CAPTIONS.length);

  return (
    <aside
      className={`relative overflow-hidden bg-slate-200/70 dark:bg-slate-900 ${className}`}
      style={{ clipPath: `url(#${CLIP_ID})` }}
    >
      <svg width="0" height="0" className="absolute" aria-hidden="true" focusable="false">
        <defs>
          <clipPath id={CLIP_ID} clipPathUnits="objectBoundingBox">
            <path d={CLIP_PATH} />
          </clipPath>
        </defs>
      </svg>

      {/* The animated wall */}
      <div className="absolute inset-0">
        <GridMotion
          items={TILES}
          theme={darkMode ? 'dark' : 'light'}
          rows={4}
          aspectRatio={1.15}
          gap={16}
          radius={18}
          angle={-12}
          speed={24}
          parallax={0.5}
          spotlight={0.6}
          dim={0.2}
          fade={0.2}
        />
      </div>

      {/* Legibility bands behind the header / caption (follow the theme) */}
      <div
        className="pointer-events-none absolute inset-0 dark:hidden"
        style={{
          background:
            'linear-gradient(to bottom, rgba(241,245,249,.9), rgba(241,245,249,0) 20%, rgba(241,245,249,0) 76%, rgba(241,245,249,.92))',
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 hidden dark:block"
        style={{
          background:
            'linear-gradient(to bottom, rgba(15,23,42,.9), rgba(15,23,42,0) 20%, rgba(15,23,42,0) 76%, rgba(15,23,42,.92))',
        }}
      />

      {/* Overlay content */}
      <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-10 pr-[14%] text-slate-900 dark:text-white">
        <div className="flex items-center justify-between">
          <Link to="/" className="pointer-events-auto flex items-center gap-2.5 group">
            <span className="grid size-9 place-items-center rounded-xl bg-amber-400 text-slate-900 shadow-md transition-transform group-hover:scale-105">
              <Lightbulb className="size-5" strokeWidth={2.5} />
            </span>
            <span className="font-display text-xl font-extrabold tracking-tight">
              INNO<span className="text-amber-500">FIX</span>
            </span>
          </Link>

          <div className="pointer-events-auto flex items-center gap-4 text-sm font-semibold">
            <Link to="/" className="opacity-80 transition-opacity hover:opacity-100">
              Explore
            </Link>
            <Link
              to={cta.to}
              className="rounded-full border border-slate-900/70 px-5 py-2 transition-colors hover:bg-slate-900 hover:text-white dark:border-white/80 dark:hover:bg-white dark:hover:text-slate-900"
            >
              {cta.label}
            </Link>
          </div>
        </div>

        <div className="flex items-end justify-between gap-6">
          <div className="flex items-center gap-3.5">
            <span className="grid size-12 place-items-center rounded-full bg-amber-400 text-slate-900 shadow-lg">
              <Lightbulb className="size-6" strokeWidth={2.4} />
            </span>
            <div key={index} className="animate-[fadeIn_.35s_ease]">
              <p className="font-display text-lg font-bold leading-tight">{caption.title}</p>
              <p className="text-sm opacity-75">{caption.sub}</p>
            </div>
          </div>

          <div className="pointer-events-auto flex gap-2.5">
            {[
              { dir: -1, Icon: ArrowLeft, label: 'Previous' },
              { dir: 1, Icon: ArrowRight, label: 'Next' },
            ].map(({ dir, Icon, label }) => (
              <button
                key={label}
                type="button"
                onClick={() => step(dir)}
                aria-label={label}
                className="grid size-10 place-items-center rounded-full border border-slate-900/60 transition-colors hover:bg-slate-900 hover:text-white dark:border-white/70 dark:hover:bg-white dark:hover:text-slate-900"
              >
                <Icon className="size-4" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}
