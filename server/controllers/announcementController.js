const Announcement = require('../models/Announcement');

// @desc    Get all announcements
// @route   GET /api/announcements
// @access  Public
exports.getAnnouncements = async (req, res) => {
  try {
    const { category, targetRole } = req.query;
    let query = {};

    if (category && category !== 'all') {
      query.category = category;
    }

    if (targetRole && targetRole !== 'all') {
      query.targetRole = { $in: ['all', targetRole] };
    }

    const announcements = await Announcement.find(query)
      .populate('author', 'fullName username avatar role')
      .sort({ isPinned: -1, createdAt: -1 });

    res.status(200).json({
      success: true,
      count: announcements.length,
      announcements,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching announcements',
    });
  }
};

// @desc    Create announcement
// @route   POST /api/announcements
// @access  Private (Company / Admin)
exports.createAnnouncement = async (req, res) => {
  try {
    const { title, content, category, priority, targetRole, isPinned } = req.body;

    const announcement = await Announcement.create({
      title,
      content,
      category: category || 'General',
      priority: priority || 'medium',
      targetRole: targetRole || 'all',
      isPinned: !!isPinned,
      author: req.user.id,
    });

    const populated = await Announcement.findById(announcement._id).populate(
      'author',
      'fullName username avatar role'
    );

    res.status(201).json({
      success: true,
      message: 'Announcement published successfully!',
      announcement: populated,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error creating announcement',
    });
  }
};

// @desc    Toggle pinned announcement
// @route   PUT /api/announcements/:id/pin
// @access  Private (Admin only)
exports.togglePin = async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);

    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found',
      });
    }

    announcement.isPinned = !announcement.isPinned;
    await announcement.save();

    res.status(200).json({
      success: true,
      isPinned: announcement.isPinned,
      announcement,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating pinned status',
    });
  }
};

// @desc    Delete announcement
// @route   DELETE /api/announcements/:id
// @access  Private (Author / Admin)
exports.deleteAnnouncement = async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);

    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found',
      });
    }

    if (
      announcement.author.toString() !== req.user.id &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this announcement',
      });
    }

    await announcement.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Announcement deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error deleting announcement',
    });
  }
};
