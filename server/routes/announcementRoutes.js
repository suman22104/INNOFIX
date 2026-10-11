const express = require('express');
const router = express.Router();
const {
  getAnnouncements,
  createAnnouncement,
  togglePin,
  deleteAnnouncement,
} = require('../controllers/announcementController');
const { protect } = require('../middleware/auth');

router.route('/').get(getAnnouncements).post(protect, createAnnouncement);
router.put('/:id/pin', protect, togglePin);
router.delete('/:id', protect, deleteAnnouncement);

module.exports = router;
