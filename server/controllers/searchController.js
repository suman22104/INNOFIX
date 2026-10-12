const User = require('../models/User');
const Post = require('../models/Post');
const Project = require('../models/Project');
const Community = require('../models/Community');
const Event = require('../models/Event');
const Opportunity = require('../models/Opportunity');

const EMPTY_RESULTS = {
  users: [],
  events: [],
  opportunities: [],
  projects: [],
  communities: [],
  posts: [],
};

// Escape user input so characters like ( [ + * never break the RegExp
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// .lean() skips the User.avatarUrl virtual, so rebuild it for search results
const withAvatar = (u) => {
  if (!u || typeof u !== 'object') return u;
  let avatarUrl;
  if (u.avatar && u.avatar.startsWith('http')) avatarUrl = u.avatar;
  else if (u.avatar) avatarUrl = `/uploads/${u.avatar}`;
  else {
    avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(
      u.fullName || u.username || 'User'
    )}&background=FBC02D&color=111827&bold=true&rounded=true`;
  }
  return { ...u, avatarUrl };
};

// @desc    Global omni-search across people, events, opportunities, projects, communities, posts
// @route   GET /api/search?q=&type=all|users|events|opportunities|projects|communities|posts&limit=10
// @access  Private (any logged-in role)
exports.globalSearch = async (req, res) => {
  try {
    const { q, type = 'all', limit = 10 } = req.query;

    // "@alex" finds the user alex, "#ai" finds the tag ai
    const query = (q || '').toString().trim().replace(/^[@#]+/, '').trim();

    if (!query) {
      return res.status(200).json({ success: true, query: '', results: EMPTY_RESULTS });
    }

    const regex = new RegExp(escapeRegex(query), 'i');
    const tokens = query.split(/\s+/).filter(Boolean);
    const parsedLimit = Math.min(parseInt(limit, 10) || 10, 30);
    const me = req.user;
    const wants = (t) => type === 'all' || type === t;

    const searches = {};

    // ---- People: name, @username, headline, skills, bio, company ----
    if (wants('users')) {
      const nameOr = [
        { fullName: regex },
        { username: regex },
        { headline: regex },
        { skills: regex },
        { bio: regex },
        { companyName: regex },
        { industry: regex },
      ];
      // "john doe" should also find "John Michael Doe"
      if (tokens.length > 1) {
        nameOr.push({
          $and: tokens.map((t) => ({ fullName: new RegExp(escapeRegex(t), 'i') })),
        });
      }
      searches.users = User.find({
        role: { $ne: 'admin' },
        'privacy.profileVisibility': { $ne: 'private' },
        blockedUsers: { $ne: me._id },
        _id: { $nin: me.blockedUsers || [] },
        $or: nameOr,
      })
        .select('fullName username avatar role headline skills reputation companyName location')
        .sort({ reputation: -1 })
        .limit(parsedLimit)
        .lean()
        .then((rows) => rows.map(withAvatar));
    }

    // ---- Events ----
    if (wants('events')) {
      searches.events = Event.find({
        $or: [
          { title: regex },
          { description: regex },
          { shortDescription: regex },
          { organizerName: regex },
          { tags: regex },
          { venueOrLink: regex },
          { type: regex },
        ],
      })
        .select('-attendees')
        .sort({ startDate: -1 })
        .limit(parsedLimit)
        .lean();
    }

    // ---- Opportunities ----
    if (wants('opportunities')) {
      searches.opportunities = Opportunity.find({
        $or: [
          { title: regex },
          { companyName: regex },
          { description: regex },
          { skills: regex },
          { requirements: regex },
          { type: regex },
          { location: regex },
        ],
      })
        .select('-applicants')
        .populate('creator', 'fullName username avatar role companyName')
        .sort({ createdAt: -1 })
        .limit(parsedLimit)
        .lean()
        .then((rows) => rows.map((o) => ({ ...o, creator: withAvatar(o.creator) })));
    }

    // ---- Projects ----
    if (wants('projects')) {
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
        .lean()
        .then((rows) => rows.map((p) => ({ ...p, creator: withAvatar(p.creator) })));
    }

    // ---- Communities (private ones only for their members) ----
    if (wants('communities')) {
      searches.communities = Community.find({
        $and: [
          { $or: [{ name: regex }, { description: regex }, { category: regex }, { tags: regex }] },
          { $or: [{ privacy: { $ne: 'private' } }, { 'members.user': me._id }] },
        ],
      })
        .select('name slug category description icon privacy tags')
        .sort({ createdAt: -1 })
        .limit(parsedLimit)
        .lean();
    }

    // ---- Posts ----
    if (wants('posts')) {
      searches.posts = Post.find({
        'moderation.status': { $ne: 'blocked' },
        $or: [{ content: regex }, { tags: regex }, { hashtags: regex }],
      })
        .populate('author', 'fullName username avatar role')
        .sort({ createdAt: -1 })
        .limit(parsedLimit)
        .lean()
        .then((rows) => rows.map((p) => ({ ...p, author: withAvatar(p.author) })));
    }

    const keys = Object.keys(searches);
    const resolved = await Promise.all(keys.map((k) => searches[k]));
    const results = { ...EMPTY_RESULTS, ...Object.fromEntries(keys.map((k, i) => [k, resolved[i]])) };

    res.status(200).json({ success: true, query, results });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Error executing search' });
  }
};
