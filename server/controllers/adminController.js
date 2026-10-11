const mongoose = require('mongoose');
const RecommendationLog = require('../models/RecommendationLog');
const User = require('../models/User');
const { validatePassword, EMAIL_REGEX, USERNAME_REGEX } = require('../utils/validators');

const TYPES = ['project', 'event', 'opportunity', 'community'];
const clampDays = (v, def) => Math.min(Math.max(parseInt(v, 10) || def, 1), 90);
const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const pct = (a, b) => (b ? Math.round((a / b) * 1000) / 10 : 0);

// Midnight UTC, (days - 1) days ago => window covers `days` calendar days including today
const sinceDate = (days) => {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - (days - 1));
  return d;
};

// @desc    Headline numbers + daily series for AI recommendation activity
// @route   GET /api/admin/ai/overview?days=14
exports.getOverview = async (req, res) => {
  try {
    const days = clampDays(req.query.days, 14);
    const since = sinceDate(days);
    const inRange = { createdAt: { $gte: since } };

    const [served, serveByType, clickByType, dailyRaw, totalUsers, usersWithSkills] = await Promise.all([
      RecommendationLog.aggregate([
        { $match: { event: 'served', ...inRange } },
        {
          $group: {
            _id: null,
            requests: { $sum: 1 },
            impressions: { $sum: { $size: '$items' } },
            users: { $addToSet: '$user' },
            personalized: { $sum: { $cond: [{ $eq: ['$strategy', 'personalized'] }, 1, 0] } },
          },
        },
      ]),
      RecommendationLog.aggregate([
        { $match: { event: 'served', ...inRange } },
        { $unwind: '$items' },
        { $group: { _id: '$items.itemType', impressions: { $sum: 1 }, avgScore: { $avg: '$items.score' } } },
      ]),
      RecommendationLog.aggregate([
        { $match: { event: 'click', ...inRange } },
        { $unwind: '$items' },
        { $group: { _id: '$items.itemType', clicks: { $sum: 1 } } },
      ]),
      RecommendationLog.aggregate([
        { $match: inRange },
        {
          $group: {
            _id: { day: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, event: '$event' },
            n: { $sum: 1 },
          },
        },
      ]),
      User.countDocuments(),
      User.countDocuments({ 'skills.0': { $exists: true } }),
    ]);

    const s = served[0] || { requests: 0, impressions: 0, users: [], personalized: 0 };
    const clickMap = Object.fromEntries(clickByType.map((c) => [c._id, c.clicks]));
    const serveMap = Object.fromEntries(serveByType.map((c) => [c._id, c]));
    const totalClicks = Object.values(clickMap).reduce((a, b) => a + b, 0);

    const byType = TYPES.map((t) => {
      const imp = serveMap[t]?.impressions || 0;
      const clk = clickMap[t] || 0;
      const avg = serveMap[t]?.avgScore;
      return {
        type: t,
        impressions: imp,
        clicks: clk,
        ctr: pct(clk, imp),
        avgScore: avg === null || avg === undefined ? null : Math.round(avg),
      };
    });

    const dayMap = {};
    dailyRaw.forEach((r) => {
      dayMap[r._id.day] = dayMap[r._id.day] || { requests: 0, clicks: 0 };
      if (r._id.event === 'served') dayMap[r._id.day].requests = r.n;
      else dayMap[r._id.day].clicks = r.n;
    });
    const daily = [];
    for (let i = 0; i < days; i += 1) {
      const d = new Date(since);
      d.setUTCDate(d.getUTCDate() + i);
      const key = d.toISOString().slice(0, 10);
      daily.push({ date: key, requests: dayMap[key]?.requests || 0, clicks: dayMap[key]?.clicks || 0 });
    }

    res.status(200).json({
      success: true,
      days,
      totals: {
        requests: s.requests,
        impressions: s.impressions,
        uniqueUsers: s.users.length,
        clicks: totalClicks,
        ctr: pct(totalClicks, s.impressions),
        personalizedShare: pct(s.personalized, s.requests),
        totalUsers,
        usersWithSkills,
      },
      byType,
      daily,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Error loading overview' });
  }
};

// @desc    Paginated, filterable log of recommendations served / clicked
// @route   GET /api/admin/ai/logs?page=&limit=&event=&strategy=&type=&search=&user=
exports.getLogs = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
    const { event, strategy, type, search, user } = req.query;
    const q = {};

    if (['served', 'click'].includes(event)) q.event = event;
    if (['personalized', 'trending'].includes(strategy)) q.strategy = strategy;
    if (TYPES.includes(type)) q['items.itemType'] = type;
    if (user && mongoose.isValidObjectId(user)) q.user = user;

    if (!q.user && search && String(search).trim()) {
      const rx = new RegExp(escapeRegex(String(search).trim().slice(0, 50)), 'i');
      const ids = await User.find({ $or: [{ username: rx }, { fullName: rx }, { email: rx }] })
        .select('_id')
        .limit(100)
        .lean();
      q.user = { $in: ids.map((u) => u._id) };
    }

    const [logs, total] = await Promise.all([
      RecommendationLog.find(q)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('user', 'fullName username email role')
        .lean(),
      RecommendationLog.countDocuments(q),
    ]);

    res.status(200).json({ success: true, page, pages: Math.max(Math.ceil(total / limit), 1), total, logs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Error loading logs' });
  }
};

// @desc    Per-user recommendation activity summary
// @route   GET /api/admin/ai/users?days=30
exports.getUserActivity = async (req, res) => {
  try {
    const days = clampDays(req.query.days, 30);
    const isServed = { $eq: ['$event', 'served'] };

    const rows = await RecommendationLog.aggregate([
      { $match: { createdAt: { $gte: sinceDate(days) } } },
      {
        $group: {
          _id: '$user',
          requests: { $sum: { $cond: [isServed, 1, 0] } },
          impressions: { $sum: { $cond: [isServed, { $size: '$items' }, 0] } },
          clicks: { $sum: { $cond: [{ $eq: ['$event', 'click'] }, 1, 0] } },
          personalized: {
            $sum: { $cond: [{ $and: [isServed, { $eq: ['$strategy', 'personalized'] }] }, 1, 0] },
          },
          lastActive: { $max: '$createdAt' },
        },
      },
      { $sort: { lastActive: -1 } },
      { $limit: 100 },
      { $lookup: { from: User.collection.name, localField: '_id', foreignField: '_id', as: 'u' } },
      { $unwind: '$u' },
      {
        $project: {
          requests: 1,
          impressions: 1,
          clicks: 1,
          personalized: 1,
          lastActive: 1,
          fullName: '$u.fullName',
          username: '$u.username',
          email: '$u.email',
          role: '$u.role',
          skillsCount: { $size: { $ifNull: ['$u.skills', []] } },
        },
      },
    ]);

    const users = rows.map((r) => ({
      userId: r._id,
      fullName: r.fullName,
      username: r.username,
      email: r.email,
      role: r.role,
      skillsCount: r.skillsCount,
      requests: r.requests,
      impressions: r.impressions,
      clicks: r.clicks,
      ctr: pct(r.clicks, r.impressions),
      personalizedShare: pct(r.personalized, r.requests),
      lastActive: r.lastActive,
    }));

    res.status(200).json({ success: true, days, users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Error loading user activity' });
  }
};

// @desc    Most recommended and most clicked items
// @route   GET /api/admin/ai/top-items?days=30
exports.getTopItems = async (req, res) => {
  try {
    const days = clampDays(req.query.days, 30);
    const since = sinceDate(days);

    const top = (event) =>
      RecommendationLog.aggregate([
        { $match: { event, createdAt: { $gte: since } } },
        { $unwind: '$items' },
        {
          $group: {
            _id: { t: '$items.itemType', id: '$items.itemId' },
            title: { $last: '$items.title' },
            count: { $sum: 1 },
            users: { $addToSet: '$user' },
            avgScore: { $avg: '$items.score' },
          },
        },
        {
          $project: {
            _id: 0,
            itemType: '$_id.t',
            itemId: '$_id.id',
            title: 1,
            count: 1,
            uniqueUsers: { $size: '$users' },
            avgScore: { $round: ['$avgScore', 0] },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]);

    const [recommended, clicked] = await Promise.all([top('served'), top('click')]);
    res.status(200).json({ success: true, days, recommended, clicked });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Error loading top items' });
  }
};

const AdminAction = require('../models/AdminAction');

// @desc    Get all admin users
// @route   GET /api/admin/admins
exports.getAdmins = async (req, res) => {
  try {
    const admins = await User.find({ role: 'admin' })
      .select('fullName username email avatar role createdAt lastLogin mustChangePassword')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: admins.length,
      admins,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Error loading admins' });
  }
};

// @desc    Create a new admin or promote an existing user
// @route   POST /api/admin/admins
exports.createOrPromoteAdmin = async (req, res) => {
  try {
    const { mode, fullName, username, email, password, userId, reason } = req.body;

    if (mode === 'promote') {
      let targetUser = null;
      if (userId) {
        targetUser = await User.findById(userId);
      } else if (email) {
        targetUser = await User.findOne({ email: email.toLowerCase().trim() });
      }

      if (!targetUser) {
        return res.status(404).json({ success: false, message: 'User to promote not found' });
      }

      if (targetUser.role === 'admin') {
        return res.status(409).json({ success: false, message: 'User is already an administrator' });
      }

      await User.updateOne({ _id: targetUser._id }, { $set: { role: 'admin' } });
      targetUser.role = 'admin'; // update locally for response

      await AdminAction.create({
        admin: req.user ? req.user._id : targetUser._id,
        action: 'promoted_admin',
        targetUser: targetUser._id,
        details: `Promoted existing user @${targetUser.username} (${targetUser.email}) to admin. ${reason ? `Reason: ${reason}` : ''}`,
      });

      return res.status(200).json({
        success: true,
        message: `Successfully promoted @${targetUser.username} to administrator`,
        admin: {
          _id: targetUser._id,
          fullName: targetUser.fullName,
          username: targetUser.username,
          email: targetUser.email,
          role: targetUser.role,
          avatarUrl: targetUser.avatarUrl,
          createdAt: targetUser.createdAt,
        },
      });
    }

    // Default: Mode is 'create' new account
    if (!fullName || !username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Full name, username, email, and password are required',
      });
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanUsername = username.toLowerCase().trim();

    if (!EMAIL_REGEX.test(cleanEmail)) {
      return res.status(400).json({ success: false, message: 'Invalid email format' });
    }

    if (!USERNAME_REGEX.test(cleanUsername)) {
      return res.status(400).json({ success: false, message: 'Username must be 3-30 characters (letters, numbers, _)' });
    }

    const passwordCheck = validatePassword(password);
    if (!passwordCheck.isValid) {
      return res.status(400).json({ success: false, message: passwordCheck.message });
    }

    // Check if email already registered
    const existingEmail = await User.findOne({ email: cleanEmail });
    if (existingEmail) {
      return res.status(409).json({
        success: false,
        message: `Email "${cleanEmail}" is already registered. You can promote this existing user instead.`,
      });
    }

    // Check if username taken
    const existingUsername = await User.findOne({ username: cleanUsername });
    if (existingUsername) {
      return res.status(409).json({
        success: false,
        message: `Username "@${cleanUsername}" is already taken. Please choose another username.`,
      });
    }

    const newAdmin = await User.create({
      fullName: fullName.trim(),
      username: cleanUsername,
      email: cleanEmail,
      password,
      role: 'admin',
      mustChangePassword: true,
    });

    await AdminAction.create({
      admin: req.user ? req.user._id : newAdmin._id,
      action: 'created_admin',
      targetUser: newAdmin._id,
      details: `Created new admin account @${newAdmin.username} (${newAdmin.email}). ${reason ? `Reason: ${reason}` : ''}`,
    });

    res.status(201).json({
      success: true,
      message: `Administrator account created for @${newAdmin.username}`,
      admin: {
        _id: newAdmin._id,
        fullName: newAdmin.fullName,
        username: newAdmin.username,
        email: newAdmin.email,
        role: newAdmin.role,
        avatarUrl: newAdmin.avatarUrl,
        createdAt: newAdmin.createdAt,
        mustChangePassword: newAdmin.mustChangePassword,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error creating or promoting administrator',
    });
  }
};

// @desc    Demote an admin back to regular student user
// @route   PATCH /api/admin/admins/:id/demote
exports.demoteAdmin = async (req, res) => {
  try {
    const targetId = req.params.id;

    // Safety Rule 1: Cannot demote yourself
    if (req.user._id.toString() === targetId) {
      return res.status(400).json({
        success: false,
        message: 'Security protection: You cannot demote your own admin account',
      });
    }

    // Safety Rule 2: Cannot demote the last remaining admin
    const totalAdmins = await User.countDocuments({ role: 'admin' });
    if (totalAdmins <= 1) {
      return res.status(400).json({
        success: false,
        message: 'System protection: Cannot demote the last remaining administrator on the platform',
      });
    }

    const targetUser = await User.findById(targetId);
    if (!targetUser || targetUser.role !== 'admin') {
      return res.status(404).json({
        success: false,
        message: 'Administrator account not found',
      });
    }

    targetUser.role = 'student';
    await targetUser.save();

    await AdminAction.create({
      admin: req.user._id,
      action: 'demoted_admin',
      targetUser: targetUser._id,
      details: `Demoted @${targetUser.username} (${targetUser.email}) from admin to student`,
    });

    res.status(200).json({
      success: true,
      message: `Successfully demoted @${targetUser.username} to standard user role`,
      user: {
        _id: targetUser._id,
        fullName: targetUser.fullName,
        username: targetUser.username,
        role: targetUser.role,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error demoting administrator',
    });
  }
};

// @desc    Search non-admin users for promotion
// @route   GET /api/admin/users/search?q=
exports.searchUsersForPromotion = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 2) {
      return res.status(200).json({ success: true, users: [] });
    }

    const escaped = escapeRegex(q.trim());
    const regex = new RegExp(escaped, 'i');

    const users = await User.find({
      role: { $ne: 'admin' },
      $or: [{ fullName: regex }, { username: regex }, { email: regex }],
    })
      .select('fullName username email avatar role')
      .limit(10);

    res.status(200).json({ success: true, users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Error searching users' });
  }
};

// @desc    Get audit trail of admin actions
// @route   GET /api/admin/actions
exports.getAdminActions = async (req, res) => {
  try {
    const actions = await AdminAction.find()
      .populate('admin', 'fullName username email')
      .populate('targetUser', 'fullName username email')
      .sort({ createdAt: -1 })
      .limit(20);

    res.status(200).json({ success: true, actions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Error loading admin actions' });
  }
};

// @desc    Get comprehensive command center dashboard data
// @route   GET /api/admin/command-center
exports.getCommandCenter = async (req, res) => {
  try {
    const Project = require('../models/Project');
    const Opportunity = require('../models/Opportunity');
    const Post = require('../models/Post');
    const Event = require('../models/Event');
    const Community = require('../models/Community');

    // System Status
    const systemStatus = {
      api: 'Operational',
      database: mongoose.connection.readyState === 1 ? 'Connected' : 'Error',
      timestamp: new Date().toISOString()
    };
    const Report = require('../models/Report');

    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      dau,
      wau,
      mau,
      totalProjects,
      totalOpportunities,
      totalPosts,
      totalEvents,
      totalCommunities,
      usersByRole,
      pendingReports,
      recentUsers,
      recentProjects,
      recentOpportunities,
      recentPosts
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ lastActiveAt: { $gte: oneDayAgo } }),
      User.countDocuments({ lastActiveAt: { $gte: sevenDaysAgo } }),
      User.countDocuments({ lastActiveAt: { $gte: thirtyDaysAgo } }),
      Project.countDocuments(),
      Opportunity.countDocuments(),
      Post.countDocuments(),
      Event.countDocuments(),
      Community.countDocuments(),
      User.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }]),
      Report.find({ status: 'pending' }).select('targetType reason createdAt').sort({ createdAt: -1 }).limit(5),
      User.find().select('fullName username role createdAt').sort({ createdAt: -1 }).limit(5),
      Project.find().select('title creator createdAt').populate('creator', 'username').sort({ createdAt: -1 }).limit(5),
      Opportunity.find().select('title company type createdAt').sort({ createdAt: -1 }).limit(5),
      Post.find().select('content author createdAt').populate('author', 'username').sort({ createdAt: -1 }).limit(5)
    ]);

    // Live Activity Feed
    let activityFeed = [];
    
    recentUsers.forEach(u => activityFeed.push({
      id: u._id, type: 'user', title: `@${u.username} joined INNOFIX`, timestamp: u.createdAt, status: 'success'
    }));
    recentProjects.forEach(p => activityFeed.push({
      id: p._id, type: 'project', title: `${p.title} created by @${p.creator?.username || 'user'}`, timestamp: p.createdAt, status: 'info'
    }));
    recentOpportunities.forEach(o => activityFeed.push({
      id: o._id, type: 'opportunity', title: `${o.title} published (${o.type})`, timestamp: o.createdAt, status: 'warning'
    }));
    recentPosts.forEach(p => activityFeed.push({
      id: p._id, type: 'post', title: `New post by @${p.author?.username || 'user'}`, timestamp: p.createdAt, status: 'neutral'
    }));

    // Sort descending by timestamp and take top 10
    activityFeed.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    activityFeed = activityFeed.slice(0, 10);

    // Format User Intelligence
    const userIntelligence = {
      total: totalUsers,
      activeUsers: {
        dau,
        wau,
        mau
      },
      roles: {
        student: 0,
        company: 0,
        admin: 0
      }
    };
    usersByRole.forEach(r => {
      if (r._id === 'student') userIntelligence.roles.student = r.count;
      if (r._id === 'company') userIntelligence.roles.company = r.count;
      if (r._id === 'admin') userIntelligence.roles.admin = r.count;
    });

    const priorityAlerts = pendingReports.map(r => ({
      id: r._id,
      type: 'report',
      message: `Pending ${r.reason} report on ${r.targetType}`,
      timestamp: r.createdAt
    }));

    res.status(200).json({
      success: true,
      systemStatus,
      platformPulse: {
        totalUsers,
        totalProjects,
        totalOpportunities,
        totalPosts,
        totalEvents,
        totalCommunities
      },
      userIntelligence,
      priorityAlerts,
      activityFeed
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Error fetching command center data' });
  }
};

// @desc    Export users list to CSV
// @route   GET /api/admin/export/users
// @access  Admin
exports.exportUsersCSV = async (req, res) => {
  try {
    const users = await User.find().select('fullName username email role reputation weeklyPoints monthlyPoints createdAt lastActiveAt lastLogin').lean();
    
    let csv = 'ID,Full Name,Username,Email,Role,Reputation,Weekly Points,Monthly Points,Created At,Last Active At,Last Login\n';
    users.forEach(u => {
      csv += `${u._id},"${(u.fullName || '').replace(/"/g, '""')}","${u.username}","${u.email}",${u.role},${u.reputation || 0},${u.weeklyPoints || 0},${u.monthlyPoints || 0},${u.createdAt ? u.createdAt.toISOString() : ''},${u.lastActiveAt ? u.lastActiveAt.toISOString() : ''},${u.lastLogin ? u.lastLogin.toISOString() : ''}\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=users_export.csv');
    res.status(200).send(csv);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Error exporting CSV' });
  }
};

// Users Management Handlers
exports.getUsersList = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const users = await User.find()
      .select('fullName username email role status reputation createdAt followers')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);
    const total = await User.countDocuments();
    res.json({ success: true, users, total, pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    await User.findByIdAndUpdate(req.params.id, { role });
    res.json({ success: true, message: 'Role updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateUserStatus = async (req, res) => {
  try {
    const { status, reason } = req.body;
    await User.findByIdAndUpdate(req.params.id, { status });
    await AdminAction.create({
      admin: req.user._id,
      action: 'suspend_user',
      targetUser: req.params.id,
      details: `Changed status to ${status}. Reason: ${reason}`
    });
    res.json({ success: true, message: 'Status updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.verifyCompany = async (req, res) => {
  try {
    const { verified, reason } = req.body;
    // Assuming verification modifies status or a verified field
    await User.findByIdAndUpdate(req.params.id, { status: verified ? 'verified' : 'active' });
    await AdminAction.create({
      admin: req.user._id,
      action: 'verify_company',
      targetUser: req.params.id,
      details: `Verified account. Reason: ${reason}`
    });
    res.json({ success: true, message: 'Verified' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Reports Handlers
const Report = require('../models/Report');

exports.getReports = async (req, res) => {
  try {
    const { status = 'pending', limit = 50 } = req.query;
    const reports = await Report.find({ status })
      .populate('reporter', 'username')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));
    const total = await Report.countDocuments({ status });
    res.json({ success: true, reports, total });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.resolveReport = async (req, res) => {
  try {
    const { resolutionNotes } = req.body;
    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ success: false, message: 'Report not found' });
    report.status = 'resolved';
    report.resolutionNotes = resolutionNotes;
    report.resolvedBy = req.user._id;
    await report.save();
    await AdminAction.create({
      admin: req.user._id,
      action: 'resolve_report',
      details: `Resolved report for ${report.targetType} (${report.targetId}). Reason: ${resolutionNotes}`
    });
    res.json({ success: true, message: 'Resolved' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.dismissReport = async (req, res) => {
  try {
    const { resolutionNotes } = req.body;
    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ success: false, message: 'Report not found' });
    report.status = 'dismissed';
    report.resolutionNotes = resolutionNotes;
    report.resolvedBy = req.user._id;
    await report.save();
    await AdminAction.create({
      admin: req.user._id,
      action: 'dismiss_report',
      details: `Dismissed report for ${report.targetType} (${report.targetId}). Reason: ${resolutionNotes}`
    });
    res.json({ success: true, message: 'Dismissed' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// System Handlers
exports.getSystemHealth = async (req, res) => {
  try {
    const os = require('os');
    res.json({
      success: true,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      loadAvg: os.loadavg()
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
