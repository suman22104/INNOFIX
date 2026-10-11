const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route, token missing',
    });
  }

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    console.error('FATAL: JWT_SECRET environment variable is missing.');
    return res.status(500).json({
      success: false,
      message: 'Server configuration error: JWT_SECRET missing',
    });
  }

  try {
    const decoded = jwt.verify(token, jwtSecret);
    req.user = await User.findById(decoded.id).select('-password');
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'The user belonging to this token no longer exists',
      });
    }

    // --- GHOST MODE FOR ADMINS ---
    if (req.user.role === 'admin' && req.method !== 'GET') {
      const allowedAdminPaths = ['/api/admin', '/api/reports', '/api/auth/admin-login', '/api/auth/logout', '/api/auth/profile', '/api/auth/upload-avatar'];
      const isAllowed = allowedAdminPaths.some(path => req.originalUrl.startsWith(path));
      
      if (!isAllowed) {
        return res.status(403).json({
          success: false,
          message: 'Ghost Mode: Admins cannot interact with user content (like, comment, post, follow, etc.)',
        });
      }
    }
    // ----------------------------

    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired authentication token',
    });
  }
};

// Grant access to specific roles
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role '${req.user ? req.user.role : 'unauthenticated'}' is not authorized to access this route`,
      });
    }
    next();
  };
};

module.exports = { protect, authorize };
