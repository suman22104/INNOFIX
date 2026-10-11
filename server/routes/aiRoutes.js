const express = require('express');
const router = express.Router();
const {
  getRecommendations,
  getPeopleYouMayKnow,
  getOpportunityMatches,
  getSimilar,
  trackClick,
  improveBio,
  rewritePitch,
  summarizeThread,
  analyzeTeamFit,
  getModerationQueue,
  reviewModerationItem,
} = require('../controllers/aiController');
const { protect, authorize } = require('../middleware/auth');

// Public
router.get('/similar/:type/:id', getSimilar);

// Protected
router.get('/recommendations', protect, getRecommendations);
router.get('/people-you-may-know', protect, getPeopleYouMayKnow);
router.get('/match/opportunities', protect, getOpportunityMatches);
router.post('/track', protect, trackClick);

// AI Assistant endpoints
router.post('/assistant/improve-bio', protect, improveBio);
router.post('/assistant/rewrite-pitch', protect, rewritePitch);
router.post('/assistant/summarize-thread', protect, summarizeThread);
router.post('/assistant/team-fit', protect, analyzeTeamFit);

// Admin Moderation Queue
router.get('/moderation/queue', protect, authorize('admin'), getModerationQueue);
router.put('/moderation/:id', protect, authorize('admin'), reviewModerationItem);

module.exports = router;
