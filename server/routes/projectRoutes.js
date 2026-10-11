const express = require('express');
const router = express.Router();
const {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  applyToProject,
  manageApplication,
  addComment,
} = require('../controllers/projectController');
const { protect } = require('../middleware/auth');

router.route('/').get(getProjects).post(protect, createProject);
router
  .route('/:id')
  .get(getProjectById)
  .put(protect, updateProject)
  .delete(protect, deleteProject);
router.post('/:id/apply', protect, applyToProject);
router.put('/:id/applications/:appId', protect, manageApplication);
router.post('/:id/comments', protect, addComment);

module.exports = router;
