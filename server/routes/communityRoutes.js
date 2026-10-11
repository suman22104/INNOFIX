const express = require('express');
const router = express.Router();
const {
  getCommunities,
  getCommunity,
  createCommunity,
  joinCommunity,
  leaveCommunity,
} = require('../controllers/communityController');
const { protect, authorize } = require('../middleware/auth');

router.route('/').get(getCommunities).post(protect, authorize('admin', 'company'), createCommunity);
router.route('/:idOrSlug').get(getCommunity);
router.post('/:id/join', protect, joinCommunity);
router.post('/:id/leave', protect, leaveCommunity);

module.exports = router;
