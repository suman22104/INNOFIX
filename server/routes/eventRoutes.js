const express = require('express');
const router = express.Router();
const {
  getEvents,
  getEventById,
  createEvent,
  toggleRegisterEvent,
  deleteEvent,
} = require('../controllers/eventController');
const { protect } = require('../middleware/auth');

router.route('/').get(getEvents).post(protect, createEvent);
router.route('/:id').get(getEventById).delete(protect, deleteEvent);
router.post('/:id/register', protect, toggleRegisterEvent);

module.exports = router;
