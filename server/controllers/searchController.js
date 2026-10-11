const User = require('../models/User');
const Post = require('../models/Post');
const Project = require('../models/Project');
const Community = require('../models/Community');
const Event = require('../models/Event');
const Opportunity = require('../models/Opportunity');

// @desc    Global omni-search across people, posts, projects, communities, events
// @route   GET /api/search
// @access  Public
exports.globalSearch = async (req, res) => {
  try {
    const { q, type = 'all', limit = 10 } = req.query;

    if (!q || !q.trim()) {
      return res.status(200).json({
        success: true,
        query: '',
        results: { users: [], posts: [], projects: [], communities: [], events: [], opportunities: [] },
      });
    }

    const query = q.trim();
    const regex = new RegExp(query, 'i');
    const parsedLimit = Math.min(parseInt(limit, 10) || 10, 30);

    const searches = {};

    if (type === 'all' || type === 'users') {
      searches.users = User.find({
        role: { $ne: 'admin' },
        $or: [
          { fullName: regex },
          { username: regex },
          { headline: regex },
          { skills: regex },
          { bio: regex },
        ],
      })
        .select('fullName username avatar role headline skills reputation companyName')
        .limit(parsedLimit)
        .lean();
    }

    if (type === 'all' || type === 'posts') {
      searches.posts = Post.find({
        'moderation.status': { $ne: 'blocked' },
        $or: [
          { content: regex },
          { tags: regex },
          { hashtags: regex },
        ],
      })
        .populate('author', 'fullName username avatar role')
        .sort({ createdAt: -1 })
        .limit(parsedLimit)
        .lean();
    }

    if (type === 'all' || type === 'projects') {
      searches.projects = Project.find({
        $or: [
          { title: regex },
          { shortSummary: regex },
          { description: regex },
          { requiredSkills: regex },
          { category: regex },
        ],
      })
        .populate('creator', 'fullName username avatar role')
        .sort({ createdAt: -1 })
        .limit(parsedLimit)
        .lean();
    }

    if (type === 'all' || type === 'communities') {
      searches.communities = Community.find({
        $or: [
          { name: regex },
          { description: regex },
          { category: regex },
          { tags: regex },
        ],
      })
        .sort({ createdAt: -1 })
        .limit(parsedLimit)
        .lean();
    }

    if (type === 'all' || type === 'events') {
      searches.events = Event.find({
        $or: [
          { title: regex },
          { description: regex },
          { tags: regex },
          { location: regex },
        ],
      })
        .sort({ startDate: 1 })
        .limit(parsedLimit)
        .lean();
    }

    if (type === 'all' || type === 'opportunities') {
      searches.opportunities = Opportunity.find({
        $or: [
          { title: regex },
          { description: regex },
          { skills: regex },
          { type: regex },
        ],
      })
        .populate('creator', 'fullName username avatar role companyName')
        .sort({ createdAt: -1 })
        .limit(parsedLimit)
        .lean();
    }

    const keys = Object.keys(searches);
    const resolved = await Promise.all(keys.map((k) => searches[k]));
    const results = Object.fromEntries(keys.map((k, i) => [k, resolved[i]]));

    res.status(200).json({
      success: true,
      query,
      results,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Error executing search' });
  }
};
