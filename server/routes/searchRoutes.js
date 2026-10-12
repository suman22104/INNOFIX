const express = require('express');
const router = express.Router();
const { globalSearch } = require('../controllers/searchController');
const { protect } = require('../middleware/auth');

// Search is available only to signed-in users (student, company and admin).
router.get('/', protect, globalSearch);

module.exports = router;
