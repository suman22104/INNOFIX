const Report = require('../models/Report');
const User = require('../models/User');

// @desc    Submit content or user report
// @route   POST /api/reports
// @access  Private
exports.createReport = async (req, res) => {
  try {
    const { targetType, targetId, reason, details } = req.body;

    if (!targetType || !targetId || !reason) {
      return res.status(400).json({ success: false, message: 'targetType, targetId, and reason are required' });
    }

    const report = await Report.create({
      reporter: req.user._id,
      targetType,
      targetId,
      reason,
      details: details || '',
    });

    res.status(201).json({
      success: true,
      message: 'Report submitted successfully. Our safety team will review it.',
      report,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Error submitting report' });
  }
};

// @desc    Get all reports (Admin)
// @route   GET /api/reports
// @access  Private (Admin)
exports.getReports = async (req, res) => {
  try {
    const { status = 'pending' } = req.query;
    const filter = status !== 'all' ? { status } : {};

    const reports = await Report.find(filter)
      .populate('reporter', 'fullName username email')
      .populate('resolvedBy', 'fullName username')
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({ success: true, count: reports.length, reports });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Error fetching reports' });
  }
};

// @desc    Resolve report (Admin)
// @route   PUT /api/reports/:id
// @access  Private (Admin)
exports.resolveReport = async (req, res) => {
  try {
    const { status, resolutionNotes } = req.body;
    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    report.status = status || 'reviewed';
    report.resolutionNotes = resolutionNotes || '';
    report.resolvedBy = req.user._id;
    await report.save();

    res.status(200).json({ success: true, message: 'Report updated', report });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Error resolving report' });
  }
};
