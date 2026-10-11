const Project = require('../models/Project');
const Event = require('../models/Event');
const Opportunity = require('../models/Opportunity');
const Announcement = require('../models/Announcement');
const Post = require('../models/Post');
const Community = require('../models/Community');
const User = require('../models/User');

// @desc    Get dashboard / platform analytics metrics
// @route   GET /api/analytics
// @access  Public
exports.getAnalytics = async (req, res) => {
  try {
    const [
      totalUsers,
      activeProjects,
      completedProjects,
      upcomingEvents,
      activeOpportunities,
      totalPosts,
      totalCommunities,
      totalAnnouncements,
      categoryStats,
      topUsers,
      recentProjects,
      recentEvents,
    ] = await Promise.all([
      User.countDocuments(),
      Project.countDocuments({ status: { $ne: 'Completed' } }),
      Project.countDocuments({ status: 'Completed' }),
      Event.countDocuments({ status: 'upcoming' }),
      Opportunity.countDocuments({ status: 'active' }),
      Post.countDocuments(),
      Community.countDocuments(),
      Announcement.countDocuments(),
      Project.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      User.find()
        .select('fullName username avatar role reputation headline')
        .sort({ reputation: -1 })
        .limit(5),
      Project.find()
        .populate('creator', 'fullName username avatar')
        .sort({ createdAt: -1 })
        .limit(4),
      Event.find({ status: 'upcoming' })
        .populate('organizer', 'fullName username avatar')
        .sort({ startDate: 1 })
        .limit(4),
    ]);

    res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        activeProjects,
        completedProjects,
        upcomingEvents,
        activeOpportunities,
        totalPosts,
        totalCommunities,
        totalAnnouncements,
      },
      categoryDistribution: categoryStats.map((item) => ({
        category: item._id,
        count: item.count,
      })),
      topInnovators: topUsers,
      recentProjects,
      recentEvents,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching analytics metrics',
    });
  }
};
