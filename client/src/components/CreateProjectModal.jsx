import React, { useState } from 'react';
import { X, Plus, Rocket } from 'lucide-react';
import { projectAPI } from '../services/api';
import { useToast } from '../context/ToastContext';

export default function CreateProjectModal({ isOpen, onClose, onCreated }) {
  const toast = useToast();
  const [formData, setFormData] = useState({
    title: '',
    category: 'Web Development',
    shortSummary: '',
    description: '',
    requiredSkills: '',
    budget: 'Volunteer / Open Source',
    maxTeamSize: 4,
    githubRepo: '',
    liveDemoUrl: '',
  });
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const categories = [
    'Web Development',
    'Mobile Apps',
    'AI & Machine Learning',
    'Blockchain & Web3',
    'IoT & Hardware',
    'Cloud & DevOps',
    'UI/UX Design',
    'Cybersecurity',
    'Data Science',
    'Other',
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await projectAPI.create(formData);
      if (res.data.success) {
        onClose();
        if (onCreated) onCreated(res.data.project);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not create the project. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto custom-scrollbar">
      <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 dark:border-slate-700 relative my-8">
        <button
          onClick={onClose}
          className="absolute right-6 top-6 p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-amber-400 text-slate-900 flex items-center justify-center font-bold text-xl shadow-sm">
            🚀
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white font-display">
              Launch New Project
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Find collaborators, share your roadmap, and bring your idea to life.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-sm">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Project Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. AI-Powered Autonomous Drone Telemetry"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:bg-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Category *
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-400"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Budget / Compensation
              </label>
              <input
                type="text"
                placeholder="e.g. Volunteer, $500 Grant, Equity"
                value={formData.budget}
                onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Short Pitch / Summary
            </label>
            <input
              type="text"
              placeholder="One sentence describing what your project accomplishes..."
              value={formData.shortSummary}
              onChange={(e) => setFormData({ ...formData, shortSummary: e.target.value })}
              className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Full Project Description *
            </label>
            <textarea
              rows="4"
              required
              placeholder="Explain the problem, technical stack, architecture, and current progress..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-2xl p-3.5 focus:outline-none focus:ring-2 focus:ring-amber-400"
            ></textarea>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Required Skills (comma separated)
              </label>
              <input
                type="text"
                placeholder="e.g. React, Python, Docker, Figma"
                value={formData.requiredSkills}
                onChange={(e) =>
                  setFormData({ ...formData, requiredSkills: e.target.value })
                }
                className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Target Team Size
              </label>
              <input
                type="number"
                min="1"
                max="20"
                value={formData.maxTeamSize}
                onChange={(e) =>
                  setFormData({ ...formData, maxTeamSize: Number(e.target.value) })
                }
                className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                GitHub Repository (Optional)
              </label>
              <input
                type="url"
                placeholder="https://github.com/..."
                value={formData.githubRepo}
                onChange={(e) =>
                  setFormData({ ...formData, githubRepo: e.target.value })
                }
                className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Live Demo / Website (Optional)
              </label>
              <input
                type="url"
                placeholder="https://..."
                value={formData.liveDemoUrl}
                onChange={(e) =>
                  setFormData({ ...formData, liveDemoUrl: e.target.value })
                }
                className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 font-bold bg-amber-400 hover:bg-amber-300 text-slate-900 rounded-xl shadow-md flex items-center gap-2"
            >
              {loading ? 'Creating...' : 'Launch Project'}
              <Rocket className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
