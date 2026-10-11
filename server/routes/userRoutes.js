const express = require('express');
const router = express.Router();
const {
  followUser,
  unfollowUser,
  getUserFollowers,
  getUserFollowing,
  getUserProfile,
  toggleBookmark,
  getBookmarks,
  getLeaderboard,
  exportUserData,
  deleteAccount,
} = require('../controllers/userController');
const { protect } = require('../middleware/auth');

// Public routes
router.get('/leaderboard', getLeaderboard);
router.get('/profile/:usernameOrId', getUserProfile);
router.get('/:id/followers', getUserFollowers);
router.get('/:id/following', getUserFollowing);

// Protected routes
router.post('/:id/follow', protect, followUser);
router.post('/:id/unfollow', protect, unfollowUser);
router.post('/bookmarks/toggle', protect, toggleBookmark);
router.get('/bookmarks/all', protect, getBookmarks);
router.get('/account/export-data', protect, exportUserData);
router.delete('/account', protect, deleteAccount);

module.exports = router;
