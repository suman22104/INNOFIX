const User = require('../models/User');
const Post = require('../models/Post');
const Project = require('../models/Project');
const Event = require('../models/Event');
const Opportunity = require('../models/Opportunity');
const ReputationEvent = require('../models/ReputationEvent');
const { createNotification } = require('./notificationController');

// @desc    Follow a user
// @route   POST /api/users/:id/follow
// @access  Private
exports.followUser = async (req, res) => {
  try {
    const targetUserId = req.params.id;
    const currentUserId = req.user._id;

    if (String(targetUserId) === String(currentUserId)) {
      return res.status(400).json({ success: false, message: 'You cannot follow yourself' });
    }

    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const currentUser = await User.findById(currentUserId);

    // Check if already following
    const isFollowing = currentUser.following.some(
      (id) => String(id) === String(targetUserId)
    );

    if (isFollowing) {
      return res.status(400).json({ success: false, message: 'Already following this user' });
    }

    // Add to following and followers
    currentUser.following.push(targetUserId);
    targetUser.followers.push(currentUserId);

    // Increment reputation for target user
    const { award } = require('../services/reputationService');
    await award(targetUser._id, 'follower_gained', currentUserId, 'user');

    await Promise.all([currentUser.save(), targetUser.save()]);

    // Send real-time notification
    await createNotification(req.app, {
      recipient: targetUserId,
      sender: currentUserId,
      type: 'follow',
      title: 'New Follower',
      message: `${currentUser.fullName} started following you.`,
      link: `/profile?username=${currentUser.username}`,
    });

    res.status(200).json({
      success: true,
      message: `Now following ${targetUser.fullName}`,
      followingCount: currentUser.following.length,
      followersCount: targetUser.followers.length,
      user: currentUser,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Error following user' });
  }
};

// @desc    Unfollow a user
// @route   POST /api/users/:id/unfollow
// @access  Private
exports.unfollowUser = async (req, res) => {
  try {
    const targetUserId = req.params.id;
    const currentUserId = req.user._id;

    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const currentUser = await User.findById(currentUserId);

    currentUser.following = currentUser.following.filter(
      (id) => String(id) !== String(targetUserId)
    );
    targetUser.followers = targetUser.followers.filter(
      (id) => String(id) !== String(currentUserId)
    );

    await Promise.all([currentUser.save(), targetUser.save()]);

    res.status(200).json({
      success: true,
      message: `Unfollowed ${targetUser.fullName}`,
      followingCount: currentUser.following.length,
      followersCount: targetUser.followers.length,
      user: currentUser,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Error unfollowing user' });
  }
};

// @desc    Get user followers
// @route   GET /api/users/:id/followers
// @access  Public
exports.getUserFollowers = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate('followers', 'fullName username avatar role headline skills reputation')
      .lean();

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({
      success: true,
      count: user.followers?.length || 0,
      followers: user.followers || [],
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Error fetching followers' });
  }
};

// @desc    Get user following
// @route   GET /api/users/:id/following
// @access  Public
exports.getUserFollowing = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate('following', 'fullName username avatar role headline skills reputation')
      .lean();

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({
      success: true,
      count: user.following?.length || 0,
      following: user.following || [],
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Error fetching following' });
  }
};

// @desc    Get public profile by username or id
// @route   GET /api/users/profile/:usernameOrId
// @access  Public
exports.getUserProfile = async (req, res) => {
  try {
    const param = req.params.usernameOrId;
    const isObjectId = param.match(/^[0-9a-fA-F]{24}$/);

    const query = isObjectId ? { $or: [{ _id: param }, { username: param.toLowerCase() }] } : { username: param.toLowerCase() };
    const user = await User.findOne(query)
      .populate('followers', 'fullName username avatar role')
      .populate('following', 'fullName username avatar role')
      .lean();

    if (!user || user.role === 'admin') {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Get user's recent posts and projects
    const [posts, projects] = await Promise.all([
      Post.find({ author: user._id, 'moderation.status': { $ne: 'blocked' } })
        .populate('author', 'fullName username avatar role')
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),
      Project.find({ $or: [{ creator: user._id }, { 'members.user': user._id }] })
        .populate('creator', 'fullName username avatar role')
        .sort({ createdAt: -1 })
        .limit(6)
        .lean(),
    ]);

    res.status(200).json({
      success: true,
      user,
      posts,
      projects,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Error fetching profile' });
  }
};

// @desc    Toggle bookmark item
// @route   POST /api/users/bookmarks/toggle
// @access  Private
exports.toggleBookmark = async (req, res) => {
  try {
    const { itemType, itemId } = req.body;
    if (!itemType || !itemId) {
      return res.status(400).json({ success: false, message: 'itemType and itemId required' });
    }

    const user = await User.findById(req.user._id);
    const existingIndex = user.bookmarks.findIndex(
      (b) => b.itemType === itemType && String(b.itemId) === String(itemId)
    );

    let bookmarked = false;
    if (existingIndex > -1) {
      user.bookmarks.splice(existingIndex, 1);
      bookmarked = false;
    } else {
      user.bookmarks.push({ itemType, itemId });
      bookmarked = true;
    }

    await user.save();

    res.status(200).json({
      success: true,
      bookmarked,
      bookmarks: user.bookmarks,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Error toggling bookmark' });
  }
};

// @desc    Get user's bookmarked items populated
// @route   GET /api/users/bookmarks
// @access  Private
exports.getBookmarks = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).lean();
    const bookmarks = user.bookmarks || [];

    const postIds = bookmarks.filter((b) => b.itemType === 'post').map((b) => b.itemId);
    const projectIds = bookmarks.filter((b) => b.itemType === 'project').map((b) => b.itemId);
    const opportunityIds = bookmarks.filter((b) => b.itemType === 'opportunity').map((b) => b.itemId);
    const eventIds = bookmarks.filter((b) => b.itemType === 'event').map((b) => b.itemId);

    const [posts, projects, opportunities, events] = await Promise.all([
      postIds.length ? Post.find({ _id: { $in: postIds } }).populate('author', 'fullName username avatar role').lean() : [],
      projectIds.length ? Project.find({ _id: { $in: projectIds } }).populate('creator', 'fullName username avatar role').lean() : [],
      opportunityIds.length ? Opportunity.find({ _id: { $in: opportunityIds } }).populate('creator', 'fullName username avatar role').lean() : [],
      eventIds.length ? Event.find({ _id: { $in: eventIds } }).lean() : [],
    ]);

    res.status(200).json({
      success: true,
      bookmarks: {
        posts,
        projects,
        opportunities,
        events,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Error fetching bookmarks' });
  }
};

// @desc    Get reputation leaderboard
// @route   GET /api/users/leaderboard
// @access  Public
exports.getLeaderboard = async (req, res) => {
  try {
    const { role, category, period = 'all', limit = 25 } = req.query;
    const filter = { role: { $ne: 'admin' } };
    if (role && ['student', 'company'].includes(role)) {
      filter.role = role;
    }
    if (category) {
      filter.industry = category;
    }

    let sortField = 'reputation';
    if (period === 'week') sortField = 'weeklyPoints';
    else if (period === 'month') sortField = 'monthlyPoints';

    const leaders = await User.find(filter)
      .select('fullName username avatar role headline skills reputation weeklyPoints monthlyPoints badges companyName')
      .sort({ [sortField]: -1 })
      .limit(parseInt(limit, 10))
      .lean();

    res.status(200).json({
      success: true,
      count: leaders.length,
      leaders,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Error fetching leaderboard' });
  }
};

// @desc    Get current user's leaderboard position
// @route   GET /api/users/leaderboard/me
// @access  Private
exports.getMyLeaderboardPosition = async (req, res) => {
  try {
    const { period = 'all' } = req.query;
    
    let sortField = 'reputation';
    if (period === 'week') sortField = 'weeklyPoints';
    else if (period === 'month') sortField = 'monthlyPoints';

    const user = await User.findById(req.user.id).select(`reputation weeklyPoints monthlyPoints`);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const score = user[sortField] || 0;
    
    // Count how many users have a strictly higher score, plus 1 for rank
    const rank = await User.countDocuments({ [sortField]: { $gt: score } }) + 1;

    res.status(200).json({
      success: true,
      rank,
      score,
      period
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Error fetching position' });
  }
};

// @desc    Get reputation scoring rules
// @route   GET /api/users/reputation/rules
// @access  Public
exports.getReputationRules = async (req, res) => {
  try {
    const { getRules } = require('../services/reputationService');
    res.status(200).json({
      success: true,
      ...getRules()
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Error fetching rules' });
  }
};

// @desc    Get user's reputation history
// @route   GET /api/users/:id/reputation
// @access  Public
exports.getUserReputationHistory = async (req, res) => {
  try {
    const history = await ReputationEvent.find({ user: req.params.id })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    res.status(200).json({
      success: true,
      count: history.length,
      history,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Error fetching reputation history' });
  }
};

// @desc    Export full user data (GDPR / Portability)
// @route   GET /api/users/export-data
// @access  Private
exports.exportUserData = async (req, res) => {
  try {
    const userId = req.user._id;
    const [user, posts, projects] = await Promise.all([
      User.findById(userId).select('-password').lean(),
      Post.find({ author: userId }).lean(),
      Project.find({ $or: [{ creator: userId }, { 'members.user': userId }] }).lean(),
    ]);

    res.status(200).json({
      success: true,
      exportTimestamp: new Date(),
      data: {
        profile: user,
        posts,
        projects,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Error exporting user data' });
  }
};

// @desc    Delete account and purge user data
// @route   DELETE /api/users/account
// @access  Private
exports.deleteAccount = async (req, res) => {
  try {
    const userId = req.user._id;
    await Promise.all([
      User.findByIdAndDelete(userId),
      Post.deleteMany({ author: userId }),
      Project.updateMany({}, { $pull: { members: { user: userId }, applications: { user: userId }, likes: userId } }),
    ]);

    res.status(200).json({ success: true, message: 'Account deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Error deleting account' });
  }
};
