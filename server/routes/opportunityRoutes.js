const express = require('express');
const router = express.Router();
const {
  getOpportunities,
  getOpportunityById,
  createOpportunity,
  applyOpportunity,
  deleteOpportunity,
} = require('../controllers/opportunityController');
const { protect, authorize } = require('../middleware/auth');

router.route('/').get(getOpportunities).post(protect, authorize('admin', 'comapany'), createOpportunity);
router.route('/:id').get(getOpportunityById).delete(protect, deleteOpportunity);
router.post('/:id/apply', protect, applyOpportunity);

module.exports = router;
