const Opportunity = require('../models/Opportunity');
const User = require('../models/User');

// @desc    Get all opportunities with filters (type, workplaceType, search)
// @route   GET /api/opportunities
// @access  Public
exports.getOpportunities = async (req, res) => {
  try {
    const { type, workplaceType, search, status } = req.query;
    let query = {};

    if (type && type !== 'all') {
      query.type = type;
    }

    if (workplaceType && workplaceType !== 'all') {
      query.workplaceType = workplaceType;
    }

    if (status && status !== 'all') {
      query.status = status;
    } else {
      query.status = 'active';
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { companyName: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } },
        { skills: { $in: [new RegExp(search, 'i')] } },
      ];
    }

    const opportunities = await Opportunity.find(query)
      .populate('creator', 'fullName username avatar role companyName')
      .populate('applicants.user', 'fullName username avatar')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: opportunities.length,
      opportunities,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching opportunities',
    });
  }
};

// @desc    Get single opportunity by ID
// @route   GET /api/opportunities/:id
// @access  Public
exports.getOpportunityById = async (req, res) => {
  try {
    const opportunity = await Opportunity.findById(req.params.id)
      .populate('creator', 'fullName username avatar role companyName companyWebsite bio')
      .populate('applicants.user', 'fullName username avatar email headline');

    if (!opportunity) {
      return res.status(404).json({
        success: false,
        message: 'Opportunity not found',
      });
    }

    res.status(200).json({
      success: true,
      opportunity,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching opportunity',
    });
  }
};

// @desc    Create new opportunity
// @route   POST /api/opportunities
// @access  Private (Company / Admin)
exports.createOpportunity = async (req, res) => {
  try {
    const {
      title,
      companyName,
      type,
      workplaceType,
      location,
      salaryOrStipend,
      description,
      requirements,
      skills,
      applyUrlOrEmail,
      deadline,
    } = req.body;

    const reqsArray = Array.isArray(requirements)
      ? requirements
      : typeof requirements === 'string'
      ? requirements.split('\n').map((r) => r.trim()).filter(Boolean)
      : [];

    const skillsArray = Array.isArray(skills)
      ? skills
      : typeof skills === 'string'
      ? skills.split(',').map((s) => s.trim()).filter(Boolean)
      : [];

    const opportunity = await Opportunity.create({
      title,
      companyName: companyName || req.user.companyName || req.user.fullName,
      creator: req.user.id,
      type: type || 'internship',
      workplaceType: workplaceType || 'Remote',
      location: location || 'Worldwide',
      salaryOrStipend: salaryOrStipend || 'Competitive',
      description,
      requirements: reqsArray,
      skills: skillsArray,
      applyUrlOrEmail,
      deadline: deadline || null,
    });

    res.status(201).json({
      success: true,
      message: 'Opportunity posted successfully!',
      opportunity,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error creating opportunity',
    });
  }
};

// @desc    Apply for opportunity
// @route   POST /api/opportunities/:id/apply
// @access  Private
exports.applyOpportunity = async (req, res) => {
  try {
    const opportunity = await Opportunity.findById(req.params.id);

    if (!opportunity) {
      return res.status(404).json({
        success: false,
        message: 'Opportunity not found',
      });
    }

    const alreadyApplied = opportunity.applicants.some(
      (a) => a.user.toString() === req.user.id
    );

    if (alreadyApplied) {
      return res.status(400).json({
        success: false,
        message: 'You have already applied for this opportunity',
      });
    }

    opportunity.applicants.push({
      user: req.user.id,
      resumeUrl: req.body.resumeUrl || '',
      note: req.body.note || '',
      appliedAt: new Date(),
    });

    await opportunity.save();

    res.status(200).json({
      success: true,
      message: 'Application submitted successfully!',
      opportunity,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error submitting application',
    });
  }
};

// @desc    Delete opportunity
// @route   DELETE /api/opportunities/:id
// @access  Private (Creator / Admin)
exports.deleteOpportunity = async (req, res) => {
  try {
    const opportunity = await Opportunity.findById(req.params.id);

    if (!opportunity) {
      return res.status(404).json({
        success: false,
        message: 'Opportunity not found',
      });
    }

    if (
      opportunity.creator.toString() !== req.user.id &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this opportunity',
      });
    }

    await opportunity.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Opportunity deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error deleting opportunity',
    });
  }
};
