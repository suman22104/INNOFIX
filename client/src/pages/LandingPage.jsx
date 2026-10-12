import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Lenis from 'lenis';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { Rocket, Users, Briefcase, Calendar, Sparkles, ArrowRight, ShieldCheck, Zap, TrendingUp, CheckCircle2, XCircle, MinusCircle, MessageSquare, Bot, Brain, Code2, Layers, ChevronDown, Lightbulb } from 'lucide-react';
import { analyticsAPI } from '../services/api';
import Footer from '../components/Footer';
import Hyperspeed from '../components/Hyperspeed';
import { hyperspeedPresets } from '../components/HyperSpeedPresets';
import FeaturesShowcase from '../components/FeaturesShowcase';
import NavSearch from '../components/NavSearch';

export default function LandingPage() {
  const { isAuthenticated, logout } = useAuth();
  const [showAuthToast, setShowAuthToast] = useState(false);

  const handleAuthClick = (e) => {
    if (isAuthenticated) {
      e.preventDefault();
      setShowAuthToast(true);
    }
  };

  const [stats, setStats] = useState({
    totalUsers: 0,
    activeProjects: 0,
    upcomingEvents: 0,
    activeOpportunities: 0,
  });

  useEffect(() => {
    analyticsAPI
      .getStats()
      .then((res) => {
        if (res.data.success && res.data.stats) {
          setStats((prev) => ({ ...prev, ...res.data.stats }));
        }
      })
      .catch(() => { });
  }, []);

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      direction: 'vertical',
      gestureDirection: 'vertical',
      smooth: true,
      mouseMultiplier: 1,
      smoothTouch: false,
      touchMultiplier: 2,
      infinite: false,
    });

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
    };
  }, []);

  const faqs = [
    {
      q: 'What is INNOFIX?',
      a: 'INNOFIX is a social network where students, developers, mentors and startups find teammates, share projects and chat, all in one place.',
    },
    {
      q: 'How are people suggested to me?',
      a: 'We suggest people based on the skills you share, friends in common and activity on the platform. Every suggestion tells you why it appeared, for example "3 mutual connections · both know React".',
    },
    {
      q: 'What happens if the AI service is down?',
      a: 'The site keeps working. If the AI service is temporarily unavailable, simpler built-in checks take over.',
    },
    {
      q: 'Is INNOFIX free for students?',
      a: 'Yes. Students can join projects, communities and events, use the writing helper and earn badges on the leaderboard.',
    },
  ];

  const [openFaq, setOpenFaq] = useState(null);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      {/* Landing Page Navbar */}
      <nav className="absolute top-0 left-0 w-full z-50 flex items-center justify-between px-6 py-6 md:px-12 bg-transparent pointer-events-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-400 flex items-center justify-center shadow-sm">
            <Lightbulb className="w-5 h-5 text-slate-900" strokeWidth={2.5} />
          </div>
          <span className="font-black text-xl tracking-tight text-slate-900 dark:text-white font-display uppercase">
            INNOFIX
          </span>
        </div>

        {/* Search: signed-in users only (student, company and admin) */}
        {isAuthenticated && <NavSearch />}

        <div className={`hidden md:flex items-center gap-8 ${isAuthenticated ? 'md:mr-6 lg:mr-8' : ''}`}>
          <a href="#faq" className="text-sm font-bold text-slate-600 hover:text-amber-600 dark:text-slate-300 dark:hover:text-amber-400 transition-colors">Support</a>
          <a href="#features" className="text-sm font-bold text-slate-600 hover:text-amber-600 dark:text-slate-300 dark:hover:text-amber-400 transition-colors">Features</a>
        </div>

        <div className="flex items-center gap-5">
          <Link to="/login" onClick={handleAuthClick} className="text-sm font-bold text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-colors">Login</Link>
          <Link to="/register" onClick={handleAuthClick} className="px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm font-bold hover:bg-slate-800 dark:hover:bg-slate-100 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5">
            Sign Up
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="rounded-b-[2.5rem] sm:rounded-b-[8rem] border-b border-slate-200 dark:border-slate-700/80 shadow-xl shadow-slate-200/40 dark:shadow-indigo-500/10 relative overflow-hidden pt-28 pb-24 lg:pt-36 lg:pb-32 bg-gradient-to-b from-indigo-500/10 via-white to-white dark:from-indigo-900/30 dark:via-slate-900 dark:to-slate-900 z-10">
        <div className="absolute inset-0 z-0">
          <Hyperspeed effectOptions={hyperspeedPresets.five} />
        </div>
        <div className="absolute inset-0 bg-white/70 dark:bg-slate-900/80 pointer-events-none z-0"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-slate-900 dark:text-white font-display leading-[1.1] max-w-4xl mx-auto flex flex-wrap justify-center gap-x-3 sm:gap-x-4 lg:gap-x-5 gap-y-2 pb-4">
            {[
              { text: "Learn,", hl: false },
              { text: "INNOvate,", hl: true },
              { text: "FIX.", hl: false }
            ].map((word, i) => (
              <span key={i} className="overflow-hidden inline-flex">
                <motion.span
                  className={`inline-block ${word.hl ? 'text-amber-500' : ''}`}
                  initial={{ y: "120%", opacity: 0 }}
                  animate={{ y: "0%", opacity: 1 }}
                  transition={{
                    duration: 0.9,
                    ease: [0.16, 1, 0.3, 1],
                    delay: i * 0.08
                  }}
                >
                  {word.text}
                </motion.span>
              </span>
            ))}
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
            A social network for students and young developers. Find teammates by skill, chat with them, join projects and get noticed by mentors and employers.
          </p>

          {/* CTA Buttons */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to={isAuthenticated ? "/dashboard" : "/login"}
              className="w-full sm:w-auto px-8 py-4 bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-base rounded-2xl shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center justify-center gap-2"
            >
              <span>Get Started</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              to="/about/ai"
              className="w-full sm:w-auto px-8 py-4 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-base rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm transition-all flex items-center justify-center gap-2"
            >
              <Bot className="w-5 h-5 text-amber-500" />
              <span>How Our AI Works</span>
            </Link>
          </div>

          {/* Live Platform Stats */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            <div className="bg-white/20 dark:bg-slate-900/30 backdrop-blur-xl p-5 rounded-2xl border border-white/40 dark:border-white/10 shadow-lg shadow-slate-900/5 text-center transition-all hover:bg-white/30 dark:hover:bg-slate-900/40">
              <div className="text-3xl font-black text-slate-900 dark:text-white font-display">
                {stats.totalUsers}+
              </div>
              <div className="text-xs font-semibold text-slate-600 dark:text-slate-300 mt-1 uppercase tracking-wider">
                Student Innovators
              </div>
            </div>
            <div className="bg-white/20 dark:bg-slate-900/30 backdrop-blur-xl p-5 rounded-2xl border border-white/40 dark:border-white/10 shadow-lg shadow-slate-900/5 text-center transition-all hover:bg-white/30 dark:hover:bg-slate-900/40">
              <div className="text-3xl font-black text-amber-600 dark:text-amber-400 font-display">
                {stats.activeProjects}+
              </div>
              <div className="text-xs font-semibold text-slate-600 dark:text-slate-300 mt-1 uppercase tracking-wider">
                Live Projects
              </div>
            </div>
            <div className="bg-white/20 dark:bg-slate-900/30 backdrop-blur-xl p-5 rounded-2xl border border-white/40 dark:border-white/10 shadow-lg shadow-slate-900/5 text-center transition-all hover:bg-white/30 dark:hover:bg-slate-900/40">
              <div className="text-3xl font-black text-slate-900 dark:text-white font-display">
                {stats.upcomingEvents}+
              </div>
              <div className="text-xs font-semibold text-slate-600 dark:text-slate-300 mt-1 uppercase tracking-wider">
                Hackathons & Events
              </div>
            </div>
            <div className="bg-white/20 dark:bg-slate-900/30 backdrop-blur-xl p-5 rounded-2xl border border-white/40 dark:border-white/10 shadow-lg shadow-slate-900/5 text-center transition-all hover:bg-white/30 dark:hover:bg-slate-900/40">
              <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400 font-display">
                {stats.activeOpportunities}+
              </div>
              <div className="text-xs font-semibold text-slate-600 dark:text-slate-300 mt-1 uppercase tracking-wider">
                Opportunities
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Showcase */}
      <section id="features" className="bg-slate-50 dark:bg-slate-950 transition-colors relative pt-24 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center mb-4">
          <div className="inline-flex items-center gap-2 text-xs font-extrabold text-amber-600 dark:text-amber-400 uppercase tracking-widest mb-4">
            Features
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white font-display tracking-tight leading-[1.1] max-w-2xl mx-auto">
            Good ideas grow<br />when we build <span className="text-amber-500">together.</span>
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Find your people, turn a spark into a project, and make progress with an AI-powered campus community that keeps every connection in orbit.
          </p>
        </div>
        <FeaturesShowcase />
      </section>


      {/* Community Callout Banner */}
      <section className="py-16 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <motion.div 
            className="max-w-2xl"
            initial={{ opacity: 0, x: -60 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          >
            <span className="inline-block px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-xs font-bold uppercase tracking-wider mb-3 border border-amber-400/30">
              Join the community
            </span>
            <h3 className="text-3xl sm:text-4xl font-black font-display tracking-tight text-white">
              Ready to start your next project?
            </h3>
            <p className="mt-3 text-slate-300 text-sm sm:text-base leading-relaxed">
              Create a free account in under a minute, add your skills and start finding teammates.
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 60 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
          >
            <Link
              to={isAuthenticated ? "/dashboard" : "/login"}
              onClick={handleAuthClick}
              className="shrink-0 px-8 py-4 bg-amber-400 hover:bg-amber-300 text-slate-900 font-extrabold text-base rounded-2xl shadow-xl hover:scale-105 transition-all inline-block"
            >
              {isAuthenticated ? 'Go to Dashboard →' : 'Create Your Account →'}
            </Link>
          </motion.div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-24 bg-slate-50 dark:bg-slate-950 overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-12"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <h2 className="text-xs font-extrabold text-amber-600 dark:text-amber-400 uppercase tracking-widest mb-2">
              Got Questions?
            </h2>
            <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white font-display">
              Frequently Asked Questions
            </h3>
          </motion.div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.7, delay: index * 0.15, ease: [0.16, 1, 0.3, 1] }}
                className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full px-6 py-4 text-left flex items-center justify-between font-bold text-slate-900 dark:text-white hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-5 h-5 transition-transform ${openFaq === index ? 'rotate-180 text-amber-500' : 'text-slate-400'
                      }`}
                  />
                </button>
                {openFaq === index && (
                  <div className="px-6 pb-5 text-sm text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-700 pt-3">
                    {faq.a}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <Footer />

      {/* Centered Auth Toast Modal */}
      {showAuthToast && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-2xl max-w-sm w-full relative animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-800">
            <button 
              onClick={() => setShowAuthToast(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            >
              <XCircle className="w-6 h-6" />
            </button>
            <div className="flex flex-col items-center text-center mt-2">
              <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mb-4">
                <ShieldCheck className="w-6 h-6 text-amber-600 dark:text-amber-400" />
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">Already Logged In</h3>
              <p className="text-slate-600 dark:text-slate-300 text-sm mb-6 leading-relaxed">
                You are currently logged in with an account. If you want to log in with another account, please sign out first.
              </p>
              <div className="flex gap-3 w-full">
                <button 
                  onClick={() => {
                    logout();
                    setShowAuthToast(false);
                  }}
                  className="flex-1 px-4 py-2.5 bg-rose-100 dark:bg-rose-900/30 hover:bg-rose-200 dark:hover:bg-rose-800/50 text-rose-700 dark:text-rose-400 rounded-xl text-sm font-bold transition-colors"
                >
                  Log Out
                </button>
                <Link 
                  to="/dashboard"
                  className="flex-1 px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-900 rounded-xl text-sm font-bold transition-colors flex items-center justify-center"
                >
                  Go to Dashboard
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
