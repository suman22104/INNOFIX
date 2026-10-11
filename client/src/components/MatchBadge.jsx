import React, { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';

export default function MatchBadge({ score, title }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(timer);
  }, []);

  if (score === null || score === undefined) return null;
  const tone =
    score >= 70
      ? {
          stroke: 'text-emerald-500',
          track: 'text-emerald-100 dark:text-emerald-900/30',
          text: 'text-emerald-700 dark:text-emerald-400',
        }
      : score >= 40
      ? {
          stroke: 'text-amber-500',
          track: 'text-amber-100 dark:text-amber-900/30',
          text: 'text-amber-700 dark:text-amber-400',
        }
      : {
          stroke: 'text-slate-400',
          track: 'text-slate-100 dark:text-slate-800',
          text: 'text-slate-600 dark:text-slate-400',
        };

  const circumference = 251.3; // 2 * pi * 40
  // Start at full circumference (0 progress) and animate to target offset
  const offset = mounted ? circumference - (score / 100) * circumference : circumference;

  return (
    <div title={title} className="relative shrink-0 flex flex-col items-center justify-center w-16 h-16 sm:w-20 sm:h-20">
      <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full transform -rotate-90">
        <circle
          cx="50"
          cy="50"
          r="40"
          stroke="currentColor"
          strokeWidth="12"
          fill="none"
          className={tone.track}
        />
        <circle
          cx="50"
          cy="50"
          r="40"
          stroke="currentColor"
          strokeWidth="12"
          fill="none"
          strokeDasharray="251.3"
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={`${tone.stroke} transition-all duration-[1500ms] ease-out`}
        />
      </svg>
      {/* Fade and scale in the text slightly after the stroke starts */}
      <div 
        className={`absolute inset-0 flex flex-col items-center justify-center text-center translate-x-[1px] translate-y-[1px] ${tone.text} transition-all duration-1000 delay-300 ease-out ${mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}
      >
        <span className="text-[13px] sm:text-[15px] font-black leading-none">{score}%</span>
        <span className="text-[7px] sm:text-[8px] font-bold uppercase tracking-wider mt-1">match</span>
      </div>
    </div>
  );
}
