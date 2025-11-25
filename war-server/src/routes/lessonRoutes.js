const express = require('express');
const router = express.Router();
const lessonController = require('../controllers/lessonController');
const { auth, adminAuth } = require('../middleware/auth');

// Public routes (no auth required)
router.get('/', lessonController.getLessons);
router.get('/:id', lessonController.getLessonById);

// Get lesson thumbnail by lesson ID (public)
router.get('/:id/thumbnail', lessonController.getLessonThumbnail);

// Get author avatar by author ID (public)
router.get('/authors/:authorId/avatar', lessonController.getAuthorAvatar);

// Admin routes
router.post('/', auth, adminAuth, lessonController.createLesson);
router.put('/:id', auth, adminAuth, lessonController.updateLesson);
router.delete('/:id', auth, adminAuth, lessonController.deleteLesson);

module.exports = router;
