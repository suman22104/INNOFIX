const express = require('express');
const router = express.Router();
const {
  getPosts,
  createPost,
  updatePost,
  toggleLikePost,
  addComment,
  deletePost,
} = require('../controllers/postController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Optional auth helper to populate req.user on public feed if token exists
const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer')) {
    const token = authHeader.split(' ')[1];
    try {
      const jwt = require('jsonwebtoken');
      const User = require('../models/User');
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');
    } catch (e) {}
  }
  next();
};

router.get('/', optionalAuth, getPosts);
router.post('/', protect, upload.single('image'), createPost);
router.put('/:id', protect, updatePost);
router.post('/:id/like', protect, toggleLikePost);
router.post('/:id/comments', protect, addComment);
router.delete('/:id', protect, deletePost);

module.exports = router;
