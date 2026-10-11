const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { awardProfileDetails } = require('../services/reputationService');


// Generate JWT token (fail-fast if JWT_SECRET is missing)
const generateToken = (id) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('FATAL: JWT_SECRET environment variable is not configured');
  }
  return jwt.sign({ id }, secret, {
    expiresIn: process.env.JWT_EXPIRE || '30d',
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const {
      fullName,
      username,
      email,
      password,
      role,
      companyName,
      companyWebsite,
      industry,
      skills,
      companyNeeds,
      headline,
    } = req.body;

    if (!password || password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long for account security',
      });
    }

    // Check if user already exists
    const userExists = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { username: username.toLowerCase() }],
    });

    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'Username or email already in use',
      });
    }

    const adminCount = await User.countDocuments({ role: 'admin' });
    let finalRole = ['student', 'company'].includes(role) ? role : 'student';
    if (adminCount === 0) {
      finalRole = 'admin';
    }

    const userData = {
      fullName: fullName.trim(),
      username: username.trim().toLowerCase(),
      email: email.trim().toLowerCase(),
      password,
      role: finalRole,
      headline: headline || '',
      skills: Array.isArray(skills) ? skills : typeof skills === 'string' ? skills.split(',').map((s) => s.trim()).filter(Boolean) : [],
      companyNeeds: Array.isArray(companyNeeds) ? companyNeeds : typeof companyNeeds === 'string' ? companyNeeds.split(',').map((s) => s.trim()).filter(Boolean) : [],
      reputation: 0,
      badges: [
        {
          id: 'early_adopter',
          name: 'Early Adopter',
          icon: '🚀',
          description: 'Joined during the platform launch cohort',
          awardedAt: new Date(),
        },
      ],
    };

    if (role === 'company') {
      userData.companyName = companyName || fullName;
      userData.companyWebsite = companyWebsite || '';
      userData.industry = industry || '';
    }

    const user = await User.create(userData);
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        username: user.username,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        avatarUrl: user.avatarUrl,
        headline: user.headline,
        bio: user.bio,
        skills: user.skills,
        companyNeeds: user.companyNeeds,
        companyName: user.companyName,
        reputation: user.reputation,
        badges: user.badges,
        followersCount: 0,
        followingCount: 0,
        followers: [],
        following: [],
      },
    });

    // Handle welcome points and notification asynchronously
    try {
      const { award } = require('../services/reputationService');
      await award(user._id, 'signup_welcome_bonus', null, 'system');
      await awardProfileDetails(user._id); // signup: profile details filled in at registration
      
      const updateRes = await User.updateOne(
        { _id: user._id, welcomeSentAt: null },
        { $set: { welcomeSentAt: new Date() } }
      );
      
      if (updateRes.modifiedCount === 1) {
        const { createNotification } = require('./notificationController');
        if (req.app) {
          await createNotification(req.app, {
            recipient: user._id,
            type: 'welcome',
            title: 'Welcome to INNOFIX 🎉',
            message: 'You start with 60 points. Earn more by posting, joining projects and attending events. Tap to see exactly how points work.',
            link: '/leaderboard?rules=1',
          });
        }
      }
    } catch (e) {
      console.error('Error sending welcome points:', e);
    }

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error during registration',
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { usernameOrEmail, password } = req.body;

    if (!usernameOrEmail || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email/username and password',
      });
    }

    const user = await User.findOne({
      $or: [
        { email: usernameOrEmail.toLowerCase().trim() },
        { username: usernameOrEmail.toLowerCase().trim() },
      ],
    }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    await User.updateOne({ _id: user._id }, { $set: { lastLogin: new Date() } });

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        username: user.username,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        avatarUrl: user.avatarUrl,
        headline: user.headline,
        bio: user.bio,
        skills: user.skills,
        companyNeeds: user.companyNeeds,
        companyName: user.companyName,
        reputation: user.reputation,
        badges: user.badges || [],
        followersCount: user.followers?.length || 0,
        followingCount: user.following?.length || 0,
        followers: user.followers || [],
        following: user.following || [],
        mustChangePassword: user.mustChangePassword,
      },
    });

    // Handle welcome notification for existing users signing in (async)
    try {
      const updateRes = await User.updateOne(
        { _id: user._id, welcomeSentAt: null },
        { $set: { welcomeSentAt: new Date() } }
      );
      
      if (updateRes.modifiedCount === 1 && req.app) {
        const { createNotification } = require('./notificationController');
        await createNotification(req.app, {
          recipient: user._id,
          type: 'welcome',
          title: 'Welcome to INNOFIX 🎉',
          message: 'You start with 60 points. Earn more by posting, joining projects and attending events. Tap to see exactly how points work.',
          link: '/leaderboard?rules=1',
        });
      }
    } catch (e) {
      console.error('Error sending welcome notification on login:', e);
    }

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error during login',
    });
  }
};

// @desc    Admin login
// @route   POST /api/auth/admin-login
// @access  Public
exports.adminLogin = async (req, res) => {
  try {
    const { usernameOrEmail, password } = req.body;

    if (!usernameOrEmail || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email/username and password',
      });
    }

    const user = await User.findOne({
      $or: [
        { email: usernameOrEmail.toLowerCase().trim() },
        { username: usernameOrEmail.toLowerCase().trim() },
      ],
    }).select('+password');

    // Reject non-existent users OR non-admins
    if (!user || user.role !== 'admin') {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    await User.updateOne({ _id: user._id }, { $set: { lastLogin: new Date() } });

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        username: user.username,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        avatarUrl: user.avatarUrl,
        headline: user.headline,
        mustChangePassword: user.mustChangePassword,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error during admin login',
    });
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('followers', 'fullName username avatar role headline')
      .populate('following', 'fullName username avatar role headline');

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error retrieving current user profile',
    });
  }
};

// @desc    Update user profile & privacy settings
// @route   PUT /api/auth/profile
exports.updateProfile = async (req, res) => {
  try {
    let skills = req.body.skills;
    if (typeof skills === 'string') {
      skills = skills.split(',').map((s) => s.trim()).filter(Boolean);
    }

    let companyNeeds = req.body.companyNeeds;
    if (typeof companyNeeds === 'string') {
      companyNeeds = companyNeeds.split(',').map((s) => s.trim()).filter(Boolean);
    }

    const fieldsToUpdate = {
      fullName: req.body.fullName,
      headline: req.body.headline,
      bio: req.body.bio,
      location: req.body.location,
      skills,
      companyNeeds,
      github: req.body.github,
      linkedin: req.body.linkedin,
      twitter: req.body.twitter,
      website: req.body.website,
      companyName: req.body.companyName,
      companyWebsite: req.body.companyWebsite,
      industry: req.body.industry,
      privacy: req.body.privacy,
    };

    Object.keys(fieldsToUpdate).forEach(
      (key) => fieldsToUpdate[key] === undefined && delete fieldsToUpdate[key]
    );

    const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
      new: true,
      runValidators: true,
    });

    // Profile detail points (headline, about, location, skills = 15 each, awarded once)
    await awardProfileDetails(user._id);
    const refreshedRep = await User.findById(user._id).select('reputation');
    if (refreshedRep) user.reputation = refreshedRep.reputation;

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating profile',
    });
  }
};

// @desc    Upload avatar / cover image
// @route   POST /api/auth/upload-avatar
// @access  Private
exports.uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded',
      });
    }

    const type = req.body.type || 'avatar';
    const updateData = {};
    if (type === 'cover') {
      updateData.coverImage = req.file.filename;
    } else {
      updateData.avatar = req.file.filename;
    }

    const user = await User.findByIdAndUpdate(req.user.id, updateData, {
      new: true,
    });

    res.status(200).json({
      success: true,
      message: `${type === 'cover' ? 'Cover image' : 'Avatar'} uploaded successfully`,
      filename: req.file.filename,
      user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error uploading file',
    });
  }
};

// @desc    Admin login
// @route   POST /api/auth/admin-login
// @access  Public
exports.adminLogin = async (req, res) => {
  try {
    const { usernameOrEmail, password } = req.body;
    if (!usernameOrEmail || !password) {
      return res.status(400).json({ success: false, message: 'Please provide admin username/email and password' });
    }

    const id = String(usernameOrEmail).toLowerCase().trim();
    const user = await User.findOne({ $or: [{ email: id }, { username: id }] }).select('+password');

    if (!user || !(await user.matchPassword(String(password)))) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    if (user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'This account does not have admin access' });
    }

    await User.updateOne({ _id: user._id }, { $set: { lastLogin: new Date() } });

    res.status(200).json({
      success: true,
      token: generateToken(user._id),
      user: {
        id: user._id,
        fullName: user.fullName,
        username: user.username,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        avatarUrl: user.avatarUrl,
        headline: user.headline,
        bio: user.bio,
        companyName: user.companyName,
        reputation: user.reputation,
        badges: user.badges || [],
        mustChangePassword: user.mustChangePassword,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Server error during admin login' });
  }
};

// @desc    Change password
// @route   POST /api/auth/change-password
// @access  Private
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Current and new password are required' });
    }

    const user = await User.findById(req.user.id).select('+password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid current password' });
    }

    const passwordCheck = validatePassword(newPassword);
    if (!passwordCheck.isValid) {
      return res.status(400).json({ success: false, message: passwordCheck.message });
    }

    user.password = newPassword;
    user.mustChangePassword = false;
    await user.save();

    res.status(200).json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Error updating password' });
  }
};
