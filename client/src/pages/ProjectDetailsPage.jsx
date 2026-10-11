import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { projectAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Users, Calendar, DollarSign, Github, Globe, Share2, Trash2, CheckCircle2, XCircle, Clock, Send, ArrowLeft, Sparkles, Hourglass } from 'lucide-react';
import { useToast } from '../context/ToastContext';

export default function ProjectDetailsPage() {
  const toast = useToast();
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [proposedRole, setProposedRole] = useState('Developer');
  const [message, setMessage] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [submittingApply, setSubmittingApply] = useState(false);
  const [commentText, setCommentText] = useState('');

  const fetchProject = async () => {
    try {
      setLoading(true);
      const res = await projectAPI.getById(id);
      if (res.data.success) {
        setProject(res.data.project);
      }
    } catch (err) {
      console.error('Error fetching project:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProject();
  }, [id]);

  const handleApply = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) return toast.info('Please sign in to apply');
    setSubmittingApply(true);
    try {
      const res = await projectAPI.apply(id, {
        proposedRole,
        message,
        portfolioUrl,
      });
      if (res.data.success) {
        toast.success('Your application has been sent.');
        setApplyModalOpen(false);
        fetchProject();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not send your application. Please try again.');
    } finally {
      setSubmittingApply(false);
    }
  };

  const handleManageApp = async (appId, status) => {
    try {
      const res = await projectAPI.manageApp(id, appId, { status });
      if (res.data.success) {
        setProject(res.data.project);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not update the application. Please try again.');
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim() || !isAuthenticated) return;
    try {
      const res = await projectAPI.addComment(id, { content: commentText.trim() });
      if (res.data.success) {
        setProject({ ...project, comments: res.data.comments });
        setCommentText('');
      }
    } catch (err) {
      console.error('Error adding comment:', err);
    }
  };

  const handleDeleteProject = async () => {
    if (!window.confirm('Are you sure you want to delete this project?')) return;
    try {
      await projectAPI.delete(id);
      navigate('/projects');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not delete the project. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4 transition-colors">
        <div className="w-8 h-8 border-4 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center p-4 text-center transition-colors">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Project Not Found</h2>
        <Link to="/projects" className="mt-4 px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-900 font-bold rounded-xl text-xs transition-colors">
          Back to Projects
        </Link>
      </div>
    );
  }

  const isOwner =
    user &&
    (project.creator?._id === user._id ||
      project.creator?._id === user.id ||
      project.creator === user._id ||
      user.role === 'admin');

  const hasApplied =
    user &&
    project.applications?.some(
      (a) => (a.user?._id || a.user) === user._id || (a.user?._id || a.user) === user.id
    );

  const isMember =
    user &&
    project.members?.some(
      (m) => (m.user?._id || m.user) === user._id || (m.user?._id || m.user) === user.id
    );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-8 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Link */}
        <Link
          to="/projects"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Projects</span>
        </Link>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Info Column (2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header Card */}
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-700 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <span className="text-xs font-bold bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50 px-3 py-1 rounded-full">
                  {project.category}
                </span>
                <span className="text-xs font-bold bg-emerald-50 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50 px-3 py-1 rounded-full">
                  Status: {project.status}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-display">
                {project.title}
              </h1>

              {project.shortSummary && (
                <p className="text-base font-semibold text-slate-600 dark:text-slate-300 mt-2">
                  {project.shortSummary}
                </p>
              )}

              {/* Creator & Links Bar */}
              <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-700 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <img
                    src={
                      project.creator?.avatarUrl ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(
                        project.creator?.fullName || 'User'
                      )}&background=FBC02D&color=111827&bold=true`
                    }
                    alt={project.creator?.fullName}
                    className="w-10 h-10 rounded-full object-cover border-2 border-amber-400"
                  />
                  <div>
                    <div className="text-sm font-bold text-slate-900 dark:text-white">
                      {project.creator?.fullName}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      Project Lead • @{project.creator?.username}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {project.githubRepo && (
                    <a
                      href={project.githubRepo}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-xl transition-colors"
                      title="GitHub Repository"
                    >
                      <Github className="w-4 h-4" />
                    </a>
                  )}
                  {project.liveDemoUrl && (
                    <a
                      href={project.liveDemoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-xl transition-colors"
                      title="Live Demo"
                    >
                      <Globe className="w-4 h-4" />
                    </a>
                  )}
                  {isOwner && (
                    <button
                      onClick={handleDeleteProject}
                      className="p-2.5 bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 rounded-xl transition-colors"
                      title="Delete Project"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Description Card */}
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white font-display">
                About the Project
              </h2>
              <div className="text-slate-700 dark:text-slate-300 leading-relaxed text-sm sm:text-base whitespace-pre-wrap">
                {project.description}
              </div>

              {/* Skills required */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-700">
                <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                  Skills Needed
                </h3>
                <div className="flex flex-wrap gap-2">
                  {project.requiredSkills?.map((skill, i) => (
                    <span
                      key={i}
                      className="text-xs font-semibold bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-300 px-3 py-1 rounded-xl"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Project Applications Management (Owner Only) */}
            {isOwner && project.applications && project.applications.length > 0 && (
              <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 border border-amber-300 dark:border-amber-700 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <span className="p-1 bg-amber-100 dark:bg-amber-900/30 rounded-lg text-amber-700 dark:text-amber-400">
                    <Users className="w-5 h-5" />
                  </span>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                    Team Applications ({project.applications.length})
                  </h2>
                </div>

                <div className="space-y-3">
                  {project.applications.map((app) => (
                    <div
                      key={app._id}
                      className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="flex items-start gap-3">
                        <img
                          src={
                            app.user?.avatarUrl ||
                            `https://ui-avatars.com/api/?name=${encodeURIComponent(
                              app.user?.fullName || 'User'
                            )}&background=FBC02D&color=111827&bold=true`
                          }
                          alt={app.user?.fullName}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <div>
                          <div className="font-bold text-sm text-slate-900 dark:text-white">
                            {app.user?.fullName}{' '}
                            <span className="text-xs font-normal text-slate-500 dark:text-slate-400">
                              applying for{' '}
                              <strong className="text-amber-700 dark:text-amber-500">{app.proposedRole}</strong>
                            </span>
                          </div>
                          {app.message && (
                            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 italic">
                              "{app.message}"
                            </p>
                          )}
                          {app.portfolioUrl && (
                            <a
                              href={app.portfolioUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs text-amber-600 underline font-semibold mt-1 inline-block"
                            >
                              View Portfolio / GitHub
                            </a>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {app.status === 'pending' ? (
                          <>
                            <button
                              onClick={() => handleManageApp(app._id, 'accepted')}
                              className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" /> Accept
                            </button>
                            <button
                              onClick={() => handleManageApp(app._id, 'rejected')}
                              className="px-3.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1"
                            >
                              <XCircle className="w-3.5 h-3.5" /> Decline
                            </button>
                          </>
                        ) : (
                          <span
                            className={`px-3 py-1 rounded-xl text-xs font-bold capitalize ${
                              app.status === 'accepted'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {app.status}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Discussion & Comments */}
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-700 shadow-sm space-y-6">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white font-display">
                Discussion ({project.comments?.length || 0})
              </h2>

              {isAuthenticated ? (
                <form onSubmit={handleAddComment} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Ask a question or share feedback..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                  <button
                    type="submit"
                    disabled={!commentText.trim()}
                    className="px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-900 font-bold rounded-2xl text-xs shadow disabled:opacity-50"
                  >
                    Post
                  </button>
                </form>
              ) : (
                <p className="text-xs text-slate-500 italic">
                  Sign in to join the conversation.
                </p>
              )}

              <div className="space-y-3 pt-2">
                {project.comments?.map((comment, i) => (
                  <div key={i} className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl flex items-start gap-3">
                    <img
                      src={
                        comment.user?.avatarUrl ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(
                          comment.user?.fullName || 'User'
                        )}&background=FBC02D&color=111827&bold=true`
                      }
                      alt={comment.user?.fullName}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                    <div className="flex-1 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 dark:text-white">
                          {comment.user?.fullName}
                        </span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500">
                          {new Date(comment.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-slate-700 dark:text-slate-300 mt-1 text-sm">{comment.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar Info Column (1 col) */}
          <div className="space-y-6">
            {/* Team & Application Action Card */}
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm space-y-6">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Team Roster</h3>

              {/* Members list */}
              <div className="space-y-3">
                {project.members?.map((m, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={
                          m.user?.avatarUrl ||
                          `https://ui-avatars.com/api/?name=${encodeURIComponent(
                            m.user?.fullName || 'User'
                          )}&background=FBC02D&color=111827&bold=true`
                        }
                        alt={m.user?.fullName}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white">
                          {m.user?.fullName}
                        </div>
                        <div className="text-[10px] text-amber-700 dark:text-amber-500 font-semibold">
                          {m.role}
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500">Member</span>
                  </div>
                ))}
              </div>

              {/* Team Capacity Bar */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-700">
                <div className="flex justify-between text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                  <span>Capacity</span>
                  <span>
                    {project.members?.length || 1} of {project.maxTeamSize || 4} spots filled
                  </span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-amber-400 h-full rounded-full transition-all"
                    style={{
                      width: `${Math.min(
                        100,
                        (((project.members?.length || 1) / (project.maxTeamSize || 4)) *
                          100)
                      )}%`,
                    }}
                  ></div>
                </div>
              </div>

              {/* Apply / Join CTA Button */}
              {!isOwner && user?.role !== 'admin' && (
                <div>
                  {isMember ? (
                    <div className="p-3 bg-emerald-50 text-emerald-800 text-center font-bold text-xs rounded-2xl border border-emerald-200">
                      ✓ You are a Team Member
                    </div>
                  ) : hasApplied ? (
                    <div className="p-3 bg-amber-50 text-amber-900 text-center font-bold text-xs rounded-2xl border border-amber-200">
                      <span className="flex items-center gap-1.5"><Hourglass className="w-4 h-4" /> Application Submitted (Pending Review)</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        if (!isAuthenticated) return toast.info('Please sign in to apply');
                        setApplyModalOpen(true);
                      }}
                      className="w-full py-3.5 bg-amber-400 hover:bg-amber-300 text-slate-900 font-extrabold text-sm rounded-2xl shadow-md transition-all hover:scale-102 flex items-center justify-center gap-2"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>Apply to Join Team</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Project Quick Meta Box */}
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm space-y-3.5 text-xs text-slate-600 dark:text-slate-300">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-500 dark:text-slate-400">Budget / Reward</span>
                <span className="font-bold text-slate-900 dark:text-white">{project.budget}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-500 dark:text-slate-400">Created</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {new Date(project.createdAt).toLocaleDateString()}
                </span>
              </div>
              {project.deadline && (
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-500 dark:text-slate-400">Deadline</span>
                  <span className="font-bold text-amber-700 dark:text-amber-500">
                    {new Date(project.deadline).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Application Modal */}
      {applyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-100 dark:border-slate-700 animate-in zoom-in-95">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1 font-display">
              Apply to {project.title}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
              Tell the project lead how you can contribute.
            </p>

            <form onSubmit={handleApply} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Proposed Role *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Frontend Developer, UI Designer, ML Engineer"
                  value={proposedRole}
                  onChange={(e) => setProposedRole(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Pitch / Message
                </label>
                <textarea
                  rows="3"
                  placeholder="Share relevant experience, tools you've used, or ideas..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3.5 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
                ></textarea>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Portfolio / GitHub Link
                </label>
                <input
                  type="url"
                  placeholder="https://github.com/yourname"
                  value={portfolioUrl}
                  onChange={(e) => setPortfolioUrl(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setApplyModalOpen(false)}
                  className="px-4 py-2 font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingApply}
                  className="px-6 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-900 font-bold rounded-xl text-xs shadow-md"
                >
                  {submittingApply ? 'Submitting...' : 'Submit Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
