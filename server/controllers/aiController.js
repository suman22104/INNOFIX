const svc = require('../services/recommendService');
const llm = require('../services/llmService');
const { logServed, logClick } = require('../services/aiLogService');
const Post = require('../models/Post');
const User = require('../models/User');

const ALL_TYPES = ['projects', 'events', 'opportunities', 'communities'];

// @desc    Personalised recommendations across projects, events, opportunities, communities
// @route   GET /api/ai/recommendations?types=projects,events&limit=6
// @access  Private
exports.getRecommendations = async (req, res) => {
  try {
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 6, 1), 12);
    const types = (req.query.types ? String(req.query.types).split(',') : ALL_TYPES)
      .map((t) => t.trim())
      .filter((t) => ALL_TYPES.includes(t));

    if (!types.length) {
      return res.status(400).json({ success: false, message: 'Invalid types' });
    }

    const [behavior, candidates] = await Promise.all([
      svc.loadBehavior(req.user),
      svc.loadCandidates(req.user, types),
    ]);

    const profile = svc.buildUserProfile(req.user, behavior);
    const strategy = profile.vec.size > 0 ? 'personalized' : 'trending';
    const recommendations = {};
    types.forEach((t) => {
      recommendations[t] = svc.rankItems(svc.SINGULAR[t], candidates[t] || [], profile, limit);
    });

    res.status(200).json({
      success: true,
      strategy,
      recommendations,
    });

    logServed(req.user, strategy, recommendations);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Error generating recommendations' });
  }
};

// @desc    People You May Know (PYMK) explainable social recommendations
// @route   GET /api/ai/people-you-may-know
// @access  Private
exports.getPeopleYouMayKnow = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 6, 15);
    const people = await svc.rankPeopleYouMayKnow(req.user, limit);

    res.status(200).json({
      success: true,
      count: people.length,
      people,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Error ranking people' });
  }
};

// @desc    Match score (0-100) + matched/missing skills for every active opportunity
// @route   GET /api/ai/match/opportunities
// @access  Private
exports.getOpportunityMatches = async (req, res) => {
  try {
    const Opportunity = svc.MODELS.opportunity;
    const [behavior, opps] = await Promise.all([
      svc.loadBehavior(req.user),
      Opportunity.find({ status: 'active' }).select('title type skills requirements description').limit(200).lean(),
    ]);
    const profile = svc.buildUserProfile(req.user, behavior);

    const matches = {};
    if (profile.vec.size > 0) {
      opps.forEach((o) => {
        matches[o._id] = svc.matchOpportunity(o, profile);
      });
    }
    res.status(200).json({ success: true, matches });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Error computing matches' });
  }
};

// @desc    "More like this" for a project, event, opportunity or community
// @route   GET /api/ai/similar/:type/:id
// @access  Public
exports.getSimilar = async (req, res) => {
  try {
    const { type, id } = req.params;
    const Model = svc.MODELS[type];
    if (!Model) {
      return res.status(400).json({ success: false, message: 'Invalid type' });
    }
    const source = await Model.findById(id).lean();
    if (!source) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }
    const pool = await Model.find({ _id: { $ne: id } }).sort({ createdAt: -1 }).limit(200).lean();
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 4, 1), 10);

    res.status(200).json({ success: true, similar: svc.similarItems(type, source, pool, limit) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Error finding similar items' });
  }
};

// @desc    Record that the user clicked a recommended item
// @route   POST /api/ai/track
// @access  Private
exports.trackClick = async (req, res) => {
  const ok = await logClick(req.user, req.body);
  if (!ok) return res.status(400).json({ success: false, message: 'Invalid item' });
  res.status(200).json({ success: true });
};

// @desc    AI Assistant: Improve Headline & Bio
// @route   POST /api/ai/assistant/improve-bio
// @access  Private
exports.improveBio = async (req, res) => {
  try {
    const { headline, bio, skills } = req.body;
    const result = await llm.improveProfileBio({
      headline: headline || req.user.headline,
      bio: bio || req.user.bio,
      skills: skills || req.user.skills,
    });
    res.status(200).json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Error improving bio' });
  }
};

// @desc    AI Assistant: Rewrite Post / Pitch
// @route   POST /api/ai/assistant/rewrite-pitch
// @access  Private
exports.rewritePitch = async (req, res) => {
  try {
    const { content, targetType } = req.body;
    if (!content) {
      return res.status(400).json({ success: false, message: 'Content is required' });
    }
    const result = await llm.rewriteContentPitch({ content, targetType });
    res.status(200).json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Error rewriting content' });
  }
};

// @desc    AI Assistant: Summarize Discussion Thread
// @route   POST /api/ai/assistant/summarize-thread
// @access  Private
exports.summarizeThread = async (req, res) => {
  try {
    const { comments } = req.body;
    const result = await llm.summarizeThread(comments);
    res.status(200).json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Error summarizing thread' });
  }
};

// @desc    AI Assistant: Team synergy & fit analysis
// @route   POST /api/ai/assistant/team-fit
// @access  Private
exports.analyzeTeamFit = async (req, res) => {
  try {
    const { applicantSkills, projectRequiredSkills, applicantBio } = req.body;
    const result = await llm.analyzeTeamMatch({
      applicantSkills,
      projectRequiredSkills,
      applicantBio,
    });
    res.status(200).json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Error analyzing team fit' });
  }
};

// @desc    Admin: Get Content Moderation Queue
// @route   GET /api/ai/moderation/queue
// @access  Private (Admin)
exports.getModerationQueue = async (req, res) => {
  try {
    const { status = 'flagged' } = req.query;
    const posts = await Post.find({ 'moderation.status': status })
      .populate('author', 'fullName username avatar role email')
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      count: posts.length,
      queue: posts,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Error fetching moderation queue' });
  }
};

// @desc    Admin: Review Moderated Item (Approve / Block / Remove)
// @route   PUT /api/ai/moderation/:id
// @access  Private (Admin)
exports.reviewModerationItem = async (req, res) => {
  try {
    const { action, notes } = req.body; // action: 'approve' | 'block' | 'delete'
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    if (action === 'delete') {
      await Post.findByIdAndDelete(req.params.id);
      return res.status(200).json({ success: true, message: 'Post permanently deleted' });
    }

    post.moderation.status = action === 'approve' ? 'approved' : 'blocked';
    post.moderation.reviewedBy = req.user._id;
    if (notes) post.moderation.reason = notes;
    await post.save();

    res.status(200).json({ success: true, message: `Post has been ${post.moderation.status}`, post });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Error updating moderation item' });
  }
};
