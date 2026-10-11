const Community = require('../models/Community');
const Post = require('../models/Post');
const User = require('../models/User');

// @desc    Get all communities with search & category filters
// @route   GET /api/communities
// @access  Public
exports.getCommunities = async (req, res) => {
  try {
    const { category, search } = req.query;
    let query = {};

    if (category && category !== 'all') {
      query.category = category;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } },
      ];
    }

    const communities = await Community.find(query)
      .populate('creator', 'fullName username avatar')
      .populate('members.user', 'fullName username avatar')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: communities.length,
      communities,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching communities',
    });
  }
};

// @desc    Get single community by slug or ID
// @route   GET /api/communities/:idOrSlug
// @access  Public
exports.getCommunity = async (req, res) => {
  try {
    const identifier = req.params.idOrSlug;
    const isObjectId = identifier.match(/^[0-9a-fA-F]{24}$/);

    const query = isObjectId ? { _id: identifier } : { slug: identifier };

    const community = await Community.findOne(query)
      .populate('creator', 'fullName username avatar role')
      .populate('members.user', 'fullName username avatar headline reputation');

    if (!community) {
      return res.status(404).json({
        success: false,
        message: 'Community not found',
      });
    }

    // Get posts in this community
    const posts = await Post.find({ community: community._id })
      .populate('author', 'fullName username avatar role')
      .populate('comments.user', 'fullName username avatar')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      community,
      posts,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching community',
    });
  }
};

// @desc    Create new community
// @route   POST /api/communities
// @access  Private
exports.createCommunity = async (req, res) => {
  try {
    const { name, category, description, icon, coverImage, privacy, rules, tags } =
      req.body;

    // Check if name already taken
    const existing = await Community.findOne({ name });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Community with this name already exists',
      });
    }

    const rulesArray = Array.isArray(rules)
      ? rules
      : typeof rules === 'string'
      ? rules.split('\n').map((r) => r.trim()).filter(Boolean)
      : [];

    const tagsArray = Array.isArray(tags)
      ? tags
      : typeof tags === 'string'
      ? tags.split(',').map((t) => t.trim()).filter(Boolean)
      : [];

    const community = await Community.create({
      name,
      category: category || 'General Tech',
      description,
      icon: icon || '💡',
      coverImage: coverImage || '',
      privacy: privacy || 'public',
      rules: rulesArray,
      tags: tagsArray,
      creator: req.user.id,
      members: [
        {
          user: req.user.id,
          role: 'admin',
          joinedAt: new Date(),
        },
      ],
    });

    res.status(201).json({
      success: true,
      message: 'Community created successfully!',
      community,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error creating community',
    });
  }
};

// @desc    Join community
// @route   POST /api/communities/:id/join
// @access  Private
exports.joinCommunity = async (req, res) => {
  try {
    const community = await Community.findById(req.params.id);

    if (!community) {
      return res.status(404).json({
        success: false,
        message: 'Community not found',
      });
    }

    const isMember = community.members.some(
      (m) => m.user.toString() === req.user.id
    );

    if (isMember) {
      return res.status(400).json({
        success: false,
        message: 'You are already a member of this community',
      });
    }

    community.members.push({
      user: req.user.id,
      role: 'member',
      joinedAt: new Date(),
    });

    await community.save();

    res.status(200).json({
      success: true,
      message: `Joined ${community.name}!`,
      community,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error joining community',
    });
  }
};

// @desc    Leave community
// @route   POST /api/communities/:id/leave
// @access  Private
exports.leaveCommunity = async (req, res) => {
  try {
    const community = await Community.findById(req.params.id);

    if (!community) {
      return res.status(404).json({
        success: false,
        message: 'Community not found',
      });
    }

    if (community.creator.toString() === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'The creator cannot leave the community. You can transfer ownership or delete it.',
      });
    }

    community.members = community.members.filter(
      (m) => m.user.toString() !== req.user.id
    );

    await community.save();

    res.status(200).json({
      success: true,
      message: `Left ${community.name}`,
      community,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error leaving community',
    });
  }
};
