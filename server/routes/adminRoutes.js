const express = require('express');
const router = express.Router();
const User = require('../models/User');
const {
  getOverview,
  getLogs,
  getUserActivity,
  getTopItems,
  getAdmins,
  createOrPromoteAdmin,
  demoteAdmin,
  searchUsersForPromotion,
  getAdminActions,
  getCommandCenter,
  exportUsersCSV,
  
  // New Handlers
  getUsersList,
  updateUserRole,
  updateUserStatus,
  verifyCompany,
  getReports,
  resolveReport,
  dismissReport,
  getSystemHealth
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

// Custom middleware to handle first admin creation
const adminOrFirstAdmin = async (req, res, next) => {
  if (req.method === 'POST' && req.path === '/admins') {
    try {
      const count = await User.countDocuments({ role: 'admin' });
      if (count === 0 && (!req.body.mode || req.body.mode === 'create')) {
        return next();
      }
    } catch (error) {
      console.error('Error checking admin count:', error);
    }
    
    // Manual token verification to return the exact custom error message requested
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    
    if (!token) {
      return res.status(401).json({ success: false, message: 'An admin already exists. Log in as an admin and send a Bearer token, or use `npm run create-admin`.' });
    }
    
    try {
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);
      if (!user || user.role !== 'admin') {
         return res.status(401).json({ success: false, message: 'An admin already exists. Log in as an admin and send a Bearer token, or use `npm run create-admin`.' });
      }
      req.user = user;
      return next();
    } catch (err) {
      return res.status(401).json({ success: false, message: 'An admin already exists. Log in as an admin and send a Bearer token, or use `npm run create-admin`.' });
    }
  }

  // Fallback to standard protect and authorize
  protect(req, res, (err) => {
    if (err) return next(err);
    authorize('admin')(req, res, next);
  });
};

router.use(adminOrFirstAdmin);

// AI Recommendation Analytics
router.get('/ai/overview', getOverview);
router.get('/ai/logs', getLogs);
router.get('/ai/users', getUserActivity);
router.get('/ai/top-items', getTopItems);

// Command Center & System
router.get('/command-center', getCommandCenter);
router.get('/system', getSystemHealth);

// Users Management
router.get('/users', getUsersList);
router.patch('/users/:id/role', updateUserRole);
router.patch('/users/:id/status', updateUserStatus);
router.patch('/users/:id/verify', verifyCompany);
router.get('/users/search', searchUsersForPromotion);

// Reports Management
router.get('/reports', getReports);
router.patch('/reports/:id/resolve', resolveReport);
router.patch('/reports/:id/dismiss', dismissReport);

// Admin Management & Audit
router.get('/admins', getAdmins);
router.post('/admins', createOrPromoteAdmin);
router.patch('/admins/:id/demote', demoteAdmin);
router.get('/actions', getAdminActions);
router.get('/export/users', exportUsersCSV);

module.exports = router;
