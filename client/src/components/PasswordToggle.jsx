import React from 'react';

/**
 * Eye button for a password field (put it inside a `relative` wrapper next to the input).
 * Hidden password = eye closed (lid flattened, pupil gone, slash drawn in).
 * Visible password = eye open. Both directions animate.
 */
export default function PasswordToggle({ show, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      onMouseDown={(e) => e.preventDefault()} // keep the cursor in the input
      aria-label={show ? 'Hide password' : 'Show password'}
      aria-pressed={show}
      title={show ? 'Hide password' : 'Show password'}
      className="absolute inset-y-0 right-0 px-3.5 flex items-center text-slate-400 hover:text-amber-500 focus:outline-none focus-visible:text-amber-500 transition-colors"
    >
      <svg
        viewBox="0 0 24 24"
        className="w-[18px] h-[18px]"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        {/* eye outline: flattens like an eyelid when closed */}
        <path
          d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"
          style={{
            transformOrigin: '12px 12px',
            transform: show ? 'scaleY(1)' : 'scaleY(0.25)',
            transition: 'transform 220ms ease',
          }}
        />
        {/* pupil: shrinks away when closed */}
        <circle
          cx="12"
          cy="12"
          r="3"
          style={{
            transformOrigin: '12px 12px',
            transform: show ? 'scale(1)' : 'scale(0)',
            transition: 'transform 180ms ease',
          }}
        />
        {/* slash: draws in when closed */}
        <path
          d="M4 4l16 16"
          style={{
            strokeDasharray: 24,
            strokeDashoffset: show ? 25 : 0,
            transition: 'stroke-dashoffset 240ms ease 60ms',
          }}
        />
      </svg>
    </button>
  );
}
