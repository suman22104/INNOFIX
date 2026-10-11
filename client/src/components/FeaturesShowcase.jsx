import React, { useEffect, useRef, useState } from 'react';
import { motion, useScroll, useSpring, useMotionValueEvent } from 'framer-motion';
import { Users, MessageSquare, ShieldCheck, Wand2 } from 'lucide-react';

const features = [
  {
    title: "Find your people",
    description: "Meet classmates with the skills, curiosity, and energy your next idea needs.",
    tag: "Skill-based matching",
    icon: Users
  },
  {
    title: "Make it a team",
    description: "Swap ideas in focused spaces, share quick updates, and keep momentum moving.",
    tag: "Conversations that click",
    icon: MessageSquare
  },
  {
    title: "Keep the signal clear",
    description: "Thoughtful community tools help conversations stay welcoming, useful, and safe.",
    tag: "A healthier campus feed",
    icon: ShieldCheck
  },
  {
    title: "Make the first draft",
    description: "Use AI as a creative sidekick for team plans, project pitches, and the words in between.",
    tag: "Human ideas, AI assist",
    icon: Wand2
  }
];

export default function FeaturesShowcase() {
  const containerRef = useRef(null);
  const iconRefs = useRef([]);
  const [svgPath, setSvgPath] = useState('');
  const [svgViewBox, setSvgViewBox] = useState('0 0 100 100');
  const [activeIndex, setActiveIndex] = useState(0);

  const { scrollY } = useScroll();

  const updatePath = () => {
    if (!containerRef.current || iconRefs.current.length === 0) return;
    const box = containerRef.current.getBoundingClientRect();
    setSvgViewBox(`0 0 ${box.width} ${box.height}`);

    const nodes = iconRefs.current.map((el) => {
      if (!el) return { x: 0, y: 0 };
      const rect = el.getBoundingClientRect();
      return {
        x: rect.left - box.left + rect.width / 2,
        y: rect.top - box.top + rect.height / 2
      };
    });

    let d = `M ${nodes[0].x} ${nodes[0].y}`;
    for (let i = 1; i < nodes.length; i++) {
      let midY = (nodes[i - 1].y + nodes[i].y) / 2;
      d += ` C ${nodes[i - 1].x} ${midY}, ${nodes[i].x} ${midY}, ${nodes[i].x} ${nodes[i].y}`;
    }
    setSvgPath(d);
  };

  useEffect(() => {
    updatePath();
    // Use ResizeObserver for more robust resizing tracking of the container
    const observer = new ResizeObserver(() => updatePath());
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    window.addEventListener('resize', updatePath);
    return () => {
      window.removeEventListener('resize', updatePath);
      observer.disconnect();
    };
  }, []);

  useMotionValueEvent(scrollY, 'change', () => {
    if (!containerRef.current || iconRefs.current.length === 0) return;
    const viewportCenter = window.innerHeight * 0.5;

    let minDistance = Infinity;
    let closestIndex = 0;

    iconRefs.current.forEach((el, index) => {
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const cardCenter = rect.top + rect.height / 2;
      const distance = Math.abs(viewportCenter - cardCenter);

      // Only consider it active if it is somewhat inside the viewport
      if (distance < minDistance && rect.top < window.innerHeight && rect.bottom > 0) {
        minDistance = distance;
        closestIndex = index;
      }
    });

    setActiveIndex(closestIndex);
  });

  // Maps the scroll of the container itself entering/leaving the viewport's center
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start center", "end center"]
  });

  // Smooth out the drawing animation slightly
  const smoothProgress = useSpring(scrollYProgress, { stiffness: 100, damping: 20 });

  return (
    <div className="relative max-w-2xl mx-auto py-12" ref={containerRef}>
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none z-0"
        aria-hidden="true"
        viewBox={svgViewBox}
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="beamGradient" x1="0" y1="0" x2="0" y2="100%" gradientUnits="userSpaceOnUse">
            <stop stopColor="#f59e0b" />
            <stop offset=".5" stopColor="#fbbf24" />
            <stop offset="1" stopColor="#34d399" />
          </linearGradient>
        </defs>
        {/* Background Track */}
        <path
          d={svgPath}
          className="stroke-slate-200 dark:stroke-slate-800"
          fill="none"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Animated Fill Path */}
        <motion.path
          d={svgPath}
          fill="none"
          stroke="url(#beamGradient)"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ pathLength: smoothProgress }}
          className="drop-shadow-[0_0_6px_rgba(245,158,11,0.5)]"
        />
      </svg>

      <div className="relative z-10 flex flex-col gap-8">
        {features.map((feature, index) => {
          const isActive = index === activeIndex;
          return (
            <article
              key={index}
              className={`relative p-8 rounded-[20px] transition-all duration-300 border flex flex-col items-center text-center hover:-translate-y-1 ${isActive
                  ? 'bg-gradient-to-br from-white to-amber-50 dark:from-slate-900 dark:to-slate-800 border-amber-500/50 shadow-xl shadow-amber-500/10 dark:shadow-amber-500/5 scale-110 z-10'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-[0_4px_16px_rgba(45,57,105,0.04)] dark:shadow-none hover:border-amber-500/30 hover:shadow-[0_12px_28px_rgba(45,57,105,0.08)] dark:hover:shadow-none scale-100 z-0'
                }`}
            >
              <span className="absolute top-8 right-8 text-[10px] tracking-widest font-extrabold text-slate-400 dark:text-slate-500 uppercase">
                0{index + 1} / 04
              </span>
              <div
                ref={(el) => (iconRefs.current[index] = el)}
                className={`w-[47px] h-[47px] flex items-center justify-center rounded-[15px] mb-5 transition-all duration-300 shadow-[inset_0_1px_rgba(255,255,255,0.9)] dark:shadow-[inset_0_1px_rgba(255,255,255,0.1)] ${isActive
                    ? 'bg-gradient-to-br from-amber-500/20 to-emerald-400/20 text-amber-600 dark:text-amber-400 shadow-md shadow-amber-500/20'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                  }`}
              >
                <feature.icon className="w-[23px] h-[23px]" strokeWidth={1.7} />
              </div>
              <h3 className="text-[20px] leading-[1.25] tracking-tight font-bold text-slate-900 dark:text-white mb-2">
                {feature.title}
              </h3>
              <p className="text-slate-600 dark:text-slate-300 text-[15px] leading-[1.68] mb-4">
                {feature.description}
              </p>
              <span
                className={`mt-auto text-[10px] font-extrabold tracking-[0.08em] uppercase transition-colors duration-300 ${isActive ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400 dark:text-slate-500'
                  }`}
              >
                {feature.tag}
              </span>
            </article>
          );
        })}
      </div>
    </div>
  );
}
